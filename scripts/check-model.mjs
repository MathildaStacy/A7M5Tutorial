import fs from 'node:fs/promises';
import {NodeIO, getBounds} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {MeshoptDecoder} from 'meshoptimizer';

const controls = JSON.parse(await fs.readFile('docs/spec/controls.json')).controls;
await MeshoptDecoder.ready;
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({'meshopt.decoder': MeshoptDecoder});
const errors = [];
for (const [lod, file] of ['a7v.glb', 'a7v_lod1.glb'].entries()) {
  const bytes = await fs.readFile('assets/camera/' + file);
  const doc = await io.readBinary(bytes),
    root = doc.getRoot();
  const nodes = [];
  root.getDefaultScene()?.traverse((n) => nodes.push(n));
  if (!nodes.length) root.listScenes()[0]?.traverse((n) => nodes.push(n));
  const error = (message) => errors.push(file + ' · ' + message);
  function named(name) {
    const found = nodes.filter((n) => n.getName() === name);
    if (found.length !== 1) error(name + ' 需要唯一节点，实得 ' + found.length);
    return found[0];
  }
  for (const control of controls) {
    const node = named(control.id);
    if (!node) continue;
    const e = node.getExtras(),
      {kind, axis, positions, range_deg} = e;
    if (
      !['rotate', 'press', 'slide', 'hinge', 'tilt', 'static'].includes(kind) ||
      (control.actions.length && kind === 'static')
    )
      error(control.id + ' 的 kind 无效');
    if (
      !Array.isArray(axis) ||
      axis.length !== 3 ||
      !axis.every(Number.isFinite) ||
      Math.abs(Math.hypot(...axis) - 1) > 1e-4
    )
      error(control.id + ' 的 axis 须为单位向量');
    if (
      JSON.stringify(Object.keys(positions ?? {}).sort()) !==
        JSON.stringify([...(control.positions ?? [])].sort()) ||
      !Object.values(positions ?? {}).every(Number.isFinite)
    )
      error(control.id + ' 的档位与字典不符');
    if (['press', 'slide'].includes(kind) && !(Number.isFinite(e.travel_m) && e.travel_m > 0))
      error(control.id + ' 缺少行程');
    if (
      ['tilt', 'hinge'].includes(kind) &&
      !(
        Array.isArray(range_deg) &&
        range_deg.length === 2 &&
        range_deg.every(Number.isFinite) &&
        range_deg[1] > range_deg[0]
      )
    )
      error(control.id + ' 缺少活动角度范围');
    if (
      kind === 'rotate' &&
      !(e.detent_deg === null || (Number.isFinite(e.detent_deg) && e.detent_deg > 0))
    )
      error(control.id + ' 的档距无效');
  }
  const body = named('body'),
    lens = named('lens'),
    model = named('a7v'),
    screen = named('lcd_screen');
  named('decal_brand');
  const limits = [
    [Infinity, Infinity],
    [-Infinity, -Infinity],
  ];
  screen?.traverse((n) => {
    for (const primitive of n.getMesh()?.listPrimitives() ?? []) {
      const uv = primitive.getAttribute('TEXCOORD_0');
      if (!uv) {
        error('lcd_screen 缺少 UV');
        continue;
      }
      const min = uv.getMin([]),
        max = uv.getMax([]);
      for (let i = 0; i < 2; i++) {
        limits[0][i] = Math.min(limits[0][i], min[i]);
        limits[1][i] = Math.max(limits[1][i], max[i]);
      }
    }
  });
  if (limits.some((bound, i) => bound.some((v) => Math.abs(v - i) > 1e-4)))
    error('lcd_screen UV 必须铺满 0–1');
  const placeholder = model?.getExtras().developmentPlaceholder === true;
  if (placeholder && !process.argv.includes('--placeholder')) error('这是开发占位模型');
  const mmBounds = (node) => {
    const {min, max} = getBounds(node);
    return max.map((v, i) => Math.round((v - min[i]) * 100000) / 100);
  };
  // The complete bounds include protruding strap lugs and the lens bayonet.
  // Report an additional measurement at the shell and seating plane for comparison.
  function withoutFittings(node, names) {
    const fittings = nodes
      .filter((n) => names.includes(n.getName()))
      .map((n) => [n.getParentNode(), n]);
    try {
      for (const [p, n] of fittings) p.removeChild(n);
      return mmBounds(node);
    } finally {
      for (const [p, n] of fittings) p.addChild(n);
    }
  }
  const dimensionsMm =
    body && lens
      ? {
          body: mmBounds(body),
          shell: withoutFittings(body, ['strap_lug_left', 'strap_lug_right']),
          lens: mmBounds(lens),
          fromFlange: withoutFittings(lens, ['lens_bayonet']),
        }
      : null;
  if (dimensionsMm && (!placeholder || !process.argv.includes('--placeholder'))) {
    for (const [name, expected] of [
      ['body', [130.3, 96.4, 82.4]],
      ['lens', [87.8, 87.8, 119.9]],
    ]) {
      if (dimensionsMm[name].some((v, i) => Math.abs(v - expected[i]) > 0.5))
        error(name + ' 完整包围盒（mm）' + dimensionsMm[name].join(' × ') + '；须核对规格量取基准');
    }
  }
  let triangles = 0;
  for (const node of nodes)
    for (const p of node.getMesh()?.listPrimitives() ?? []) {
      if (p.getMode() !== 4) {
        error('模型需要使用三角面');
        continue;
      }
      triangles += (p.getIndices() ?? p.getAttribute('POSITION')).getCount() / 3;
    }
  const textures = root
    .listTextures()
    .map((t) => ({name: t.getName(), size: t.getSize(), type: t.getMimeType()}));
  if (
    textures.length > 10 ||
    textures.some((t) => t.type !== 'image/ktx2' || !t.size || Math.max(...t.size) > 2048)
  )
    error('贴图不符合 KTX2 或尺寸预算');
  if (!root.listExtensionsUsed().some((ext) => ext.extensionName === 'EXT_meshopt_compression'))
    error('缺少 meshopt 压缩');
  if (triangles > (lod ? 60000 : 200000) || bytes.length > (lod ? 6 : 20) * 1024 ** 2)
    error('超出面数或大小预算');
  console.log(
    JSON.stringify({
      file,
      placeholder,
      nodes: nodes.length,
      triangles,
      bytes: bytes.length,
      dimensionsMm,
      textures,
    }),
  );
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
}
