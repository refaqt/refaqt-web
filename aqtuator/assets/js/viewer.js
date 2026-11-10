// Three.js viewer for the AQTUATOR CS model (assets/models/aqtuator-cs.glb).
// The GLB is exported from the real FreeCAD assembly by tools/export_glb.py.
// Units: metres, Y up. X runs along the travel, -Z across it (FreeCAD Y).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const MODEL_URL = new URL('../models/aqtuator-cs.glb', import.meta.url).href;
const BASE_LEN = 0.44, BASE_W = 0.21;
const CARRIAGE_X = [0.1046, 0.3146];        // carriage-top along X, in the CAD
const CARRIAGE_CENTRE = 0.2096;
const STRIP_TOP = 0.0400, STRIP_BOTTOM = 0.03985;
const AMPLITUDE = 0.095;                    // carriage motion, each side of the CAD position
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

const MOVING = ['carriage_', 'MK21', 'QEH', 'TA17', 'AK_MC15', 'roller_', 'cooling_block',
  'motor_cable_clamp', 'read_head_cable_clamp', 'fitting_', 'hose_', 'port_oring'];

// Category of each part, used for the exploded view, the labels and the highlight.
const CATEGORIES = [
  ['base', ['base'], 0, 'Base'],
  ['stator', ['MK2_'], 0.035, 'Magnet track'],
  ['rails', ['EGR'], 0.06, 'Profile rails'],
  ['encoder', ['MB_MC15', 'AK_MC15'], 0.075, 'Encoder'],
  ['rails', ['QEH'], 0.095, 'Guide blocks'],
  ['forcer', ['MK21'], 0.115, 'Forcer'],
  ['carriage', ['carriage_bottom'], 0.15, 'Carriage bottom'],
  ['dampers', ['TA17'], 0.15, 'End stops'],
  ['strip', ['magnet_'], 0.175, 'Hold-down magnets'],
  ['strip', ['sealing_strip'], 0.195, 'Seal strip'],
  ['carriage', ['roller_'], 0.225, 'Rollers'],
  ['carriage', ['carriage_top'], 0.275, 'Carriage top'],
  ['cooling', ['cooling_block', 'motor_cable_clamp', 'read_head_cable_clamp', 'port_oring', 'fitting_', 'hose_'], 0.33, 'Cooling'],
];
function categoryOf(name) {
  for (const c of CATEGORIES) if (c[1].some(p => name.startsWith(p))) return c;
  return CATEGORIES[0];
}

// Anodised finish of the aluminium parts.
const FINISH = [['base', 'alu_black'], ['carriage_top', 'alu_black'], ['carriage_bottom', 'alu_black']];

// Better-looking materials than the plain PBR values in the GLB.
function upgradeMaterial(m) {
  const n = m.name;
  const mat = new THREE.MeshPhysicalMaterial({
    color: m.color, metalness: m.metalness, roughness: m.roughness, envMapIntensity: 1.0,
  });
  if (n === 'alu_black') { mat.color.setHex(0x0b0c0d); mat.metalness = 0.6; mat.roughness = 0.38; mat.clearcoat = 0.35; mat.clearcoatRoughness = 0.4; }
  if (n === 'alu_clear') { mat.color.setHex(0xb9bec2); mat.metalness = 1.0; mat.roughness = 0.32; }
  if (n === 'strip') { mat.color.setHex(0xd8dbde); mat.metalness = 1.0; mat.roughness = 0.12; }
  if (n === 'steel') { mat.color.setHex(0xc4c8cc); mat.metalness = 1.0; mat.roughness = 0.2; }
  if (n === 'accent') { mat.color.setHex(0x00ac99); mat.metalness = 0.3; mat.roughness = 0.35; }
  if (n === 'forcer') { mat.color.setHex(0x16181a); mat.roughness = 0.6; }
  mat.name = n;
  return mat;
}

function toFloat(attr) {
  const n = attr.count, s = attr.itemSize, out = new Float32Array(n * s);
  for (let i = 0; i < n; i++) {
    out[i * s] = attr.getX(i);
    if (s > 1) out[i * s + 1] = attr.getY(i);
    if (s > 2) out[i * s + 2] = attr.getZ(i);
  }
  return new THREE.BufferAttribute(out, s);
}

// Bake every mesh into model space once, so instances only share geometry.
let templatePromise;
export function loadTemplate(onProgress) {
  if (templatePromise) return templatePromise;
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  templatePromise = loader.loadAsync(MODEL_URL, e => onProgress?.(e.total ? e.loaded / e.total : 0)).then(gltf => {
    gltf.scene.updateMatrixWorld(true);
    const parts = [];
    const mats = new Map();
    gltf.scene.traverse(o => {
      if (!o.isMesh) return;
      const name = o.name || o.parent?.name || '';
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', toFloat(o.geometry.attributes.position));
      g.setAttribute('normal', toFloat(o.geometry.attributes.normal));
      g.setIndex(o.geometry.index ? o.geometry.index.clone() : null);
      g.applyMatrix4(o.matrixWorld);
      g.computeBoundingBox();
      // Finish by part name, so the colours do not depend on an old export.
      const finish = FINISH.find(f => name.startsWith(f[0]))?.[1] || o.material.name;
      if (!mats.has(finish)) mats.set(finish, upgradeMaterial(Object.assign(o.material.clone(), { name: finish })));
      parts.push({ name, geometry: g, material: mats.get(finish) });
    });
    // The seal strip lifts over the rollers inside the carriage. When the carriage
    // moves, that lift must move with it: a flat copy stays on the base, and the
    // lifted copy rides with the carriage, clipped to the carriage length.
    const strip = parts.find(p => p.name.startsWith('sealing_strip'));
    if (strip) {
      const flat = strip.geometry.clone();
      const pos = flat.attributes.position, nrm = flat.attributes.normal;
      for (let i = 0; i < pos.count; i++) {
        if (pos.getY(i) > STRIP_TOP + 0.0001) {
          const up = nrm.getY(i) >= 0;
          pos.setY(i, up ? STRIP_TOP : STRIP_BOTTOM);
          nrm.setXYZ(i, 0, up ? 1 : -1, 0);
        }
      }
      strip.flat = flat;
    }
    return parts;
  });
  return templatePromise;
}

// One stage: fixed parts plus a carriage group that moves along X.
export class Stage {
  constructor(parts) {
    this.root = new THREE.Group();
    this.model = new THREE.Group();
    this.model.position.set(-BASE_LEN / 2, 0, BASE_W / 2);
    this.root.add(this.model);
    this.carriage = new THREE.Group();
    this.model.add(this.carriage);
    this.meshes = [];
    this.clipLocal = [new THREE.Plane(new THREE.Vector3(1, 0, 0), -CARRIAGE_X[0]), new THREE.Plane(new THREE.Vector3(-1, 0, 0), CARRIAGE_X[1])];
    this.clip = this.clipLocal.map(p => p.clone());
    for (const p of parts) {
      const cat = categoryOf(p.name);
      const moving = MOVING.some(m => p.name.startsWith(m));
      if (p.name.startsWith('sealing_strip')) {
        const flat = new THREE.Mesh(p.flat, p.material.clone());
        const lift = new THREE.Mesh(p.geometry, p.material.clone());
        lift.material.clippingPlanes = this.clip;
        lift.material.clipShadows = true;   // else the cut-off ends still cast a shadow
        this._add(flat, this.model, cat, p.name);
        this._add(lift, this.carriage, cat, p.name + '_lift');
        continue;
      }
      const mesh = new THREE.Mesh(p.geometry, p.material.clone());
      this._add(mesh, moving ? this.carriage : this.model, cat, p.name);
    }
    this.offset = 0;
    this.explode = 0;
  }
  _add(mesh, parent, cat, name) {
    mesh.name = name;
    mesh.castShadow = true;
    mesh.userData = { cat: cat[0], label: cat[3], lift: cat[2], parent };
    // Wrap each mesh in a group that carries the explode offset.
    const holder = new THREE.Group();
    holder.add(mesh);
    parent.add(holder);
    mesh.userData.holder = holder;
    this.meshes.push(mesh);
  }
  setOffset(d) { this.offset = d; this.carriage.position.x = d; }
  setExplode(e) {
    this.explode = e;
    const k = e * e * (3 - 2 * e);
    for (const m of this.meshes) m.userData.holder.position.y = m.userData.lift * k;
  }
  highlight(cat) {
    for (const m of this.meshes) {
      const on = cat && m.userData.cat === cat;
      m.material.emissive?.setHex(on ? 0x00ac99 : 0x000000);
      m.material.emissiveIntensity = on ? 0.35 : 0;
    }
  }
  update() {
    this.root.updateMatrixWorld(true);
    this.clipLocal.forEach((p, i) => this.clip[i].copy(p).applyMatrix4(this.carriage.matrixWorld));
  }
  // Anchor point of a category in world space (top centre of its first part).
  anchor(cat, out) {
    const m = this.meshes.find(x => x.userData.cat === cat && !x.name.endsWith('_lift'));
    if (!m) return null;
    const bb = m.geometry.boundingBox;
    out.set((bb.min.x + bb.max.x) / 2, bb.max.y, (bb.min.z + bb.max.z) / 2);
    return m.localToWorld(out);
  }
}

// Carriage motion: smooth move, dwell, move back. Like a real point-to-point profile.
function motion(t) {
  const T = 5.2, move = 1.7;
  const p = (t % T) / T * 2;            // 0..2
  const phase = p < 1 ? p : p - 1;
  const dir = p < 1 ? 1 : -1;
  const s = Math.min(1, (phase * T / 2) / move);
  const y = 0.5 - 0.5 * Math.cos(Math.PI * s);
  return dir * (2 * y - 1) * AMPLITUDE;
}

export class Viewer {
  constructor(el, opts = {}) {
    this.el = el;
    this.opts = Object.assign({ controls: true, autoRotate: !REDUCED, running: !REDUCED, xy: false, camera: [0.42, 0.28, 0.5], target: [0, 0.02, 0] }, opts);
    this.running = this.opts.running;
    this.explodeTarget = 0;
    this.explode = 0;
    this.t = 0;
    this.visible = true;
    this.stages = [];

    const r = this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(devicePixelRatio || 1, opts.pixelRatio || 2));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 0.95;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.localClippingEnabled = true;
    r.setClearColor(0x000000, 0);
    el.prepend(r.domElement);
    r.domElement.setAttribute('aria-label', 'Interactive 3D model of the AQTUATOR CS stage');
    r.domElement.setAttribute('role', 'img');

    const scene = this.scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(r);
    scene.environment = pmrem.fromScene(new RoomEnvironment(r), 0.04).texture;

    const cam = this.camera = new THREE.PerspectiveCamera(30, 1, 0.01, 10);
    cam.position.set(...this.opts.camera);

    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(0.5, 1.2, 0.6);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = key.shadow.camera.bottom = -0.6;
    key.shadow.camera.right = key.shadow.camera.top = 0.6;
    key.shadow.camera.near = 0.2; key.shadow.camera.far = 3;
    key.shadow.bias = -0.0004;
    key.shadow.radius = 6;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x00c1a0, 1.1);
    rim.position.set(-0.9, 0.25, -0.7);
    scene.add(rim);
    const fill = new THREE.DirectionalLight(0x6fb8ff, 0.5);
    fill.position.set(-0.6, 0.2, 0.8);
    scene.add(fill);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x101010, 0.35));

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.ShadowMaterial({ opacity: 0.45 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.0005;
    ground.receiveShadow = true;
    scene.add(ground);

    if (this.opts.controls) {
      const c = this.controls = new OrbitControls(cam, r.domElement);
      c.enableDamping = true;
      c.dampingFactor = 0.08;
      c.enablePan = false;
      c.minDistance = 0.25;
      c.maxDistance = 1.6;
      c.maxPolarAngle = Math.PI * 0.47;
      c.autoRotate = this.opts.autoRotate;
      c.autoRotateSpeed = 0.6;
      c.target.set(...this.opts.target);
      c.addEventListener('start', () => { c.autoRotate = false; });
    } else {
      cam.lookAt(...this.opts.target);
    }
    this.home = { pos: cam.position.clone(), target: new THREE.Vector3(...this.opts.target) };

    this._resize = this.resize.bind(this);
    new ResizeObserver(this._resize).observe(el);
    new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; if (this.visible) this._tick(); }, { rootMargin: '100px' }).observe(el);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) this._tick(); });
    this.resize();
    this.clock = new THREE.Clock();
  }

  async load(onProgress) {
    const parts = await loadTemplate(onProgress);
    const a = new Stage(parts);
    this.scene.add(a.root);
    this.stages.push(a);
    if (this.opts.xy) {
      // Second stage turned 90 degrees, screwed on the carriage of the first.
      // Its base rows (200 mm apart) sit on the outer carriage rows; it sits
      // 40 mm off the carriage centre along its own travel (CarriageMountInterface_v1).
      const b = new Stage(parts);
      b.root.rotation.y = Math.PI / 2;
      b.root.position.set(CARRIAGE_CENTRE, 0.060, -BASE_W / 2 + 0.04);
      a.carriage.add(b.root);
      this.stages.push(b);
      a.root.position.y = 0;
    }
    this.el.classList.add('is-ready');
    this._tick();
    return this;
  }

  resize() {
    const w = this.el.clientWidth, h = this.el.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // Keep the whole stage in view on narrow screens.
    this.camera.fov = w / h < 1 ? 42 : 30;
    this.camera.updateProjectionMatrix();
    this._tick();
  }

  setRunning(on) { this.running = on; this._tick(); }
  setExplode(e) { this.explodeTarget = e; this._tick(); }
  reset() {
    this.camera.position.copy(this.home.pos);
    if (this.controls) { this.controls.target.copy(this.home.target); this.controls.autoRotate = this.opts.autoRotate; }
    this._tick();
  }

  _tick() {
    if (this._raf || !this.visible || document.hidden) return;
    this._raf = requestAnimationFrame(() => { this._raf = 0; this._frame(); });
  }

  _frame() {
    const dt = Math.min(0.05, this.clock.getDelta());
    let busy = false;
    // blend fades the motion in and out, so the carriage never jumps. The
    // carriage comes home before the stage comes apart.
    const want = this.running && this.explodeTarget === 0 ? 1 : 0;
    this.blend = this.blend ?? want;
    const db = want - this.blend;
    if (Math.abs(db) > 0.001) { this.blend += db * Math.min(1, dt * 3); busy = true; } else this.blend = want;
    if (this.blend > 0) { this.t += dt; busy = true; }
    const homed = this.blend < 0.05;
    const goal = homed ? this.explodeTarget : 0;
    const de = goal - this.explode;
    if (Math.abs(de) > 0.0005) { this.explode += de * Math.min(1, dt * 4); busy = true; } else this.explode = goal;
    if (!homed && this.explodeTarget > 0) busy = true;
    this.stages.forEach((s, i) => {
      const d = i === 0 ? motion(this.t + 1.3) : motion(this.t * 0.83 + 0.2) * 0.9;
      s.setOffset(d * this.blend);
      s.setExplode(this.explode);
      s.update();
    });
    if (this.controls) { this.controls.update(); if (this.controls.autoRotate) busy = true; busy = busy || this._damping(); }
    this.onFrame?.(this);
    this.renderer.render(this.scene, this.camera);
    if (busy || this.alwaysOn) this._tick();
  }

  _damping() {
    // OrbitControls keeps moving for a moment after a drag ends.
    const p = this.camera.position;
    const moved = this._last ? p.distanceToSquared(this._last) > 1e-12 : true;
    this._last = (this._last || new THREE.Vector3()).copy(p);
    return moved;
  }

  // Screen position (px, relative to the viewer) of a category anchor.
  project(cat, out = new THREE.Vector3()) {
    const s = this.stages[0];
    if (!s || !s.anchor(cat, out)) return null;
    out.project(this.camera);
    return { x: (out.x * 0.5 + 0.5) * this.el.clientWidth, y: (-out.y * 0.5 + 0.5) * this.el.clientHeight, z: out.z };
  }
}

export const PART_LABELS = {
  base: 'Base', stator: 'Magnet track', rails: 'Rails & blocks', encoder: 'Encoder', forcer: 'Forcer',
  carriage: 'Carriage', strip: 'Seal strip', cooling: 'Cooling', dampers: 'End stops',
};
