import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Image, Modal, NativeModules, ScrollView, TextInput, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {pick, isErrorWithCode, errorCodes} from '@react-native-documents/picker';
import {evaluatePhotos, type PreparedPhoto, type Report} from '../ai/photoReview';
import {
  loadService,
  localService,
  rememberCompatibility,
  readKey,
  readProtocol,
} from '../ai/services';
import {readReports, saveReport, type SavedReport} from '../data/db';
import type {FieldTask} from '../lessons/engine';
import {initialCamera} from '../camera/state';
import {byId} from '../camera/controls';
import type {ViewName} from '../bridge/camera';
import {CameraViewport} from './CameraStage';
import {Button, Card, Txt, color, styles as s} from './theme';
import {ModelPicker} from './ModelPicker';
import type {Protocol} from '../ai/types';
import {CoachMarkdown} from './CoachMarkdown';

const dimensionNames: Record<string, string> = {
  exposure: '曝光',
  focus: '对焦',
  sharpness: '清晰度',
  composition: '构图',
  light: '光线',
  color: '色彩',
  settings: '参数',
};
export function ReviewCard({report}: {report: Report}) {
  const {review, grade} = report;
  const [control, setControl] = useState<string | null>(null);
  const camera = useMemo(initialCamera, []);
  const highlight = useMemo(() => (control ? [control] : []), [control]);
  return (
    <Card>
      <CoachMarkdown text={review.title} textStyle={s.h2} />
      {grade && (
        <View>
          <Txt style={{color: grade.passed ? color.good : color.accent}}>
            {grade.passed ? '实拍验收通过' : '需要再拍一次'}
          </Txt>
          <CoachMarkdown text={grade.summary} />
          {grade.unmet.map((v, i) => (
            <Txt key={i} style={s.sub}>
              {'• ' + v}
            </Txt>
          ))}
        </View>
      )}
      <Txt style={s.sub}>
        {review.scores
          .map((v) => (dimensionNames[v.dimension] ?? v.dimension) + ' ' + v.score + '/5')
          .join('　')}
      </Txt>
      {review.fixes.map((fix, i) => (
        <View key={i} style={{gap: 5}}>
          <CoachMarkdown text={fix.problem} textStyle={s.h2} />
          <CoachMarkdown text={fix.cause} />
          <CoachMarkdown text={fix.fix} />
          <CoachMarkdown text={fix.how_on_camera} textStyle={s.sub} />
          <View style={s.wrap}>
            {fix.control_ids
              .filter((id) => byId[id])
              .map((id) => (
                <Button
                  key={id}
                  active={control === id}
                  onPress={() => setControl(control === id ? null : id)}
                >
                  {'在模型上看 ' + byId[id].name}
                </Button>
              ))}
          </View>
        </View>
      ))}
      {control && (
        <View style={{height: 220}}>
          <CameraViewport
            compact
            closeUp
            camera={camera}
            view={byId[control].zone as ViewName}
            highlight={highlight}
          />
        </View>
      )}
      {review.goods.map((good, i) => (
        <View key={i}>
          <CoachMarkdown text={good.point} textStyle={{color: color.good}} />
          <CoachMarkdown text={good.why} />
          <CoachMarkdown text={good.keep} textStyle={s.sub} />
        </View>
      ))}
    </Card>
  );
}

export function PhotoForm({
  task,
  lessonId,
  settings,
  onSaved,
}: {
  task?: FieldTask;
  lessonId?: string;
  settings: (protocol?: Protocol) => void;
  onSaved: () => void;
}) {
  const limit = task?.photos ?? 4;
  const [photos, setPhotos] = useState<(PreparedPhoto & {uri: string})[]>([]);
  const [intent, setIntent] = useState(''),
    [busy, setBusy] = useState(''),
    [message, setMessage] = useState('');
  const [error, setError] = useState(''),
    [report, setReport] = useState<Report | null>(() =>
      lessonId ? readReports(lessonId)[0]?.report ?? null : null,
    );
  const [service, setService] = useState(() => loadService(readProtocol()));
  const [pickingModel, setPickingModel] = useState(false);
  const lock = useRef(false),
    alive = useRef(true),
    controller = useRef<AbortController | null>(null);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      controller.current?.abort();
    };
  }, []);
  async function choose() {
    if (lock.current) return;
    lock.current = true;
    setError('');
    setBusy('选图');
    try {
      const selected = await pick({
        type: ['image/jpeg', 'image/heic', 'image/heif'],
        allowMultiSelection: limit - photos.length > 1,
      });
      if (!alive.current) return;
      const unique = selected.filter(
        (p, i, all) =>
          !photos.some((v) => v.uri === p.uri) && all.findIndex((v) => v.uri === p.uri) === i,
      );
      if (unique.length + photos.length > limit)
        throw new Error('本次最多选择 ' + limit + ' 张照片');
      const prepared = [...photos];
      for (const file of unique) {
        const data: PreparedPhoto = await NativeModules.PhotoPrep.prepare(file.uri);
        if (!alive.current) return;
        if (!prepared.some((v) => v.jpeg === data.jpeg)) prepared.push({...data, uri: file.uri});
      }
      setPhotos(prepared);
      setMessage('');
    } catch (e) {
      if (alive.current && !(isErrorWithCode(e) && e.code === errorCodes.OPERATION_CANCELED))
        setError(e instanceof Error ? e.message : '照片读取失败');
    } finally {
      lock.current = false;
      if (alive.current) setBusy('');
    }
  }
  async function submit() {
    if (lock.current) return;
    lock.current = true;
    const ctl = new AbortController();
    controller.current = ctl;
    setBusy('提交');
    setError('');
    setMessage('正在读取照片和拍摄参数…');
    try {
      const key = await readKey(service.id);
      if (!key && !localService(service))
        throw new Error('请先在「我的」保存模型服务和 API Key，再回到这里提交');
      const value = await evaluatePhotos(
        photos,
        task,
        intent,
        service,
        key,
        ctl.signal,
        (v) => {
          if (alive.current && !ctl.signal.aborted) setMessage(v);
        },
        rememberCompatibility,
      );
      if (!alive.current || ctl.signal.aborted) return;
      saveReport(value, lessonId);
      setReport(value);
      setMessage('');
      setPhotos([]);
      onSaved();
    } catch (e) {
      if (alive.current) {
        setMessage('');
        setError(
          ctl.signal.aborted ? '已停止，可重新提交' : e instanceof Error ? e.message : '复盘失败',
        );
      }
    } finally {
      lock.current = false;
      controller.current = null;
      if (alive.current) setBusy('');
    }
  }
  return (
    <>
      <Card>
        <Txt style={s.h2}>{task ? '提交实拍' : '新建照片复盘'}</Txt>
        <Txt style={s.sub}>
          {task ? '按任务顺序选择 ' + limit + ' 张照片。' : '选择 1–4 张照片。'}
          发送前会缩小图片并移除位置和序列号。
        </Txt>
        {!!photos.length && (
          <View style={s.wrap}>
            {photos.map((photo, i) => (
              <View key={photo.uri} style={{gap: 4}}>
                <Image
                  accessibilityLabel={'照片 ' + (i + 1)}
                  source={{uri: 'data:image/jpeg;base64,' + photo.jpeg}}
                  style={{width: 83, height: 66, borderRadius: 6}}
                />
                <Button
                  disabled={!!busy}
                  onPress={() => setPhotos((v) => v.filter((p) => p.uri !== photo.uri))}
                >
                  {'移除 ' + (i + 1)}
                </Button>
              </View>
            ))}
          </View>
        )}
        {photos.length < limit && (
          <Button disabled={!!busy} onPress={choose}>
            {'选择照片（' + photos.length + '/' + limit + '）'}
          </Button>
        )}
        <TextInput
          style={s.input}
          value={intent}
          onChangeText={setIntent}
          placeholder="拍摄意图（选填）"
          placeholderTextColor={color.muted}
        />
        <Txt style={s.sub}>{'将发送至 ' + service.baseUrl}</Txt>
        <Button disabled={!!busy} label="选择复盘模型" onPress={() => setPickingModel(true)}>
          {'模型 · ' + service.model}
        </Button>
        {busy === '提交' ? (
          <Button onPress={() => controller.current?.abort()}>停止复盘</Button>
        ) : (
          <Button
            primary
            disabled={!!busy || (task ? photos.length !== limit : !photos.length)}
            onPress={submit}
          >
            {task ? '发送并验收' : '发送并复盘'}
          </Button>
        )}
        {!!message && (
          <Txt accessibilityLiveRegion="polite" style={s.sub}>
            {message}
          </Txt>
        )}
        {!!error && (
          <Txt accessibilityLiveRegion="polite" style={{color: color.accent}}>
            {error}
          </Txt>
        )}
        <Button disabled={!!busy} onPress={() => settings(service.protocol)}>
          模型与 API 设置
        </Button>
      </Card>
      {pickingModel && (
        <ModelPicker
          current={service}
          close={() => setPickingModel(false)}
          choose={(next) => {
            setService(next);
            setPickingModel(false);
          }}
          settings={(protocol) => {
            setPickingModel(false);
            settings(protocol);
          }}
        />
      )}
      {report && <ReviewCard key={report.review.title} report={report} />}
    </>
  );
}
export function PhotoReviewScreen({
  close,
  settings,
}: {
  close: () => void;
  settings: (protocol?: Protocol) => void;
}) {
  const [history, setHistory] = useState<SavedReport[]>(readReports);
  const [active, setActive] = useState<SavedReport | null>(null);
  return (
    <Modal animationType="slide" onRequestClose={close}>
      <SafeAreaView style={s.screen}>
        <View style={[s.spread, {padding: 14}]}>
          <Txt style={s.h2}>照片复盘</Txt>
          <Button onPress={close}>返回教练</Button>
        </View>
        <ScrollView contentContainerStyle={s.pad} keyboardShouldPersistTaps="handled">
          {active ? (
            <>
              <Button onPress={() => setActive(null)}>返回复盘列表</Button>
              <ReviewCard report={active.report} />
            </>
          ) : (
            <>
              <PhotoForm settings={settings} onSaved={() => setHistory(readReports())} />
              {!!history.length && (
                <Card>
                  <Txt style={s.h2}>本机记录</Txt>
                  {history.map((item) => (
                    <Button key={item.id} onPress={() => setActive(item)}>
                      {item.createdAt.slice(0, 10) + '　' + item.report.review.title}
                    </Button>
                  ))}
                </Card>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
