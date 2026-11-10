/* The Mycelial Gate: the network, the ring node, and real router tokens passing through it.
   Used by concept A and by the home page hero. Needs Mycel. */
function MycelGate(cv, opts) {
  'use strict';
  opts = opts || {};
  var GOLD = '#DDB04A', DEEP = '#B8862B', LIGHT = '#F8DF9C', LINE = '#33488F', TEAL = '#5FD9C6', MOSS = '#8FAE6B', IVORY = '#F7F3EA', MUT = '#AEB6CE';
  var MONO = '"Cascadia Mono",Consolas,ui-monospace,Menlo,monospace';
  /* Every pair below is real router output on synthetic text (router a822605, web/how-it-works-data/cases-out.json). */
  var SCRIPT = [
    { t: 1, a: 'Emma Whitfield', b: '⟦PERSON_1⟧' },
    { t: 2, a: 'Sorsele', b: 'northern Sweden' },
    { t: 1, a: 'GB33 BUKB 2020 1555 5555 55', b: '⟦IBAN_1⟧' },
    { t: 3, a: 'acquire a Finnish logistics company', b: null },
    { t: 1, a: '590505-2881', b: '⟦PERSONNUMMER_1⟧' },
    { t: 2, a: '35,897 employees', b: '10,000–50,000 employees' },
    { t: 1, a: '+44 7700 900123', b: '⟦PHONE_1⟧' },
    { t: 2, a: '13 June 2027', b: 'June 2027' }
  ];
  var reduced = Mycel.reducedMotion();
  var S, w, h, portrait, node, R, stat, sctx, inb, out, inPaths, featPaths, outPaths, curl;
  var revealIn, revealOut, pulses, feat, featIdx, featTimer, rings, sealFlash, lastW = 0;

  function build() {
    S = Mycel.fit(cv, 2); w = S.w; h = S.h; lastW = w;
    portrait = w < 760;
    var rand = Mycel.rng(20261111);
    node = portrait ? { x: w * 0.5, y: Math.max(150, h * 0.235) } : { x: w * 0.7, y: h * 0.47 };
    R = portrait ? Math.min(w * 0.15, 60) : Math.max(58, Math.min(h * 0.105, 96));
    var i, a, A = [], roots = [];
    // inbound side: your environment
    if (portrait) {
      for (i = 0; i < 380; i++) A.push({ x: rand() * w, y: node.y + R * 0.9 + Math.pow(rand(), 0.8) * (h - node.y) });
      for (i = 0; i < 5; i++) { a = Math.PI * (0.18 + 0.16 * i); roots.push({ x: node.x + Math.cos(a) * R * 1.04, y: node.y + Math.sin(a) * R * 0.6 }); }
    } else {
      for (i = 0; i < 620; i++) {
        var x = -20 + rand() * (node.x - R * 1.25 + 20), y = rand() * h;
        if (rand() > 0.3 + 0.7 * (x / node.x)) continue;
        A.push({ x: x, y: y });
      }
      for (i = 0; i < 6; i++) { a = Math.PI * (0.56 + 0.176 * i); roots.push({ x: node.x + Math.cos(a) * R * 1.04, y: node.y + Math.sin(a) * R * 0.6 }); }
    }
    inb = Mycel.grow({ roots: roots, attractors: A, step: portrait ? 6 : 7, reach: portrait ? 80 : 100, kill: 15, rand: rand, iters: 600, jitter: 0.5 });
    // outbound side: outside, toward the frontier model
    A = []; roots = [];
    if (portrait) {
      for (i = 0; i < 46; i++) A.push({ x: w * 0.06 + rand() * w * 0.88, y: -20 + rand() * (node.y - R * 0.9 + 20) });
      for (i = 0; i < 3; i++) { a = -Math.PI * (0.3 + 0.2 * i); roots.push({ x: node.x + Math.cos(a) * R * 1.04, y: node.y + Math.sin(a) * R * 0.6 }); }
    } else {
      for (i = 0; i < 64; i++) A.push({ x: node.x + R * 1.5 + rand() * (w - node.x - R * 1.5 + 30), y: h * 0.1 + rand() * h * 0.72 });
      for (i = 0; i < 3; i++) { a = Math.PI * (-0.22 + 0.2 * i); roots.push({ x: node.x + Math.cos(a) * R * 1.04, y: node.y + Math.sin(a) * R * 0.6 }); }
    }
    out = Mycel.grow({ roots: roots, attractors: A, step: 8, reach: 130, kill: 18, rand: rand, iters: 400, jitter: 0.3 });

    function paths(nodes, minLen) {
      return Mycel.leaves(nodes).map(function (n) { return Mycel.measure(Mycel.pathToRoot(nodes, n)); }).filter(function (p) { return p.len > minLen; });
    }
    inPaths = paths(inb, R * 1.2);
    featPaths = inPaths.filter(function (p) {
      return p.len > R * 2.6 && (portrait ? true : (p[0].x > w * 0.5 && p[0].y > h * 0.14 && p[0].y < h * 0.86));
    });
    if (!featPaths.length) featPaths = inPaths;
    outPaths = paths(out, R).map(function (p) { p.reverse(); return Mycel.measure(p); });
    // the curl: a thread that turns back on itself and seals (keep local)
    var c = portrait ? { x: node.x + R * 1.75, y: node.y + R * 0.75 } : { x: node.x + R * 0.55, y: node.y + R * 1.9 };
    var start = portrait ? { x: node.x + R * 0.8, y: node.y + R * 0.36 } : { x: node.x + R * 0.2, y: node.y + R * 0.6 };
    curl = [start];
    var a0 = Math.atan2(start.y - c.y, start.x - c.x), r0 = Math.hypot(start.x - c.x, start.y - c.y);
    for (i = 1; i <= 90; i++) {
      var f = i / 90, rr = r0 * (1 - f) + R * 0.2 * f, an = a0 + f * Math.PI * 3.2;
      rr = Math.min(rr, R * 0.85 * (1 - f) + R * 0.2);
      curl.push({ x: c.x + Math.cos(an) * rr, y: c.y + Math.sin(an) * rr * 0.8 });
    }
    Mycel.measure(curl); curl.c = c;

    stat = document.createElement('canvas'); stat.width = cv.width; stat.height = cv.height;
    sctx = stat.getContext('2d'); sctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
    revealIn = 0; revealOut = 0; pulses = []; feat = null; featIdx = 0; featTimer = 1.2; rings = 3; sealFlash = 0;
    if (reduced || opts.still) { reveal(1e9); }
  }

  var styleIn = { color: GOLD, glow: DEEP, maxW: 3.6, alpha: function (n, wd) {
    var a = 0.2 + 0.5 * Math.min(1, wd / 2.6);
    if (portrait) { if (n.y > h * 0.4) a *= 0.34; } else if (n.x < w * 0.47) a *= 0.3 + 0.5 * Math.max(0, (n.x - w * 0.3) / (w * 0.17));
    return a;
  } };
  var styleOut = { color: '#5A72C4', glow: LINE, maxW: 2.2, alpha: function (n, wd) { return 0.3 + 0.35 * Math.min(1, wd / 2); } };

  function reveal(n) {
    var ti = inb.length, to = out.length;
    var a = Math.min(ti, revealIn + n), b = Math.min(to, revealOut + n * to / ti);
    if (a > revealIn) Mycel.drawSegments(sctx, inb, revealIn, a, styleIn);
    if (b > revealOut) Mycel.drawSegments(sctx, out, revealOut, b, styleOut);
    revealIn = a; revealOut = b;
    if (revealIn >= ti && !curl.done) {
      curl.done = true;
      sctx.save(); sctx.globalCompositeOperation = 'lighter'; sctx.lineCap = 'round';
      sctx.strokeStyle = GOLD; sctx.globalAlpha = 0.6; sctx.lineWidth = 1.5;
      sctx.beginPath(); curl.forEach(function (p, i) { i ? sctx.lineTo(p.x, p.y) : sctx.moveTo(p.x, p.y); }); sctx.stroke();
      sctx.restore();
    }
  }

  function ellipse(ctx, x, y, rx, ry) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); }
  function diamond(ctx, x, y, hw, hh) { ctx.beginPath(); ctx.moveTo(x, y - hh); ctx.lineTo(x + hw, y); ctx.lineTo(x, y + hh); ctx.lineTo(x - hw, y); ctx.closePath(); }

  function drawNode(ctx, t) {
    var k = 0.6, br = 1 + Math.sin(t * 0.9) * 0.018, i;
    ctx.save();
    // soil cleared under the node so it reads as a gate, not a tangle
    ctx.fillStyle = '#060A1A'; ellipse(ctx, node.x, node.y, R * 0.98, R * k * 0.98); ctx.fill();
    // growth rings: one per request
    ctx.lineWidth = 0.7; ctx.strokeStyle = GOLD;
    for (i = 0; i < Math.min(rings, 13); i++) {
      ctx.globalAlpha = 0.34 * (1 - i / 14);
      ellipse(ctx, node.x, node.y, (R + 7 + i * 5.5) * br, (R + 7 + i * 5.5) * k * br); ctx.stroke();
    }
    // three stacked layers, echoing the mark
    var hw = R * 0.66, hh = hw * 0.576, gap = R * 0.19;
    for (i = 1; i >= -1; i--) {
      ctx.globalAlpha = i === 0 ? 0.95 : 0.8;
      diamond(ctx, node.x, node.y + i * gap, hw, hh);
      ctx.fillStyle = i === 0 ? '#101A3D' : '#16224F'; ctx.fill();
      ctx.strokeStyle = i === 0 ? LINE : DEEP; ctx.lineWidth = 0.8; ctx.stroke();
    }
    // the gold ring
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = DEEP; ctx.lineWidth = 7; ctx.globalAlpha = 0.22 + 0.08 * Math.sin(t * 0.9);
    ellipse(ctx, node.x, node.y, R * br, R * k * br); ctx.stroke();
    ctx.globalAlpha = 1; ctx.strokeStyle = LIGHT; ctx.lineWidth = 2.2;
    ellipse(ctx, node.x, node.y, R * br, R * k * br); ctx.stroke();
    // the seal at the end of the curl
    var e = curl[curl.length - 1];
    ctx.strokeStyle = LIGHT; ctx.lineWidth = 1.4; ctx.globalAlpha = 0.6 + 0.4 * sealFlash;
    ctx.beginPath(); ctx.arc(curl.c.x, curl.c.y, R * 0.2 + sealFlash * 3, 0, Math.PI * 2); ctx.stroke();
    if (sealFlash > 0) Mycel.glowDot(ctx, e.x, e.y, 22, GOLD, sealFlash * 0.5);
    ctx.restore();
    // labels (the same words exist as text in the page)
    ctx.save();
    ctx.font = '11px ' + MONO; ctx.fillStyle = MUT; ctx.textBaseline = 'middle';
    try { ctx.letterSpacing = '1.5px'; } catch (er) {}
    if (portrait) {
      ctx.textAlign = 'left'; ctx.fillText('OUTSIDE', 20, 74);
      ctx.fillStyle = LIGHT; ctx.textAlign = 'right'; ctx.fillText('THE LAYER', node.x - R * 1.2, node.y - R * 0.5);
      ctx.fillStyle = GOLD; ctx.textAlign = 'center'; ctx.fillText('KEPT LOCAL', curl.c.x, curl.c.y + R * 0.95);
    } else {
      ctx.textAlign = 'center';
      ctx.fillStyle = LIGHT; ctx.fillText('THE LAYER  ·  DECIDES WHAT PASSES', node.x, node.y - R * 0.6 - 86);
      ctx.fillStyle = MUT;
      ctx.textAlign = 'right'; ctx.fillText('OUTSIDE  ·  FRONTIER AI', w - 28, h * 0.1);
      ctx.textAlign = 'left'; ctx.fillText('YOUR ENVIRONMENT', w * 0.49, h * 0.92);
      ctx.fillStyle = GOLD; ctx.textAlign = 'left'; ctx.fillText('KEPT LOCAL', curl.c.x + R * 1.0, curl.c.y);
    }
    ctx.restore();
  }

  function drawPulse(ctx, p) {
    var pos = Mycel.at(p.path, p.d), i;
    for (i = 4; i >= 1; i--) { var q = Mycel.at(p.path, p.d - i * 7); Mycel.glowDot(ctx, q.x, q.y, p.r * 0.7, p.col, 0.12 * (5 - i) * p.a); }
    Mycel.glowDot(ctx, pos.x, pos.y, p.r * (p.soft ? 2.6 : 1.5), p.col, (p.soft ? 0.45 : 0.9) * p.a);
    if (!p.soft) Mycel.glowDot(ctx, pos.x, pos.y, p.r * 0.45, '#FFFFFF', 0.9 * p.a);
    return pos;
  }

  function label(ctx, txt, x, y, col, a, blur) {
    if (a <= 0.01) return;
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.font = (portrait ? '11px ' : '12.5px ') + MONO; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
    var tw = ctx.measureText(txt).width + 16;
    x = Math.max(tw / 2 + 8, Math.min(w - tw / 2 - 8, x));
    if (blur && 'filter' in ctx) ctx.filter = 'blur(' + blur.toFixed(1) + 'px)';
    ctx.globalAlpha = a * 0.86; ctx.fillStyle = '#060A1A'; ctx.fillRect(x - tw / 2, y - 11, tw, 22);
    ctx.globalAlpha = a; ctx.fillStyle = col; ctx.fillText(txt, x, y + 0.5);
    ctx.restore();
  }

  function spawnAmbient() {
    var p = inPaths[(Math.random() * inPaths.length) | 0];
    pulses.push({ path: p, d: 0, v: 55 + Math.random() * 60, col: GOLD, r: 5, a: 0.75, phase: 'in' });
  }
  function leave(tier) {
    if (tier === 3) return { path: curl, d: 0, v: 70, col: LIGHT, r: 5.5, a: 1, phase: 'curl' };
    var p = outPaths[(Math.random() * outPaths.length) | 0];
    return { path: p, d: 0, v: 85, col: tier === 2 ? MOSS : TEAL, r: tier === 2 ? 6 : 5, a: 0.9, soft: tier === 2, phase: 'out' };
  }

  function frame(dt, t) {
    var ctx = S.ctx, i;
    reveal(reduced ? 1e9 : Math.max(2, inb.length * dt / 7.5));
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(stat, 0, 0, w, h);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    var grown = revealIn / inb.length;
    if (!reduced && !opts.still && grown > 0.45 && pulses.length < (portrait ? 9 : 16) && Math.random() < dt * 2.4) spawnAmbient();
    for (i = pulses.length - 1; i >= 0; i--) {
      var p = pulses[i]; p.d += p.v * dt;
      if (p.d >= p.path.len) {
        pulses.splice(i, 1);
        if (p.phase === 'in') { rings++; var r = Math.random(); pulses.push(leave(r < 0.6 ? 1 : r < 0.8 ? 2 : 3)); }
        else if (p.phase === 'curl') sealFlash = 1;
        continue;
      }
      if (p.phase === 'out') p.a = Math.min(0.9, (p.path.len - p.d) / 80);
      drawPulse(ctx, p);
    }
    ctx.restore();
    sealFlash = Math.max(0, sealFlash - dt * 0.9);
    drawNode(ctx, t);
    // the featured request: a real token, readable, changing at the gate
    if (!feat && grown > 0.7) {
      featTimer -= dt;
      if (featTimer <= 0) {
        var s = SCRIPT[featIdx++ % SCRIPT.length];
        feat = { s: s, path: featPaths[(Math.random() * featPaths.length) | 0], d: 0, phase: 'in', hold: 0, a: 1 };
        feat.d = Math.max(0, feat.path.len - (portrait ? R * 3.2 : R * 5.2));
      }
    }
    if (feat) {
      var s2 = feat.s, pos, lx, ly;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      if (feat.phase === 'in') {
        feat.d += 62 * dt;
        pos = drawPulse(ctx, { path: feat.path, d: feat.d, col: LIGHT, r: 7, a: 1 });
        ctx.restore();
        label(ctx, s2.a, pos.x, pos.y - 24, LIGHT, Math.min(1, (feat.d - (feat.path.len - R * 5.2)) / 40 + 1));
        if (feat.d >= feat.path.len) { feat.phase = 'hold'; feat.hold = 0; rings++; feat.pos = pos; }
      } else if (feat.phase === 'hold') {
        feat.hold += dt / 1.5;
        var f = Math.min(1, feat.hold), col = s2.t === 1 ? TEAL : s2.t === 2 ? MOSS : LIGHT;
        Mycel.glowDot(ctx, node.x, node.y, R * (0.5 + f * 0.5), s2.t === 1 ? TEAL : s2.t === 2 ? MOSS : MOSS, 0.35 * Math.sin(f * Math.PI));
        ctx.restore();
        lx = node.x; ly = node.y - R * 0.6 - (portrait ? 34 : 50);
        label(ctx, s2.a, lx, ly, LIGHT, 1 - f, f * 5);
        label(ctx, s2.b || 'stays here', lx, ly, col, f, s2.t === 2 ? (1 - f) * 3 : 0);
        if (feat.hold >= 1.5) { feat.phase = 'out'; feat.o = leave(s2.t); feat.o.r = 7; feat.o.a = 1; }
      } else {
        var o = feat.o; o.d += o.v * dt;
        if (o.d >= o.path.len) { ctx.restore(); if (o.phase === 'curl') sealFlash = 1; feat = null; featTimer = 1.6; }
        else {
          var fade = Math.min(1, (o.path.len - o.d) / 70);
          o.a = fade; pos = drawPulse(ctx, o); ctx.restore();
          if (o.phase === 'curl') label(ctx, 'stays here', pos.x, pos.y + 26, LIGHT, fade);
          else label(ctx, s2.b, pos.x, pos.y - 24, s2.t === 1 ? TEAL : MOSS, fade);
        }
      }
    }
  }

  function still() {
    // one composed frame: grown network, one token arriving, one masked token leaving
    var ctx = S.ctx; frame(0, 0);
    var p = featPaths[0], d = p.len * 0.72, pos;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    pos = drawPulse(ctx, { path: p, d: d, col: LIGHT, r: 7, a: 1 }); ctx.restore();
    label(ctx, SCRIPT[0].a, pos.x, pos.y - 24, LIGHT, 1);
    var o = outPaths[0];
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    pos = drawPulse(ctx, { path: o, d: o.len * 0.5, col: TEAL, r: 7, a: 1 }); ctx.restore();
    label(ctx, SCRIPT[0].b, pos.x, pos.y - 24, TEAL, 1);
  }

  (function start() {
    var r = cv.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) { requestAnimationFrame(start); return; }
    build();
    if (reduced || opts.still) still(); else Mycel.loop(cv, frame);
  })();
  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      if (Math.abs(cv.getBoundingClientRect().width - lastW) < 2) return;
      build(); if (reduced || opts.still) still();
    }, 180);
  });
}
