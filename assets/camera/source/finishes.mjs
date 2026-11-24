// Periodic height, colour and roughness fields authored in millimetres.
// All maps share the same cells and grazed edges; none contain product-photo pixels.
import {createCanvas} from '@napi-rs/canvas';

export const tileMm = {握把皮纹: 24, 砂纹漆: 8};
const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const mix = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
function hash(x, y, seed) {
  let n = Math.imul(x + 1, 0x1f1f1f1f) ^ Math.imul(y + 7, 0x2c1b3c6d) ^ seed;
  n = Math.imul(n ^ (n >>> 15), 0x85ebca77);
  return ((n ^ (n >>> 13)) >>> 0) / 4294967296;
}
function noise(u, v, frequency, seed) {
  const x = u * frequency,
    y = v * frequency,
    ix = Math.floor(x),
    iy = Math.floor(y);
  const value = (a, b) =>
    hash((ix + a + frequency * 4) % frequency, (iy + b + frequency * 4) % frequency, seed);
  return mix(
    mix(value(0, 0), value(1, 0), smooth(x - ix)),
    mix(value(0, 1), value(1, 1), smooth(x - ix)),
    smooth(y - iy),
  );
}
function paintPixel(u, v) {
  const base = noise(u, v, 49, 71),
    fine = noise(u, v, 101, 33),
    pocks = Math.pow(noise(u, v, 69, 48), 4);
  const grain = 0.6 * base + 0.4 * fine;
  return [
    grain * 0.036 - pocks * 0.025,
    217 + 35 * grain - 16 * pocks,
    235 + 20 * grain,
    234 - 32 * base + 12 * pocks,
  ];
}
function rubberPixel(u, v) {
  // Pressed rubber has broad irregular tops, branching troughs and fine pores.
  const wu =
    u +
    0.04 * (noise(u, v, 7, 23) - 0.5) +
    0.016 * (noise(u, v, 21, 21) - 0.5) +
    0.006 * (noise(u, v, 46, 15) - 0.5);
  const wv =
    v +
    0.045 * (noise(u, v, 6, 27) - 0.5) +
    0.019 * (noise(u, v, 19, 28) - 0.5) +
    0.006 * (noise(u, v, 43, 72) - 0.5);
  const cols = 19,
    rows = 23,
    x = wu * cols,
    y = wv * rows;
  const ix = Math.floor(x),
    iy = Math.floor(y);
  let first = Infinity,
    second = Infinity,
    cell = 0;
  for (let b = -1; b <= 1; b++)
    for (let a = -1; a <= 1; a++) {
      const gx = (ix + a + cols) % cols,
        gy = (iy + b + rows) % rows;
      const dx = x - ix - a - (0.13 + 0.74 * hash(gx, gy, 97)),
        dy = y - iy - b - (0.12 + 0.76 * hash(gx, gy, 83));
      const dist = dx * dx + dy * dy;
      if (dist < first) {
        second = first;
        first = dist;
        cell = hash(gx, gy, 73);
      } else if (dist < second) second = dist;
    }
  const separation = Math.sqrt(second) - Math.sqrt(first);
  const broad = noise(u, v, 36, 41),
    grain = noise(u, v, 127, 23);
  const ridge = 1 - Math.exp(-7 * separation);
  // Some valleys die out between adjacent grains; a continuous cell border looks tiled.
  const imprint = 0.22 + 0.78 * smooth(clamp((noise(u, v, 20, 63) - 0.25) / 0.48));
  const dome = 1 - imprint * (1 - ridge);
  const pits = Math.pow(noise(u, v, 71, 39), 6);
  const height = 0.12 * dome * (0.75 + 0.32 * cell) + 0.084 * broad + 0.032 * grain - 0.075 * pits;
  return [
    height,
    166 + 34 * dome + 21 * cell + 22 * broad + 11 * grain - 17 * pits,
    180 + 67 * dome + 7 * grain,
    247 - 44 * dome + 18 * (broad - 0.5) + 8 * pits,
  ];
}
function pixels(n) {
  const c = createCanvas(n, n),
    ctx = c.getContext('2d'),
    im = ctx.createImageData(n, n);
  return {
    set(i, r, g, b) {
      const j = i * 4;
      im.data[j] = r;
      im.data[j + 1] = g;
      im.data[j + 2] = b;
      im.data[j + 3] = 255;
    },
    png() {
      ctx.putImageData(im, 0, 0);
      return c.toBuffer('image/png');
    },
  };
}
export function surfaceMaps(name, n) {
  const color = pixels(n),
    normal = pixels(n),
    orm = pixels(n),
    height = new Float32Array(n * n);
  const sample = name === '握把皮纹' ? rubberPixel : paintPixel;
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const i = y * n + x,
        [h, luma, ambient, rough] = sample(x / n, y / n);
      height[i] = h;
      color.set(i, luma, luma, luma);
      orm.set(i, ambient, rough, 255);
    }
  const scale = n / (2 * tileMm[name]);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const dx = (height[y * n + ((x + 1) % n)] - height[y * n + ((x + n - 1) % n)]) * scale;
      const dy = (height[((y + 1) % n) * n + x] - height[((y + n - 1) % n) * n + x]) * scale;
      const length = Math.hypot(dx, dy, 1);
      normal.set(
        y * n + x,
        127.5 * (1 - dx / length),
        127.5 * (1 + dy / length),
        127.5 * (1 + 1 / length),
      );
    }
  return {albedo: color.png(), normal: normal.png(), orm: orm.png()};
}
export function turnedMetalMaps(n) {
  const direction = pixels(n),
    normal = pixels(n);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const dx = (x + 0.5) / n - 0.5,
        dy = 0.5 - (y + 0.5) / n,
        r = Math.max(0.00001, Math.hypot(dx, dy));
      const tx = -dy / r,
        ty = dx / r,
        g = Math.sin(r * 2 * Math.PI * 73) * 0.08;
      direction.set(y * n + x, 127.5 * (1 + tx), 127.5 * (1 + ty), 255);
      normal.set(y * n + x, 127.5 * (1 + (g * dx) / r), 127.5 * (1 + (g * dy) / r), 254);
    }
  return {anisotropy: direction.png(), normal: normal.png()};
}
