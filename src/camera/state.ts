import manual from '../../docs/spec/manual-kb.json';
import {byId, positions} from './controls';
import {
  allowsCompensation,
  apertures,
  clamp,
  isoStops,
  shutters,
  solve,
  type ExposureSettings,
  type Mode,
} from './exposure';

export const displays = ['全部信息', '无信息', '直方图', '水平仪'];
export const operations = [
  'click',
  'half',
  'release',
  'plus',
  'minus',
  'up',
  'down',
  'left',
  'right',
  'lock',
] as const;
export type Operation = (typeof operations)[number];
type Field = 'iso' | 'drive' | 'focusMode' | 'focusArea' | 'whiteBalance' | 'movieTimer' | 'delete';
type Choice = {field: Field; title: string; options: string[]; index: number};
type Photo = ReturnType<typeof solve> & {focal: number; protected: boolean};
export interface CameraState extends ExposureSettings {
  power: boolean;
  focal: number;
  ring: string;
  irisLock: boolean;
  rearLock: boolean;
  cardDoorOpen: boolean;
  lensAF: boolean;
  clickStops: boolean;
  smooth: string;
  capture: string;
  focusMode: string;
  movieFocus: string;
  focusArea: string;
  whiteBalance: string;
  drive: string;
  display: number;
  touch: boolean;
  focusPoint: [number, number];
  focused: boolean;
  ael: boolean;
  recording: boolean;
  movieTimer: string;
  overlay: 'play' | 'fn' | 'menu' | null;
  fnReturn: 'play' | null;
  choice: Choice | null;
  photos: Photo[];
  photoIndex: number;
  zoom: number;
  turns: Record<string, number>;
  notice: string;
}
export function initialCamera(): CameraState {
  return {
    mode: 'A',
    scene_ev: 12,
    aperture: 2.8,
    shutter: '1/250',
    iso: 'AUTO',
    ev: 0,
    power: true,
    focal: 24,
    ring: 'A',
    irisLock: false,
    rearLock: false,
    cardDoorOpen: false,
    lensAF: true,
    clickStops: true,
    smooth: 'SMOOTH',
    capture: '照片',
    focusMode: 'AF-A',
    movieFocus: 'AF-C',
    focusArea: '广域',
    whiteBalance: '自动',
    drive: '单张拍摄',
    display: 0,
    touch: true,
    focusPoint: [0, 0],
    focused: false,
    ael: false,
    recording: false,
    movieTimer: '关',
    overlay: null,
    fnReturn: null,
    choice: null,
    photos: [],
    photoIndex: 0,
    zoom: 1,
    turns: {},
    notice: '',
  };
}
const optionsFor = (id: string) => manual.entries.find((e) => e.id === id)!.options;
const areas = optionsFor('focus_area').filter((v) => v !== '跟踪');
const whiteBalances = optionsFor('white_balance');
const drives = optionsFor('drive_mode').filter((v) => v !== '连拍');
export const effectiveFocus = (s: CameraState) =>
  !s.lensAF ? 'MF' : s.capture === '照片' ? s.focusMode : s.movieFocus;
export const effectiveArea = (s: CameraState) =>
  s.mode === 'AUTO' ||
  (s.focusArea.startsWith('跟踪') && (effectiveFocus(s) !== 'AF-C' || s.capture !== '照片'))
    ? '广域'
    : s.focusArea;
function step<T>(options: readonly T[], current: T, dir: number, wrap = false) {
  const next = options.indexOf(current) + dir;
  return options[
    wrap ? (next + options.length) % options.length : clamp(next, 0, options.length - 1)
  ];
}
function choose(field: Field, title: string, options: string[], current: string): Choice {
  return {field, title, options, index: Math.max(0, options.indexOf(current))};
}
function confirm(s: CameraState, choice: Choice) {
  const value = choice.options[choice.index];
  switch (choice.field) {
    case 'iso':
      s.iso = value === 'AUTO' ? 'AUTO' : Number(value);
      break;
    case 'focusMode':
      if (s.capture === '照片') s.focusMode = value;
      else s.movieFocus = value;
      break;
    case 'focusArea':
      s.focusArea = value;
      s.focusPoint = [0, 0];
      break;
    case 'delete':
      if (value === '删除') {
        s.photos = s.photos.filter((_, i) => i !== s.photoIndex);
        s.photoIndex = Math.max(0, Math.min(s.photoIndex, s.photos.length - 1));
        s.zoom = 1;
      }
      break;
    default:
      s[choice.field] = value;
  }
  s.choice = null;
}
export const metering = (s: CameraState) =>
  solve({...s, aperture: s.ring === 'A' ? s.aperture : Number(s.ring)});
export function act(current: CameraState, id: string, op: Operation = 'click'): CameraState {
  const s = {...current, notice: ''};
  const dir = ['minus', 'left', 'up'].includes(op) ? -1 : 1;
  const control = byId[id];
  if (!control) return current;
  if (
    !s.power &&
    id !== 'power' &&
    id !== 'card_door' &&
    control.part !== 'lens' &&
    control.actions.length
  )
    return {...s, notice: '请先打开电源'};
  if (s.choice && ['wheel', 'joystick', 'btn_center'].includes(id)) {
    if (id === 'btn_center' || op === 'click') confirm(s, s.choice);
    else
      s.choice = {
        ...s.choice,
        index: (s.choice.index + dir + s.choice.options.length) % s.choice.options.length,
      };
    return s;
  }
  s.choice = null;
  const mode = ['1', '2', '3'].includes(s.mode) ? 'A' : s.mode;
  switch (id) {
    case 'card_door':
      s.cardDoorOpen = !s.cardDoorOpen;
      break;
    case 'power':
      s.power = !s.power;
      s.focused = false;
      s.ael = false;
      s.recording = false;
      s.overlay = null;
      break;
    case 'mode_dial':
      s.mode = step(positions(id), s.mode, dir, true) as Mode;
      break;
    case 'mode_switch':
      s.capture = step(positions(id), s.capture, dir, true);
      s.overlay = null;
      s.focused = false;
      break;
    case 'dial_front':
    case 'dial_rear_l':
      if (mode === 'S' || (mode === 'M' && id === 'dial_rear_l'))
        s.shutter = step(shutters, s.shutter, dir);
      else if (mode === 'A' || mode === 'M') {
        if (s.ring === 'A') s.aperture = step(apertures, s.aperture, dir);
        else s.notice = '光圈由镜头光圈环控制';
      } else s.notice = mode === 'P' ? 'P 档自动组合快门和光圈' : '智能自动由相机选择曝光';
      break;
    case 'dial_rear_r':
      if (op === 'lock') s.rearLock = !s.rearLock;
      else if (s.rearLock) s.notice = '后拨盘 R 已锁定，按中央锁钮解锁';
      else if (allowsCompensation(s.mode, s.iso))
        s.ev = clamp(Math.round(s.ev * 3 + dir) / 3, -5, 5);
      else s.notice = '当前模式无法调整曝光补偿';
      break;
    case 'wheel':
      if (s.overlay === 'play' && s.photos.length)
        s.photoIndex = (s.photoIndex + dir + s.photos.length) % s.photos.length;
      else if (s.overlay !== null) break;
      else if (op === 'up') s.display = (s.display + 1) % displays.length;
      else if (op === 'right' && mode !== 'AUTO')
        s.choice = choose('iso', 'ISO 感光度', ['AUTO', ...isoStops.map(String)], String(s.iso));
      else if (op === 'left')
        s.choice =
          s.capture === '照片'
            ? choose('drive', '拍摄模式', drives, s.drive)
            : choose('movieTimer', '自拍定时', ['关', '开'], s.movieTimer);
      else s.notice = op === 'right' ? '智能自动使用 ISO AUTO' : '拍摄时此操作出厂未设定';
      break;
    case 'btn_c1':
      if (mode === 'AUTO') s.notice = '智能自动使用自动白平衡';
      else s.choice = choose('whiteBalance', '白平衡模式', whiteBalances, s.whiteBalance);
      break;
    case 'btn_c2':
      if (mode === 'AUTO') s.notice = '智能自动使用广域对焦';
      else
        s.choice = choose(
          'focusArea',
          '对焦区域',
          areas.filter(
            (a) => !a.startsWith('跟踪') || (s.capture === '照片' && effectiveFocus(s) === 'AF-C'),
          ),
          effectiveArea(s),
        );
      break;
    case 'btn_c3':
      if (s.overlay === 'play')
        s.photos = s.photos.map((p, i) =>
          i === s.photoIndex ? {...p, protected: !p.protected} : p,
        );
      else if (!s.lensAF) s.notice = '先把镜头上的 AF / MF 开关拨到 AF';
      else
        s.choice = choose(
          'focusMode',
          '对焦模式',
          s.capture === '照片' ? ['AF-S', 'AF-A', 'AF-C', 'DMF', 'MF'] : ['AF-C', 'MF'],
          effectiveFocus(s),
        );
      break;
    case 'btn_c4':
      if (s.overlay !== 'play') s.touch = !s.touch;
      else if (s.photos[s.photoIndex]?.protected) s.notice = '照片受保护';
      else if (s.photos.length)
        s.choice = choose('delete', '删除当前照片？', ['删除', '取消'], '取消');
      break;
    case 'btn_ael':
      if (s.overlay !== 'play') s.ael = op !== 'release';
      else s.notice = '回放时 AEL 可查看影像索引';
      break;
    case 'btn_afon':
      if (s.overlay === 'play' && s.photos.length) s.zoom = clamp(s.zoom * 2, 1, 8);
      else s.focused = op !== 'release' && effectiveFocus(s) !== 'MF';
      break;
    case 'shutter':
      s.overlay = null;
      s.focused = op !== 'release' && effectiveFocus(s) !== 'MF';
      if (op !== 'half' && op !== 'release') {
        s.photos = [...s.photos, {...metering(s), focal: s.focal, protected: false}];
        s.photoIndex = s.photos.length - 1;
        s.zoom = 1;
        s.notice = '已拍摄，按回放键查看';
      }
      break;
    case 'btn_play':
      s.overlay = s.overlay === 'play' ? null : 'play';
      s.zoom = 1;
      break;
    case 'btn_menu':
      s.overlay = s.overlay === 'menu' ? null : 'menu';
      break;
    case 'btn_fn':
      if (s.overlay === 'fn') s.overlay = s.fnReturn;
      else {
        s.fnReturn = s.overlay === 'play' ? 'play' : null;
        s.overlay = 'fn';
      }
      break;
    case 'btn_center':
      if (s.overlay === 'play') s.zoom = 1;
      else if (s.overlay === 'fn') s.overlay = s.fnReturn;
      else s.overlay = null;
      break;
    case 'btn_movie':
      s.recording = !s.recording;
      break;
    case 'joystick': {
      const canMove = !['广域', '中间固定', '跟踪: 广域', '跟踪: 中间固定'].includes(
        effectiveArea(s),
      );
      if (op === 'click') {
        s.focusPoint = [0, 0];
        s.focused = effectiveFocus(s) !== 'MF';
      } else if (canMove)
        s.focusPoint = [
          clamp(s.focusPoint[0] + Number(op === 'right') - Number(op === 'left'), -3, 3),
          clamp(s.focusPoint[1] + Number(op === 'down') - Number(op === 'up'), -2, 2),
        ];
      else s.notice = '当前区域固定，选择点或区后再移动';
      break;
    }
    case 'ring_zoom':
      s.focal = Number(step(positions(id), String(s.focal), dir));
      break;
    case 'ring_aperture': {
      const next = step(positions(id), s.ring, dir, true);
      if (s.irisLock && (s.ring === 'A' || next === 'A')) s.notice = '松开 IRIS LOCK 后可进出 A 档';
      else s.ring = next;
      break;
    }
    case 'sw_iris_lock':
      s.irisLock = !s.irisLock;
      break;
    case 'sw_focus_mode':
      s.lensAF = !s.lensAF;
      s.focused = false;
      break;
    case 'sw_click':
      s.clickStops = !s.clickStops;
      break;
    case 'sw_zoom_smooth':
      s.smooth = step(positions(id), s.smooth, 1, true);
      break;
    default:
      s.notice = control.default_function;
  }
  if (
    control.actions.includes('rotate') &&
    !control.positions &&
    !s.notice &&
    ['plus', 'minus'].includes(op)
  )
    s.turns = {...s.turns, [id]: (s.turns[id] ?? 0) + dir};
  return s;
}
export function screenState(s: CameraState) {
  const exposure = metering(s);
  const positionsById: Record<string, string> = {
    mode_dial: s.mode,
    mode_switch: s.capture,
    ring_aperture: s.ring,
    ring_zoom: String(s.focal),
    power: s.power ? 'ON' : 'OFF',
    sw_iris_lock: s.irisLock ? '锁定' : '松开',
    sw_click: s.clickStops ? 'ON' : 'OFF',
    sw_focus_mode: s.lensAF ? 'AF' : 'MF',
    sw_zoom_smooth: s.smooth,
  };
  return {
    ...exposure,
    mode: s.mode,
    power: s.power,
    cardDoorOpen: s.cardDoorOpen,
    focal: s.focal,
    display: s.display,
    drive: s.drive,
    focus: effectiveFocus(s),
    area: effectiveArea(s),
    wb: s.mode === 'AUTO' ? '自动' : s.whiteBalance,
    focusPoint: s.focusPoint,
    focused: s.focused,
    capture: s.capture,
    recording: s.recording,
    ael: s.ael,
    shots: Math.max(0, 1240 - s.photos.length),
    overlay: s.overlay,
    choice: s.choice ? {title: s.choice.title, value: s.choice.options[s.choice.index]} : null,
    playback: s.photos[s.photoIndex] ?? null,
    zoom: s.zoom,
    turns: s.turns,
    positions: positionsById,
  };
}
export type ScreenState = ReturnType<typeof screenState>;
