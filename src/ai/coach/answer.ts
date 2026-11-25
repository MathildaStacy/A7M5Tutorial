import {runAgent} from '../agent';
import {checkedArgs} from '../checkedTool';
import {modelTools} from '../protocol';
import {lookupManual} from './kb';
import {byId} from '../../camera/controls';
import {lessons} from '../../lessons/catalog';
import type {AiService, Part, StoredMessage} from '../types';
import type {CoachReply, CoachTurn} from '../../data/coachChats';

const tools = modelTools.filter((t) =>
  [
    'lookup_manual',
    'say_to_user',
    'highlight_control',
    'get_camera_config',
    'open_lesson',
  ].includes(t.name),
);
const system =
  '你是快门学院的中文摄影教练。依据部件字典和 lookup_manual 解答问题与追问。菜单路径只引用检索结果。讲到具体部件可用 highlight_control，课程可用 open_lesson。用简洁的 Markdown 排版，讲解可以直接回复，或通过 say_to_user 显示。\n' +
  JSON.stringify(Object.values(byId).map((c) => [c.id, c.name, c.default_function]));
type Call = Extract<Part, {t: 'call'}>;
function execute(call: Call, replies: CoachReply[]) {
  switch (call.name) {
    case 'lookup_manual':
      return {hits: lookupManual(checkedArgs<{query: string}>(call).query)};
    case 'say_to_user':
      replies.push({body: checkedArgs<{text: string}>(call).text});
      return {ok: true};
    case 'highlight_control': {
      const {control_ids, note} = checkedArgs<{
        control_ids: string[];
        note: string | null;
      }>(call);
      if (!control_ids.length || control_ids.length > 3 || control_ids.some((id) => !byId[id]))
        throw new Error('需要 1–3 个已知部件');
      for (const id of control_ids) replies.push({body: note || byId[id].name, control: id});
      return {ok: true, highlighted: control_ids};
    }
    case 'get_camera_config':
      checkedArgs(call);
      return {
        C1: byId.btn_c1.default_function,
        C2: byId.btn_c2.default_function,
        C3: byId.btn_c3.default_function,
        C4: byId.btn_c4.default_function,
        AEL: byId.btn_ael.default_function,
        'AF-ON': byId.btn_afon.default_function,
      };
    case 'open_lesson': {
      const {lesson_id, reason} = checkedArgs<{
        lesson_id: string;
        reason: string;
      }>(call);
      if (!lessons.some((l) => l.id === lesson_id)) throw new Error('本课尚未开放');
      replies.push({body: reason, lesson: lesson_id});
      return {ok: true};
    }
    default:
      throw new Error('当前答疑不支持此工具');
  }
}
export async function answerQuestion(
  turn: CoachTurn,
  earlier: StoredMessage[],
  service: AiService,
  key: string,
  checkpoint: () => void,
  events: NonNullable<Parameters<typeof runAgent>[4]>,
) {
  let pending: StoredMessage | undefined;
  const toolReplies = new Map<Call, CoachReply[]>();
  return runAgent(
    {service, system, tools, history: [...earlier, ...turn.messages]},
    key,
    async (call) => {
      const replies: CoachReply[] = [];
      const result = execute(call, replies);
      if (replies.length) toolReplies.set(call, replies);
      return result;
    },
    (m) => {
      if (m.role === 'assistant') {
        // A restored request must always replay tool calls with their corresponding results.
        pending = m;
        if (m.parts.some((p) => p.t === 'call')) return;
      }
      if (pending) {
        let text: CoachReply | undefined;
        for (const part of pending.parts) {
          if (part.t === 'text' && part.text) {
            if (text) text.body += part.text;
            else {
              text = {body: part.text};
              turn.replies.push(text);
            }
          } else if (part.t === 'call') {
            const replies = toolReplies.get(part);
            if (replies) {
              turn.replies.push(...replies);
              text = undefined;
            }
          }
        }
        turn.messages.push(pending);
        pending = undefined;
        toolReplies.clear();
      }
      if (m.role === 'tool') turn.messages.push(m);
      checkpoint();
    },
    events,
  );
}
