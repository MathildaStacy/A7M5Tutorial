import {answerQuestion} from '../src/ai/coach/answer';
import {listModels} from '../src/ai/connection';
import {loadService, rememberCompatibility, saveService} from '../src/ai/services';
import type {FetchLike} from '../src/ai/http';
import type {Protocol, StoredMessage} from '../src/ai/types';
import {
  deleteChat,
  historyBefore,
  lastChat,
  listChats,
  readTurns,
  restartTurn,
  saveTurn,
  selectChat,
  startTurn,
} from '../src/data/coachChats';

jest.mock('@op-engineering/op-sqlite', () => ({
  open: () => {
    const conn = new (jest.requireActual('node:sqlite').DatabaseSync)(':memory:');
    return {
      executeSync: (sql: string, args: unknown[] = []) => {
        const stmt = conn.prepare(sql);
        if (stmt.columns().length) return {rows: stmt.all(...args)};
        return {rows: [], insertId: Number(stmt.run(...args).lastInsertRowid)};
      },
    };
  },
}));
jest.mock('react-native-keychain', () => ({
  getGenericPassword: async () => false,
  setGenericPassword: async () => true,
}));
const user = (text: string): StoredMessage => ({role: 'user', parts: [{t: 'text', text}]});

test.each<Protocol>(['anthropic', 'openai'])(
  '%s 断流后用原部件和之前的上下文重发同一条，对话中后续问题和旧版残稿不会进入请求',
  async (protocol) => {
    const service = loadService(protocol);
    const first = startTurn(null, service.model, '之前的问题', user('之前的问题'));
    first.messages.push({role: 'assistant', parts: [{t: 'text', text: '之前的回答'}]});
    first.status = '已完成';
    saveTurn(first);

    const original = user('当前部件 dial_rear_r · 曝光补偿\n怎么调曝光补偿？');
    const failed = startTurn(first.chatId, service.model, '怎么调曝光补偿？', original);
    const fragment = '未收完的回复';
    let draft = '';
    const drop: FetchLike = async (_, init) => {
      const event =
        protocol === 'anthropic'
          ? {type: 'content_block_start', index: 0, content_block: {type: 'text', text: fragment}}
          : {
              type: 'response.output_text.delta',
              output_index: 0,
              content_index: 0,
              delta: fragment,
            };
      init.onChunk?.('data: ' + JSON.stringify(event) + '\n\n');
      throw new Error('网络连接中断');
    };
    await expect(
      answerQuestion(failed, first.messages, service, '', () => saveTurn(failed), {
        fetchImpl: drop,
        onText: (text) => {
          draft = text;
        },
      }),
    ).rejects.toThrow('网络连接中断');
    expect(draft).toBe(fragment);
    // v0.2.1 also persisted its incomplete answer in the protocol history.
    failed.messages.push({role: 'assistant', parts: [{t: 'text', text: draft}]});
    failed.replies.push({body: draft});
    failed.status = '网络连接中断';
    saveTurn(failed);
    const later = startTurn(first.chatId, service.model, '后面的问题', user('后面的问题'));
    later.status = '已完成';
    saveTurn(later);
    const saved = readTurns(first.chatId);
    expect(historyBefore(saved, later.id)).toEqual(first.messages);
    const retry = restartTurn(saved[1], 'changed-model');
    expect(readTurns(first.chatId)[1]).toMatchObject({
      id: failed.id,
      messages: [original],
      replies: [],
      status: '进行中',
      model: 'changed-model',
    });
    // Reopen after a process exit while the retry was still in flight.
    const restored = restartTurn(readTurns(first.chatId)[1], retry.model);
    const json =
      protocol === 'anthropic'
        ? {content: [{type: 'text', text: '完整回答'}], stop_reason: 'end_turn'}
        : {output_text: '完整回答', status: 'completed'};
    const transport = jest
      .fn()
      .mockResolvedValue({status: 200, text: async () => JSON.stringify(json)});
    const result = await answerQuestion(
      restored,
      historyBefore(saved, restored.id),
      {...service, model: retry.model},
      '',
      () => saveTurn(restored),
      {fetchImpl: transport},
    );
    restored.status = result.status;
    saveTurn(restored);
    const body = JSON.parse(transport.mock.calls[0][1].body);
    const wire = (body.messages ?? body.input).map((m: any) => m.content[0].text);
    expect(wire).toEqual([
      '之前的问题',
      '之前的回答',
      '当前部件 dial_rear_r · 曝光补偿\n怎么调曝光补偿？',
    ]);
    expect(body.model).toBe(retry.model);
    expect(readTurns(first.chatId).map((t) => t.id)).toEqual([first.id, failed.id, later.id]);
    expect(readTurns(first.chatId)[1].replies).toEqual([{body: '完整回答'}]);
    deleteChat(first.chatId);
  },
);

test('分块送达的 Markdown 在实时和存档中一致，部件按钮仍在模型指定的位置', async () => {
  const service = loadService('anthropic');
  const turn = startTurn(null, service.model, '对焦', user('对焦'));
  const call = {
    type: 'tool_use',
    id: 'c3',
    name: 'highlight_control',
    input: {control_ids: ['btn_c3'], note: '按 C3', style: 'pulse'},
  };
  const blocks = [
    {type: 'text', text: '**怎么调'},
    {type: 'text', text: '：**在拍照状态下。'},
    call,
    {type: 'text', text: '然后半按。'},
  ];
  const live: string[] = [];
  const events = [
    {type: 'message_start', message: {content: []}},
    ...blocks.flatMap((block, index) => [
      {type: 'content_block_start', index, content_block: block},
      {type: 'content_block_stop', index},
    ]),
    {type: 'message_delta', delta: {stop_reason: 'tool_use'}},
    {type: 'message_stop'},
  ];
  const transport = jest
    .fn()
    .mockResolvedValueOnce({
      status: 200,
      text: async () => events.map((e) => 'data: ' + JSON.stringify(e) + '\n\n').join(''),
    })
    .mockResolvedValueOnce({
      status: 200,
      text: async () =>
        JSON.stringify({content: [{type: 'text', text: '完成。'}], stop_reason: 'end_turn'}),
    });
  await answerQuestion(turn, [], service, '', () => saveTurn(turn), {
    fetchImpl: transport,
    onText: (s) => live.push(s),
  });
  expect(live).toContain('**怎么调：**在拍照状态下。');
  expect(readTurns(turn.chatId)[0].replies).toEqual([
    {body: '**怎么调：**在拍照状态下。'},
    {body: '按 C3', control: 'btn_c3'},
    {body: '然后半按。'},
    {body: '完成。'},
  ]);
  deleteChat(turn.chatId);
});

test('切回已选对话可继续，后台结果和已删除的请求不会写进另一段对话', () => {
  const a = startTurn(null, 'one', '第一段', user('第一段'));
  const b = startTurn(null, 'two', '第二段', user('第二段'));
  a.replies.push({body: '## 第一段的 Markdown'});
  a.status = '已完成';
  saveTurn(a);
  expect(lastChat()).toBe(b.chatId);
  selectChat(a.chatId);
  expect(readTurns(lastChat())[0].replies).toEqual(a.replies);
  const follow = startTurn(a.chatId, 'two', '追问', user('追问'));
  expect(readTurns(a.chatId).map((t) => t.model)).toEqual(['one', 'two']);
  expect(readTurns(b.chatId).map((t) => t.question)).toEqual(['第二段']);
  deleteChat(a.chatId);
  const fresh = startTurn(null, 'two', '新建', user('新建'));
  saveTurn(follow);
  expect(readTurns(fresh.chatId)[0].question).toBe('新建');
  expect(listChats().map((t) => t.id)).not.toContain(a.chatId);
  deleteChat(b.chatId);
  deleteChat(fresh.chatId);
  expect(lastChat()).toBeNull();
});

test('存档内的工具调用与结果成对，保留工具讲解中的 Markdown 和同模型的原始响应', async () => {
  const service = loadService('anthropic'),
    turn = startTurn(null, service.model, '示例', user('示例'));
  const first = {
    content: [{type: 'tool_use', id: 'guide', name: 'say_to_user', input: {text: '**光圈**'}}],
    stop_reason: 'tool_use',
  };
  const final = {content: [{type: 'text', text: '## 结论'}], stop_reason: 'end_turn'};
  const transport = jest
    .fn()
    .mockResolvedValueOnce({status: 200, text: async () => JSON.stringify(first)})
    .mockResolvedValueOnce({status: 200, text: async () => JSON.stringify(final)});
  const traces: string[][] = [];
  const result = await answerQuestion(
    turn,
    [],
    service,
    '',
    () => {
      saveTurn(turn);
      traces.push(readTurns(turn.chatId)[0].messages.map((m) => m.role));
    },
    {fetchImpl: transport},
  );
  expect(result.status).toBe('已完成');
  expect(traces).toEqual([
    ['user', 'assistant', 'tool'],
    ['user', 'assistant', 'tool', 'assistant'],
  ]);
  expect(turn.replies.map((r) => r.body)).toEqual(['**光圈**', '## 结论']);
  expect(readTurns(turn.chatId)[0].messages[1].raw?.items).toEqual(first.content);
  deleteChat(turn.chatId);
});

test('旧请求返回的兼容设置不会撤回用户刚保存的新模型', async () => {
  const original = await saveService({...loadService('openai'), model: 'model-a'}, '');
  await saveService({...original, model: 'model-b'}, '');
  rememberCompatibility({...original, disabled: ['strict']});
  expect(loadService('openai')).toMatchObject({model: 'model-b', disabled: []});
});

test('模型列表按同一服务的游标翻页、去重，独立于待选择的模型名称', async () => {
  const saved = globalThis.fetch;
  const get = jest
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({data: [{id: 'a'}], has_more: true, last_id: 'a/b'}),
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({data: [{id: 'a'}, {id: 'b'}], has_more: false}),
    });
  globalThis.fetch = get;
  try {
    await expect(
      listModels(
        {...loadService('anthropic'), baseUrl: 'http://localhost/v1/messages', model: ''},
        '',
      ),
    ).resolves.toEqual(['a', 'b']);
    expect(get.mock.calls.map(([url]) => url)).toEqual([
      'http://localhost/v1/models',
      'http://localhost/v1/models?after_id=a%2Fb',
    ]);
  } finally {
    globalThis.fetch = saved;
  }
});
