import React, {useEffect, useRef, useState} from 'react';
import {FlatList, Keyboard, Modal, Pressable, TextInput, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Check} from 'lucide-react-native';
import {listModels} from '../ai/connection';
import {
  loadService,
  localService,
  readKey,
  rememberedModels,
  rememberModels,
  saveService,
} from '../ai/services';
import type {AiService} from '../ai/types';
import {Button, Txt, color, styles as s} from './theme';

export function ModelPicker({
  current,
  close,
  choose,
  settings,
}: {
  current: AiService;
  close: () => void;
  choose: (service: AiService) => void;
  settings: (protocol: AiService['protocol']) => void;
}) {
  const [service, setService] = useState(current),
    [query, search] = useState('');
  const [models, setModels] = useState<string[]>([]),
    [loading, setLoading] = useState(false);
  const [error, setError] = useState(''),
    [reload, refresh] = useState(0);
  const saving = useRef(false);
  useEffect(() => {
    const ctl = new AbortController();
    setModels([...new Set([service.model, ...rememberedModels(service.id)])]);
    setError('');
    setLoading(true);
    (async () => {
      const key = await readKey(service.id);
      if (ctl.signal.aborted) return;
      if (!key && !localService(service)) {
        setError('可输入模型 ID。获取服务列表需先配置 API Key。');
        return;
      }
      const list = await listModels(service, key, ctl.signal);
      if (ctl.signal.aborted) return;
      const all = [...new Set([service.model, ...list, ...rememberedModels(service.id)])];
      rememberModels(service.id, all);
      setModels(all);
      if (!list.length) setError('服务未返回模型，可直接输入模型 ID。');
    })()
      .catch((e) => {
        if (!ctl.signal.aborted)
          setError(e instanceof Error ? e.message : '获取失败，可输入模型 ID');
      })
      .finally(() => {
        if (!ctl.signal.aborted) setLoading(false);
      });
    return () => ctl.abort();
  }, [service, reload]);
  async function useModel(id: string) {
    if (saving.current || !id.trim()) return;
    saving.current = true;
    try {
      const next = await saveService(
        {
          ...service,
          model: id,
          disabled: id === service.model ? service.disabled : [],
        },
        '',
      );
      Keyboard.dismiss();
      choose(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : '模型保存失败');
    } finally {
      saving.current = false;
    }
  }
  const term = query.trim();
  const shown = models.filter((id) => id.toLowerCase().includes(term.toLowerCase()));
  return (
    <Modal animationType="slide" onRequestClose={close}>
      <SafeAreaView style={[s.screen, {padding: 16, gap: 12}]}>
        <View style={s.spread}>
          <Txt style={s.h2}>选择模型</Txt>
          <Button onPress={close}>返回</Button>
        </View>
        <View style={s.row}>
          {(['anthropic', 'openai'] as const).map((protocol) => (
            <Button
              key={protocol}
              active={service.protocol === protocol}
              onPress={() => {
                if (protocol !== service.protocol) {
                  search('');
                  setService(loadService(protocol));
                }
              }}
            >
              {protocol === 'anthropic' ? 'Messages API' : 'Responses API'}
            </Button>
          ))}
        </View>
        <Txt style={s.sub}>{service.baseUrl}</Txt>
        <TextInput
          accessibilityLabel="搜索或输入模型 ID"
          style={s.input}
          value={query}
          onChangeText={search}
          autoCorrect={false}
          disableFullscreenUI
          autoCapitalize="none"
          placeholder="搜索或输入模型 ID"
          placeholderTextColor={color.muted}
        />
        {!!term && !models.includes(term) && (
          <Button primary onPress={() => useModel(term)}>
            {'使用 ' + term}
          </Button>
        )}
        <View style={s.spread}>
          <Button disabled={loading} onPress={() => refresh((v) => v + 1)}>
            {loading ? '正在获取模型…' : '刷新模型列表'}
          </Button>
          <Button onPress={() => settings(service.protocol)}>配置服务</Button>
        </View>
        {!!error && (
          <Txt accessibilityLiveRegion="polite" style={s.sub}>
            {error}
          </Txt>
        )}
        <FlatList
          data={shown}
          keyExtractor={(id) => id}
          keyboardShouldPersistTaps="handled"
          renderItem={({item}) => {
            const selected = current.id === service.id && current.model === item;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={item}
                accessibilityState={{selected}}
                onPress={() => useModel(item)}
                style={({pressed}) => [
                  s.spread,
                  {
                    minHeight: 48,
                    paddingHorizontal: 8,
                    borderBottomColor: color.line,
                    borderBottomWidth: 1,
                    opacity: pressed ? 0.72 : 1,
                  },
                ]}
              >
                <Txt style={{flex: 1, color: selected ? color.accent : color.ink}}>{item}</Txt>
                {selected && <Check color={color.accent} size={18} />}
              </Pressable>
            );
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}
