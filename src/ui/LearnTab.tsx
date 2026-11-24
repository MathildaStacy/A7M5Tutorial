import React from 'react';
import {Modal, Pressable, ScrollView, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ArrowUpRight, Camera, ChevronRight} from 'lucide-react-native';
import {useAcademy} from '../camera/store';
import {byId, controls} from '../camera/controls';
import {lessons} from '../lessons/catalog';
import {Button, Card, Txt, color, styles as s} from './theme';
import type {TabProps} from './routes';
export function LearnTab({navigation}: TabProps<'学习'>) {
  const {known, best, lesson} = useAcademy();
  const entry = lessons.find((l) => l.id === lesson);
  const gotoCamera = (id?: string) => {
    useAcademy.setState({lesson: null});
    if (id) useAcademy.getState().select(id, true);
    navigation.navigate('相机');
  };
  function inline(text: string) {
    return text.split(/(\[\[[\w_]+\]\])/).map((part, i) => {
      const id = part.slice(2, -2);
      if (part.startsWith('[[') && byId[id])
        return (
          <Txt
            key={i}
            accessibilityRole="link"
            onPress={() => gotoCamera(id)}
            style={{color: color.accent}}
          >
            {byId[id].name}
          </Txt>
        );
      return part.replace(/\*\*/g, '');
    });
  }
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
      <Card>
        <Txt>在相机上找到 10 个部件</Txt>
        <Txt style={s.sub}>
          {best
            ? '历史最高 ' +
              best +
              ' / 10 · ' +
              (best === 10
                ? 'L1 实拍替代任务已完成'
                : best >= 8
                ? '已达标，满分完成 L1 任务'
                : '答对 8 题达标')
            : '答对 8 题达标，满分完成 L1 任务'}
        </Txt>
        <Button
          onPress={() => {
            useAcademy.getState().startQuiz();
            navigation.navigate('相机');
          }}
        >
          开始找键练习
        </Button>
      </Card>
      <Txt style={s.h2}>课程预览</Txt>
      <Card>
        {lessons.map((l) => (
          <Pressable
            key={l.id}
            accessibilityRole="button"
            onPress={() => useAcademy.setState({lesson: l.id})}
            style={[s.spread, {paddingVertical: 9}]}
          >
            <View style={s.row}>
              <Txt style={[s.num, {color: color.accent}]}>{l.id}</Txt>
              <Txt>{l.title}</Txt>
            </View>
            <View style={s.row}>
              <Txt style={s.sub}>{l.minutes} 分钟</Txt>
              <ChevronRight size={16} color={color.muted} />
            </View>
          </Pressable>
        ))}
      </Card>
      {entry && (
        <Modal animationType="slide" onRequestClose={() => useAcademy.setState({lesson: null})}>
          <SafeAreaView style={s.screen}>
            <View style={[s.spread, {padding: 16}]}>
              <Txt style={s.h2}>
                {entry.id} · {entry.title}
              </Txt>
              <Button onPress={() => useAcademy.setState({lesson: null})}>返回学习</Button>
            </View>
            <ScrollView contentContainerStyle={s.pad}>
              <Card>
                {entry.goals.map((g) => (
                  <Txt key={g}>{g}</Txt>
                ))}
              </Card>
              {(entry.sections.find((z) => z.kind === 'read')?.markdown ?? '')
                .split('\n')
                .map((line, i) => {
                  const text = line.trim();
                  if (!text || /^\|[-: |]+\|$/.test(text)) return null;
                  if (text.startsWith('|'))
                    return (
                      <View
                        key={i}
                        style={[
                          s.row,
                          {
                            alignItems: 'flex-start',
                            borderBottomWidth: 1,
                            borderColor: color.line,
                            paddingBottom: 5,
                          },
                        ]}
                      >
                        {text
                          .slice(1, -1)
                          .split('|')
                          .map((v, j) => (
                            <Txt key={j} style={[s.sub, {flex: 1}]}>
                              {inline(v.trim())}
                            </Txt>
                          ))}
                      </View>
                    );
                  return (
                    <Txt key={i} style={text.startsWith('#') ? s.h2 : undefined}>
                      {inline(text.replace(/^#{1,4} +/, ''))}
                    </Txt>
                  );
                })}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}
    </ScrollView>
  );
}
