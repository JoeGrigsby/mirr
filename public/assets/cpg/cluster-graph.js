// Cluster view: pseudo-3D canvas graph. Brands clustered by category, linked by owner via company hubs.
const TAU = Math.PI * 2, F = 2200;
const clampZ = z => Math.max(0.45, Math.min(7, z));
const rng = s => () => ((s = Math.imul(s ^ (s >>> 15), 1 | s) + 0x6D2B79F5 | 0, ((s ^ (s >>> 13)) >>> 0) / 4294967296));
const HOME = { yaw: 0.35, pitch: -0.78, zoom: 1, t: [0, 0], tx: 0, ty: 0 };

export function createCluster(host) {
  // host: { getView(), cats:[[name,color,short]], ink, paper, grid, onBrand(bi), onCompany(ci), onEmpty(), isActive() }
  const S = { cv: null, ctx: null, W: 0, H: 0, dpr: 1, cam: { ...HOME, t: [0, 0] }, goal: { ...HOME, t: [0, 0] }, spin: true, raf: 0, G: null, key: "", hov: null, labels: [], imgs: new Map(), off: null };
  const img = url => { if (!url) return null; let im = S.imgs.get(url); if (!im) { im = new Image(); im.onload = () => kick(); im.src = url; S.imgs.set(url, im); } return im.complete && im.naturalWidth ? im : null; };

  function build(v) {
    const { D, cosIds } = v, R = rng(7), cats = host.cats;
    const nodes = [], hubs = [], edges = [], tris = [], centres = {};
    const coSet = new Set(cosIds);
    cats.forEach(([cat, col], k) => {
      const ang = -Math.PI / 2 + (k + 0.5) * TAU / cats.length, cx = Math.cos(ang) * 390, cy = Math.sin(ang) * 390;
      const list = D.brands.filter(b => b.cat === cat && coSet.has(b.c));
      const n = list.length; if (!n) return;
      const step = 11, Rmax = step * Math.sqrt(n + 0.5);
      centres[cat] = { x: cx, y: cy, r: Rmax, ang, col };
      const pts = [];
      for (let j = 0; j < n; j++) { const r = step * Math.sqrt(j + 0.5), th = j * 2.39996; pts.push({ j, x: cx + r * Math.cos(th), y: cy + r * Math.sin(th), th: ((th % TAU) + TAU) % TAU, r }); }
      const byAng = pts.slice().sort((a, b) => a.th - b.th);
      const coCount = {}; list.forEach(b => coCount[b.c] = (coCount[b.c] || 0) + 1);
      const sorted = list.slice().sort((a, b) => (coCount[b.c] - coCount[a.c]) || (a.c - b.c) || a.n.localeCompare(b.n));
      const startIdx = nodes.length, ptNode = new Array(n);
      sorted.forEach((b, i) => { const p = byAng[i], rr = p.r / (Rmax || 1); const nd = { kind: "b", bi: b.i, ci: b.c, cat, col, x: p.x, y: p.y, z: 46 * (1 - rr * rr) + (R() - 0.5) * 26 }; ptNode[p.j] = nd; nodes.push(nd); });
      for (let j = 0; j < n; j++) for (const [a, b] of [[8, 13], [5, 13], [13, 21]]) if (j + b < n) tris.push([ptNode[j], ptNode[j + a], ptNode[j + b]]);
      // chain same-company brands within the category (angular order = contiguous wedge)
      const last = {};
      sorted.forEach((b, i) => { const nd = nodes[startIdx + i]; if (last[b.c]) edges.push([last[b.c], nd, b.c]); last[b.c] = nd; });
    });
    // company hubs, pulled toward the middle, linked to one anchor per category
    cosIds.forEach(ci => {
      const own = nodes.filter(n => n.ci === ci); if (!own.length) return;
      let mx = 0, my = 0; own.forEach(n => { mx += n.x; my += n.y; }); mx /= own.length; my /= own.length;
      const h = { kind: "c", ci, x: mx * 0.38 + (R() - 0.5) * 40, y: my * 0.38 + (R() - 0.5) * 40, z: 70 + R() * 50, n: own.length };
      hubs.push(h);
      const seen = new Set(); own.forEach(n => { if (seen.has(n.cat)) return; seen.add(n.cat); edges.push([h, n, ci, true]); });
    });
    return { nodes, hubs, edges, tris, centres };
  }

  function proj(x, y, z) {
    const c = S.cam; x -= c.t[0]; y -= c.t[1];
    const cy = Math.cos(c.yaw), sy = Math.sin(c.yaw), X = x * cy - y * sy, Y = x * sy + y * cy;
    const cp = Math.cos(c.pitch), sp = Math.sin(c.pitch), Y2 = Y * cp - z * sp, Z2 = Y * sp + z * cp;
    const s = F / (F - Z2), base = Math.min(S.W, S.H) / 1380 * c.zoom;
    return [S.W / 2 + (X * s + c.tx) * base, S.H / 2 + (Y2 * s + c.ty) * base, s, Z2];
  }

  function draw() {
    const v = host.getView(); if (!v || !S.ctx) return;
    const key = v.cosIds.join(","); if (key !== S.key || !S.G) { S.key = key; S.G = build(v); S.hov = null; }
    const { ctx, W, H } = S, G = S.G, D = v.D, z = S.cam.zoom;
    ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const all = [...G.nodes, ...G.hubs]; all.forEach(n => { const p = proj(n.x, n.y, n.z); n.sx = p[0]; n.sy = p[1]; n.s = p[2]; n.d = p[3]; });
    const hovCo = S.hov ? S.hov.ci : null, focusCo = hovCo != null ? hovCo : v.selCo;
    const on = n => n.kind === "c" ? v.coOn.has(n.ci) : v.on.has(n.bi);
    const alphaOf = n => { let a = on(n) ? 1 : 0.12; if (focusCo != null && n.ci !== focusCo) a *= 0.25; return a; };
    // mesh
    G.tris.forEach(([a, b, c]) => { const al = Math.min(alphaOf(a), alphaOf(b), alphaOf(c)); if (al < 0.05) return; ctx.globalAlpha = 0.075 * al; ctx.fillStyle = a.col; ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.lineTo(c.sx, c.sy); ctx.closePath(); ctx.fill(); });
    // owner links
    G.edges.forEach(([a, b, ci, hub]) => {
      const f = focusCo != null && ci === focusCo, al = Math.min(alphaOf(a), alphaOf(b)); if (al < 0.03 && !f) return;
      ctx.globalAlpha = f ? 0.85 : (hub ? 0.16 : 0.32) * al; ctx.lineWidth = f ? 1.6 : 0.7;
      if (hub) { const g = ctx.createLinearGradient(a.sx, a.sy, b.sx, b.sy); g.addColorStop(0, host.ink); g.addColorStop(1, b.col); ctx.strokeStyle = g; } else ctx.strokeStyle = a.col;
      ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke();
    });
    // nodes, back to front
    const showLogo = v.showLogos && z >= 2;
    all.slice().sort((a, b) => a.d - b.d).forEach(n => {
      const a = alphaOf(n), isH = S.hov === n, f = focusCo != null && n.ci === focusCo; ctx.globalAlpha = a;
      if (n.kind === "c") {
        const r = (2 + Math.sqrt(n.n) * 0.9) * n.s * Math.sqrt(z), co = D.companies[n.ci], im = v.showLogos && z >= 1.6 ? img(co.logo) : null;
        ctx.beginPath(); ctx.arc(n.sx, n.sy, im ? Math.max(r, 12) : r, 0, TAU);
        if (im) { ctx.fillStyle = "#fff"; ctx.fill(); ctx.lineWidth = isH || f ? 2 : 1; ctx.strokeStyle = isH || f ? host.ink : host.grid; ctx.stroke(); const R2 = Math.max(r, 12) * 1.25; ctx.drawImage(im, n.sx - R2 / 2, n.sy - R2 / 2, R2, R2); }
        else { ctx.globalAlpha = a * 0.85; ctx.fillStyle = host.ink; ctx.fill(); ctx.globalAlpha = a; if (isH || f) { ctx.lineWidth = 2; ctx.strokeStyle = "#fff"; ctx.stroke(); } }
        if (z >= 1.3 || isH || f) { ctx.globalAlpha = Math.min(1, a * 1.2); ctx.font = `${isH || f ? 600 : 500} 11px 'Geist',sans-serif`; ctx.fillStyle = host.ink; ctx.textAlign = "center"; ctx.textBaseline = "top"; ctx.fillText(v.short(n.ci), n.sx, n.sy + Math.max(r, im ? 12 : r) + 4); }
        return;
      }
      const b = D.brands[n.bi], im = showLogo ? img(b.logo) : null;
      if (im) { const r = 9 * n.s * Math.sqrt(z / 2); ctx.beginPath(); ctx.arc(n.sx, n.sy, r, 0, TAU); ctx.fillStyle = "#fff"; ctx.fill(); ctx.lineWidth = isH || f ? 1.8 : 1; ctx.strokeStyle = isH || f ? host.ink : n.col; ctx.stroke(); const R2 = r * 1.3; ctx.drawImage(im, n.sx - R2 / 2, n.sy - R2 / 2, R2, R2); }
      else { const r = Math.max(2.2, 2.6 * Math.sqrt(z)) * n.s; ctx.beginPath(); ctx.arc(n.sx, n.sy, r, 0, TAU); ctx.fillStyle = n.col; ctx.fill(); if (isH || f) { ctx.lineWidth = 1.5; ctx.strokeStyle = host.ink; ctx.stroke(); } }
      if (z >= 3.2 && a > 0.5) { ctx.font = "500 10px 'Geist',sans-serif"; ctx.fillStyle = host.ink; ctx.textAlign = "center"; ctx.textBaseline = "top"; ctx.fillText(b.n, n.sx, n.sy + 9 * n.s * Math.sqrt(z / 2) + 3); }
    });
    // category labels
    ctx.globalAlpha = 1; S.labels = [];
    host.cats.forEach(([cat, col]) => {
      const c = G.centres[cat]; if (!c) return; const off = c.r + 30, p = proj(c.x + Math.cos(c.ang) * off, c.y + Math.sin(c.ang) * off, 0);
      const txt = cat.toUpperCase(); ctx.font = "500 11px 'Geist Mono',monospace"; try { ctx.letterSpacing = "1.5px"; } catch (e) { }
      const tw = ctx.measureText(txt).width, w = tw + 34, h = 26, x = p[0] - w / 2, y = p[1] - h / 2, act = v.catOn(cat);
      ctx.globalAlpha = act ? 1 : 0.45; ctx.fillStyle = "#fff"; ctx.strokeStyle = host.grid; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, 4) : ctx.rect(x, y, w, h); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(x + 13, p[1], 4, 0, TAU); ctx.fillStyle = col; ctx.fill();
      ctx.fillStyle = host.ink; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText(txt, x + 23, p[1] + 0.5);
      try { ctx.letterSpacing = "0px"; } catch (e) { }
      S.labels.push({ cat, x, y, w, h });
    });
    // tooltip
    if (S.hov) {
      const n = S.hov, t1 = n.kind === "c" ? D.companies[n.ci].n : D.brands[n.bi].n, t2 = n.kind === "c" ? `${n.n} brands` : `${v.short(n.ci)} · ${(D.brands[n.bi].micros || [])[0] || D.brands[n.bi].cat}`;
      ctx.font = "600 13px 'Geist',sans-serif"; const w1 = ctx.measureText(t1).width; ctx.font = "400 12px 'Geist',sans-serif"; const w2 = ctx.measureText(t2).width;
      const w = Math.max(w1, w2) + 24, h = 48; let x = n.sx + 14, y = n.sy - h - 10; if (x + w > W - 8) x = n.sx - w - 14; if (y < 8) y = n.sy + 14;
      ctx.globalAlpha = 0.97; ctx.fillStyle = "#fff"; ctx.strokeStyle = host.grid; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, 6) : ctx.rect(x, y, w, h); ctx.fill(); ctx.stroke();
      ctx.globalAlpha = 1; ctx.textAlign = "left"; ctx.textBaseline = "top"; ctx.fillStyle = host.ink; ctx.font = "600 13px 'Geist',sans-serif"; ctx.fillText(t1, x + 12, y + 9);
      ctx.fillStyle = "#6b6760"; ctx.font = "400 12px 'Geist',sans-serif"; ctx.fillText(t2, x + 12, y + 27);
    }
    ctx.globalAlpha = 1;
  }

  function pick(p) { if (!S.G) return null; let best = null, bd = 14 * 14; [...S.G.hubs, ...S.G.nodes].forEach(n => { const dx = n.sx - p[0], dy = n.sy - p[1], d = dx * dx + dy * dy; if (d < bd) { bd = d; best = n; } }); return best; }
  function tick() {
    S.raf = 0; if (!host.isActive()) return;
    const c = S.cam, g = S.goal; let moving = false;
    if (S.spin) { g.yaw += 0.0016; c.yaw += 0.0016; }
    const L = (a, b, e) => { const d = b - a; if (Math.abs(d) > e) { moving = true; return a + d * 0.18; } return b; };
    c.yaw = L(c.yaw, g.yaw, 1e-4); c.pitch = L(c.pitch, g.pitch, 1e-4); c.zoom = L(c.zoom, g.zoom, 1e-3); c.tx = L(c.tx, g.tx, 0.05); c.ty = L(c.ty, g.ty, 0.05); c.t[0] = L(c.t[0], g.t[0], 0.05); c.t[1] = L(c.t[1], g.t[1], 0.05);
    draw(); if (moving || S.spin) kick();
  }
  function kick() { if (!S.raf && S.cv) S.raf = requestAnimationFrame(tick); }
  function resize() { const cv = S.cv; if (!cv) return; const r = cv.getBoundingClientRect(); S.dpr = Math.min(2.5, window.devicePixelRatio || 1); S.W = r.width; S.H = r.height; cv.width = Math.round(r.width * S.dpr); cv.height = Math.round(r.height * S.dpr); kick(); }

  function attach(cv) {
    detach(); if (!cv) return; S.cv = cv; S.ctx = cv.getContext("2d");
    const ro = new ResizeObserver(resize); ro.observe(cv); resize();
    const ptrs = new Map(); let down = null, moved = false, pan = false, pinch0 = 1, zoom0 = 1, g0 = null;
    const P = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    const onDown = e => { S.spin = false; cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, P(e)); if (ptrs.size === 1) { down = P(e); moved = false; pan = e.button === 2 || e.shiftKey; g0 = { ...S.goal, t: S.goal.t.slice() }; } else if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1; zoom0 = S.goal.zoom; moved = true; } };
    const onMove = e => {
      const p = P(e); if (!ptrs.has(e.pointerId)) { const h = pick(p); if (h !== S.hov) { S.hov = h; cv.style.cursor = h ? "pointer" : "grab"; kick(); } return; }
      ptrs.set(e.pointerId, p);
      if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; S.goal.zoom = clampZ(zoom0 * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch0); kick(); return; }
      const dx = p[0] - down[0], dy = p[1] - down[1]; if (Math.abs(dx) + Math.abs(dy) > 4) moved = true; if (!moved) return;
      cv.style.cursor = "grabbing"; S.hov = null;
      const base = Math.min(S.W, S.H) / 1380 * S.cam.zoom;
      if (pan) { S.goal.tx = g0.tx + dx / base; S.goal.ty = g0.ty + dy / base; S.cam.tx = S.goal.tx; S.cam.ty = S.goal.ty; }
      else { S.goal.yaw = g0.yaw + dx * 0.006; S.goal.pitch = Math.max(-1.45, Math.min(0, g0.pitch + dy * 0.005)); S.cam.yaw = S.goal.yaw; S.cam.pitch = S.goal.pitch; }
      kick();
    };
    const onUp = e => {
      ptrs.delete(e.pointerId); if (ptrs.size) return; cv.style.cursor = "grab";
      if (!moved && down) {
        const p = P(e), lab = S.labels.find(l => p[0] >= l.x && p[0] <= l.x + l.w && p[1] >= l.y && p[1] <= l.y + l.h);
        if (lab) focusCat(lab.cat);
        else { const n = pick(p); if (n && n.kind === "b") host.onBrand(n.bi); else if (n) host.onCompany(n.ci); else host.onEmpty(); }
      }
      down = null;
    };
    const onWheel = e => { e.preventDefault(); e.stopPropagation(); S.spin = false; S.goal.zoom = clampZ(S.goal.zoom * Math.exp(-e.deltaY * 0.0015)); kick(); };
    const onLeave = () => { if (S.hov) { S.hov = null; kick(); } };
    const ctxm = e => e.preventDefault();
    cv.addEventListener("pointerdown", onDown); cv.addEventListener("pointermove", onMove); cv.addEventListener("pointerup", onUp); cv.addEventListener("pointercancel", onUp);
    cv.addEventListener("pointerleave", onLeave); cv.addEventListener("wheel", onWheel, { passive: false }); cv.addEventListener("contextmenu", ctxm);
    S.off = () => { ro.disconnect(); ["pointerdown", "pointermove", "pointerup", "pointercancel"].forEach((t, i) => cv.removeEventListener(t, [onDown, onMove, onUp, onUp][i])); cv.removeEventListener("pointerleave", onLeave); cv.removeEventListener("wheel", onWheel); cv.removeEventListener("contextmenu", ctxm); };
    kick();
  }
  function detach() { if (S.off) S.off(); S.off = null; if (S.raf) cancelAnimationFrame(S.raf); S.raf = 0; S.cv = null; S.ctx = null; }
  let focused = null;
  function focusCat(cat) {
    S.spin = false; const c = S.G && S.G.centres[cat];
    if (!c || focused === cat) { focused = null; Object.assign(S.goal, { zoom: 1, tx: 0, ty: 0 }); S.goal.t = [0, 0]; }
    else { focused = cat; S.goal.t = [c.x, c.y]; S.goal.tx = 0; S.goal.ty = 0; S.goal.zoom = 2.3; }
    kick();
  }
  return {
    attach, detach, kick, focusCat,
    zoomBy(f) { S.spin = false; S.goal.zoom = clampZ(S.goal.zoom * f); kick(); },
    rotate(dy, dp) { S.spin = false; S.goal.yaw += dy; S.goal.pitch = Math.max(-1.45, Math.min(0, S.goal.pitch + dp)); kick(); },
    reset() { focused = null; Object.assign(S.goal, { ...HOME, t: [0, 0] }); kick(); },
    zoomPct() { return Math.round(S.goal.zoom * 100) + "%"; },
    async toBlob(bg) {
      const c = document.createElement("canvas"), k = 2; c.width = S.cv.width * k / S.dpr * S.dpr; c.height = S.cv.height * k / S.dpr * S.dpr;
      const g = c.getContext("2d"); g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height); g.drawImage(S.cv, 0, 0, c.width, c.height);
      return new Promise(r => c.toBlob(r, "image/png"));
    }
  };
}
