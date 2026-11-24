import {AiError, callModel, type FetchLike} from './http';
import {buildRequest, type RequestInput} from './protocol';
import type {AiService, Part, StoredMessage, Usage} from './types';

type Events = {
  signal?: AbortSignal;
  fetchImpl?: FetchLike;
  onText?: (s: string) => void;
  onProgress?: (p: {thinking?: string}) => void;
  onService?: (s: AiService) => void;
};
export async function requestModel(input: RequestInput, key: string, events: Events = {}) {
  let service = input.service;
  for (let attempt = 0; ; attempt++) {
    try {
      const req = await buildRequest({...input, service});
      const r = await callModel(service, key, req, events);
      return {...r, service};
    } catch (e) {
      if (attempt || !(e instanceof AiError) || !e.compat || service.disabled.includes(e.compat))
        throw e;
      service = {...service, disabled: [...service.disabled, e.compat]};
      events.onService?.(service);
    }
  }
}
export const MAX_TOOL_ROUNDS = 20;
type Call = Extract<Part, {t: 'call'}>;
export async function runAgent(
  input: RequestInput,
  key: string,
  execute: (call: Call) => Promise<unknown>,
  append: (m: StoredMessage) => void,
  events: Events = {},
) {
  const history = [...input.history],
    usage: Usage[] = [];
  let service = input.service,
    toolRounds = 0,
    pauses = 0;
  const add = (m: StoredMessage) => {
    history.push(m);
    append(m);
  };
  for (;;) {
    const response = await requestModel({...input, service, history, stream: true}, key, events);
    service = response.service;
    const {parsed} = response;
    usage.push(parsed.usage);
    add({role: 'assistant', parts: parsed.parts, raw: parsed.raw});
    const calls = parsed.parts.filter((p): p is Call => p.t === 'call');
    const executeRound =
      parsed.stop === 'tool' && toolRounds < MAX_TOOL_ROUNDS && !events.signal?.aborted;
    if (calls.length) {
      const results = await Promise.all(
        calls.map(async (call): Promise<Part> => {
          try {
            if (!executeRound) throw new Error('此轮已停止');
            const result = await execute(call);
            return {
              t: 'result',
              id: call.id,
              name: call.name,
              output: JSON.stringify(result) ?? 'null',
            };
          } catch (e) {
            return {
              t: 'result',
              id: call.id,
              name: call.name,
              output: JSON.stringify({error: e instanceof Error ? e.message : String(e)}),
              isError: true,
            };
          }
        }),
      );
      add({role: 'tool', parts: results});
    }
    if (parsed.stop === 'refusal')
      return {
        status: '模型拒绝了这次请求' + (parsed.category ? '（' + parsed.category + '）' : ''),
        usage,
      };
    if (parsed.stop === 'max_tokens') return {status: '回答被截断', usage};
    if (events.signal?.aborted) return {status: '已停止', usage};
    if (parsed.stop === 'pause' && ++pauses <= MAX_TOOL_ROUNDS) continue;
    if (parsed.stop !== 'tool' || !calls.length)
      return {status: parsed.stop === 'end' ? '已完成' : '回答已停止', usage};
    if (!executeRound) return {status: '已达到 20 轮工具调用上限', usage};
    toolRounds++;
  }
}
