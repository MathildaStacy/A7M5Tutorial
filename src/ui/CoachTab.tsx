import React, {useEffect, useRef, useState} from 'react';
import {ScrollView, TextInput, View} from 'react-native';
import {Button, Card, Txt, color, styles as s} from './theme';
import {useAcademy} from '../camera/store';
import {byId} from '../camera/controls';
import {lookupManual} from '../ai/coach/kb';
import {loadService, persistService, readKey, readProtocol} from '../ai/services';
import {runAgent} from '../ai/agent';
import type {StoredMessage} from '../ai/types';
import type {TabProps} from './routes';
import {checkedArgs} from '../ai/checkedTool';
import {PhotoReviewScreen} from './PhotoReviewScreen';
import {lessons} from '../lessons/catalog';
type HelpCall =
  | {name: 'lookup_manual'; args: {query: string}}
  | {name: 'say_to_user'; args: {text: string}}
  | {name: 'highlight_control'; args: {control_ids: string[]; note: string | null}}
  | {name: 'get_camera_config'; args: Record<string, never>}
  | {name: 'open_lesson'; args: {lesson_id: string; reason: string}};
type ChatLine = {body: string; user?: boolean; control?: string; lesson?: string};
const instruction =
  '你是快门学院的中文摄影教练，当前是按键答疑。依据提供的部件字典和 lookup_manual 回答，每次说明一个操作。菜单路径只引用检索结果。讲到部件先调用 highlight_control。用 say_to_user 显示讲解。当前入口可查询说明书、指向部件、推荐课程和回答追问。';
export function CoachTab({navigation}: TabProps<'AI 教练'>) {
  const [showPhotos, setShowPhotos] = useState(false);
  const topic = useAcademy((x) => x.topic),
    c = topic ? byId[topic] : null;
  const [input, setInput] = useState(''),
    [lines, setLines] = useState<ChatLine[]>([]),
    [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(''),
    [draft, setDraft] = useState(''),
    [error, setError] = useState('');
  const history = useRef<StoredMessage[]>([]),
    abort = useRef<AbortController | null>(null),
    chat = useRef<React.ElementRef<typeof ScrollView>>(null),
    serviceKey = useRef('');
  const add = (line: ChatLine) => setLines((prev) => [...prev, line]);
  useEffect(() => {
    if (c) setInput(c.name + '怎么用？');
  }, [c]);
  useEffect(() => () => abort.current?.abort(), []);
  async function ask() {
    const question = input.trim();
    if (!question || abort.current) return;
    const ctl = new AbortController();
    abort.current = ctl;
    setBusy(true);
    setProgress('');
    setError('');
    setDraft('');
    try {
      const svc = loadService(readProtocol()),
        key = await readKey(svc.id);
      if (!key && !/^http:\/\/(10\.0\.2\.2|localhost|127\.0\.0\.1)(:|\/|$)/.test(svc.baseUrl))
        throw new Error('请先在「我的」中保存 API Key');
      const scope = svc.id + '/' + svc.model;
      if (serviceKey.current !== scope) {
        serviceKey.current = scope;
        history.current = [];
        setLines([]);
      }
      setInput('');
      add({body: question, user: true});
      const user: StoredMessage = {
        role: 'user',
        parts: [
          {
            t: 'text',
            text: (c ? '当前部件 ' + c.id + ' · ' + c.default_function + '\n' : '') + question,
          },
        ],
      };
      history.current.push(user);
      const result = await runAgent(
        {
          service: svc,
          system:
            instruction +
            '\n' +
            JSON.stringify(Object.values(byId).map((x) => [x.id, x.name, x.default_function])),
          history: history.current,
        },
        key,
        async (call) => {
          const args = checkedArgs(call);
          const tool = {name: call.name, args} as HelpCall;
          switch (tool.name) {
            case 'lookup_manual':
              return {hits: lookupManual(tool.args.query)};
            case 'say_to_user':
              add({body: tool.args.text});
              return {ok: true};
            case 'highlight_control':
              if (!tool.args.control_ids.length || tool.args.control_ids.length > 3)
                throw new Error('需要 1–3 个部件');
              for (const id of tool.args.control_ids)
                add({body: tool.args.note || byId[id].name, control: id});
              return {ok: true, highlighted: tool.args.control_ids};
            case 'get_camera_config':
              return {
                C1: byId.btn_c1.default_function,
                C2: byId.btn_c2.default_function,
                C3: byId.btn_c3.default_function,
                C4: byId.btn_c4.default_function,
                AEL: byId.btn_ael.default_function,
                'AF-ON': byId.btn_afon.default_function,
              };
            case 'open_lesson':
              if (!lessons.some((l) => l.id === tool.args.lesson_id))
                throw new Error('本课尚未开放');
              add({body: tool.args.reason, lesson: tool.args.lesson_id});
              return {ok: true};
            default:
              throw new Error(
                '当前是按键答疑，请使用 lookup_manual、highlight_control、open_lesson 或 say_to_user。',
              );
          }
        },
        (message) => {
          history.current.push(message);
          if (message.role === 'assistant') {
            for (const p of message.parts) if (p.t === 'text' && p.text) add({body: p.text});
            setDraft('');
            setProgress('');
          }
        },
        {
          signal: ctl.signal,
          onText: setDraft,
          onProgress: (p) => setProgress(p.thinking ?? ''),
          onService: persistService,
        },
      );
      if (result.status !== '已完成') setError(result.status);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      abort.current = null;
      setBusy(false);
      setProgress('');
    }
  }
  return (
    <View style={s.screen}>
      <ScrollView
        ref={chat}
        onContentSizeChange={() => {
          if (lines.length) chat.current?.scrollToEnd({animated: false});
        }}
        contentContainerStyle={s.pad}
        keyboardShouldPersistTaps="handled"
      >
        <View>
          <Txt style={s.eyebrow}>α7 V　/　按键答疑</Txt>
          <Txt style={s.title}>AI 教练</Txt>
        </View>
        <Button primary onPress={() => setShowPhotos(true)}>
          照片复盘
        </Button>
        {c && (
          <Card>
            <Txt style={s.h2}>{c.name}</Txt>
            <Txt>{c.default_function}</Txt>
            <Txt style={s.sub}>{c.beginner_tip}</Txt>
          </Card>
        )}
        {!lines.length && (
          <Card>
            <Txt style={s.h2}>想弄懂哪个按键？</Txt>
            <Txt style={s.sub}>选一个问题，或从相机页带着部件来问。</Txt>
            <View style={s.wrap}>
              {['怎么调曝光补偿？', '拍运动该怎么对焦？'].map((q) => (
                <Button key={q} onPress={() => setInput(q)}>
                  {q}
                </Button>
              ))}
            </View>
          </Card>
        )}
        {lines.map((line, i) => (
          <Card
            key={i}
            style={line.user ? {alignSelf: 'flex-end', backgroundColor: color.soft} : undefined}
          >
            <Txt>{line.body}</Txt>
            {line.control && (
              <Button
                onPress={() => {
                  useAcademy.getState().endQuiz();
                  useAcademy.getState().select(line.control!, true);
                  navigation.navigate('相机');
                }}
              >
                {'在相机上看 · ' + byId[line.control].name}
              </Button>
            )}
            {line.lesson && (
              <Button
                onPress={() => {
                  useAcademy.setState({lesson: line.lesson!});
                  navigation.navigate('学习');
                }}
              >
                {'查看 ' + line.lesson}
              </Button>
            )}
          </Card>
        ))}
        {!!progress && <Txt style={s.sub}>{progress}</Txt>}
        {!!draft && <Txt>{draft}</Txt>}
        {!!error && (
          <Card>
            <Txt>{error}</Txt>
            <Button onPress={() => navigation.navigate('我的')}>模型与 API 设置</Button>
          </Card>
        )}
      </ScrollView>
      {showPhotos && (
        <PhotoReviewScreen
          close={() => setShowPhotos(false)}
          settings={() => {
            setShowPhotos(false);
            navigation.navigate('我的');
          }}
        />
      )}
      <View style={[s.row, {padding: 12, borderTopWidth: 1, borderColor: color.line}]}>
        <TextInput
          style={[s.input, {flex: 1}]}
          value={input}
          onChangeText={setInput}
          placeholder="问问光圈、快门、对焦…"
          placeholderTextColor={color.muted}
          onSubmitEditing={ask}
        />
        {busy ? (
          <Button onPress={() => abort.current?.abort()}>停止</Button>
        ) : (
          <Button primary disabled={!input.trim()} onPress={ask}>
            发送
          </Button>
        )}
      </View>
    </View>
  );
}
