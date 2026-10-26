// Cabot Cove — toy-diorama 3D scene (three.js). World units = map grid units.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/+esm';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js/+esm';
import { mergeGeometries } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/utils/BufferGeometryUtils.js/+esm';

const CX = 50, CZ = 48, X0 = -6, Y0 = -8, W = 112, HALF = 56, K = 1.45, GS = 1.3;
const LAND = [[-60,-30],[78,-30],[78,0],[75.5,5],[73.6,9.6],[75.2,13.6],[80,15.2],[83,23],[86,30.5],[82.5,33.6],[79,35.6],[76.6,38],[76,42],[76.4,46],[77.2,49.6],[79.6,52.6],[84,54],[82.6,57],[78.6,59],[76.6,62],[78.6,64.6],[82.6,63.8],[85.6,65],[88,69],[93,74],[95.6,79],[94,83.6],[90,86.6],[85,87],[80,84.6],[76.6,82.8],[72.6,83.6],[69.6,88],[67,95],[66,101],[64,130],[-60,130]];
const BEACH = [[71.8,83.4],[73.5,80.6],[76.5,80.2],[79.6,81.6],[81.6,84.2],[79.8,84.9],[76.6,83.2],[72.8,84.2]];
const EXTRA = [[[18,43],[17.5,52],[19,60],[15,70]],[[24,34],[29.5,32.6],[34,36]],[[56,50],[56,57],[55.6,64]],[[50,60],[55,64],[62,65],[69,63]],[[71,66],[66,76],[63.2,85]],[[34,36],[31.6,29.5],[30.6,25.6]],[[31,49],[26,51.5],[24,58],[25.5,63.5],[31,67.4]],[[50,43],[50.6,46.5],[51,49.6]]];
const FIELDS = [[[-40,47.5],[5.5,47.5],[11.5,57.5],[-40,58.5]],[[0,74],[13,73.4],[14.5,90],[0,92]],[[-40,36],[6,36.5],[7,42.8],[-40,42.6]],[[30,86],[44,83],[50,92],[34,96]]];
const FORESTS = [
  { p: [[-60,-30],[34,-30],[30,0],[38,13],[25,28],[11,35],[-60,33]], d: .78, pine: .72 },
  { p: [[-60,58.5],[20,61],[28,77],[23,100],[25,130],[-60,130]], d: .62, pine: .55 },
  { p: [[44,-30],[77,-30],[77,3],[72.5,8.5],[66,15.5],[56,19.5],[46,22]], d: .6, pine: .85 },
  { p: [[82,62.5],[90,70],[95,77],[93,86],[86,86.5],[80,81]], d: .45, pine: .9 },
  { p: [[27,82],[44,79.5],[58,82],[63,92],[60,130],[24,130]], d: .55, pine: .5 },
  { p: [[46,24],[60,21],[69,29],[73,37],[63,40],[53,36.5]], d: .5, pine: .5 }
];
const BOATS = [[80.2,46.8,'lob',-80,'#f1ece0'],[78.4,47.4,'lob',100,'#b8402f'],[83.2,46.4,'sail',-86,'#f4f0e6'],[80.3,51.6,'lob',96,'#2f5a7a'],[83.2,51.8,'lob',84,'#f1ece0'],[85.4,47.6,'lob',-20,'#3e6a4a'],[86.4,41.6,'sail',-30,'#f4f0e6'],[82,40.2,'sail',10,'#f4f0e6'],[88.6,44.6,'lob',30,'#e3c35a'],[84.4,37.4,'lob',-50,'#b8402f'],[79.4,38.6,'dinghy',20,'#e6e1d4'],[88.2,37.6,'sail',70,'#f4f0e6'],[97,58,'lob',-20,'#f1ece0'],[100,30,'sail',-40,'#f4f0e6'],[92,92,'sail',20,'#f4f0e6']];
const AREA = new Set(['cabot-cove-harbor', 'town-docks', 'main-street']);
const LEAF = { spring: ['#b6dd6a','#a3d45a','#f4c6d6','#c5e47a','#ffffff','#9fd05a'], winter: ['#eef2f4','#e2e8ec','#d6dde2','#f4f6f7','#c9d1d6','#e8ecef'], summer: ['#9bc53d','#7cb342','#8bc34a','#a8d14f','#6fae3a','#b4d65a'], autumn: ['#d9772b','#e3a23a','#b8462c','#d8b443','#8f9a3c','#c85a2a'], fog: ['#6a9a4c','#76a856','#5f8f47','#80ae5e','#66954c','#8ab866'] };
const PINE = ['#3f8f4f','#4c9e5a','#357f45','#5aa865'];
const WALLS = ['#f6eedc','#e8b04f','#f3e2b8','#d9a35a','#c7dbe6','#e9c9b8','#f6f3ea','#cf6a4a','#b9d4a8','#f0cf7a'];
const ROOFS = ['#5b6577','#4f5868','#a8573a','#8f4a34','#6d7a8c','#b4643f'];
const SHOPW = ['#ece5d2','#c9b28a','#d8e2e2','#efe0b0','#b8644c','#e3dccb','#a9bac4','#f1e7d8'];
const AWN = ['#9c3d30','#2d3d5a','#3e6a4a','#2f7a80','#c9a23a','#6f8394','#a46aa3'];
const CARS = ['#7d2f2a','#2f4a6a','#c9b98f','#5e6b4a','#a8a39a','#6a3e2c','#e3dcc8','#3b3f46'];

function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function pip(x, y, poly) { let ins = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1]; if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) ins = !ins; } return ins; }
function catmull(pts, step, closed) {
  const L = pts.length, out = [], g = i => closed ? pts[(i + L) % L] : pts[Math.max(0, Math.min(L - 1, i))], end = closed ? L : L - 1;
  for (let i = 0; i < end; i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    const m = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
    for (let k = 0; k < m; k++) { const t = k / m, u = 1 - t; out.push([u*u*u*p1[0] + 3*u*u*t*c1[0] + 3*u*t*t*c2[0] + t*t*t*p2[0], u*u*u*p1[1] + 3*u*u*t*c1[1] + 3*u*t*t*c2[1] + t*t*t*p2[1]]); }
  }
  if (!closed) out.push(pts[L - 1].slice());
  return out;
}
function clipRect(poly, x0, y0, x1, y1) {
  const E = [[p => p[0] >= x0, (a, b) => { const t = (x0 - a[0]) / (b[0] - a[0]); return [x0, a[1] + t * (b[1] - a[1])]; }], [p => p[0] <= x1, (a, b) => { const t = (x1 - a[0]) / (b[0] - a[0]); return [x1, a[1] + t * (b[1] - a[1])]; }],
    [p => p[1] >= y0, (a, b) => { const t = (y0 - a[1]) / (b[1] - a[1]); return [a[0] + t * (b[0] - a[0]), y0]; }], [p => p[1] <= y1, (a, b) => { const t = (y1 - a[1]) / (b[1] - a[1]); return [a[0] + t * (b[0] - a[0]), y1]; }]];
  let out = poly;
  for (const [ins, inter] of E) { const inp = out; out = []; for (let i = 0; i < inp.length; i++) { const cur = inp[i], prev = inp[(i + inp.length - 1) % inp.length]; if (ins(cur)) { if (!ins(prev)) out.push(inter(prev, cur)); out.push(cur); } else if (ins(prev)) out.push(inter(prev, cur)); } }
  return out;
}
const C = new THREE.Color();
function col(g, hex) {
  if (g.index) g = g.toNonIndexed();
  if (g.attributes.uv) g.deleteAttribute('uv');
  if (g.attributes.uv1) g.deleteAttribute('uv1');
  if (!g.attributes.normal) g.computeVertexNormals();
  C.set(hex); const n = g.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = C.r; a[i * 3 + 1] = C.g; a[i * 3 + 2] = C.b; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g;
}
const shade = (hex, t) => '#' + new THREE.Color(hex).lerp(new THREE.Color(t > 0 ? '#ffffff' : '#1b1f22'), Math.abs(t)).getHexString();
function gableGeoms(w, d, rh, ov) {
  const hw = w / 2 + ov, hd = d / 2 + ov, FL = [-hw, 0, hd], FR = [hw, 0, hd], BL = [-hw, 0, -hd], BR = [hw, 0, -hd], RL = [-hw, rh, 0], RR = [hw, rh, 0];
  const mk = tris => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(tris.flat(2), 3)); g.computeVertexNormals(); return g; };
  return { slopes: mk([[FL, FR, RR], [FL, RR, RL], [BR, BL, RL], [BR, RL, RR]]), ends: mk([[BL, FL, RL], [FR, BR, RR]]) };
}
// ---------- part kit (local frame: front faces +z, ground y=0) ----------
function kit() { return { body: [], win: [], wake: [] }; }
function box(P, w, h, d, x, y, z, hex, b = 'body', rx = 0, ry = 0) { const g = new THREE.BoxGeometry(w, h, d); if (rx) g.rotateX(rx); if (ry) g.rotateY(ry); g.translate(x, y + h / 2, z); P[b].push(col(g, hex)); }
function cyl(P, rt, rb, h, seg, x, y, z, hex, b = 'body') { const g = new THREE.CylinderGeometry(rt, rb, h, seg); g.translate(x, y + h / 2, z); P[b].push(col(g, hex)); }
function cone(P, r, h, seg, x, y, z, hex, ry = 0, sx = 1, sz = 1) { const g = new THREE.ConeGeometry(r, h, seg); if (ry) g.rotateY(ry); g.scale(sx, 1, sz); g.translate(x, y + h / 2, z); P.body.push(col(g, hex)); }
function sph(P, r, x, y, z, hex, det = 0) { const g = new THREE.IcosahedronGeometry(r, det); g.translate(x, y, z); P.body.push(col(g, hex)); }
function gable(P, w, d, rh, x, y, z, roof, wall, alongZ) {
  const W2 = alongZ ? d : w, D2 = alongZ ? w : d, ov = .16, t = .16, a = Math.atan2(rh, D2 / 2), L = Math.hypot(D2 / 2, rh) + ov;
  const Ez = D2 / 2 + ov * Math.cos(a), Ey = -ov * Math.sin(a), cz = Ez / 2 + Math.sin(a) * t / 2, cy = (Ey + rh) / 2 + Math.cos(a) * t / 2, gs = [];
  let g = new THREE.BoxGeometry(W2 + ov * 2, t, L); g.rotateX(a); g.translate(0, cy, cz); gs.push(col(g, roof));
  g = new THREE.BoxGeometry(W2 + ov * 2, t, L); g.rotateX(-a); g.translate(0, cy, -cz); gs.push(col(g, shade(roof, -.06)));
  g = new THREE.BoxGeometry(W2 + ov * 2 + .04, .14, .26); g.translate(0, rh + .06, 0); gs.push(col(g, shade(roof, -.2)));
  gs.push(col(gableGeoms(W2, D2, rh, 0).ends, wall));
  gs.forEach(q => { if (alongZ) q.rotateY(Math.PI / 2); q.translate(x, y, z); }); P.body.push(...gs);
}
function xf(geoms, x, z, ry, y = 0, sc = 1) { const m = new THREE.Matrix4().makeRotationY(ry); if (sc !== 1) m.multiply(new THREE.Matrix4().makeScale(sc, sc, sc)); m.setPosition(x, y, z); geoms.forEach(g => g.applyMatrix4(m)); return geoms; }
function sub(P, fn, x, z, ry = 0) { const Q = kit(); fn(Q); xf(Q.body, x, z, ry); xf(Q.win, x, z, ry); P.body.push(...Q.body); P.win.push(...Q.win); }
let LAST_DOOR = { x: 0, z: 0 };
function house(P, o) {
  const w = o.w, d = o.d, h = o.h, fl = o.fl || 1, wall = o.wall, roof = o.roof || '#5b6577', rt = o.rt || 'gable', fh = h / fl, base = .2, top = base + h, trim = o.trim || '#fbf8f0';
  LAST_DOOR = { x: o.aw ? w * .32 : 0, z: d / 2, w, d, top };
  box(P, w + .22, base, d + .22, 0, 0, 0, '#d3c8b0');
  box(P, w, h, d, 0, base, 0, wall);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(P, .1, h, .1, sx * w / 2, base, sz * d / 2, trim);
  box(P, w + .08, .1, d + .08, 0, top - .1, 0, trim);
  let rh = 0;
  if (rt === 'gable') { rh = d * .5; gable(P, w, d, rh, 0, top, 0, roof, wall, false); if (w > 1.9 && fl > 1) { box(P, .5, .42, .5, 0, top + rh * .22, d * .2, wall); box(P, .3, .26, .05, 0, top + rh * .22 + .08, d * .2 + .26, o.lit ? '#ffd27a' : '#9fd3ea', 'win'); cone(P, .45, .34, 4, 0, top + rh * .22 + .42, d * .2, roof, Math.PI / 4, 1.2, 1.2); } }
  else if (rt === 'front') { rh = w * .56; gable(P, w, d, rh, 0, top, 0, roof, wall, true); box(P, .34, .34, .05, 0, top + rh * .3, d / 2 + .01, trim); box(P, .24, .24, .06, 0, top + rh * .3 + .05, d / 2 + .02, o.lit ? '#ffd27a' : '#9fd3ea', 'win'); }
  else if (rt === 'hip') { rh = Math.min(w, d) * .42; cone(P, .7071, rh, 4, 0, top, 0, roof, Math.PI / 4, w + .42, d + .42); box(P, w + .44, .1, d + .44, 0, top - .03, 0, shade(roof, -.18)); }
  else { box(P, w + .18, .22, d + .18, 0, top, 0, o.trim || shade(wall, -.16)); rh = .22; }
  if (o.band) box(P, w + .03, .16, d + .03, 0, base + fh * .9, 0, o.band);
  const glass = o.lit ? '#ffd27a' : '#9fd3ea', n = Math.max(1, Math.round(w / .85)), door = o.door !== false, FC = ['#f29a3a', '#f7c6d6', '#ffffff', '#e86a6a', '#f5d33f'];
  for (let f = 0; f < fl; f++) {
    const wy = base + fh * f + fh * .36;
    for (let c = 0; c < n; c++) {
      const x = -w / 2 + (c + .5) * w / n;
      if (f === 0 && o.aw) continue;
      if (f === 0 && door && c === Math.floor(n / 2)) { LAST_DOOR = { x, z: d / 2 }; box(P, .48, Math.min(.78, fh * .86), .05, x, base, d / 2 + .005, trim); box(P, .36, Math.min(.68, fh * .78), .07, x, base, d / 2 + .01, o.dc || '#c0473a'); continue; }
      for (const zs of [1, -1]) { box(P, .42, .46, .05, x, wy - .05, zs * (d / 2 + .005), trim); box(P, .3, .34, .06, x, wy, zs * (d / 2 + .01), glass, 'win'); }
      if (f === 0 && (o.wb || (c + n) % 2 === 0)) { box(P, .44, .1, .14, x, wy - .16, d / 2 + .08, '#9a6a44'); for (let k = 0; k < 3; k++) box(P, .1, .1, .1, x - .13 + k * .13, wy - .07, d / 2 + .08, FC[(c + k) % FC.length]); }
    }
    const m = Math.max(1, Math.round(d / 1.1));
    for (let c = 0; c < m; c++) { const z = -d / 2 + (c + .5) * d / m; for (const xs of [1, -1]) { box(P, .05, .46, .42, xs * (w / 2 + .005), wy - .05, z, trim); box(P, .06, .34, .3, xs * (w / 2 + .01), wy, z, glass, 'win'); } }
  }
  if (o.aw) {
    box(P, w * .62, Math.min(.58, fh * .6), .05, -w * .12, base + .1, d / 2 + .005, trim); box(P, w * .56, Math.min(.5, fh * .55), .06, -w * .12, base + .14, d / 2 + .01, glass, 'win');
    box(P, .46, .76, .05, w * .32, base, d / 2 + .005, trim); box(P, .34, .68, .07, w * .32, base, d / 2 + .01, '#6b4a32');
    const ns = 6, ay = base + Math.min(fh * .78, .84);
    for (let k = 0; k < ns; k++) box(P, w * .96 / ns + .005, .07, .56, -w * .48 + (k + .5) * w * .96 / ns, ay, d / 2 + .24, k % 2 ? '#fbf8f0' : o.aw, 'body', .42);
    if (o.sign) { box(P, w * .74, .3, .07, 0, base + Math.min(fh, 1.02) + .03, d / 2 + .03, o.sign); box(P, w * .62, .08, .08, 0, base + Math.min(fh, 1.02) + .14, d / 2 + .035, shade(o.aw, -.1)); }
  }
  if (o.porch) {
    const pw = Math.min(w * .92, o.pw || w * .8), px = o.px || 0;
    box(P, pw, .14, .7, px, 0, d / 2 + .35, '#c9a77c'); box(P, .5, .07, .2, px, 0, d / 2 + .8, '#b8966b');
    for (let k = 0; k < 4; k++) cyl(P, .045, .045, .76, 6, px - pw / 2 + .07 + k * (pw - .14) / 3, .14, d / 2 + .63, trim);
    box(P, pw + .1, .1, .82, px, .9, d / 2 + .36, roof);
  }
  if (o.chim) { const cy0 = top + rh * .2, cz0 = rt === 'front' ? -d * .25 : -d * .12; box(P, .28, rh * .7 + .45, .28, w * .3, cy0, cz0, '#b8664a'); box(P, .36, .08, .36, w * .3, cy0 + rh * .7 + .45, cz0, '#8f4a34'); }
  return top + rh;
}
let CAR_N = 0;
function prof(pts, width, bev) { const sh = new THREE.Shape(); sh.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach(p => sh.lineTo(p[0], p[1])); const g = new THREE.ExtrudeGeometry(sh, { depth: width - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 2, curveSegments: 4 }); g.translate(0, 0, -(width - 2 * bev) / 2); return g; }
function car(P, x, z, ry, c, police, type) {
  type = type || (police ? 'sedan' : ['sedan', 'wagon', 'pickup', 'van', 'sedan', 'pickup'][CAR_N++ % 6]);
  sub(P, Q => {
    const W = .54, top = type === 'van' ? .34 : .32, glass = '#9fd3ea', cream = '#f4eedc', light = shade(c, .18);
    const push = (g, colr, kind) => (kind === 'win' ? Q.win : Q.body).push(col(g, colr));
    if (type === 'beetle') {
      const g = new THREE.SphereGeometry(.5, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2); g.scale(1.08, .78, .56); g.translate(0, .14, 0); push(g, c);
      const w = new THREE.SphereGeometry(.5, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2); w.scale(.62, .72, .5); w.translate(-.04, .17, 0); push(w, glass, 'win');
      const r = new THREE.SphereGeometry(.5, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2); r.scale(.5, .74, .52); r.translate(-.06, .18, 0); push(r, c);
      box(Q, 1.12, .07, .58, 0, .1, 0, '#e6e2d6');
    } else {
      push(prof([[-.55, .1], [.55, .1], [.57, .25], [.5, top], [-.52, top + .01], [-.57, .26]], W, .045), c);
      box(Q, 1.0, .05, W + .015, 0, .2, 0, type === 'wagon' ? '#a8774f' : cream);
      if (type === 'wagon') for (const sz of [1, -1]) box(Q, .62, .1, .02, -.16, .21, sz * (W / 2 + .012), '#a8774f');
      const cab = { sedan: [[-.34, top], [.22, top], [.09, .56], [-.26, .56]], wagon: [[-.52, top], [.22, top], [.09, .56], [-.5, .56]], pickup: [[-.08, top], [.24, top], [.13, .58], [-.08, .58]], van: [[-.55, top], [.5, top], [.42, .68], [-.55, .7]] }[type];
      push(prof(cab, W - .06, .03), glass, 'win');
      const ys = type === 'van' ? .68 : type === 'pickup' ? .58 : .56, xs = cab.map(p => p[0]), x0 = Math.min(...xs), x1 = Math.max(...xs);
      const rx0 = type === 'van' ? -.55 : x0 + .08, rx1 = type === 'van' ? .42 : x1 - .14;
      box(Q, rx1 - rx0 + .04, .05, W - .02, (rx0 + rx1) / 2, ys, 0, police ? '#f4f4f0' : type === 'van' ? cream : light);
      if (type === 'van') { box(Q, 1.06, .16, W - .03, -.04, top, 0, cream); for (const sz of [1, -1]) box(Q, .08, .2, .02, .12, top + .14, sz * (W / 2 - .02), cream); box(Q, .14, .14, .02, .56, .2, 0, '#e6e2d6'); }
      else for (const sz of [1, -1]) box(Q, .05, ys - top, .02, (x0 + x1) / 2 - .02, top, sz * (W / 2 - .02), c);
      if (type === 'pickup') { for (const sz of [1, -1]) box(Q, .5, .14, .04, -.33, top, sz * (W / 2 - .02), c); box(Q, .04, .14, W - .04, -.56, top, 0, c); box(Q, .3, .1, .26, -.32, top, .04, '#c9a77c'); }
      if (type === 'wagon') { for (const k of [-.3, -.1]) box(Q, .04, .04, W - .06, k, ys + .05, 0, '#3a3f45'); box(Q, .3, .08, .32, -.2, ys + .09, 0, '#3c6aa8'); }
      box(Q, .07, .06, W + .04, .57, .1, 0, '#cfcfcf'); box(Q, .07, .06, W + .04, -.57, .1, 0, '#cfcfcf');
      box(Q, .1, .04, .16, .38, top, 0, '#cfcfcf');
    }
    const front = type === 'beetle' ? .5 : .57;
    for (const sz of [1, -1]) { box(Q, .04, .07, .1, front, .18, sz * .17, '#fff6c8', 'win'); box(Q, .04, .06, .08, -front, .18, sz * .19, '#e0412f', 'win'); }
    for (const sx of [1, -1]) for (const sz of [1, -1]) { const t = new THREE.CylinderGeometry(.12, .12, .1, 14); t.rotateX(Math.PI / 2); t.translate(sx * .33, .12, sz * (W / 2 - .03)); push(t, '#2b2b30'); const hb = new THREE.CylinderGeometry(.055, .055, .02, 10); hb.rotateX(Math.PI / 2); hb.translate(sx * .33, .12, sz * (W / 2 + .025)); push(hb, '#e8e4da'); }
    if (police) { box(Q, .32, .07, .14, -.04, .61, 0, '#3a3f45'); box(Q, .13, .07, .14, -.12, .63, 0, '#e0412f', 'win'); box(Q, .13, .07, .14, .04, .63, 0, '#2f5fb3', 'win'); for (const sz of [1, -1]) box(Q, .34, .1, .02, .06, .18, sz * (W / 2 + .012), '#f4f4f0'); }
  }, x, z, ry);
}
function fence(P, x1, z1, x2, z2, c = '#fbf8ef') { const L = Math.hypot(x2 - x1, z2 - z1), a = Math.atan2(z2 - z1, x2 - x1), n = Math.max(1, Math.floor(L / .36)); for (let k = 0; k <= n; k++) { const t = k / n; box(P, .08, .36, .08, x1 + (x2 - x1) * t, 0, z1 + (z2 - z1) * t, c); } box(P, L, .06, .05, (x1 + x2) / 2, .24, (z1 + z2) / 2, c, 'body', 0, -a); box(P, L, .06, .05, (x1 + x2) / 2, .1, (z1 + z2) / 2, c, 'body', 0, -a); }
function flowers(P, x, z, w, d, R) { const cs = ['#e7a3b5', '#9fb3e0', '#f4f0f0', '#e3c35a', '#d75c5c']; for (let k = 0; k < w * d * 10; k++) box(P, .1, .1, .1, x + (R() - .5) * w, .02, z + (R() - .5) * d, cs[Math.floor(R() * cs.length)]); }
function flag(P, x, z, h = 2.4) { cyl(P, .03, .04, h, 5, x, 0, z, '#e6e3da'); box(P, .55, .34, .03, x + .29, h - .4, z, '#b8322c'); box(P, .22, .18, .035, x + .13, h - .24, z, '#24386b'); }

const SPEC = {
  'jessica-fletcher-house': { w: 2.2, d: 2.4, h: 1.7, fl: 2, wall: '#f8f5ec', roof: '#6f8394', rt: 'front', porch: true, pw: 2.4, shut: '#5d7186', chim: true, wing: { w: 1.8, d: 1.6, h: 1.5, fl: 2 } },
  'hill-house': { w: 3.6, d: 2.4, h: 1.9, fl: 2, wall: '#f2ead6', roof: '#56616d', rt: 'gable', chim: true, porch: true, pw: 2.6, wings: true },
  'sheriffs-office': { w: 2.8, d: 2, h: 1.3, wall: '#b9c6cc', roof: '#474c52', rt: 'hip', chim: true, police: true, flag: true },
  'cabot-cove-courthouse': { w: 3.2, d: 2.6, h: 2, fl: 2, wall: '#efe7d4', roof: '#56616d', rt: 'hip', portico: true },
  'cabot-cove-library': { w: 2.8, d: 2.2, h: 1.5, wall: '#a65a44', roof: '#56616d', rt: 'hip', portico: true },
  'historical-society': { w: 2.4, d: 2, h: 1.7, fl: 2, wall: '#e9d79c', roof: '#474c52', rt: 'gable', chim: true, shut: '#4f5f45', porch: true, pw: 1.2 },
  'cabot-cove-gazette': { w: 1.8, d: 1.8, h: 1.9, fl: 2, wall: '#e8e2d2', roof: '#6c665e', rt: 'flat', aw: '#2d3d5a', sign: '#f3ead6' },
  'lorettas-beauty-parlor': { w: 1.8, d: 1.7, h: 1.7, fl: 2, wall: '#f0dde0', roof: '#56616d', rt: 'gable', aw: '#a46aa3', sign: '#f3ead6' },
  'guillermos-beautique': { w: 1.7, d: 1.6, h: 1.1, wall: '#f3eadb', roof: '#857a6b', rt: 'flat', aw: '#d27d8c', sign: '#f3ead6' },
  'cabot-cove-booksellers': { w: 1.9, d: 1.7, h: 1.8, fl: 2, wall: '#c9b28a', roof: '#56616d', rt: 'gable', aw: '#3e6a4a', sign: '#f3ead6', lit: true },
  'eve-simpson-real-estate': { w: 1.8, d: 1.7, h: 1.6, fl: 2, wall: '#f4f0e4', roof: '#6f8394', rt: 'front', aw: '#24365a' },
  'cabot-cove-travel-agency': { w: 1.7, d: 1.6, h: 1.1, wall: '#d8e2e2', roof: '#56616d', rt: 'flat', aw: '#2f7a80', sign: '#f3ead6' },
  'bo-dixons-diner': { w: 3, d: 1.6, h: 1, wall: '#ece5d2', roof: '#8c8a84', rt: 'flat', band: '#b8402f', aw: '#b8402f', cars: 2 },
  'joshua-peabody-inn': { w: 4, d: 2.2, h: 1.7, fl: 2, wall: '#9d4a3a', roof: '#474c52', rt: 'gable', chim: true, shut: '#2b3a2f', porch: true, pw: 1.6, trim: '#efe6d3' },
  'dr-seth-hazlitt-practice': { w: 1.8, d: 1.8, h: 1.5, fl: 2, wall: '#c6cfb4', roof: '#474c52', rt: 'front', porch: true, pw: 1.6, shut: '#3f4f3d' },
  'cabot-cove-hospital': { w: 5, d: 2.6, h: 1.6, fl: 2, wall: '#dcc6a8', roof: '#8f8b82', rt: 'flat', canopy: true, cars: 3 },
  'cabot-cove-high-school': { w: 4.8, d: 2.4, h: 1.7, fl: 2, wall: '#a65a44', roof: '#56616d', rt: 'hip', cupola: true, flag: true },
  'cabot-cove-church': { w: 1.8, d: 3.2, h: 1.5, wall: '#f6f3ea', roof: '#56616d', rt: 'front', steeple: true, door: false },
  'cobbs-mortuary': { w: 2.4, d: 1.9, h: 1.7, fl: 2, wall: '#7f8a80', roof: '#3c4045', rt: 'hip', chim: true, porch: true, pw: 1.2 },
  'gallerie-frederich': { w: 2.1, d: 1.7, h: 1.8, fl: 2, wall: '#f6f3ea', roof: '#6f8394', rt: 'gable', aw: '#6f8394', sign: '#f3ead6', shut: '#3e5a7a' },
  'beverly-gareth-house': { w: 1.9, d: 1.6, h: 1.4, fl: 2, wall: '#e8e2d0', roof: '#6b5a4c', rt: 'gable', porch: true, pw: 1.7, shut: '#5a6f7d', chim: true },
  'ednas-house': { w: 1.5, d: 1.3, h: 1, wall: '#b9b3a3', roof: '#6d6459', rt: 'gable', chim: true },
  'lighthouse-motel': { w: 2.6, d: 1.2, h: .8, wall: '#e9e2cc', roof: '#5d6b74', rt: 'flat', aw: '#9c3d30', sign: '#f3ead6' },
  'borbey-house': { w: 2.2, d: 1.9, h: 1.6, fl: 2, wall: '#8d8a80', roof: '#3f3f46', rt: 'gable', porch: true, pw: 2, chim: true },
  'cabot-furniture-store': { w: 2, d: 1.5, h: 1.3, fl: 2, wall: '#a5543f', roof: '#5a514a', rt: 'flat', aw: '#37334a', sign: '#f3ead6' },
  'concert-stage': { w: 2, d: 1.4, h: .7, wall: '#c9b48a', roof: '#e9e2cc', rt: 'gable' },
  'deserted-coast-road': { w: .5, d: .5, h: .5, wall: '#d8cfb4', roof: '#6d6459', rt: 'gable' },
  'amos-tupper-house': { w: 1.8, d: 1.6, h: 1.1, wall: '#ecdcb4', roof: '#857a6b', rt: 'gable', chim: true, cars: 1 },
  'eve-simpson-home': { w: 1.9, d: 1.7, h: 1.4, fl: 2, wall: '#a9bac4', roof: '#56616d', rt: 'front', shut: '#f4f0e4', garden: true },
  'harbor-fish-market': { w: 2.2, d: 1.7, h: 1.1, wall: '#7f98a6', roof: '#857a6b', rt: 'gable', aw: '#f3ead6' },
  'bait-tackle-shop': { w: 1.4, d: 1.2, h: .95, wall: '#a3473a', roof: '#6c665e', rt: 'gable', aw: '#e8ddc4' },
  'harbor-chandlery': { w: 1.9, d: 1.6, h: 1.2, wall: '#4f6b5a', roof: '#3c4045', rt: 'gable', aw: '#c9a23a', sign: '#f3ead6' },
  'dockmasters-office': { w: .9, d: .8, h: .75, wall: '#f4f0e4', roof: '#9c3d30', rt: 'front' },
  'wharfside-cafe': { w: 1.6, d: 1.4, h: 1.05, wall: '#efe0b0', roof: '#857a6b', rt: 'gable', aw: '#2f7a80', tables: true },
  'town-post-office': { w: 2.4, d: 1.8, h: 1.25, wall: '#cdb08d', roof: '#7d766c', rt: 'flat', trim: '#efe6d3', flag: true },
  'general-store': { w: 2.6, d: 1.9, h: 1.4, wall: '#c9bfa8', roof: '#857a6b', rt: 'front', aw: '#9c3d30' },
  'hardware-store': { w: 1.9, d: 1.6, h: 1.25, wall: '#e3dccb', roof: '#56616d', rt: 'flat', aw: '#b8402f', sign: '#f3ead6' },
  'flower-shop': { w: 1.6, d: 1.4, h: 1.1, wall: '#f1e7d8', roof: '#6f8394', rt: 'gable', aw: '#6f8a52', garden: true },
  'local-bank': { w: 2.1, d: 1.8, h: 1.55, wall: '#b8644c', roof: '#6c665e', rt: 'flat', trim: '#efe6d3', portico: true, door: false },
  'town-hall': { w: 2.8, d: 2.4, h: 1.9, fl: 2, wall: '#f6f3ea', roof: '#56616d', rt: 'front', cupola: true, flag: true },
  'firehouse': { w: 2.4, d: 2, h: 1.5, fl: 2, wall: '#a8473a', roof: '#474c52', rt: 'front', door: false, bays: true, trim: '#efe6d3' },
  'secluded-coastal-cottage': { w: 1.5, d: 1.3, h: .95, wall: '#a39b8c', roof: '#5b5148', rt: 'gable', chim: true, dc: '#9c3d30' },
  'coastal-inn-bb': { w: 2, d: 1.8, h: 1.5, fl: 2, wall: '#e9d79c', roof: '#56616d', rt: 'front', porch: true, pw: 1.8, shut: '#4f6b5a' }
};
const SMALL = { 'cabot-cove-softball-field': 4.5, 'old-cemetery': 3, 'cotters-beach': 1, 'founders-day-green': 3, 'joshua-peabody-marker': .6, 'cabot-cove-entrance-sign': .8, 'cabot-point-lighthouse': 1.8, 'old-lighthouse-site': 1.4, 'boat-repair-yard': 2, 'lobster-coop': 1.8, 'marina-fuel-dock': .4, 'old-gas-station': 2, 'farmhouse-and-orchard': 3.2, 'woodland-overlook': .6, 'rocky-coast-trail': .5, 'village-gazebo': 1, 'coastal-boat-launch': 1, 'old-chapel-ruin': 1.2 };
const NOPUSH = new Set(['deserted-coast-road', 'boat-repair-yard', 'cabot-cove-softball-field', 'old-cemetery', 'cotters-beach', 'founders-day-green', 'cabot-point-lighthouse', 'old-lighthouse-site', 'marina-fuel-dock', 'woodland-overlook', 'rocky-coast-trail', 'coastal-boat-launch', 'lobster-coop', 'dockmasters-office']);

function hullGeo(L, B, h, y0, taper = .7) {
  const sh = new THREE.Shape(); sh.moveTo(-L / 2, -B * .42); sh.lineTo(L * .1, -B / 2); sh.quadraticCurveTo(L * .4, -B * .46, L / 2, 0); sh.quadraticCurveTo(L * .4, B * .46, L * .1, B / 2); sh.lineTo(-L / 2, B * .42); sh.quadraticCurveTo(-L / 2 - B * .1, 0, -L / 2, -B * .42);
  const g = new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: true, bevelThickness: .05, bevelSize: .05, bevelSegments: 2, curveSegments: 8 }); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const t = Math.max(0, Math.min(1, p.getY(i) / h)), f = taper + (1 - taper) * t; p.setX(i, p.getX(i) * (.9 + .1 * f)); p.setZ(i, p.getZ(i) * f); p.setY(i, p.getY(i) + y0 + (p.getX(i) > L * .25 ? (p.getX(i) - L * .25) * .12 * t : 0)); }
  g.computeVertexNormals(); return g;
}
function boatKit(t, c) {
  const Q = kit(), y0 = -1.0, L = t === 'dinghy' ? 1.2 : t === 'sail' ? 2.6 : 2.3, B = t === 'dinghy' ? .62 : t === 'sail' ? .9 : .95, h = t === 'dinghy' ? .32 : .5, top = y0 + h;
  const wake = new THREE.CylinderGeometry(1, 1, .02, 20); wake.scale(L * .62, 1, B * .95); wake.translate(-L * .08, -.69, 0); Q.wake.push(col(wake, '#e2fafa'));
  Q.body.push(col(hullGeo(L, B, h, y0), c));
  const rail = hullGeo(L * 1.015, B * 1.04, .07, top - .2, 1); Q.body.push(col(rail, t === 'lob' && c === '#f1ece0' ? '#c0473a' : '#ffffff'));
  if (t === 'dinghy') { Q.body.push(col(hullGeo(L * .82, B * .74, .05, top - .14, 1), '#c9a77c')); box(Q, .1, .06, B * .76, 0, top - .1, 0, '#a77d52'); box(Q, .9, .03, .07, .05, top - .02, B * .48, '#a77d52', 'body', 0, .18); box(Q, .9, .03, .07, .05, top - .02, -B * .48, '#a77d52', 'body', 0, -.18); return Q; }
  Q.body.push(col(hullGeo(L * .86, B * .78, .05, top + .02, 1), '#d8b98c'));
  if (t === 'lob') {
    box(Q, .74, .62, .66, .2, top, 0, '#fbf8f0'); box(Q, .76, .2, .68, .2, top + .3, 0, '#7fc8e6', 'win'); box(Q, .9, .08, .8, .22, top + .62, 0, c === '#f1ece0' ? '#c0473a' : c);
    cyl(Q, .025, .03, .8, 5, .15, top + .7, 0, '#e8e3d6'); box(Q, .3, .05, .08, .15, top + 1.32, 0, '#3a3f45');
    for (let k = 0; k < 3; k++) { box(Q, .32, .2, .28, -.62 - (k % 2) * .34, top + .05 + (k > 1 ? .2 : 0), (k % 2 ? .14 : -.14), '#e0a85a'); box(Q, .34, .03, .3, -.62 - (k % 2) * .34, top + .12 + (k > 1 ? .2 : 0), (k % 2 ? .14 : -.14), '#8a5a32'); }
    ['#f2a33a', '#e86a6a', '#f5d33f'].forEach((bc, i) => sph(Q, .07, -.1 + i * .2, top + .25, B * .36, bc, 1));
  } else {
    box(Q, .9, .26, .52, -.1, top, 0, '#fbf8f0'); box(Q, .7, .08, .53, -.1, top + .12, 0, '#7fc8e6', 'win');
    cyl(Q, .035, .04, 3.4, 6, .25, top, 0, '#f2efe6');
    { const g = new THREE.CylinderGeometry(.03, .03, 1.5, 5); g.rotateZ(Math.PI / 2); g.translate(-.5, top + .5, 0); Q.body.push(col(g, '#c9a77c')); }
    const sail = (pts, dx, colr, z0) => { const sh = new THREE.Shape(); sh.moveTo(pts[0][0], pts[0][1]); sh.quadraticCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1]); sh.lineTo(pts[3][0], pts[3][1]); sh.lineTo(pts[0][0], pts[0][1]); const g = new THREE.ExtrudeGeometry(sh, { depth: .03, bevelEnabled: false, curveSegments: 6 }); g.translate(dx, top, z0); Q.body.push(col(g, colr)); };
    sail([[.22, .55], [-.2, 1.9], [.22, 3.3], [.22, .55]], 0, '#ffffff', -.015);
    sail([[.22, .55], [-.05, 1.9], [.22, 3.3], [-1.2, .55]], 0, '#ffffff', -.015);
    sail([[.3, .5], [.5, 1.4], [.3, 2.7], [1.15, .45]], 0, '#f6e7c2', -.015);
    box(Q, 1.3, .14, .035, -.45, top + .58, 0, c === '#f4f0e6' ? '#3c7fc0' : c);
    box(Q, .3, .16, .02, .27, top + 3.4, 0, '#e0612f');
  }
  return Q;
}
function sheriff(P, R) {
  const WALL = '#f7f5ee', ROOF = '#8a7a68', TR = '#ffffff', GL = '#9fd3ea';
  sub(P, Q => {
    house(Q, { w: 2.5, d: 1.8, h: 1.1, wall: WALL, roof: ROOF, rt: 'gable', door: false, trim: TR, wb: false });
    box(Q, .52, .46, .5, -.35, 1.62, .4, WALL); box(Q, .3, .3, .05, -.35, 1.7, .66, '#5a3a2a'); box(Q, .22, .24, .06, -.35, 1.73, .67, GL, 'win'); gable(Q, .58, .62, .3, -.35, 2.08, .4, ROOF, WALL, true);
    box(Q, .86, .46, .05, .3, .5, .915, '#f3efe2'); box(Q, .92, .06, .06, .3, .96, .92, TR); { const g = new THREE.CylinderGeometry(.13, .13, .04, 14); g.rotateX(Math.PI / 2); g.translate(.3, .73, .95); Q.body.push(col(g, '#c9a23a')); }
    box(Q, .26, .7, .26, -.9, 1.5, -.2, '#9a4a38'); box(Q, .32, .07, .32, -.9, 2.2, -.2, '#7a3a2c');
    [[-.1, '#3f7a3a', .3], [.55, '#4c8a40', .26], [-.75, '#3f7a3a', .24], [.9, '#5a9a48', .2]].forEach(([x, c, r]) => { sph(Q, r, x, r * .8, 1.15, c, 1); sph(Q, r * .7, x + .18, r * .6, 1.25, shade(c, .1), 1); });
  }, -1.05, -.2);
  sub(P, Q => {
    house(Q, { w: 1.9, d: 2.6, h: 1.6, fl: 2, wall: WALL, roof: ROOF, rt: 'front', door: false, trim: TR, chim: true });
    const z = 1.3, px = 0;
    box(Q, 2.1, .16, .9, px, 0, z + .45, '#e9e4d6'); box(Q, .7, .08, .3, px, 0, z + 1.0, '#d9d2c2');
    [-.95, -.35, .35, .95].forEach(x => cyl(Q, .055, .06, .78, 8, x, .16, z + .82, TR));
    box(Q, 2.12, .08, .06, px, .9, z + .86, TR);
    cone(Q, .7071, .26, 4, px, .94, z + .45, ROOF, Math.PI / 4, 2.3, 1.0);
    gable(Q, .78, .55, .3, px, .94, z + .66, ROOF, TR, true);
    { const g = new THREE.CylinderGeometry(.08, .08, .03, 12); g.rotateX(Math.PI / 2); g.translate(px, 1.06, z + .95); Q.body.push(col(g, '#c9a23a')); }
    box(Q, .4, .66, .05, px, .16, z + .005, TR); box(Q, .3, .6, .06, px, .16, z + .01, '#4a3a2e');
    for (const x of [-.62, .62]) { box(Q, .36, .46, .05, x, .38, z + .005, TR); box(Q, .26, .36, .06, x, .43, z + .01, GL, 'win'); }
  }, 1.2, .3);
  P.door = { x: 1.2, z: .3 + 1.3 + 1.1 };
  box(P, 5.0, .03, .5, -.2, 0, 2.95, '#d9d2c2'); box(P, .5, .03, .7, -.6, 0, 2.4, '#d9d2c2');
  cyl(P, .035, .05, 3.3, 6, -.6, 0, 2.05, '#e6e3da'); sph(P, .06, -.6, 3.33, 2.05, '#c9a23a'); box(P, .7, .42, .03, -.24, 2.75, 2.05, '#b8322c'); for (let k = 0; k < 3; k++) box(P, .7, .06, .035, -.24, 2.8 + k * .12, 2.05, '#f4f1ea'); box(P, .28, .22, .04, -.43, 2.95, 2.05, '#24386b');
  sub(P, Q => { box(Q, .9, .7, .8, 0, 0, 0, '#eeebe2'); box(Q, 1.0, .07, .9, 0, .7, 0, '#d8d3c6'); box(Q, .5, .5, .05, 0, 0, .41, '#e2ddd0'); }, -3.1, -.9);
  sub(P, Q => { for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) cyl(Q, .045, .05, 2.4, 5, sx * .32, 0, sz * .32, '#5a4030'); box(Q, .8, .06, .8, 0, 2.4, 0, '#5a4030'); cyl(Q, .42, .42, .6, 12, 0, 2.46, 0, '#6b4a32'); for (let k = 0; k < 3; k++) cyl(Q, .43, .43, .03, 12, 0, 2.55 + k * .2, 0, '#3a2a22'); cone(Q, .46, .28, 12, 0, 3.06, 0, '#5a4a3e'); }, -2.0, -1.6);
  car(P, -3.05, 1.35, 0, '#f2f1ec', true); car(P, -3.05, 2.35, 0, '#6a6f78');
  return 3.3;
}
function buildPOI(P, id, R) {
  if (id === 'sheriffs-office') return sheriff(P, R);
  const s = SPEC[id];
  if (s) {
    let top = house(P, s); P.door = { ...LAST_DOOR }; if (s.steeple) P.door = { x: 0, z: s.d / 2 + .2 };
    if (s.wing) sub(P, Q => house(Q, { ...s, ...s.wing, rt: 'gable', porch: false, chim: false, wing: null }), s.w / 2 + s.wing.w / 2 - .05, -.3);
    if (s.wings) { [-1, 1].forEach(k => sub(P, Q => house(Q, { w: 1.5, d: 2.2, h: 1.7, fl: 2, wall: s.wall, roof: s.roof, rt: 'front', shut: s.shut }), k * (s.w / 2 + .7), .5)); }
    if (s.portico) { const pw = Math.min(1.8, s.w * .6); box(P, pw, .1, .7, 0, 0, s.d / 2 + .35, '#d7cfbd'); for (let k = 0; k < 4; k++) cyl(P, .07, .08, s.h * .85, 8, -pw / 2 + .12 + k * (pw - .24) / 3, .1, s.d / 2 + .58, '#fbf8f0'); gable(P, pw + .2, .8, .34, 0, .1 + s.h * .85, s.d / 2 + .38, '#f7f1e2', '#f7f1e2', false); box(P, .36, .7, .06, 0, .12, s.d / 2 + .01, '#5a4636'); }
    if (s.cupola) { box(P, .5, .55, .5, 0, top - .25, 0, '#f6f3ea'); cone(P, .45, .5, 4, 0, top + .3, 0, '#6a8a80', Math.PI / 4); }
    if (s.steeple) { box(P, .9, 2.6, .9, 0, .12, s.d / 2 - .3, '#f8f5ee'); box(P, .3, .5, .05, 0, 1.7, s.d / 2 + .16, '#3a3f45'); box(P, .5, .8, .06, 0, .12, s.d / 2 + .16, '#5a4636'); cone(P, .55, 2.2, 4, 0, 2.72, s.d / 2 - .3, '#5b6773', Math.PI / 4, 1.15, 1.15); }
    if (s.bays) { box(P, .8, .8, .05, -.55, .12, s.d / 2 + .01, '#e9e1cf'); box(P, .8, .8, .05, .55, .12, s.d / 2 + .01, '#e9e1cf'); }
    if (s.canopy) { box(P, 1.4, .08, .9, 0, .9, s.d / 2 + .45, '#f3efe6'); cyl(P, .04, .04, .9, 5, -.6, 0, s.d / 2 + .8, '#ddd'); cyl(P, .04, .04, .9, 5, .6, 0, s.d / 2 + .8, '#ddd'); }
    if (s.flag) flag(P, -s.w / 2 - .5, s.d / 2 + .4);
    if (s.police) car(P, s.w / 2 + .9, s.d / 2 + .3, Math.PI / 2, '#f2f1ec', true);
    if (s.cars) for (let k = 0; k < s.cars; k++) car(P, s.w / 2 + .9 + k * .7, .2, Math.PI / 2, CARS[(k * 3 + 1) % CARS.length]);
    if (s.garden) flowers(P, 0, s.d / 2 + .5, s.w, .4, R);
    if (s.tables) for (let k = 0; k < 2; k++) { cyl(P, .22, .22, .05, 8, -.5 + k, .4, s.d / 2 + .7, '#f3ead6'); cyl(P, .03, .03, .4, 4, -.5 + k, 0, s.d / 2 + .7, '#555'); }
    if (id === 'jessica-fletcher-house') { flowers(P, -.2, s.d / 2 + 1.05, 3.6, .3, R); fence(P, -1.9, s.d / 2 + 1.35, -.4, s.d / 2 + 1.35); fence(P, .4, s.d / 2 + 1.35, 3.1, s.d / 2 + 1.35); fence(P, 3.1, s.d / 2 + 1.35, 3.1, -1.4); for (let k = 0; k < 3; k++) cyl(P, .2, .22, .05, 8, (k % 2 ? .12 : -.08), 0, s.d / 2 + 1.7 + k * .42, '#e2dccd'); cyl(P, .04, .04, .7, 5, .9, 0, s.d / 2 + 1.6, '#6b4a32'); box(P, .3, .2, .18, .9, .7, s.d / 2 + 1.6, '#3c6aa8'); }
    if (id === 'historical-society') fence(P, -1.6, s.d / 2 + .9, 1.6, s.d / 2 + .9);
    if (id === 'joshua-peabody-inn') { cyl(P, .04, .04, 1.2, 5, s.w / 2 + .4, 0, s.d / 2 + .6, '#4a3a2c'); box(P, .6, .34, .05, s.w / 2 + .4, .8, s.d / 2 + .6, '#f3ead6'); car(P, s.w / 2 + 1.2, 0, Math.PI / 2, CARS[3]); }
    return s.steeple ? 5.1 : top;
  }
  switch (id) {
    case 'cabot-point-lighthouse':
      sub(P, Q => house(Q, { w: 1.5, d: 1.1, h: .8, wall: '#f6f3ea', roof: '#9c3d30', rt: 'gable' }), -1.5, .4);
      cyl(P, .42, .62, 4.2, 14, 0, 0, 0, '#f7f4ec'); cyl(P, .5, .53, .55, 14, 0, 2.4, 0, '#b8402f'); cyl(P, .66, .66, .1, 14, 0, 4.2, 0, '#2b2f35');
      cyl(P, .34, .34, .55, 10, 0, 4.3, 0, '#cfe3e6', 'win'); cone(P, .46, .5, 10, 0, 4.85, 0, '#2b2f35');
      return 5.4;
    case 'old-lighthouse-site':
      for (let k = 0; k < 11; k++) { const a = k / 11 * Math.PI * 2; if (k === 3 || k === 4) continue; box(P, .42, .2 + R() * .45, .3, Math.cos(a) * .7, 0, Math.sin(a) * .7, R() < .5 ? '#b8b1a2' : '#a19a8b', 'body', 0, -a); }
      for (let k = 0; k < 6; k++) box(P, .2, .15, .2, (R() - .5) * 2, 0, (R() - .5) * 2, '#9d978a');
      box(P, 1.1, .12, .2, .1, .05, .1, '#3a332b', 'body', 0, .6);
      return .9;
    case 'cabot-cove-softball-field':
      box(P, 1.2, .3, .3, 1.6, 0, 1.4, '#a68a62'); box(P, 1.2, .3, .3, -1.6, 0, 1.4, '#a68a62');
      for (let k = 0; k < 3; k++) box(P, 1.4, .12, .3, 2.6, k * .12, .4 - k * .2, '#c4b08d');
      box(P, 1.1, .5, .06, 0, 2.4, -3.2, '#2f4a3a'); cyl(P, .04, .04, 2.4, 4, -.4, 0, -3.2, '#666'); cyl(P, .04, .04, 2.4, 4, .4, 0, -3.2, '#666');
      return 2.9;
    case 'old-cemetery':
      for (let r = 0; r < 4; r++) for (let c = 0; c < 7; c++) { if (R() < .2) continue; const x = -2.4 + c * .8 + r * .1, z = -1.2 + r * .8; if (R() < .25) { box(P, .1, .55, .1, x, 0, z, '#c9c6bd'); box(P, .34, .1, .1, x, .36, z, '#c9c6bd'); } else box(P, .3, .36 + R() * .14, .1, x, 0, z, R() < .5 ? '#c9c6bd' : '#aaa69c'); }
      fence(P, -3, -1.8, 3, -1.8); fence(P, -3, 1.8, 3, 1.8); fence(P, -3, -1.8, -3, 1.8); fence(P, 3, -1.8, 3, 1.8);
      return .8;
    case 'cotters-beach':
      cyl(P, .03, .03, 1, 4, 0, 0, 0, '#5a4636'); cone(P, .7, .35, 8, 0, .85, 0, '#c8513f');
      box(P, .5, .04, 1, .7, 0, .2, '#f4f0e4'); box(P, 1.4, .14, .18, -1.2, 0, .6, '#9c8565', 'body', 0, .3);
      return 1.4;
    case 'founders-day-green': flag(P, 0, 0, 3); return 3;
    case 'joshua-peabody-marker': box(P, .6, .25, .6, 0, 0, 0, '#a8a397'); cone(P, .32, 2, 4, 0, .25, 0, '#c9c4b6', Math.PI / 4); return 2.4;
    case 'cabot-cove-entrance-sign': cyl(P, .04, .04, .9, 4, -.6, 0, 0, '#5a4636'); cyl(P, .04, .04, .9, 4, .6, 0, 0, '#5a4636'); box(P, 1.6, .55, .08, 0, .5, 0, '#1f3a4e'); box(P, 1.3, .1, .09, 0, .72, 0, '#f3ead6'); flowers(P, 0, .35, 1.6, .3, R); return 1.2;
    case 'boat-repair-yard':
      sub(P, Q => house(Q, { w: 2, d: 1.6, h: 1.2, wall: '#bdb4a2', roof: '#6c665e', rt: 'front', door: false }), -.8, 0);
      box(P, .9, .9, .06, -.8, .12, .81, '#4a4036');
      box(P, 2.6, .03, 2, 1.1, 0, 0, '#c7bda6');
      for (const [sx, sz] of [[.75, -.26], [.75, .26], [1.75, -.22], [1.75, .22]]) box(P, .08, .36, .08, sx, 0, sz, '#5a4636');
      box(P, 1.3, .06, .14, 1.25, .3, 0, '#6b4f38');
      { const add = (g, c) => { g.translate(1.3, 0, 0); P.body.push(col(g, c)); };
        add(hullGeo(1.9, .8, .42, .34), '#2f5a7a'); add(hullGeo(1.93, .83, .07, .62, 1), '#ffffff'); add(hullGeo(1.62, .62, .04, .78, 1), '#d8b98c'); }
      box(P, .55, .38, .5, 1.05, .8, 0, '#fbf8f0'); box(P, .57, .14, .52, 1.05, .96, 0, '#7fc8e6', 'win'); box(P, .66, .06, .6, 1.05, 1.18, 0, '#2f5a7a');
      { const L = 2, a = Math.atan2(.85, L), cx = 2.25 + Math.cos(a) * L / 2; for (const zz of [-.3, .3]) { const g = new THREE.BoxGeometry(L, .06, .1); g.rotateZ(-a); g.translate(cx, -.45, zz); P.body.push(col(g, '#6b4f38')); } }
      box(P, .5, .3, .07, -.05, 0, 1.1, '#a77d52'); box(P, .06, .3, .3, -.27, 0, 1.1, '#8a6a4a'); box(P, .06, .3, .3, .17, 0, 1.1, '#8a6a4a');
      cyl(P, .13, .13, .34, 8, 2.05, 0, .8, '#c0473a'); cyl(P, .13, .13, .34, 8, 2.05, 0, .5, '#3f6f8a');
      return 2;
    case 'lobster-coop':
      sub(P, Q => { for (let k = 0; k < 6; k++) cyl(Q, .07, .07, 1, 5, -1 + (k % 3), -1, k < 3 ? -.7 : .7, '#4a3f33'); house(Q, { w: 2.4, d: 1.6, h: 1, wall: '#a49a88', roof: '#5b5148', rt: 'gable', door: false }); box(Q, .7, .8, .06, 0, .12, .81, '#3d362f'); }, 0, 0);
      ['#c8392f', '#e3c35a', '#2f5fb3', '#f4f0e4', '#3e8a5a'].forEach((c, i) => sph(P, .09, -1 + i * .4, .7, .86, c));
      for (let k = 0; k < 4; k++) box(P, .5, .28, .36, 1.6, k * .28, .2 - (k % 2) * .1, '#7a6a4e');
      return 1.7;
    case 'marina-fuel-dock': box(P, .3, .6, .25, 0, 0, 0, '#c8392f'); box(P, .22, .16, .26, 0, .38, 0, '#f3ead6'); return .8;
    case 'old-gas-station':
      sub(P, Q => house(Q, { w: 1.5, d: 1.3, h: 1, wall: '#f4f0e4', roof: '#9c3d30', rt: 'flat', aw: '#9c3d30' }), -1.2, 0);
      box(P, 2, .12, 1.4, 1, 1.2, .3, '#9c3d30'); [[.2, -.2], [1.8, -.2], [.2, .8], [1.8, .8]].forEach(p => cyl(P, .04, .04, 1.2, 4, p[0], 0, p[1], '#ddd'));
      box(P, .22, .55, .22, .7, 0, .3, '#c8392f'); box(P, .22, .55, .22, 1.3, 0, .3, '#c8392f');
      cyl(P, .04, .04, 2.4, 4, 2.4, 0, 1.2, '#666'); box(P, .7, .5, .08, 2.4, 2.2, 1.2, '#f3ead6');
      return 2.7;
    case 'farmhouse-and-orchard': {
      sub(P, Q => { house(Q, { w: 2.4, d: 2.8, h: 1.6, wall: '#c8412f', roof: '#7d6a5c', rt: 'front', door: false, trim: '#ffffff' }); box(Q, 1.1, 1.1, .06, 0, .2, 1.41, '#f7f2e8'); box(Q, .9, .9, .07, 0, .3, 1.42, '#c8412f'); box(Q, 1.2, .07, .08, 0, .75, 1.46, '#f7f2e8', 'body', 0, 0); }, -1.8, 0);
      cyl(P, .7, .7, 3, 14, -1.6, 0, -2.6, '#d9562f'); cyl(P, .72, .72, .14, 14, -1.6, 1, -2.6, '#f7f2e8'); cyl(P, .72, .72, .14, 14, -1.6, 2.1, -2.6, '#f7f2e8');
      { const g = new THREE.SphereGeometry(.72, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2); g.translate(-1.6, 3, -2.6); P.body.push(col(g, '#eef0f2')); }
      sub(P, Q => house(Q, { w: 2, d: 1.6, h: 1.6, fl: 2, wall: '#f4f0e4', roof: '#5b6577', rt: 'gable', chim: true, porch: true, pw: 1.6 }), 1.6, -.9);
      box(P, 2.6, .06, 1.8, 1.5, 0, 2.3, '#9b6b45');
      for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) { const g = new THREE.IcosahedronGeometry(.18, 1); g.scale(1, .8, 1); g.translate(.5 + c * .5, .2, 1.75 + r * .55); P.body.push(col(g, '#f08a24')); }
      const bc = '#a8774f'; fence(P, .1, 1.3, 2.9, 1.3, bc); fence(P, .1, 3.3, 2.9, 3.3, bc); fence(P, .1, 1.3, .1, 3.3, bc); fence(P, 2.9, 1.3, 2.9, 3.3, bc);
      for (let k = 0; k < 3; k++) { const g = new THREE.CylinderGeometry(.32, .32, .6, 12); g.rotateZ(Math.PI / 2); g.translate(-3.4 + k * .75, .32, 2.2); P.body.push(col(g, '#e0c069')); }
      return 3.8;
    }
    case 'woodland-overlook': box(P, .9, .08, .3, 0, .35, 0, '#7a5a3a'); box(P, .06, .35, .25, -.38, 0, 0, '#5a4636'); box(P, .06, .35, .25, .38, 0, 0, '#5a4636'); fence(P, -1, .7, 1, .7); return .6;
    case 'rocky-coast-trail': cyl(P, .04, .04, 1, 4, 0, 0, 0, '#5a4636'); box(P, .5, .2, .04, .22, .75, 0, '#c8513f'); return 1.1;
    case 'village-gazebo':
      cyl(P, 1, 1, .16, 8, 0, 0, 0, '#e9e1cf'); for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + Math.PI / 8; cyl(P, .04, .04, .9, 4, Math.cos(a) * .88, .16, Math.sin(a) * .88, '#fbf8ef'); }
      cone(P, 1.2, .7, 8, 0, 1.06, 0, '#9c3d30', Math.PI / 8); sph(P, .08, 0, 1.8, 0, '#c7a34a');
      return 1.85;
    case 'coastal-boat-launch': box(P, 1, .06, 2.2, 0, -.2, .6, '#a9a497', 'body', -.2); car(P, -1.1, -.6, .3, CARS[1]); return .7;
    case 'old-chapel-ruin':
      box(P, .2, .7, 1.8, -.8, 0, 0, '#a49e90'); box(P, 1.2, .5, .2, -.2, 0, -.9, '#b0aa9c'); box(P, .2, .9, .9, .8, 0, .4, '#a49e90'); box(P, .5, 1.2, .2, .2, 0, .9, '#b8b2a4');
      return 1.3;
  }
  return house(P, { w: 1.8, d: 1.6, h: 1.2, wall: '#f4f0e4', roof: '#56616d', rt: 'gable' });
}

export async function createCabot3D({ container, labelsRoot, data, onSelect, onHover }) {
  const R = rng(1987);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;outline:none;touch-action:none';
  container.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 1, 1200);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = false; controls.maxPolarAngle = THREE.MathUtils.degToRad(80); controls.minDistance = 8; controls.screenSpacePanning = false; controls.rotateSpeed = .6; controls.zoomSpeed = .9;
  const onLandG = (x, y) => pip(x, y, LAND);
  const inSq = (x, y, m = 0) => x > X0 + m && x < X0 + W - m && y > Y0 + m && y < Y0 + W - m;
  const toW = (gx, gy) => [gx - CX, gy - CZ];

  // ---------- roads ----------
  const widthOf = r => r.mode === 'pedestrian' ? 0 : ({ 'two-lane': 1.8, 'village-commercial': 2.2, neighborhood: 1.4, local: 1.4, 'scenic-local': 1.3, 'narrow-local': 1.15 }[r.width] || 1.3);
  const roads = ((data.roadNetwork && data.roadNetwork.roads) || []).map(r => ({ id: r.id, pts: r.points.map(p => [p[0], p[1]]), w: widthOf(r) }));
  roads.forEach(r => { if (r.id === 'inland-approach') r.pts.unshift([-30, 45]); if (r.id === 'southern-approach') r.pts.unshift([-30, 63]); });
  EXTRA.forEach((p, i) => roads.push({ id: 'lane' + i, pts: p, w: 1.15 }));
  const segs = [];
  roads.forEach((r, ri) => { r.s = catmull(r.pts, .5, false); if (!r.w) return; for (let i = 0; i < r.s.length - 1; i++) segs.push([r.s[i][0], r.s[i][1], r.s[i + 1][0], r.s[i + 1][1], r.w / 2, ri, i]); });
  function roadNear(x, y) { let best = 1e9, bx = 0, by = 0, bs = null; for (const s of segs) { const dx = s[2] - s[0], dy = s[3] - s[1], L = dx * dx + dy * dy || 1; let t = ((x - s[0]) * dx + (y - s[1]) * dy) / L; t = t < 0 ? 0 : t > 1 ? 1 : t; const px = s[0] + dx * t, py = s[1] + dy * t, d = Math.hypot(x - px, y - py) - s[4]; if (d < best) { best = d; bx = px; by = py; bs = s; } } const tl = bs ? Math.hypot(bs[2] - bs[0], bs[3] - bs[1]) || 1 : 1; return { d: best, x: bx, y: by, ri: bs ? bs[5] : -1, si: bs ? bs[6] : 0, tx: bs ? (bs[2] - bs[0]) / tl : 1, ty: bs ? (bs[3] - bs[1]) / tl : 0 }; }

  // ---------- lots & placement ----------
  const lots = [], placed = [], drops = [];
  const addDrop = (cx, cy, rot, sc, hd) => { const cs = Math.cos(rot), sn = Math.sin(rot); drops.push([-1, 1].map(sx => { const lx = sx * (hd.w / 2 - .22), lz = hd.d / 2 + .03, [wx, wz] = toW(cx + lx * sc * cs + lz * sc * sn, cy - lx * sc * sn + lz * sc * cs); return [wx, (hd.top - .22) * sc, wz]; })); };
  const bboxOf = P => { const b = new THREE.Box3(); P.body.concat(P.win).forEach(g => { g.computeBoundingBox(); b.union(g.boundingBox); }); return { x0: b.min.x, x1: b.max.x, z0: b.min.z, z1: b.max.z }; };
  const scaleBB = (b, k) => ({ x0: b.x0 * k, x1: b.x1 * k, z0: b.z0 * k, z1: b.z1 * k });
  const polyAt = (x, y, rot, x0, x1, z0, z1) => { const c = Math.cos(rot), sn = Math.sin(rot); return [[x0, z0], [x1, z0], [x1, z1], [x0, z1]].map(([lx, lz]) => [x + lx * c + lz * sn, y - lx * sn + lz * c]); };
  function sat(A, B) { for (const P of [A, B]) for (let i = 0; i < 4; i++) { const p = P[i], q = P[(i + 1) % 4], ax = -(q[1] - p[1]), ay = q[0] - p[0]; let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9; for (const v of A) { const d = v[0] * ax + v[1] * ay; if (d < a0) a0 = d; if (d > a1) a1 = d; } for (const v of B) { const d = v[0] * ax + v[1] * ay; if (d < b0) b0 = d; if (d > b1) b1 = d; } if (a1 <= b0 || b1 <= a0) return false; } return true; }
  function fits(x, y, rot, bb, sb, gap) {
    const lot = polyAt(x, y, rot, bb.x0 - gap, bb.x1 + gap, bb.z0 - gap * .7, bb.z1 + sb);
    if (lots.some(L => sat(lot, L))) return null;
    const fp = polyAt(x, y, rot, bb.x0, bb.x1, bb.z0, bb.z1), pts = fp.concat(fp.map((p, i) => { const q = fp[(i + 1) % 4]; return [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]; }), [[x, y]]);
    for (const p of pts) if (!inSq(p[0], p[1], 1.8) || !onLandG(p[0], p[1]) || roadNear(p[0], p[1]).d < .3) return null;
    const ym = polyAt(x, y, rot, (bb.x0 + bb.x1) / 2, (bb.x0 + bb.x1) / 2, bb.z1 + sb * .5, bb.z1 + sb * .5)[0]; if (roadNear(ym[0], ym[1]).d < -.05) return null;
    return lot;
  }
  function idxAt(ri, si, dist) { const sp = roads[ri].s, dir = Math.sign(dist) || 1; let i = si, acc = 0; while (acc < Math.abs(dist)) { const j = i + dir; if (j < 0 || j >= sp.length) break; acc += Math.hypot(sp[j][0] - sp[i][0], sp[j][1] - sp[i][1]); i = j; } return i; }
  function frameAt(ri, si) { const sp = roads[ri].s, i = Math.max(0, Math.min(sp.length - 2, si)), a = sp[i], b = sp[i + 1], tl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return { x: a[0], y: a[1], tx: (b[0] - a[0]) / tl, ty: (b[1] - a[1]) / tl, hw: roads[ri].w / 2 }; }
  function frontPlace(f, side, bb, sb) { const nx = -f.ty * side, ny = f.tx * side, off = f.hw + sb + bb.z1; return { x: f.x + nx * off, y: f.y + ny * off, rot: Math.atan2(-nx, -ny) }; }
  const lotCircle = lot => { const cx = lot.reduce((a, p) => a + p[0], 0) / 4, cy = lot.reduce((a, p) => a + p[1], 0) / 4; placed.push([cx, cy, Math.hypot(lot[0][0] - lot[2][0], lot[0][1] - lot[2][1]) / 2 * .8]); };
  function walk(Q, door, zEnd) { if (!door) return; const len = zEnd - door.z; if (len <= .05) return; box(Q, .66, .05, len, door.x, 0, door.z + len / 2, '#c9ad7e'); for (let k = 0; k < Math.floor(len / .42); k++) box(Q, .5, .07, .34, door.x + (k % 2 ? .04 : -.04), 0, door.z + .22 + k * .42, '#eadcb8'); box(Q, .8, .06, .28, door.x, 0, door.z + .14, '#d8c39a'); }
  function sidewalk(Q, bbU, sbU, gapU) { const z0 = bbU.z1 - .45, z1 = bbU.z1 + sbU + .2, x0 = bbU.x0 - gapU, x1 = bbU.x1 + gapU; box(Q, x1 - x0, .05, z1 - z0, (x0 + x1) / 2, 0, (z0 + z1) / 2, '#e7dfcd'); }
  const PR = { A: 0, B: 1, C: 2 };
  const pois = data.locations.filter(l => !AREA.has(l.id)).map(l => { const P = kit(), h = buildPOI(P, l.id, R), hd = SPEC[l.id] ? { ...LAST_DOOR } : null, bbU = bboxOf(P); return { id: l.id, pr: PR[l.priority] ?? 2, x: l.mapPosition.x, y: l.mapPosition.y, P, h, hd, bbU, bb: scaleBB(bbU, K), shop: !!(SPEC[l.id] && SPEC[l.id].aw), rot: 0 }; });
  pois.slice().sort((a, b) => a.pr - b.pr).forEach(p => {
    const bb = p.bb, sb = p.shop ? .5 : SPEC[p.id] ? 1.1 : .6, n = roadNear(p.x, p.y);
    const samp = (x, y, rot) => { const out = []; for (let i = 0; i <= 4; i++) for (let j = 0; j <= 4; j++) out.push(polyAt(x, y, rot, bb.x0 + (bb.x1 - bb.x0) * i / 4, 0, bb.z0 + (bb.z1 - bb.z0) * j / 4, 0)[0]); return out; };
    const land = samp(p.x, p.y, p.rot).every(q => onLandG(q[0], q[1]));
    const clear = (x, y, rot) => { for (const q of samp(x, y, rot)) { if (!inSq(q[0], q[1], 1.6) || roadNear(q[0], q[1]).d < .4) return null; if (land && !onLandG(q[0], q[1])) return null; } const lot = polyAt(x, y, rot, bb.x0 - .3, bb.x1 + .3, bb.z0 - .3, bb.z1 + .3); return lots.some(L => sat(lot, L)) ? null : lot; };
    const keep = () => { let rot = (!NOPUSH.has(p.id) && n.d < 7) ? Math.atan2(n.x - p.x, n.y - p.y) : p.rot, x = p.x, y = p.y, lot = clear(x, y, rot);
      for (let r = .6; !lot && r < 18; r += .6) for (let k = 0; k < 20 && !lot; k++) { const a = k / 20 * Math.PI * 2, cx = p.x + Math.cos(a) * r, cy = p.y + Math.sin(a) * r, nn = roadNear(cx, cy), rr = NOPUSH.has(p.id) ? rot : Math.atan2(nn.x - cx, nn.y - cy), L2 = clear(cx, cy, rr); if (L2) { lot = L2; x = cx; y = cy; rot = rr; } }
      p.x = x; p.y = y; p.rot = rot; if (lot) { lots.push(lot); lotCircle(lot); return; } lot = polyAt(p.x, p.y, p.rot, bb.x0 - .4, bb.x1 + .4, bb.z0 - .4, bb.z1 + .4); lots.push(lot); lotCircle(lot); };
    if (NOPUSH.has(p.id) || n.d > 7 || n.ri < 0) return keep();
    const side0 = Math.sign((p.x - n.x) * -n.ty + (p.y - n.y) * n.tx) || 1; let best = null;
    search: for (let k = 0; k <= 14; k++) for (const dk of k ? [k, -k] : [0]) for (const side of [side0, -side0]) { const f = frameAt(n.ri, idxAt(n.ri, n.si, dk)), c = frontPlace(f, side, bb, sb), lot = fits(c.x, c.y, c.rot, bb, sb, .55); if (lot) { best = { ...c, lot }; break search; } }
    if (!best) return keep();
    p.x = best.x; p.y = best.y; p.rot = best.rot; lots.push(best.lot); lotCircle(best.lot);
    if (p.shop) sidewalk(p.P, p.bbU, sb / K, .55 / K); else walk(p.P, p.P.door, p.bbU.z1 + sb / K + .2);
  });

  // ---------- materials ----------
  const bodyMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .72, metalness: 0, flatShading: true });
  const winMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .3, metalness: .1, emissive: new THREE.Color('#ffc47a'), emissiveIntensity: 0 });
  const wakeMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .5, transparent: true, opacity: .4, depthWrite: false });
  const root = new THREE.Group(); scene.add(root);
  const anchors = {}, pickables = [];
  pois.forEach(p => {
    const P = p.P, [wx, wz] = toW(p.x, p.y);
    xf(P.body, wx, wz, p.rot, 0, K); xf(P.win, wx, wz, p.rot, 0, K);
    if (P.body.length) { const m = new THREE.Mesh(mergeGeometries(P.body), bodyMat); m.castShadow = m.receiveShadow = true; m.userData.poi = p.id; root.add(m); pickables.push(m); }
    if (P.win.length) { const m = new THREE.Mesh(mergeGeometries(P.win), winMat); m.userData.poi = p.id; root.add(m); pickables.push(m); }
    if (p.hd) addDrop(p.x, p.y, p.rot, K, p.hd);
    anchors[p.id] = { x: wx, z: wz, top: p.h * K + .3, r: Math.max(1.2, Math.hypot(p.bb.x1 - p.bb.x0, p.bb.z1 - p.bb.z0) / 2) };
  });
  data.locations.filter(l => AREA.has(l.id)).forEach(l => { const [wx, wz] = toW(l.mapPosition.x, l.mapPosition.y); anchors[l.id] = { x: wx, z: wz, top: .4, r: 3 }; });
  if (anchors['town-docks']) { anchors['town-docks'].x = toW(81, 49)[0]; anchors['town-docks'].z = toW(81, 49)[1]; }
  if (anchors['cabot-cove-harbor']) anchors['cabot-cove-harbor'].top = -.2;
  const P2 = (id) => pois.find(p => p.id === id);
  (() => { const ch = P2('cabot-cove-church'), cm = P2('old-cemetery'); if (!ch || !cm) return;
    const L2W = (p, lx, lz) => { const c = Math.cos(p.rot), s = Math.sin(p.rot), [wx, wz] = toW(p.x, p.y); return [wx + (lx * c + lz * s) * K, wz + (-lx * s + lz * c) * K]; };
    const sd = SPEC['cabot-cove-church'], a = L2W(ch, 0, sd.d / 2 + .45), [cx, cz] = toW(cm.x, cm.y), c = Math.cos(cm.rot), s = Math.sin(cm.rot), dx = a[0] - cx, dz = a[1] - cz;
    const lx = Math.max(-3, Math.min(3, (dx * c - dz * s) / K)), lz = Math.max(-1.8, Math.min(1.8, (dx * s + dz * c) / K)), b = L2W(cm, lx, lz);
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (len < .3 || len > 30) return; const ry = Math.atan2(b[0] - a[0], b[1] - a[1]), W = kit();
    box(W, .62, .03, len, (a[0] + b[0]) / 2, .01, (a[1] + b[1]) / 2, '#d8c9a4', 'body', 0, ry);
    const n = Math.floor(len / .5); for (let k = 0; k < n; k++) { const f = (k + .5) / n; box(W, .38, .04, .3, a[0] + (b[0] - a[0]) * f, .02, a[1] + (b[1] - a[1]) * f, '#b9b1a0', 'body', 0, ry + (R() - .5) * .3); }
    const m = new THREE.Mesh(mergeGeometries(W.body), bodyMat); m.receiveShadow = true; root.add(m); })();

  // ---------- generic town on lots ----------
  const G = kit(), freeAt = (x, y, r) => placed.every(q => Math.hypot(q[0] - x, q[1] - y) > q[2] + r);
  const bushes = [], springBeds = [];
  roads.forEach((r, ri) => {
    if (!r.w) return; const down = /main-street|lane2|lane3|lane7/.test(r.id), harbor = /harbor-road|lane4/.test(r.id);
    for (const side of [1, -1]) {
      let si = 1;
      while (si < r.s.length - 2) {
        const f0 = frameAt(ri, si); if (!inSq(f0.x, f0.y, 2)) { si = idxAt(ri, si, 1); continue; }
        const shop = down && f0.x > 42 && f0.x < 70 && f0.y > 40 && f0.y < 64;
        const w = 1.6 + R() * .6, d = shop ? 1.5 + R() * .3 : 1.4 + R() * .4, porch = !shop && !harbor && R() < .3, fenceOn = !shop && !harbor && !porch && R() < .4, carOn = !shop && R() < .2;
        const bbU = { x0: -(w / 2 + .22), x1: w / 2 + (carOn ? 1.25 : .22), z0: -(d / 2 + .25), z1: d / 2 + (shop ? .55 : porch ? .85 : fenceOn ? .62 : .25) }, bb = scaleBB(bbU, GS);
        const gap = shop ? .12 : .7 + R() * .6, sb = shop ? .5 : .9 + R() * .5, lotW = bb.x1 - bb.x0 + gap * 2;
        if (R() < (shop ? .06 : .22)) { si = idxAt(ri, si, lotW * .8); continue; }
        const f = frameAt(ri, idxAt(ri, si, lotW / 2)), c = frontPlace(f, side, { ...bb, x0: bb.x0, x1: bb.x1 }, sb);
        const lot = FIELDS.some(q => pip(c.x, c.y, q)) ? null : fits(c.x, c.y, c.rot, bb, sb, gap);
        if (!lot) { si = idxAt(ri, si, .8); continue; }
        lots.push(lot); lotCircle(lot); si = idxAt(ri, si, lotW);
        const Q = kit();
        if (shop) house(Q, { w, d, h: 1 + R() * .8, fl: R() < .55 ? 2 : 1, wall: SHOPW[Math.floor(R() * SHOPW.length)], roof: ROOFS[Math.floor(R() * 3)], rt: R() < .5 ? 'flat' : 'gable', aw: AWN[Math.floor(R() * AWN.length)] });
        else if (harbor) house(Q, { w, d, h: .85 + R() * .3, wall: ['#bdb4a2', '#a49a88', '#7f98a6', '#a3473a'][Math.floor(R() * 4)], roof: ['#6c665e', '#857a6b'][Math.floor(R() * 2)], rt: 'gable' });
        else { const fl = R() < .45 ? 2 : 1; house(Q, { w, d, h: fl === 2 ? 1.5 : 1, fl, wall: WALLS[Math.floor(R() * WALLS.length)], roof: ROOFS[Math.floor(R() * ROOFS.length)], rt: ['gable', 'front', 'gable', 'hip'][Math.floor(R() * 4)], chim: R() < .5, porch }); }
        const door = { ...LAST_DOOR }; addDrop(c.x, c.y, c.rot, GS, door);
        if (fenceOn) { const z = d / 2 + .55; fence(Q, -w / 2 - .2, z, door.x - .34, z); fence(Q, door.x + .34, z, w / 2 + .2, z); }
        if (!shop && !harbor && R() < .45) flowers(Q, door.x < 0 ? w * .22 : -w * .22, d / 2 + .3, w * .4, .2, R);
        if (!shop && !harbor) { const cs = Math.cos(c.rot), sn = Math.sin(c.rot), toG = (lx, lz) => [c.x + lx * GS * cs + lz * GS * sn, c.y - lx * GS * sn + lz * GS * cs];
          const beds = [[-w / 2 + .3, d / 2 + .22, w / 2 - .55, .14], [door.x + .5, d / 2 + .22, w / 2 - .55, .14]]; if (R() < .6) beds.push([-w / 2 - .2, 0, .14, d * .7]); if (R() < .6) beds.push([w / 2 + .2, 0, .14, d * .7]);
          beds.forEach(([bx, bz, bw, bd]) => { if (bw <= .05) return; const n = Math.max(6, Math.round((bw + bd) * 12)); for (let k = 0; k < n; k++) { const g = toG(bx + (bd > bw ? (R() - .5) * bw : R() * bw) - (bd > bw ? 0 : 0), bz + (R() - .5) * bd); springBeds.push([g[0], g[1], .17 + R() * .1, Math.floor(R() * 7)]); } }); }
        if (carOn) car(Q, w / 2 + .72, .1, Math.PI / 2, CARS[Math.floor(R() * CARS.length)]);
        if (shop) sidewalk(Q, bbU, sb / GS, gap / GS); else walk(Q, door, bbU.z1 + sb / GS + .2);
        const [wx, wz] = toW(c.x, c.y); xf(Q.body, wx, wz, c.rot, 0, GS); xf(Q.win, wx, wz, c.rot, 0, GS); G.body.push(...Q.body); G.win.push(...Q.win);
        if (!shop && R() < .7) { const cs = Math.cos(c.rot), sn = Math.sin(c.rot); for (const sx of [-1, 1]) { if (R() < .4) continue; const lx = sx * (w / 2 + .1) * GS, lz = (bbU.z1 + .25) * GS; bushes.push([c.x + lx * cs + lz * sn, c.y - lx * sn + lz * cs, .4 + R() * .25]); } }
      }
    }
  });
  // main street parked cars + lamps
  const ms = roads.find(r => r.id === 'main-street-route');
  if (ms) ms.s.forEach((p, i) => { if (i % 5 || p[0] < 44 || p[0] > 68 || R() < .35) return; const n = ms.s[Math.min(ms.s.length - 1, i + 1)], a = Math.atan2(n[1] - p[1], n[0] - p[0]), sd = R() < .5 ? 1 : -1, [wx, wz] = toW(p[0] - Math.sin(a) * sd * (ms.w / 2 - .3), p[1] + Math.cos(a) * sd * (ms.w / 2 - .3)); const Q = kit(); car(Q, 0, 0, 0, CARS[Math.floor(R() * CARS.length)]); xf(Q.body, wx, wz, -a); xf(Q.win, wx, wz, -a); G.body.push(...Q.body); G.win.push(...Q.win); });
  if (ms) ms.s.forEach((p, i) => { if (i % 9 || p[0] < 43 || p[0] > 69) return; const n = ms.s[Math.min(ms.s.length - 1, i + 1)], a = Math.atan2(n[1] - p[1], n[0] - p[0]); for (const sd of [1, -1]) { const gx = p[0] - Math.sin(a) * sd * (ms.w / 2 + .45), gy = p[1] + Math.cos(a) * sd * (ms.w / 2 + .45); if (!onLandG(gx, gy) || roadNear(gx, gy).d < .25 || !freeAt(gx, gy, .25)) continue; const [wx, wz] = toW(gx, gy); cyl(G, .06, .07, 1.7, 6, wx, 0, wz, '#2f3640'); cone(G, .2, .16, 6, wx, 1.86, wz, '#2f3640'); const g = new THREE.IcosahedronGeometry(.14, 1); g.translate(wx, 1.78, wz); G.win.push(col(g, '#ffe7a8')); } });
  // pier + boats
  const pier = (gx1, gy1, gx2, gy2, wd) => { const [x1, z1] = toW(gx1, gy1), [x2, z2] = toW(gx2, gy2), horiz = Math.abs(x2 - x1) > Math.abs(z2 - z1), L = horiz ? x2 - x1 : z2 - z1;
    box(G, horiz ? L : wd, .14, horiz ? wd : L, (x1 + x2) / 2, -.12, (z1 + z2) / 2, '#c9a77c');
    const nb = Math.floor(Math.abs(L) / .5); for (let k = 0; k < nb; k++) { const t = (k + .5) / nb; box(G, horiz ? .04 : wd + .02, .15, horiz ? wd + .02 : .04, x1 + (x2 - x1) * t, -.12, z1 + (z2 - z1) * t, '#b08f66'); }
    const n = Math.floor(Math.abs(L) / 1.4); for (let k = 0; k <= n; k++) { const t = k / n, x = x1 + (x2 - x1) * t, z = z1 + (z2 - z1) * t; for (const s of [-1, 1]) cyl(G, .08, .08, 3.1, 6, x + (horiz ? 0 : s * wd / 2), -3, z + (horiz ? s * wd / 2 : 0), '#6b5440'); } };
  pier(76.4, 48.6, 85, 49.4, 1); pier(79.5, 45.6, 79.5, 48.6, .6); pier(81.8, 45.2, 81.8, 48.6, .6); pier(83.8, 49.4, 83.8, 51.6, .6); pier(81.2, 49.4, 81.2, 51.2, .6); pier(84.2, 51.2, 86.6, 52.2, .9);
  const boatSpots = []; BOATS.forEach(([gx, gy, t, rot, c]) => { if (!inSq(gx, gy, 2) || boatSpots.some(q => Math.hypot(q[0] - gx, q[1] - gy) < 2.7)) return; boatSpots.push([gx, gy]); const [x, z] = toW(gx, gy), Q = boatKit(t, c), ry = THREE.MathUtils.degToRad(-rot); xf(Q.body, x, z, ry); xf(Q.win, x, z, ry); xf(Q.wake, x, z, ry); G.body.push(...Q.body); G.win.push(...Q.win); G.wake.push(...Q.wake); });
  // breakwater
  catmull([[84.2, 54.8], [87, 52.8], [89.4, 49.8], [90.6, 46.8]], .7, false).forEach(p => { const [x, z] = toW(p[0], p[1]); const g = new THREE.DodecahedronGeometry(.45 + R() * .3, 0); g.rotateY(R() * 6); g.translate(x + (R() - .5) * .4, -.55, z + (R() - .5) * .4); G.body.push(col(g, R() < .5 ? '#a39e92' : '#8a857b')); });
  if (G.body.length) { const m = new THREE.Mesh(mergeGeometries(G.body), bodyMat); m.castShadow = m.receiveShadow = true; root.add(m); }
  if (G.win.length) root.add(new THREE.Mesh(mergeGeometries(G.win), winMat));
  if (G.wake.length) { const m = new THREE.Mesh(mergeGeometries(G.wake), wakeMat); m.renderOrder = 4; root.add(m); }

  // ---------- trees ----------
  const leafy = [], pines = [], orchard = [];
  const treeOK = (x, y, r) => inSq(x, y, 1) && onLandG(x, y) && onLandG(x + 1, y + 1) && roadNear(x, y).d > .55 + r * .3 && freeAt(x, y, r * .35) && !pip(x, y, BEACH);
  FORESTS.forEach(f => { const xs = f.p.map(p => p[0]), ys = f.p.map(p => p[1]), sp = 2.7;
    for (let y = Math.max(Y0, Math.min(...ys)); y < Math.min(Y0 + W, Math.max(...ys)); y += sp) for (let x = Math.max(X0, Math.min(...xs)); x < Math.min(X0 + W, Math.max(...xs)); x += sp) {
      if (R() > f.d) continue; const jx = x + (R() - .5) * sp * .9, jy = y + (R() - .5) * sp * .9; if (!pip(jx, jy, f.p) || FIELDS.some(q => pip(jx, jy, q))) continue;
      const s = 2.5 + R() * 1.4; if (!treeOK(jx, jy, s)) continue; (R() < f.pine ? pines : leafy).push([jx, jy, s, R() * 6, Math.floor(R() * 6)]); } });
  for (let k = 0; k < 700; k++) { const x = 4 + R() * 66, y = 16 + R() * 66; if (FORESTS.some(f => pip(x, y, f.p)) || FIELDS.some(q => pip(x, y, q))) continue; const s = 2 + R() * 1; if (!treeOK(x, y, s * 1.2)) continue; if (leafy.concat(pines).some(t => Math.hypot(t[0] - x, t[1] - y) < 2.6)) continue; (R() < .15 ? pines : leafy).push([x, y, s, R() * 6, Math.floor(R() * 6)]); }
  const farm = P2('farmhouse-and-orchard'); if (farm) for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) orchard.push([farm.x + 7.2 + c * 1.9 + r * .4, farm.y + 1 + r * 1.9, 1.7, R() * 6, 0]);
  const leafGeo = mergeGeometries([col(new THREE.IcosahedronGeometry(.32, 0).translate(0, .66, 0), '#e6e6e6'), col(new THREE.IcosahedronGeometry(.27, 0).translate(.04, .94, -.02), '#ffffff'), col(new THREE.IcosahedronGeometry(.19, 0).translate(-.02, 1.16, .02), '#f2f2f2')]);
  const leafTrunk = col(new THREE.CylinderGeometry(.045, .07, .6, 6).translate(0, .3, 0), '#8a5a3a');
  const pineGeo = mergeGeometries([col(new THREE.ConeGeometry(.36, .4, 7).translate(0, .32, 0), '#d6d6d6'), col(new THREE.ConeGeometry(.3, .36, 7).translate(0, .52, 0), '#e6e6e6'), col(new THREE.ConeGeometry(.23, .32, 7).translate(0, .7, 0), '#f2f2f2'), col(new THREE.ConeGeometry(.15, .3, 7).translate(0, .87, 0), '#ffffff')]);
  const pineTrunk = col(new THREE.CylinderGeometry(.04, .06, .24, 5).translate(0, .12, 0), '#7a5034');
  const treeMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .85, flatShading: true });
  const M4 = new THREE.Matrix4(), Q4 = new THREE.Quaternion(), V3 = new THREE.Vector3(), S3 = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
  function inst(geo, list, cast = true) { const m = new THREE.InstancedMesh(geo, treeMat, list.length); list.forEach((t, i) => { const [x, z] = toW(t[0], t[1]); Q4.setFromAxisAngle(UP, t[3]); M4.compose(V3.set(x, 0, z), Q4, S3.set(t[2], t[2] * (.92 + (i % 5) * .04), t[2])); m.setMatrixAt(i, M4); m.setColorAt(i, C.set('#ffffff')); }); m.castShadow = cast; m.receiveShadow = true; root.add(m); return m; }
  const leafM = inst(leafGeo, leafy), leafT = inst(leafTrunk, leafy), pineM = inst(pineGeo, pines), pineT = inst(pineTrunk, pines), orchM = inst(leafGeo, orchard), orchT = inst(leafTrunk, orchard);
  const bushM = (() => { const g = col(new THREE.IcosahedronGeometry(.5, 1), '#ffffff'); const m = new THREE.InstancedMesh(g, treeMat, bushes.length); bushes.forEach((b, i) => { const [x, z] = toW(b[0], b[1]); M4.compose(V3.set(x, b[2] * .35, z), Q4.identity(), S3.set(b[2], b[2] * .75, b[2])); m.setMatrixAt(i, M4); m.setColorAt(i, C.set(i % 2 ? '#7cb342' : '#5f9a3a')); }); m.castShadow = true; root.add(m); return m; })();
  const springM = (() => { const FL = ['#ff5f8a', '#ffd23f', '#ffffff', '#b07cff', '#ff8a3d', '#ff4f4f', '#7ab8ff'], m = new THREE.InstancedMesh(col(new THREE.IcosahedronGeometry(1, 0), '#ffffff'), treeMat, springBeds.length * 2);
    springBeds.forEach((f, i) => { const [x, z] = toW(f[0], f[1]); M4.compose(V3.set(x, .1 + f[2] * 1.4, z), Q4.identity(), S3.set(f[2], f[2] * .85, f[2])); m.setMatrixAt(i * 2, M4); m.setColorAt(i * 2, C.set(FL[f[3]]));
      M4.compose(V3.set(x, .04, z), Q4.setFromAxisAngle(UP, i), S3.set(f[2] * 1.2, f[2] * .9, f[2] * 1.2)); m.setMatrixAt(i * 2 + 1, M4); m.setColorAt(i * 2 + 1, C.set(i % 2 ? '#4f9a3a' : '#5fae44')); });
    m.visible = false; m.castShadow = true; root.add(m); return m; })();
  // coastal rocks
  const coast = catmull(LAND, 1.1, true).filter(p => inSq(p[0], p[1], .8) && ((p[0] > 80 && p[1] > 60) || (p[1] < 35 && p[0] > 72) || p[0] > 90));
  const rockM = (() => { const g = col(new THREE.DodecahedronGeometry(.5, 0), '#ffffff'); const list = []; coast.forEach(p => { for (let k = 0; k < 2; k++) if (R() < .7) list.push([p[0] + (R() - .3) * 1.4, p[1] + (R() - .3) * 1.2, .35 + R() * .6]); }); const m = new THREE.InstancedMesh(g, treeMat, list.length); list.forEach((r, i) => { const [x, z] = toW(r[0], r[1]); Q4.setFromEuler(new THREE.Euler(R(), R() * 6, R())); M4.compose(V3.set(x, -.5 + r[2] * .2, z), Q4, S3.set(r[2] * 1.3, r[2], r[2] * 1.1)); m.setMatrixAt(i, M4); m.setColorAt(i, C.set(R() < .5 ? '#cfcac0' : '#b6b0a5')); }); m.castShadow = true; root.add(m); return m; })();

  // ---------- ground decor ----------
  const okGround = (x, y, rr) => inSq(x, y, 2.5) && onLandG(x, y) && roadNear(x, y).d > .35 && freeAt(x, y, rr) && !FORESTS.some(f => pip(x, y, f.p)) && !FIELDS.some(f => pip(x, y, f)) && !pip(x, y, BEACH);
  const FC = ['#ffffff', '#f7c6d6', '#f5d33f', '#f29a3a', '#9cc3ff', '#e86a6a', '#ffffff'];
  const flw = [], tuf = [], bld = [];
  for (let k = 0; k < 340; k++) { const x = X0 + 3 + R() * (W - 6), y = Y0 + 3 + R() * (W - 6); if (!okGround(x, y, .6)) continue; const c = FC[Math.floor(R() * FC.length)], n = 6 + Math.floor(R() * 10); for (let j = 0; j < n; j++) flw.push([x + (R() - .5) * 1.8, y + (R() - .5) * 1.1, .12 + R() * .07, c]); }
  for (let k = 0; k < 1600; k++) { const x = X0 + 2 + R() * (W - 4), y = Y0 + 2 + R() * (W - 4); if (!inSq(x, y, 2.5) || !onLandG(x, y) || roadNear(x, y).d < .3 || !freeAt(x, y, .3)) continue; tuf.push([x, y, .7 + R() * .6]); }
  for (let k = 0; k < 120; k++) { const x = X0 + 3 + R() * (W - 6), y = Y0 + 3 + R() * (W - 6); if (!inSq(x, y, 2.5) || !onLandG(x, y) || roadNear(x, y).d < 1.2 || !freeAt(x, y, 1.2)) continue; bld.push([x, y, .45 + R() * .85]); placed.push([x, y, 1]); }
  (() => { const g = col(new THREE.IcosahedronGeometry(1, 0), '#ffffff'); const m = new THREE.InstancedMesh(g, treeMat, flw.length); flw.forEach((f, i) => { const [x, z] = toW(f[0], f[1]); M4.compose(V3.set(x, f[2] * .9, z), Q4.identity(), S3.set(f[2], f[2], f[2])); m.setMatrixAt(i, M4); m.setColorAt(i, C.set(f[3])); }); root.add(m); })();
  (() => { const g = col(new THREE.ConeGeometry(.12, .42, 4).translate(0, .21, 0), '#ffffff'); const m = new THREE.InstancedMesh(g, treeMat, tuf.length); tuf.forEach((t, i) => { const [x, z] = toW(t[0], t[1]); Q4.setFromAxisAngle(UP, i); M4.compose(V3.set(x, 0, z), Q4, S3.set(t[2], t[2], t[2])); m.setMatrixAt(i, M4); m.setColorAt(i, C.set(i % 3 ? '#6aa73a' : '#5b9632')); }); root.add(m); })();
  (() => { const g = col(new THREE.IcosahedronGeometry(1, 1), '#ffffff'); const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .9 }); const m = new THREE.InstancedMesh(g, mat, bld.length); bld.forEach((b, i) => { const [x, z] = toW(b[0], b[1]); Q4.setFromAxisAngle(UP, i * 1.7); M4.compose(V3.set(x, b[2] * .25, z), Q4, S3.set(b[2] * 1.25, b[2] * .78, b[2])); m.setMatrixAt(i, M4); m.setColorAt(i, C.set(i % 2 ? '#d8d4ca' : '#c4bfb3')); }); m.castShadow = m.receiveShadow = true; root.add(m); })();
  // ---------- terrain slab ----------
  const S = 2048 / W, cv = document.createElement('canvas'); cv.width = cv.height = 2048; const g2 = cv.getContext('2d');
  const px = (gx, gy) => [(gx - X0) * S, (gy - Y0) * S];
  const path = (pts, closed) => { g2.beginPath(); pts.forEach((p, i) => { const q = px(p[0], p[1]); i ? g2.lineTo(q[0], q[1]) : g2.moveTo(q[0], q[1]); }); if (closed) g2.closePath(); };
  g2.fillStyle = '#8cc63f'; g2.fillRect(0, 0, 2048, 2048);
  g2.filter = 'blur(14px)'; for (let k = 0; k < 520; k++) { g2.globalAlpha = .32; g2.fillStyle = ['#84bf38', '#97cd4a', '#80b935', '#9fd250'][k % 4]; g2.beginPath(); g2.arc(R() * 2048, R() * 2048, 14 + R() * 60, 0, 7); g2.fill(); }
  g2.globalAlpha = .4; g2.fillStyle = '#76b236'; FORESTS.forEach(f => { path(catmull(f.p, 2, true), true); g2.fill(); });
  g2.filter = 'none'; g2.globalAlpha = 1;
  FIELDS.forEach((f, i) => { const pts = catmull(f, 1.5, true); path(pts, true); g2.fillStyle = i % 2 ? '#c49562' : '#b98a5a'; g2.fill(); g2.save(); g2.clip(); g2.strokeStyle = i % 2 ? '#e3c25a' : '#7fb23a'; g2.lineWidth = 9; for (let y = -200; y < 2248; y += 20) { g2.beginPath(); g2.moveTo(0, y); g2.lineTo(2048, y + 140); g2.stroke(); } g2.restore(); path(pts, true); g2.strokeStyle = '#6aa733'; g2.lineWidth = 14; g2.stroke(); });
  path(catmull(BEACH, .6, true), true); g2.fillStyle = '#ecd9a6'; g2.filter = 'blur(3px)'; g2.fill(); g2.filter = 'none';
  const ellipseAt = (id, dx, dy, rx, ry, fill, stroke) => { const p = P2(id); if (!p) return; const q = px(p.x + dx, p.y + dy); g2.beginPath(); g2.ellipse(q[0], q[1], rx * S, ry * S, 0, 0, 7); if (fill) { g2.fillStyle = fill; g2.fill(); } if (stroke) { g2.strokeStyle = stroke; g2.lineWidth = .5 * S; g2.stroke(); } };
  ellipseAt('founders-day-green', 0, 0, 4.2, 3, '#9fcb5f'); ellipseAt('old-cemetery', 0, 0, 3.6, 2.4, '#94bd5a');
  ellipseAt('cabot-cove-high-school', 0, 4.4, 4.2, 2.2, '#9fbf5e', '#c58f62');
  (() => { const p = P2('cabot-cove-softball-field'); if (!p) return; const q = px(p.x, p.y + 1.2); g2.save(); g2.translate(q[0], q[1]); g2.fillStyle = '#a5c86a'; g2.beginPath(); g2.moveTo(0, 0); g2.arc(0, 0, 5 * S, -Math.PI * .78, -Math.PI * .22); g2.closePath(); g2.fill(); g2.rotate(Math.PI / 4); g2.fillStyle = '#c99b6c'; g2.fillRect(-1.6 * S, -1.6 * S, 1.8 * S, 1.8 * S); g2.fillStyle = '#a5c86a'; g2.fillRect(-1.25 * S, -1.25 * S, 1.1 * S, 1.1 * S); g2.restore(); })();
  (() => { const p = P2('hill-house'); if (!p) return; const q = px(p.x, p.y + 2.6); g2.strokeStyle = '#d7b98c'; g2.lineWidth = .8 * S; g2.beginPath(); g2.ellipse(q[0], q[1], 2.2 * S, .9 * S, 0, 0, 7); g2.stroke(); })();
  roads.forEach(r => { if (!r.w) return; path(r.s, false); g2.lineCap = g2.lineJoin = 'round'; g2.strokeStyle = '#d6bf92'; g2.lineWidth = (r.w + .4) * S; g2.stroke(); });
  roads.forEach(r => { if (!r.w) return; path(r.s, false); g2.strokeStyle = r.w >= 1.8 ? '#f1e6cc' : '#efdcb4'; g2.lineWidth = r.w * S; g2.stroke(); if (r.w >= 1.8) { g2.setLineDash([.6 * S, .6 * S]); g2.strokeStyle = '#f0e5c9'; g2.lineWidth = .1 * S; g2.stroke(); g2.setLineDash([]); } });
  roads.forEach(r => { if (r.w) return; path(r.s, false); g2.setLineDash([.45 * S, .35 * S]); g2.strokeStyle = '#f4e6c4'; g2.lineWidth = .45 * S; g2.stroke(); g2.setLineDash([]); });
  for (let k = 0; k < 5000; k++) { const x = R() * 2048, y = R() * 2048; g2.fillStyle = R() < .5 ? 'rgba(70,110,40,.35)' : 'rgba(170,210,110,.4)'; g2.fillRect(x, y, 3, 3); }
  for (let k = 0; k < 300; k++) { const x = R() * 2048, y = R() * 2048; g2.fillStyle = ['#f6f1f1', '#f2d55c', '#e9a1b4', '#ffffff'][k % 4]; g2.beginPath(); g2.arc(x, y, 2.4, 0, 7); g2.fill(); }
  const landTex = new THREE.CanvasTexture(cv); landTex.colorSpace = THREE.SRGBColorSpace; landTex.anisotropy = 8; landTex.repeat.set(1 / W, 1 / W); landTex.offset.set(.5, .5);
  // slab
  function roundedSq(inset, rad) { const x0 = X0 + inset, y0 = Y0 + inset, x1 = X0 + W - inset, y1 = Y0 + W - inset, out = []; [[x1 - rad, y0 + rad, -Math.PI / 2], [x1 - rad, y1 - rad, 0], [x0 + rad, y1 - rad, Math.PI / 2], [x0 + rad, y0 + rad, Math.PI]].forEach(c => { for (let k = 0; k <= 8; k++) { const a = c[2] + k / 8 * Math.PI / 2; out.push([c[0] + Math.cos(a) * rad, c[1] + Math.sin(a) * rad]); } }); return out; }
  function clipConvex(poly, clip) { let ar = 0; for (let i = 0; i < clip.length; i++) { const a = clip[i], b = clip[(i + 1) % clip.length]; ar += a[0] * b[1] - b[0] * a[1]; } const sg = Math.sign(ar); let out = poly;
    for (let i = 0; i < clip.length; i++) { const a = clip[i], b = clip[(i + 1) % clip.length], ex = b[0] - a[0], ey = b[1] - a[1], ins = p => sg * (ex * (p[1] - a[1]) - ey * (p[0] - a[0])) >= 0;
      const inter = (p, q) => { const dx = q[0] - p[0], dy = q[1] - p[1], den = dx * ey - dy * ex, t = ((a[0] - p[0]) * ey - (a[1] - p[1]) * ex) / (den || 1e-9); return [p[0] + dx * t, p[1] + dy * t]; };
      const inp = out; out = []; for (let j = 0; j < inp.length; j++) { const cur = inp[j], prev = inp[(j + inp.length - 1) % inp.length]; if (ins(cur)) { if (!ins(prev)) out.push(inter(prev, cur)); out.push(cur); } else if (ins(prev)) out.push(inter(prev, cur)); } } return out; }
  const toShape = pts => new THREE.Shape(pts.map(p => new THREE.Vector2(p[0] - CX, -(p[1] - CZ))));
  const ext = (pts, depth, y0) => { const g = new THREE.ExtrudeGeometry(toShape(pts), { depth, bevelEnabled: false, curveSegments: 1 }); g.rotateX(-Math.PI / 2); g.translate(0, y0, 0); return g; };
  function bandTex(bands, depth, pebbles) { const c = document.createElement('canvas'); c.width = 256; c.height = 256; const x = c.getContext('2d'); let y = 0;
    bands.forEach(([f, hex, lines]) => { const hh = f * 256; x.fillStyle = hex; x.fillRect(0, y, 256, hh + 1); if (lines) { x.fillStyle = 'rgba(0,0,0,.07)'; for (let k = 1; k < 4; k++) x.fillRect(0, y + hh * k / 4, 256, 2); } y += hh; });
    if (pebbles) for (let k = 0; k < 30; k++) { x.fillStyle = 'rgba(90,45,25,.22)'; x.beginPath(); x.ellipse(R() * 256, pebbles * 256 + R() * 256 * (1 - pebbles), 2 + R() * 3, 1.4 + R() * 2, 0, 0, 7); x.fill(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.repeat.set(1 / 10, -1 / depth); t.offset.set(0, 1 / depth); return t; }
  const RSQ = roundedSq(0, 7), RSQI = roundedSq(.04, 6.96);
  const landPts = clipConvex(catmull(LAND, .8, true), RSQ);
  const landMat = new THREE.MeshStandardMaterial({ map: landTex, roughness: .95 });
  function earthTex(grass, depth, topC, botC, seed) { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), r2 = rng(seed), gy = grass * 256;
    const g = x.createLinearGradient(0, gy, 0, 256); g.addColorStop(0, topC); g.addColorStop(1, botC); x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    for (let k = 0; k < 4; k++) { const y = gy + 20 + r2() * (236 - gy); x.strokeStyle = k % 2 ? 'rgba(255,230,210,.07)' : 'rgba(40,20,15,.08)'; x.lineWidth = 3 + r2() * 5; x.beginPath(); x.moveTo(0, y); for (let px = 0; px <= 256; px += 32) x.lineTo(px, y + Math.sin(px / 40 + k) * 4); x.stroke(); }
    for (let k = 0; k < 160; k++) { x.fillStyle = r2() < .5 ? 'rgba(40,20,15,.18)' : 'rgba(255,225,200,.12)'; x.beginPath(); x.ellipse(r2() * 256, gy + 6 + r2() * (250 - gy), .8 + r2() * 1.2, 1.5 + r2() * 3, 0, 0, 7); x.fill(); }
    if (grass > 0) { x.fillStyle = '#7cbf3e'; x.fillRect(0, 0, 256, gy); x.fillStyle = '#5f9e33'; x.beginPath(); x.moveTo(0, gy - 4); for (let px = 0; px <= 256; px += 8) x.lineTo(px, gy - 4 + (px / 8 % 2 ? 7 + r2() * 6 : 0)); x.lineTo(256, gy - 6); x.lineTo(0, gy - 6); x.fill(); x.fillStyle = 'rgba(255,255,255,.12)'; x.fillRect(0, 0, 256, 5); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.repeat.set(1 / 10, -1 / depth); t.offset.set(0, 1 / depth); return t; }
  const landSide = new THREE.MeshStandardMaterial({ map: earthTex(.17, 3.2, '#946a55', '#7c5545', 3), roughness: 1 });
  const land = new THREE.Mesh(ext(landPts, 3.2, -3.2), [landMat, landSide]); land.receiveShadow = true; land.castShadow = true; root.add(land);
  const baseSide = new THREE.MeshStandardMaterial({ map: earthTex(0, 3.4, '#7c5545', '#5f4036', 5), roughness: 1 });
  const base = new THREE.Mesh(ext(RSQ, 3.4, -6.6), [new THREE.MeshStandardMaterial({ color: '#7c5545', roughness: 1 }), baseSide]); base.receiveShadow = true; base.castShadow = true; root.add(base);
  (() => { const cx0 = X0 + W / 2, cy0 = Y0 + W / 2, list = [];
    for (let i = 0; i < RSQ.length; i++) { const a = RSQ[i], b = RSQ[(i + 1) % RSQ.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < .01) continue; let nx = (b[1] - a[1]) / L, ny = -(b[0] - a[0]) / L; if (nx * (a[0] - cx0) + ny * (a[1] - cy0) < 0) { nx = -nx; ny = -ny; }
      const n = Math.max(1, Math.round(L / 2.1)); for (let k = 0; k < n; k++) { const f = (k + R()) / n, px2 = a[0] + (b[0] - a[0]) * f, py2 = a[1] + (b[1] - a[1]) * f;
        if (R() < .35) list.push([px2 - nx * .32, py2 - ny * .32, -6.1 + R() * 2.4, .28 + R() * .3]);
        if (onLandG(px2 - nx * 1, py2 - ny * 1) && R() < .35) list.push([px2 - nx * .3, py2 - ny * .3, -2.6 + R() * 1.4, .25 + R() * .28]); } }
    const g = col(new THREE.DodecahedronGeometry(1, 0), '#ffffff'), m = new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95, flatShading: true }), list.length);
    list.forEach((r, i) => { const [x, z] = toW(r[0], r[1]); Q4.setFromEuler(new THREE.Euler(R() * 3, R() * 3, R() * 3)); M4.compose(V3.set(x, r[2], z), Q4, S3.set(r[3] * 1.3, r[3] * .8, r[3])); m.setMatrixAt(i, M4); m.setColorAt(i, C.set(['#b98a5e', '#a8774f', '#c99a6a', '#9c6a48'][i % 4])); });
    m.castShadow = m.receiveShadow = true; root.add(m); })();
  const wc = document.createElement('canvas'); wc.width = wc.height = 1024; const w2 = wc.getContext('2d'), WS = 1024 / W;
  const wg = w2.createLinearGradient(0, 0, 1024, 0); wg.addColorStop(0, '#6fdbe6'); wg.addColorStop(1, '#3dbad6'); w2.fillStyle = wg; w2.fillRect(0, 0, 1024, 1024);
  const wpath = () => { w2.beginPath(); landPts.forEach((p, i) => { const x = (p[0] - X0) * WS, y = (p[1] - Y0) * WS; i ? w2.lineTo(x, y) : w2.moveTo(x, y); }); w2.closePath(); };
  w2.filter = 'blur(14px)'; wpath(); w2.strokeStyle = '#b9f3f0'; w2.lineWidth = 40; w2.stroke(); w2.filter = 'none';
  for (let k = 0; k < 140; k++) { const x = R() * 1024, y = R() * 1024; w2.strokeStyle = k % 3 ? 'rgba(28,120,160,.35)' : 'rgba(255,255,255,.55)'; w2.lineWidth = 2.4; w2.lineCap = 'round'; w2.beginPath(); w2.moveTo(x, y); w2.quadraticCurveTo(x + 5, y - 3, x + 10 + R() * 6, y); w2.stroke(); }
  const waterTex = new THREE.CanvasTexture(wc); waterTex.wrapS = waterTex.wrapT = THREE.ClampToEdgeWrapping; waterTex.colorSpace = THREE.SRGBColorSpace; waterTex.repeat.set(1 / W, 1 / W); waterTex.offset.set(.5, .5);
  const wTop = new THREE.MeshStandardMaterial({ map: waterTex, transparent: true, opacity: .92, roughness: .12, metalness: .05 }), wSide = new THREE.MeshStandardMaterial({ color: '#4cc3dc', transparent: true, opacity: .62, roughness: .15 });
  const water = new THREE.Mesh(ext(RSQI, 2.45, -3.15), [wTop, wSide]); water.receiveShadow = true; water.renderOrder = 2; root.add(water);
  (() => { const pts = catmull(LAND, .9, true).filter(p => inSq(p[0], p[1], 1.6)), list = [];
    for (let i = 0; i < pts.length - 1; i++) { const p = pts[i], q = pts[i + 1], tx = q[0] - p[0], ty = q[1] - p[1], tl = Math.hypot(tx, ty) || 1; let nx = -ty / tl, ny = tx / tl; if (onLandG(p[0] + nx * .6, p[1] + ny * .6)) { nx = -nx; ny = -ny; } list.push([(p[0] + q[0]) / 2 + nx * .3, (p[1] + q[1]) / 2 + ny * .3, Math.atan2(ty, tx)]); }
    const g = col(new THREE.BoxGeometry(1, .5, .62), '#ffffff'); const m = new THREE.InstancedMesh(g, treeMat, list.length);
    list.forEach((c, i) => { const [x, z] = toW(c[0], c[1]); Q4.setFromAxisAngle(UP, -c[2]); M4.compose(V3.set(x, -.48, z), Q4, S3.set(1, 1, 1)); m.setMatrixAt(i, M4); m.setColorAt(i, C.set(i % 2 ? '#f1e7d0' : '#e3d6ba')); }); m.receiveShadow = true; root.add(m); })();
  const movers = [];
  const rippleTex = (seed, colr) => { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), r2 = rng(seed); x.lineCap = 'round'; for (let k = 0; k < 22; k++) { const px0 = r2() * 256, py0 = r2() * 256, l = 10 + r2() * 14; x.strokeStyle = colr; x.lineWidth = 3; x.beginPath(); x.moveTo(px0, py0); x.quadraticCurveTo(px0 + l / 2, py0 - 5, px0 + l, py0); x.stroke(); } const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / 9, 1 / 9); return t; };
  const ripples = [[11, 'rgba(255,255,255,.9)', [.05, .02], .6], [23, 'rgba(30,120,160,.6)', [-.03, .042], .5]].map(([sd, colr, v, op]) => { const tx = rippleTex(sd, colr), g = new THREE.ShapeGeometry(toShape(RSQI)); g.rotateX(-Math.PI / 2); g.translate(0, -.66, 0);
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: tx, transparent: true, opacity: op, depthWrite: false, roughness: .3 })); m.renderOrder = 3; root.add(m); movers.push(t => { tx.offset.set(t * v[0] + .035 * Math.sin(t * .9 + sd), t * v[1] + .035 * Math.cos(t * .75 + sd)); m.material.opacity = op * (.6 + .4 * Math.sin(t * 2.1 + sd)); }); return m; });
  const meshOf = Q => { const g = new THREE.Group(); if (Q.body.length) { const m = new THREE.Mesh(mergeGeometries(Q.body), bodyMat); m.castShadow = true; g.add(m); } if (Q.win.length) g.add(new THREE.Mesh(mergeGeometries(Q.win), winMat)); if (Q.wake.length) { const m = new THREE.Mesh(mergeGeometries(Q.wake), wakeMat); m.renderOrder = 4; g.add(m); } root.add(g); return g; };
  (() => { // farm windmill, out in the field, spinning
    const farm = P2('farmhouse-and-orchard'); if (!farm) return;
    const cen = f => [f.reduce((a, p) => a + p[0], 0) / f.length, f.reduce((a, p) => a + p[1], 0) / f.length];
    const F = FIELDS.slice().sort((a, b) => { const ca = cen(a), cb = cen(b); return Math.hypot(ca[0] - farm.x, ca[1] - farm.y) - Math.hypot(cb[0] - farm.x, cb[1] - farm.y); })[0];
    let best = null; const xs = F.map(p => p[0]), ys = F.map(p => p[1]);
    for (let gx = Math.min(...xs); gx <= Math.max(...xs); gx += .5) for (let gy = Math.min(...ys); gy <= Math.max(...ys); gy += .5) {
      if (![[0, 0], [2, 0], [-2, 0], [0, 2], [0, -2]].every(([ox, oy]) => pip(gx + ox, gy + oy, F)) || !inSq(gx, gy, 4) || roadNear(gx, gy).d < 3) continue;
      if (!freeAt(gx, gy, 2) || orchard.some(o => Math.hypot(o[0] - gx, o[1] - gy) < 2.5)) continue;
      const fd = Math.hypot(gx - farm.x, gy - farm.y), c0 = cen(F), d = Math.abs(fd - 9) + Math.hypot(gx - c0[0], gy - c0[1]) * .3; if (fd < 7) continue; if (!best || d < best.d) best = { d, gx, gy }; }
    if (!best) return; const [wx, wz] = toW(best.gx, best.gy), Q = kit();
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const g = new THREE.BoxGeometry(.07, 3, .07); g.rotateZ(sx * .09); g.rotateX(-sz * .09); g.translate(sx * .16, 1.5, sz * .16); Q.body.push(col(g, '#a8774f')); }
    box(Q, .5, .08, .5, 0, 2.9, 0, '#a8774f'); box(Q, .14, .14, .5, 0, 3.12, .05, '#555'); box(Q, .04, .04, .9, 0, 3.17, -.6, '#a8774f'); box(Q, .03, .42, .55, 0, 2.98, -1.15, '#ecebe6');
    const tower = meshOf(Q); tower.position.set(wx, 0, wz); tower.rotation.y = -.7; tower.scale.setScalar(K);
    const Rk = kit(); for (let k = 0; k < 8; k++) { const g = new THREE.BoxGeometry(.12, .8, .03); g.translate(0, .45, 0); g.rotateZ(k * Math.PI / 4); Rk.body.push(col(g, '#ecebe6')); }
    { const g = new THREE.CylinderGeometry(.08, .08, .1, 8); g.rotateX(Math.PI / 2); Rk.body.push(col(g, '#555')); }
    const rotor = meshOf(Rk); tower.add(rotor); rotor.position.set(0, 3.19, .34);
    movers.push(t => { rotor.rotation.z = -(t * 2.4 + Math.sin(t * .35) * 1.6); }); })();
  (() => { // traffic
    const runOf = r => { let best = [0, -1], a = -1; r.s.forEach((p, i) => { const ok = inSq(p[0], p[1], 3) && onLandG(p[0], p[1]); if (ok && a < 0) a = i; if ((!ok || i === r.s.length - 1) && a >= 0) { const b = ok ? i : i - 1; if (b - a > best[1] - best[0]) best = [a, b]; a = -1; } }); return r.s.slice(best[0], best[1] + 1); };
    const cand = roads.filter(r => r.w && r.mode !== 'pedestrian').map(r => { const pts = runOf(r), cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return { r, pts, cum, L: cum[cum.length - 1] }; }).filter(c => c.L > 14).sort((a, b) => (/main-street/.test(b.r.id) - /main-street/.test(a.r.id)) || b.L - a.L).slice(0, 4);
    const plan = [[0, 0, 'sedan'], [0, .5, 'van'], [1, .2, 'pickup'], [2, .6, 'sedan'], [3, .1, 'wagon'], [1, .75, 'sedan']];
    plan.forEach(([ci2, ph, ty], i) => { const c = cand[ci2 % cand.length]; if (!c) return; const Q = kit(); car(Q, 0, 0, 0, CARS[(i * 3 + 1) % CARS.length], false, ty); const g = meshOf(Q), sp = 2.2 + (i % 3) * .5, off = Math.max(.32, c.r.w / 4);
      movers.push(t => { let d = (t * sp + ph * 2 * c.L) % (2 * c.L), dir = 1; if (d > c.L) { d = 2 * c.L - d; dir = -1; } let k = 1; while (k < c.cum.length - 1 && c.cum[k] < d) k++; const a = c.pts[k - 1], b = c.pts[k], f = (d - c.cum[k - 1]) / ((c.cum[k] - c.cum[k - 1]) || 1);
        const tx = (b[0] - a[0]) * dir, ty2 = (b[1] - a[1]) * dir, tl = Math.hypot(tx, ty2) || 1, ux = tx / tl, uy = ty2 / tl, gx = a[0] + (b[0] - a[0]) * f - uy * off, gy = a[1] + (b[1] - a[1]) * f + ux * off, [wx, wz] = toW(gx, gy);
        g.position.set(wx, 0, wz); g.rotation.y = Math.atan2(-uy, ux); }); });
  })();
  (() => { // sailing boats
    const ok = (cx, cy, rx, ry) => { for (let k = 0; k < 28; k++) { const a = k / 28 * Math.PI * 2; for (const m of [1, 1.35]) { const x = cx + Math.cos(a) * rx * m, y = cy + Math.sin(a) * ry * m; if (!inSq(x, y, 3) || onLandG(x, y) || (x > 74 && x < 93 && y > 43 && y < 57) || boatSpots.some(q => Math.hypot(q[0] - x, q[1] - y) < 2.8)) return false; } } return true; };
    const found = []; for (let cx = X0 + 8; cx < X0 + W - 8; cx += 2) for (let cy = Y0 + 8; cy < Y0 + W - 8; cy += 2) if (ok(cx, cy, 6, 3.5)) found.push([cx, cy]);
    found.sort((a, b) => Math.hypot(a[0] - 84, a[1] - 50) - Math.hypot(b[0] - 84, b[1] - 50));
    const pick = []; found.forEach(f => { if (pick.length < 3 &&  pick.every(q => Math.hypot(q[0] - f[0], q[1] - f[1]) > 16)) pick.push(f); });
    pick.forEach(([cx, cy], i) => { const Q = boatKit(i === 1 ? 'lob' : 'sail', ['#f4f0e6', '#b8402f', '#2f5a7a'][i]), g = meshOf(Q); g.rotation.order = 'YXZ'; const sp = (i % 2 ? -1 : 1) * (.1 + i * .02), ph = i * 2.1;
      movers.push(t => { const a = t * sp + ph, gx = cx + Math.cos(a) * 6, gy = cy + Math.sin(a) * 3.5, ux = -Math.sin(a) * 6 * Math.sign(sp), uy = Math.cos(a) * 3.5 * Math.sign(sp), [wx, wz] = toW(gx, gy);
        g.position.set(wx, .04 * Math.sin(t * 1.8 + i), wz); g.rotation.y = Math.atan2(-uy, ux); g.rotation.x = .05 * Math.sin(t * 1.4 + i); g.rotation.z = .03 * Math.sin(t * 1.1 + i * 2); }); });
  })();
  const runOf2 = r => { let best = [0, -1], a = -1; r.s.forEach((p, i) => { const ok = inSq(p[0], p[1], 3) && onLandG(p[0], p[1]); if (ok && a < 0) a = i; if ((!ok || i === r.s.length - 1) && a >= 0) { const b = ok ? i : i - 1; if (b - a > best[1] - best[0]) best = [a, b]; a = -1; } }); return r.s.slice(best[0], best[1] + 1); };
  (() => { // telephone poles + wires
    const P = kit(), wire = [], polesAll = [], polesW = [];
    roads.filter(r => r.w && r.mode !== 'pedestrian' && !/main-street/.test(r.id)).forEach(r => {
      const pts = runOf2(r); if (pts.length < 4) return; let acc = 0, prev = null;
      for (let i = 1; i < pts.length; i++) { acc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); if (acc < 4.6) continue; acc = 0;
        const a = pts[i - 1], b = pts[i], tl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, ux = (b[0] - a[0]) / tl, uy = (b[1] - a[1]) / tl, gx = b[0] - uy * (r.w / 2 + .22), gy = b[1] + ux * (r.w / 2 + .22);
        const ok = onLandG(gx, gy) && inSq(gx, gy, 2) && roadNear(gx, gy).d > .1 && polesAll.every(q => Math.hypot(q[0] - gx, q[1] - gy) > 2.2) && !FIELDS.some(f => pip(gx, gy, f));
        if (!ok) { prev = null; continue; }
        const [wx, wz] = toW(gx, gy), ang = Math.atan2(-uy, ux); polesAll.push([gx, gy]); polesW.push([wx, 2.24, wz]);
        cyl(P, .07, .09, 3.0, 6, wx, 0, wz, '#7a5236'); box(P, .1, .09, .9, wx, 2.62, wz, '#6b4a32', 'body', 0, ang); box(P, .08, .07, .56, wx, 2.3, wz, '#6b4a32', 'body', 0, ang);
        const att = [-.38, 0, .38].map(o => [wx + Math.sin(ang) * o, 2.78, wz + Math.cos(ang) * o]); att.forEach(q => cyl(P, .03, .035, .1, 5, q[0], 2.71, q[2], '#e8e4da'));
        cyl(P, .12, .12, .26, 8, wx + Math.cos(ang) * .14, 2.0, wz - Math.sin(ang) * .14, '#8a8f96');
        if (prev && Math.hypot(prev.x - wx, prev.z - wz) < 7.5) att.forEach((q, j) => { const p0 = prev.att[j]; for (let k = 0; k < 10; k++) { const f0 = k / 10, f1 = (k + 1) / 10, s0 = Math.sin(Math.PI * f0) * .32, s1 = Math.sin(Math.PI * f1) * .32; wire.push(p0[0] + (q[0] - p0[0]) * f0, p0[1] - s0, p0[2] + (q[2] - p0[2]) * f0, p0[0] + (q[0] - p0[0]) * f1, p0[1] - s1, p0[2] + (q[2] - p0[2]) * f1); } });
        prev = { x: wx, z: wz, att }; } });
    drops.forEach(cand => { let best = null; cand.forEach(h => polesW.forEach(p => { const dd = Math.hypot(p[0] - h[0], p[2] - h[2]); if (dd < 6.5 && (!best || dd < best.d)) best = { d: dd, h, p }; })); if (!best) return;
      const { h, p } = best, sag = .06 + best.d * .025; for (let k = 0; k < 10; k++) { const f0 = k / 10, f1 = (k + 1) / 10, s0 = Math.sin(Math.PI * f0) * sag, s1 = Math.sin(Math.PI * f1) * sag; wire.push(p[0] + (h[0] - p[0]) * f0, p[1] + (h[1] - p[1]) * f0 - s0, p[2] + (h[2] - p[2]) * f0, p[0] + (h[0] - p[0]) * f1, p[1] + (h[1] - p[1]) * f1 - s1, p[2] + (h[2] - p[2]) * f1); }
      cyl(P, .035, .035, .09, 5, h[0], h[1] - .05, h[2], '#3a3540'); });
    if (P.body.length) { const m = new THREE.Mesh(mergeGeometries(P.body), bodyMat); m.castShadow = true; root.add(m); }
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(wire, 3)); root.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: '#3a3540', transparent: true, opacity: .8 }))); })();
  (() => { // Jessica on her bicycle
    const hp = P2('jessica-fletcher-house'); if (!hp) return;
    const c = roads.filter(r => r.w && r.mode !== 'pedestrian').map(r => { const pts = runOf2(r), cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return { r, pts, cum, L: cum[cum.length - 1], dmin: Math.min(...pts.map(p => Math.hypot(p[0] - hp.x, p[1] - hp.y))) }; }).filter(c => c.L > 12).sort((a, b) => a.dmin - b.dmin)[0];
    if (!c) return;
    const g = new THREE.Group(), mk = (geo, colr) => { const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: colr, roughness: .7, flatShading: true })); m.castShadow = true; return m; }, V = (x, y, z = 0) => new THREE.Vector3(x, y, z), UPV = V(0, 1, 0);
    const setRod = (m, a, b) => { const d = new THREE.Vector3().subVectors(b, a), L = d.length() || 1e-4; m.position.copy(a); m.quaternion.setFromUnitVectors(UPV, d.divideScalar(L)); m.scale.set(1, L, 1); };
    const rod = (a, b, r, colr) => { const m = mk(new THREE.CylinderGeometry(r, r, 1, 6).translate(0, .5, 0), colr); setRod(m, a, b); g.add(m); return m; };
    const wheels = [-.28, .28].map(wx => { const w = new THREE.Group(); w.position.set(wx, .19, 0); w.add(mk(new THREE.TorusGeometry(.17, .03, 6, 18), '#2b2b30')); for (let k = 0; k < 3; k++) { const sp = mk(new THREE.BoxGeometry(.32, .012, .012), '#d8d8d8'); sp.rotation.z = k * Math.PI / 3; w.add(sp); } g.add(w); return w; });
    const BB = V(0, .2), seat = V(-.1, .5), head = V(.2, .5), rh = V(-.28, .19), fh = V(.28, .19), BLUE = '#3c7fc0';
    [[rh, seat], [seat, BB], [BB, head], [seat, head], [rh, BB], [head, fh]].forEach(([a, b]) => rod(a, b, .02, BLUE));
    rod(V(.2, .5), V(.18, .62), .016, '#cfcfcf'); rod(V(.18, .62, -.14), V(.18, .62, .14), .015, '#cfcfcf');
    { const sd = mk(new THREE.BoxGeometry(.13, .035, .08), '#5a3a2a'); sd.position.set(-.1, .525, 0); g.add(sd); const ring = mk(new THREE.TorusGeometry(.06, .012, 4, 12), '#9a9a9a'); ring.position.copy(BB); g.add(ring); }
    { const bk = mk(new THREE.BoxGeometry(.17, .11, .21), '#c8945a'); bk.position.set(.34, .53, 0); g.add(bk); ['#e86a6a', '#f5d33f', '#ffffff', '#f29a3a'].forEach((colr, i) => { const f = mk(new THREE.IcosahedronGeometry(.04, 0), colr); f.position.set(.31 + (i % 2) * .06, .61, -.06 + i * .04); g.add(f); }); }
    const hip = V(-.08, .6);
    { const sk = mk(new THREE.CylinderGeometry(.075, .14, .2, 8), '#3d4a6b'); sk.position.set(-.07, .58, 0); sk.rotation.z = -.2; g.add(sk);
      const to = mk(new THREE.CylinderGeometry(.075, .1, .3, 8).translate(0, .15, 0), '#c8553d'); to.position.copy(hip); to.rotation.z = -.35; g.add(to);
      const col2 = mk(new THREE.CylinderGeometry(.045, .055, .04, 8), '#f6f1da'); col2.position.set(.03, .89, 0); col2.rotation.z = -.35; g.add(col2);
      const hd = mk(new THREE.SphereGeometry(.085, 12, 9), '#f2c9a5'); hd.position.set(.075, .99, 0); g.add(hd);
      const hr = mk(new THREE.SphereGeometry(.096, 12, 9, 0, Math.PI * 2, 0, Math.PI * .55), '#d2a86e'); hr.position.set(.06, 1.0, 0); hr.rotation.z = .45; g.add(hr);
      const bn = mk(new THREE.SphereGeometry(.05, 8, 6), '#c69a5e'); bn.position.set(-.01, 1.02, 0); g.add(bn); }
    for (const z of [-.085, .085]) { rod(V(.03, .85, z), V(.18, .62, z * 1.55), .03, '#c8553d'); const hand = mk(new THREE.SphereGeometry(.03, 6, 5), '#f2c9a5'); hand.position.set(.18, .62, z * 1.55); g.add(hand); }
    const legs = [-1, 1].map(sd => ({ sd, th: rod(V(), V(0, 1), .036, '#3d4a6b'), sh: rod(V(), V(0, 1), .028, '#e9c9ad'), ft: (() => { const f = mk(new THREE.BoxGeometry(.09, .04, .05), '#3a2a22'); g.add(f); return f; })() }));
    const pose = dist => { wheels.forEach(w => w.rotation.z = -dist / .17); const th = -dist / .17 * .55;
      legs.forEach(l => { const a = th + (l.sd > 0 ? Math.PI : 0), z = l.sd * .07, F = V(BB.x + Math.cos(a) * .09, BB.y + Math.sin(a) * .09, z), H = V(hip.x, hip.y, z * .8), l1 = .24, l2 = .27;
        const dx = F.x - H.x, dy = F.y - H.y, d = Math.min(Math.hypot(dx, dy), l1 + l2 - .001), base = Math.atan2(dy, dx), off = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))));
        const K1 = V(H.x + Math.cos(base + off) * l1, H.y + Math.sin(base + off) * l1, z), K2 = V(H.x + Math.cos(base - off) * l1, H.y + Math.sin(base - off) * l1, z), Kn = K1.x > K2.x ? K1 : K2;
        setRod(l.th, H, Kn); setRod(l.sh, Kn, F); l.ft.position.copy(F); }); };
    g.scale.setScalar(1.4); root.add(g); const sp = 1.15, off = c.r.w / 2 - .22;
    movers.push(t => { const tot = t * sp; let d = tot % (2 * c.L), dir = 1; if (d > c.L) { d = 2 * c.L - d; dir = -1; } let k = 1; while (k < c.cum.length - 1 && c.cum[k] < d) k++; const a = c.pts[k - 1], b = c.pts[k], f = (d - c.cum[k - 1]) / ((c.cum[k] - c.cum[k - 1]) || 1);
      const tx = (b[0] - a[0]) * dir, ty = (b[1] - a[1]) * dir, tl = Math.hypot(tx, ty) || 1, ux = tx / tl, uy = ty / tl, [wx, wz] = toW(a[0] + (b[0] - a[0]) * f - uy * off, a[1] + (b[1] - a[1]) * f + ux * off);
      g.position.set(wx, 0, wz); g.rotation.y = Math.atan2(-uy, ux); pose(tot); });
    window.__jess = g;
  })();
  const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.ShadowMaterial({ opacity: .1 })); shadowPlane.rotation.x = -Math.PI / 2; shadowPlane.position.y = -6.62; shadowPlane.receiveShadow = true; scene.add(shadowPlane);

  // ---------- lights ----------
  const hemi = new THREE.HemisphereLight(0xffffff, 0xb6c48c, 1.3); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff3dd, 2.6); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -88, right: 88, top: 88, bottom: -88, near: 10, far: 400 }); sun.shadow.bias = -.0004; sun.shadow.normalBias = .04; sun.shadow.radius = 3;
  scene.add(sun); scene.add(sun.target);
  const moon = new THREE.DirectionalLight(0x8fa6d8, 0); moon.position.set(-60, 90, 40); scene.add(moon);
  const lh = anchors['cabot-point-lighthouse'];
  const beam = new THREE.Mesh(new THREE.ConeGeometry(2.4, 26, 20, 1, true).translate(0, -13, 0).rotateZ(Math.PI / 2), new THREE.MeshBasicMaterial({ alphaMap: (() => { const c = document.createElement('canvas'); c.width = 4; c.height = 256; const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, '#fff'); g.addColorStop(.25, '#999'); g.addColorStop(.6, '#2a2a2a'); g.addColorStop(1, '#000'); x.fillStyle = g; x.fillRect(0, 0, 4, 256); return new THREE.CanvasTexture(c); })(), color: 0xfff1b8, transparent: true, opacity: .0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  if (lh) { beam.position.set(lh.x, 4.55 * K, lh.z); root.add(beam); }
  const lampLight = new THREE.PointLight(0xffd27a, 0, 14, 1.6); if (lh) { lampLight.position.set(lh.x, 4.6 * K, lh.z); root.add(lampLight); }
  // death beams (murders layer)
  const deathG = new THREE.Group(); root.add(deathG);
  const beamGeo = new THREE.CylinderGeometry(.075, .075, 1, 6).translate(0, .5, 0), beadGeo = new THREE.SphereGeometry(.2, 12, 8);
  movers.push(t => deathG.children.forEach(g => { g.position.y = g.userData.y0 + Math.sin(t * 1.6 + g.userData.ph) * .12; }));
  // ghost lighthouse (history layer)
  const ghost = new THREE.Group(); const old = anchors['old-lighthouse-site'];
  if (old) { const gm = new THREE.MeshBasicMaterial({ color: 0xf6f0de, transparent: true, opacity: .42, depthWrite: false }); const t = new THREE.Mesh(new THREE.CylinderGeometry(.42, .62, 3.6, 10), gm); t.position.y = 1.8; const c2 = new THREE.Mesh(new THREE.ConeGeometry(.55, .7, 10), gm); c2.position.y = 3.95; const e = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(.42, .62, 3.6, 10)), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: .7 })); e.position.y = 1.8; const gr = new THREE.Mesh(new THREE.RingGeometry(1.05, 1.22, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .75, depthWrite: false })); gr.position.y = .06; ghost.add(t, c2, e, gr); ghost.position.set(old.x, 0, old.z); ghost.scale.setScalar(K); ghost.visible = true; root.add(ghost); }
  // selection rings + route
  const ringGeo = new THREE.RingGeometry(1, 1.22, 48).rotateX(-Math.PI / 2);
  const selRing = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .95, depthWrite: false })); selRing.visible = false; selRing.renderOrder = 5; root.add(selRing);
  const hlRings = []; const hlMat = new THREE.MeshBasicMaterial({ color: 0xf2a33a, transparent: true, opacity: .85, depthWrite: false });
  let routeMesh = null;
  const routeMat = new THREE.MeshBasicMaterial({ color: 0xe0612f });

  // ---------- season / sun ----------
  let season = 'summer';
  function paintTrees() { springM.visible = season === 'spring'; const pal = LEAF[season === 'fall' ? 'autumn' : season] || LEAF.summer, PN = season === 'winter' ? ['#2f5f48', '#3a6b52', '#dfe6ea', '#335f4a'] : PINE;
    leafy.forEach((t, i) => leafM.setColorAt(i, C.set(pal[t[4] % pal.length]))); pines.forEach((t, i) => pineM.setColorAt(i, C.set(PN[t[4] % PN.length])));
    orchard.forEach((t, i) => orchM.setColorAt(i, C.set(season === 'fall' ? '#c9a23a' : season === 'spring' ? '#f4c6d6' : season === 'winter' ? '#e2e8ec' : '#5f9a3a'))); [leafM, pineM, orchM].forEach(m => { if (m.instanceColor) m.instanceColor.needsUpdate = true; });
    landMat.color.set(season === 'fall' ? '#f4e6c2' : season === 'winter' ? '#dfe7ee' : season === 'spring' ? '#f2fbe8' : '#ffffff'); landMat.emissive.set(season === 'winter' ? '#dfe6ec' : '#000000'); landMat.emissiveIntensity = season === 'winter' ? .62 : 0; if (typeof bushM !== 'undefined' && bushM.instanceColor) { for (let i = 0; i < bushM.count; i++) bushM.setColorAt(i, C.set(season === 'winter' ? (i % 2 ? '#dfe6ea' : '#c9d3d8') : season === 'fall' ? (i % 2 ? '#c98a3a' : '#a8722e') : (i % 2 ? '#7cb342' : '#5f9a3a'))); bushM.instanceColor.needsUpdate = true; }
    scene.fog = null; }
  paintTrees();
  let night = false, sunAlt = 40;
  function setSun(alt, az) {
    sunAlt = alt; const a = THREE.MathUtils.degToRad(Math.max(alt, 4)), z = THREE.MathUtils.degToRad(az);
    sun.position.set(Math.sin(z) * Math.cos(a) * 160, Math.sin(a) * 160, -Math.cos(z) * Math.cos(a) * 160);
    const k = THREE.MathUtils.smoothstep(alt, -2, 22);
    sun.intensity = alt > -1 ? .3 + 2.2 * k : 0; sun.color.set('#ffb36b').lerp(new THREE.Color('#fff4e0'), k);
    night = alt < 0;
    const n = THREE.MathUtils.smoothstep(-alt, -1, 8);
    hemi.intensity = 1.3 - .6 * n; hemi.color.set('#ffffff').lerp(new THREE.Color('#7f93c4'), n); hemi.groundColor.set('#b6c48c').lerp(new THREE.Color('#3a4560'), n);
    moon.intensity = 1.1 * n; winMat.emissiveIntensity = 2.6 * THREE.MathUtils.smoothstep(-alt, -4, 4);
    const bn = THREE.MathUtils.smoothstep(-alt, -4, 9); beam.material.opacity = .3 * bn; beam.visible = bn > .002; lampLight.intensity = 30 * bn;
    renderer.toneMappingExposure = 1.1 - .08 * n;
    shadowPlane.material.opacity = .16 * (1 - n * .7);
  }
  setSun(40, 160);

  // ---------- camera ----------
  const insets = { left: 0, right: 0, top: 0, bottom: 0 };
  let vw = 1, vh = 1, defaultDist = 200;
  function fitDist() { const ew = Math.max(200, vw - insets.left - insets.right), eh = Math.max(160, vh - insets.top - insets.bottom), tv = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2); return Math.max(52 * vh / (tv * eh), 78 * vh / (tv * ew)) * 1.04; }
  function resize() { vw = container.clientWidth || 1; vh = container.clientHeight || 1; renderer.setSize(vw, vh, false); camera.aspect = vw / vh; camera.setViewOffset(vw, vh, -(insets.left - insets.right) / 2, -(insets.top - insets.bottom) / 2, vw, vh); camera.updateProjectionMatrix(); defaultDist = fitDist(); controls.maxDistance = defaultDist * 1.5; }
  const ro = new ResizeObserver(resize); ro.observe(container); resize();
  const sph3 = new THREE.Spherical();
  function placeCam(t, r, phi, theta) { controls.target.set(t[0], t[1], t[2]); sph3.set(r, phi, theta); camera.position.setFromSpherical(sph3).add(controls.target); camera.lookAt(controls.target); controls.update(); }
  const VIEWS = { model: { t: [3, -1, 2], phi: 54, theta: 28, f: 1 }, top: { t: [0, -1, 0], phi: .5, theta: 0, f: 1.02 }, street: { t: [toW(58, 51)[0], 0, toW(58, 51)[1]], phi: 70, theta: 18, f: .17 } };
  placeCam(VIEWS.model.t, defaultDist, THREE.MathUtils.degToRad(54), THREE.MathUtils.degToRad(28));
  let flight = null, lastInteract = performance.now(), orbit = true, curView = 'model';
  let userMoved = false;
  let dragging = false, lastPtr = 0;
  controls.addEventListener('start', () => { lastInteract = performance.now(); flight = null; userMoved = true; dragging = true; });
  controls.addEventListener('end', () => { lastInteract = performance.now(); dragging = false; });
  const releaseDrag = e => { if (dragging) renderer.domElement.dispatchEvent(new PointerEvent('pointerup', { pointerId: e.pointerId, pointerType: e.pointerType, clientX: e.clientX, clientY: e.clientY, bubbles: true })); };
  addEventListener('pointerup', releaseDrag); addEventListener('pointercancel', releaseDrag); renderer.domElement.addEventListener('lostpointercapture', releaseDrag);
  controls.enableZoom = false;
  const panBy = (dx, dz) => { const f = new THREE.Vector3().subVectors(controls.target, camera.position); f.y = 0; if (f.lengthSq() < 1e-6) f.set(0, 0, -1); f.normalize(); const r = new THREE.Vector3(-f.z, 0, f.x), d = camera.position.distanceTo(controls.target), mv = r.multiplyScalar(dx * d).add(f.multiplyScalar(dz * d)), nt = controls.target.clone().add(mv); nt.x = THREE.MathUtils.clamp(nt.x, -50, 50); nt.z = THREE.MathUtils.clamp(nt.z, -50, 50); const real = nt.sub(controls.target); camera.position.add(real); controls.target.add(real); flight = null; userMoved = true; lastInteract = performance.now(); };
  const zoomBy = k => { const off = camera.position.clone().sub(controls.target), len = THREE.MathUtils.clamp(off.length() * k, controls.minDistance, controls.maxDistance || 800); camera.position.copy(controls.target).add(off.setLength(len)); flight = null; userMoved = true; lastInteract = performance.now(); };
  const onWheel = e => { e.preventDefault(); if (performance.now() - lastPtr < 500 || (Math.abs(e.deltaX) < 3 && Math.abs(e.deltaY) < 3 && !e.ctrlKey)) return; const mouse = e.deltaMode === 1 || (e.deltaX === 0 && Math.abs(e.deltaY) >= 50 && Number.isInteger(e.deltaY) && e.deltaY % 10 === 0);
    if (e.ctrlKey || e.metaKey) zoomBy(Math.exp(e.deltaY * .01)); else if (mouse) zoomBy(Math.exp(Math.sign(e.deltaY) * .12)); else panBy(e.deltaX * .0004, -e.deltaY * .0004); };
  renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
  const held = new Set(), KEYS = { ArrowLeft: 1, ArrowRight: 1, ArrowUp: 1, ArrowDown: 1, KeyA: 1, KeyD: 1, KeyW: 1, KeyS: 1, Equal: 1, Minus: 1, NumpadAdd: 1, NumpadSubtract: 1 };
  let fast = false;
  let lastKd = 0;
  const kd = e => { fast = e.shiftKey; lastKd = performance.now(); const t = e.target, tag = (t && t.tagName) || ''; if (tag === 'INPUT' || tag === 'TEXTAREA' || (t && t.getAttribute && t.getAttribute('role') === 'slider') || e.metaKey || e.ctrlKey || e.altKey || !KEYS[e.code]) return; e.preventDefault(); if (!held.size) keyT0 = performance.now(); held.add(e.code); };
  const ku = e => { fast = e.shiftKey; held.delete(e.code); }, kb = () => { fast = false; held.clear(); };
  addEventListener('keydown', kd); addEventListener('keyup', ku); addEventListener('blur', kb);
  let lastKeyT = 0, keyT0 = 0;
  const keyStep = now => { const dt = Math.min(.05, (now - (lastKeyT || now)) / 1000); lastKeyT = now; if (!held.size) return; if (now - lastKd > 900) { held.clear(); return; } let dx = 0, dz = 0, z = 0;
    if (held.has('ArrowLeft') || held.has('KeyA')) dx -= 1; if (held.has('ArrowRight') || held.has('KeyD')) dx += 1; if (held.has('ArrowUp') || held.has('KeyW')) dz += 1; if (held.has('ArrowDown') || held.has('KeyS')) dz -= 1;
    if (held.has('Equal') || held.has('NumpadAdd')) z -= 1; if (held.has('Minus') || held.has('NumpadSubtract')) z += 1;
    const ease = Math.min(1, .25 + (now - keyT0) / 200); const sp = fast ? 3 : 1; if (dx || dz) panBy(dx * .12 * ease * dt * sp, dz * .12 * ease * dt * sp); if (z) zoomBy(Math.exp(z * 1.4 * dt)); };
  function flyRaw(t, r, phi, theta, dur = 1100) {
    const cur = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    let dt = theta - cur.theta; while (dt > Math.PI) dt -= Math.PI * 2; while (dt < -Math.PI) dt += Math.PI * 2;
    flight = { t0: performance.now(), dur, a: { t: controls.target.clone(), r: cur.radius, phi: cur.phi, theta: cur.theta }, b: { t: new THREE.Vector3(...t), r, phi, theta: cur.theta + dt } };
  }
  function setView(v) { curView = v; const V = VIEWS[v]; defaultDist = fitDist(); flyRaw(V.t, defaultDist * V.f, THREE.MathUtils.degToRad(V.phi), THREE.MathUtils.degToRad(V.theta)); }
  function curSph() { return new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target)); }
  function flyTo(id) { userMoved = true; const a = anchors[id]; if (!a) return; const s = curSph(), area = a.r >= 3 && !SPEC[id]; const r = Math.min(s.radius, defaultDist * (area ? .36 : .24)); const phi = curView === 'top' ? .3 : Math.min(Math.max(s.phi, THREE.MathUtils.degToRad(46)), THREE.MathUtils.degToRad(66)); flyRaw([a.x, 0, a.z], r, phi, s.theta, 1000); }
  function fitTo(ids) { userMoved = true; const pts = ids.map(i => anchors[i]).filter(Boolean); if (!pts.length) return; let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; pts.forEach(a => { x0 = Math.min(x0, a.x); x1 = Math.max(x1, a.x); z0 = Math.min(z0, a.z); z1 = Math.max(z1, a.z); }); const span = Math.max(x1 - x0, z1 - z0) + 14, s = curSph(); flyRaw([(x0 + x1) / 2, 0, (z0 + z1) / 2], Math.max(defaultDist * .22, Math.min(defaultDist, defaultDist * span / 120)), curView === 'top' ? .3 : THREE.MathUtils.degToRad(52), s.theta, 1100); }

  // ---------- picking ----------
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let down = null, hoverId = null;
  function pick(e) { const r = renderer.domElement.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(ndc, camera); const hit = ray.intersectObjects(pickables, false)[0]; return hit ? hit.object.userData.poi : null; }
  const onDown = e => { lastPtr = performance.now(); held.clear(); flight = null; down = { x: e.clientX, y: e.clientY }; };
  const onUp = e => { lastPtr = performance.now(); if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 5) { const id = pick(e); if (id && onSelect) onSelect(id); } down = null; };
  let mvT = 0; const onMove = e => { if (e.buttons) return; if (dragging) releaseDrag(e); const now = performance.now(); if (now - mvT < 70) return; mvT = now; const id = pick(e); renderer.domElement.style.cursor = id ? 'pointer' : 'grab'; if (id !== hoverId) { hoverId = id; onHover && onHover(id); } };
  renderer.domElement.addEventListener('pointerdown', onDown); renderer.domElement.addEventListener('pointerup', onUp); renderer.domElement.addEventListener('pointermove', onMove);
  renderer.domElement.style.cursor = 'grab';

  // ---------- labels ----------
  let lblEls = [], uiRects = [], uiT = 0; const V = new THREE.Vector3();
  function refreshLabels() { lblEls = labelsRoot ? Array.from(labelsRoot.querySelectorAll('[data-lbl]')) : []; lblEls.forEach(el => { el._stem = undefined; el._b = el.querySelector('[data-lbl-btn]'); el._w = el._b ? el._b.offsetWidth : 16; el._h = el._b ? el._b.offsetHeight : 16; }); }
  function layoutLabels(now) {
    if (now - uiT > 400) { uiT = now; uiRects = Array.from(document.querySelectorAll('[data-ui-block]')).map(el => el.getBoundingClientRect()).filter(r => r.width).map(r => [r.left - 8, r.top - 8, r.right + 8, r.bottom + 8]); }
    if (!lblEls.length) return; const cr = container.getBoundingClientRect(), ratio = defaultDist / camera.position.distanceTo(controls.target);
    const items = lblEls.map(el => { const id = el.dataset.lbl, a = anchors[id]; if (!a) return null; V.set(a.x, a.top, a.z).project(camera); return { el, id, sx: (V.x + 1) / 2 * vw, sy: (1 - V.y) / 2 * vh, z: V.z, rank: +el.dataset.rank || 99, pri: el.dataset.pri, force: el.dataset.force === '1', hover: el.dataset.hover === '1', dot: el.dataset.dot === '1', stem: +el.dataset.stem || 24 }; }).filter(Boolean).sort((a, b) => a.rank - b.rank);
    const boxes = uiRects.map(r => [r[0] - cr.left, r[1] - cr.top, r[2] - cr.left, r[3] - cr.top]);
    const dotPts = [];
    items.forEach(it => {
      let show = it.z < 1 && it.sx > -40 && it.sx < vw + 40 && it.sy > -40 && it.sy < vh + 60;
      if (it.dot) { if (show && !it.hover) show = it.pri === 'A' ? true : it.pri === 'B' ? ratio > .8 : ratio > 1.5; if (show) show = !boxes.some(q => !(it.sx + 7 < q[0] || it.sx - 7 > q[2] || it.sy + 7 < q[1] || it.sy - 7 > q[3])); if (show) show = !dotPts.some(d => Math.hypot(d[0] - it.sx, d[1] - it.sy) < 15); if (show) dotPts.push([it.sx, it.sy]); it.el.style.transform = `translate3d(${it.sx.toFixed(1)}px,${it.sy.toFixed(1)}px,0)`; it.el.style.visibility = show ? 'visible' : 'hidden'; return; }
      const top = it.rank === 0 || it.hover;
      if (show && !it.force) show = it.pri === 'A' ? ratio > .45 : it.pri === 'B' ? ratio > 1.5 : ratio > 3;
      const w = it.el._w || 80, h = it.el._h || 24, hit = bb => boxes.some(q => !(bb[2] < q[0] || bb[0] > q[2] || bb[3] < q[1] || bb[1] > q[3]));
      let stem = it.stem, bx = [it.sx - w / 2, it.sy - stem - h, it.sx + w / 2, it.sy - stem];
      if (show && !top && hit(bx)) {
        let ok = false;
        if (it.force) for (const extra of [h + 6, 2 * (h + 6), 3 * (h + 6)]) { const c = [it.sx - w / 2, it.sy - it.stem - extra - h, it.sx + w / 2, it.sy - it.stem - extra]; if (!hit(c)) { stem = it.stem + extra; bx = c; ok = true; break; } }
        if (!ok) show = false;
      }
      if (show) { boxes.push([bx[0] - 3, bx[1] - 3, bx[2] + 3, bx[3] + 3]); }
      if (stem !== it.el._stem) { it.el._stem = stem; const st = it.el.querySelector('[data-stem-line]'); if (st) st.style.height = stem + 'px'; if (it.el._b) it.el._b.style.bottom = stem + 'px'; }
      it.el.style.transform = `translate3d(${it.sx.toFixed(1)}px,${it.sy.toFixed(1)}px,0)`; it.el.style.visibility = show ? 'visible' : 'hidden';
    });
  }
  // ---------- loop ----------
  let raf = 0, alive = true; const t0 = performance.now();
  let lastFrame = 0;
  const watchdog = setInterval(() => { const n = performance.now(); if (alive && n - lastFrame > 400) frame(n, true); }, 250);
  function frame(now, manual) {
    if (!alive) return; if (!manual) raf = requestAnimationFrame(frame); lastFrame = now;
    if (flight) { const f = flight; let k = Math.min(1, (now - f.t0) / f.dur); const e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; const t = f.a.t.clone().lerp(f.b.t, e); placeCam([t.x, t.y, t.z], f.a.r * Math.pow(f.b.r / f.a.r, e), f.a.phi + (f.b.phi - f.a.phi) * e, f.a.theta + (f.b.theta - f.a.theta) * e); if (k >= 1) flight = null; lastInteract = now - 1500; }
    keyStep(now);
    controls.autoRotate = false;
    controls.update();
    const tg = controls.target, ox = tg.x, oy = tg.y, oz = tg.z; tg.x = THREE.MathUtils.clamp(tg.x, -50, 50); tg.z = THREE.MathUtils.clamp(tg.z, -50, 50); tg.y = THREE.MathUtils.clamp(tg.y, -2, 2); camera.position.x += tg.x - ox; camera.position.y += tg.y - oy; camera.position.z += tg.z - oz;
    const tt = (now - t0) / 1000;
    if (selRing.visible) { const s = 1 + .08 * Math.sin(tt * 3); selRing.scale.set(selRing.userData.r * s, 1, selRing.userData.r * s); }
    if (beam.visible) beam.rotation.y = tt * .9;
    movers.forEach(f => f(tt)); renderer.render(scene, camera); layoutLabels(now); frames++;
  }
  raf = requestAnimationFrame(frame);

  let frames = 0;
  let RG = null;
  function roadGraph() { if (RG) return RG; const P = [], E = [], rid = [], add = (a, b) => { const d = Math.hypot(P[a][0] - P[b][0], P[a][1] - P[b][1]); E[a].push([b, d]); E[b].push([a, d]); };
    roads.forEach((r, ri) => { if (!r.s) return; let prev = -1; r.s.forEach(p => { if (!inSq(p[0], p[1], 1)) { prev = -1; return; } const [x, z] = toW(p[0], p[1]), k = P.length; P.push([x, z]); E.push([]); rid.push(ri); if (prev >= 0) add(prev, k); prev = k; }); });
    const cell = 2, H = new Map(), key = (x, z) => Math.floor(x / cell) + ',' + Math.floor(z / cell); P.forEach((p, i) => { const k = key(p[0], p[1]); if (!H.has(k)) H.set(k, []); H.get(k).push(i); });
    const around = (x, z, f) => { const cx = Math.floor(x / cell), cz = Math.floor(z / cell); for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) (H.get((cx + dx) + ',' + (cz + dz)) || []).forEach(f); };
    P.forEach((p, i) => { const end = E[i].length < 2, lim = end ? 2 : .9; let best = -1, bd = 1e9; around(p[0], p[1], j => { if (rid[j] === rid[i]) return; const d = Math.hypot(P[j][0] - p[0], P[j][1] - p[1]); if (d < lim && d < bd) { bd = d; best = j; } }); if (best >= 0) add(i, best); });
    const near = (x, z) => { let b = 0, bd = 1e9; P.forEach((p, i) => { const d = Math.hypot(p[0] - x, p[1] - z); if (d < bd) { bd = d; b = i; } }); return b; };
    const route = (s0, t0) => { const N = P.length, dist = new Float64Array(N).fill(Infinity), prv = new Int32Array(N).fill(-1), h = [[0, s0]]; dist[s0] = 0;
      const push = it => { h.push(it); let i = h.length - 1; while (i > 0) { const pa = (i - 1) >> 1; if (h[pa][0] <= h[i][0]) break; [h[pa], h[i]] = [h[i], h[pa]]; i = pa; } };
      const pop = () => { const top = h[0], last = h.pop(); if (h.length) { h[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r2 = l + 1; let m = i; if (l < h.length && h[l][0] < h[m][0]) m = l; if (r2 < h.length && h[r2][0] < h[m][0]) m = r2; if (m === i) break; [h[m], h[i]] = [h[i], h[m]]; i = m; } } return top; };
      while (h.length) { const [d, u] = pop(); if (d > dist[u]) continue; if (u === t0) break; for (const [v, w] of E[u]) { const nd = d + w; if (nd < dist[v]) { dist[v] = nd; prv[v] = u; push([nd, v]); } } }
      if (!isFinite(dist[t0])) return [s0, t0]; const out = []; for (let u = t0; u >= 0; u = prv[u]) out.push(u); return out.reverse(); };
    return (RG = { P, near, route }); }
  return {
    anchors, big: () => { const out = []; root.children.forEach((m, i) => { if (!m.geometry) return; m.geometry.computeBoundingBox(); const b = m.geometry.boundingBox; if (b.min.x < -60 || b.max.x > 60 || b.min.z < -60 || b.max.z > 60 || b.max.y > 12) out.push([i, m.userData.poi || m.type, b.min.toArray().map(v => +v.toFixed(1)), b.max.toArray().map(v => +v.toFixed(1))]); }); return out; }, dbg: () => ({ frames, cam: camera.position.toArray().map(v => +v.toFixed(1)), tgt: controls.target.toArray(), dd: defaultDist, vw, vh, calls: renderer.info.render.calls, tris: renderer.info.render.triangles }),
    setSun, setSeason(s) { season = s; paintTrees(); }, setView, flyTo, fitTo,
    setOrbit(b) { orbit = b; lastInteract = 0; },
    _unbindKeys() { removeEventListener('keydown', kd); removeEventListener('keyup', ku); removeEventListener('blur', kb); renderer.domElement.removeEventListener('wheel', onWheel); removeEventListener('pointerup', releaseDrag); removeEventListener('pointercancel', releaseDrag); },
    setHistory(b) { ghost.visible = b; },
    setInsets(o) { Object.assign(insets, o); resize(); if (!userMoved && !flight) { const V = VIEWS[curView]; placeCam(V.t, defaultDist * V.f, THREE.MathUtils.degToRad(V.phi), THREE.MathUtils.degToRad(V.theta)); } },
    refreshLabels,
    setDeaths(list) {
      deathG.children.slice().forEach(g => { g.children.forEach(m => m.material.dispose()); deathG.remove(g); });
      const by = {}; (list || []).forEach(d => { if (anchors[d.loc]) (by[d.loc] = by[d.loc] || []).push(d); });
      Object.keys(by).forEach(id => { const a = anchors[id], arr = by[id], n = arr.length;
        arr.forEach((d, i) => { const ang = i / n * Math.PI * 2, rr = n > 1 ? .32 + n * .04 : 0, H = 2.6 + (i % 3) * .5, g = new THREE.Group();
          const mat = new THREE.MeshBasicMaterial({ color: d.color, transparent: true, opacity: .9 * (d.op ?? 1), depthWrite: false });
          const beam = new THREE.Mesh(beamGeo, mat); beam.scale.y = H; const bead = new THREE.Mesh(beadGeo, mat); bead.position.y = H + .12; g.add(beam, bead);
          g.position.set(a.x + Math.cos(ang) * rr, 0, a.z + Math.sin(ang) * rr); g.userData = { y0: Math.max(.5, a.top) + .5, ph: i * 1.3 + a.x * .1 }; g.position.y = g.userData.y0; g.renderOrder = 6; deathG.add(g); }); });
    },
    setHighlight(sel, ids) {
      const a = sel && anchors[sel]; selRing.visible = !!a; if (a) { selRing.position.set(a.x, .06, a.z); selRing.userData.r = Math.max(1.1, a.r * 1.05); }
      hlRings.forEach(m => root.remove(m)); hlRings.length = 0;
      (ids || []).forEach(id => { const b = anchors[id]; if (!b || id === sel) return; const m = new THREE.Mesh(ringGeo, hlMat); m.position.set(b.x, .05, b.z); const r = Math.max(.9, b.r * .9); m.scale.set(r, 1, r); m.renderOrder = 4; root.add(m); hlRings.push(m); });
    },
    setRoute(ids) {
      if (routeMesh) { root.remove(routeMesh); routeMesh.geometry.dispose(); routeMesh = null; }
      const stops = (ids || []).map(id => anchors[id]).filter(Boolean); if (stops.length < 2) return;
      const G2 = roadGraph(), path = [];
      for (let i = 0; i < stops.length - 1; i++) { const A = stops[i], B = stops[i + 1], na = G2.near(A.x, A.z), nb = G2.near(B.x, B.z), seg = G2.route(na, nb);
        if (!path.length) path.push([A.x, A.z]); seg.forEach(k => path.push(G2.P[k])); path.push([B.x, B.z]); }
      const pts = []; path.forEach(p => { const l = pts[pts.length - 1]; if (!l || Math.hypot(l.x - p[0], l.z - p[1]) > .35) pts.push(new THREE.Vector3(p[0], .3, p[1])); });
      routeMesh = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', .2), pts.length * 3, .2, 6, false), routeMat); routeMesh.renderOrder = 3; root.add(routeMesh);
    },
    resize,
    dispose() { removeEventListener('keydown', kd); removeEventListener('keyup', ku); removeEventListener('blur', kb); alive = false; clearInterval(watchdog); cancelAnimationFrame(raf); ro.disconnect(); controls.dispose(); renderer.dispose(); renderer.domElement.remove(); }
  };
}
