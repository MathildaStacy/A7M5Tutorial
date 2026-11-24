import type {ScreenState} from '../camera/state';
import {formatEV} from '../camera/exposure';
import {drawScene} from './scenePreview';

export function createScreen(canvas: HTMLCanvasElement, help: HTMLElement) {
  const c = canvas.getContext('2d')!;
  canvas.width = 1024;
  canvas.height = 683;
  const hits: {x: number; y: number; w: number; h: number; text: string}[] = [];
  function ink(text: string, x: number, y: number, size = 25, color = '#f5f5f5') {
    c.fillStyle = color;
    c.font = '600 ' + size + 'px Saira, Noto, sans-serif';
    c.textBaseline = 'middle';
    c.fillText(text, x, y);
  }
  function field(label: string, x: number, y: number, w: number, explanation: string, h = 53) {
    c.fillStyle = 'rgba(10,14,18,.72)';
    c.fillRect(x, y, w, h);
    ink(label, x + 9, y + h / 2, 26);
    hits.push({x, y, w, h, text: explanation});
  }
  canvas.onclick = (e) => {
    const b = canvas.getBoundingClientRect(),
      x = ((e.clientX - b.left) * 1024) / b.width,
      y = ((e.clientY - b.top) * 683) / b.height;
    const hit = hits.find((t) => x >= t.x && x < t.x + t.w && y >= t.y && y < t.y + t.h);
    if (hit) help.textContent = hit.text;
  };
  return (s: ScreenState) => {
    hits.length = 0;
    c.clearRect(0, 0, 1024, 683);
    if (!s.power || s.choice || ['fn', 'menu'].includes(s.overlay ?? '')) {
      c.fillStyle = '#171a1d';
      c.fillRect(0, 0, 1024, 683);
      if (!s.power) {
        ink('电源已关闭', 410, 342, 34);
        return;
      }
      if (s.choice) {
        ink(s.choice.title, 75, 152, 42);
        ink(s.choice.value, 75, 336, 67, '#F28B26');
        ink('转动控制拨轮选择，按中央按钮确认', 75, 550);
        return;
      }
      ink(s.overlay === 'fn' ? 'Fn 功能菜单' : 'MENU 菜单', 66, 150, 48);
      ink(
        s.overlay === 'fn' ? '拍照、录像和回放各有一套 12 格功能菜单。' : '按 MENU 返回拍摄画面。',
        66,
        320,
        30,
      );
      return;
    }
    if (s.overlay === 'play') {
      const p = s.playback;
      if (!p) {
        c.fillStyle = '#15171b';
        c.fillRect(0, 0, 1024, 683);
        ink('尚无照片，按快门拍一张', 250, 342, 38);
        return;
      }
      drawScene(c, 1024, 683, p.aperture, p.focal * s.zoom, p.bias);
      field(
        '▶ 回放  ' + (p.protected ? '已保护  ' : '') + '×' + s.zoom,
        18,
        18,
        300,
        'AF-ON 可放大检查照片',
      );
      field(
        p.shutter + '   F' + p.aperture + '   ISO ' + p.iso,
        18,
        606,
        510,
        '这张照片拍摄时的曝光参数',
      );
      return;
    }
    drawScene(c, 1024, 683, s.aperture, s.focal, s.bias);
    const fx = 512 + s.focusPoint[0] * 90,
      fy = 342 + s.focusPoint[1] * 70;
    c.strokeStyle = s.focused ? '#49da95' : '#f6f6ee';
    c.lineWidth = 3;
    c.strokeRect(fx - 42, fy - 35, 84, 70);
    if (s.display === 1) return;
    field(s.mode, 18, 12, 85, '拍摄模式由机顶模式转盘决定。');
    field(
      s.recording ? '● REC' : s.capture,
      110,
      12,
      109,
      '由模式转盘下方的旋钮选择照片、录像或 S&Q。',
    );
    field('JPEG', 655, 12, 95, '文件格式。JPEG 可直接查看和分享。');
    field('▣ ' + s.shots, 754, 12, 138, '模拟卡槽 1 剩余可拍张数。');
    field('86%', 897, 12, 110, '模拟 NP-FZ100 电池的剩余电量。');
    [
      [s.drive, '拍摄模式。拍照时按控制拨轮左侧选择。'],
      [s.focus, '对焦模式决定如何保持合焦。'],
      [s.area, '对焦区域决定相机在哪里寻找主体。'],
      [s.wb, '白平衡影响画面的冷暖。'],
      ['多重测光', '测光模式决定用于估算亮度的区域。'],
      ['防抖 开', '机身防抖可以减少手持晃动。'],
    ].forEach(([v, t], i) => field(v, 18, 85 + i * 61, 180, t));
    field(s.shutter, 18, 612, 165, '快门速度越快，越容易凝固动作。');
    field('F' + s.aperture, 190, 612, 134, 'F 值越小，进光越多，景深越浅。');
    field(
      (s.mode === 'M' ? 'M.M. ' : 'EV ') + formatEV(s.mode === 'M' ? s.bias : s.ev),
      331,
      612,
      215,
      '曝光补偿改变目标亮度。手动曝光时测光表显示实际偏差。',
    );
    field(
      'ISO ' + (s.auto ? 'A ' : '') + s.iso,
      552,
      612,
      240,
      'ISO 感光度。控制拨轮右侧打开 ISO 选择。',
    );
    field(s.focal + ' mm', 800, 612, 204, '转动镜头变焦环，改变焦距和视角。');
    if (s.ael) ink('✱ AEL', 825, 92);
    if (s.display === 2) {
      field('', 760, 425, 245, '直方图从左到右代表从暗到亮。', 150);
      const shift = Math.min(65, Math.max(-65, s.bias * 25));
      c.fillStyle = '#dce1e8';
      for (let i = 0; i < 48; i++) {
        const v = (i * 4.6 - 110 - shift) / 44,
          h = 112 * Math.exp(-v * v);
        c.fillRect(770 + i * 4.6, 565 - h, 4, h);
      }
    }
    if (s.display === 3) {
      c.fillStyle = '#3dc57b';
      c.fillRect(280, 339, 464, 4);
      hits.push({x: 280, y: 310, w: 464, h: 65, text: '水平仪变绿表示相机保持水平。'});
    }
  };
}
