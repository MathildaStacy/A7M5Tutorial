// Export the independently authored model. --prototype exports the historical interaction study.
import fs from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {photoStudy, apertureAngles, zoomAngles} from '../assets/camera/source/photo-study.mjs';
import {surfaceMaps, tileMm, turnedMetalMaps} from '../assets/camera/source/finishes.mjs';
import {execFileSync} from 'node:child_process';
import * as THREE from 'three';
import {createCanvas, GlobalFonts} from '@napi-rs/canvas';
import {Document, NodeIO} from '@gltf-transform/core';
import {
  EXTMeshoptCompression,
  KHRTextureBasisu,
  KHRTextureTransform,
  KHRMaterialsClearcoat,
  KHRMaterialsAnisotropy,
  KHRMaterialsTransmission,
  KHRMaterialsIOR,
  KHRMaterialsSpecular,
  KHRMaterialsIridescence,
} from '@gltf-transform/extensions';
import {MeshoptEncoder, MeshoptSimplifier} from 'meshoptimizer';
import {weld, simplify} from '@gltf-transform/functions';

const controls = JSON.parse(await fs.readFile('docs/spec/controls.json')).controls;
async function prototypeSource() {
  const script = await fs.readFile('prototype/src/2-camera.js', 'utf8');
  const code = script.match(/  function ctex\([\s\S]+?(?=  \/\/ 假阴影)/)?.[0];
  if (!code) throw new Error('原型建模代码的起止位置已变更');
  return code;
}
const stops = (id) => controls.find((c) => c.id === id).positions;
GlobalFonts.registerFromPath('assets/fonts/SairaSemiCondensed-SemiBold.ttf', 'Saira');
const fromPrototype = process.argv.includes('--prototype');
async function exportModel(lod) {
  const {root, lens, ctl, lcd, lock, parts} = fromPrototype
    ? vm.runInNewContext((await prototypeSource()) + '\n;({root,lens,ctl,lcd,lock,parts})', {
        THREE,
        scene: new THREE.Scene(),
        api: {ctl: {}},
        document: {createElement: () => createCanvas(1, 1)},
        LX: -1.9,
        LY: 3.6,
        PI: Math.PI,
        V: (...v) => new THREE.Vector3(...v),
        UIF: 'Saira, sans-serif',
        MODES: stops('mode_dial'),
        AP_RING: stops('ring_aperture'),
        FOCALS: stops('ring_zoom').map(Number),
      })
    : photoStudy(lod);
  const group = (name) => Object.assign(new THREE.Group(), {name});
  const body = group('body');
  const brand = root.getObjectByName('decal_brand');
  if (brand) root.remove(brand);
  root.remove(lens);
  body.add(...[...root.children]);
  root.add(body, lens);
  if (brand) root.add(brand);
  root.name = 'a7v';
  root.userData.developmentPlaceholder = true;
  lens.name = 'lens';
  // The prototype looks down -Z. glTF uses metres with the lens facing +Z.
  root.rotation.y = Math.PI;
  if (fromPrototype) root.position.set(-1.9, -3.6, 0);
  const metre = fromPrototype ? 0.01 : 0.001;
  root.userData.stage = fromPrototype ? 'interaction-prototype' : 'official-photo-study';
  lock.name = 'dial_rear_r_lock';
  lcd.children[1].name = 'lcd_screen';
  if (fromPrototype)
    lcd.children[1].material = new THREE.MeshStandardMaterial({color: 0x252427, roughness: 0.22});
  if (fromPrototype) {
    body.add(group('decal_brand'));
    const inner = group('lens_barrel_inner');
    lens.add(inner);
    for (const child of [...lens.children])
      if (child !== inner && child.position.z < -10.5) inner.attach(child);
  }

  function binding(control, obj, face) {
    const {id, positions} = control;
    let kind = control.actions[0] ?? 'static';
    if (id === 'power' || id === 'mode_switch') kind = 'rotate';
    if (['card_door', 'battery_door', 'ports', 'lcd'].includes(id)) kind = 'hinge';
    if (id === 'joystick') kind = 'tilt';
    let axis = [0, 1, 0],
      detent = null,
      travel = null,
      range = null,
      values = null;
    if (kind === 'rotate') {
      axis = id.startsWith('ring_') || id === 'wheel' ? [0, 0, 1] : [0, 1, 0];
      detent = {
        mode_dial: 45,
        mode_switch: 20,
        ring_aperture: fromPrototype ? 4 : apertureAngles[6] / 18,
        ring_focus: null,
        ring_zoom: null,
        power: 28,
      }[id];
      if (detent === undefined) detent = 15;
    }
    if (kind === 'press') {
      const local = face
        .clone()
        .applyQuaternion(root.quaternion)
        .negate()
        .applyQuaternion(obj.getWorldQuaternion(new THREE.Quaternion()).invert())
        .normalize();
      axis = local.toArray();
      travel = 0.0006;
    }
    if (kind === 'slide') {
      axis = [1, 0, 0];
      travel = 0.0032;
    }
    if (kind === 'tilt') range = [-8, 8];
    if (kind === 'hinge') range = [0, 90];
    if (positions) {
      const angles = {
        power: [-28, 0],
        mode_dial: positions.map((_, i) => (fromPrototype ? -45 * i : 45 * (i - 1))),
        mode_switch: [0, 20, 40],
        ring_aperture: fromPrototype
          ? [0, -12, -24, -36, -48, -60, -72, -82]
          : apertureAngles.map((v) => -v),
        ring_zoom: fromPrototype ? [0, -24, -46, -70] : zoomAngles.map((v) => -v),
        sw_focus_mode: [0, 0.0032],
        sw_click: [0, 0.0032],
        sw_zoom_smooth: [0, 0.0032],
        sw_iris_lock: [0.0032, 0],
      };
      values = Object.fromEntries(positions.map((p, i) => [p, angles[id][i]]));
    }
    return {
      kind,
      axis,
      detent_deg: detent,
      travel_m: travel,
      range_deg: range,
      positions: values,
      ...(id === 'ring_focus' ? {preview_step_deg: 9} : {}),
      ...(id === 'mode_dial' ? {wrap_deg: 360} : {}),
      ...(id === 'ring_zoom' ? {extension_m: {24: 0, 35: 0.012, 50: 0.023, 70: 0.035}} : {}),
    };
  }
  root.updateWorldMatrix(true, true);
  for (const control of controls) {
    const entry = ctl[control.id];
    let obj = entry.objs[0];
    if (parts[control.id]?.knob) {
      const knob = parts[control.id].knob;
      obj.parent.attach(knob);
      obj = knob;
    }
    if (entry.objs.length > 1) {
      obj = group(control.id);
      lens.add(obj);
      for (const part of entry.objs) obj.attach(part);
    }
    obj.name = control.id;
    obj.userData = binding(control, obj, entry.face);
  }
  root.traverse((o) => {
    delete o.userData.cid;
  });

  // Pack independently drawn lettering and optical details into one transparent atlas.
  const atlas = createCanvas(2048, 2048),
    ctx = atlas.getContext('2d'),
    rects = new Map();
  ctx.clearRect(0, 0, 2048, 2048);
  root.traverse((o) => {
    if (o.isMesh) for (const m of [].concat(o.material)) if (m.map) rects.set(m.map, null);
  });
  let x = 5,
    y = 5,
    row = 0;
  for (const tex of [...rects.keys()].sort(
    (a, b) => b.image.height - a.image.height || b.image.width - a.image.width,
  )) {
    const w = Math.min(1020, tex.image.width),
      h = Math.round((tex.image.height * w) / tex.image.width);
    if (x + w + 5 > 2048) {
      x = 5;
      y += row + 10;
      row = 0;
    }
    if (y + h + 2 > 2048) throw new Error('贴图图集溢出');
    ctx.clearRect(x, y, w, h);
    ctx.drawImage(tex.image, x, y, w, h);
    rects.set(tex, [x / 2048, y / 2048, w / 2048, h / 2048]);
    x += w + 10;
    row = Math.max(row, h);
  }
  const temp = await fs.mkdtemp(path.join(tmpdir(), 'shutter-model-'));
  try {
    const png = path.join(temp, 'atlas.png'),
      ktx = path.join(temp, 'atlas.ktx2');
    await fs.writeFile(png, atlas.toBuffer('image/png'));
    const bin = path.resolve(
      'node_modules/@gpu-tex-enc/basis/bin',
      process.platform + '-' + process.arch,
      process.platform === 'win32' ? 'basisu.exe' : 'basisu',
    );
    execFileSync(
      bin,
      ['-ktx2', '-uastc', '-uastc_level', '2', '-mipmap', '-output_file', ktx, png],
      {stdio: 'pipe'},
    );
    const doc = new Document(),
      buffer = doc.createBuffer();
    const texture = doc
      .createTexture('按键与刻度')
      .setImage(await fs.readFile(ktx))
      .setMimeType('image/ktx2');
    doc.createExtension(KHRTextureBasisu).setRequired(true);
    doc.createExtension(EXTMeshoptCompression).setRequired(true);
    const finishes = new Map(),
      turned = {};
    async function encodeMap(name, data, linear, highQuality) {
      await fs.writeFile(png, data);
      const args = [
        '-ktx2',
        '-mipmap',
        ...(linear ? ['-linear'] : []),
        ...(highQuality ? ['-uastc', '-uastc_level', '2'] : ['-q', '195']),
        '-output_file',
        ktx,
        png,
      ];
      execFileSync(bin, args, {stdio: 'pipe'});
      return doc
        .createTexture(name)
        .setImage(await fs.readFile(ktx))
        .setMimeType('image/ktx2');
    }
    if (!fromPrototype) {
      for (const name of Object.keys(tileMm)) {
        const maps = surfaceMaps(name, lod ? 256 : 512);
        finishes.set(name, {
          normal: await encodeMap(name + ' · 法线', maps.normal, true, true),
          orm: await encodeMap(name + ' · ORM', maps.orm, true, false),
          albedo: await encodeMap(name + ' · 底色', maps.albedo, false, false),
        });
      }
      for (const [key, data] of Object.entries(turnedMetalMaps(lod ? 128 : 256)))
        turned[key] = await encodeMap('车削金属 · ' + key, data, true, true);
    }
    const anisotropy = doc.createExtension(KHRMaterialsAnisotropy),
      transmission = doc.createExtension(KHRMaterialsTransmission),
      ior = doc.createExtension(KHRMaterialsIOR),
      specular = doc.createExtension(KHRMaterialsSpecular),
      film = doc.createExtension(KHRMaterialsIridescence);
    const transforms = doc.createExtension(KHRTextureTransform);
    const materials = new Map();
    const coating = doc.createExtension(KHRMaterialsClearcoat);
    function material(m) {
      if (materials.has(m)) return materials.get(m);
      const mat = doc
        .createMaterial()
        .setBaseColorFactor([...m.color.toArray(), m.opacity ?? 1])
        .setRoughnessFactor(m.roughness ?? 1)
        .setMetallicFactor(m.metalness ?? 0);
      if (m.clearcoat)
        mat.setExtension(
          'KHR_materials_clearcoat',
          coating
            .createClearcoat()
            .setClearcoatFactor(m.clearcoat)
            .setClearcoatRoughnessFactor(m.clearcoatRoughness),
        );
      if (m.side === THREE.DoubleSide) mat.setDoubleSided(true);
      if (m.alphaTest > 0) mat.setAlphaMode('MASK').setAlphaCutoff(m.alphaTest);
      else if (m.transparent) mat.setAlphaMode('BLEND');
      if (m.userData.turnedMetal) {
        mat.setExtension(
          'KHR_materials_anisotropy',
          anisotropy
            .createAnisotropy()
            .setAnisotropyStrength(0.79)
            .setAnisotropyTexture(turned.anisotropy),
        );
        mat.setNormalTexture(turned.normal);
      }
      if (m.transmission) {
        mat.setExtension(
          'KHR_materials_transmission',
          transmission.createTransmission().setTransmissionFactor(m.transmission),
        );
        mat.setExtension('KHR_materials_ior', ior.createIOR().setIOR(m.ior));
      }
      if (m.iridescence)
        mat.setExtension(
          'KHR_materials_iridescence',
          film
            .createIridescence()
            .setIridescenceFactor(m.iridescence)
            .setIridescenceIOR(m.iridescenceIOR)
            .setIridescenceThicknessMinimum(m.iridescenceThicknessRange[0])
            .setIridescenceThicknessMaximum(m.iridescenceThicknessRange[1]),
        );
      if (m.isMeshPhysicalMaterial && m.specularIntensity !== 1)
        mat.setExtension(
          'KHR_materials_specular',
          specular
            .createSpecular()
            .setSpecularFactor(m.specularIntensity)
            .setSpecularColorFactor(m.specularColor.toArray()),
        );
      if (m.map) {
        const [u, v, w, h] = rects.get(m.map);
        mat.setBaseColorTexture(texture);
        mat
          .getBaseColorTextureInfo()
          .setExtension(
            'KHR_texture_transform',
            transforms.createTransform().setOffset([u, v]).setScale([w, h]),
          );
      }
      if (finishes.has(m.name)) {
        const finish = finishes.get(m.name);
        mat
          .setBaseColorTexture(finish.albedo)
          .setNormalTexture(finish.normal)
          .setMetallicRoughnessTexture(finish.orm)
          .setOcclusionTexture(finish.orm);
      }
      materials.set(m, mat);
      return mat;
    }
    function accessor(type, array) {
      return doc.createAccessor().setBuffer(buffer).setType(type).setArray(array);
    }
    function convert(o) {
      const node = doc
        .createNode(o.name)
        .setTranslation(o.position.toArray().map((n) => n * metre))
        .setRotation(o.quaternion.toArray())
        .setScale(o.scale.toArray())
        .setExtras(o.userData);
      if (o.isMesh) {
        const g = o.geometry,
          mesh = doc.createMesh();
        const pos = accessor(
          'VEC3',
          Float32Array.from(g.attributes.position.array, (n) => n * metre),
        );
        const normals = accessor('VEC3', g.attributes.normal.array);
        const coords = Float32Array.from(g.attributes.uv.array, (n, i) => (i % 2 ? 1 - n : n));
        if (finishes.has(o.material.name))
          for (let i = 0; i < pos.getCount(); i++) {
            if (g.userData.uvInMillimetres) {
              coords[2 * i] = g.attributes.uv.getX(i) / tileMm[o.material.name];
              coords[2 * i + 1] = -g.attributes.uv.getY(i) / tileMm[o.material.name];
              continue;
            }
            const p = g.attributes.position,
              n = g.attributes.normal,
              ax = Math.abs(n.getX(i)),
              ay = Math.abs(n.getY(i)),
              az = Math.abs(n.getZ(i));
            coords[i * 2] = (ax > ay && ax > az ? p.getZ(i) : p.getX(i)) / tileMm[o.material.name];
            coords[i * 2 + 1] =
              (ay > ax && ay > az ? p.getZ(i) : p.getY(i)) / tileMm[o.material.name];
          }
        const uv = accessor('VEC2', coords);
        const idx = g.index?.array ?? Uint32Array.from({length: pos.getCount()}, (_, i) => i);
        const groups = Array.isArray(o.material)
          ? g.groups
          : [{start: 0, count: idx.length, materialIndex: 0}];
        for (const a of groups) {
          const primitive = doc
            .createPrimitive()
            .setMaterial(material([].concat(o.material)[a.materialIndex]))
            .setAttribute('POSITION', pos)
            .setAttribute('NORMAL', normals)
            .setAttribute('TEXCOORD_0', uv)
            .setIndices(
              accessor('SCALAR', Uint32Array.from(idx.slice(a.start, a.start + a.count))),
            );
          mesh.addPrimitive(primitive);
        }
        node.setMesh(mesh);
      }
      for (const child of o.children) node.addChild(convert(child));
      return node;
    }
    doc.createScene('摄影棚').addChild(convert(root));
    await MeshoptEncoder.ready;
    const io = new NodeIO()
      .registerExtensions([
        KHRTextureBasisu,
        KHRTextureTransform,
        EXTMeshoptCompression,
        KHRMaterialsClearcoat,
        KHRMaterialsAnisotropy,
        KHRMaterialsTransmission,
        KHRMaterialsIOR,
        KHRMaterialsSpecular,
        KHRMaterialsIridescence,
      ])
      .registerDependencies({'meshopt.encoder': MeshoptEncoder});
    const dest = fromPrototype ? 'build/prototype-camera' : 'assets/camera';
    await fs.mkdir(dest, {recursive: true});
    if (lod) {
      await MeshoptSimplifier.ready;
      await doc.transform(
        weld(),
        simplify({simplifier: MeshoptSimplifier, ratio: 0.48, error: 0.01}),
      );
    }
    await fs.writeFile(
      path.join(dest, lod ? 'a7v_lod1.glb' : 'a7v.glb'),
      await io.writeBinary(doc),
    );
  } finally {
    await fs.rm(temp, {recursive: true, force: true});
  }
}
await exportModel(0);
await exportModel(1);
