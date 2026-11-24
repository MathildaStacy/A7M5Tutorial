import * as T from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {KTX2Loader} from 'three/examples/jsm/loaders/KTX2Loader.js';
import {RGBELoader} from 'three/examples/jsm/loaders/RGBELoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import basisJS from 'three/examples/jsm/libs/basis/basis_transcoder.js?asset';
import basisWasm from 'three/examples/jsm/libs/basis/basis_transcoder.wasm?asset';
import {controls, byId} from '../camera/controls';
import type {Command, ViewName} from '../bridge/camera';
import type {ScreenState, Operation} from '../camera/state';
import {createScreen} from './lcd';
import {installReview} from './review';
declare const __MODEL_REVIEW__: boolean;

declare global {
  interface Window {
    ReactNativeWebView?: {postMessage: (payload: string) => void};
  }
}
const stage = document.getElementById('stage')!,
  tags = document.getElementById('tags')!,
  status = document.getElementById('status')!;
const panel = document.getElementById('detail')!,
  lcd = document.getElementById('lcd') as HTMLCanvasElement;
const drawScreen = createScreen(lcd, document.getElementById('help')!);
const post = (value: object) => window.ReactNativeWebView?.postMessage(JSON.stringify(value));
const fatal = (why: unknown) => {
  status.textContent = '相机加载失败 · ' + String(why);
  post({ev: 'fatal', message: String(why)});
};

// Android WebView fetch does not read file:///android_asset. XHR can read same-folder packaged assets.
function localBytes(name: string): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const req = new XMLHttpRequest();
    req.open('GET', name);
    req.responseType = 'arraybuffer';
    req.onload = () =>
      req.response?.byteLength && (req.status === 0 || req.status === 200)
        ? resolve(req.response)
        : reject(new Error('无法读取 ' + name));
    req.onerror = () => reject(new Error('无法读取 ' + name));
    req.send();
  });
}
async function boot() {
  const renderer = new T.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: false,
  });
  const gl = renderer.getContext() as WebGL2RenderingContext;
  const gpuInfo = gl.getExtension('WEBGL_debug_renderer_info');
  const softwareGPU =
    gpuInfo &&
    /SwiftShader|llvmpipe|Software Rasterizer|Android Emulator/i.test(
      String(gl.getParameter(gpuInfo.UNMASKED_RENDERER_WEBGL)),
    );
  renderer.setPixelRatio(Math.min(softwareGPU ? 1 : 2, devicePixelRatio));
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.93;
  const el = renderer.domElement;
  stage.appendChild(el);
  el.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    fatal('图形上下文已退出');
  });
  const scene = new T.Scene(),
    camera = new T.PerspectiveCamera(32, 1, 0.001, 3);
  const orbit = new OrbitControls(camera, el);
  orbit.enablePan = false;
  orbit.minDistance = 0.08;
  orbit.maxDistance = 0.85;
  orbit.enableDamping = true;
  const manager = new T.LoadingManager();
  manager.setURLModifier((url) =>
    url.endsWith('basis_transcoder.js')
      ? basisJS
      : url.endsWith('basis_transcoder.wasm')
      ? basisWasm
      : url,
  );
  const ktx = new KTX2Loader(manager).setWorkerLimit(1).detectSupport(renderer);
  const loader = new GLTFLoader(manager).setKTX2Loader(ktx).setMeshoptDecoder(MeshoptDecoder);
  const lod = new URLSearchParams(location.search).get('lod') === '1';
  const [gltf, hdr] = await Promise.all([
    localBytes(lod ? 'a7v_lod1.glb' : 'a7v.glb').then((bytes) => loader.parseAsync(bytes, '')),
    localBytes('env.hdr'),
  ]);
  const rgb = new RGBELoader().parse(hdr);
  const env = new T.DataTexture(rgb.data.slice(), rgb.width, rgb.height, T.RGBAFormat, rgb.type);
  env.mapping = T.EquirectangularReflectionMapping;
  env.needsUpdate = true;
  env.flipY = true;
  scene.environment = env;
  scene.environmentIntensity = 0.28;
  scene.add(new T.HemisphereLight(0xfff8ed, 0x474041, 0.79));
  const key = new T.DirectionalLight(0xfff9f3, 1.38);
  key.position.set(0.19, 0.27, 0.16);
  key.target.position.set(0, 0, 0.04);
  scene.add(key, key.target);
  const fill = new T.DirectionalLight(0xf4f5ff, 0.72);
  fill.position.set(-0.42, 0.4, -0.8);
  scene.add(fill);
  const sideFill = new T.DirectionalLight(0xfffaf4, 0.52);
  sideFill.position.set(0.8, -0.17, 0.3);
  scene.add(sideFill);
  renderer.shadowMap.enabled = !lod;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  key.castShadow = true;
  const shadowSize = softwareGPU ? 512 : 1024;
  key.shadow.mapSize.set(shadowSize, shadowSize);
  Object.assign(key.shadow.camera, {
    left: -0.13,
    right: 0.13,
    top: 0.15,
    bottom: -0.14,
    near: 0.09,
    far: 0.61,
  });
  key.shadow.camera.updateProjectionMatrix();
  key.shadow.bias = -0.00018;
  key.shadow.normalBias = 0.00016;
  const model = gltf.scene;
  scene.add(model);
  // Approximate the studio reflections seen through the curved entrance element.
  // The same HDR lights the recessed glass as the user rotates the camera.
  model.getObjectByName('front_optics')?.traverse((obj) => {
    if (!(obj instanceof T.Mesh)) return;
    for (const material of [obj.material].flat()) {
      material.envMap = env;
      material.envMapRotation.set(0.9, 0.6, 0);
      material.envMapIntensity = 0.87;
    }
  });
  model.updateMatrixWorld(true);
  const bounds = new T.Box3().setFromObject(model),
    centre = bounds.getCenter(new T.Vector3());
  const nodes = new Map<string, T.Object3D>(),
    anchors = new Map<string, T.Vector3>(),
    buttons = new Map<string, HTMLButtonElement>();
  const independentPress = new Map<
    T.Object3D,
    {node: T.Object3D; origin: T.Vector3; axis: T.Vector3}[]
  >();
  const axes = new Map<T.Object3D, T.Vector3>();
  const base = new Map<T.Object3D, {p: T.Vector3; q: T.Quaternion}>();
  const meshes: T.Mesh[] = [],
    meshOwner = new Map<T.Object3D, string>(),
    materialOwner = new Map<T.MeshStandardMaterial, string>();
  const controlMaterials = new Map<T.Material, Map<string, T.MeshStandardMaterial>>();
  const ids = new Set(controls.map((c) => c.id));
  model.traverse((o) => {
    if (ids.has(o.name)) {
      nodes.set(o.name, o);
      anchors.set(o.name, new T.Box3().setFromObject(o).getCenter(new T.Vector3()));
      base.set(o, {p: o.position.clone(), q: o.quaternion.clone()});
      axes.set(o, new T.Vector3(...(o.userData.axis as [number, number, number])));
      const surfaces = o.children
        .filter((c) => Array.isArray(c.userData.press_axis))
        .map((node) => ({
          node,
          origin: node.position.clone(),
          axis: new T.Vector3(...(node.userData.press_axis as [number, number, number])),
        }));
      if (surfaces.length) independentPress.set(o, surfaces);
      const b = document.createElement('button');
      b.className = 'tag';
      b.textContent = byId[o.name].name;
      b.hidden = true;
      b.onclick = () => post({ev: 'pick', control: o.name});
      tags.appendChild(b);
      buttons.set(o.name, b);
    }
    if (!(o instanceof T.Mesh)) return;
    meshes.push(o);
    o.castShadow = true;
    o.receiveShadow = true;
    let parent: T.Object3D | null = o;
    while (parent && !ids.has(parent.name)) parent = parent.parent;
    const owner = parent?.name ?? '';
    meshOwner.set(o, owner);
    // A glTF material can be shared across different controls. Isolate its highlight.
    const own = (m: T.Material) => {
      let owners = controlMaterials.get(m);
      if (!owners) {
        owners = new Map();
        controlMaterials.set(m, owners);
      }
      const existing = owners.get(owner);
      if (existing) return existing;
      const mat = m.clone() as T.MeshStandardMaterial;
      if (mat.map) mat.map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      owners.set(owner, mat);
      materialOwner.set(mat, owner);
      return mat;
    };
    o.material = Array.isArray(o.material) ? o.material.map(own) : own(o.material);
    if (
      [o.material]
        .flat()
        .some(
          (m) =>
            m instanceof T.MeshPhysicalMaterial &&
            (m.transmission > 0.9 || (m.transparent && m.opacity < 0.4)),
        )
    )
      o.castShadow = false;
  });
  const screen = model.getObjectByName('lcd_screen')!;
  const screenTexture = new T.CanvasTexture(lcd);
  screenTexture.colorSpace = T.SRGBColorSpace;
  screenTexture.flipY = false;
  const liveDisplay = new T.MeshBasicMaterial({map: screenTexture, toneMapped: false});
  const inner = model.getObjectByName('lens_barrel_inner'),
    innerRest = inner?.position.clone();
  let labels = false,
    dim = true,
    highlight: string[] = [],
    note = '',
    playing = false,
    raf = 0,
    state: ScreenState | undefined;
  const outlines = new T.Group();
  scene.add(outlines);
  const lineMaterial = new T.LineBasicMaterial({color: 0xf28b26, transparent: true, opacity: 0.85});
  const angle = new Map<string, number>(),
    target = new Map<string, number>();
  const pulseQueue: {id: string; kind: string; dir: number}[] = [];
  let barrelTravel = 0,
    barrelTarget = 0;
  let since = 0;
  function updateHighlights() {
    for (const obj of [...outlines.children]) {
      outlines.remove(obj);
      (obj as T.LineSegments).geometry.dispose();
    }
    for (const o of meshes)
      if (highlight.includes(meshOwner.get(o)!)) {
        const edge = new T.LineSegments(new T.EdgesGeometry(o.geometry, 45), lineMaterial);
        edge.matrixAutoUpdate = false;
        edge.userData.source = o;
        outlines.add(edge);
      }
    for (const [m, owner] of materialOwner) {
      if (!m.color) continue;
      const original = m.userData.originalColor ?? m.color.getHex();
      m.userData.originalColor = original;
      m.color.setHex(original);
      if (dim && highlight.length && !highlight.includes(owner)) m.color.multiplyScalar(0.4);
      m.emissive?.setHex(highlight.includes(owner) ? 0xf28b26 : 0x000000);
    }
  }
  function sync(s: ScreenState) {
    const firstSync = !state;
    if (!state)
      screen.traverse((o) => {
        if (o instanceof T.Mesh) o.material = liveDisplay;
      });
    state = s;
    drawScreen(s);
    screenTexture.needsUpdate = true;
    renderer.shadowMap.needsUpdate = true;
    for (const [id, o] of nodes) {
      const e = o.userData;
      const value =
        e.positions?.[s.positions[id]] ??
        (s.turns[id] ?? 0) * (e.detent_deg ?? e.preview_step_deg ?? 0);
      target.set(id, value);
      if (!angle.has(id)) angle.set(id, value);
    }
    const ext = nodes.get('ring_zoom')?.userData.extension_m?.[String(s.focal)];
    if (typeof ext === 'number') {
      barrelTarget = ext;
      if (firstSync) barrelTravel = ext;
    }
  }
  function bindings(now: number) {
    const pulse = pulseQueue[0];
    if (pulse && !since) since = now;
    const t = pulse ? Math.min(1, (now - since) / 220) : 0;
    let moving = !!pulse;
    if (inner && innerRest) {
      const remaining = barrelTarget - barrelTravel;
      barrelTravel =
        Math.abs(remaining) < 0.000001 ? barrelTarget : barrelTravel + remaining * 0.23;
      inner.position.z = innerRest.z - barrelTravel;
      moving ||= barrelTravel !== barrelTarget;
    }
    for (const [id, o] of nodes) {
      const e = o.userData,
        rest = base.get(o)!,
        axis = axes.get(o)!;
      const to = target.get(id) ?? 0,
        old = angle.get(id) ?? to;
      const delta = e.wrap_deg
        ? T.MathUtils.euclideanModulo(to - old + e.wrap_deg / 2, e.wrap_deg) - e.wrap_deg / 2
        : to - old;
      const value = Math.abs(delta) < 0.00001 ? to : old + delta * 0.23;
      angle.set(id, value);
      if (Math.abs(delta) > 0.00001) moving = true;
      for (const part of independentPress.get(o) ?? []) part.node.position.copy(part.origin);
      o.position.copy(rest.p);
      o.quaternion.copy(rest.q);
      if (e.kind === 'rotate') o.rotateOnAxis(axis, T.MathUtils.degToRad(value));
      if (e.kind === 'slide') o.translateOnAxis(axis, value);
      if (pulse?.id === id) {
        const amount = Math.sin(Math.PI * t) * pulse.dir;
        if (e.kind === 'press' || e.kind === 'slide') {
          const travel = (e.travel_m ?? 0) * amount,
            parts = independentPress.get(o);
          if (parts) for (const part of parts) part.node.translateOnAxis(part.axis, travel);
          else o.translateOnAxis(axis, travel);
        }
        if (e.kind === 'tilt' || e.kind === 'hinge')
          o.rotateOnAxis(axis, T.MathUtils.degToRad((e.range_deg?.[1] ?? 0) * amount));
      }
    }
    if (pulse && t === 1) {
      pulseQueue.shift();
      since = 0;
    }
    if (moving) renderer.shadowMap.needsUpdate = true;
    return moving;
  }
  const directions: Record<ViewName, [number, number, number]> = {
    overview: [0.87, 0.51, 1],
    front: [0, 0.03, 1],
    top: [0, 1, -0.001],
    back: [0, 0.02, -1],
    left: [1, 0.04, 0],
    right: [-1, 0.04, 0],
    bottom: [0, -1, -0.001],
    lens: [0.72, 0.55, 1],
  };
  function view(name: ViewName) {
    orbit.target.copy(centre);
    const halfFov = Math.atan(
      Math.tan(T.MathUtils.degToRad(camera.fov / 2)) * Math.min(1, camera.aspect),
    );
    const dist = (bounds.getBoundingSphere(new T.Sphere()).radius * 1.04) / Math.sin(halfFov);
    camera.position
      .copy(centre)
      .addScaledVector(new T.Vector3(...directions[name]).normalize(), dist);
    orbit.update();
  }
  function resize() {
    const w = stage.clientWidth,
      h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    invalidate();
  }
  resize();
  view('overview');
  new ResizeObserver(resize).observe(stage);
  const ray = new T.Raycaster(),
    pt = new T.Vector2();
  function pick(x: number, y: number) {
    const b = el.getBoundingClientRect();
    pt.set(((x - b.left) * 2) / b.width - 1, 1 - ((y - b.top) * 2) / b.height);
    ray.setFromCamera(pt, camera);
    const hit = ray.intersectObjects(meshes, false)[0];
    return hit
      ? {
          id: meshOwner.get(hit.object),
          point: hit.point,
          lock: hit.object.name === 'dial_rear_r_lock',
        }
      : null;
  }
  let gesture: {
    x: number;
    y: number;
    id: string;
    operate: boolean;
    steps: number;
    lock: boolean;
  } | null = null;
  const pointers = new Set<number>();
  function input(id: string, op: Operation) {
    post({ev: 'input', control: id, op});
  }
  el.addEventListener(
    'pointerdown',
    (e) => {
      pointers.add(e.pointerId);
      if (pointers.size !== 1) {
        gesture = null;
        orbit.enabled = true;
        return;
      }
      const hit = pick(e.clientX, e.clientY),
        id = hit?.id ?? '';
      const operate = !!id && highlight.includes(id) && byId[id].actions.length > 0;
      gesture = {id, x: e.clientX, y: e.clientY, steps: 0, operate, lock: hit?.lock ?? false};
      orbit.enabled = !operate;
      el.setPointerCapture(e.pointerId);
    },
    true,
  );
  el.addEventListener('pointermove', (e) => {
    if (!gesture?.operate || !byId[gesture.id].actions.includes('rotate')) return;
    const count = Math.trunc((e.clientX - gesture.x) / 18);
    while (gesture.steps !== count) {
      const d = Math.sign(count - gesture.steps);
      gesture.steps += d;
      input(gesture.id, d > 0 ? 'plus' : 'minus');
    }
  });
  el.addEventListener('pointerup', (e) => {
    pointers.delete(e.pointerId);
    const g = gesture;
    gesture = null;
    orbit.enabled = true;
    if (!g?.id || Math.hypot(g.x - e.clientX, g.y - e.clientY) > 7 || g.steps) return;
    if (!g.operate) {
      post({ev: 'pick', control: g.id});
      return;
    }
    if (g.id === 'lcd') {
      post({ev: 'pick', control: g.id});
      return;
    }
    if (g.lock) {
      input(g.id, 'lock');
      return;
    }
    if (g.id === 'wheel' || g.id === 'joystick') {
      const p = anchors.get(g.id)!.clone().project(camera),
        dx = e.clientX - ((p.x + 1) * el.clientWidth) / 2,
        dy = e.clientY - ((1 - p.y) * el.clientHeight) / 2;
      input(
        g.id,
        Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up',
      );
      return;
    }
    input(g.id, byId[g.id].actions.includes('rotate') ? 'plus' : 'click');
  });
  el.addEventListener('pointercancel', (e) => {
    pointers.delete(e.pointerId);
    gesture = null;
    orbit.enabled = true;
  });
  el.ondblclick = () => view('overview');
  const pv = new T.Vector3(),
    toward = new T.Vector3();
  function placeTags() {
    for (const [id, b] of buttons) {
      const selected = highlight.includes(id);
      b.hidden = !(selected || labels);
      if (b.hidden) continue;
      const anchor = anchors.get(id)!;
      pv.copy(anchor).project(camera);
      // Discard anchors on the far side, including those hidden behind the lens.
      toward.subVectors(anchor, camera.position);
      const distance = toward.length();
      ray.set(camera.position, toward.normalize());
      const hit = ray.intersectObjects(meshes, false)[0];
      b.hidden =
        pv.z > 1 || !!(hit && meshOwner.get(hit.object) !== id && hit.distance < distance - 0.003);
      b.classList.toggle('on', selected);
      b.textContent = selected && note ? note : byId[id].name;
      b.style.left = (pv.x + 1) * 50 + '%';
      b.style.top = (1 - pv.y) * 50 + '%';
    }
  }
  let dirtyTags = true;
  orbit.addEventListener('change', () => {
    dirtyTags = true;
    invalidate();
  });
  function invalidate() {
    if (playing && !raf) raf = requestAnimationFrame(frame);
  }
  function frame(now: number) {
    raf = 0;
    if (!playing) return;
    const cameraMoved = orbit.update(),
      moving = bindings(now);
    for (const [m, id] of materialOwner)
      if (highlight.includes(id)) m.emissiveIntensity = 0.25 + 0.16 * Math.sin(now * 0.005);
    model.updateMatrixWorld();
    for (const edge of outlines.children) edge.matrix.copy(edge.userData.source.matrixWorld);
    if (dirtyTags) {
      placeTags();
      dirtyTags = false;
    }
    renderer.render(scene, camera);
    if (cameraMoved || moving || (highlight.length && panel.hidden)) invalidate();
  }
  invalidate();
  function receive(e: MessageEvent<string>) {
    let m: Command & {id: number};
    try {
      m = JSON.parse(e.data);
    } catch {
      return;
    }
    if (!m || typeof m.id !== 'number') return;
    let result: unknown = true;
    try {
      switch (m.cmd) {
        case 'sync':
          sync(m.state);
          break;
        case 'view':
          view(m.view);
          break;
        case 'labels':
          labels = m.on;
          dirtyTags = true;
          break;
        case 'dim':
          dim = m.on;
          updateHighlights();
          break;
        case 'highlight':
          highlight = m.ids;
          note = m.note ?? '';
          dirtyTags = true;
          updateHighlights();
          break;
        case 'animate':
          if (!nodes.has(m.control)) throw new Error('未知部件');
          for (let i = 0; i < m.steps; i++)
            pulseQueue.push({id: m.control, kind: m.kind, dir: m.dir});
          break;
        case 'snapshot':
          renderer.render(scene, camera);
          result = el.toDataURL('image/jpeg', 0.8);
          break;
        case 'pause':
          playing = false;
          cancelAnimationFrame(raf);
          raf = 0;
          break;
        case 'resume':
          playing = true;
          break;
        case 'lcd':
          panel.hidden = !m.on;
          document.getElementById('help')!.textContent = '点屏幕上的参数查看说明';
          break;
        default:
          throw new Error('未知的 3D 命令');
      }
      invalidate();
      post({id: m.id, ok: true, result});
    } catch (err) {
      post({id: m.id, ok: false, error: String(err)});
    }
  }
  document.addEventListener('message', receive as EventListener);
  window.addEventListener('message', receive);
  document.fonts.ready.then(() => {
    if (state) {
      sync(state);
      invalidate();
    }
  });
  // Warm the actual shadow, transmission and display passes before RN starts its request timers.
  if (window.ReactNativeWebView)
    screen.traverse((o) => {
      if (o instanceof T.Mesh) o.material = liveDisplay;
    });
  await renderer.compileAsync(scene, camera);
  renderer.render(scene, camera);
  const fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
  if (fence) {
    gl.flush();
    while (gl.clientWaitSync(fence, 0, 0) === gl.TIMEOUT_EXPIRED)
      await new Promise((resolve) => setTimeout(resolve, 16));
    gl.deleteSync(fence);
  }
  if (gl.isContextLost()) throw new Error('图形上下文已退出');
  playing = true;
  invalidate();
  if (__MODEL_REVIEW__) installReview(renderer, model, scene);
  status.textContent = '';
  post({ev: 'ready'});
}
boot().catch(fatal);
