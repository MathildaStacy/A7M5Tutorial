import type {AiService, Part, Protocol, RawOutput, StoredMessage, Usage} from './types';
import {contentText, normalizeResponseItem} from './messageText';
import {evidenceOf} from './evidence';
import definitions from '../../docs/spec/camera-tools.json';
export function endpointOf(
  protocol: Protocol,
  baseUrl: string,
  kind: 'generate' | 'models' = 'generate',
): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, '');
  const m = /^(https?:\/\/[A-Za-z0-9.-]+(?::\d+)?)(\/[^\s]*)?$/i.exec(trimmed);
  if (!m) {
    throw new Error('Base URL 要以 http:// 或 https:// 开头，例如 https://api.anthropic.com');
  }
  const endpoint = protocol === 'openai' ? 'responses' : 'messages';
  const target = kind === 'generate' ? endpoint : 'models';
  let path = m[2] ?? '';
  path = path.replace(/\/(?:chat\/completions|responses|messages|models)$/, '');
  if (!/\/v\d+$/.test(path)) {
    path += '/v1';
  }
  return m[1] + path + '/' + target;
}

export type Stop = 'end' | 'tool' | 'pause' | 'max_tokens' | 'refusal' | 'other';

export interface ParsedResponse {
  parts: Part[];
  raw: RawOutput;
  usage: Usage;
  stop: Stop;
  /** 服务返回的模型名（测试连接时显示）。 */
  model: string | null;
  thinking?: string;
  category?: string;
}

const count = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0);

const has = (o: any, k: string) => o != null && o[k] != null;

export class ProtocolError extends Error {}

export function parseResponse(protocol: Protocol, model: string, json: any): ParsedResponse {
  if (json == null || typeof json !== 'object') {
    throw new ProtocolError('响应不是 JSON 对象');
  }
  const parsed = protocol === 'anthropic' ? parseAnthropic(model, json) : parseOpenai(model, json);
  return {...parsed, ...evidenceOf(protocol, json)};
}
function parseAnthropic(model: string, json: any): ParsedResponse {
  if (!Array.isArray(json.content)) {
    throw new ProtocolError('响应里没有 content（不是 Anthropic Messages 格式）');
  }
  const parts: Part[] = [];
  for (const b of json.content) {
    if (b?.type === 'text' && typeof b.text === 'string') {
      parts.push({t: 'text', text: b.text});
    } else if (b?.type === 'tool_use') {
      parts.push({
        t: 'call',
        id: String(b.id),
        name: String(b.name),
        args: JSON.stringify(b.input ?? {}),
      });
    }
  }
  const u = json.usage ?? {};
  const stop: Stop =
    json.stop_reason === 'tool_use'
      ? 'tool'
      : json.stop_reason === 'pause_turn'
      ? 'pause'
      : json.stop_reason === 'max_tokens'
      ? 'max_tokens'
      : json.stop_reason === 'refusal'
      ? 'refusal'
      : json.stop_reason === 'end_turn' || json.stop_reason === 'stop_sequence'
      ? 'end'
      : parts.some((p) => p.t === 'call')
      ? 'tool'
      : 'other';
  return {
    parts,
    raw: {protocol: 'anthropic', model, items: json.content},
    category: json.stop_details?.category,
    usage: {
      input: count(u.input_tokens),
      cacheRead: count(u.cache_read_input_tokens),
      cacheWrite: count(u.cache_creation_input_tokens),
      output: count(u.output_tokens),
      cacheReported: has(u, 'cache_read_input_tokens') || has(u, 'cache_creation_input_tokens'),
    },
    stop,
    model: typeof json.model === 'string' ? json.model : null,
  };
}

function parseOpenai(model: string, json: any): ParsedResponse {
  if (!Array.isArray(json.output) && typeof json.output_text !== 'string') {
    throw new ProtocolError('响应里没有 output（不是 OpenAI Responses 格式）');
  }
  const output = (Array.isArray(json.output) ? json.output : []).map(normalizeResponseItem);
  if (
    typeof json.output_text === 'string' &&
    json.output_text.trim() &&
    !output.some((item: any) => item?.type === 'message' && contentText(item.content).trim())
  ) {
    output.push({
      type: 'message',
      role: 'assistant',
      content: [{type: 'output_text', text: json.output_text}],
    });
  }
  const parts: Part[] = [];
  for (const item of output) {
    if (item?.type === 'message') {
      const text = contentText(item.content);
      if (text) parts.push({t: 'text', text});
    } else if (item?.type === 'function_call') {
      parts.push({
        t: 'call',
        id: String(item.call_id),
        name: String(item.name),
        args: typeof item.arguments === 'string' ? item.arguments : '{}',
      });
    }
  }
  const u = json.usage ?? {},
    d = u.input_tokens_details ?? {};
  const read = count(d.cached_tokens),
    write = count(d.cache_write_tokens ?? u.cache_write_tokens);
  const stop: Stop =
    json.status === 'incomplete'
      ? json.incomplete_details?.reason === 'content_filter'
        ? 'refusal'
        : 'max_tokens'
      : output.some((item: any) => item.content?.some?.((part: any) => part.type === 'refusal'))
      ? 'refusal'
      : parts.some((p) => p.t === 'call')
      ? 'tool'
      : 'end';
  return {
    parts,
    raw: {protocol: 'openai', model, items: output},
    usage: {
      input: Math.max(0, count(u.input_tokens) - read - write),
      cacheRead: read,
      cacheWrite: write,
      output: count(u.output_tokens),
      cacheReported: has(d, 'cached_tokens'),
    },
    stop,
    model: typeof json.model === 'string' ? json.model : null,
  };
}

/** 从错误响应里取出说明（两种协议和多数中转服务的格式）。 */
export function errorMessageOf(json: any, fallback: string): string {
  const e = json?.error;
  if (typeof e === 'string') {
    return e;
  }
  if (e && typeof e.message === 'string') {
    return e.message;
  }
  if (typeof json?.message === 'string') {
    return json.message;
  }
  if (typeof json?.detail === 'string') {
    return json.detail;
  }
  return fallback;
}

export interface BuiltRequest {
  url: string;
  body: Record<string, unknown>;
}
export const modelTools = definitions.tools;
export function headersOf(service: AiService, key: string): Record<string, string> {
  const h: Record<string, string> = {'Content-Type': 'application/json'};
  if (service.protocol === 'openai') {
    if (key) h.Authorization = 'Bearer ' + key;
    return h;
  }
  h['anthropic-version'] = '2023-06-01';
  if (key) h['x-api-key'] = key;
  const beta = [];
  if (!service.disabled.includes('display') && !service.disabled.includes('effort'))
    beta.push('thinking-display-updates-2026-08-18');
  if (!service.disabled.includes('fallbacks')) beta.push('server-side-fallback-2026-07-01');
  if (beta.length && !service.disabled.includes('beta')) h['anthropic-beta'] = beta.join(',');
  return h;
}
export interface RequestInput {
  service: AiService;
  system: string;
  history: StoredMessage[];
  stream?: boolean;
  readImage?: (ref: string) => Promise<string>;
  tools?: typeof modelTools;
}
export async function buildRequest({
  service: s,
  system,
  history,
  stream = false,
  readImage,
  tools = modelTools,
}: RequestInput): Promise<BuiltRequest> {
  const a = s.protocol === 'anthropic',
    enabled = (field: (typeof s.disabled)[number]) => !s.disabled.includes(field);
  const same = (m: StoredMessage) =>
    m.raw?.model === s.model &&
    m.raw.protocol === s.protocol &&
    (!m.raw.providerId || m.raw.providerId === s.id);
  const messages: any[] = [],
    images = new Map<string, string>();
  for (const m of history) {
    if (m.role === 'assistant' && same(m)) {
      if (a) messages.push({role: 'assistant', content: m.raw!.items});
      else messages.push(...m.raw!.items);
      continue;
    }
    const content: any[] = [];
    const ordered =
      m.role === 'user'
        ? [...m.parts.filter((p) => p.t === 'image'), ...m.parts.filter((p) => p.t !== 'image')]
        : m.parts;
    for (const p of ordered) {
      if (p.t === 'image') {
        if (!readImage) throw new Error('找不到本地照片');
        let data = images.get(p.ref);
        if (!data) {
          data = (await readImage(p.ref)).replace(/\s/g, '');
          images.set(p.ref, data);
        }
        content.push(
          a
            ? {type: 'image', source: {type: 'base64', media_type: p.mediaType, data}}
            : {type: 'input_image', image_url: 'data:' + p.mediaType + ';base64,' + data},
        );
      } else if (p.t === 'text')
        content.push({
          type: a ? 'text' : m.role === 'assistant' ? 'output_text' : 'input_text',
          text: p.text,
        });
      else if (p.t === 'result') {
        if (a)
          content.push({
            type: 'tool_result',
            tool_use_id: p.id,
            content: p.output,
            ...(p.isError ? {is_error: true} : {}),
          });
        else messages.push({type: 'function_call_output', call_id: p.id, output: p.output});
      } else if (a)
        content.push({type: 'tool_use', id: p.id, name: p.name, input: JSON.parse(p.args)});
      else messages.push({type: 'function_call', call_id: p.id, name: p.name, arguments: p.args});
    }
    if (content.length) messages.push({role: m.role === 'tool' ? 'user' : m.role, content});
  }
  const cache = enabled('cache') ? {cache_control: {type: 'ephemeral'}} : {};
  const strict = enabled('strict') ? {strict: true} : {};
  const beta = enabled('beta');
  const body = a
    ? {
        model: s.model,
        max_tokens: 8192,
        stream,
        system: [{type: 'text', text: system, ...cache}],
        messages,
        ...(tools.length
          ? {
              tools: tools.map((t, i) => ({
                name: t.name,
                description: t.description,
                input_schema: t.input_schema,
                ...strict,
                ...(i === tools.length - 1 ? cache : {}),
              })),
              tool_choice: {type: 'auto'},
            }
          : {}),
        ...(enabled('effort')
          ? {
              thinking: {
                type: 'adaptive',
                ...(beta && enabled('display') ? {display: 'updates'} : {}),
              },
              output_config: {effort: s.effort},
            }
          : {}),
        ...(beta && enabled('fallbacks') ? {fallbacks: 'default'} : {}),
      }
    : {
        model: s.model,
        store: false,
        stream,
        instructions: system,
        input: messages,
        max_output_tokens: 8192,
        ...(enabled('effort')
          ? {reasoning: {effort: s.effort}, include: ['reasoning.encrypted_content']}
          : {}),
        tools: tools.map((t) => ({
          type: 'function',
          name: t.name,
          description: t.description,
          parameters: t.input_schema,
          ...strict,
        })),
      };
  return {url: endpointOf(s.protocol, s.baseUrl), body};
}
