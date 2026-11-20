// SPDX-FileCopyrightText: 2025-2026 Refaqt (BE 0804.145.539) and contributors
// SPDX-License-Identifier: CC-BY-SA-4.0
// AQTUATOR Custom: a stage that changes from one design to the next.
// The stage is built in code from boxes and cylinders. It is a simple example, not the CAD model.
// Every part uses a unit shape plus scale and position, so a change of size is only a change of
// numbers. Units: metres. Y is up, X runs along the travel, Z across it.
//
// Steps (STATES below):
//   0  linear motor, narrow guides, 440 × 210 mm
//   1  the linear motor goes, a ball screw and a small rotary servo motor come in
//   2  a bigger servo motor with a brake
//   3  wider guides with two blocks on each rail, a wider base
//   4  a longer, wider and higher stage
// URL options for the still images: ?step=N&still=1 (no motion, carriage in the middle).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const HOLD = 3.6, MORPH = 1.8;              // seconds per step, seconds per change

const BASE = { lm: 1, bs: 0, mot: 0, mB: 0, rw: 0.015, rh: 0.013, split: 0, bl: 0.052, L: 0.44, W: 0.21, Hw: 0.034, CL: 0.2 };
export const STATES = [
  BASE,
  { ...BASE, lm: 0, bs: 1, mot: 1 },
  { ...BASE, lm: 0, bs: 1, mot: 1, mB: 1 },
  { ...BASE, lm: 0, bs: 1, mot: 1, mB: 1, rw: 0.025, rh: 0.021, split: 1, bl: 0.068, W: 0.24 },
  { ...BASE, lm: 0, bs: 1, mot: 1, mB: 1, rw: 0.025, rh: 0.021, split: 1, bl: 0.068, L: 0.72, W: 0.28, Hw: 0.05, CL: 0.27 },
];
// The drive parts change one after the other: the old drive goes first, then the new one comes in.
const STAGED = new Set(['lm', 'bs', 'mot']);

const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp = t => Math.min(1, Math.max(0, t));

function lerpState(a, b, t) {
  const out = {};
  for (const k in a) {
    let u = t;
    if (STAGED.has(k)) u = b[k] > a[k] ? clamp(2 * t - 1) : clamp(2 * t);
    out[k] = a[k] + (b[k] - a[k]) * ease(u);
  }
  return out;
}

// ---------- materials ----------
function makeMaterials() {
  const phys = o => new THREE.MeshPhysicalMaterial(o);
  const stripes = (w, h, draw) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return t;
  };
  // Thread of the ball screw: light and dark bands, a little slanted.
  const thread = stripes(64, 64, (g, w, h) => {
    g.fillStyle = '#cfd3d6'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#6c7176'; g.lineWidth = 14;
    for (let i = -2; i < 4; i++) { g.beginPath(); g.moveTo(i * 32, h + 8); g.lineTo(i * 32 + 40, -8); g.stroke(); }
  });
  // Magnet track: dark magnets with thin gaps.
  const magnets = stripes(64, 8, (g, w, h) => {
    g.fillStyle = '#2b2e31'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#4a4f54'; g.fillRect(0, 0, 32, h);
    g.fillStyle = '#121314'; g.fillRect(31, 0, 2, h); g.fillRect(63, 0, 1, h);
  });
  return {
    black: phys({ color: 0x0b0c0d, metalness: 0.6, roughness: 0.38, clearcoat: 0.35, clearcoatRoughness: 0.4 }),
    blackMatt: phys({ color: 0x141517, metalness: 0.4, roughness: 0.6 }),
    alu: phys({ color: 0xb9bec2, metalness: 1, roughness: 0.32 }),
    steel: phys({ color: 0xc4c8cc, metalness: 1, roughness: 0.2 }),
    block: phys({ color: 0x8c9196, metalness: 1, roughness: 0.3 }),
    forcer: phys({ color: 0x16181a, metalness: 0.3, roughness: 0.6 }),
    accent: phys({ color: 0x00ac99, metalness: 0.3, roughness: 0.35 }),
    thread: phys({ map: thread, metalness: 1, roughness: 0.25 }),
    magnets: phys({ map: magnets, metalness: 0.5, roughness: 0.45 }),
    motor: phys({ color: 0xb9bec2, metalness: 0.9, roughness: 0.35 }),
    brake: phys({ color: 0x2a2c2f, metalness: 0.6, roughness: 0.45 }),
    plug: phys({ color: 0x0d0e0f, metalness: 0.2, roughness: 0.6 }),
    plugRing: phys({ color: 0x00ac99, metalness: 0.4, roughness: 0.4 }),
  };
}

const MOTOR_A = new THREE.Color(0xc9ced2), MOTOR_B = new THREE.Color(0x34373b);

// ---------- the stage ----------
class Stage {
  constructor(M) {
    this.M = M;
    this.root = new THREE.Group();
    const boxG = new THREE.BoxGeometry(1, 1, 1);
    const cylG = new THREE.CylinderGeometry(1, 1, 1, 48).rotateZ(Math.PI / 2);   // axis along X
    const add = (geo, mat) => {
      const m = new THREE.Mesh(geo, mat); m.castShadow = m.receiveShadow = true; this.root.add(m); return m;
    };
    this.box = mat => add(boxG, mat);
    this.cyl = mat => add(cylG, mat);

    const b = this.box, c = this.cyl;
    this.p = {
      floor: b(M.black), wallL: b(M.black), wallR: b(M.black), capA: b(M.black), capB: b(M.black),
      railL: b(M.steel), railR: b(M.steel),
      blocks: [b(M.block), b(M.block), b(M.block), b(M.block)],
      carriage: b(M.black), stripe: b(M.accent),
      track: b(M.magnets), forcer: b(M.forcer),
      screw: c(M.thread), nut: c(M.steel), nutFlange: c(M.steel), bearA: b(M.black), bearB: b(M.black),
      adapter: b(M.black), flange: b(M.blackMatt), body: b(M.motor), brake: c(M.brake), cap: b(M.blackMatt),
      plug: b(M.plug), plugRing: c(M.plugRing),
    };
  }

  // Put every part in place for the state s, with the carriage at u (-1 … 1 of its travel)
  // and the screw turned to the matching angle.
  update(s, u) {
    const P = this.p, M = this.M;
    const set = (m, sx, sy, sz, x, y, z) => {
      const vis = sx > 1e-4 && sy > 1e-4 && sz > 1e-4;
      m.visible = vis;
      if (vis) { m.scale.set(sx, sy, sz); m.position.set(x, y, z); }
    };
    const { L, W, Hw, CL, rw, rh, bl } = s;
    const tf = 0.012;                            // floor thickness
    const ww = Math.max(0.026, rw + 0.012);      // wall width
    const zr = W / 2 - ww / 2;                   // rail centre across
    const yw = tf + Hw;                          // wall top
    const bh = rh * 1.05 + 0.006;                // block height, from the wall top
    const yc = yw + bh;                          // carriage bottom
    const ct = 0.014;                            // carriage thickness

    set(P.floor, L, tf, W, 0, tf / 2, 0);
    set(P.wallL, L, Hw, ww, 0, tf + Hw / 2, -zr);
    set(P.wallR, L, Hw, ww, 0, tf + Hw / 2, zr);
    const capW = W - 2 * ww;
    set(P.capA, 0.012, Hw, capW, -L / 2 + 0.006, tf + Hw / 2, 0);
    set(P.capB, 0.012, Hw, capW, L / 2 - 0.006, tf + Hw / 2, 0);

    set(P.railL, L - 0.012, rh, rw, 0, yw + rh / 2, -zr);
    set(P.railR, L - 0.012, rh, rw, 0, yw + rh / 2, zr);

    // Carriage position along the travel.
    const reach = Math.max(0, (L - CL) / 2 - 0.03);
    const xc = u * reach;
    set(P.carriage, CL, ct, W - 0.004, xc, yc + ct / 2, 0);
    set(P.stripe, CL * 0.86, 0.0012, 0.004, xc, yc + ct + 0.0006, 0);

    // Guide blocks: with split = 0 the two blocks on a rail sit on top of each other and look like one.
    const bw = rw * 2.4, d = Math.max(0, CL / 2 - bl / 2 - 0.006) * s.split;
    [[-1, -zr], [1, -zr], [-1, zr], [1, zr]].forEach(([k, z], i) =>
      set(P.blocks[i], bl, bh, bw, xc + k * d, yw + bh / 2 + 0.001, z));

    // Linear motor: magnet track on the floor, forcer under the carriage. lm = 0 hides both.
    const lm = s.lm, gap = yc - tf;
    const trackH = 0.008 * lm, trackL = L - 0.04;
    set(P.track, trackL, trackH, 0.07 * Math.min(1, lm * 2), 0, tf + trackH / 2, 0);
    P.track.material.map.repeat.set(trackL / 0.024, 1);
    const fH = Math.max(0, gap - 0.008 - 0.0015) * lm;
    set(P.forcer, CL * 0.8, fH, 0.075 * Math.min(1, lm * 2), xc, yc - fH / 2, 0);

    // Ball screw: shaft, nut on the carriage, a bearing block at each end.
    const bs = s.bs, ys = tf + gap * 0.55, r = 0.008 * bs;
    const sL = L - 0.05;
    set(P.screw, sL, r, r, 0, ys, 0);
    P.screw.material.map.repeat.set(3, sL / 0.01);   // cylinder: u runs around, v along the shaft
    P.screw.rotation.x = -(xc / 0.01) * Math.PI * 2;
    set(P.nut, 0.05, r * 2.1, r * 2.1, xc, ys, 0);
    set(P.nutFlange, 0.008, r * 3.4, r * 3.4, xc - 0.025, ys, 0);
    const bearH = (ys - tf + 0.016) * bs;
    set(P.bearA, 0.028, bearH, 0.056 * bs, -L / 2 + 0.026, tf + bearH / 2, 0);
    set(P.bearB, 0.028, bearH, 0.056 * bs, L / 2 - 0.026, tf + bearH / 2, 0);

    // Rotary servo motor at the +X end. mB changes motor A (short, silver) into motor B
    // (bigger flange, longer black body with a brake).
    const mot = s.mot, mB = s.mB;
    const fl = (0.06 + 0.02 * mB) * mot;                  // square flange
    const bodyL = (0.085 + 0.07 * mB) * mot;
    const bodyS = fl * 0.92;
    const adL = (0.045 + 0.01 * mB) * mot;
    const x0 = L / 2;
    const ym = Math.max(ys, fl / 2 + 0.002);
    set(P.adapter, adL, fl * 0.85, fl * 0.85, x0 + adL / 2, ym, 0);
    set(P.flange, 0.012 * mot, fl, fl, x0 + adL + 0.006 * mot, ym, 0);
    const xb = x0 + adL + 0.012 * mot;
    set(P.body, bodyL, bodyS, bodyS, xb + bodyL / 2, ym, 0);
    M.motor.color.copy(MOTOR_A).lerp(MOTOR_B, mB);
    M.motor.roughness = 0.35 + 0.15 * mB;
    const brL = 0.03 * mB * mot;
    set(P.brake, brL, bodyS * 0.5, bodyS * 0.5, xb + bodyL + brL / 2, ym, 0);
    const capL = 0.01 * mot;
    set(P.cap, capL, bodyS * 0.82, bodyS * 0.82, xb + bodyL + brL + capL / 2, ym, 0);
    // Connector on top of the body: moves to the back and gets a coloured ring on motor B.
    const pS = (0.016 + 0.004 * mB) * mot;
    const xp = xb + bodyL * (0.3 + 0.45 * mB);
    set(P.plug, pS, pS * 1.1, pS, xp, ym + bodyS / 2 + pS * 0.55, 0);
    set(P.plugRing, pS * 0.4, pS * 0.36 * mB, pS * 0.36 * mB, xp, ym + bodyS / 2 + pS * 1.15, 0);
    P.plugRing.rotation.z = Math.PI / 2;

    // Keep the whole stage, with its motor, in the middle of the view.
    const motorLen = adL + 0.012 * mot + bodyL + brL + capL;
    this.root.position.x = -motorLen / 2;
    this.span = L + motorLen;                    // total length, for the camera distance
  }
}

// ---------- the view ----------
export function initMorph(el, { onStep } = {}) {
  const params = new URLSearchParams(location.search);
  const still = params.has('still');
  const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: still });
  r.setPixelRatio(Math.min(devicePixelRatio, 2));
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 0.95;
  r.shadowMap.enabled = true;
  r.shadowMap.type = THREE.PCFSoftShadowMap;
  el.appendChild(r.domElement);
  r.domElement.setAttribute('aria-hidden', 'true');

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(r);
  scene.environment = pmrem.fromScene(new RoomEnvironment(r), 0.04).texture;

  const cam = new THREE.PerspectiveCamera(28, 1, 0.02, 10);
  const target = new THREE.Vector3(0, 0.035, 0);

  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(0.6, 1.4, 0.9);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -0.7, right: 0.7, top: 0.7, bottom: -0.7, near: 0.2, far: 4 });
  key.shadow.bias = -0.0004;
  key.shadow.radius = 6;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x00c1a0, 1.1); rim.position.set(-1, 0.5, -0.8); scene.add(rim);
  const fill = new THREE.DirectionalLight(0x6fb8ff, 0.5); fill.position.set(-0.8, 0.4, 1); scene.add(fill);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x101010, 0.35));

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.ShadowMaterial({ opacity: 0.35 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
  scene.add(ground);

  const stage = new Stage(makeMaterials());
  scene.add(stage.root);

  // ----- timeline -----
  let step = Math.min(STATES.length - 1, Math.max(0, parseInt(params.get('step') || '0', 10) || 0));
  let from = STATES[step], t = 1;              // t: 0 … 1 inside a change
  let held = 0, auto = !REDUCED && !still, resumeAt = 0, clock = 0;
  let current = { ...from };

  const goTo = (i, user) => {
    i = ((i % STATES.length) + STATES.length) % STATES.length;
    from = current; step = i; t = (REDUCED || still) ? 1 : 0; held = 0;
    if (user) { auto = false; resumeAt = clock + 12; }
    onStep?.(step);
  };
  onStep?.(step);

  // ----- size and visibility -----
  const resize = () => {
    const w = el.clientWidth, h = el.clientHeight;
    if (!w || !h) return;
    r.setSize(w, h, false);
    cam.aspect = w / h;
    cam.fov = w / h < 1 ? 40 : 28;
    cam.updateProjectionMatrix();
    dirty = true;
  };
  let dirty = true, visible = true;
  new ResizeObserver(resize).observe(el);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(el);
  resize();

  let last = performance.now();
  const frame = now => {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (visible || dirty) {
      clock += dt;
      if (!auto && !REDUCED && !still && clock > resumeAt) auto = true;
      if (t < 1) t = Math.min(1, t + dt / MORPH);
      else if (auto && (held += dt) > HOLD) goTo(step + 1);
      current = t < 1 ? lerpState(from, STATES[step], t) : { ...STATES[step] };

      const u = (REDUCED || still) ? 0 : Math.sin(clock * 1.25);
      stage.update(current, u);

      // Camera: a slow swing left and right, never a full turn, so the frame stays the same.
      const yaw = (REDUCED || still) ? 0.62 : 0.62 + 0.22 * Math.sin(clock * 0.18);
      // The camera moves back only part of the way when the stage grows, so you see the size change.
      const dist = 0.55 + 0.8 * stage.span;
      // The motor end is nearest to the camera, so it looks bigger: aim a little towards it.
      target.x = 0.04 * stage.span;
      cam.position.set(target.x + Math.sin(yaw) * dist, dist * 0.62, Math.cos(yaw) * dist);
      cam.lookAt(target);
      r.render(scene, cam);
      dirty = false;
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  window.__morphReady = true;

  return { goTo: i => goTo(i, true), get step() { return step; } };
}
