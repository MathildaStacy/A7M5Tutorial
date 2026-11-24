import dictionary from '../../docs/spec/controls.json';
export type Control = (typeof dictionary.controls)[number];
export const controls = dictionary.controls;
export const byId: Readonly<Record<string, Control>> = Object.fromEntries(
  controls.map((c) => [c.id, c]),
);
export const positions = (id: string): readonly string[] => byId[id].positions ?? [];
export const zones: Record<string, string> = {
  top: '顶部',
  back: '背面',
  front: '正面',
  left: '左侧',
  right: '右侧',
  bottom: '底部',
  lens: '镜头',
};
export function searchControls(query: string) {
  const term = query.trim().toLowerCase();
  return controls
    .map((control) => {
      const fields = [
        control.name,
        control.id,
        control.default_function,
        control.where,
        control.beginner_tip,
      ];
      return {control, rank: fields.findIndex((field) => field.toLowerCase().includes(term))};
    })
    .filter((item) => item.rank >= 0)
    .sort((a, b) => a.rank - b.rank)
    .map((item) => item.control);
}
