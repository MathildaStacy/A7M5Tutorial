import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {Alert, ScrollView, TextInput, View} from 'react-native';
import {Button, Card, Txt, color, styles as s} from './theme';
import {
  loadService,
  rememberCompatibility,
  readKey,
  readProtocol,
  rememberModels,
  saveService,
  serviceId,
} from '../ai/services';
import {clearReports} from '../data/db';
import {testConnection, listModels} from '../ai/connection';
import type {Protocol, Effort} from '../ai/types';
import type {TabProps} from './routes';

export function SettingsTab({route, navigation}: TabProps<'我的'>) {
  const [form, set] = useState(() => loadService(readProtocol())),
    [key, setKey] = useState(''),
    [tail, tailSet] = useState(''),
    [busy, working] = useState(false),
    [result, show] = useState(''),
    [models, choices] = useState<string[]>([]);
  const savedForm = useRef(JSON.stringify(form));
  useFocusEffect(
    useCallback(() => {
      const latest = loadService(readProtocol());
      const requested = route.params?.protocol;
      if (requested || JSON.stringify(latest) !== savedForm.current) {
        savedForm.current = JSON.stringify(latest);
        set(requested ? loadService(requested) : latest);
        setKey('');
        choices([]);
        show('');
        if (requested) navigation.setParams({protocol: undefined});
      }
    }, [route.params?.protocol, navigation]),
  );
  let currentId = '';
  try {
    currentId = serviceId(form.protocol, form.baseUrl);
  } catch {}
  useEffect(() => {
    let live = true;
    tailSet('');
    if (currentId)
      readKey(currentId).then(
        (k) => {
          if (live) tailSet(k.slice(-4));
        },
        () => {},
      );
    return () => {
      live = false;
    };
  }, [currentId]);
  function changeProtocol(p: Protocol) {
    set(loadService(p));
    setKey('');
    show('');
    choices([]);
  }
  async function commit(action: 'save' | 'test' | 'models') {
    if (busy) return;
    working(true);
    show('');
    try {
      if (action === 'models') {
        const id = serviceId(form.protocol, form.baseUrl);
        const list = await listModels({...form, id}, key.trim() || (await readKey(id)));
        rememberModels(id, list);
        choices(list);
        show(list.length ? '选择模型后点保存' : '服务未返回模型，可手动输入');
        return;
      }
      const saved = await saveService(form, key);
      savedForm.current = JSON.stringify(saved);
      set(saved);
      const stored = await readKey(saved.id);
      setKey('');
      tailSet(stored.slice(-4));
      if (action === 'test')
        show(
          await testConnection(saved, stored, (s) => {
            rememberCompatibility(s);
            set(s);
          }),
        );
      else show('设置已保存');
    } catch (e) {
      show(e instanceof Error ? e.message : String(e));
    } finally {
      working(false);
    }
  }
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.pad} keyboardShouldPersistTaps="handled">
      <Txt style={s.title}>我的</Txt>
      <Card>
        <Txt style={s.h2}>模型与 API</Txt>
        <View style={s.wrap}>
          {(['anthropic', 'openai'] as const).map((p) => (
            <Button
              key={p}
              active={p === form.protocol}
              disabled={busy}
              onPress={() => changeProtocol(p)}
            >
              {p === 'anthropic' ? 'Messages API' : 'Responses API'}
            </Button>
          ))}
        </View>
        <Txt style={s.sub}>服务地址</Txt>
        <TextInput
          accessibilityLabel="服务地址"
          editable={!busy}
          style={s.input}
          autoCapitalize="none"
          autoCorrect={false}
          value={form.baseUrl}
          onChangeText={(baseUrl) => {
            set({...form, baseUrl});
            setKey('');
            choices([]);
            show('');
          }}
        />
        <Txt style={s.sub}>模型</Txt>
        <TextInput
          accessibilityLabel="模型名称"
          editable={!busy}
          style={s.input}
          autoCapitalize="none"
          autoCorrect={false}
          value={form.model}
          onChangeText={(model) => set({...form, model})}
        />
        <Button disabled={busy} onPress={() => commit('models')}>
          获取模型列表
        </Button>
        {models.length > 0 && (
          <View style={s.wrap}>
            {models.map((m) => (
              <Button
                key={m}
                onPress={() => {
                  set({...form, model: m});
                  choices([]);
                }}
              >
                {m}
              </Button>
            ))}
          </View>
        )}
        <Txt style={s.sub}>API Key{tail ? ' · 已保存，末四位 ' + tail : ''}</Txt>
        <TextInput
          accessibilityLabel="API Key"
          secureTextEntry
          editable={!busy}
          value={key}
          onChangeText={setKey}
          placeholder={tail ? '输入新 Key 以更换' : '输入 API Key'}
          placeholderTextColor={color.muted}
          style={s.input}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Txt style={s.sub}>思考强度</Txt>
        <View style={s.wrap}>
          {(['low', 'medium', 'high'] as Effort[]).map((v, i) => (
            <Button
              key={v}
              disabled={busy}
              active={form.effort === v}
              onPress={() => set({...form, effort: v})}
            >
              {['低', '中', '高'][i]}
            </Button>
          ))}
        </View>
        <View style={s.row}>
          <Button primary disabled={busy} onPress={() => commit('save')}>
            保存设置
          </Button>
          <Button disabled={busy} onPress={() => commit('test')}>
            测试连接
          </Button>
        </View>
        {busy && <Txt style={s.sub}>处理中…</Txt>}
        {!!result && <Txt accessibilityLiveRegion="polite">{result}</Txt>}
      </Card>
      <Txt style={s.sub}>
        Key 保存在 Android Keystore。连接测试发送一张内置色块，检验图片输入和工具调用。
      </Txt>
      <Card>
        <Txt style={s.h2}>复盘记录</Txt>
        <Txt style={s.sub}>评语保存在本机。清除后，已完成的课程仍会保留。</Txt>
        <Button
          onPress={() =>
            Alert.alert('清除全部复盘记录？', '这会删除本机保存的照片评语和验收详情。', [
              {text: '取消', style: 'cancel'},
              {
                text: '清除',
                style: 'destructive',
                onPress: () => {
                  clearReports();
                  show('复盘记录已清除');
                },
              },
            ])
          }
        >
          清除全部复盘记录
        </Button>
      </Card>
    </ScrollView>
  );
}
