// SPDX-FileCopyrightText: 2025-2026 Refaqt (BE 0804.145.539) and contributors
// SPDX-License-Identifier: CC-BY-SA-4.0
// Parts for the AQTUATOR Custom 3D view that are not in the AQTUATOR CS CAD model:
// guide rails with grooves and screws, cap screws, the ball screw with a real thread groove,
// its nut and bearing blocks, the coupling and two generic AC servo motors.
// Units: metres. X runs along the travel, Y is up, Z points to the front of the stage.
// The parts are examples with plausible sizes. They are not copied from a supplier.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// ---------- materials ----------
const phys = o => new THREE.MeshPhysicalMaterial(o);
export const MAT = {
  screw: phys({ color: 0x1e2022, metalness: 0.75, roughness: 0.32 }),           // black oxide steel
  socket: phys({ color: 0x050505, metalness: 0.2, roughness: 0.9 }),
  hole: phys({ color: 0x2a2c2e, metalness: 0.9, roughness: 0.45, side: THREE.BackSide }),
  rail: phys({ color: 0xc4c8cc, metalness: 1, roughness: 0.2, side: THREE.DoubleSide }), // ground steel
  shaft: phys({ color: 0xd3d7da, metalness: 1, roughness: 0.18 }),
  nut: phys({ color: 0x8d9398, metalness: 1, roughness: 0.3, side: THREE.DoubleSide }),
  wiper: phys({ color: 0x111213, metalness: 0, roughness: 0.7, side: THREE.DoubleSide }),
  black: phys({ color: 0x0b0c0d, metalness: 0.6, roughness: 0.38, clearcoat: 0.35, clearcoatRoughness: 0.4 }), // black anodised, as the base
  alu: phys({ color: 0xc9ced2, metalness: 1, roughness: 0.3, side: THREE.DoubleSide }),
  spider: phys({ color: 0xd8641e, metalness: 0, roughness: 0.55 }),           // polyurethane spider of the jaw coupling
  bearing: phys({ color: 0x3a3d40, metalness: 0.9, roughness: 0.35 }),
  // Motor materials change colour between motor A and motor B.
  motorBody: phys({ color: 0xaeb4b9, metalness: 0.85, roughness: 0.36, clearcoat: 0.2 }),
  motorFlange: phys({ color: 0x18191b, metalness: 0.5, roughness: 0.5 }),
  motorCover: phys({ color: 0x141517, metalness: 0.2, roughness: 0.6 }),
  conMetal: phys({ color: 0xbfc4c8, metalness: 1, roughness: 0.28, side: THREE.DoubleSide }),
  conBlack: phys({ color: 0x101112, metalness: 0.1, roughness: 0.55 }),
  plate: phys({ color: 0xc2c6ca, metalness: 0.7, roughness: 0.4 }),
};

// ---------- shapes ----------
export function roundedRect(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  r = Math.min(r, w / 2, h / 2);
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

// A box along X with rounded long edges (corner) and small round edges at both ends (edge).
// Size: len along X, h along Y, w along Z. Centred on the origin.
export function roundedBar(len, h, w, corner, edge = 0.0006, holes = []) {
  const shape = roundedRect(w - 2 * edge, h - 2 * edge, Math.max(corner - edge, 0.0002));
  for (const [hz, hy, r] of holes) { const p = new THREE.Path(); p.absarc(hz, hy, r, 0, Math.PI * 2, true); shape.holes.push(p); }
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(len - 2 * edge, 0.0002), bevelEnabled: edge > 0, bevelThickness: edge, bevelSize: edge,
    bevelSegments: 2, curveSegments: 6,
  });
  g.translate(0, 0, -(len - 2 * edge) / 2);
  g.rotateY(Math.PI / 2);              // extrusion (Z) becomes X; shape X becomes -Z
  return g;
}

// Turned part: points are [radius, x] pairs; the axis is X.
export function lathe(points, seg = 48) {
  const g = new THREE.LatheGeometry(points.map(([r, x]) => new THREE.Vector2(r, x)), seg);
  g.rotateZ(-Math.PI / 2);             // lathe axis Y becomes X
  return g;
}

function cylX(r, len, seg = 40, open = false) {
  return new THREE.CylinderGeometry(r, r, len, seg, 1, open).rotateZ(-Math.PI / 2);
}

// ---------- cap screw (ISO 4762 shape) ----------
// Unit size: d = 1. Head top centre at the origin, axis along +Y (the head looks up).
let capGeo = null;
export function capScrewGeometry() {
  if (capGeo) return capGeo;
  const R = 0.75, k = 1.0, s = 0.75 / Math.sqrt(3);   // hex socket: 0.75 d across flats; s is the corner radius
  const head = new THREE.LatheGeometry([[0.5, -1.7], [0.5, -k], [R, -k], [R, -0.08], [R - 0.08, 0]].map(([r, y]) => new THREE.Vector2(r, y)), 40);
  const top = new THREE.Shape(); top.absarc(0, 0, R - 0.08, 0, Math.PI * 2, false);
  const hex = new THREE.Path();
  for (let i = 0; i <= 6; i++) { const a = i * Math.PI / 3; (i ? hex.lineTo : hex.moveTo).call(hex, Math.cos(a) * s, Math.sin(a) * s); }
  top.holes.push(hex);
  const topG = new THREE.ShapeGeometry(top, 24).rotateX(-Math.PI / 2);
  const wall = new THREE.CylinderGeometry(s, s, 0.45, 6, 1, true).translate(0, -0.225, 0);
  const floor = new THREE.CircleGeometry(s, 6).rotateX(-Math.PI / 2).translate(0, -0.45, 0);
  // Socket wall: seen from inside, so flip it.
  const idx = wall.index.array; for (let i = 0; i < idx.length; i += 3) { const t = idx[i]; idx[i] = idx[i + 2]; idx[i + 2] = t; }
  const n = wall.attributes.normal; for (let i = 0; i < n.count; i++) n.setXYZ(i, -n.getX(i), -n.getY(i), -n.getZ(i));
  capGeo = mergeGeometries([head, topG, wall, floor].map(g => g.toNonIndexed()), true);
  // groups: 0 head, 1 top -> screw; 2 wall, 3 floor -> socket
  capGeo.groups.forEach((gr, i) => { gr.materialIndex = i < 2 ? 0 : 1; });
  return capGeo;
}

// A set of cap screws as one instanced mesh. Each screw: position, axis (where the head looks), size d.
export class Screws {
  constructor(parent, max) {
    this.mesh = new THREE.InstancedMesh(capScrewGeometry(), [MAT.screw, MAT.socket], max);
    this.mesh.castShadow = true; this.mesh.receiveShadow = true;
    this.mesh.count = 0;
    this.mesh.frustumCulled = false;
    parent.add(this.mesh);
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._s = new THREE.Vector3(); this._p = new THREE.Vector3();
    this._up = new THREE.Vector3(0, 1, 0); this._a = new THREE.Vector3();
  }
  set(list) {
    list.forEach(([x, y, z, axis, d], i) => {
      this._q.setFromUnitVectors(this._up, this._a.set(...axis).normalize());
      this._m.compose(this._p.set(x, y, z), this._q, this._s.set(d, d, d));
      this.mesh.setMatrixAt(i, this._m);
    });
    this.mesh.count = list.length;
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

// ---------- guide rail (profile like a 15 mm ball rail) ----------
// The profile is drawn for size 15; it is scaled for other sizes. Half profile (z >= 0), y from the rail foot.
function railProfile() {
  const H = 0.0125, W = 0.0075, c = 0.0005, pts = [];
  const groove = (yc, r, from, to) => {              // ball groove on the side: an arc cut into the wall
    for (let i = 0; i <= 8; i++) { const a = from + (to - from) * i / 8; pts.push([W - Math.cos(a) * r * 0.75, yc + Math.sin(a) * r]); }
  };
  pts.push([W - c, 0], [W, c], [W, 0.0055]);
  groove(0.0068, 0.0013, -Math.PI / 2, Math.PI / 2);
  pts.push([W, 0.0094]);
  groove(0.0104, 0.0010, -Math.PI / 2, Math.PI / 2);
  pts.push([W, H - c], [W - c, H]);
  const right = pts, left = pts.slice().reverse().map(([z, y]) => [-z, y]);
  return { pts: [...right, ...left], H, top: W - c };   // closed loop, counter-clockwise seen from -X
}

// Side walls of the rail: strips along X from the profile edges (except the top), unit length.
function railBodyGeometry() {
  const { pts } = railProfile();
  const pos = [], nrm = [], idx = [];
  const n = pts.length;
  const edges = [];
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    const isTop = Math.abs(a[1] - b[1]) < 1e-9 && a[1] > 0.012;
    if (isTop) continue;
    const dz = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dz, dy);
    edges.push({ a, b, nz: dy / l, ny: -dz / l });
  }
  // Outward normal: profile runs counter-clockwise seen from +X when z is to the right... check sign by the bottom edge.
  const bottom = edges.find(e => Math.abs(e.a[1]) < 1e-9 && Math.abs(e.b[1]) < 1e-9);
  const flip = bottom && bottom.ny > 0 ? -1 : 1;
  for (const e of edges) {
    const base = pos.length / 3;
    for (const x of [0, 1]) for (const p of [e.a, e.b]) { pos.push(x, p[1], p[0]); nrm.push(0, e.ny * flip, e.nz * flip); }
    // quad: (0,a) (0,b) (1,a) (1,b)
    if (flip > 0) idx.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
    else idx.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  g.setIndex(idx);
  // End faces.
  const shape = new THREE.Shape(pts.map(([z, y]) => new THREE.Vector2(z, y)));
  const end0 = new THREE.ShapeGeometry(shape).rotateY(-Math.PI / 2);         // faces -X at x = 0; shape x -> z
  const end1 = new THREE.ShapeGeometry(shape).rotateY(Math.PI / 2).translate(1, 0, 0);
  // rotateY(+90°) maps shape x to -z: mirror z so the end face matches the profile,
  // then flip the triangle order, so the face still looks to +X.
  const p1 = end1.attributes.position; for (let i = 0; i < p1.count; i++) p1.setZ(i, -p1.getZ(i));
  { const a = end1.index.array; for (let i = 0; i < a.length; i += 3) { const t = a[i]; a[i] = a[i + 2]; a[i + 2] = t; } }
  const out = mergeGeometries([g, end0.deleteAttribute('uv'), end1.deleteAttribute('uv')].map(x => x.index ? x.toNonIndexed() : x));
  return out;
}

export class Rail {
  // A rail on the base floor. zc: centre across, floor: height of the rail foot.
  constructor(parent, screws) {
    this.group = new THREE.Group(); parent.add(this.group);
    this.body = new THREE.Mesh(railBodyGeometry(), MAT.rail);
    this.top = new THREE.Mesh(new THREE.BufferGeometry(), MAT.rail);
    this.holes = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 1, 32, 1, true), MAT.hole, 16);
    for (const m of [this.body, this.top]) { m.castShadow = m.receiveShadow = true; this.group.add(m); }
    this.holes.frustumCulled = false; this.group.add(this.holes);
    this.screws = screws; this.key = '';
  }
  // x0, x1: rail ends; s: size (1 = 15 mm rail); returns the screw list for this rail.
  update(x0, x1, zc, floor, s, opacity = 1) {
    const { H, top } = railProfile(), len = x1 - x0, cx = (x0 + x1) / 2;
    this.body.scale.set(len, s, s); this.body.position.set(x0, floor, zc);
    const pitch = 0.06, n = Math.floor((len / 2 - 0.02) / pitch), xs = [];
    for (let k = -n; k <= n; k++) xs.push(cx + k * pitch);
    const r = 0.00375 * s, depth = 0.0006 * s, yTop = floor + H * s;
    const key = [len.toFixed(5), s.toFixed(4), cx.toFixed(5), zc.toFixed(5)].join();
    if (key !== this.key) {
      this.key = key;
      // Top face with the counterbores, regenerated only when the rail changes.
      const sh = new THREE.Shape(); const w = top * s;
      sh.moveTo(x0, -w); sh.lineTo(x1, -w); sh.lineTo(x1, w); sh.lineTo(x0, w); sh.lineTo(x0, -w);
      for (const x of xs) { const p = new THREE.Path(); p.absarc(x, 0, r, 0, Math.PI * 2, true); sh.holes.push(p); }
      const g = new THREE.ShapeGeometry(sh, 16).rotateX(-Math.PI / 2);     // shape y -> -z
      g.translate(0, yTop, zc);
      this.top.geometry.dispose(); this.top.geometry = g;
    }
    const m = new THREE.Matrix4();
    xs.forEach((x, i) => { m.makeScale(r, depth, r).setPosition(x, yTop - depth / 2, zc); this.holes.setMatrixAt(i, m); });
    this.holes.count = xs.length; this.holes.instanceMatrix.needsUpdate = true;
    return xs.map(x => [x, yTop - depth, zc, [0, 1, 0], 0.004 * s]);
  }
}

// ---------- ball screw ----------
// Threaded shaft from x = 0 towards -len, with a helical ball groove. Turning the mesh about X
// makes the groove run along the shaft, like a real screw.
export function screwShaftGeometry(len, R, lead, depth, seg = 48, step = 0.0005) {
  const nx = Math.ceil(len / step) + 1, w = 0.36;   // groove width as part of the lead (about one ball)
  const pos = new Float32Array(nx * (seg + 1) * 3), idx = [];
  for (let i = 0; i < nx; i++) {
    const x = -Math.min(i * step, len);
    for (let j = 0; j <= seg; j++) {
      const th = (j / seg) * Math.PI * 2;
      let u = (x / lead - th / (Math.PI * 2)) % 1; if (u < 0) u += 1;
      const t = (u - 0.5) / w, g = Math.abs(t) < 0.5 ? Math.sqrt(1 - 4 * t * t) : 0;   // round ball groove
      const r = R - depth * g, k = (i * (seg + 1) + j) * 3;
      pos[k] = x; pos[k + 1] = Math.cos(th) * r; pos[k + 2] = Math.sin(th) * r;
    }
  }
  for (let i = 0; i < nx - 1; i++) for (let j = 0; j < seg; j++) {
    const a = i * (seg + 1) + j, b = a + seg + 1;
    idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// Ball nut: body along -X from the flange, flange with two flats, four screws, black wiper.
export function ballNut(R) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(lathe([[R + 0.0001, -0.0001], [R + 0.0001, 0.0001], [0.0105, 0.0001], [0.0105, -0.0262], [0.0097, -0.027], [R + 0.0003, -0.027]]), MAT.nut);
  const wiper = new THREE.Mesh(lathe([[R + 0.0002, -0.027], [0.0092, -0.027], [0.0092, -0.031], [R + 0.0002, -0.031]]), MAT.wiper);
  const fl = new THREE.Shape(); const Rf = 0.019, flat = 0.0118, a = Math.asin(flat / Rf);
  fl.absarc(0, 0, Rf, -a, a, false); fl.lineTo(-Math.sqrt(Rf * Rf - flat * flat), flat);
  fl.absarc(0, 0, Rf, Math.PI - a, Math.PI + a, false); fl.lineTo(Math.sqrt(Rf * Rf - flat * flat), -flat);
  const hole = new THREE.Path(); hole.absarc(0, 0, R + 0.0002, 0, Math.PI * 2, true); fl.holes.push(hole);
  const flange = new THREE.Mesh(new THREE.ExtrudeGeometry(fl, { depth: 0.007, bevelEnabled: true, bevelThickness: 0.0005, bevelSize: 0.0005, bevelSegments: 2, curveSegments: 24 }).rotateY(Math.PI / 2).translate(-0.0005, 0, 0), MAT.nut);
  // rotateY(+90°): shape x -> -z, shape y -> y, extrusion z -> x. Flange from x = 0 to 0.008.
  for (const m of [body, wiper, flange]) { m.castShadow = m.receiveShadow = true; g.add(m); }
  g.userData.screws = [45, 135, 225, 315].map(d => { const t = d * Math.PI / 180; return [0.0, Math.sin(t) * 0.0145, Math.cos(t) * 0.0145]; });
  return g;
}

// Jaw coupling: two clamp hubs with a slot and an orange spider. Axis X, length 0.03, centred.
export function coupling() {
  const g = new THREE.Group();
  const hub = () => lathe([[0.0001, -0.0125], [0.0095, -0.0125], [0.0102, -0.0118], [0.0102, -0.0015], [0.0001, -0.0015]], 40);
  const h1 = new THREE.Mesh(hub(), MAT.alu), h2 = new THREE.Mesh(hub(), MAT.alu);
  h2.rotation.y = Math.PI;
  const spider = new THREE.Mesh(cylX(0.0098, 0.003, 24), MAT.spider);
  const slot = (x) => { const s = new THREE.Mesh(new THREE.BoxGeometry(0.0009, 0.0205, 0.0035), MAT.socket); s.position.set(x, 0, 0); return s; };
  for (const m of [h1, h2, spider, slot(-0.008), slot(0.008)]) { m.castShadow = true; g.add(m); }
  return g;
}

// ---------- servo motor ----------
// Generic AC servo motor, built from a few shapes that change smoothly between motor A and B.
// Axis along +X, flange face at x = 0 (the side bolted to the adapter), body towards +X.
const LABEL = (() => {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#c9cdd1'; g.fillRect(0, 0, 256, 128);
  g.fillStyle = '#3c4044';
  g.fillRect(14, 14, 120, 12);
  [40, 56, 72, 88, 104].forEach((y, i) => g.fillRect(14, y, 150 - i * 18, 6));
  for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) if ((i * 7 + j * 3) % 4 < 2) g.fillRect(186 + i * 9, 36 + j * 9, 8, 8);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
})();

export class ServoMotor {
  constructor(parent) {
    this.group = new THREE.Group(); parent.add(this.group);
    const add = (geo, mat) => { const m = new THREE.Mesh(geo, mat); m.castShadow = m.receiveShadow = true; this.group.add(m); return m; };
    // Unit shapes (size 1 across), scaled per motor.
    this.flange = add(roundedBar(1, 1, 1, 0.14, 0.03, [[0.41, 0.41, 0.05], [-0.41, 0.41, 0.05], [0.41, -0.41, 0.05], [-0.41, -0.41, 0.05]]), MAT.motorFlange);
    this.body = add(roundedBar(1, 1, 1, 0.2, 0.0), MAT.motorBody);
    this.groove = add(roundedBar(1, 1, 1, 0.19, 0.0), MAT.motorCover);
    this.brake = add(roundedBar(1, 1, 1, 0.2, 0.0), MAT.motorBody);
    this.cover = add(roundedBar(1, 1, 1, 0.22, 0.04), MAT.motorCover);
    this.capRing = add(roundedBar(1, 1, 1, 0.22, 0.03), MAT.motorCover);
    this.label = add(new THREE.PlaneGeometry(1, 1), new THREE.MeshStandardMaterial({ map: LABEL, metalness: 0.5, roughness: 0.45 }));
    // Connectors: a square boss, a turning angled housing and a knurled coupling nut.
    this.cons = [0, 1].map(() => {
      const c = new THREE.Group(); this.group.add(c);
      const m = (geo, mat) => { const x = new THREE.Mesh(geo, mat); x.castShadow = true; c.add(x); return x; };
      m(roundedBar(1, 0.36, 1, 0.18, 0.04).translate(0, 0.18, 0), MAT.conBlack);                  // boss
      m(new THREE.CylinderGeometry(0.32, 0.36, 0.5, 32).translate(0, 0.6, 0), MAT.conMetal);      // neck
      m(new THREE.SphereGeometry(0.34, 24, 12).translate(0, 0.85, 0), MAT.conMetal);               // elbow
      m(lathe([[0.0, 0.0], [0.34, 0.0], [0.34, 0.45], [0.4, 0.47], [0.4, 0.86], [0.36, 0.9], [0.24, 0.9], [0.24, 0.86], [0.0, 0.86]], 32).translate(0, 0.85, 0), MAT.conMetal); // barrel to +X
      const knurl = [];                                                                               // knurled nut
      for (let i = 0; i <= 12; i++) knurl.push([i % 2 ? 0.4 : 0.43, 0.5 + i * 0.03]);
      m(lathe([[0.36, 0.5], ...knurl, [0.36, 0.86]], 40).translate(0, 0.85, 0), MAT.conMetal);
      m(new THREE.CircleGeometry(0.24, 24).rotateY(Math.PI / 2).translate(0.9, 0.85, 0), MAT.socket); // contact face
      return c;
    });
    this.screws = null;
  }
  // p: motor parameters; returns flange screw list (in group space) and the motor length.
  update(p) {
    const F = p.F, t = 0.01, S = F * 0.86;
    this.flange.scale.set(t, F, F); this.flange.position.set(t / 2, 0, 0);
    let x = t;
    this.body.scale.set(p.Lb, S, S); this.body.position.set(x + p.Lb / 2, 0, 0); x += p.Lb;
    const gl = 0.0025 * Math.min(1, p.brake / 0.004);
    this.groove.visible = this.brake.visible = p.brake > 0.0005;
    this.groove.scale.set(gl, S * 0.95, S * 0.95); this.groove.position.set(x + gl / 2, 0, 0); x += gl;
    this.brake.scale.set(Math.max(p.brake, 0.0001), S, S); this.brake.position.set(x + p.brake / 2, 0, 0); x += p.brake;
    const cl = 0.026 + 0.006 * p.mB;
    this.cover.scale.set(cl, S * 0.94, S * 0.94); this.cover.position.set(x + cl / 2, 0, 0); x += cl;
    this.capRing.scale.set(0.004, S * 0.7, S * 0.7); this.capRing.position.set(x + 0.002, 0, 0); x += 0.004;
    // Name plate on the side that faces the camera (+Z).
    this.label.scale.set(p.Lb * 0.55, S * 0.36, 1); this.label.position.set(t + p.Lb * 0.45, -S * 0.08, S / 2 + 0.0003);
    // Connectors on top, near the back: one on motor A, two on motor B.
    const cs = [0.022 + 0.004 * p.mB, 0.017];
    this.cons.forEach((c, i) => {
      const k = i === 0 ? 1 : p.mB;
      c.visible = k > 0.02;
      c.scale.set(cs[i] * k, cs[i] * k, cs[i] * k);
      c.position.set(t + p.Lb + p.brake - (i === 0 ? 0.018 : 0.045 * p.mB + 0.006), S / 2, 0);
    });
    const hs = F * 0.41, d = 0.005 + 0.001 * p.mB;
    this.length = x;
    // Screw origin is the head top; the head sits on the flange face at x = t.
    return [[hs, hs], [-hs, hs], [hs, -hs], [-hs, -hs]].map(([y, z]) => [t + d, y, z, [1, 0, 0], d]);
  }
}
