import React, {useMemo, useRef, useState} from 'react';
import {ScrollView, View} from 'react-native';
import {byId, zones} from '../camera/controls';
import {act, initialCamera, screenState, type Operation} from '../camera/state';
import {formatEV} from '../camera/exposure';
import {views, type ViewName} from '../bridge/camera';
import {
  applyLessonSettings,
  exposureMatches,
  operationMatches,
  type Question,
} from '../lessons/engine';
import {CameraViewport} from './CameraStage';
import {ExposureDials} from './ExposureDials';
import {Button, Card, Txt, color, styles as s} from './theme';

function startCamera(item: Question) {
  if (item.type === 'operate') return applyLessonSettings(initialCamera(), item.start);
  if (item.type === 'set_exposure')
    return {...initialCamera(), ...item.start, scene_ev: item.scene_ev, mode: item.mode};
  return initialCamera();
}
function initialView(item: Question): ViewName {
  return item.type === 'operate' ? (byId[item.control].zone as ViewName) : 'overview';
}

export function LessonPractice({
  items,
  start,
  onAdvance,
}: {
  items: Question[];
  start: number;
  onAdvance: (count: number) => void;
}) {
  const [index, setIndex] = useState(Math.min(start, items.length - 1));
  const item = items[index];
  const [camera, setCamera] = useState(() => startCamera(item));
  const [view, setView] = useState(() => initialView(item));
  const [feedback, setFeedback] = useState<{correct: boolean; text: string} | null>(null);
  const [touched, setTouched] = useState(false);
  const [answer, setAnswer] = useState<number | null>(null);
  const liveCamera = useRef(camera);
  liveCamera.current = camera;
  const choosing = !!camera.choice;
  const selection = useMemo(
    () => (item.type !== 'operate' ? [] : choosing ? ['wheel', 'btn_center'] : [item.control]),
    [item, choosing],
  );
  const options = useMemo(() => {
    if (item.type !== 'choice') return [];
    const order = item.options.map((label, index) => ({label, index}));
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
  }, [item]);
  const useModel = item.type === 'find_control' || item.type === 'operate';
  const screen = screenState(camera);
  function reset(next: number) {
    setIndex(next);
    setCamera(startCamera(items[next]));
    setView(initialView(items[next]));
    setFeedback(null);
    setAnswer(null);
    setTouched(false);
  }
  function operate(id: string, op: Operation) {
    const current = liveCamera.current;
    if (
      item.type !== 'operate' ||
      (id !== item.control && !(current.choice && ['wheel', 'btn_center'].includes(id)))
    )
      return;
    const next = act(current, id, op);
    liveCamera.current = next;
    if (next.choice && !current.choice) setView('back');
    setCamera(next);
    setTouched(true);
    setFeedback(
      operationMatches(next, item.expect)
        ? {correct: true, text: '相机已调到题目要求的设置。'}
        : null,
    );
  }
  function pick(id: string) {
    if (item.type === 'find_control')
      setFeedback({
        correct: id === item.target,
        text:
          id === item.target
            ? byId[id].default_function
            : '你点到了' + byId[id].name + '。提示：' + byId[item.target].where,
      });
  }
  return (
    <ScrollView contentContainerStyle={s.pad} keyboardShouldPersistTaps="handled">
      <View>
        <Txt style={s.eyebrow}>
          第 {index + 1} / {items.length} 题
        </Txt>
        <Txt style={s.h2}>
          {item.type === 'find_control'
            ? '在模型上找到' + byId[item.target].name
            : item.type === 'choice'
            ? item.q
            : item.prompt}
        </Txt>
      </View>
      {useModel && (
        <>
          <View style={{height: 235}}>
            <CameraViewport
              compact
              camera={camera}
              view={view}
              highlight={selection}
              onPick={pick}
              onInput={operate}
            />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{gap: 6}}
          >
            {(Object.keys(views) as ViewName[]).map((v) => (
              <Button key={v} active={v === view} onPress={() => setView(v)}>
                {views[v]}
              </Button>
            ))}
          </ScrollView>
        </>
      )}
      {item.type === 'find_control' && (
        <Txt style={s.sub}>
          点按部件作答。可以拖动模型，或切换到{zones[byId[item.target].zone]}视角。
        </Txt>
      )}
      {item.type === 'choice' && (
        <Card>
          {options.map(({label: option, index: i}) => (
            <Button
              key={option}
              active={answer === i}
              onPress={() => {
                setAnswer(i);
                setFeedback({correct: i === item.answer, text: item.explain});
              }}
            >
              {option}
            </Button>
          ))}
        </Card>
      )}
      {item.type === 'operate' && (
        <Card>
          <Txt style={s.num}>
            {camera.choice
              ? camera.choice.title + '　' + camera.choice.options[camera.choice.index]
              : screen.mode + '　' + screen.focus + '　' + screen.area}
          </Txt>
          <View style={s.wrap}>
            {camera.choice ? (
              <>
                <Button onPress={() => operate('wheel', 'minus')}>上一项</Button>
                <Button onPress={() => operate('wheel', 'plus')}>下一项</Button>
                <Button onPress={() => operate('btn_center', 'click')}>确认选择</Button>
              </>
            ) : byId[item.control].actions.includes('rotate') ? (
              <>
                <Button onPress={() => operate(item.control, 'minus')}>逆时针一格</Button>
                <Button onPress={() => operate(item.control, 'plus')}>顺时针一格</Button>
              </>
            ) : (
              <Button onPress={() => operate(item.control, 'click')}>
                {'按下 ' + byId[item.control].name}
              </Button>
            )}
          </View>
          {!feedback && (
            <Button
              disabled={!touched}
              onPress={() =>
                setFeedback({correct: operationMatches(camera, item.expect), text: item.hint})
              }
            >
              检查操作
            </Button>
          )}
        </Card>
      )}
      {item.type === 'set_exposure' && (
        <Card>
          <Txt style={s.num}>
            {screen.mode}　F{screen.aperture}　{screen.shutter}　ISO {screen.iso}
          </Txt>
          <Txt>测光 {formatEV(screen.bias)} EV</Txt>
          <ExposureDials
            settings={camera}
            locked={item.lock}
            onChange={(settings) => {
              setCamera({...camera, ...settings});
              setFeedback(null);
            }}
          />
          <Button
            onPress={() =>
              setFeedback({
                correct: exposureMatches(camera, item.goal),
                text: screen.warning || item.explain,
              })
            }
          >
            检查曝光
          </Button>
        </Card>
      )}
      {feedback && (
        <Card>
          <Txt
            accessibilityLiveRegion="polite"
            style={{color: feedback.correct ? color.good : color.accent}}
          >
            {feedback.correct ? '答对了' : '再看一下'}
          </Txt>
          <Txt>{feedback.text}</Txt>
          <View style={s.wrap}>
            <Button onPress={() => reset(index)}>重做这题</Button>
            <Button
              primary
              onPress={() => {
                const next = index + 1;
                onAdvance(next);
                if (next < items.length) reset(next);
              }}
            >
              {index === items.length - 1 ? '完成练习' : '下一题'}
            </Button>
          </View>
        </Card>
      )}
    </ScrollView>
  );
}
