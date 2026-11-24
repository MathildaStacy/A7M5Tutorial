export const apertures = [
  2.8, 3.2, 3.5, 4, 4.5, 5, 5.6, 6.3, 7.1, 8, 9, 10, 11, 13, 14, 16, 18, 20, 22,
];
export const isoStops = [
  100, 125, 160, 200, 250, 320, 400, 500, 640, 800, 1000, 1250, 1600, 2000, 2500, 3200, 4000, 5000,
  6400, 8000, 10000, 12800, 16000, 20000, 25600, 32000, 40000, 51200,
];
export const shutters = [
  ...[30, 25, 20, 15, 13, 10, 8, 6, 5, 4, 3.2, 2.5, 2, 1.6, 1.3, 1, 0.8, 0.6, 0.5, 0.4].map(
    (t) => t + '"',
  ),
  ...[
    3, 4, 5, 6, 8, 10, 13, 15, 20, 25, 30, 40, 50, 60, 80, 100, 125, 160, 200, 250, 320, 400, 500,
    640, 800, 1000, 1250, 1600, 2000, 2500, 3200, 4000, 5000, 6400, 8000,
  ].map((n) => '1/' + n),
];
export type Iso = number | 'AUTO';
export type Mode = 'AUTO' | 'P' | 'A' | 'S' | 'M' | '1' | '2' | '3';
export interface ExposureSettings {
  mode: Mode;
  scene_ev: number;
  aperture: number;
  shutter: string;
  iso: Iso;
  ev: number;
}
export const seconds = (shutter: string) =>
  shutter.startsWith('1/') ? 1 / Number(shutter.slice(2)) : parseFloat(shutter);
const times = shutters.map(seconds);
export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));
export function nearestStop(stops: readonly number[], target: number) {
  return stops.reduce((best, cur) =>
    Math.abs(Math.log2(cur / target)) < Math.abs(Math.log2(best / target)) ? cur : best,
  );
}
export function allowsCompensation(mode: Mode, iso: Iso) {
  return mode !== 'AUTO' && (mode !== 'M' || iso === 'AUTO');
}
export function solve(p: ExposureSettings) {
  const ev = allowsCompensation(p.mode, p.iso) ? p.ev : 0;
  const target = p.scene_ev - ev;
  const auto = p.iso === 'AUTO' || p.mode === 'AUTO';
  let iso = !auto && typeof p.iso === 'number' ? p.iso : 100;
  let aperture = p.aperture;
  let time = seconds(p.shutter);
  let warning = '';
  if (p.mode === 'S') {
    if (auto) iso = clamp((100 * 2.8 ** 2) / (time * 2 ** target), 100, 12800);
    const ideal = Math.sqrt(time * 2 ** target * (iso / 100));
    if (ideal < 2.8 - 1e-8) warning = '光圈已开到 F2.8，仍然欠曝';
    if (ideal > 22 + 1e-8) warning = '光圈已收到 F22，仍然过曝';
    aperture = nearestStop(apertures, ideal);
  } else if (p.mode === 'M') {
    if (auto) {
      const ideal = (100 * aperture ** 2) / (time * 2 ** target);
      if (ideal < 100) warning = 'ISO 已到最低，仍然过曝';
      if (ideal > 12800) warning = 'ISO 已到自动上限，仍然欠曝';
      iso = clamp(ideal, 100, 12800);
    }
  } else {
    if (p.mode === 'P' || p.mode === 'AUTO')
      aperture = target >= 14 ? 8 : target >= 11 ? 5.6 : target >= 8 ? 4 : 2.8;
    if (auto) iso = clamp((100 * aperture ** 2 * 60) / 2 ** target, 100, 12800);
    time = aperture ** 2 / (2 ** target * (iso / 100));
    if (time < 1 / 8000) warning = '快门已到 1/8000，仍然过曝';
    if (time > 30) warning = '快门已到 30 秒，仍然欠曝';
  }
  time = nearestStop(times, time);
  if (auto) iso = nearestStop(isoStops, iso);
  const bias = p.scene_ev - Math.log2(aperture ** 2 / time) + Math.log2(iso / 100);
  return {aperture, shutter: shutters[times.indexOf(time)], iso, bias, ev, auto, warning};
}
export const formatEV = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '±') + Math.abs(n).toFixed(1);
