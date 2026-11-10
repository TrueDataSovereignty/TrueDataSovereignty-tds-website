/* The mycelium as an ink drawing on paper: hairlines in marine blue, a little gold, the real mark as the gate.
   Minimal on purpose. Needs Mycel and TDS_MARK_SVG. */
function MycelInk(cv, opts) {
  'use strict';
  opts = opts || {};
  var NAVY = '#101A3D', BLUE = '#33488F', GOLDD = '#B8862B', GOLD = '#DDB04A', BROWN = '#8A6212', PAPER = '#FAFAF8', SOFT = '#4D5672';
  var MONO = '"Cascadia Mono",Consolas,ui-monospace,Menlo,monospace';
  /* Every pair is real router output on synthetic text (router a822605, web/how-it-works-data/cases-out.json). */
  var SCRIPT = [
    { t: 1, a: 'Emma Whitfield', b: '⟦PERSON_1⟧' },
    { t: 2, a: 'Sorsele', b: 'northern Sweden' },
    { t: 3, a: 'acquire a Finnish logistics company', b: 'stays here' },
    { t: 1, a: '590505-2881', b: '⟦PERSONNUMMER_1⟧' },
    { t: 2, a: '35,897 employees', b: '10,000–50,000 employees' },
    { t: 1, a: 'GB33 BUKB 2020 1555 5555 55', b: '⟦IBAN_1⟧' }
  ];
  var reduced = Mycel.reducedMotion();
  var S, w, h, portrait, node, R, M, inb, out, inP, featP, outP, curl, stat, sctx, revIn, revOut, pulses, feat, fi, ft, rings, seal, mark = null, lastW = 0;
  function mk(mx, my) { return { x: node.x + (mx - 50) * M, y: node.y + (my - 52) * M }; }

  function build() {
    S = Mycel.fit(cv, 2); w = S.w; h = S.h; lastW = w; portrait = w < 760;
    var rand = Mycel.rng(20261112), A = [], roots, i;
    R = portrait ? Math.min(w * 0.13, 50) : Math.max(52, Math.min(h * 0.09, 80));
    node = portrait ? { x: w * 0.5, y: 96 + R * 1.6 } : { x: w * 0.73, y: h * 0.5 };
    M = R * 2.8 / 100;
    if (portrait) {
      for (i = 0; i < 170; i++) A.push({ x: rand() * w, y: node.y + R + Math.pow(rand(), 0.8) * (h - node.y) });
      roots = [mk(16, 70), mk(33, 80), mk(50, 89.8), mk(67, 80), mk(84, 70)];
    } else {
      for (i = 0; i < 300; i++) { var x = -20 + rand() * (node.x - R * 1.3 + 20), y = rand() * h; if (rand() > 0.25 + 0.75 * (x / node.x)) continue; A.push({ x: x, y: y }); }
      roots = [mk(33, 24), mk(16, 34), mk(16, 50), mk(16, 68), mk(33, 80)];
    }
    inb = Mycel.grow({ roots: roots, attractors: A, step: portrait ? 6 : 7, reach: portrait ? 110 : 140, kill: 16, rand: rand, iters: 600, jitter: 0.5 });
    A = [];
    if (portrait) { for (i = 0; i < 16; i++) A.push({ x: -20 + rand() * (node.x - R * 1.5 + 20), y: 70 + rand() * (node.y - 40) }); roots = [mk(16, 34), mk(16, 50)]; }
    else { for (i = 0; i < 34; i++) A.push({ x: node.x + R * 1.5 + rand() * (w - node.x - R * 1.5 + 30), y: h * 0.12 + rand() * h * 0.76 }); roots = [mk(84, 34), mk(84, 50), mk(84, 68)]; }
    out = Mycel.grow({ roots: roots, attractors: A, step: 8, reach: 170, kill: 18, rand: rand, iters: 400, jitter: 0.3 });
    function P(nodes, min, rev) { return Mycel.leaves(nodes).map(function (n) { var p = Mycel.pathToRoot(nodes, n); if (rev) p.reverse(); return Mycel.measure(p); }).filter(function (p) { return p.len > min; }); }
    inP = P(inb, R * 1.2);
    featP = inP.filter(function (p) { return p.len > R * 2.6 && (portrait || (p[0].x > w * 0.5 && p[0].y > h * 0.12 && p[0].y < h * 0.88)); });
    if (!featP.length) featP = inP;
    outP = P(out, R, true);
    var c = portrait ? { x: node.x + R * 2.0, y: node.y + R * 0.45 } : { x: node.x + R * 0.55, y: node.y + R * 2.15 };
    var st = portrait ? mk(84, 50) : mk(50, 89.8); curl = [st];
    var a0 = Math.atan2(st.y - c.y, st.x - c.x), r0 = Math.hypot(st.x - c.x, st.y - c.y);
    for (i = 1; i <= 90; i++) { var f = i / 90, rr = Math.min(r0 * (1 - f) + R * 0.2 * f, R * 0.85 * (1 - f) + R * 0.2); curl.push({ x: c.x + Math.cos(a0 + f * Math.PI * 3.2) * rr, y: c.y + Math.sin(a0 + f * Math.PI * 3.2) * rr * 0.8 }); }
    Mycel.measure(curl); curl.c = c; curl.done = false;
    stat = document.createElement('canvas'); stat.width = cv.width; stat.height = cv.height;
    sctx = stat.getContext('2d'); sctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
    revIn = 0; revOut = 0; pulses = []; feat = null; fi = 0; ft = 1.2; rings = 2; seal = 0;
    if (reduced || opts.still) reveal(1e9);
  }
  var styleIn = { ink: true, color: NAVY, maxW: 2.2, base: 0.35, alpha: function (n, wd) {
    var a = 0.5 + 0.45 * Math.min(1, wd / 2);
    if (portrait) { if (n.y > h * 0.4) a *= 0.26; } else if (n.x < w * 0.52) a *= 0.2 + 0.6 * Math.max(0, (n.x - w * 0.32) / (w * 0.2));
    return a; } };
  var styleOut = { ink: true, color: GOLDD, maxW: 1.8, base: 0.4, alpha: function () { return 0.95; } };
  function reveal(n) {
    var a = Math.min(inb.length, revIn + n), b = Math.min(out.length, revOut + n * out.length / inb.length);
    if (a > revIn) Mycel.drawSegments(sctx, inb, revIn, a, styleIn);
    if (b > revOut) Mycel.drawSegments(sctx, out, revOut, b, styleOut);
    revIn = a; revOut = b;
    if (revIn >= inb.length && !curl.done) { curl.done = true; sctx.save(); sctx.strokeStyle = NAVY; sctx.globalAlpha = 0.7; sctx.lineWidth = 1; sctx.beginPath(); curl.forEach(function (p, i) { if (i) sctx.lineTo(p.x, p.y); else sctx.moveTo(p.x, p.y); }); sctx.stroke(); sctx.restore(); }
  }
  function hex(ctx, f) {
    var P = [[50, 14.4], [84, 34], [84, 70.2], [50, 89.8], [16, 70.2], [16, 34]]; ctx.beginPath();
    P.forEach(function (q, i) { var x = node.x + (q[0] - 50) * M * f, y = node.y + (q[1] - 52) * M * f; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
    ctx.closePath();
  }
  function dot(ctx, pos, r, col, a) { ctx.globalAlpha = a; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(pos.x, pos.y, r, 0, 6.3); ctx.fill(); ctx.globalAlpha = 1; }
  function label(ctx, txt, x, y, col, a, blur) {
    if (a <= 0.01) return; ctx.save();
    ctx.font = (portrait ? '11px ' : '12.5px ') + MONO; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
    var tw = ctx.measureText(txt).width + 16; x = Math.max(tw / 2 + 8, Math.min(w - tw / 2 - 8, x));
    if (blur && 'filter' in ctx) ctx.filter = 'blur(' + blur.toFixed(1) + 'px)';
    ctx.globalAlpha = a * 0.94; ctx.fillStyle = PAPER; ctx.fillRect(x - tw / 2, y - 11, tw, 22);
    ctx.globalAlpha = a; ctx.fillStyle = col; ctx.fillText(txt, x, y + 0.5); ctx.restore();
  }
  function caps(ctx, txt, x, y, align) { ctx.save(); ctx.font = '10.5px ' + MONO; ctx.fillStyle = SOFT; ctx.textAlign = align; ctx.textBaseline = 'middle'; try { ctx.letterSpacing = '1.6px'; } catch (e) {} ctx.fillText(txt, x, y); ctx.restore(); }
  function leave(tier) {
    if (tier === 3) return { path: curl, d: 0, v: 70, col: NAVY, ph: 'curl' };
    return { path: outP[(Math.random() * outP.length) | 0], d: 0, v: 85, col: tier === 2 ? BLUE : GOLDD, ph: 'out' };
  }
  function drawNode(ctx) {
    var i; ctx.save(); ctx.lineJoin = 'round'; ctx.strokeStyle = NAVY; ctx.lineWidth = 0.7;
    for (i = 0; i < Math.min(rings, 6); i++) { ctx.globalAlpha = 0.16 * (1 - i / 7); hex(ctx, 1.22 + i * 0.085); ctx.stroke(); }
    ctx.globalAlpha = 1; ctx.fillStyle = PAPER; hex(ctx, 1.1); ctx.fill();
    if (mark) ctx.drawImage(mark, node.x - 50 * M, node.y - 48 * M, 100 * M, 100 * M);
    ctx.strokeStyle = NAVY; ctx.lineWidth = 1; ctx.globalAlpha = 0.75; ctx.beginPath(); ctx.arc(curl.c.x, curl.c.y, R * 0.2, 0, 6.3); ctx.stroke();
    if (seal > 0) dot(ctx, curl.c, R * 0.2 * seal, GOLD, seal);
    ctx.restore();
    caps(ctx, 'THE LAYER', node.x, node.y - 50 * M - 14, 'center');
    if (!portrait) { caps(ctx, 'OUTSIDE', w - 26, node.y - R * 2.6, 'right'); caps(ctx, 'KEPT LOCAL', curl.c.x + R * 0.95, curl.c.y, 'left'); }
  }
  function frame(dt) {
    var ctx = S.ctx, i, pos;
    reveal(reduced ? 1e9 : Math.max(2, inb.length * dt / 9));
    ctx.clearRect(0, 0, w, h); ctx.drawImage(stat, 0, 0, w, h);
    var grown = revIn / inb.length;
    if (!reduced && !opts.still && grown > 0.5 && pulses.length < (portrait ? 5 : 8) && Math.random() < dt * 1.4) pulses.push({ path: inP[(Math.random() * inP.length) | 0], d: 0, v: 50 + Math.random() * 45, col: NAVY, ph: 'in' });
    for (i = pulses.length - 1; i >= 0; i--) {
      var p = pulses[i]; p.d += p.v * dt;
      if (p.d >= p.path.len) { pulses.splice(i, 1); if (p.ph === 'in') { rings++; var r = Math.random(); pulses.push(leave(r < 0.6 ? 1 : r < 0.8 ? 2 : 3)); } else if (p.ph === 'curl') seal = 1; continue; }
      dot(ctx, Mycel.at(p.path, p.d), 2.3, p.col, p.ph === 'out' ? Math.min(1, (p.path.len - p.d) / 60) : 0.9);
    }
    seal = Math.max(0, seal - dt * 0.8);
    drawNode(ctx);
    if (!feat && grown > 0.7) { ft -= dt; if (ft <= 0) { var s = SCRIPT[fi++ % SCRIPT.length]; feat = { s: s, path: featP[(Math.random() * featP.length) | 0], ph: 'in', hold: 0 }; feat.d = Math.max(0, feat.path.len - (portrait ? R * 3.4 : R * 5.5)); } }
    if (feat) {
      var s2 = feat.s, after = s2.t === 1 ? BROWN : s2.t === 2 ? BLUE : NAVY, lx = node.x, ly = portrait ? node.y + 46 * M + 16 : node.y - 46 * M - 34;
      if (feat.ph === 'in') {
        feat.d += 58 * dt; pos = Mycel.at(feat.path, feat.d); dot(ctx, pos, 3.4, NAVY, 1); label(ctx, s2.a, pos.x, pos.y - 22, NAVY, 1);
        if (feat.d >= feat.path.len) { feat.ph = 'hold'; rings++; }
      } else if (feat.ph === 'hold') {
        feat.hold += dt / 1.5; var f = Math.min(1, feat.hold);
        label(ctx, s2.a, lx, ly, NAVY, 1 - f, f * 5); label(ctx, s2.b, lx, ly, after, f, s2.t === 2 ? (1 - f) * 3 : 0);
        if (feat.hold >= 1.5) { feat.ph = 'out'; feat.o = leave(s2.t); }
      } else {
        var o = feat.o; o.d += o.v * dt;
        if (o.d >= o.path.len) { if (o.ph === 'curl') seal = 1; feat = null; ft = 2.2; }
        else { var fade = Math.min(1, (o.path.len - o.d) / 70); pos = Mycel.at(o.path, o.d); dot(ctx, pos, 3.4, o.col, fade); label(ctx, s2.b, pos.x, pos.y + (o.ph === 'curl' ? 24 : -22), after, fade); }
      }
    }
  }
  function still() {
    frame(0); var ctx = S.ctx, p = featP[0], pos = Mycel.at(p, p.len * 0.7);
    dot(ctx, pos, 3.4, NAVY, 1); label(ctx, SCRIPT[0].a, pos.x, pos.y - 22, NAVY, 1);
    var o = outP[0]; pos = Mycel.at(o, o.len * 0.5); dot(ctx, pos, 3.4, GOLDD, 1); label(ctx, SCRIPT[0].b, pos.x, pos.y - 22, BROWN, 1);
  }
  if (typeof TDS_MARK_SVG !== 'undefined') {
    var im = new Image();
    im.onload = function () { mark = im; if ((reduced || opts.still) && S) still(); };
    im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(TDS_MARK_SVG);
  }
  (function start() {
    var r = cv.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) { requestAnimationFrame(start); return; }
    build(); if (reduced || opts.still) still(); else Mycel.loop(cv, frame);
  })();
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { if (Math.abs(cv.getBoundingClientRect().width - lastW) < 2) return; build(); if (reduced || opts.still) still(); }, 180); });
}
