import React, {useCallback, useEffect, useRef, useState} from 'react';
import {AppState, StyleSheet, View, Vibration} from 'react-native';
import {useIsFocused} from '@react-navigation/native';
import WebView from 'react-native-webview';
import {createBridge, type Command} from '../bridge/camera';
import {byId} from '../camera/controls';
import {useAcademy} from '../camera/store';
import {screenState, operations} from '../camera/state';
import {Button, Txt, color} from './theme';
const source = {uri: 'file:///android_asset/camera3d/index.html'};
export function CameraStage() {
  const web = useRef<WebView<object>>(null),
    [epoch, reload] = useState(0),
    [ready, setReady] = useState(false),
    [error, setError] = useState('');
  const focused = useIsFocused(),
    [foreground, setForeground] = useState(AppState.currentState === 'active');
  const {camera, selected, view, labels, lcd, quiz} = useAcademy();
  const [bridge] = useState(() =>
    createBridge((e) => {
      if (e.ev === 'ready') {
        setReady(true);
        setError('');
        return;
      }
      if (e.ev === 'fatal') {
        setError(e.message);
        setReady(false);
        return;
      }
      const state = useAcademy.getState();
      if (!byId[e.control]) return;
      if (e.ev === 'pick') state.select(e.control);
      if (e.ev === 'input' && !state.quiz && operations.includes(e.op)) {
        state.operate(e.control, e.op);
        Vibration.vibrate(12);
      }
    }),
  );
  const detach = useRef<(() => void) | undefined>(undefined);
  const mount = useCallback(
    (node: WebView<object> | null) => {
      detach.current?.();
      web.current = node;
      if (node) detach.current = bridge.attach((payload) => node.postMessage(payload));
    },
    [bridge],
  );
  const send = useCallback(
    (c: Command) => {
      bridge.request(c).catch((err) => {
        if (web.current && err.message === '3D 请求超时') setError(err.message);
      });
    },
    [bridge],
  );
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => setForeground(s === 'active'));
    return () => sub.remove();
  }, []);
  useEffect(() => {
    if (ready) send({cmd: 'sync', state: screenState(camera)});
  }, [camera, ready, send]);
  useEffect(() => {
    if (ready) send({cmd: 'view', view});
  }, [view, ready, send]);
  useEffect(() => {
    if (ready) send({cmd: 'labels', on: labels && !quiz});
  }, [labels, !!quiz, ready, send]);
  useEffect(() => {
    if (ready) send({cmd: 'highlight', ids: selected && !quiz ? [selected] : []});
  }, [selected, !!quiz, ready, send]);
  useEffect(() => {
    if (ready) send({cmd: 'lcd', on: lcd});
  }, [lcd, ready, send]);
  useEffect(() => {
    if (ready) send({cmd: focused && foreground ? 'resume' : 'pause'});
  }, [ready, focused, foreground, send]);
  useEffect(
    () =>
      useAcademy.subscribe((state, prev) => {
        if (ready && state.animation !== prev.animation && state.animation)
          send({cmd: 'animate', ...state.animation});
      }),
    [ready, send],
  );
  function retry() {
    bridge.fail();
    setError('');
    setReady(false);
    reload((n) => n + 1);
  }
  return (
    <View style={{flex: 1, minHeight: 100, backgroundColor: color.card}}>
      <WebView<object>
        key={epoch}
        ref={mount}
        source={source}
        style={{flex: 1, backgroundColor: color.card}}
        originWhitelist={['file://*']}
        allowFileAccess
        allowFileAccessFromFileURLs
        allowUniversalAccessFromFileURLs={false}
        onShouldStartLoadWithRequest={(r) => r.url === source.uri || r.url === 'about:blank'}
        setSupportMultipleWindows={false}
        onMessage={(e) => bridge.receive(e.nativeEvent.data)}
        onRenderProcessGone={retry}
        onError={(e) => {
          bridge.fail();
          setReady(false);
          setError(e.nativeEvent.description);
        }}
        scrollEnabled={false}
        overScrollMode="never"
      />
      {!!error && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {backgroundColor: color.card, alignItems: 'center', justifyContent: 'center', gap: 12},
          ]}
        >
          <Txt>3D 相机暂时无法显示</Txt>
          <Txt style={{color: color.sub}}>{error}</Txt>
          <Button onPress={retry}>重新加载</Button>
        </View>
      )}
      {!ready && !error && (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {alignItems: 'center', justifyContent: 'center', backgroundColor: color.card},
          ]}
        >
          <Txt>正在加载离线相机…</Txt>
        </View>
      )}
    </View>
  );
}
