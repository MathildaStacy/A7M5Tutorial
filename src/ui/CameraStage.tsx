import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {AppState, StyleSheet, View, Vibration} from 'react-native';
import {useIsFocused} from '@react-navigation/native';
import WebView from 'react-native-webview';
import {createBridge, type Command, type ViewName} from '../bridge/camera';
import {byId} from '../camera/controls';
import {useAcademy} from '../camera/store';
import {screenState, operations, type CameraState, type Operation} from '../camera/state';
import {Button, Txt, color} from './theme';
const cameraSource = {uri: 'file:///android_asset/camera3d/index.html'};
const lessonSource = {uri: cameraSource.uri + '?lod=1'};
type Animation = Omit<Extract<Command, {cmd: 'animate'}>, 'cmd'>;

export function CameraStage({closeUp}: {closeUp: boolean}) {
  const {camera, selected, view, labels, lcd, quiz, animation} = useAcademy();
  const highlight = useMemo(() => (selected && !quiz ? [selected] : []), [selected, quiz]);
  return (
    <CameraViewport
      camera={camera}
      view={view}
      highlight={highlight}
      closeUp={closeUp}
      labels={labels && !quiz}
      lcd={lcd}
      animation={animation}
      onPick={(id) => useAcademy.getState().select(id)}
      onInput={(id, op) => {
        const current = useAcademy.getState();
        if (!current.quiz) {
          current.operate(id, op);
          Vibration.vibrate(12);
        }
      }}
    />
  );
}

interface ViewportProps {
  camera: CameraState;
  view: ViewName;
  highlight: string[];
  labels?: boolean;
  lcd?: boolean;
  compact?: boolean;
  closeUp?: boolean;
  animation?: Animation | null;
  note?: string;
  onPick?: (id: string) => void;
  onInput?: (id: string, op: Operation) => void;
}

export function CameraViewport({
  camera,
  view,
  highlight,
  labels = false,
  lcd = false,
  compact = false,
  closeUp = false,
  animation,
  note,
  onPick,
  onInput,
}: ViewportProps) {
  const source = compact ? lessonSource : cameraSource;
  const focus = closeUp && highlight.length ? highlight : undefined;
  const handlers = useRef({onPick, onInput});
  handlers.current = {onPick, onInput};
  const web = useRef<WebView<object>>(null),
    [epoch, reload] = useState(0),
    [ready, setReady] = useState(false),
    [error, setError] = useState('');
  const focused = useIsFocused(),
    [foreground, setForeground] = useState(AppState.currentState === 'active');
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
      if (!byId[e.control]) return;
      if (e.ev === 'pick') handlers.current.onPick?.(e.control);
      if (e.ev === 'input' && operations.includes(e.op))
        handlers.current.onInput?.(e.control, e.op);
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
    if (ready) send({cmd: 'view', view, focus});
  }, [view, focus, ready, send]);
  useEffect(() => {
    if (ready) send({cmd: 'labels', on: labels});
  }, [labels, ready, send]);
  useEffect(() => {
    if (ready) send({cmd: 'highlight', ids: highlight, note});
  }, [highlight, note, ready, send]);
  useEffect(() => {
    if (ready) send({cmd: 'lcd', on: lcd});
  }, [lcd, ready, send]);
  useEffect(() => {
    if (ready) send({cmd: focused && foreground ? 'resume' : 'pause'});
  }, [ready, focused, foreground, send]);
  useEffect(() => {
    if (ready && animation) send({cmd: 'animate', ...animation});
  }, [animation, ready, send]);
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
