import {buildRequest, headersOf, parseResponse} from '../src/ai/protocol';
import {ModelStream} from '../src/ai/stream';
import {runAgent, requestModel} from '../src/ai/agent';
import {redact} from '../src/ai/http';
import type {AiService, Protocol, StoredMessage} from '../src/ai/types';
const service: AiService = {
  id: 'test',
  protocol: 'anthropic',
  baseUrl: 'https://relay.example/v1',
  model: 'test',
  effort: 'medium',
  disabled: [],
};
const history: StoredMessage[] = [
  {
    role: 'user',
    parts: [
      {t: 'text', text: '照片'},
      {t: 'image', ref: 'photo', mediaType: 'image/jpeg'},
    ],
  },
];
const readImage = async () => 'QU\nJD';
test.each<Protocol>(['anthropic', 'openai'])(
  '%s 没收到流的结束事件时报告断网',
  async (protocol) => {
    const event =
      protocol === 'anthropic'
        ? {type: 'message_start', message: {content: []}}
        : {type: 'response.created', response: {output: []}};
    await expect(
      requestModel({service: {...service, protocol}, system: '', history: [], stream: true}, '', {
        fetchImpl: async () => ({
          status: 200,
          text: async () => 'data: ' + JSON.stringify(event) + '\n\n',
        }),
      }),
    ).rejects.toMatchObject({code: 'network', message: '网络连接中断，回复未接收完整'});
  },
);
test.each<Protocol>(['anthropic', 'openai'])(
  '%s 图片在文字前、strict 工具和原样思考历史',
  async (protocol) => {
    const raw = {
      protocol,
      model: 'test',
      items:
        protocol === 'anthropic'
          ? [{type: 'thinking', thinking: '检查', signature: 'signature'}]
          : [{type: 'reasoning', encrypted_content: 'cipher'}],
    };
    const req = await buildRequest({
        service: {...service, protocol},
        system: '教练',
        history: [...history, {role: 'assistant', raw, parts: []}],
        readImage,
      }),
      body = req.body as any;
    const m = protocol === 'anthropic' ? body.messages : body.input;
    expect(m[0].content[0]).toEqual(
      protocol === 'anthropic'
        ? {type: 'image', source: {type: 'base64', media_type: 'image/jpeg', data: 'QUJD'}}
        : {type: 'input_image', image_url: 'data:image/jpeg;base64,QUJD'},
    );
    expect(protocol === 'anthropic' ? m[1].content : m.slice(1)).toEqual(raw.items);
    expect(body.tools).toHaveLength(13);
    expect(body.tools.every((t: any) => t.strict === true)).toBe(true);
    if (protocol === 'anthropic') {
      expect(body.thinking.display).toBe('updates');
      expect(headersOf(service, 'fake')['anthropic-beta'].split(',')).toHaveLength(2);
    } else expect(body.reasoning.effort).toBe('medium');
  },
);
const feed = (p: ModelStream, events: object[]) => {
  const s = events.map((e) => 'data: ' + JSON.stringify(e) + '\r\n\r\n').join('');
  for (let i = 0; i < s.length; i += 7) p.feed(s.slice(i, i + 7));
  return p.finish();
};
test('Messages SSE 保留 thinking、签名与工具参数', () => {
  const progress = jest.fn(),
    m = feed(new ModelStream('anthropic', 'test', undefined, progress), [
      {type: 'message_start', message: {role: 'assistant', content: []}},
      {
        type: 'content_block_start',
        index: 0,
        content_block: {type: 'thinking', thinking: '', signature: ''},
      },
      {
        type: 'content_block_delta',
        index: 0,
        delta: {type: 'thinking_delta', thinking: '检查光圈'},
      },
      {type: 'content_block_delta', index: 0, delta: {type: 'signature_delta', signature: 'abc'}},
      {type: 'content_block_stop', index: 0},
      {type: 'message_delta', delta: {stop_reason: 'end_turn'}},
      {type: 'message_stop'},
    ]);
  expect(m.raw.items).toEqual([{type: 'thinking', thinking: '检查光圈', signature: 'abc'}]);
  expect(progress).toHaveBeenCalledWith({thinking: '检查光圈'});
});
test('Responses 拼接 function_call 的参数', () => {
  const call = {type: 'function_call', id: 'a', call_id: 'b', name: 'lookup_manual', arguments: ''};
  const m = feed(new ModelStream('openai', 'test'), [
    {type: 'response.created', response: {output: []}},
    {type: 'response.output_item.added', output_index: 0, item: call},
    ...['{"query":', '"Fn"}'].map((delta) => ({
      type: 'response.function_call_arguments.delta',
      output_index: 0,
      delta,
    })),
    {type: 'response.function_call_arguments.done', output_index: 0, arguments: '{"query":"Fn"}'},
    {type: 'response.completed', response: {status: 'completed', output: []}},
  ]);
  expect(m.parts).toContainEqual({
    t: 'call',
    id: 'b',
    name: 'lookup_manual',
    args: '{"query":"Fn"}',
  });
});
const ok = (data: object, status = 200) => ({status, text: async () => JSON.stringify(data)});
const tool = (id: string) => ({type: 'tool_use', name: 'lookup_manual', id, input: {query: id}});
test('同轮工具合并，错误回传；refusal 不执行，截断可见', async () => {
  const saved: StoredMessage[] = [],
    exec = jest.fn(async (c: {id: string}) => {
      if (c.id === 'bad') throw new Error('参数不合法');
      return {ok: true};
    });
  const fetchImpl = jest
    .fn()
    .mockResolvedValueOnce(ok({content: [tool('one'), tool('bad')], stop_reason: 'tool_use'}))
    .mockResolvedValueOnce(ok({content: [tool('deny')], stop_reason: 'refusal'}));
  const r = await runAgent({service, system: '教练', history: []}, '', exec, (m) => saved.push(m), {
    fetchImpl,
  });
  expect(exec).toHaveBeenCalledTimes(2);
  expect(saved[1].parts).toHaveLength(2);
  expect(saved[1].parts[1]).toMatchObject({isError: true});
  expect(r.status).toContain('拒绝');
  expect(JSON.parse(fetchImpl.mock.calls[1][1].body).messages[1].content[1].is_error).toBe(true);
  expect(parseResponse('openai', 'test', {status: 'incomplete', output: []}).stop).toBe(
    'max_tokens',
  );
});
test('工具轮数有上限，400 降级只重试一次并记录字段', async () => {
  const fetchImpl = jest
    .fn()
    .mockResolvedValue(ok({content: [tool('x')], stop_reason: 'tool_use'}));
  const execute = jest.fn(async () => ({ok: true}));
  const r = await runAgent({service, system: '', history: []}, '', execute, () => {}, {fetchImpl});
  expect(r.status).toContain('上限');
  expect(execute).toHaveBeenCalledTimes(20);
  const fallback = jest
    .fn()
    .mockResolvedValueOnce(ok({error: {message: 'unexpected field strict'}}, 400))
    .mockResolvedValueOnce(ok({content: [], stop_reason: 'end_turn'}));
  const remember = jest.fn();
  await requestModel({service, system: '', history: []}, 'secret', {
    fetchImpl: fallback,
    onService: remember,
  });
  expect(JSON.parse(fallback.mock.calls[1][1].body).tools[0].strict).toBeUndefined();
  expect(remember.mock.calls[0][0].disabled).toEqual(['strict']);
  expect(redact('invalid secret', 'secret')).not.toContain('secret');
});
