import {clamp} from '../camera/exposure';
const HASF = 'filter' in document.createElement('canvas').getContext('2d')!;
function rr(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}
export function drawScene(
  c: CanvasRenderingContext2D,
  W: number,
  H: number,
  N: number,
  focal: number,
  bias: number,
  noBlur = false,
) {
  const z = focal / 24;
  let g = c.createLinearGradient(0, 0, 0, H * 0.62);
  g.addColorStop(0, '#7E97B3');
  g.addColorStop(1, '#CDD6DE');
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  c.save();
  c.translate(W / 2, H * 0.6);
  c.scale(z, z);
  c.translate(-W / 2, -H * 0.6);
  if (HASF && !noBlur)
    c.filter = 'blur(' + (Math.max(0, 28 / N - 1) * Math.sqrt(z)).toFixed(1) + 'px)';
  c.fillStyle = '#8C9AA6';
  c.beginPath();
  c.moveTo(-300, H * 0.62);
  for (let x = -300; x <= W + 300; x += 40)
    c.lineTo(x, H * 0.47 + Math.sin(x * 0.012) * 22 + Math.sin(x * 0.031) * 9);
  c.lineTo(W + 300, H * 0.62);
  c.closePath();
  c.fill();
  [
    [40, 150, 120],
    [190, 215, 95],
    [300, 120, 110],
    [650, 195, 100],
    [765, 140, 130],
    [905, 235, 95],
  ].forEach(([x, h, w], i) => {
    c.fillStyle = i % 2 ? '#5E6670' : '#727A84';
    c.fillRect(x, H * 0.6 - h, w, h);
    c.fillStyle = 'rgba(255,236,190,.5)';
    for (let yy = H * 0.6 - h + 14; yy < H * 0.6 - 12; yy += 22)
      for (let xx = x + 10; xx < x + w - 12; xx += 20)
        if ((xx * 7 + yy * 3) % 5 < 3) c.fillRect(xx, yy, 9, 12);
  });
  c.fillStyle = '#3F5A3A';
  [
    [150, 46],
    [262, 38],
    [560, 54],
    [606, 40],
    [870, 48],
  ].forEach(([x, r]) => {
    c.fillRect(x - 4, H * 0.6 - r, 8, r);
    c.beginPath();
    c.arc(x, H * 0.6 - r * 1.3, r, 0, 7);
    c.fill();
  });
  g = c.createLinearGradient(0, H * 0.6, 0, H);
  g.addColorStop(0, '#7A836F');
  g.addColorStop(1, '#4E5649');
  c.fillStyle = g;
  c.fillRect(-400, H * 0.6, W + 800, H * 0.6);
  if (HASF) c.filter = 'none';
  const px = W * 0.5,
    py = H * 0.93;
  c.fillStyle = '#2E3440';
  c.fillRect(px - 26, py - 150, 20, 150);
  c.fillRect(px + 6, py - 150, 20, 150);
  c.fillStyle = '#C2562F';
  rr(c, px - 46, py - 300, 92, 165, 24);
  c.fill();
  c.fillStyle = '#E2B697';
  c.beginPath();
  c.arc(px, py - 336, 33, 0, 7);
  c.fill();
  c.fillStyle = '#2A211C';
  c.beginPath();
  c.arc(px, py - 346, 35, Math.PI, 0);
  c.fill();
  c.restore();
  const b = clamp(bias, -4, 4);
  if (b > 0) {
    c.fillStyle = `rgba(255,255,255,${Math.min(0.82, b * 0.21)})`;
    c.fillRect(0, 0, W, H);
  } else if (b < 0) {
    c.fillStyle = `rgba(0,0,0,${Math.min(0.86, -b * 0.22)})`;
    c.fillRect(0, 0, W, H);
  }
}
