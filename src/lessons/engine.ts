import type {ViewName, Command} from '../bridge/camera';
import {act, initialCamera, screenState, type CameraState, type Operation} from '../camera/state';
import {solve, seconds, type ExposureSettings, type Mode} from '../camera/exposure';

type Settings = {
  [K in keyof ExposureSettings]?: ExposureSettings[K] | null;
} & {
  focal?: number | null;
  focus_mode?: string | null;
  focus_area?: string | null;
  wb?: string | null;
  drive?: string | null;
};
type DemoStep =
  | {tool: 'set_camera_view'; args: {view: ViewName}}
  | {tool: 'highlight_control'; args: {control_ids: string[]; note: string | null}}
  | {tool: 'set_virtual_settings'; args: Settings}
  | {tool: 'say_to_user'; args: {text: string}}
  | {
      tool: 'demonstrate_control';
      args: {
        control_id: string;
        action: string;
        steps: number | null;
        target: string | null;
        direction: 'none' | 'left' | 'right' | 'up' | 'down';
      };
    };

export type ExposureQuestion = {
  type: 'set_exposure';
  prompt: string;
  scene_ev: number;
  mode: Mode;
  start: Partial<ExposureSettings>;
  lock: string[];
  explain: string;
  goal: {
    bias?: number[];
    aperture_min?: number;
    aperture_max?: number;
    shutter_min_time?: string;
    shutter_max_time?: string;
    iso_max?: number;
  };
  _example_solution: Partial<ExposureSettings>;
};
export type Question =
  | {type: 'choice'; q: string; options: string[]; answer: number; explain: string}
  | {type: 'find_control'; target: string}
  | {
      type: 'operate';
      prompt: string;
      control: string;
      start: Settings;
      expect: Settings;
      hint: string;
    }
  | ExposureQuestion;
export type FieldTask = {
  kind: 'task';
  title: string;
  steps: string[];
  success_criteria: string;
  complete_by: 'ai' | 'practice_mode' | 'self';
  photos: number;
  ai_rubric?: string[];
};
export type Lesson = {
  id: string;
  title: string;
  minutes: number;
  goals: string[];
  sections: [
    {kind: 'demo'; steps: DemoStep[]},
    {kind: 'read'; markdown: string},
    {kind: 'practice'; items: Question[]},
    FieldTask,
  ];
};
export const sectionIds = ['demo', 'read', 'practice', 'task'] as const;
export type SectionId = (typeof sectionIds)[number];

const focusAreas: Record<string, string> = {
  wide: '广域',
  spot: '点: M',
  zone: '区',
  center: '中间固定',
};
export function applyLessonSettings(s: CameraState, v: Settings): CameraState {
  return {
    ...s,
    scene_ev: v.scene_ev ?? s.scene_ev,
    mode: v.mode ?? s.mode,
    aperture: v.aperture ?? s.aperture,
    shutter: v.shutter ?? s.shutter,
    iso: v.iso ?? s.iso,
    ev: v.ev ?? s.ev,
    focal: v.focal ?? s.focal,
    focusMode: v.focus_mode ?? s.focusMode,
    focusArea: v.focus_area ? focusAreas[v.focus_area] ?? v.focus_area : s.focusArea,
    whiteBalance: v.wb ?? s.whiteBalance,
    drive: v.drive ?? s.drive,
    choice: null,
  };
}
export function operationMatches(s: CameraState, expect: Settings) {
  const actual = screenState(s);
  const values: Settings = {
    mode: s.mode,
    aperture: actual.aperture,
    shutter: actual.shutter,
    iso: s.iso,
    ev: actual.ev,
    scene_ev: s.scene_ev,
    focal: s.focal,
    focus_mode: actual.focus,
    focus_area: actual.area,
    wb: actual.wb,
    drive: actual.drive,
  };
  return Object.entries(expect).every(
    ([key, value]) =>
      value == null ||
      values[key as keyof Settings] ===
        (key === 'focus_area' ? focusAreas[String(value)] ?? value : value),
  );
}
export function exposureMatches(settings: ExposureSettings, goal: ExposureQuestion['goal']) {
  const r = solve(settings);
  const t = seconds(r.shutter);
  return (
    !r.warning &&
    (!goal.bias || (r.bias >= goal.bias[0] && r.bias <= goal.bias[1])) &&
    r.aperture >= (goal.aperture_min ?? 0) &&
    r.aperture <= (goal.aperture_max ?? Infinity) &&
    r.iso <= (goal.iso_max ?? Infinity) &&
    (!goal.shutter_min_time || t >= seconds(goal.shutter_min_time)) &&
    (!goal.shutter_max_time || t <= seconds(goal.shutter_max_time))
  );
}

type Animation = Omit<Extract<Command, {cmd: 'animate'}>, 'cmd'>;
export interface DemoFrame {
  camera: CameraState;
  view: ViewName;
  highlight: string[];
  note: string;
  text: string;
  animation: Animation | null;
}
export function demoFrames(lesson: Lesson): DemoFrame[] {
  let camera = initialCamera(),
    view: ViewName = 'overview',
    highlight: string[] = [],
    note = '';
  if (lesson.id === 'L0') camera.power = false;
  let animation: Animation | null = null;
  const frames: DemoFrame[] = [];
  for (const step of lesson.sections[0].steps) {
    switch (step.tool) {
      case 'set_camera_view':
        view = step.args.view;
        break;
      case 'highlight_control':
        highlight = step.args.control_ids;
        note = step.args.note ?? '';
        break;
      case 'set_virtual_settings':
        camera = applyLessonSettings(camera, step.args);
        break;
      case 'demonstrate_control': {
        const {control_id: id, action, steps, direction, target} = step.args;
        if (target) {
          // Use the same state transitions as a user turning or sliding the control.
          const stops = new Set<string>();
          for (;;) {
            const current = screenState(camera).positions[id];
            if (current === target || stops.has(current)) break;
            stops.add(current);
            camera = act(camera, id, action === 'rotate' ? 'plus' : 'click');
          }
        } else {
          const op: Operation =
            direction === 'none'
              ? action === 'rotate'
                ? 'plus'
                : id === 'shutter' && note.includes('半按')
                ? 'half'
                : 'click'
              : direction;
          for (let i = 0; i < (steps ?? 1); i++) camera = act(camera, id, op);
          if (action === 'press')
            animation = {
              control: id,
              kind: action,
              steps: steps ?? 1,
              dir: direction === 'left' || direction === 'up' ? -1 : 1,
            };
        }
        break;
      }
      case 'say_to_user':
        frames.push({camera, view, highlight, note, animation, text: step.args.text});
        animation = null;
        break;
    }
  }
  return frames;
}
