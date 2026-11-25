import React, {useMemo, useState} from 'react';
import {Modal, ScrollView, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {demoFrames, sectionIds, type Lesson, type SectionId} from '../lessons/engine';
import {readSetting, writeSetting, type LessonProgress} from '../data/db';
import {act, screenState, type CameraState} from '../camera/state';
import {CameraViewport} from './CameraStage';
import {LessonReading} from './LessonReading';
import {LessonPractice} from './LessonPractice';
import {PhotoForm} from './PhotoReviewScreen';
import type {Protocol} from '../ai/types';
import {Button, Card, Txt, color, styles as s} from './theme';

export const sectionNames = {demo: '演示', read: '讲义', practice: '练习', task: '任务'};
type Progress = LessonProgress[string];
function Demo({
  lesson,
  start,
  advance,
}: {
  lesson: Lesson;
  start: number;
  advance: (cursor: number) => void;
}) {
  const frames = useMemo(() => demoFrames(lesson), [lesson]);
  const [i, go] = useState(Math.min(start, frames.length - 1));
  const [override, setOverride] = useState<CameraState | null>(null);
  const frame = frames[i],
    camera = override ?? frame.camera,
    screen = screenState(camera);
  function move(n: number) {
    setOverride(null);
    go(n);
  }
  return (
    <ScrollView contentContainerStyle={s.pad}>
      <Txt style={s.eyebrow}>
        第 {i + 1} / {frames.length} 步
      </Txt>
      <View style={{height: 245}}>
        <CameraViewport
          compact
          closeUp
          camera={camera}
          view={frame.view}
          highlight={frame.highlight}
          note={frame.highlight.length === 1 ? frame.note : undefined}
          animation={frame.animation}
          onInput={(id, op) => setOverride((c) => act(c ?? frame.camera, id, op))}
        />
      </View>
      <Txt style={s.num}>
        {screen.power
          ? screen.mode + '　F' + screen.aperture + '　' + screen.shutter + '　ISO ' + screen.iso
          : '电源 OFF'}
      </Txt>
      <Txt>{frame.text.replace(/\*\*/g, '')}</Txt>
      {frame.highlight.includes('card_door') && (
        <Button onPress={() => setOverride(act(camera, 'card_door'))}>
          {camera.cardDoorOpen ? '合上卡仓盖' : '打开卡仓看双卡槽'}
        </Button>
      )}
      <View style={s.spread}>
        <Button disabled={!i} onPress={() => move(i - 1)}>
          上一步
        </Button>
        <Button
          primary
          onPress={() => {
            advance(i + 1);
            if (i + 1 < frames.length) move(i + 1);
          }}
        >
          {i === frames.length - 1 ? '完成演示' : '下一步'}
        </Button>
      </View>
    </ScrollView>
  );
}
export function LessonScreen({
  lesson,
  progress,
  unlocked,
  previous,
  close,
  mark,
  locate,
  quiz,
  settings,
  refresh,
  nextLesson,
}: {
  lesson: Lesson;
  progress: Progress;
  unlocked: boolean;
  previous?: string;
  close: () => void;
  mark: (section: SectionId, cursor: number, complete: boolean) => void;
  locate: (id: string) => void;
  quiz: () => void;
  settings: (protocol?: Protocol) => void;
  refresh: () => void;
  nextLesson?: () => void;
}) {
  const task = lesson.sections[3];
  const bookmark = 'lesson-section-' + lesson.id;
  const [section, choose] = useState<SectionId>(() => {
    const saved = readSetting<SectionId | null>(bookmark, null);
    return saved && sectionIds.includes(saved)
      ? saved
      : sectionIds.find((id) => !progress[id]?.complete) ?? 'demo';
  });
  function enter(id: SectionId) {
    choose(id);
    writeSetting(bookmark, id);
  }
  const cursor = (id: SectionId) => (progress[id]?.complete ? 0 : progress[id]?.cursor ?? 0);
  const done = sectionIds.every((id) => progress[id]?.complete);
  return (
    <Modal animationType="slide" onRequestClose={close}>
      <SafeAreaView style={s.screen}>
        <View style={[s.spread, {padding: 14}]}>
          <View style={{flex: 1}}>
            <Txt style={s.eyebrow}>
              {lesson.id}　·　{lesson.minutes} 分钟
            </Txt>
            <Txt style={s.h2}>{lesson.title}</Txt>
          </View>
          <Button onPress={close}>返回学习</Button>
        </View>
        <View style={[s.wrap, {paddingHorizontal: 14, paddingBottom: 8}]}>
          {sectionIds.map((id) => (
            <Button key={id} active={id === section} onPress={() => enter(id)}>
              {sectionNames[id] + (progress[id]?.complete ? ' ✓' : '')}
            </Button>
          ))}
        </View>
        {!unlocked && (
          <Txt style={[s.sub, {paddingHorizontal: 16, paddingBottom: 5}]}>
            可预习本课。完成 {previous} 后开始记录进度。
          </Txt>
        )}
        {section === 'demo' && (
          <Demo
            lesson={lesson}
            start={cursor('demo')}
            advance={(n) => {
              const complete =
                n === lesson.sections[0].steps.filter((step) => step.tool === 'say_to_user').length;
              mark('demo', n, complete);
              if (complete) enter('read');
            }}
          />
        )}
        {section === 'read' && (
          <ScrollView contentContainerStyle={s.pad}>
            <Card>
              {lesson.goals.map((g) => (
                <Txt key={g}>{g}</Txt>
              ))}
            </Card>
            <LessonReading markdown={lesson.sections[1].markdown} onControl={locate} />
            <Button
              primary
              onPress={() => {
                mark('read', 1, true);
                enter('practice');
              }}
            >
              读完，进入练习
            </Button>
          </ScrollView>
        )}
        {section === 'practice' && (
          <LessonPractice
            items={lesson.sections[2].items}
            start={cursor('practice')}
            onAdvance={(n) => {
              const complete = n === lesson.sections[2].items.length;
              mark('practice', n, complete);
              if (complete) enter('task');
            }}
          />
        )}
        {section === 'task' && (
          <ScrollView contentContainerStyle={s.pad} keyboardShouldPersistTaps="handled">
            <Card>
              <Txt style={s.h2}>{task.title}</Txt>
              {task.steps.map((line, i) => (
                <Txt key={line}>{i + 1 + '　' + line}</Txt>
              ))}
              <Txt style={s.sub}>{'验收标准　' + task.success_criteria}</Txt>
              {progress.task?.complete && <Txt style={{color: color.good}}>任务已完成</Txt>}
            </Card>
            {done &&
              (nextLesson ? (
                <Button primary onPress={nextLesson}>
                  进入下一课
                </Button>
              ) : (
                <Txt style={{color: color.good}}>L0–L5 已全部完成</Txt>
              ))}
            {task.complete_by === 'ai' && unlocked && (
              <PhotoForm lessonId={lesson.id} task={task} settings={settings} onSaved={refresh} />
            )}
            {task.complete_by === 'practice_mode' && (
              <Button primary onPress={quiz}>
                开始十题找键
              </Button>
            )}
            {task.complete_by === 'self' && unlocked && (
              <Button onPress={() => mark('task', 1, true)}>我完成了</Button>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}
