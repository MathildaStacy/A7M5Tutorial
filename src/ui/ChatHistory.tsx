import React from 'react';
import {Alert, FlatList, Modal, Pressable, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Check, Trash2} from 'lucide-react-native';
import type {ChatSummary} from '../data/coachChats';
import {Button, Txt, color, styles as s} from './theme';

export function ChatHistory({
  chats,
  active,
  close,
  select,
  remove,
}: {
  chats: ChatSummary[];
  active: number | null;
  close: () => void;
  select: (id: number | null) => void;
  remove: (id: number) => void;
}) {
  return (
    <Modal animationType="slide" onRequestClose={close}>
      <SafeAreaView style={[s.screen, {padding: 16, gap: 14}]}>
        <View style={s.spread}>
          <Txt style={s.h2}>对话记录</Txt>
          <Button onPress={close}>返回</Button>
        </View>
        <Button primary onPress={() => select(null)}>
          新建对话
        </Button>
        <FlatList
          data={chats}
          keyExtractor={(c) => String(c.id)}
          ListEmptyComponent={<Txt style={s.sub}>发送第一个问题后，对话会保存在这里。</Txt>}
          renderItem={({item}) => (
            <View style={[s.row, {borderBottomWidth: 1, borderColor: color.line}]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={item.title}
                accessibilityState={{selected: active === item.id}}
                onPress={() => select(item.id)}
                style={({pressed}) => [
                  s.row,
                  {flex: 1, paddingVertical: 12, opacity: pressed ? 0.7 : 1},
                ]}
              >
                <View style={{flex: 1, gap: 4}}>
                  <Txt numberOfLines={2}>{item.title}</Txt>
                  <Txt style={s.sub}>{new Date(item.updatedAt).toLocaleString()}</Txt>
                </View>
                {active === item.id && <Check color={color.accent} size={17} />}
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={'删除对话 ' + item.title}
                style={{padding: 12}}
                onPress={() =>
                  Alert.alert('删除这段对话？', item.title, [
                    {text: '取消', style: 'cancel'},
                    {
                      text: '删除',
                      style: 'destructive',
                      onPress: () => remove(item.id),
                    },
                  ])
                }
              >
                <Trash2 color={color.muted} size={17} />
              </Pressable>
            </View>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}
