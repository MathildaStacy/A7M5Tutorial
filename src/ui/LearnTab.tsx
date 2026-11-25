import React, {useCallback, useState} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {Pressable, ScrollView, View} from 'react-native';
import {ArrowUpRight, Camera, ChevronRight} from 'lucide-react-native';
import {useAcademy} from '../camera/store';
import {controls} from '../camera/controls';
import {readLessonProgress, recordLessonSection, writeSetting} from '../data/db';
import {sectionIds, type SectionId} from '../lessons/engine';
import {LessonScreen} from './LessonScreen';
import {lessons} from '../lessons/catalog';
import {Button, Card, Txt, color, styles as s} from './theme';
import type {TabProps} from './routes';
export function LearnTab({navigation}: TabProps<'学习'>) {
  const {known, best, lesson} = useAcademy();
  const [progress, setProgress] = useState(readLessonProgress);
  const refresh = useCallback(() => setProgress(readLessonProgress()), []);
  useFocusEffect(refresh);
  const completed = (id: string) => sectionIds.filter((k) => progress[id]?.[k]?.complete).length;
  const first = lessons.findIndex((l) => completed(l.id) !== 4);
  const active = first < 0 ? undefined : lessons[first];
  const index = lessons.findIndex((l) => l.id === lesson);
  const entry = lessons[index];
  const unlocked = first < 0 || index <= first;
  const close = () => useAcademy.setState({lesson: null});
  const gotoCamera = (id?: string) => {
    close();
    useAcademy.getState().endQuiz();
    if (id) useAcademy.getState().select(id, true);
    navigation.navigate('相机');
  };
  const quiz = () => {
    close();
    useAcademy.getState().startQuiz();
    navigation.navigate('相机');
  };
  const open = (id: string, section?: SectionId) => {
    if (section) writeSetting('lesson-section-' + id, section);
    useAcademy.setState({lesson: id});
  };
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.pad}>
      <View>
        <Txt style={s.eyebrow}>α7 V　/　FE 24–70 GM II</Txt>
        <Txt style={s.title}>学习</Txt>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="进入 3D 相机"
        onPress={() => gotoCamera()}
      >
        <Card style={{padding: 19, gap: 14}}>
          <View style={s.spread}>
            <Camera color={color.accent} size={28} />
            <ArrowUpRight color={color.sub} size={22} />
          </View>
          <View>
            <Txt style={s.h2}>认识你的相机</Txt>
            <Txt style={s.sub}>点按机身或镜头上的部件，试着操作一次。</Txt>
          </View>
          <View style={{height: 5, borderRadius: 3, backgroundColor: color.line}}>
            <View
              style={{
                height: 5,
                width: `${(known.length / controls.length) * 100}%`,
                borderRadius: 3,
                backgroundColor: color.accent,
              }}
            />
          </View>
          <Txt style={s.sub}>
            已认识 {known.length} / {controls.length} 个部件
          </Txt>
        </Card>
      </Pressable>
      <Txt style={s.h2}>今日任务</Txt>
      {active && (
        <Card>
          <Txt style={s.h2}>{active.id + ' · ' + active.title}</Txt>
          <Txt style={s.sub}>{active.sections[3].title}</Txt>
          <View style={s.wrap}>
            <Button primary onPress={() => open(active.id)}>
              继续学习
            </Button>
            <Button onPress={() => open(active.id, 'task')}>查看任务</Button>
          </View>
        </Card>
      )}
      <Card>
        <View style={s.spread}>
          <View style={{flex: 1}}>
            <Txt>在相机上找到 10 个部件</Txt>
            <Txt style={s.sub}>
              {best ? '历史最高 ' + best + '/10' : '答对 8 题达标，满分完成 L1 任务'}
            </Txt>
          </View>
          <Button onPress={quiz}>找键练习</Button>
        </View>
      </Card>
      <Txt style={s.h2}>学习路径</Txt>
      <Card>
        {lessons.map((l, i) => (
          <Pressable
            key={l.id}
            accessibilityRole="button"
            onPress={() => open(l.id)}
            style={[s.spread, {paddingVertical: 9}]}
          >
            <View style={s.row}>
              <Txt style={[s.num, {color: color.accent}]}>{l.id}</Txt>
              <Txt>{l.title}</Txt>
            </View>
            <View style={s.row}>
              <Txt style={s.sub}>
                {completed(l.id) === 4
                  ? '已完成'
                  : first >= 0 && i > first
                  ? '预习'
                  : completed(l.id) + ' / 4 段'}
              </Txt>
              <ChevronRight size={16} color={color.muted} />
            </View>
          </Pressable>
        ))}
      </Card>
      {entry && (
        <LessonScreen
          key={entry.id}
          lesson={entry}
          progress={progress[entry.id] ?? {}}
          unlocked={unlocked}
          previous={lessons[index - 1]?.id}
          close={close}
          locate={gotoCamera}
          quiz={quiz}
          settings={(protocol) => {
            close();
            navigation.navigate('我的', {protocol});
          }}
          refresh={refresh}
          mark={(section, cursor, complete) => {
            if (unlocked) {
              recordLessonSection(entry.id, section, cursor, complete);
              refresh();
            }
          }}
          nextLesson={lessons[index + 1] ? () => open(lessons[index + 1].id) : undefined}
        />
      )}
    </ScrollView>
  );
}
