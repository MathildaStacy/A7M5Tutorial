// Local protocol fixture for M1 connection tests and the camera help conversation.
const http = require('node:http');
const port = Number(process.env.PORT || 8787);
function message(body, anthropic) {
  const history = anthropic ? body.messages : body.input;
  const recent = history.at(-1);
  const probe = body.tools?.length === 1 && body.tools[0]?.name === 'say_to_user';
  const finished =
    recent?.type === 'function_call_output' ||
    recent?.content?.some?.((b) => b.type === 'tool_result');
  const tool = probe ? 'say_to_user' : !finished ? 'lookup_manual' : null;
  const args = probe ? {text: '橙色。'} : {query: '曝光补偿'};
  const text = '后拨盘 R 解锁后可调整曝光补偿，每格 1/3 档。';
  const content = tool
    ? [{type: 'tool_use', id: 'call_probe', name: tool, input: args}]
    : [{type: 'text', text}];
  const output = tool
    ? [
        {
          type: 'function_call',
          id: 'fc_probe',
          call_id: 'call_probe',
          name: tool,
          arguments: JSON.stringify(args),
        },
      ]
    : [
        {
          type: 'message',
          id: 'msg_probe',
          role: 'assistant',
          content: [{type: 'output_text', text}],
        },
      ];
  return anthropic
    ? {
        type: 'message',
        id: 'msg',
        role: 'assistant',
        model: body.model,
        content,
        stop_reason: tool ? 'tool_use' : 'end_turn',
        usage: {input_tokens: 40, output_tokens: 12},
      }
    : {
        id: 'resp',
        model: body.model,
        object: 'response',
        status: 'completed',
        output,
        usage: {input_tokens: 40, output_tokens: 12},
      };
}
function stream(reply, a) {
  if (!a)
    return [
      {type: 'response.created', response: {id: 'resp', output: []}},
      ...reply.output.map((item, output_index) => ({
        type: 'response.output_item.done',
        output_index,
        item,
      })),
      {type: 'response.completed', response: reply},
    ];
  const thinking = {type: 'thinking', thinking: '正在核对机身说明。', signature: 'local-mock'};
  return [
    {type: 'message_start', message: {...reply, content: [], stop_reason: null}},
    ...[thinking, ...reply.content].flatMap((block, index) => [
      {type: 'content_block_start', index, content_block: block},
      {type: 'content_block_stop', index},
    ]),
    {type: 'message_delta', delta: {stop_reason: reply.stop_reason}, usage: reply.usage},
    {type: 'message_stop'},
  ];
}
const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/v1/models') {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({data: [{id: 'shutter-mock'}]}));
    return;
  }
  if (req.method !== 'POST' || !['/v1/messages', '/v1/responses'].includes(req.url)) {
    res.writeHead(404).end();
    return;
  }
  try {
    let raw = '';
    for await (const slice of req) raw += slice;
    const body = JSON.parse(raw),
      a = req.url.endsWith('messages'),
      reply = message(body, a);
    if (!body.stream) {
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify(reply));
      return;
    }
    res.writeHead(200, {'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache'});
    for (const e of stream(reply, a))
      res.write('event: ' + e.type + '\ndata: ' + JSON.stringify(e) + '\n\n');
    res.end();
  } catch {
    res.writeHead(400).end(JSON.stringify({error: {message: 'Invalid mock request'}}));
  }
});
server.listen(port, '127.0.0.1', () => console.log('快门学院本地模型 · http://127.0.0.1:' + port));
