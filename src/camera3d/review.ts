// Only the desktop review bundle includes these measured product-photo views.
import * as T from 'three';

const projections = {
  back: {
    width: 800,
    height: 594,
    scaleX: 4.67,
    scaleY: 4.67,
    target: [-(400 - 338) / 4.67, (319.5 - 297) / 4.67, 0],
  },
  top: {
    width: 800,
    height: 520,
    scaleX: 4.97,
    scaleY: 5.02,
    target: [-(400 - 334) / 4.97, 0, (253 - 260) / 5.02],
  },
  kit: {
    width: 800,
    height: 1013,
    scaleX: 4.97,
    scaleY: 5.02,
    target: [-(400 - 334) / 4.97, 0, (746 - 506.5) / 5.02],
  },
  lens: {
    width: 800,
    height: 550,
    scaleX: 4.18,
    scaleY: 4.18,
    target: [0, (277.5 - 275) / 4.18, 137.9 - (400 - 207) / 4.18],
  },
} as const;
type ReviewView = keyof typeof projections | 'overview';

function cameraFor(view: ReviewView) {
  if (view === 'overview') {
    // Fit to the three-quarter press photograph. Scale in px/mm, distance in mm.
    const width = 800,
      height = 600,
      distance = 1854.4,
      scale = 2.52577;
    const camera = new T.PerspectiveCamera(
      T.MathUtils.radToDeg(2 * Math.atan(height / (2 * distance * scale))),
      width / height,
      0.05,
      4,
    );
    const target = new T.Vector3(0, 0, 0.048),
      direction = new T.Vector3(0.584872, 0.368239, 0.72272).normalize();
    camera.position.copy(target).addScaledVector(direction, distance / 1000);
    camera.lookAt(target);
    camera.rotateZ(-0.027829);
    camera.setViewOffset(width, height, width / 2 - 404.5, height / 2 - 317.25, width, height);
    return {width, height, camera};
  }
  const {width, height, scaleX, scaleY, target} = projections[view];
  const halfW = width / scaleX / 2000,
    halfH = height / scaleY / 2000;
  const camera = new T.OrthographicCamera(-halfW, halfW, halfH, -halfH, 0.001, 3);
  const centre = new T.Vector3(...target).multiplyScalar(0.001);
  const top = view === 'top' || view === 'kit';
  const direction = top
    ? new T.Vector3(0, 1, 0)
    : view === 'back'
    ? new T.Vector3(0, 0, -1)
    : new T.Vector3(1, 0, 0);
  if (top) camera.up.set(0, 0, 1);
  camera.position.copy(centre).add(direction);
  camera.lookAt(centre);
  return {width, height, camera};
}

export function installReview(renderer: T.WebGLRenderer, model: T.Object3D, scene: T.Scene) {
  const views = new Map<ReviewView, ReturnType<typeof cameraFor>>();
  Object.assign(window, {
    modelReview: (view: ReviewView) => {
      if (!views.has(view)) views.set(view, cameraFor(view));
      const {width, height, camera} = views.get(view)!;
      const size = renderer.getSize(new T.Vector2()),
        ratio = renderer.getPixelRatio();
      const color = renderer.getClearColor(new T.Color()),
        alpha = renderer.getClearAlpha();
      const nodes = ['body', 'body_decal_brand', 'lens', 'lens_decal_brand'].map(
        (n) => model.getObjectByName(n)!,
      );
      const previous = nodes.map((n) => n.visible);
      try {
        nodes.forEach((node, i) => {
          node.visible = i < 2 ? view !== 'lens' : ['lens', 'kit', 'overview'].includes(view);
        });
        renderer.shadowMap.needsUpdate = true;
        renderer.setPixelRatio(2.5);
        renderer.setSize(width, height, false);
        renderer.setClearColor(0xffffff, 1);
        renderer.render(scene, camera);
        return renderer.domElement.toDataURL('image/png');
      } finally {
        nodes.forEach((node, i) => {
          node.visible = previous[i];
        });
        renderer.shadowMap.needsUpdate = true;
        renderer.setPixelRatio(ratio);
        renderer.setSize(size.x, size.y, false);
        renderer.setClearColor(color, alpha);
      }
    },
  });
}
