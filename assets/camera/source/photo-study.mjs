// Authoring space is in millimetres, looking at the back: +X points to the grip,
// +Y up, -Z out through the lens. The exporter rotates to glTF +Z forward.
// See docs/reviews/model-v2/README.md for the source views and calibration.
import * as T from 'three';
import {TessellateModifier} from 'three/examples/jsm/modifiers/TessellateModifier.js';
import {createCanvas} from '@napi-rs/canvas';
const pi = Math.PI,
  rad = T.MathUtils.degToRad;
// Printed positions measured in the normalized side and top photographs.
export const apertureAngles = [0, 10.7, 21.5, 32.2, 42.9, 53.6, 64.4, 75.0];
export const zoomAngles = [0, 20, 43.5, 69];
export function photoStudy(lod = 0) {
  const segments = (n, min = 8) => (lod ? Math.max(min, Math.ceil(n * 0.56)) : n);
  const group = (name = '') => Object.assign(new T.Group(), {name});
  const paint = (color, roughness, metalness = 0) =>
    new T.MeshStandardMaterial({color, roughness, metalness});
  const enamel = paint(0x373536, 0.87, 0.04),
    rubber = paint(0x363230, 0.85, 0.015),
    black = paint(0x222122, 0.59, 0.11),
    metal = paint(0x343334, 0.38, 0.53),
    silver = paint(0xaaa9a6, 0.33, 0.78),
    smoothRubber = paint(0x333132, 0.79, 0.02);
  enamel.name = '砂纹漆';
  rubber.name = '握把皮纹';
  const barrelPaint = paint(0x444142, 0.84, 0.055);
  barrelPaint.name = '砂纹漆';
  const taperPaint = paint(0x121213, 0.84, 0.04);
  function mesh(g, m, parent, x = 0, y = 0, z = 0) {
    const o = new T.Mesh(g, m);
    o.position.set(x, y, z);
    parent.add(o);
    return o;
  }
  function texture(w, h, draw) {
    const c = createCanvas(w, h);
    draw(c.getContext('2d'), w, h);
    return new T.CanvasTexture(c);
  }
  function label(text, bg = null, fg = '#eeefea', size = 82, family = 'Arial', fill = 0) {
    const map = texture(256, 128, (c, w, h) => {
      if (bg) {
        c.fillStyle = bg;
        c.fillRect(0, 0, w, h);
      }
      c.font = 'bold ' + size + 'px ' + family;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillStyle = fg;
      c.translate(w / 2, h / 2);
      const width = Math.max(1, c.measureText(text).width);
      c.scale(fill ? (w * fill) / width : Math.min(1, (w * 0.93) / width), 1);
      c.fillText(text, 0, 0);
    });
    return new T.MeshStandardMaterial({
      map,
      roughness: 0.75,
      metalness: 0,
      transparent: !bg,
      alphaTest: bg ? 0 : 0.3,
    });
  }
  function plate(p, w, h, m, x, y, z, normal = 'back') {
    const o = mesh(new T.PlaneGeometry(w, h), m, p, x, y, z);
    if (normal === 'front') o.rotation.y = pi;
    if (normal === 'top') o.rotation.x = -pi / 2;
    return o;
  }
  function roundPath(w, h, r, x = -w / 2, y = -h / 2) {
    const s = new T.Shape();
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }
  function extrude(shape, depth, bevel = 0.45) {
    const g = new T.ExtrudeGeometry(shape, {
      depth: depth - 2 * bevel,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: lod ? 1 : 3,
      curveSegments: lod ? 3 : 7,
    });
    return g.translate(0, 0, -(depth - 2 * bevel) / 2);
  }
  function block(p, w, h, d, r, m, x, y, z) {
    const b = Math.min(0.4, w * 0.16, h * 0.16, d * 0.16);
    return mesh(
      extrude(roundPath(w - 2 * b, h - 2 * b, Math.min(r, w / 2 - b, h / 2 - b)), d, b),
      m,
      p,
      x,
      y,
      z,
    );
  }
  function disc(p, r, depth, m, x, y, z, normal = 'top', count = 48) {
    const o = mesh(new T.CylinderGeometry(r, r, depth, segments(count)), m, p, x, y, z);
    if (normal === 'back') o.rotation.x = pi / 2;
    if (normal === 'front') o.rotation.x = -pi / 2;
    return o;
  }
  function outline(points) {
    const s = new T.Shape();
    s.moveTo(...points[0]);
    for (const pt of points.slice(1)) s.lineTo(...pt);
    s.closePath();
    return s;
  }
  function ridged(p, r, depth, teeth, m, axis = 'top') {
    const points = [];
    teeth = segments(teeth, 28);
    for (let i = 0; i < teeth; i++)
      for (const [offset, delta] of [
        [0, -0.3],
        [0.23, 0.0],
        [0.55, 0.0],
        [0.85, -0.3],
      ]) {
        const a = (2 * pi * (i + offset)) / teeth;
        points.push([Math.cos(a) * (r + delta), Math.sin(a) * (r + delta)]);
      }
    const shape = outline(points);
    if (r > 25) {
      const bore = new T.Path();
      bore.absarc(0, 0, r - 2.05, 0, 2 * pi, true);
      shape.holes.push(bore);
    }
    const g = new T.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: false,
      curveSegments: r > 25 ? segments(52, 28) : 1,
    }).translate(0, 0, -depth / 2);
    const o = mesh(g, m, p);
    if (axis === 'top') o.rotation.x = -pi / 2;
    return o;
  }
  function tube(p, outer, inner, depth, m, x, y, z) {
    const lip = Math.min(0.075, depth / 4, (outer - inner) / 4),
      d = depth / 2;
    const profile = [
      [outer - lip, -d],
      [outer, -d + lip],
      [outer, d - lip],
      [outer - lip, d],
      [inner + lip, d],
      [inner, d - lip],
      [inner, -d + lip],
      [inner + lip, -d],
      [outer - lip, -d],
    ];
    return faceCap(p, profile, m, x, y, z, false, 96);
  }
  // A stack of closed horizontal contours. Each contour runs counterclockwise in XZ.
  // Normals on the side wall are shared. The two caps have separate flat normals.
  function loft(parent, levels, material, count = 72) {
    count = segments(count, 32);
    const vertices = [],
      indices = [],
      uv = [];
    const rings = levels.map(([height, shape]) => {
      const ring = shape.getSpacedPoints(count).slice(0, -1);
      if (T.ShapeUtils.isClockWise(ring)) ring.reverse();
      for (const pt of ring) {
        vertices.push(pt.x, height, pt.y);
        uv.push(pt.x / 20, pt.y / 20);
      }
      return ring;
    });
    for (let i = 1; i < rings.length; i++)
      for (let j = 0; j < count; j++) {
        const a = (i - 1) * count + j,
          b = (i - 1) * count + ((j + 1) % count);
        indices.push(a, a + count, b, b, a + count, b + count);
      }
    for (const k of [0, rings.length - 1]) {
      const offset = vertices.length / 3;
      for (const pt of rings[k]) {
        vertices.push(pt.x, levels[k][0], pt.y);
        uv.push(pt.x / 20, pt.y / 20);
      }
      for (const [a, b, c] of T.ShapeUtils.triangulateShape(rings[k], []))
        indices.push(offset + a, offset + (k ? c : b), offset + (k ? b : c));
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    g.setIndex(indices);
    g.computeVertexNormals();
    return mesh(g, material, parent);
  }
  function faceCap(p, profile, mat, x = 0, y = 0, z = 0, top = false, n = 48) {
    const g = new T.LatheGeometry(
      profile.map(([r, h]) => new T.Vector2(r, h)),
      segments(n),
    );
    if (!top) g.rotateX(pi / 2);
    return mesh(g, mat, p, x, y, z);
  }
  // Axially brushed black metal on the three top dials and shutter cap.
  const brushed = new T.MeshPhysicalMaterial({color: 0x64615f, roughness: 0.34, metalness: 0.74});
  brushed.userData.turnedMetal = true;
  function dialFace(p, r, y) {
    const cap = mesh(new T.CircleGeometry(r, segments(72)), brushed, p, 0, y, 0);
    cap.rotation.x = -pi / 2;
    return cap;
  }

  const root = group(),
    lens = group('lens'),
    ctl = {},
    parts = {};
  root.add(lens);
  const marks = group('decal_brand'),
    brand = group('body_decal_brand');
  root.add(marks);
  marks.add(brand);
  function reg(id, o, face = [0, 0, 1]) {
    (ctl[id] ??= {objs: [], face: new T.Vector3(...face)}).objs.push(o);
    return o;
  }
  // Sony rear press frame, scaled to 800 px width for the coordinates below.
  const X = (u) => (u - 338) / 4.67,
    Y = (v) => (319.5 - v) / 4.67;
  // Sony top press frame. The focal-plane mark is at v=253.
  const TX = (u) => (u - 334) / 4.97,
    TZ = (v) => (v - 253) / 5.02;
  const chassis = group('body_static');
  root.add(chassis);
  // The back panel sits in front of the button caps. The shoulder rolls down
  // from its flat deck before reaching the row of rear-facing buttons.
  function shellOutline(inset = 0) {
    const x = (n) => TX(n),
      z = (n) => TZ(n);
    const path = new T.Shape();
    path.moveTo(x(77) + inset, z(215));
    path.quadraticCurveTo(x(94), z(189) + inset, x(153), z(189) + inset);
    path.lineTo(x(526), z(189) + inset);
    path.quadraticCurveTo(x(633), z(182) + inset, x(692) - inset, z(207) + inset);
    path.quadraticCurveTo(x(720) - inset, z(218), x(720) - inset, z(304));
    path.lineTo(x(717) - inset, z(351) - inset);
    path.quadraticCurveTo(x(713) - inset, z(387) - inset, x(685) - inset, z(388) - inset);
    path.lineTo(x(103) + inset, z(383) - inset);
    path.quadraticCurveTo(x(78) + inset, z(382) - inset, x(77) + inset, z(357) - inset);
    path.closePath();
    return path;
  }
  loft(
    chassis,
    [
      [-40.7, shellOutline(1.4)],
      [-40.35, shellOutline(0.65)],
      [-39.3, shellOutline(0.15)],
      [-37.8, shellOutline()],
      [19.86, shellOutline()],
      [20.12, shellOutline(0.05)],
      [20.42, shellOutline(0.3)],
      [20.7, shellOutline(0.24)],
    ],
    enamel,
    100,
  );
  // Separate strips preserve the curved shoulder under side lighting.
  const sections = [
    [188, 145, 526, 32.4],
    [190, 131, 555, 33.0],
    [194, 112, 626, 33.15],
    [200, 94, 674, 33.2],
    [211, 79, 699, 33.2],
    [218, 76, 705, 33.2],
    [239, 76, 716, 33.2],
    [265, 76, 719, 33.2],
    [298, 76, 721, 33.15],
    [320, 76, 721, 32.8],
    [335, 79, 720, 31.85],
    [342, 86, 718, 30.6],
    [352, 87, 715, 28.9],
    [368, 85, 711, 26.0],
    [379, 91, 705, 23.6],
    [386, 118, 679, 20.65],
  ];
  const pos = [],
    idx = [],
    tex = [];
  for (const [i, [v, l, r, h]] of sections.entries()) {
    const bevel = 0.7;
    for (const [x, y] of [
      [TX(l), 20.25],
      [TX(l), h - bevel],
      [TX(l) + 0.3, h - 0.16],
      [TX(l) + bevel, h],
      [TX(l) + 1.9, h],
      [TX(r) - 1.9, h],
      [TX(r) - bevel, h],
      [TX(r) - 0.3, h - 0.16],
      [TX(r), h - bevel],
      [TX(r), 20.25],
    ]) {
      pos.push(x, y, TZ(v));
      tex.push(x / 20, TZ(v) / 20);
    }
    if (i)
      for (let j = 0; j < 9; j++) {
        const a = (i - 1) * 10 + j;
        idx.push(a, a + 10, a + 1, a + 1, a + 10, a + 11);
      }
  }
  for (const [i, first] of [
    [0, true],
    [sections.length - 1, false],
  ]) {
    for (let j = 1; j < 9; j++) {
      const a = i * 10;
      idx.push(a, a + (first ? j : j + 1), a + (first ? j + 1 : j));
    }
  }
  const deck = new T.BufferGeometry();
  deck.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  deck.setAttribute('uv', new T.Float32BufferAttribute(tex, 2));
  deck.setIndex(idx);
  deck.computeVertexNormals();
  mesh(deck, enamel, chassis);
  // Follow the rolled shoulder under the rear buttons into the screen recess.
  const fasciaPos = [],
    fasciaUV = [],
    fasciaIndices = [];
  const fasciaProfile = [
    [18.8, 29.1],
    [21.6, 28.95],
    [23.7, 28.5],
    [25.6, 27.55],
    [26.95, 26.03],
    [27.7, 24.35],
    [27.93, 22.3],
    [27.85, 20.0],
    [27.45, 17.6],
    [26.85, 15.1],
    [25.55, 12.0],
  ];
  const columns = segments(72, 39);
  for (let i = 0; i <= columns; i++) {
    const x = -49.8 + (126.5 * i) / columns;
    const setback = Math.max(0, 1 - Math.min(i, columns - i) / 3) * 1.65;
    const swell = 0.55 * Math.exp(-((x - 43) ** 2) / 55) + 0.46 * Math.exp(-((x + 40) ** 2) / 44);
    for (const [j, [z, y]] of fasciaProfile.entries()) {
      fasciaPos.push(x, y, z - setback + swell * Math.sin((j * pi) / (fasciaProfile.length - 1)));
      fasciaUV.push(x / 12, y / 12);
      if (i < columns && j < fasciaProfile.length - 1) {
        const a = i * fasciaProfile.length + j,
          b = a + fasciaProfile.length;
        fasciaIndices.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
  }
  const fascia = new T.BufferGeometry();
  fascia.setAttribute('position', new T.Float32BufferAttribute(fasciaPos, 3));
  fascia.setAttribute('uv', new T.Float32BufferAttribute(fasciaUV, 2));
  fascia.setIndex(fasciaIndices);
  fascia.computeVertexNormals();
  mesh(fascia, enamel, chassis);
  const sensorMark = group();
  chassis.add(sensorMark);
  sensorMark.position.set(TX(182), 33.35, 0);
  const circle = mesh(new T.TorusGeometry(0.98, 0.095, 5, 24), silver, sensorMark);
  circle.rotation.x = -pi / 2;
  block(sensorMark, 4.8, 0.18, 0.16, 0.06, silver, 0, 0, 0);
  // Top-view grip outline includes the scallop behind the shutter.
  function gripShape() {
    const s = new T.Shape();
    s.moveTo(TX(510), TZ(201));
    s.quadraticCurveTo(TX(530), TZ(195), TX(535), TZ(170));
    s.bezierCurveTo(TX(550), TZ(119), TX(564), TZ(67), TX(605), TZ(64));
    s.bezierCurveTo(TX(670), TZ(49), TX(701), TZ(90), TX(712), TZ(152));
    s.quadraticCurveTo(TX(722), TZ(201), TX(717), TZ(231));
    s.quadraticCurveTo(TX(708), TZ(251), TX(675), TZ(255));
    s.lineTo(TX(601), TZ(242));
    s.lineTo(TX(551), TZ(227));
    s.lineTo(TX(512), TZ(233));
    s.closePath();
    return s;
  }
  function stand(s, bottom, height, m, parent) {
    const o = mesh(extrude(s, height, 0.7), m, parent, 0, bottom + height / 2, 0);
    o.rotation.x = pi / 2;
    return o;
  }
  const gripLevels = [
    [-40.8, -1.5],
    [-39.1, 0],
    [-29, -0.4],
    [-14, -0.8],
    [0, -0.3],
    [10, 2.2],
    [16, 4.3],
    [19, 3.2],
    [21.8, 0.5],
    [23.0, 0],
  ];
  const skinPath = gripShape(),
    contour = skinPath.getSpacedPoints(88),
    circumference = skinPath.getLength();
  const vertices = [],
    indices = [],
    uv = [];
  for (const [i, [h, inset]] of gripLevels.entries())
    for (const [j, pt] of contour.entries()) {
      const weight = Math.min(1, Math.max(0, (-pt.y - 12) / 17));
      const wide = 1 + (i === 0 ? -0.027 : 0);
      vertices.push(52 + (pt.x - 52) * wide, h, pt.y + inset * weight);
      uv.push((circumference * j) / (contour.length - 1), h);
      if (i && j < contour.length - 1) {
        const prev = (i - 1) * contour.length + j,
          end = prev + 1;
        indices.push(
          prev,
          prev + contour.length,
          end,
          end,
          prev + contour.length,
          end + contour.length,
        );
      }
    }
  const gripGeo = new T.BufferGeometry();
  gripGeo.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
  gripGeo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  gripGeo.setIndex(indices);
  gripGeo.userData.uvInMillimetres = true;
  gripGeo.computeVertexNormals();
  mesh(gripGeo, rubber, chassis);
  stand(gripShape(), -40.8, 2, rubber, chassis);
  const gripDeck = stand(gripShape(), 21.8, 8.8, enamel, chassis);
  gripDeck.geometry = new TessellateModifier(lod ? 8 : 4.5, 5).modify(gripDeck.geometry);
  const capPos = gripDeck.geometry.attributes.position,
    originalNormals = gripDeck.geometry.attributes.normal.clone();
  for (let i = 0; i < capPos.count; i++) {
    const z = capPos.getY(i),
      height = gripDeck.position.y - capPos.getZ(i);
    const drop =
      Math.max(0, Math.min(1, (-z - 25) / 14)) * 4.2 * Math.max(0, (height - 21.8) / 8.8);
    capPos.setZ(i, capPos.getZ(i) + drop);
  }
  gripDeck.geometry.computeVertexNormals();
  for (let i = 0; i < capPos.count; i++)
    if (originalNormals.getZ(i) < -0.99) {
      const z = capPos.getY(i),
        slope = z < -39 || z > -25 ? 0 : 0.3;
      const normal = new T.Vector3(0, -slope, -1).normalize();
      gripDeck.geometry.attributes.normal.setXYZ(i, normal.x, normal.y, normal.z);
    }
  // Raised thumb rest on the right and the separate rubber section on the rear.
  const thumb = new T.Shape();
  thumb.moveTo(X(575), Y(230));
  thumb.quadraticCurveTo(X(575), Y(219), X(603), Y(221));
  thumb.bezierCurveTo(X(653), Y(218), X(687), Y(235), X(687), Y(301));
  thumb.bezierCurveTo(X(687), Y(354), X(671), Y(413), X(672), Y(494));
  thumb.quadraticCurveTo(X(656), Y(501), X(631), Y(495));
  thumb.lineTo(X(634), Y(401));
  thumb.bezierCurveTo(X(637), Y(338), X(600), Y(348), X(591), Y(329));
  thumb.quadraticCurveTo(X(587), Y(263), X(575), Y(244));
  thumb.closePath();
  const thumbSeat = mesh(extrude(thumb, 3.4, 1.35), black, chassis, 0, 0, 27.68);
  thumbSeat.name = 'thumb_pad_bezel';
  mesh(extrude(thumb, 3.5, 0.9), rubber, chassis, 0, 0, 28.0);
  const evfLevels = [
    [20, 47, 40, 4],
    [33, 47.3, 41.4, 4],
    [36, 45, 39.4, 4],
    [44, 38.7, 36.4, 5.6],
    [51.5, 32.1, 31.8, 6.55],
    [52.1, 31.4, 30.8, 6.9],
  ];
  loft(
    chassis,
    evfLevels.map(([y, w, d, center]) => [y, roundPath(w, d, 1.7, -w / 2, center - d / 2)]),
    enamel,
    76,
  );
  const frontSign = plate(
    brand,
    24.6,
    6.3,
    label('SONY', null, '#eeede8', 107, 'Georgia', 0.89),
    0,
    43.5,
    -12.95,
    'front',
  );
  frontSign.rotation.x = 0.4;
  const alphaArt = texture(192, 144, (c) => {
    c.strokeStyle = '#efeee9';
    c.lineWidth = 12;
    c.lineJoin = 'round';
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(148, 29);
    c.bezierCurveTo(125, 48, 122, 78, 98, 99);
    c.bezierCurveTo(75, 121, 45, 109, 44, 81);
    c.bezierCurveTo(42, 55, 56, 32, 78, 31);
    c.bezierCurveTo(103, 30, 111, 55, 119, 79);
    c.bezierCurveTo(127, 103, 133, 113, 151, 108);
    c.stroke();
  });
  plate(
    brand,
    8.8,
    6.9,
    new T.MeshStandardMaterial({map: alphaArt, transparent: true, roughness: 0.72}),
    -36,
    25.7,
    -13.35,
    'front',
  );
  plate(
    brand,
    3.6,
    3.5,
    label('7', null, '#eeede8', 110, 'Georgia', 0.72),
    -36,
    18.8,
    -13.35,
    'front',
  );
  const topSign = plate(
    brand,
    11.2,
    3.4,
    label('α7 V', null, '#eeede8', 92, 'Georgia', 0.9),
    TX(178),
    29.15,
    TZ(363),
    'top',
  );
  topSign.rotateX(0.66);
  // Mount collar behind the lens. Front face sits 18 mm ahead of the sensor.
  disc(chassis, 30.35, 3.25, black, 0, 0, -12.98, 'front', 84);
  tube(chassis, 30.3, 25.1, 3.8, paint(0x955231, 0.35, 0.78), 0, 0, -15.6);
  tube(chassis, 27.4, 25.4, 1.2, silver, 0, 0, -17.4);
  const eye = group();
  eye.position.set(0, Y(143), 32.2);
  root.add(eye);
  const eyecup = group('eyecup');
  eye.add(eyecup);
  block(eye, 40.6, 23, 13.1, 4.2, black, 0, 0.55, -5.4);
  const eyeShape = new T.Shape();
  eyeShape.moveTo(-17.3, -12.9);
  eyeShape.bezierCurveTo(-21.7, -12.6, -22.9, -9.1, -22.8, -4.2);
  eyeShape.bezierCurveTo(-23.8, 7.8, -19.7, 14.5, -13.5, 14.6);
  eyeShape.lineTo(13.6, 14.6);
  eyeShape.bezierCurveTo(19.7, 14.5, 23.2, 8.0, 22.7, -3.7);
  eyeShape.bezierCurveTo(22.8, -10.1, 21.5, -12.6, 17.0, -13.0);
  eyeShape.lineTo(12.2, -13.0);
  eyeShape.lineTo(11.8, -10.0);
  eyeShape.lineTo(-11.8, -10.0);
  eyeShape.lineTo(-12.3, -12.9);
  eyeShape.closePath();
  // Sample both rims at the same polar angles to make a recessed, continuous rubber cup.
  const outside = eyeShape.getPoints(12),
    inside = roundPath(30.1, 19.1, 3.5, -15.05, -8.9).getPoints(12);
  function radialEdge(points, dx, dy) {
    let nearest = Infinity;
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i],
        b = points[i + 1],
        sx = b.x - a.x,
        sy = b.y - a.y,
        den = dx * sy - dy * sx;
      if (Math.abs(den) < 1e-7) continue;
      const t = (a.x * sy - a.y * sx) / den,
        u = (a.x * dy - a.y * dx) / den;
      if (t > 0 && u >= 0 && u <= 1) nearest = Math.min(nearest, t);
    }
    return nearest;
  }
  const rimGeometry = new T.BufferGeometry(),
    rimPos = [],
    rimUV = [],
    rimIndices = [],
    nRim = segments(148);
  const section = [
    [0.09, 1.1],
    [0.015, 3.2],
    [0, 8.0],
    [0.04, 9.35],
    [0.15, 9.73],
    [0.27, 9.34],
    [0.65, 6.0],
    [0.91, 4.05],
    [1, 3.93],
    [1, 1.1],
    [0.09, 1.1],
  ];
  for (let i = 0; i < nRim; i++) {
    const a = (2 * pi * i) / nRim,
      dx = Math.cos(a),
      dy = Math.sin(a),
      outer = radialEdge(outside, dx, dy),
      inner = radialEdge(inside, dx, dy);
    for (const [mix, depth] of section) {
      const r = outer + (inner - outer) * mix;
      rimPos.push(r * dx, r * dy, depth);
      rimUV.push(i / nRim, mix);
    }
    for (let j = 0; j < section.length - 1; j++) {
      const a = i * section.length + j,
        b = ((i + 1) % nRim) * section.length + j;
      rimIndices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  rimGeometry.setAttribute('position', new T.Float32BufferAttribute(rimPos, 3));
  rimGeometry.setAttribute('uv', new T.Float32BufferAttribute(rimUV, 2));
  rimGeometry.setIndex(rimIndices);
  rimGeometry.computeVertexNormals();
  mesh(rimGeometry, smoothRubber, eyecup);
  const eyeBezel = roundPath(30.4, 19.4, 3);
  eyeBezel.holes.push(roundPath(19.7, 14.2, 0.9));
  mesh(extrude(eyeBezel, 2.8, 0.42), black, eye, 0, 0.15, 3.3);
  const evfMap = texture(128, 96, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#11120f');
    g.addColorStop(0.55, '#172021');
    g.addColorStop(1, '#263119');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    for (const [x, y, r, color] of [
      [27, 24, 22, 'rgba(168,174,119,.62)'],
      [86, 71, 26, 'rgba(75,102,47,.53)'],
      [70, 42, 16, 'rgba(59,44,82,.55)'],
    ]) {
      const light = c.createRadialGradient(x, y, 1, x, y, r);
      light.addColorStop(0, color);
      light.addColorStop(1, 'transparent');
      c.fillStyle = light;
      c.fillRect(0, 0, w, h);
    }
  });
  plate(
    eye,
    18.9,
    13.4,
    new T.MeshStandardMaterial({map: evfMap, roughness: 0.19, metalness: 0.22}),
    0,
    0.1,
    3.26,
  );
  block(eye, 22.4, 4.3, 3.9, 0.9, black, 0, -10.5, 7.8);
  block(eye, 15.2, 5.4, 2.8, 1.0, smoothRubber, 0, -12.7, 8.7);
  block(eye, 8.8, 2.6, 0.4, 0.5, black, 0, -11.8, 10.2);
  reg('evf', eye);
  const diopter = group();
  root.add(diopter);
  diopter.position.set(22.8, 37, 30.2);
  ridged(diopter, 3.2, 2.2, 28, black, 'back').rotation.y = pi / 2;
  reg('diopter', diopter, [1, 0, 0]);
  const lcd = group();
  root.add(lcd);
  lcd.position.set(X(318), Y(367), 29.1);
  block(lcd, 77.2, 59.1, 4.2, 1.7, black, 0, 0, 0);
  const idle = texture(192, 128, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#424044');
    g.addColorStop(0.48, '#302e31');
    g.addColorStop(1, '#171619');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
  });
  const display = plate(
    lcd,
    67.65,
    45.35,
    new T.MeshStandardMaterial({map: idle, roughness: 0.32, metalness: 0.21}),
    0,
    2.72,
    2.16,
  );
  display.name = 'lcd_screen';
  reg('lcd', lcd);
  block(chassis, 7.55, 57.0, 7.2, 1.4, black, X(115), Y(367), 27.9);
  for (const [v, h] of [
    [283, 19.7],
    [370, 16.7],
    [455.2, 19.1],
  ])
    block(chassis, 8.05, h, 8.75, 1.45, smoothRubber, X(115), Y(v), 28.15);
  const addButton = (id, text, u, v, r, d = 2.6) => {
    const g = group();
    root.add(g);
    g.position.set(X(u), Y(v), 27.1);
    faceCap(
      g,
      [
        [0.05, 0],
        [r + 0.85, 0],
        [r + 0.76, 0.64],
        [r + 0.47, 1.24],
        [r + 0.12, 1.38],
        [r - 0.17, 1.1],
      ],
      black,
    );
    faceCap(
      g,
      [
        [r - 0.14, 0.71],
        [r, 1.35],
        [r - 0.13, 1.35 + d * 0.43],
        [r - 0.47, 1.35 + d * 0.61],
        [0.01, 1.44 + d * 0.61],
      ],
      id === 'joystick' ? smoothRubber : metal,
    );
    if (text)
      plate(
        g,
        r * (id === 'btn_afon' ? 1.22 : 1.54),
        r * (id === 'btn_afon' ? 0.66 : 0.87),
        label(text, null, '#efeee9', 105),
        0,
        0,
        1.49 + d * 0.61,
      );
    return reg(id, g);
  };
  addButton('btn_c3', 'C3', 147, 192, 3.4);
  const menu = group();
  root.add(menu);
  menu.position.set(X(204), Y(191), 28.9);
  const menuBezel = roundPath(14.1, 7.7, 3.3);
  menuBezel.holes.push(roundPath(11.7, 5.3, 2.2));
  mesh(extrude(menuBezel, 1.55, 0.24), black, chassis, X(204), Y(191), 28.37);
  block(menu, 11.4, 4.8, 2.7, 2.2, black, 0, 0, 0);
  plate(menu, 8.3, 2.7, label('MENU', null, '#efeee9', 101), 0, 0, 1.41);
  reg('btn_menu', menu);
  addButton('btn_c1', 'C1', 471, 192, 3.5);
  addButton('btn_afon', 'AF-ON', 536, 198, 5.35, 3.5);
  addButton('btn_ael', 'AEL', 649, 198, 2.85);
  addButton('btn_fn', 'Fn', 547, 325, 2.9);
  addButton('btn_play', '', 548, 475, 3);
  addButton('btn_c4', '', 604, 475, 3);
  plate(chassis, 5, 3, label('C4'), X(617), Y(453), 28.9);
  const joy = addButton('joystick', '', 547, 270, 5.0, 3);
  const tooth = new T.OctahedronGeometry(0.94);
  for (let j = -2; j <= 2; j++)
    for (let i = -2; i <= 2; i++) {
      const x = (i + (Math.abs(j) % 2) * 0.5) * 1.63,
        y = j * 1.43;
      if (Math.hypot(x, y) > 3.6) continue;
      const facet = mesh(tooth, smoothRubber, joy, x, y, 3.2);
      facet.scale.z = 0.77;
    }
  const wheel = group();
  root.add(wheel);
  wheel.position.set(X(571), Y(397), 28.4);
  faceCap(
    wheel,
    [
      [0.05, -0.6],
      [10.7, -0.6],
      [10.6, 0.2],
      [10.2, 1.0],
      [9.8, 1.3],
      [8.9, 1.4],
      [8.4, 0.9],
    ],
    black,
  );
  const ringVertices = [],
    ringIndices = [],
    ringUV = [];
  for (let j = 0; j < 42 * 4; j++) {
    const a = (2 * pi * j) / (42 * 4),
      rise = [0, 0.68, 0.79, 0.2][j % 4];
    for (const [r, h, offset] of [
      [5.5, 1.47, 0],
      [7.65, 1.47 + rise, 0.022],
      [9.2, 1.34 + rise, 0.037],
      [9.4, 0.9, 0],
    ]) {
      ringVertices.push(r * Math.cos(a + offset), r * Math.sin(a + offset), h);
      ringUV.push(j / (42 * 4), r / 10);
    }
    for (let k = 0; k < 3; k++) {
      const a = j * 4 + k,
        b = ((j + 1) % (42 * 4)) * 4 + k;
      ringIndices.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  const spokes = new T.BufferGeometry();
  spokes.setAttribute('position', new T.Float32BufferAttribute(ringVertices, 3));
  spokes.setAttribute('uv', new T.Float32BufferAttribute(ringUV, 2));
  spokes.setIndex(ringIndices);
  spokes.computeVertexNormals();
  mesh(spokes, black, wheel);
  reg('wheel', wheel);
  addButton('btn_center', '', 571, 397, 3.84, 4.35);
  for (const [txt, u, v, w] of [
    ['DISP', 571, 343, 5.6],
    ['ISO', 627, 397, 3.6],
    ['◷', 516, 391, 3.6],
    ['⊞', 573, 186, 3.6],
    ['▦', 669, 182, 3.5],
    ['⚿', 116, 181, 3.7],
  ])
    plate(chassis, w, 2.85, label(txt, null, '#eeece5', 105), X(u), Y(v), 29.5);
  function keyIcon(id, draw) {
    const g = ctl[id].objs[0];
    const art = texture(96, 96, (c) => {
      c.strokeStyle = '#f5f2ed';
      c.fillStyle = '#f5f2ed';
      c.lineWidth = 7;
      c.lineCap = 'round';
      c.lineJoin = 'round';
      draw(c);
    });
    plate(
      g,
      3.7,
      3.7,
      new T.MeshStandardMaterial({map: art, transparent: true, alphaTest: 0.3, roughness: 0.6}),
      0,
      0,
      3.18,
    );
  }
  keyIcon('btn_play', (c) => {
    c.strokeRect(9, 19, 78, 59);
    c.beginPath();
    c.moveTo(39, 32);
    c.lineTo(64, 49);
    c.lineTo(39, 66);
    c.fill();
  });
  keyIcon('btn_c4', (c) => {
    c.strokeRect(30, 32, 40, 48);
    c.strokeRect(39, 13, 21, 8);
    c.beginPath();
    c.moveTo(19, 27);
    c.lineTo(79, 27);
    c.moveTo(44, 42);
    c.lineTo(44, 67);
    c.moveTo(56, 42);
    c.lineTo(56, 67);
    c.stroke();
  });
  const topKey = (id, u, v, r, y, mat, txt) => {
    const g = group();
    root.add(g);
    g.position.set(TX(u), y, TZ(v));
    disc(g, r + 0.45, 1.3, black, 0, 0, 0);
    faceCap(
      g,
      [
        [r, 0],
        [r, 0.73],
        [r - 0.2, 1.22],
        [r - 0.58, 1.55],
        [0.01, 1.57],
      ],
      mat,
      0,
      0,
      0,
      true,
    );
    if (txt) plate(g, r * 1.74, r * 0.96, label(txt, null, '#eeedea', 105), 0, 1.63, 0, 'top');
    reg(id, g, [0, 1, 0]);
    return g;
  };
  topKey('btn_c2', 583, 221, 3.4, 32.2, black, 'C2');
  const movie = topKey('btn_movie', 653, 222, 3.45, 32.3, black, '');
  const movieRing = mesh(
    new T.TorusGeometry(2.7, 0.25, 6, 40),
    paint(0xa74d36, 0.46, 0.28),
    movie,
    0,
    1.7,
    0,
  );
  movieRing.rotation.x = pi / 2;
  const topDial = (id, u, v, r, y, h) => {
    const g = group();
    root.add(g);
    g.position.set(TX(u), y, TZ(v));
    if (id !== 'mode_dial' && id !== 'mode_switch') ridged(g, r, h, 53, black);
    reg(id, g, [0, 1, 0]);
    return g;
  };
  const mode = topDial('mode_dial', 504, 268, 10.1, 41.32, 5.8);
  // Each diamond is cut into the ring. Its four flanks respond to oblique light.
  function diamondBand(parent, radius, height, columns, halfRows) {
    const vertices = [],
      tex = [];
    const halfPitch = pi / columns,
      rowStep = height / halfRows;
    function point(angle, y, r) {
      return [
        r * Math.sin(angle),
        Math.min(height / 2, Math.max(-height / 2, y)),
        r * Math.cos(angle),
      ];
    }
    for (let row = 0; row <= halfRows; row++)
      for (let col = 0; col < columns; col++) {
        const angle = (2 * col + (row % 2)) * halfPitch,
          y = row * rowStep - height / 2,
          r = radius - 0.24;
        const rim = [
          point(angle - halfPitch, y, r),
          point(angle, y + rowStep, r),
          point(angle + halfPitch, y, r),
          point(angle, y - rowStep, r),
        ];
        const peak = point(angle, y, radius);
        for (let k = 0; k < 4; k++) {
          vertices.push(...rim[k], ...peak, ...rim[(k + 1) % 4]);
          tex.push(0, 0, 0.5, 1, 1, 0);
        }
      }
    const geom = new T.BufferGeometry();
    geom.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
    geom.setAttribute('uv', new T.Float32BufferAttribute(tex, 2));
    geom.computeVertexNormals();
    mesh(geom, paint(0x302d2e, 0.39, 0.4), parent);
  }
  diamondBand(mode, 10.14, 5.18, 49, 8);
  faceCap(
    mode,
    [
      [9.7, -2.94],
      [9.96, -2.88],
      [10.04, -2.6],
      [9.9, -2.52],
    ],
    black,
    0,
    0,
    0,
    true,
    96,
  );
  faceCap(
    mode,
    [
      [9.91, 2.51],
      [10.03, 2.64],
      [9.96, 2.82],
      [9.73, 2.97],
    ],
    metal,
    0,
    0,
    0,
    true,
    96,
  );
  dialFace(mode, 9.76, 2.975);
  const modeTex = texture(512, 512, (c, w, h) => {
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    const labels = [
      ['AUTO', -22, 20, -45, 51],
      ['P', -38, 0, 0, 94],
      ['A', -27, -25, 44, 94],
      ['S', 0, -37, 87, 94],
      ['M', 26, -26, 135, 88],
      ['1', 37, -2, 178, 91],
      ['2', 27, 23, 220, 87],
      ['3', 2, 35, 265, 91],
    ];
    for (const [txt, x, y, rotation, size] of labels) {
      c.save();
      c.translate(w / 2 + x * 5.0, h / 2 + y * 5.0);
      c.rotate((rotation * pi) / 180);
      if (txt === 'AUTO') {
        c.fillStyle = '#167e88';
        c.beginPath();
        c.roundRect(-74, -29, 148, 58, 5);
        c.fill();
      }
      c.font = (txt === 'AUTO' ? 'bold ' : '500 ') + size + 'px Arial';
      c.fillStyle = '#f5f2eb';
      c.fillText(txt, 0, 1, txt === 'AUTO' ? 132 : 102);
      c.restore();
    }
    c.strokeStyle = '#efede6';
    c.lineWidth = 6.5;
    c.lineJoin = 'round';
    c.beginPath();
    c.arc(w / 2, h / 2, 226, -0.28, 1.78);
    c.arc(w / 2, h / 2, 151, 1.78, -0.28, true);
    c.closePath();
    c.stroke();
  });
  const print = mesh(
    new T.CircleGeometry(9.75, segments(96)),
    new T.MeshStandardMaterial({map: modeTex, transparent: true, roughness: 0.78}),
    mode,
    0,
    3.01,
    0,
  );
  print.rotation.x = -pi / 2;
  const lower = topDial('mode_switch', 504, 268, 10.55, 35.77, 4.4);
  disc(lower, 10.03, 2.1, black, 0, -2.34, 0);
  const lockMode = block(lower, 6.2, 3.0, 3.9, 0.85, black, -4.25, 1.03, -10.51);
  lockMode.rotation.y = rad(21);
  for (const x of [-1.6, 0, 1.6]) block(lockMode, 0.48, 0.52, 1.65, 0.18, metal, x, 1.58, -0.42);
  lockMode.name = 'mode_switch_lock';
  // The icon strip wraps across UV=0, directly behind the top dial as seen from the back.
  const lowerBand = texture(1024, 56, (c, w, h) => {
    c.fillStyle = '#373536';
    c.fillRect(0, 0, w, h);
    for (const origin of [0, w]) {
      c.save();
      c.translate(origin - 5, 23);
      c.scale(1.23, 1.08);
      c.fillStyle = '#eeeae3';
      c.beginPath();
      c.roundRect(-13, -8, 26, 18, 3);
      c.fill();
      c.fillRect(-7, -11, 9, 4);
      c.fillStyle = '#373536';
      c.beginPath();
      c.arc(0, 0.5, 4.8, 0, pi * 2);
      c.fill();
      c.fillStyle = '#eeeae3';
      c.fillRect(31, -8, 16, 16);
      c.beginPath();
      c.moveTo(48, 0);
      c.lineTo(56, -6);
      c.lineTo(56, 6);
      c.fill();
      c.font = 'bold 21px Arial';
      c.textBaseline = 'middle';
      c.fillText('S&Q', 76, 1);
      for (const x of [0, 44, 90]) c.fillRect(x - 1.5, 15, 3, 11);
      c.restore();
    }
  });
  mesh(
    new T.CylinderGeometry(10.54, 10.54, 4.38, segments(96), 1, true),
    new T.MeshStandardMaterial({map: lowerBand, roughness: 0.59}),
    lower,
  );
  faceCap(
    lower,
    [
      [10.5, 2.12],
      [10.5, 2.2],
      [9.65, 2.28],
      [9.53, 2.73],
    ],
    black,
    0,
    0,
    0,
    true,
    90,
  );
  block(chassis, 0.49, 0.36, 2.1, 0.1, silver, TX(502), 32.83, TZ(330));
  disc(chassis, 0.54, 0.32, silver, TX(430), 33.47, TZ(267));
  const rearR = topDial('dial_rear_r', 678, 324, 8.75, 34.9, 5.2);
  dialFace(rearR, 8.33, 2.64);
  const lock = faceCap(
    rearR,
    [
      [3.2, 2.66],
      [3.25, 2.85],
      [2.9, 3.42],
      [2.55, 3.73],
      [0.01, 3.76],
    ],
    metal,
    0,
    0,
    0,
    true,
  );
  lock.name = 'dial_rear_r_lock';
  const rearL = topDial('dial_rear_l', 586, 340, 7.45, 35.3, 3.75);
  dialFace(rearL, 7.26, 1.92);
  const frontDial = topDial('dial_front', 624, 91, 7.45, 21.55, 3.8);
  frontDial.rotation.x = 0.15;
  const power = topKey('power', 610, 135, 7.55, 30.6, black, '');
  block(power, 2.5, 2, 3.8, 0.7, black, 0, 0.9, -7.45);
  const shutter = topKey('shutter', 610, 135, 5.8, 32.1, metal, '');
  dialFace(shutter, 5.25, 1.6);
  plate(chassis, 5.1, 2.8, label('OFF', null, '#eeede8', 105), TX(666), 31.09, TZ(143), 'top');
  plate(chassis, 4.2, 2.8, label('ON', null, '#eeede8', 105), TX(654), 31.09, TZ(166), 'top');
  const shoe = group();
  root.add(shoe);
  shoe.position.set(0, 52.0, 5.5);
  block(shoe, 23.4, 1.1, 20.1, 0.8, black, 0, 0, 0);
  for (const sign of [-1, 1]) {
    block(shoe, 2.1, 2.2, 18.9, 0.5, metal, sign * 10, 1.1, 0);
    block(shoe, 3.2, 0.6, 17.2, 0.4, black, sign * 9.55, 2.1, 0.2);
  }
  const cover = group('hotshoe_cap');
  shoe.add(cover);
  block(cover, 17.2, 1.45, 16.5, 1.1, black, 0, 1.3, 0.6);
  block(cover, 12.7, 0.9, 13.5, 0.85, metal, 0, 2.0, 0.45);
  disc(cover, 2.7, 0.45, black, 0, 2.55, 3.8);
  disc(cover, 1.8, 0.56, silver, 0, 2.7, 3.8);
  for (const sign of [-1, 1]) disc(cover, 1.1, 0.4, black, sign * 4.5, 2.54, 5.7);
  for (let i = 0; i < 15; i++)
    block(shoe, 0.42, 0.4, 2.7, 0.06, silver, (i - 7) * 0.95, 0.92, -6.5);
  reg('hotshoe', shoe, [0, 1, 0]);
  const release = group();
  root.add(release);
  release.position.set(-28.9, -15, -14);
  disc(release, 3.5, 2.4, black, 0, 0, 0, 'front');
  reg('lens_release', release, [0, 0, -1]);
  for (const [u, v, sign, z] of [
    [86, 186, -1, TZ(251)],
    [715, 182, 1, TZ(284)],
  ]) {
    const shape = new T.Shape();
    shape.moveTo(-3.4, -3.9);
    shape.lineTo(1.05, -2.25);
    shape.bezierCurveTo(4.42, -0.85, 2.5, 3.45, -0.1, 3.0);
    shape.lineTo(-3.4, 2.8);
    shape.closePath();
    const hole = new T.Path();
    hole.absarc(0, 0, 1.49, 0, pi * 2, true);
    shape.holes.push(hole);
    const lug = mesh(extrude(shape, 1.95, 0.22), silver, chassis, X(u), Y(v), z);
    lug.scale.x = sign;
    lug.name = sign < 0 ? 'strap_lug_left' : 'strap_lug_right';
  }
  const doors = (id, x, y, z, w, h, d) => {
    const g = group();
    root.add(g);
    g.position.set(x, y, z);
    block(g, w, h, d, 1.5, black, 0, 0, 0);
    return reg(id, g, [Math.sign(x), 0, 0]);
  };
  const ports = doors('ports', -50.85, -3, 7, 1.25, 53.5, 31.3);
  for (const [y, z, h, d] of [
    [15, -5, 15.7, 15.2],
    [-6, -5, 24.0, 15.2],
    [9.5, 9, 26.8, 11.3],
    [-15.6, 9, 19.8, 11.3],
  ]) {
    block(ports, 0.8, h, d, 1.1, smoothRubber, -0.78, y, z);
    block(ports, 0.28, 1.1, 4.8, 0.13, black, -1.18, y - h / 2 + 2, z);
  }
  const cards = doors('card_door', 77, -5, 7, 1.2, 49, 29);
  block(cards, 1.1, 11, 2.4, 0.8, rubber, 0.7, 5, 3);
  const battery = group();
  root.add(battery);
  battery.position.set(55.4, -40.57, -3.2);
  const doorSkin = mesh(extrude(roundPath(23.6, 40.0, 4.6), 0.78, 0.22), black, battery);
  doorSkin.rotation.x = pi / 2;
  block(battery, 5.4, 0.55, 8.7, 1, metal, 6, -0.55, 6);
  reg('battery_door', battery, [0, -1, 0]);
  const socket = tube(chassis, 3.75, 2.22, 0.55, silver, 0, -40.88, 0);
  socket.rotation.x = pi / 2;
  for (const [x, z] of [
    [-47, -8],
    [-47, 17],
    [-19, 23],
    [29, 21],
    [71, 16],
    [52, -34],
  ]) {
    disc(chassis, 0.96, 0.35, black, x, -40.65, z);
    block(chassis, 1.28, 0.13, 0.23, 0.06, metal, x, -40.88, z);
  }
  // Front AF illuminator, three front-shell edges and the mount registration mark.
  const lamp = group('af_illuminator');
  chassis.add(lamp);
  lamp.position.set(33.1, 28.0, -13.65);
  disc(lamp, 1.94, 1.0, black, 0, 0, 0, 'front');
  disc(lamp, 1.43, 1.05, metal, 0, 0, -0.19, 'front');
  // Lens dimensions are referenced to the E-mount seating plane. Its bayonet
  // projects backward inside the camera. In the side-B photo 4.18 px = 1 mm.
  const lensStatic = group('lens_static');
  lens.add(lensStatic);
  function barrel(near, far, rNear, rFar, mat, p = lensStatic) {
    const o = mesh(
      new T.CylinderGeometry(rNear, rFar, far - near, segments(100), 1, true),
      mat,
      p,
      0,
      0,
      -18 - (near + far) / 2,
    );
    o.rotation.x = pi / 2;
    const uv = o.geometry.attributes.uv;
    for (let i = 0; i < uv.count; i++)
      uv.setXY(i, uv.getX(i) * pi * (rNear + rFar), uv.getY(i) * (far - near));
    o.geometry.userData.uvInMillimetres = true;
    return o;
  }
  const bayonet = group('lens_bayonet');
  lensStatic.add(bayonet);
  barrel(-8.0, -7.4, 20.9, 21.6, silver, bayonet);
  barrel(-7.4, -3.15, 21.6, 21.6, silver, bayonet);
  barrel(-3.15, -2.5, 21.9, 28.8, metal, bayonet);
  barrel(-2.5, 0, 28.8, 30.55, black, bayonet);
  barrel(0, 10.9, 30.55, 30.65, enamel);
  barrel(10.9, 12.0, 30.65, 31.0, enamel);
  barrel(12, 21.1, 31.0, 36.65, taperPaint);
  barrel(21.1, 25.6, 36.65, 36.9, black);
  barrel(25.6, 34.7, 36.8, 36.7, black);
  barrel(34.7, 37.6, 36.7, 36.7, enamel);
  barrel(37.6, 42.0, 36.7, 38.9, black);
  barrel(42, 65.1, 38.85, 38.95, black);
  barrel(65.1, 66.7, 38.95, 38.0, black);
  barrel(66.7, 82.4, 38.3, 38.3, barrelPaint);
  barrel(82.4, 83.6, 38.2, 39.1, black);
  barrel(83.6, 103.5, 39.1, 39.1, black);
  barrel(103.5, 104.3, 39.1, 38.55, black);
  const inner = group('lens_barrel_inner');
  lens.add(inner);
  barrel(65.6, 104.3, 37.92, 37.92, enamel, inner);
  barrel(104.3, 108.6, 38.55, 43.9, black, inner);
  barrel(108.6, 114.5, 43.9, 43.9, black, inner);
  barrel(114.5, 115.4, 43.9, 43.15, black, inner);
  barrel(115.4, 117.7, 43.15, 43.15, black, inner);
  barrel(117.7, 119.9, 43.15, 42.35, black, inner);
  function collar(id, near, far, r, teeth) {
    const g = group();
    lens.add(g);
    g.position.z = -18 - (near + far) / 2;
    ridged(g, r, far - near, teeth, smoothRubber, 'back');
    return reg(id, g, [0, 1, 0]);
  }
  const zoomRing = collar('ring_zoom', 42.8, 64.6, 39.14, 166),
    apRing = collar('ring_aperture', 29.6, 33.85, 37.37, 112);
  collar('ring_focus', 84.0, 103.0, 39.47, 168);
  function scales(r, depth, values, angles, p, offset, withTicks = false) {
    const map = texture(1024, 64, (c, w, h) => {
      c.fillStyle = '#232223';
      c.fillRect(0, 0, w, h);
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.font = '500 45px Arial';
      for (let i = 0; i < values.length; i++) {
        const x = (0.5 + angles[i] / 360) * w;
        c.save();
        c.translate(x, h * (withTicks ? 0.62 : 0.52));
        c.rotate(pi);
        c.scale(0.48, 1);
        c.fillStyle = values[i] === 'A' ? '#ec7454' : '#f4f0e9';
        c.fillText(String(values[i]), 0, 0);
        c.restore();
      }
      if (withTicks)
        for (let i = 0; i <= 18; i++) {
          const a = (i * apertureAngles[6]) / 18;
          c.fillStyle = '#ede9df';
          c.fillRect((0.5 + a / 360) * w - 0.8, 0, 1.6, i % 3 === 0 ? 17 : 9);
        }
    });
    const o = mesh(
      new T.CylinderGeometry(r, r, depth, segments(100), 1, true),
      new T.MeshStandardMaterial({map, roughness: 0.57, metalness: 0.15}),
      p,
      0,
      0,
      offset,
    );
    o.rotation.x = pi / 2;
  }
  scales(37.65, 3.45, [24, 35, 50, 70], zoomAngles, zoomRing, 15.2);
  scales(
    37.1,
    4.25,
    ['2.8', '4', '5.6', '8', '11', '16', '22', 'A'],
    apertureAngles,
    apRing,
    4.97,
    true,
  );
  block(lensStatic, 0.37, 0.19, 1.7, 0.06, silver, 0, 36.84, -18 - 35.3);
  block(lensStatic, 0.37, 0.19, 1.7, 0.06, silver, 0, 36.83, -18 - 24.75);
  const red = paint(0xba412a, 0.53, 0.1);
  block(inner, 0.66, 0.14, 2.35, 0.06, red, 0, 43.88, -18 - 111.05);
  // Build the front optical surfaces and engraved concentric filter threads.
  const frontSeat = [
    [34.03, 113.9],
    [34.03, 115.0],
    [35.3, 115.1],
    [37.2, 116.35],
    [37.45, 117.25],
    [38.38, 117.4],
  ];
  for (let i = 0; i < 4; i++)
    frontSeat.push(
      [38.53 + i * 0.34, 117.68 + i * 0.37],
      [38.78 + i * 0.34, 117.69 + i * 0.37],
      [38.86 + i * 0.34, 117.93 + i * 0.37],
    );
  frontSeat.push([40.57, 119.06], [41.0, 119.68], [42.35, 119.9], [42.55, 119.46]);
  // The seat closes the gaps behind the filter threads at oblique viewing angles.
  faceCap(
    inner,
    frontSeat.map(([r, f]) => [r, -f]),
    paint(0x4b4749, 0.33, 0.58),
    0,
    0,
    -18,
    false,
    128,
  );
  // Visible optical surfaces approximate the front appearance, not the optical prescription.
  // The deeper groups show real parallax when the camera is orbited.
  const optics = group('front_optics');
  inner.add(optics);
  function glassCap(name, radius, sag, depth, material) {
    const profile = Array.from({length: lod ? 10 : 26}, (_, i) => {
      const t = 1 - i / (lod ? 9 : 25);
      return new T.Vector2(Math.max(0.001, t * radius), sag * (1 - t * t));
    });
    const geom = new T.LatheGeometry(profile, segments(128));
    geom.rotateX(-pi / 2);
    const o = mesh(geom, material, optics, 0, 0, -18 - depth);
    o.name = name;
    return o;
  }
  const baffle = new T.MeshPhysicalMaterial({
    color: 0x242426,
    roughness: 0.61,
    metalness: 0.04,
    specularIntensity: 0.48,
  });
  const wall = [
    [25.94, 103.3],
    [26.13, 104.2],
    [26.25, 104.3],
    [26.37, 104.7],
    [27.1, 105.9],
    [28.2, 107.45],
    [30.1, 109.76],
    [32.0, 111.83],
    [33.7, 113.67],
    [34.16, 114.1],
  ];
  faceCap(
    optics,
    wall.map(([r, f]) => [r, -f]),
    baffle,
    0,
    0,
    -18,
    false,
    128,
  );
  const rearGlass = new T.MeshPhysicalMaterial({
    color: 0x454336,
    metalness: 0.17,
    roughness: 0.28,
    clearcoat: 0.2,
    clearcoatRoughness: 0.23,
    specularIntensity: 0.6,
    specularColor: 0xd5e7a6,
    iridescence: 0.42,
    iridescenceIOR: 1.42,
    iridescenceThicknessRange: [325, 375],
  });
  glassCap('rear_visible_element', 15.2, 4.5, 93.2, rearGlass);
  const innerRim = new T.MeshPhysicalMaterial({
    color: 0x3d4036,
    metalness: 0.1,
    roughness: 0.29,
    clearcoat: 0.12,
    clearcoatRoughness: 0.24,
    specularIntensity: 0.48,
    specularColor: 0xe0cfa5,
    iridescence: 0.55,
    iridescenceIOR: 1.43,
    iridescenceThicknessRange: [345, 385],
  });
  faceCap(
    optics,
    [
      [14.85, -94.5],
      [15.2, -95.6],
      [15.85, -96.45],
      [16.74, -97.03],
      [17.7, -97.3],
    ],
    innerRim,
    0,
    0,
    -18,
    false,
    128,
  );
  const middleGlass = new T.MeshPhysicalMaterial({
    color: 0x494239,
    metalness: 0.17,
    roughness: 0.28,
    clearcoat: 0.18,
    clearcoatRoughness: 0.23,
    specularIntensity: 0.56,
    specularColor: 0xf5cfb5,
    iridescence: 0.5,
    iridescenceIOR: 1.45,
    iridescenceThicknessRange: [280, 310],
  });
  const dish = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    dish.push([17.48 + 8.7 * t, -(97.02 + 2.15 * t + 5.04 * t * t)]);
  }
  faceCap(optics, dish, middleGlass, 0, 0, -18, false, 128);
  const retainer = paint(0x2e2a2a, 0.43, 0.24);
  for (const [r, f, width] of [
    [17.43, 97.5, 0.36],
    [23.7, 101.86, 0.28],
    [26.53, 105.18, 0.59],
    [32.12, 112.1, 0.38],
  ]) {
    faceCap(
      optics,
      [
        [r, -f + 0.17],
        [r, -f - 0.03],
        [r + 0.1, -f - 0.12],
        [r + width, -f - 0.12],
        [r + width + 0.08, -f + 0.04],
      ],
      retainer,
      0,
      0,
      -18,
      false,
      128,
    );
  }
  // Weak reflections from the two inner air/glass interfaces overlap the pupil.
  // Each curved surface has its own radius and depth, so the glints move apart on orbit.
  for (const [name, radius, sag, depth, tint, opacity] of [
    ['inner_amber_interface', 22.85, -4.6, 105.25, 0xc8a696, 0.14],
    ['inner_green_interface', 16.05, 4.3, 98.0, 0x99ab78, 0.19],
  ]) {
    const film = new T.MeshPhysicalMaterial({
      color: tint,
      transparent: true,
      opacity,
      roughness: 0.26,
      metalness: 0.53,
      clearcoat: 0.32,
      clearcoatRoughness: 0.18,
      iridescence: 0.38,
      iridescenceIOR: 1.41,
      iridescenceThicknessRange: [295, 385],
    });
    glassCap(name, radius, sag, depth, film);
  }
  const coating = new T.MeshPhysicalMaterial({
    color: 0xf9f4ed,
    metalness: 0,
    roughness: 0.065,
    transmission: 0.985,
    transparent: true,
    opacity: 0.97,
    ior: 1.5,
    specularIntensity: 0.78,
    specularColor: 0xf3ede7,
    iridescence: 0.15,
    iridescenceIOR: 1.38,
    iridescenceThicknessRange: [260, 290],
  });
  glassCap('front_coated_element', 34.26, 3.55, 113.82, coating);
  function sideFrame(parent, deg, r, f) {
    const a = rad(deg),
      g = group();
    g.position.set(r * Math.cos(a), r * Math.sin(a), -18 - f);
    g.quaternion.setFromRotationMatrix(
      new T.Matrix4().makeBasis(
        new T.Vector3(0, 0, 1),
        new T.Vector3(Math.sin(a), -Math.cos(a), 0),
        new T.Vector3(Math.cos(a), Math.sin(a), 0),
      ),
    );
    parent.add(g);
    return g;
  }
  const rimText = sideFrame(inner, -27, 43.89, 111.5);
  plate(
    rimText,
    16.8,
    1.8,
    label('Ø82　0.21m/0.69ft　SEL2470GM2', null, '#b8b4ae', 86, 'Arial', 0.93),
    0,
    0,
    0.07,
  ).rotation.z = pi / 2;
  for (const d of [180, 90]) {
    const hold = sideFrame(lens, d, 38.27, 74.1);
    faceCap(
      hold,
      [
        [0.01, 0.1],
        [7.05, 0.1],
        [7.05, 0.55],
        [6.85, 1.36],
        [6.13, 1.48],
        [5.9, 0.99],
      ],
      black,
    );
    faceCap(
      hold,
      [
        [5.42, 0.55],
        [5.5, 1.15],
        [5.22, 1.7],
        [4.9, 1.85],
        [0.01, 1.9],
      ],
      smoothRubber,
    );
    hold.userData.press_axis = [0, 0, -1];
    reg('btn_focus_hold', hold);
  }
  for (const [id, d, r, f, txt] of [
    ['sw_iris_lock', 180, 33.4, 15.5, 'IRIS LOCK'],
    ['sw_click', -25, 33.5, 16, 'CLICK ON I I OFF'],
    ['sw_focus_mode', 205.6, 38.25, 74.1, 'AF  ▏▏ MF'],
    ['sw_zoom_smooth', -33, 38.2, 74.1, 'SMOOTH I I TIGHT'],
  ]) {
    const g = sideFrame(lens, d, r, f),
      small = id === 'sw_iris_lock' || id === 'sw_click';
    const tangential = id === 'sw_zoom_smooth' || id === 'sw_click';
    if (tangential) g.rotateZ(pi / 2);
    block(g, small ? 7.4 : 13.5, small ? 5.0 : 5.7, 1.25, 0.9, black, 0, 0, 0.42);
    const rocker = small || tangential ? smoothRubber : paint(0x756f70, 0.7, 0.025);
    const knob = block(
      g,
      small ? 5.9 : 10.65,
      small ? 4.36 : 5.05,
      1.37,
      0.72,
      rocker,
      -1.15,
      0,
      1.24,
    );
    parts[id] = {knob};
    block(knob, 0.53, small ? 3.65 : 4.7, 0.38, 0.17, metal, 0.81, 0, 0.79);
    if (id !== 'sw_iris_lock')
      block(knob, 0.34, small ? 3.45 : 4.5, 0.12, 0.05, silver, 0.69, 0, 0.97);
    if (tangential)
      for (const x of small ? [-1.85, -0.98, 1.65] : [-4.0, -3.0, -2.0, -1.0, 1.78, 2.78, 3.78]) {
        block(knob, 0.27, small ? 3.6 : 4.2, 0.21, 0.07, black, x, 0, 0.73);
      }
    if (small) {
      const marking = sideFrame(lensStatic, id === 'sw_iris_lock' ? 166 : d, 36.8, 21.9);
      const t = plate(
        marking,
        id === 'sw_iris_lock' ? 13.6 : 15.1,
        2.08,
        label(id === 'sw_iris_lock' ? '◀ IRIS LOCK' : txt, null, '#eeede8', 105, 'Arial', 0.96),
        0,
        0,
        0.45,
      );
      t.rotation.z = pi / 2;
    } else plate(g, 13.0, 2.9, label(txt, null, '#eeede8', 100, 'Arial', 0.94), 0, 4.7, 1.71);
    reg(id, g);
  }
  const lensMark = group('lens_decal_brand');
  marks.add(lensMark);
  const badge = sideFrame(lensMark, 154.5, 38.36, 74.1);
  function badgeShape(w, h) {
    const s = new T.Shape(),
      x = w / 2,
      y = h / 2;
    s.moveTo(-x + 0.76, -y);
    s.lineTo(x - 0.76, -y);
    s.bezierCurveTo(x - 0.05, -y, x + 0.42, -0.64 * y, x + 0.42, 0);
    s.bezierCurveTo(x + 0.4, 0.65 * y, x - 0.06, y, x - 0.76, y);
    s.lineTo(-x + 0.76, y);
    s.bezierCurveTo(-x + 0.06, y, -x - 0.4, 0.65 * y, -x - 0.42, 0);
    s.bezierCurveTo(-x - 0.42, -0.64 * y, -x + 0.05, -y, -x + 0.76, -y);
    s.closePath();
    return s;
  }
  mesh(extrude(badgeShape(9.49, 6.58), 0.59, 0.15), black, badge, 0, 0, 0.21);
  const badgeFinish = new T.MeshPhysicalMaterial({
    color: 0xc5502e,
    roughness: 0.32,
    metalness: 0.22,
    clearcoat: 0.48,
    clearcoatRoughness: 0.21,
  });
  mesh(extrude(badgeShape(9.04, 6.02), 0.46, 0.16), badgeFinish, badge, 0, 0, 0.59);
  const emblem = texture(256, 160, (c) => {
    c.fillStyle = '#fff4e7';
    c.beginPath();
    c.moveTo(244, 13);
    c.lineTo(109, 13);
    c.bezierCurveTo(48, 13, 12, 40, 12, 82);
    c.bezierCurveTo(12, 125, 48, 149, 111, 149);
    c.lineTo(244, 149);
    c.lineTo(244, 72);
    c.lineTo(151, 72);
    c.lineTo(151, 96);
    c.lineTo(204, 96);
    c.lineTo(204, 123);
    c.lineTo(114, 123);
    c.bezierCurveTo(77, 123, 60, 109, 60, 82);
    c.bezierCurveTo(60, 56, 78, 40, 114, 40);
    c.lineTo(244, 40);
    c.closePath();
    c.fill();
  });
  plate(
    badge,
    7.22,
    4.9,
    new T.MeshStandardMaterial({map: emblem, transparent: true, roughness: 0.45}),
    0,
    0,
    0.84,
  );
  const namePlate = sideFrame(lensStatic, 90, 30.67, 5.1);
  const plaque = plate(
    namePlate,
    21.3,
    4.0,
    label('FE 2.8/24-70 GM II', '#222021', '#efeee9', 96, 'Arial', 0.94),
    0,
    0,
    0.14,
  );
  plaque.rotation.z = pi / 2;
  const rightBrand = sideFrame(lensMark, 6, 38.35, 74.1);
  plate(rightBrand, 13.5, 3.2, label('SONY', null, '#eeede8', 103, 'Georgia', 0.96), 0, 0, 0.35);
  const centerDot = sideFrame(lensStatic, 180, 30.65, 1);
  disc(centerDot, 0.98, 0.42, silver, 0, 0, 0, 'back');
  const mountText = sideFrame(lensStatic, 192, 30.67, 1.1);
  plate(
    mountText,
    8.8,
    2.0,
    label('E-mount', null, '#eeece9', 104, 'Arial', 0.95),
    0,
    0,
    0.35,
  ).rotation.z = pi / 2;
  return {root, lens, ctl, lcd, lock, parts};
}
