import {answerQuestion} from '../src/ai/coach/answer';
import {listModels} from '../src/ai/connection';
import {loadService, rememberCompatibility, saveService} from '../src/ai/services';
import type {StoredMessage} from '../src/ai/types';
import {
  deleteChat,
  lastChat,
  listChats,
  readTurns,
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
