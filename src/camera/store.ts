import {create} from 'zustand';
import {act, initialCamera, type CameraState, type Operation} from './state';
import {byId} from './controls';
import {readSetting, writeSetting, recordPractice} from '../data/db';
import {answerPractice, startPractice, type Practice} from './practice';
import type {ViewName} from '../bridge/camera';

interface Academy {
  animation: {control: string; kind: string; dir: number; steps: number} | null;
  camera: CameraState;
  selected: string | null;
  known: string[];
  best: number;
  quiz: Practice | null;
  view: ViewName;
  labels: boolean;
  lcd: boolean;
  topic: string | null;
  lesson: string | null;
  operate: (id: string, op?: Operation) => void;
  select: (id: string, locate?: boolean) => void;
  startQuiz: () => void;
  endQuiz: () => void;
}
export const useAcademy = create<Academy>((set, get) => ({
  animation: null,
  camera: initialCamera(),
  selected: null,
  known: readSetting<string[]>('known', []),
  best: readSetting('find-best', 0),
  quiz: null,
  view: 'overview',
  labels: false,
  lcd: false,
  topic: null,
  lesson: null,
  operate: (id, op = 'click') =>
    set((state) => {
      const next = act(state.camera, id, op),
        kind = byId[id]?.actions[0];
      const transient =
        op !== 'release' &&
        (kind === 'press' ||
          id === 'joystick' ||
          (id === 'wheel' && op !== 'plus' && op !== 'minus'));
      return {
        camera: next,
        animation:
          transient && state.camera.power
            ? {control: id, kind, dir: op === 'minus' || op === 'left' ? -1 : 1, steps: 1}
            : null,
      };
    }),
  select: (id, locate = false) => {
    const c = byId[id];
    if (!c) return;
    const {quiz, known} = get();
    if (quiz) {
      if (quiz.ended !== null) return;
      const next = answerPractice(quiz, id);
      set({quiz: next, ...(next.ended !== null ? {best: recordPractice(next.score)} : {})});
      return;
    }
    const next = known.includes(id) ? known : [...known, id];
    if (next !== known) writeSetting('known', next);
    set({
      known: next,
      selected: id,
      lcd: id === 'lcd',
      ...(locate ? {view: c.zone as ViewName} : {}),
    });
  },
  startQuiz: () =>
    set({quiz: startPractice(), selected: null, lcd: false, labels: false, view: 'overview'}),
  endQuiz: () => set({quiz: null}),
}));
