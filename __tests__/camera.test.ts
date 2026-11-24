import {solve, seconds, type ExposureSettings} from '../src/camera/exposure';
import {act, initialCamera, screenState, displays} from '../src/camera/state';
import {controls, searchControls} from '../src/camera/controls';
import {startPractice, answerPractice} from '../src/camera/practice';
import {lessons} from '../src/lessons/catalog';
import tools from '../docs/spec/camera-tools.json';
import cases from '../docs/spec/manual-kb.tests.json';
import {lookupManual} from '../src/ai/coach/kb';
import Ajv from 'ajv';
const base: ExposureSettings = {
  scene_ev: 14,
  mode: 'A',
  aperture: 2.8,
  shutter: '1/60',
  iso: 100,
  ev: 0,
};
test.each<[Partial<ExposureSettings>, string, number, number]>([
  [{}, '1/2000', 2.8, 100],
  [{ev: 1.3}, '1/800', 2.8, 100],
  [{scene_ev: 3, mode: 'P', iso: 800}, '1/8', 2.8, 800],
  [{scene_ev: 3, mode: 'S', iso: 'AUTO'}, '1/60', 2.8, 6400],
  [{scene_ev: 3}, '1"', 2.8, 100],
  [{scene_ev: 15}, '1/4000', 2.8, 100],
  [{scene_ev: 15, aperture: 8}, '1/500', 8, 100],
])('曝光求解 %j → %s', (settings, shutter, aperture, iso) =>
  expect(solve({...base, ...settings})).toMatchObject({shutter, aperture, iso, warning: ''}),
);
test('极限有告警，手动 ISO 的 M 档不应用补偿', () => {
  expect(solve({...base, scene_ev: 23}).warning).toContain('过曝');
  expect(solve({...base, scene_ev: -6, mode: 'S', iso: 'AUTO'})).toMatchObject({iso: 12800});
  expect(solve({...base, mode: 'M', ev: 2})).toEqual(solve({...base, mode: 'M'}));
});
test('模式、光圈与锁定和镜头互锁', () => {
  let s = {...initialCamera(), mode: 'AUTO' as const};
  expect(act(act(s, 'mode_dial', 'plus'), 'mode_dial', 'plus').mode).toBe('A');
  const a = initialCamera();
  expect(act(a, 'dial_front', 'plus').aperture).toBe(3.2);
  expect(a.aperture).toBe(2.8);
  const fixed = act(a, 'ring_aperture', 'plus');
  expect(screenState(act(fixed, 'dial_front', 'plus')).aperture).toBe(2.8);
  expect(act(act(a, 'sw_iris_lock'), 'ring_aperture', 'plus').ring).toBe('A');
  expect(act(act(a, 'dial_rear_r', 'lock'), 'dial_rear_r', 'plus').ev).toBe(0);
});
test('四向拨轮和 ISO AUTO 可往返确认', () => {
  let s = initialCamera();
  for (let i = 1; i <= displays.length; i++) {
    s = act(s, 'wheel', 'up');
    expect(s.display).toBe(i % 4);
  }
  expect(act(s, 'wheel', 'down').choice).toBeNull();
  expect(act(s, 'wheel', 'left').choice?.field).toBe('drive');
  s = act(act(act(s, 'wheel', 'right'), 'wheel', 'plus'), 'btn_center');
  expect(s.iso).toBe(100);
  s = act(act(act(s, 'wheel', 'right'), 'wheel', 'minus'), 'btn_center');
  expect(s.iso).toBe('AUTO');
});
test('拍摄、保护和删除保持快门时的读数', () => {
  let s = act(initialCamera(), 'shutter', 'half');
  expect(s.photos).toHaveLength(0);
  s = act(act(s, 'shutter'), 'btn_play');
  expect(s.photos[0].shutter).toBe('1/500');
  s = act(act(s, 'btn_c3'), 'btn_c4');
  expect(s.notice).toContain('保护');
  s = act(act(act(act(s, 'btn_c3'), 'btn_c4'), 'wheel', 'minus'), 'btn_center');
  expect(s.photos).toHaveLength(0);
});
test('部件搜索和工具的部件枚举共用 36 个节点', () => {
  expect(controls).toHaveLength(36);
  expect(searchControls('曝光补偿')[0].id).toBe('dial_rear_r');
  expect(searchControls('白平衡')[0].id).toBe('btn_c1');
  const highlight = tools.tools.find((t) => t.name === 'highlight_control')!;
  expect(highlight.input_schema.properties.control_ids?.items.enum).toEqual(
    controls.map((c) => c.id),
  );
});
test('十个不同的找键题，最终计时计分固定', () => {
  let p = startPractice(100);
  expect(new Set(p.questions).size).toBe(10);
  p.questions.forEach((id, i) => {
    p = answerPractice(p, i < 8 ? id : 'wrong', 200 + i);
  });
  expect(p).toMatchObject({index: 10, score: 8, ended: 209});
  expect(answerPractice(p, 'power', 999)).toBe(p);
});
test.each(cases.cases)('手册查询 $query', ({query, expect: expected}) => {
  const result = lookupManual(query);
  expect(result.length).toBeLessThanOrEqual(3);
  if (expected.length) expect(result.some((hit) => expected.includes(hit.id))).toBe(true);
  else expect(result).toHaveLength(0);
});
test('全部课程演示和曝光习题匹配运行时', () => {
  const ajv = new Ajv({strict: false});
  const validators = new Map(tools.tools.map((t) => [t.name, ajv.compile(t.input_schema)]));
  for (const lesson of lessons)
    for (const section of lesson.sections) {
      for (const item of section.steps ?? [])
        if (typeof item === 'object' && 'tool' in item)
          expect(validators.get(item.tool)?.(item.args)).toBe(true);
      for (const item of section.items ?? [])
        if (item.type === 'set_exposure' && '_example_solution' in item) {
          const r = solve({
              ...base,
              ...item._example_solution,
              mode: item.mode,
              scene_ev: item.scene_ev,
            } as ExposureSettings),
            g = item.goal!;
          expect(r.warning).toBe('');
          if ('bias' in g && g.bias) {
            expect(r.bias).toBeGreaterThanOrEqual(g.bias[0]);
            expect(r.bias).toBeLessThanOrEqual(g.bias[1]);
          }
          if ('aperture_min' in g && g.aperture_min)
            expect(r.aperture).toBeGreaterThanOrEqual(g.aperture_min);
          if ('shutter_max_time' in g && g.shutter_max_time)
            expect(seconds(r.shutter)).toBeLessThanOrEqual(seconds(g.shutter_max_time));
        }
    }
});
