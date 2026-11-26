// SPDX-FileCopyrightText: 2025-2026 Refaqt (BE 0804.145.539) and contributors
// SPDX-License-Identifier: CC-BY-SA-4.0
// AQTUATOR Custom: the AQTUATOR CS stage changes, step by step, into other stage designs.
// The stage is the real AQTUATOR CS CAD model (aqtuator/assets/models/aqtuator-cs.glb, loaded with
// the code of the AQTUATOR CS page). Parts that are not in that model come from parts.js.
// CAD parts change size by moving their vertices past a cut plane, never by scaling, so holes,
// chamfers and pockets keep their real size (the same idea as stretch() in tools/render-machines.html).
// Units: metres. X runs along the travel, Y is up. Model space is the CAD space: the base runs
// from x = 0 to 0.44 and from z = 0 (front) to z = -0.21 (back).
//
// Steps (STATES below):
//   0  AQTUATOR CS as built, with its seal strip
//   1  the seal strip, its rollers and hold-down magnets go: the linear motor shows
//   2  the linear motor goes; a ball screw, bearing blocks and servo motor A come in
//   3  servo motor B: bigger, with a brake and two connectors
//   4  bigger rails and guide blocks (size 15 to size 20); the base gets wider and higher
//   5  a longer stage
// URL options for the still images: ?step=N&still=1 (no motion, carriage in the middle).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { loadTemplate } from '../../../aqtuator/assets/js/viewer.js';
import { MAT, Screws, Rail, screwShaftGeometry, ballNut, coupling, ServoMotor, roundedBar, lathe } from './parts.js';

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const HOLD = 3.6, MORPH = 1.8, MORPH_BACK = 2.6;   // seconds per step, per change, for the way back to step 0

// seal: seal strip; lm: linear motor; bs: ball screw with motor; mB: motor A (0) to B (1);
// s: rail size (1 = 15 mm, 4/3 = 20 mm); dW, dL: extra width and length in metres.
const BASE = { seal: 1, lm: 1, bs: 0, mB: 0, s: 1, dW: 0, dL: 0 };
export const STATES = [
  BASE,
  { ...BASE, seal: 0 },
  { ...BASE, seal: 0, lm: 0, bs: 1 },
  { ...BASE, seal: 0, lm: 0, bs: 1, mB: 1 },
  { ...BASE, seal: 0, lm: 0, bs: 1, mB: 1, s: 4 / 3, dW: 0.03 },
  { ...BASE, seal: 0, lm: 0, bs: 1, mB: 1, s: 4 / 3, dW: 0.03, dL: 0.26 },
];
// Parts that come in wait for the parts that go out: going out uses the first half of a change,
// coming in the second half. Sizes grow over the whole change, and shrink in the first half.
const IN_LATE = new Set(['seal', 'lm', 'bs']);

const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp = t => Math.min(1, Math.max(0, t));
function lerpState(a, b, t) {
  const out = {};
  for (const k in a) {
    const up = b[k] > a[k];
    const u = IN_LATE.has(k) ? (up ? clamp(2 * t - 1) : clamp(2 * t)) : (up ? t : clamp(2 * t));
    out[k] = a[k] + (b[k] - a[k]) * ease(u);
  }
  return out;
}

// Carriage motion: smooth move, short stop, move back (as on the AQTUATOR CS page).
function motion(t, amp) {
  const T = 5.2, move = 1.7, p = (t % T) / T * 2, phase = p < 1 ? p : p - 1, dir = p < 1 ? 1 : -1;
  const y = 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, (phase * T / 2) / move));
  return dir * (2 * y - 1) * amp;
}

// ---------- CAD facts (model space) ----------
const L0 = 0.44, W0 = 0.21;
const CAR_X = [0.1046, 0.3146], CAR_C = 0.2096;       // carriage top along X, and its centre
const YA = 0.0175, ZC = -0.105;                       // ball screw axis: height and centre across
const FLOOR = 0.010;                                  // base floor under the rails
const RAIL_Z = [-0.036, -0.174];                      // rail centres: front, back
// Cut planes, chosen where the part has no vertices, so no hole or rounded edge is cut.
const CUT = {
  base: { x: 0.205, zf: -0.046, zb: -0.164, y: 0.031 },
  carriage_top: { zf: -0.0407, zb: -0.150 },
  carriage_bottom: { zf: -0.0533, zb: -0.1543 },
  MB_MC15: { x: 0.22 },
};
// Counterbores in the carriage top (from the CAD), for M4 cap screws: [x, z].
const CAR_SCREWS = [[0.1355, -0.0065], [0.1355, -0.2035], [0.2096, -0.2035], [0.2096, -0.0065], [0.2837, -0.0065], [0.2837, -0.2035]];

const SEAL = ['sealing_strip', 'magnet_', 'roller_'];
const LM = ['MK2_', 'MK21', 'cooling_block', 'motor_cable_clamp', 'port_oring', 'fitting_', 'hose_'];
const CARRIAGE = ['carriage_', 'MK21', 'TA17', 'AK_MC15', 'roller_', 'cooling_block', 'motor_cable_clamp', 'read_head_cable_clamp', 'fitting_', 'hose_', 'port_oring'];
const has = (list, n) => list.some(p => n.startsWith(p));

function stripes() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 8;
  const g = c.getContext('2d');
  g.fillStyle = '#3a3e42'; g.fillRect(0, 0, 64, 8);
  g.fillStyle = '#2b2e31'; g.fillRect(64, 0, 64, 8);
  g.fillStyle = '#141516'; g.fillRect(62, 0, 3, 8); g.fillRect(126, 0, 2, 8);
  const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

// ---------- the stage ----------
class MorphStage {
  constructor(parts) {
    this.root = new THREE.Group();
    this.model = new THREE.Group(); this.root.add(this.model);           // CAD space
    this.slider = new THREE.Group(); this.model.add(this.slider);        // moves along X only (blocks, nut)
    this.carriage = new THREE.Group(); this.model.add(this.carriage);    // moves along X and up with the blocks
    this.items = [];
    this.fade = { seal: [], lm: [], bs: [] };
    this.clipLocal = [new THREE.Plane(new THREE.Vector3(1, 0, 0), -CAR_X[0]), new THREE.Plane(new THREE.Vector3(-1, 0, 0), CAR_X[1])];
    this.clip = this.clipLocal.map(p => p.clone());

    for (const p of parts) {
      const n = p.name;
      if (n.startsWith('EGR')) continue;                                 // rails are rebuilt in code, with screws
      const geos = n.startsWith('sealing_strip') ? [[p.flat, this.model, ''], [p.geometry, this.carriage, '_lift']] :
        [[p.geometry, n.startsWith('QEH') ? null : has(CARRIAGE, n) ? this.carriage : this.model, '']];
      for (const [geo, parent, tag] of geos) {
        const mat = p.material.clone();
        const cutKey = Object.keys(CUT).find(k => n.startsWith(k));
        const g = cutKey ? geo.clone() : geo;
        const mesh = new THREE.Mesh(g, mat);
        mesh.castShadow = mesh.receiveShadow = true;
        g.computeBoundingBox();
        const bb = g.boundingBox, c = bb.getCenter(new THREE.Vector3());
        const it = { name: n + tag, mesh, cut: cutKey ? CUT[cutKey] : null, orig: cutKey ? g.attributes.position.array.slice() : null, c };
        if (n.startsWith('QEH')) {                                       // guide block: scaled around its rail foot
          it.holder = new THREE.Group(); it.holder.add(mesh); this.slider.add(it.holder); it.block = true;
        } else parent.add(mesh);
        if (tag === '_lift') { mat.clippingPlanes = this.clip; mat.clipShadows = true; }
        if (has(SEAL, n)) this.fade.seal.push(it);
        if (has(LM, n)) this.fade.lm.push(it);
        this.items.push(it);
      }
    }

    // Magnet stripes on top of the magnet track (it fades with the linear motor).
    const st = new THREE.Mesh(new THREE.PlaneGeometry(0.3627, 0.086).rotateX(-Math.PI / 2),
      new THREE.MeshStandardMaterial({ map: stripes(), metalness: 0.5, roughness: 0.45 }));
    st.material.map.repeat.set(0.3627 / 0.024, 1);
    st.position.set((0.0394 + 0.4021) / 2, 0.0197, -0.105); st.receiveShadow = true;
    this.model.add(st);
    this.fade.lm.push({ mesh: st });

    // Rails and their screws.
    this.railScrews = new Screws(this.model, 32);
    this.rails = RAIL_Z.map(() => new Rail(this.model, this.railScrews));

    // Cap screws in the carriage top counterbores.
    this.carScrews = new Screws(this.carriage, 8);

    // ---------- ball screw drive (fades in as one set) ----------
    const bsMats = [MAT.shaft, MAT.nut, MAT.wiper, MAT.black, MAT.alu, MAT.spider, MAT.bearing, MAT.motorBody,
      MAT.motorFlange, MAT.motorCover, MAT.conMetal, MAT.conBlack];
    const bsScrewMats = [MAT.screw.clone(), MAT.socket.clone()];
    this.bsMats = [...bsMats, ...bsScrewMats];
    const add = (parent, geo, mat) => { const m = new THREE.Mesh(geo, mat); m.castShadow = m.receiveShadow = true; parent.add(m); return m; };
    this.bs = new THREE.Group(); this.model.add(this.bs);
    this.bsScrews = new Screws(this.bs, 24); this.bsScrews.mesh.material = bsScrewMats;
    this.nutScrews = new Screws(this.slider, 4); this.nutScrews.mesh.material = bsScrewMats;
    this.motorScrews = new Screws(this.bs, 4); this.motorScrews.mesh.material = bsScrewMats;

    // Shaft: threaded part made once for the longest stage, anchored at the motor end, and cut
    // off at the support bearing with a clipping plane.
    this.shaftClip = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);
    MAT.shaft.clippingPlanes = [this.shaftClip]; MAT.shaft.clipShadows = true;
    this.shaft = add(this.bs, screwShaftGeometry(0.68, 0.006, 0.01, 0.0009), MAT.shaft);
    this.journal = add(this.bs, lathe([[0.0001, 0], [0.0048, 0], [0.005, 0.0004], [0.005, 0.07], [0.0001, 0.07]], 32), MAT.shaft);
    // Support bearing at the far end, inside the base.
    this.support = add(this.bs, roundedBar(0.02, 0.026, 0.046, 0.004, 0.0008), MAT.black);
    this.supportRing = add(this.bs, new THREE.RingGeometry(0.0061, 0.0092, 40).rotateY(Math.PI / 2), MAT.bearing);
    // Ball nut and the bracket that holds it under the carriage.
    this.nut = ballNut(0.006); this.slider.add(this.nut);
    this.bracket = add(this.slider, new THREE.BufferGeometry(), MAT.black);
    // Fixed bearing block on the motor end of the base, and the open motor adapter with the coupling.
    this.endBlock = add(this.bs, new THREE.BufferGeometry(), MAT.black);
    this.adapter = new THREE.Group(); this.bs.add(this.adapter);
    this.plateA = add(this.adapter, roundedBar(1, 1, 1, 0.12, 0.03, [[0, 0, 0.3]]), MAT.black);
    this.plateB = add(this.adapter, roundedBar(1, 1, 1, 0.12, 0.03, [[0, 0, 0.3]]), MAT.black);
    this.rods = [0, 1, 2, 3].map(() => add(this.adapter, new THREE.CylinderGeometry(1, 1, 1, 20).rotateZ(-Math.PI / 2), MAT.alu));
    this.coupling = coupling(); this.adapter.add(this.coupling);
    this.motor = new ServoMotor(this.adapter);
    this.keys = {};
  }

  // Put everything in place for the state s, with the carriage offset off.
  update(s, off) {
    const { dL, dW, s: rs } = s;
    const dH = 0.024 * (rs - 1);                     // the bigger blocks lift the carriage this much
    const inward = 0.017 * (rs - 1);                 // bigger blocks are wider: rails move in, away from the walls
    const L = L0 + dL;

    // CAD parts: move vertices past the cut planes (only when a size changed).
    const sizeKey = [dL, dW, dH].map(v => v.toFixed(6)).join();
    if (sizeKey !== this.keys.size) {
      this.keys.size = sizeKey;
      for (const it of this.items) {
        if (!it.cut) continue;
        const c = it.cut, o = it.orig, a = it.mesh.geometry.attributes.position, p = a.array;
        for (let i = 0; i < o.length; i += 3) {
          const x = o[i], y = o[i + 1], z = o[i + 2];
          p[i] = c.x !== undefined && x > c.x ? x + dL : x;
          p[i + 1] = c.y !== undefined && y > c.y ? y + dH : y;
          p[i + 2] = c.zf !== undefined ? (z > c.zf ? z + dW / 2 : z < c.zb ? z - dW / 2 : z) : z;
        }
        a.needsUpdate = true;
        it.mesh.geometry.computeBoundingSphere();
      }
    }
    // Parts that move as a whole with their side.
    const side = (z, zf = -0.0533, zb = -0.1543) => (z > zf ? dW / 2 : z < zb ? -dW / 2 : 0);
    for (const it of this.items) {
      if (it.cut && !it.name.startsWith('MB_MC15')) continue;
      if (it.block) {
        const k = rs, px = it.c.x, py = FLOOR, pz = it.c.z;
        it.holder.scale.setScalar(k);
        it.holder.position.set(px * (1 - k), py * (1 - k), pz * (1 - k) + side(pz) + (pz > ZC ? -inward : inward));
        continue;
      }
      if (it.name.startsWith('MB_MC15')) { it.mesh.position.set(0, dH, dW / 2); continue; }   // encoder scale on the front wall
      if (it.mesh.parent === this.carriage) it.mesh.position.z = side(it.c.z);
    }

    // Carriage and slider.
    const xc = dL / 2 + off;
    this.slider.position.x = xc;
    this.carriage.position.set(xc, dH, 0);
    this.carScrews.set(CAR_SCREWS.map(([x, z]) => [x, 0.0595, z + side(z, -0.0407, -0.150), [0, 1, 0], 0.004]));

    // Rails.
    const screws = this.rails.flatMap((r, i) => r.update(0.011, 0.429 + dL, RAIL_Z[i] + (i ? inward - dW / 2 : dW / 2 - inward), FLOOR, rs));
    this.railScrews.set(screws);

    // ---------- ball screw drive ----------
    const bsOn = s.bs > 0.001;
    this.bs.visible = this.nut.visible = this.bracket.visible = this.nutScrews.mesh.visible = bsOn;
    let ext = 0;
    if (bsOn) {
      const mB = s.mB, F = 0.06 + 0.02 * mB;
      const xEnd = L - 0.015;                                            // shaft anchor, just inside the end wall
      const rot = -(off / 0.01) * Math.PI * 2;                           // lead 10 mm: one turn per 10 mm of travel
      this.shaft.position.set(xEnd, YA, ZC); this.shaft.rotation.x = rot;
      this.journal.position.set(xEnd, YA, ZC); this.journal.rotation.x = rot;
      this.support.position.set(0.021, FLOOR + 0.013, ZC);
      this.supportRing.position.set(0.0312, YA, ZC);
      // Ball nut on the slider; flange face at x = CAR_C + 0.02 (model), bracket on its motor side.
      const xn = CAR_C + 0.02;
      this.nut.position.set(xn - 0.007, YA, ZC);
      const top = 0.044 + dH, bot = YA - 0.0075, bh = top - bot;
      const bk = bh.toFixed(5);
      if (bk !== this.keys.bracket) {
        this.keys.bracket = bk;
        this.bracket.geometry.dispose();
        this.bracket.geometry = roundedBar(0.012, bh, 0.05, 0.004, 0.0006, [[0, YA - (top + bot) / 2, 0.0068]]);
      }
      this.bracket.position.set(xn + 0.006, (top + bot) / 2, ZC);
      this.nutScrews.set(this.nut.userData.screws.map(([, y, z]) => [xn - 0.008 - 0.004, YA + y, ZC + z, [-1, 0, 0], 0.004]));
      // Fixed bearing block on the end face of the base.
      const eh = 0.040 + dH, ek = eh.toFixed(5);
      if (ek !== this.keys.end) { this.keys.end = ek; this.endBlock.geometry.dispose(); this.endBlock.geometry = roundedBar(0.024, eh, 0.11, 0.004, 0.0008); }
      this.endBlock.position.set(L + 0.012, eh / 2, ZC);
      const bsScrews = [];
      for (const y of [0.008, eh - 0.008]) for (const z of [-0.045, 0.045]) bsScrews.push([L + 0.024 + 0.005, y, ZC + z, [1, 0, 0], 0.005]);
      for (const z of [-0.015, 0.015]) bsScrews.push([0.021, FLOOR + 0.026 + 0.004, ZC + z, [0, 1, 0], 0.004]);
      this.bsScrews.set(bsScrews);
      // Adapter, coupling and motor; they slide in from the end while they fade in.
      const La = 0.045 + 0.01 * mB, a0 = L + 0.024;
      this.adapter.position.set(a0 + (1 - s.bs) * 0.04, YA, ZC);
      this.plateA.scale.set(0.008, F, F); this.plateA.position.set(0.004, 0, 0);
      this.plateB.scale.set(0.008, F, F); this.plateB.position.set(La - 0.004, 0, 0);
      const rr = F * 0.36;
      this.rods.forEach((r, i) => { r.scale.set(La - 0.016, 0.0035, 0.0035); r.position.set(La / 2, (i & 1 ? 1 : -1) * rr, (i & 2 ? 1 : -1) * rr); });
      this.coupling.position.set(La / 2, 0, 0); this.coupling.rotation.x = rot;
      this.motor.group.position.set(La, 0, 0);
      const ms = this.motor.update({ F, Lb: 0.072 + 0.028 * mB, brake: 0.03 * mB, mB });
      this.motorScrews.set(ms.map(([x, y, z, ax, d]) => [a0 + (1 - s.bs) * 0.04 + La + x, YA + y, ZC + z, ax, d]));
      // Motor colour: silver motor A, black motor B.
      MAT.motorBody.color.setHex(0xaeb4b9).lerp(new THREE.Color(0x1a1b1d), mB);
      MAT.motorBody.metalness = 0.85 - 0.45 * mB; MAT.motorBody.roughness = 0.36 + 0.14 * mB;
      // The camera makes room for the motor early, so the motor never slides in outside the view.
      const k = Math.min(1, s.bs * 2.5);
      ext = (0.024 + La + this.motor.length) * k * k * (3 - 2 * k);
      for (const m of this.bsMats) { m.transparent = s.bs < 0.999; m.opacity = s.bs; m.depthWrite = s.bs > 0.5; }
    }

    // Fading parts: seal strip set and linear motor set.
    const fadeSet = (list, v, lift) => {
      for (const it of list) {
        const m = it.mesh;
        m.visible = v > 0.002;
        m.material.transparent = v < 0.999; m.material.opacity = v; m.material.depthWrite = v > 0.5;
        if (lift) m.position.y = (1 - v) * lift;
      }
    };
    fadeSet(this.fade.seal, s.seal, 0.004);
    fadeSet(this.fade.lm, s.lm, 0);

    // Whole stage in the middle of the view, motor included.
    this.span = L + ext;
    this.model.position.set(-this.span / 2, 0, -ZC);
    this.groundY = Math.min(0, YA - (0.03 + 0.01 * s.mB) - 0.003) * s.bs;
  }

  // After the scene matrices are up to date: world clipping planes.
  updateClips() {
    this.model.updateMatrixWorld(true);
    this.clipLocal.forEach((p, i) => this.clip[i].copy(p).applyMatrix4(this.carriage.matrixWorld));
    const v = new THREE.Vector3(0.021, 0, 0).applyMatrix4(this.model.matrixWorld);
    this.shaftClip.set(new THREE.Vector3(1, 0, 0), -v.x);
  }
}

// ---------- the view ----------
export async function initMorph(el, { onStep } = {}) {
  const params = new URLSearchParams(location.search);
  const still = params.has('still');
  // For checks only: ?cam=x,y,z&target=x,y,z fixes the camera.
  const fixedCam = params.has('cam') ? [params.get('cam'), params.get('target') || '0,0.03,0'].map(v => v.split(',').map(Number)) : null;
  const parts = await loadTemplate();

  const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: still });
  r.setPixelRatio(Math.min(devicePixelRatio, 2));
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 0.95;
  r.shadowMap.enabled = true;
  r.shadowMap.type = THREE.PCFSoftShadowMap;
  r.localClippingEnabled = true;
  el.appendChild(r.domElement);
  r.domElement.setAttribute('aria-hidden', 'true');

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(r);
  scene.environment = pmrem.fromScene(new RoomEnvironment(r), 0.04).texture;

  const cam = new THREE.PerspectiveCamera(28, 1, 0.02, 10);
  const target = new THREE.Vector3(0, 0.03, 0);

  // Same lights as the AQTUATOR CS page.
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(0.6, 1.4, 0.9);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -0.75, right: 0.75, top: 0.75, bottom: -0.75, near: 0.2, far: 4 });
  key.shadow.bias = -0.0004;
  key.shadow.radius = 6;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x00c1a0, 1.1); rim.position.set(-1, 0.5, -0.8); scene.add(rim);
  const fill = new THREE.DirectionalLight(0x6fb8ff, 0.5); fill.position.set(-0.8, 0.4, 1); scene.add(fill);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x101010, 0.35));

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.ShadowMaterial({ opacity: 0.35 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
  scene.add(ground);

  const stage = new MorphStage(parts);
  scene.add(stage.root);

  // ----- timeline -----
  let step = Math.min(STATES.length - 1, Math.max(0, parseInt(params.get('step') || '0', 10) || 0));
  let from = STATES[step], t = 1, dur = MORPH;
  let held = 0, auto = !REDUCED && !still, resumeAt = 0, clock = 0, run = 0;
  let current = { ...from };
  // For checks only: ?step=N&still=1&mix=0.5 freezes the change from step N-1 to N half way.
  if (still && params.has('mix') && step > 0) { from = STATES[step - 1]; t = Math.min(0.999, +params.get('mix')); current = lerpState(from, STATES[step], t); }

  const goTo = (i, user) => {
    i = ((i % STATES.length) + STATES.length) % STATES.length;
    dur = i < step ? MORPH_BACK : MORPH;
    from = current; step = i; t = (REDUCED || still) ? 1 : 0; held = 0;
    if (user) { auto = false; resumeAt = clock + 12; }
    onStep?.(step);
  };
  onStep?.(step);

  // ----- size and visibility -----
  let dirty = true, visible = true;
  const resize = () => {
    const w = el.clientWidth, h = el.clientHeight;
    if (!w || !h) return;
    r.setSize(w, h, false);
    cam.aspect = w / h;
    cam.fov = w / h < 1 ? 40 : 28;
    cam.updateProjectionMatrix();
    dirty = true;
  };
  new ResizeObserver(resize).observe(el);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(el);
  resize();

  let last = performance.now();
  const frame = now => {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (visible || dirty) {
      clock += dt;
      if (!auto && !REDUCED && !still && clock > resumeAt) auto = true;
      if (t < 1 && !still) t = Math.min(1, t + dt / dur);
      else if (auto && (held += dt) > HOLD) goTo(step + 1);
      current = t < 1 ? lerpState(from, STATES[step], t) : { ...STATES[step] };

      if (!(REDUCED || still)) run += dt;
      const off = (REDUCED || still) ? 0 : motion(run, 0.085 + current.dL / 2);
      stage.update(current, off);
      ground.position.y = stage.groundY;

      // Camera: a slow swing left and right, never a full turn, so the frame stays the same.
      // It moves back only part of the way when the stage grows, so you see the size change.
      if (fixedCam) { cam.position.set(...fixedCam[0]); cam.lookAt(...fixedCam[1]); }
      else {
      const yaw = (REDUCED || still) ? 0.62 : 0.62 + 0.2 * Math.sin(clock * 0.18);
      const dist = 0.55 + 0.82 * stage.span;
      target.x = 0.04 * stage.span;
      cam.position.set(target.x + Math.sin(yaw) * dist, dist * 0.6, Math.cos(yaw) * dist);
      cam.lookAt(target);
      }
      stage.updateClips();
      r.render(scene, cam);
      dirty = false;
      if (!window.__morphReady) window.__morphReady = true;
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  return { goTo: i => goTo(i, true), get step() { return step; } };
}
