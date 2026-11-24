import {requestModel} from './agent';
import {endpointOf, headersOf, modelTools} from './protocol';
import type {AiService} from './types';
import {redact, type FetchLike} from './http';
import probe from './probe.json';
export async function testConnection(
  service: AiService,
  key: string,
  onService?: (s: AiService) => void,
  fetchImpl?: FetchLike,
) {
  const start = Date.now();
  const {parsed} = await requestModel(
    {
      service,
      system: '你正在测试摄影学习应用的连接。',
      tools: modelTools.filter((t) => t.name === 'say_to_user'),
      history: [
        {
          role: 'user',
          parts: [
            {t: 'image', ref: 'probe', mediaType: 'image/jpeg'},
            {t: 'text', text: '请调用 say_to_user 描述测试色块的颜色。'},
          ],
        },
      ],
      readImage: async () => probe.jpeg,
    },
    key,
    {onService, fetchImpl},
  );
  if (parsed.stop === 'refusal' || parsed.stop === 'max_tokens')
    throw new Error(parsed.stop === 'refusal' ? '模型拒绝了连接测试' : '测试回答被截断');
  const tool = parsed.parts.some((p) => p.t === 'call' && p.name === 'say_to_user');
  return (
    '连接成功 · ' +
    (Date.now() - start) +
    ' ms\n' +
    (parsed.model ?? service.model) +
    ' · 已接受图片输入 · ' +
    (tool ? '已返回工具调用' : '未返回工具调用')
  );
}
export async function listModels(s: AiService, key: string): Promise<string[]> {
  const ctl = new AbortController(),
    timer = setTimeout(() => ctl.abort(), 20000);
  try {
    const response = await fetch(endpointOf(s.protocol, s.baseUrl, 'models'), {
      headers: headersOf(s, key),
      signal: ctl.signal,
    });
    if (!response.ok) throw new Error('模型列表请求失败（HTTP ' + response.status + '）');
    const json = await response.json();
    return (json.data ?? [])
      .map((m: {id: string}) => m.id)
      .filter((id: unknown) => typeof id === 'string');
  } catch (e) {
    throw new Error(redact(e instanceof Error ? e.message : String(e), key));
  } finally {
    clearTimeout(timer);
  }
}
