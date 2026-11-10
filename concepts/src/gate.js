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
  var G, M, mark = null, revealIn, revealOut, pulses, feat, featIdx, featTimer, rings, sealFlash, lastW = 0;

  function build() {
    S = Mycel.fit(cv, 2); w = S.w; h = S.h; lastW = w;
    portrait = w < 760;
    var rand = Mycel.rng(20261111);
    G = opts.forestOnly ? Math.round(h * 0.9) : opts.noForest ? 0 : Math.round(portrait ? Math.max(120, h * 0.19) : h * 0.36);   // the ground line: forest above, network below
    R = portrait ? Math.min(w * 0.15, 60) : Math.max(58, Math.min(h * 0.105, 96));
    node = portrait ? { x: w * 0.5, y: G + R * 1.75 + 30 } : { x: w * (opts.center ? 0.58 : 0.7), y: G + (h - G) * (opts.noForest ? 0.5 : 0.46) };
    M = R * 2.8 / 100;   // the mark is drawn 100 units wide; threads plug into its real corners
    function mk(mx, my) { return { x: node.x + (mx - 50) * M, y: node.y + (my - 52) * M }; }
    if (opts.forestOnly) {   // only the forest: one still picture, no network
      stat = document.createElement('canvas'); stat.width = cv.width; stat.height = cv.height;
      sctx = stat.getContext('2d'); sctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
      drawForest(sctx); S.ctx.clearRect(0, 0, w, h); S.ctx.drawImage(stat, 0, 0, w, h); return;
    }
    var i, a, A = [], roots = [];
    // inbound side: your environment
    if (portrait) {
      for (i = 0; i < 380; i++) A.push({ x: rand() * w, y: node.y + R * 0.9 + Math.pow(rand(), 0.8) * (h - node.y) });
      roots = [mk(16, 70), mk(33, 80), mk(50, 89.8), mk(67, 80), mk(84, 70)];
    } else {
      for (i = 0; i < 620; i++) {
        var x = -20 + rand() * (node.x - R * 1.25 + 20), y = G + 10 + rand() * (h - G - 10);
        if (rand() > 0.3 + 0.7 * (x / node.x)) continue;
        A.push({ x: x, y: y });
      }
      roots = [mk(33, 24), mk(16, 34), mk(16, 50), mk(16, 68), mk(33, 80)];
    }
    inb = Mycel.grow({ roots: roots, attractors: A, step: portrait ? 6 : 7, reach: portrait ? 80 : 100, kill: 15, rand: rand, iters: 600, jitter: 0.5 });
    // outbound side: outside, toward the frontier model
    A = []; roots = [];
    if (portrait) {
      for (i = 0; i < 26; i++) A.push({ x: -20 + rand() * (node.x - R * 1.5 + 20), y: G + 14 + rand() * (node.y - G) });
      roots = [mk(16, 34), mk(16, 50)];
    } else {
      for (i = 0; i < 64; i++) A.push({ x: node.x + R * 1.5 + rand() * (w - node.x - R * 1.5 + 30), y: G + 16 + rand() * (h - G) * 0.8 });
      roots = [mk(84, 34), mk(84, 50), mk(84, 68)];
    }
    out = Mycel.grow({ roots: roots, attractors: A, step: 8, reach: 130, kill: 18, rand: rand, iters: 400, jitter: 0.3 });

    function paths(nodes, minLen) {
      return Mycel.leaves(nodes).map(function (n) { return Mycel.measure(Mycel.pathToRoot(nodes, n)); }).filter(function (p) { return p.len > minLen; });
    }
    inPaths = paths(inb, R * 1.2);
    featPaths = inPaths.filter(function (p) {
      return p.len > R * 2.6 && (portrait ? true : (p[0].x > w * (opts.center ? 0.1 : 0.5) && p[0].y > G + 24 && p[0].y < h * 0.9));
    });
    if (!featPaths.length) featPaths = inPaths;
    outPaths = paths(out, R).map(function (p) { p.reverse(); return Mycel.measure(p); });
    // the curl: a thread that turns back on itself and seals (keep local)
    var c = portrait ? { x: node.x + R * 2.0, y: node.y + R * 0.45 } : { x: node.x + R * 0.55, y: node.y + R * 2.15 };
    var start = portrait ? mk(84, 50) : mk(50, 89.8);
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
    if (!opts.noForest) drawForest(sctx);
    revealIn = 0; revealOut = 0; pulses = []; feat = null; featIdx = 0; featTimer = 1.2; rings = 3; sealFlash = 0;
    if (reduced || opts.still) { reveal(1e9); }
  }

  var styleIn = { color: GOLD, glow: DEEP, maxW: 3.6, alpha: function (n, wd) {
    var a = 0.2 + 0.5 * Math.min(1, wd / 2.6);
    if (portrait) { if (n.y > h * 0.4) a *= 0.34; } else if (!opts.center && n.x < w * 0.47) a *= 0.3 + 0.5 * Math.max(0, (n.x - w * 0.3) / (w * 0.17));
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

  /* A Nordic forest edge at blue hour, drawn in code: spruce in layers of mist, a few birches, moss. No photo. */
  function drawForest(c) {
    var rnd = Mycel.rng(9041), i, L, k, canBlur = 'filter' in c;
    var x0 = portrait ? -40 : w * 0.44;
    function fade(x) { return portrait || opts.forestOnly ? 1 : Math.max(0, Math.min(1, (x - x0) / (w * 0.2))); }
    function gy(x) { return G + Math.sin(x * 0.006 + 1) * 3 + Math.sin(x * 0.021) * 1.5; }
    var sky = c.createLinearGradient(0, 0, 0, G);
    sky.addColorStop(0, '#060A1A'); sky.addColorStop(0.45, '#0A1230'); sky.addColorStop(0.85, '#1B2B59'); sky.addColorStop(1, '#2A3C6E');
    c.fillStyle = sky; c.fillRect(0, 0, w, G + 4);
    // a far ridge, low and soft
    if (canBlur) c.filter = 'blur(3px)';
    c.fillStyle = '#1D2D5C'; c.beginPath(); c.moveTo(0, G + 4);
    for (i = 0; i <= w + 8; i += 8) c.lineTo(i, G - G * (0.12 + 0.06 * Math.sin(i * 0.004 + 2) + 0.02 * Math.sin(i * 0.013)));
    c.lineTo(w, G + 4); c.fill();
    function spruce(x, by, H, col) {
      var tiers = Math.max(7, Math.round(H / 8)), hw0 = H * (0.14 + rnd() * 0.05), st = H * 0.92 / tiers;
      c.fillStyle = col; c.fillRect(x - 1, by - H * 0.25, 2, H * 0.25 + 2);
      for (k = 0; k < tiers; k++) {
        var f = (k + 1) / tiers, y = by - H + f * H * 0.9, hw = hw0 * Math.pow(f, 0.8) * (0.78 + rnd() * 0.44);
        c.beginPath(); c.moveTo(x, y - st * 1.4);
        c.quadraticCurveTo(x - hw * 0.3, y - st * 0.1, x - hw * (0.85 + rnd() * 0.3), y + st * (0.45 + rnd() * 0.6));
        c.quadraticCurveTo(x - hw * 0.4, y + st * 0.15, x, y + st * 0.4);
        c.quadraticCurveTo(x + hw * 0.4, y + st * 0.15, x + hw * (0.85 + rnd() * 0.3), y + st * (0.45 + rnd() * 0.6));
        c.quadraticCurveTo(x + hw * 0.3, y - st * 0.1, x, y - st * 1.4); c.fill();
      }
      c.beginPath(); c.moveTo(x, by - H * 1.05); c.lineTo(x - 1.6, by - H * 0.88); c.lineTo(x + 1.6, by - H * 0.88); c.fill();
    }
    function birch(x, by, H) {
      var lean = (rnd() - 0.5) * H * 0.22, wd = 1.8 + H * 0.009;
      c.lineCap = 'round'; c.strokeStyle = 'rgba(206,212,224,0.4)'; c.lineWidth = 0.7;
      for (k = 0; k < 22; k++) {
        var f = 0.35 + rnd() * 0.65, yy = by - f * H, xx = x + lean * f * f, dir = rnd() < 0.5 ? -1 : 1, len = H * (0.12 + rnd() * 0.22) * (1.3 - f);
        c.beginPath(); c.moveTo(xx, yy); c.quadraticCurveTo(xx + dir * len * 0.45, yy - len * 0.75, xx + dir * len, yy - len * 0.35); c.stroke();
      }
      c.strokeStyle = 'rgba(214,216,216,0.82)'; c.lineWidth = wd;
      c.beginPath(); c.moveTo(x, by + 2); c.quadraticCurveTo(x + lean * 0.3, by - H * 0.5, x + lean, by - H); c.stroke();
      c.strokeStyle = '#0A1128'; c.lineWidth = 1; c.lineCap = 'butt';
      for (k = 0; k < H / 8; k++) {
        var f2 = rnd() * 0.9, y2 = by - f2 * H, x2 = x + lean * (0.6 * f2 * (1 - f2) + f2 * f2), l = wd * (0.3 + rnd() * 0.55), sd = rnd() < 0.5 ? -1 : 1;
        c.beginPath(); c.moveTo(x2 + sd * wd / 2, y2); c.lineTo(x2 + sd * (wd / 2 - l), y2 + rnd() - 0.5); c.stroke();
      }
    }
    // far trees are soft and pale, near trees sharp and dark: the way cold air really looks
    var cols = ['#22346A', '#17244F', '#0E1736', '#080E24'], soft = [2.4, 1.3, 0.5, 0];
    for (L = 0; L < 4; L++) {
      if (canBlur) c.filter = soft[L] ? 'blur(' + soft[L] + 'px)' : 'none';
      for (var x = x0 + rnd() * 30; x < w + 30; x += (portrait ? 15 : 22) * (1 + L * 0.55) * (0.5 + rnd())) {
        var fd = fade(x); if (rnd() > fd + 0.1 || (L > 1 && fd < 0.45)) continue;
        var H = Math.min(G * 0.9, G * (0.3 + L * 0.16) * (0.72 + rnd() * 0.5)) * (0.5 + 0.5 * fd);
        spruce(x, gy(x) + 2, H, cols[L]);
      }
      if (canBlur) c.filter = 'none';
      var mist = c.createLinearGradient(0, G * 0.3, 0, G);
      mist.addColorStop(0, 'rgba(140,165,215,0)'); mist.addColorStop(1, 'rgba(140,165,215,' + (0.16 - L * 0.03) + ')');
      c.fillStyle = mist; c.fillRect(0, G * 0.3, w, G * 0.7 + 4);
      if (L === 2) { var nb = portrait ? 2 : 4; for (i = 0; i < nb; i++) { var bx = portrait ? w * (0.12 + 0.7 * rnd()) : w * (0.52 + 0.44 * (i + rnd() * 0.6) / nb); if (Math.abs(bx - node.x) < R * 0.5) bx += R; birch(bx, gy(bx), G * (0.5 + rnd() * 0.2)); } }
    }
    // fine grain over the air, like film: it takes the digital edge off
    for (i = 0; i < w * G / 26; i++) { c.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.10)'; c.fillRect(rnd() * w, rnd() * G, 1, 1); }
    // the soil begins: ink, with a little depth just under the moss
    c.fillStyle = '#060A1A'; c.beginPath(); c.moveTo(0, gy(0));
    for (i = 0; i <= w + 6; i += 6) c.lineTo(i, gy(i));
    c.lineTo(w, h); c.lineTo(0, h); c.fill();
    var soil = c.createLinearGradient(0, G, 0, G + 80); soil.addColorStop(0, 'rgba(26,40,82,0.6)'); soil.addColorStop(1, 'rgba(26,40,82,0)');
    c.fillStyle = soil; c.fillRect(0, G - 2, w, 84);
    c.strokeStyle = '#8FAE6B'; c.lineWidth = 1.2; c.globalAlpha = 0.6; c.beginPath();
    for (i = 0; i <= w + 6; i += 6) { if (i) c.lineTo(i, gy(i)); else c.moveTo(i, gy(i)); }
    c.stroke(); c.lineWidth = 0.8;
    for (i = 0; i < (portrait ? 40 : 110); i++) { var tx = x0 + rnd() * (w - x0), th = 3 + rnd() * 8; c.globalAlpha = (0.25 + rnd() * 0.4) * fade(tx); c.beginPath(); c.moveTo(tx, gy(tx)); c.quadraticCurveTo(tx + (rnd() - 0.5) * 3, gy(tx) - th * 0.6, tx + (rnd() - 0.5) * 6, gy(tx) - th); c.stroke(); }
    c.globalAlpha = 1;
  }

  function hex(ctx, f) {   // the outline of the mark, grown outward: rings that follow the logo
    var P = [[50, 14.4], [84, 34], [84, 70.2], [50, 89.8], [16, 70.2], [16, 34]];
    ctx.beginPath();
    P.forEach(function (q, i) { var x = node.x + (q[0] - 50) * M * f, y = node.y + (q[1] - 52) * M * f; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
    ctx.closePath();
  }

  function ellipse(ctx, x, y, rx, ry) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); }
  function diamond(ctx, x, y, hw, hh) { ctx.beginPath(); ctx.moveTo(x, y - hh); ctx.lineTo(x + hw, y); ctx.lineTo(x, y + hh); ctx.lineTo(x - hw, y); ctx.closePath(); }

  function drawNode(ctx, t) {
    var k = 0.6, br = 1 + Math.sin(t * 0.9) * 0.018, i;
    ctx.save();
    // growth rings: one per request, following the outline of the mark
    ctx.lineWidth = 0.8; ctx.strokeStyle = GOLD; ctx.lineJoin = 'round';
    for (i = 0; i < Math.min(rings, 8); i++) { ctx.globalAlpha = 0.3 * (1 - i / 9); hex(ctx, (1.2 + i * 0.075) * br); ctx.stroke(); }
    // clean soil right under the mark, then the real mark itself
    ctx.globalAlpha = 1; ctx.fillStyle = '#060A1A'; hex(ctx, 1.1); ctx.fill();
    if (mark) ctx.drawImage(mark, node.x - 50 * M, node.y - 48 * M, 100 * M, 100 * M);
    // its gold ring breathes
    ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = LIGHT; ctx.lineWidth = 3.2; ctx.globalAlpha = 0.18 + 0.16 * Math.sin(t * 0.9);
    ellipse(ctx, node.x, node.y - 2 * M, 17.7 * M, 10.2 * M); ctx.stroke(); ctx.globalAlpha = 1;
    // the seal at the end of the curl
    var e = curl[curl.length - 1];
    ctx.strokeStyle = LIGHT; ctx.lineWidth = 1.4; ctx.globalAlpha = 0.6 + 0.4 * sealFlash;
    ctx.beginPath(); ctx.arc(curl.c.x, curl.c.y, R * 0.2 + sealFlash * 3, 0, Math.PI * 2); ctx.stroke();
    if (sealFlash > 0) Mycel.glowDot(ctx, e.x, e.y, 22, GOLD, sealFlash * 0.5);
    ctx.restore();
    if (opts.quiet) return;
    // labels (the same words exist as text in the page)
    ctx.save();
    ctx.font = '11px ' + MONO; ctx.fillStyle = MUT; ctx.textBaseline = 'middle';
    try { ctx.letterSpacing = '1.5px'; } catch (er) {}
    if (portrait) {
      ctx.textAlign = 'left'; ctx.fillText('OUTSIDE', 16, G + 22);
      ctx.fillStyle = LIGHT; ctx.textAlign = 'center'; ctx.fillText('THE LAYER', node.x, node.y - 50 * M - 12);
      ctx.fillStyle = GOLD; ctx.textAlign = 'center'; ctx.fillText('KEPT LOCAL', curl.c.x, curl.c.y + R * 0.95);
    } else {
      ctx.textAlign = 'center';
      ctx.fillStyle = LIGHT; ctx.fillText('THE LAYER  ·  DECIDES WHAT PASSES', node.x, node.y - 66 * M - 10);
      ctx.fillStyle = MUT;
      ctx.textAlign = 'right'; ctx.fillText('OUTSIDE  ·  FRONTIER AI', w - 28, G + 26);
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
        lx = node.x; ly = portrait ? node.y + 46 * M + 16 : node.y - 46 * M - 14;
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

  if (typeof TDS_MARK_SVG !== 'undefined') {
    var im = new Image();
    im.onload = function () { mark = im; if (!opts.forestOnly && (reduced || opts.still) && S) still(); };
    im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(TDS_MARK_SVG);
  }
  (function start() {
    var r = cv.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) { requestAnimationFrame(start); return; }
    build();
    if (opts.forestOnly) return;
    if (reduced || opts.still) still(); else Mycel.loop(cv, frame);
  })();
  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      if (Math.abs(cv.getBoundingClientRect().width - lastW) < 2) return;
      build(); if (!opts.forestOnly && (reduced || opts.still)) still();
    }, 180);
  });
}
