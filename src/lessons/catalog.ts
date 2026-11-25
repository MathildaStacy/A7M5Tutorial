import l0 from '../../content/lessons/L0.json';
import l1 from '../../content/lessons/L1.json';
import l2 from '../../content/lessons/L2.json';
import l3 from '../../content/lessons/L3.json';
import l4 from '../../content/lessons/L4.json';
import l5 from '../../content/lessons/L5.json';
import type {Lesson} from './engine';
// The authored JSON is validated by content/lessons/build.cjs.
export const lessons = [l0, l1, l2, l3, l4, l5] as unknown as Lesson[];
export const relatedLessons = (id: string) =>
  lessons.filter((l) =>
    l.sections.some((s) => s.kind === 'read' && s.markdown?.includes('[[' + id + ']]')),
  );
