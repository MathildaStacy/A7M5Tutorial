import React, {useEffect, useState} from 'react';
import {Modal, Pressable, ScrollView, TextInput, View, Vibration} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ChevronRight, Search, X} from 'lucide-react-native';
import {views, type ViewName} from '../bridge/camera';
import {byId, searchControls, zones} from '../camera/controls';
import {displays, screenState, type Operation} from '../camera/state';
import {formatEV} from '../camera/exposure';
import {useAcademy} from '../camera/store';
import {relatedLessons} from '../lessons/catalog';
import {CameraStage} from './CameraStage';
import {Button, Txt, color, styles as s} from './theme';
import type {TabProps} from './routes';

function Dictionary({close}: {close: () => void}) {
  const [q, search] = useState('');
  const items = searchControls(q);
  return (
    <Modal animationType="slide" onRequestClose={close}>
      <SafeAreaView style={s.screen}>
        <View style={[s.pad, {paddingBottom: 9}]}>
          <View style={s.spread}>
            <Txt style={s.h2}>部件字典</Txt>
            <Button onPress={close}>关闭</Button>
          </View>
          <TextInput
            accessibilityLabel="搜索部件"
            value={q}
            onChangeText={search}
            placeholder="搜索按键或功能，如曝光补偿"
            placeholderTextColor={color.muted}
            style={s.input}
          />
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.pad}>
          {!items.length && <Txt>没有找到相关部件，试试功能名称。</Txt>}
          {(q.trim() ? ['匹配部件'] : Object.values(zones)).map((zone) => {
            const section = q.trim() ? items : items.filter((c) => zones[c.zone] === zone);
            return (
              <View key={zone} style={{gap: 3}}>
                <Txt style={s.sub}>
                  {zone} · {section.length}
                </Txt>
                {section.map((c) => (
                  <Pressable
                    key={c.id}
                    accessibilityRole="button"
                    accessibilityLabel={c.name}
                    onPress={() => {
                      useAcademy.getState().select(c.id, true);
                      close();
                    }}
                    style={[
                      s.spread,
                      {paddingVertical: 8, borderBottomWidth: 1, borderColor: color.line},
                    ]}
                  >
                    <View style={{flex: 1}}>
                      <Txt>{c.name}</Txt>
                      <Txt style={s.sub}>{c.where}</Txt>
                    </View>
                    <ChevronRight size={17} color={color.muted} />
                  </Pressable>
                ))}
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
function QuizBar() {
  const quiz = useAcademy((s) => s.quiz)!;
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (quiz.ended !== null) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [quiz.ended]);
  const duration = Math.max(0, Math.floor(((quiz.ended ?? now) - quiz.started) / 1000));
  return (
    <View style={{paddingHorizontal: 16, paddingVertical: 8, gap: 4, backgroundColor: color.soft}}>
      <View style={s.spread}>
        <View style={{flex: 1}}>
          <Txt style={{color: color.accent}}>
            {quiz.ended !== null
              ? '找键练习 · ' + quiz.score + ' / 10'
              : '第 ' +
                (quiz.index + 1) +
                ' / 10 题 · 找到' +
                byId[quiz.questions[quiz.index]].name}
          </Txt>
          <Txt style={s.sub}>
            {duration} 秒 ·{' '}
            {quiz.ended !== null
              ? quiz.score === 10
                ? 'L1 满分任务已完成'
                : quiz.score >= 8
                ? '本轮达标'
                : '达到 8 分即可完成练习'
              : quiz.score + ' 分'}
          </Txt>
        </View>
        <Button onPress={() => useAcademy.getState().endQuiz()}>
          {quiz.ended !== null ? '完成' : '结束练习'}
        </Button>
      </View>
      {!!quiz.feedback && (
        <Txt accessibilityLiveRegion="polite" style={s.sub}>
          {quiz.feedback}
        </Txt>
      )}
    </View>
  );
}
export function CameraTab({navigation}: TabProps<'相机'>) {
  const {camera, view, labels, selected: sel, lcd, quiz, startQuiz} = useAcademy();
  const [dictionary, setDictionary] = useState(false);
  const c = sel ? byId[sel] : null,
    screen = screenState(camera);
  const operate = (id: string, op: Operation) => {
    useAcademy.getState().operate(id, op);
    Vibration.vibrate(12);
  };
  const chip = (label: string, id: string, op: Operation) => (
    <Button key={label} onPress={() => operate(id, op)}>
      {label}
    </Button>
  );
  const close = () => useAcademy.setState({selected: null, lcd: false});
  const p = c?.positions ? screen.positions[c.id] : null;
  const readouts = [
    ['模式', screen.mode],
    ['光圈', 'F' + screen.aperture],
    ['快门', screen.shutter],
    ['ISO', (screen.auto ? 'A' : '') + screen.iso],
    ['补偿', formatEV(screen.ev)],
    ['焦距', screen.focal + 'mm'],
  ];
  return (
    <View style={s.screen}>
      <View style={[s.spread, {paddingHorizontal: 15, paddingVertical: 9}]}>
        <Txt style={s.h2}>{lcd ? '屏幕详解' : '3D 相机'}</Txt>
        <View style={s.row}>
          {lcd ? (
            <Button onPress={close}>返回相机</Button>
          ) : (
            !quiz && (
              <>
                <Pressable
                  onPress={() => setDictionary(true)}
                  accessibilityRole="button"
                  accessibilityLabel="搜索部件"
                  hitSlop={6}
                  style={{padding: 7}}
                >
                  <Search color={color.ink} size={20} />
                </Pressable>
                <Button active={labels} onPress={() => useAcademy.setState({labels: !labels})}>
                  标签
                </Button>
                <Button onPress={startQuiz}>找键练习</Button>
              </>
            )
          )}
        </View>
      </View>
      {quiz && <QuizBar />}
      <CameraStage />
      {!lcd && (
        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{gap: 6, paddingHorizontal: 12, paddingVertical: 7}}
          >
            {(Object.keys(views) as ViewName[]).map((v) => (
              <Button key={v} active={view === v} onPress={() => useAcademy.setState({view: v})}>
                {views[v]}
              </Button>
            ))}
          </ScrollView>
        </View>
      )}
      <View
        style={[s.spread, {backgroundColor: color.card, paddingHorizontal: 12, paddingVertical: 7}]}
      >
        {readouts.map(([label, value]) => (
          <View key={label}>
            <Txt style={s.num}>{value}</Txt>
            <Txt style={s.eyebrow}>{label}</Txt>
          </View>
        ))}
      </View>
      {lcd && (
        <View style={[s.spread, {padding: 12}]}>
          <Txt>{displays[camera.display]}</Txt>
          {chip('切换 DISP', 'wheel', 'up')}
        </View>
      )}
      {!!c && !lcd && !quiz && (
        <ScrollView
          style={{maxHeight: '42%', flexGrow: 0}}
          contentContainerStyle={{padding: 15, gap: 7}}
        >
          <View style={s.spread}>
            <Txt style={s.h2}>{c.name}</Txt>
            <Pressable accessibilityLabel="收起部件详情" onPress={close} hitSlop={10}>
              <X size={20} color={color.sub} />
            </Pressable>
          </View>
          <Txt style={s.sub}>{c.where}</Txt>
          <Txt>{c.default_function}</Txt>
          <Txt style={s.sub}>{c.beginner_tip}</Txt>
          {p && <Txt style={{color: color.accent}}>当前档位　{p}</Txt>}
          <View style={s.wrap}>
            {camera.choice ? (
              <>
                {chip('上一项', 'wheel', 'minus')}
                {chip('下一项', 'wheel', 'plus')}
                {chip('确认', 'btn_center', 'click')}
              </>
            ) : (
              <>
                {c.actions.includes('rotate') && (
                  <>
                    {chip('逆时针 −', c.id, 'minus')}
                    {chip('顺时针 ＋', c.id, 'plus')}
                  </>
                )}
                {c.actions.includes('slide') &&
                  !c.actions.includes('rotate') &&
                  chip('拨动开关', c.id, 'click')}
                {c.id === 'shutter' && chip('半按对焦', c.id, 'half')}
                {c.actions.includes('press') &&
                  (!c.press_directions || c.id === 'joystick') &&
                  chip(
                    c.id === 'shutter' ? '全按拍摄' : c.id === 'btn_ael' ? '按住' : '按下',
                    c.id,
                    'click',
                  )}
                {c.id === 'btn_ael' && chip('松开', c.id, 'release')}
                {c.id === 'dial_rear_r' &&
                  chip(camera.rearLock ? '解锁拨盘' : '锁定拨盘', c.id, 'lock')}
                {c.press_directions
                  ?.filter((d) => d !== 'center')
                  .map((d) =>
                    chip(
                      {up: '上', down: '下', left: '左', right: '右'}[d as 'up'] +
                        (c.id === 'wheel'
                          ? {up: ' · DISP', down: '', left: ' · 拍摄模式', right: ' · ISO'}[
                              d as 'up'
                            ]
                          : ''),
                      c.id,
                      d as Operation,
                    ),
                  )}
                {c.id === 'wheel' && chip('中央确认', 'btn_center', 'click')}
              </>
            )}
          </View>
          {(camera.choice || camera.notice || screen.warning) && (
            <Txt accessibilityLiveRegion="polite" style={{color: color.accent}}>
              {camera.choice
                ? camera.choice.title + '　' + camera.choice.options[camera.choice.index]
                : camera.notice || screen.warning}
            </Txt>
          )}
          <View style={s.wrap}>
            {relatedLessons(c.id)
              .slice(0, 2)
              .map((l) => (
                <Button
                  key={l.id}
                  onPress={() => {
                    useAcademy.setState({lesson: l.id});
                    navigation.navigate('学习');
                  }}
                >
                  {l.id + ' ' + l.title}
                </Button>
              ))}
            <Button
              onPress={() => {
                useAcademy.setState({topic: c.id});
                navigation.navigate('AI 教练');
              }}
            >
              问 AI
            </Button>
          </View>
        </ScrollView>
      )}
      {!sel && !quiz && (
        <Txt style={[s.sub, {padding: 12, textAlign: 'center'}]}>
          拖动旋转 · 双指缩放 · 点按部件查看功能
        </Txt>
      )}
      {dictionary && <Dictionary close={() => setDictionary(false)} />}
    </View>
  );
}
