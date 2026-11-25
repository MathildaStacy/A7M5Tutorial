import React, {useCallback, useDeferredValue, useEffect, useMemo, useRef, useState} from 'react';
import {Keyboard, Pressable, ScrollView, TextInput, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {ChevronDown} from 'lucide-react-native';
import {Button, Card, Txt, color, styles as s} from './theme';
import {useAcademy} from '../camera/store';
import {byId} from '../camera/controls';
import {
  loadService,
  localService,
  rememberCompatibility,
  readKey,
  readProtocol,
} from '../ai/services';
import {answerQuestion} from '../ai/coach/answer';
import {
  deleteChat,
  lastChat,
  listChats,
  readTurns,
  saveTurn,
  selectChat,
  startTurn,
} from '../data/coachChats';
import type {Protocol, StoredMessage} from '../ai/types';
import type {TabProps} from './routes';
import {PhotoReviewScreen} from './PhotoReviewScreen';
import {CoachMarkdown} from './CoachMarkdown';
import {ChatHistory} from './ChatHistory';
import {ModelPicker} from './ModelPicker';

type LiveAnswer = {
  controller: AbortController;
  draft: string;
  thinking: string;
  turnId: number;
};
function StreamingAnswer({answer}: {answer: LiveAnswer}) {
  const draft = useDeferredValue(answer.draft);
  return (
    <Card>
      <Txt style={s.sub}>{answer.thinking || '正在回复…'}</Txt>
      {!!draft && <CoachMarkdown text={draft} />}
    </Card>
  );
}
export function CoachTab({navigation}: TabProps<'AI 教练'>) {
  const [panel, open] = useState<'history' | 'model' | 'photos' | null>(null);
  const [service, setService] = useState(() => loadService(readProtocol()));
  useFocusEffect(
    useCallback(() => {
      setService(loadService(readProtocol()));
    }, []),
  );
  const [chatId, setChatId] = useState(lastChat),
    active = useRef(chatId);
  const [revision, redraw] = useState(0),
    [, redrawStream] = useState(0);
  const turns = useMemo(() => readTurns(chatId), [chatId, revision]);
  const chats = useMemo(() => (panel === 'history' ? listChats() : []), [panel, revision]);
  const [input, setInput] = useState(''),
    [topic, setTopic] = useState<string | null>(null);
  const [shortViewport, setShortViewport] = useState(false),
    [editing, setEditing] = useState(false);
  const compactComposer = shortViewport && editing;
  const drafts = useRef(new Map<number | null, string>());
  const runs = useRef(new Map<number, LiveAnswer>()).current;
  const live = chatId !== null ? runs.get(chatId) : undefined;
  const mounted = useRef(true);
  const chat = useRef<React.ElementRef<typeof ScrollView>>(null),
    follow = useRef(true);
  const incoming = useAcademy((state) => state.topic);
  const c = topic ? byId[topic] : null;
  useEffect(() => {
    if (incoming && byId[incoming]) {
      setTopic(incoming);
      setInput(byId[incoming].name + '怎么用？');
      useAcademy.setState({topic: null});
    }
  }, [incoming]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      for (const r of runs.values()) r.controller.abort();
    };
  }, [runs]);
  function switchChat(id: number | null) {
    Keyboard.dismiss();
    drafts.current.set(active.current, input);
    selectChat(id);
    active.current = id;
    setChatId(id);
    setInput(id === null ? '' : drafts.current.get(id) ?? '');
    setTopic(null);
    open(null);
    follow.current = true;
    requestAnimationFrame(() => chat.current?.scrollToEnd({animated: false}));
  }
  function purge(id: number) {
    runs.get(id)?.controller.abort();
    deleteChat(id);
    drafts.current.delete(id);
    if (active.current === id) {
      active.current = null;
      setChatId(null);
      setInput('');
      setTopic(null);
    }
    redraw((n) => n + 1);
  }
  async function ask() {
    const question = input.trim(),
      current = active.current;
    if (!question || (current !== null && runs.has(current))) return;
    const svc = loadService(readProtocol());
    const previous = readTurns(current).flatMap((t) => t.messages);
    const user: StoredMessage = {
      role: 'user',
      parts: [
        {
          t: 'text',
          text: (c ? '当前部件 ' + c.id + ' · ' + c.default_function + '\n' : '') + question,
        },
      ],
    };
    const turn = startTurn(current, svc.model, question, user);
    const run: LiveAnswer = {
      controller: new AbortController(),
      draft: '',
      thinking: '',
      turnId: turn.id,
    };
    runs.set(turn.chatId, run);
    active.current = turn.chatId;
    setChatId(turn.chatId);
    drafts.current.delete(current);
    setInput('');
    setService(svc);
    follow.current = true;
    Keyboard.dismiss();
    redraw((n) => n + 1);
    function checkpoint() {
      saveTurn(turn);
      run.draft = '';
      run.thinking = '';
      if (mounted.current) redraw((n) => n + 1);
    }
    function updateStream() {
      if (mounted.current && active.current === turn.chatId) redrawStream((n) => n + 1);
    }
    try {
      const key = await readKey(svc.id);
      if (!key && !localService(svc)) throw new Error('请先在「我的」中保存 API Key');
      if (run.controller.signal.aborted) throw new Error('已停止');
      const result = await answerQuestion(turn, previous, svc, key, checkpoint, {
        signal: run.controller.signal,
        onService: rememberCompatibility,
        onText: (v) => {
          run.draft = v;
          updateStream();
        },
        onProgress: (v) => {
          run.thinking = v.thinking ?? '';
          updateStream();
        },
      });
      turn.status = result.status;
    } catch (e) {
      turn.status = run.controller.signal.aborted
        ? '已停止'
        : e instanceof Error
        ? e.message
        : String(e);
      if (run.draft) {
        turn.replies.push({body: run.draft});
        turn.messages.push({
          role: 'assistant',
          parts: [{t: 'text', text: run.draft}],
        });
      }
    } finally {
      runs.delete(turn.chatId);
      checkpoint();
    }
  }
  function show(which: 'history' | 'model' | 'photos') {
    Keyboard.dismiss();
    open(which);
  }
  function settings(protocol?: Protocol) {
    open(null);
    navigation.navigate('我的', {protocol});
  }
  return (
    <View style={s.screen} onLayout={(e) => setShortViewport(e.nativeEvent.layout.height < 220)}>
      {!compactComposer && (
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 9,
            borderBottomWidth: 1,
            borderColor: color.line,
            gap: 2,
          }}
        >
          <View style={s.spread}>
            <Txt style={s.h2}>AI 教练</Txt>
            <View style={s.row}>
              <Button onPress={() => show('history')}>对话记录</Button>
              <Button onPress={() => switchChat(null)}>新对话</Button>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={'选择模型，当前 ' + service.model}
            onPress={() => show('model')}
            style={[s.row, {alignSelf: 'flex-start', maxWidth: '100%', minHeight: 36}]}
          >
            <Txt numberOfLines={1} style={[s.sub, {flexShrink: 1}]}>
              {'模型 · ' + service.model}
            </Txt>
            <ChevronDown color={color.accent} size={16} />
          </Pressable>
        </View>
      )}
      <ScrollView
        ref={chat}
        style={{flex: 1}}
        contentContainerStyle={s.pad}
        keyboardShouldPersistTaps="handled"
        onScroll={({nativeEvent: e}) => {
          follow.current =
            e.contentSize.height - e.layoutMeasurement.height - e.contentOffset.y < 72;
        }}
        scrollEventThrottle={100}
        onContentSizeChange={() => {
          if (turns.length && follow.current) chat.current?.scrollToEnd({animated: false});
        }}
      >
        <Button onPress={() => show('photos')}>照片复盘</Button>
        {c && (
          <Card>
            <Txt style={s.h2}>{c.name}</Txt>
            <Txt>{c.default_function}</Txt>
            <Txt style={s.sub}>{c.beginner_tip}</Txt>
          </Card>
        )}
        {!turns.length && (
          <Card>
            <Txt style={s.h2}>想弄懂哪个按键？</Txt>
            <View style={s.wrap}>
              {['怎么调曝光补偿？', '拍运动该怎么对焦？'].map((q) => (
                <Button key={q} onPress={() => setInput(q)}>
                  {q}
                </Button>
              ))}
            </View>
          </Card>
        )}
        {turns.map((turn) => (
          <React.Fragment key={turn.id}>
            <Card style={{alignSelf: 'flex-end', maxWidth: '100%', backgroundColor: color.soft}}>
              <CoachMarkdown text={turn.question} />
            </Card>
            {turn.replies.map((line, i) => (
              <Card key={i}>
                {i === 0 && <Txt style={s.sub}>{turn.model}</Txt>}
                <CoachMarkdown text={line.body} />
                {line.control && byId[line.control] && (
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
            {turn.status !== '已完成' && live?.turnId !== turn.id && (
              <Card>
                <Txt style={s.sub}>
                  {turn.status === '进行中' ? '上次回复已中断，可以继续提问。' : turn.status}
                </Txt>
                {turn.status.includes('Key') && (
                  <Button onPress={() => settings()}>模型与 API 设置</Button>
                )}
              </Card>
            )}
          </React.Fragment>
        ))}
        {live && <StreamingAnswer key={live.turnId} answer={live} />}
      </ScrollView>
      <View
        style={[
          s.row,
          {
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderTopWidth: 1,
            borderColor: color.line,
            alignItems: 'flex-end',
          },
        ]}
      >
        <TextInput
          accessibilityLabel="教练消息"
          multiline
          disableFullscreenUI
          onFocus={() => setEditing(true)}
          onBlur={() => setEditing(false)}
          submitBehavior="newline"
          style={[
            s.input,
            {
              flex: 1,
              minHeight: 44,
              maxHeight: compactComposer ? 68 : 120,
              textAlignVertical: 'top',
            },
          ]}
          value={input}
          onChangeText={setInput}
          placeholder="问问光圈、快门、对焦…"
          placeholderTextColor={color.muted}
        />
        {live ? (
          <Button onPress={() => live.controller.abort()}>停止</Button>
        ) : (
          <Button primary disabled={!input.trim()} onPress={ask}>
            发送
          </Button>
        )}
      </View>
      {panel === 'history' && (
        <ChatHistory
          chats={chats}
          active={chatId}
          select={switchChat}
          remove={purge}
          close={() => open(null)}
        />
      )}
      {panel === 'model' && (
        <ModelPicker
          current={service}
          close={() => open(null)}
          choose={(next) => {
            setService(next);
            open(null);
          }}
          settings={settings}
        />
      )}
      {panel === 'photos' && (
        <PhotoReviewScreen
          close={() => {
            setService(loadService(readProtocol()));
            open(null);
          }}
          settings={settings}
        />
      )}
    </View>
  );
}
