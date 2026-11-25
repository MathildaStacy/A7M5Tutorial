import {lessons} from '../src/lessons/catalog';
import {
  applyLessonSettings,
  demoFrames,
  exposureMatches,
  operationMatches,
} from '../src/lessons/engine';
import {act, initialCamera, screenState} from '../src/camera/state';
import {evaluatePhotos, type PreparedPhoto} from '../src/ai/photoReview';
import {type AiService, type Protocol} from '../src/ai/types';
import type {FetchLike} from '../src/ai/http';
const {message, stream} = require('../scripts/mock-ai.cjs');

test('六课的每段解说有可重播的镜头，L0 关机换卡后开机', () => {
  for (const lesson of lessons) {
    const frames = demoFrames(lesson);
    expect(frames.map((f) => f.text)).toEqual(
      lesson.sections[0].steps.flatMap((s) => (s.tool === 'say_to_user' ? [s.args.text] : [])),
    );
  }
  const frames = demoFrames(lessons[0]),
    cards = frames.find((f) => f.highlight.includes('card_door'))!;
  expect(cards.camera.power).toBe(false);
  const opened = act(cards.camera, 'card_door');
  expect(screenState(opened).cardDoorOpen).toBe(true);
  expect(screenState(act(opened, 'card_door')).cardDoorOpen).toBe(false);
  expect(frames.at(-1)?.camera.power).toBe(true);
});
test('操作题用实际机身状态判定，C2 选项须经中央键确认', () => {
  const item = lessons[5].sections[2].items.find(
    (v) => v.type === 'operate' && v.control === 'btn_c2',
  );
  if (!item || item.type !== 'operate') throw new Error('缺 C2 题');
  let state = act(applyLessonSettings(initialCamera(), item.start), 'btn_c2');
  expect(operationMatches(state, item.expect)).toBe(false);
  while (state.choice!.options[state.choice!.index] !== '点: M')
    state = act(state, 'wheel', 'plus');
  expect(operationMatches(state, item.expect)).toBe(false);
  expect(operationMatches(act(state, 'btn_center'), item.expect)).toBe(true);
});
test('曝光题服从锁定值、模式和目标范围', () => {
  for (const lesson of lessons)
    for (const q of lesson.sections[2].items)
      if (q.type === 'set_exposure') {
        const start = {...initialCamera(), ...q.start, mode: q.mode, scene_ev: q.scene_ev};
        expect(exposureMatches(start, q.goal)).toBe(false);
        const selected = {...start, ...q._example_solution};
        for (const field of ['aperture', 'shutter', 'iso', 'ev'] as const)
          if (q.lock.includes(field)) Object.assign(selected, {[field]: start[field]});
        expect(exposureMatches(selected, q.goal)).toBe(true);
      }
});
const photo: PreparedPhoto = {
  jpeg: 'QUJD',
  width: 600,
  height: 400,
  format: 'image/jpeg',
  exif: {camera: 'Test'},
  histogram: {p50: 100},
};
const task = lessons[0].sections[3];
const service: AiService = {
  id: 'local',
  baseUrl: 'http://localhost',
  model: 'shutter-mock',
  protocol: 'anthropic',
  effort: 'medium',
  disabled: [],
};
test.each<Protocol>(['anthropic', 'openai'])(
  '%s 实拍复盘先交报告再按原条目验收',
  async (protocol) => {
    const transport: FetchLike = async (_url, init) => {
      const body = JSON.parse(init.body);
      const events = stream(message(body, protocol === 'anthropic'), protocol === 'anthropic');
      return {
        status: 200,
        text: async () => events.map((e: object) => 'data: ' + JSON.stringify(e) + '\n\n').join(''),
      };
    };
    for (const failed of [true, false]) {
      const report = await evaluatePhotos(
        [photo],
        task,
        failed ? '演示未通过' : '',
        {...service, protocol},
        '',
        new AbortController().signal,
        () => {},
        () => {},
        transport,
      );
      expect(report.review.title).toBe('本地模拟复盘');
      expect(report.grade).toMatchObject({
        passed: !failed,
        unmet: failed ? [task.ai_rubric![0]] : [],
      });
    }
    const free = await evaluatePhotos(
      [photo],
      undefined,
      '',
      {...service, protocol},
      '',
      new AbortController().signal,
      () => {},
      () => {},
      transport,
    );
    expect(free.grade).toBeNull();
  },
);
test('缺少照片或模型只说完成都不能给课程记分', async () => {
  const run = (photos: PreparedPhoto[], fetchImpl: FetchLike) =>
    evaluatePhotos(
      photos,
      task,
      '',
      service,
      '',
      new AbortController().signal,
      () => {},
      () => {},
      fetchImpl,
    );
  const empty = jest.fn();
  await expect(run([], empty)).rejects.toThrow('数量');
  expect(empty).not.toHaveBeenCalled();
  await expect(
    run([photo], async () => ({
      status: 200,
      text: async () =>
        JSON.stringify({content: [{type: 'text', text: '已完成'}], stop_reason: 'end_turn'}),
    })),
  ).rejects.toThrow('未返回完整');
});
