/* Quiet scenes for the home page. Each one needs Mycel and draws only while on screen. */
var GOLD = '#DDB04A', DEEP = '#B8862B', LIGHT = '#F8DF9C', LINE = '#33488F', BLUE = '#5A72C4', TEAL = '#5FD9C6', MOSS = '#8FAE6B', MUT = '#AEB6CE', IVORY = '#F7F3EA', INK = '#060A1A';
var MONO = '"Cascadia Mono",Consolas,ui-monospace,Menlo,monospace';

/* Build a scene only when it is about to scroll into view. */
function lazy(el, fn) {
  if (!('IntersectionObserver' in window)) { fn(); return; }
  var io = new IntersectionObserver(function (e) { if (e[0].isIntersecting) { io.disconnect(); fn(); } }, { rootMargin: '300px' });
  io.observe(el);
}
function onResize(fn) {
  var t, lw = window.innerWidth;
  window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(function () { if (Math.abs(window.innerWidth - lw) > 2) { lw = window.innerWidth; fn(); } }, 200); });
}
function capLabel(ctx, txt, x, y, col, align) {
  ctx.save(); ctx.font = '11px ' + MONO; ctx.fillStyle = col; ctx.textAlign = align || 'left'; ctx.textBaseline = 'middle';
  try { ctx.letterSpacing = '1.5px'; } catch (e) {}
  ctx.fillText(txt, x, y); ctx.restore();
}

/* The problem: threads leave your side for a far shore. Now and then, an order reaches back along one. */
function SceneShore(cv) {
  var reduced = Mycel.reducedMotion() || /[?&]still/.test(location.search);
  var S, w, h, tree, paths, stat, pulses, order, orderT;
  function build() {
    S = Mycel.fit(cv, 2); w = S.w; h = S.h;
    var rand = Mycel.rng(1789), A = [], i, shoreX = w - (w < 760 ? 26 : 70);
    for (i = 0; i < (w < 760 ? 150 : 330); i++) { var x = rand() * (shoreX - 30); A.push({ x: x, y: h * 0.5 + (rand() - 0.5) * h * (0.9 - 0.62 * x / shoreX) }); }
    tree = Mycel.grow({ roots: [{ x: shoreX, y: h * 0.5 }], attractors: A, step: 7, reach: 110, kill: 15, rand: rand, iters: 500, jitter: 0.45 });
    paths = Mycel.leaves(tree).map(function (n) { return Mycel.measure(Mycel.pathToRoot(tree, n)); }).filter(function (p) { return p.len > w * 0.35; });
    stat = document.createElement('canvas'); stat.width = cv.width; stat.height = cv.height;
    var c = stat.getContext('2d'); c.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
    function mix(n) { return Math.max(0, Math.min(1, (n.x / shoreX - 0.35) / 0.45)); }
    Mycel.drawSegments(c, tree, 0, 1e9, { color: GOLD, glow: DEEP, maxW: 3, alpha: function (n, wd) { return (0.2 + 0.45 * Math.min(1, wd / 2.4)) * (1 - mix(n)); } });
    Mycel.drawSegments(c, tree, 0, 1e9, { color: BLUE, glow: LINE, maxW: 3, alpha: function (n, wd) { return (0.3 + 0.5 * Math.min(1, wd / 2.4)) * mix(n); } });
    // the far shore: a plain line. Somebody else's ground.
    c.strokeStyle = IVORY; c.globalAlpha = 0.55; c.lineWidth = 1; c.beginPath(); c.moveTo(shoreX, h * 0.08); c.lineTo(shoreX, h * 0.92); c.stroke(); c.globalAlpha = 1;
    capLabel(c, 'YOUR STAFF', 4, 14, MUT);
    capLabel(c, w < 760 ? 'A US SERVICE' : 'A US AI SERVICE', shoreX - 10, 14, MUT, 'right');
    pulses = []; order = null; orderT = 2.5;
  }
  function frame(dt) {
    var c = S.ctx, i; c.clearRect(0, 0, w, h); c.drawImage(stat, 0, 0, w, h);
    c.save(); c.globalCompositeOperation = 'lighter';
    if (!reduced && pulses.length < 12 && Math.random() < dt * 2.5) pulses.push({ p: paths[(Math.random() * paths.length) | 0], d: 0, v: 70 + Math.random() * 50 });
    for (i = pulses.length - 1; i >= 0; i--) { var q = pulses[i]; q.d += q.v * dt; if (q.d >= q.p.len) { pulses.splice(i, 1); continue; } var pos = Mycel.at(q.p, q.d); Mycel.glowDot(c, pos.x, pos.y, 7, LIGHT, 0.8); }
    c.restore();
    if (!order) { orderT -= dt; if (orderT <= 0 || reduced) order = { p: paths[(Math.random() * paths.length) | 0], d: 0 }; }
    if (order) {
      order.d += 90 * dt; if (reduced) order.d = order.p.len * 0.55;
      var L = order.p.len, head = L - Math.min(L, order.d), k;
      c.save(); c.strokeStyle = IVORY; c.lineWidth = 1.6; c.setLineDash([5, 5]); c.globalAlpha = Math.min(1, (L * 1.5 - order.d) / (L * 0.4));
      c.beginPath(); for (k = L; k >= head; k -= 6) { var a = Mycel.at(order.p, k); k === L ? c.moveTo(a.x, a.y) : c.lineTo(a.x, a.y); } c.stroke(); c.setLineDash([]);
      var hp = Mycel.at(order.p, head); capLabel(c, 'A US ORDER', Math.max(60, hp.x), hp.y - 16, IVORY, 'center'); c.restore();
      if (order.d > L * 1.5) { order = null; orderT = 4; }
    }
  }
  build(); if (reduced) frame(0); else Mycel.loop(cv, frame);
  onResize(function () { build(); if (reduced) frame(0); });
}

/* A small gate for the live scene. send(tier, n) lets n pulses arrive and leave by that route. */
function SceneMini(cv) {
  var reduced = Mycel.reducedMotion() || /[?&]still/.test(location.search);
  var S, w, h, vert, node, R, inb, out, inP, outP, curl, stat, pulses = [], queue = [], seal = 0, rings = 0, tierCol = TEAL;
  function ell(c, rx, ry) { c.beginPath(); c.ellipse(node.x, node.y, rx, ry, 0, 0, 6.3); }
  function build() {
    S = Mycel.fit(cv, 2); w = S.w; h = S.h; vert = w > h * 1.4;  // a wide band means the panes are stacked: flow runs top to bottom
    var rand = Mycel.rng(311), A = [], roots = [], i, a;
    node = { x: vert ? w * 0.42 : w * 0.5, y: h * 0.5 }; R = vert ? Math.min(h * 0.28, 40) : Math.min(w * 0.19, 44);
    if (vert) { for (i = 0; i < 70; i++) A.push({ x: rand() * w, y: rand() * (node.y - R * 0.7) }); for (i = 0; i < 3; i++) { a = -Math.PI * (0.25 + 0.25 * i); roots.push({ x: node.x + Math.cos(a) * R, y: node.y + Math.sin(a) * R * 0.6 }); } }
    else { for (i = 0; i < 110; i++) A.push({ x: rand() * (node.x - R * 1.15), y: h * 0.04 + rand() * h * 0.92 }); for (i = 0; i < 4; i++) { a = Math.PI * (0.7 + 0.2 * i); roots.push({ x: node.x + Math.cos(a) * R, y: node.y + Math.sin(a) * R * 0.6 }); } }
    inb = Mycel.grow({ roots: roots, attractors: A, step: 6, reach: 90, kill: 12, rand: rand, iters: 300, jitter: 0.5 });
    A = []; roots = [];
    if (vert) { for (i = 0; i < 14; i++) A.push({ x: w * 0.1 + rand() * w * 0.6, y: node.y + R * 0.7 + rand() * (h - node.y - R * 0.7) }); for (i = 0; i < 2; i++) { a = Math.PI * (0.35 + 0.3 * i); roots.push({ x: node.x + Math.cos(a) * R, y: node.y + Math.sin(a) * R * 0.6 }); } }
    else { for (i = 0; i < 16; i++) A.push({ x: node.x + R * 1.15 + rand() * (w - node.x - R * 1.15), y: h * 0.2 + rand() * h * 0.5 }); for (i = 0; i < 2; i++) { a = Math.PI * (-0.15 + 0.3 * i); roots.push({ x: node.x + Math.cos(a) * R, y: node.y + Math.sin(a) * R * 0.6 }); } }
    out = Mycel.grow({ roots: roots, attractors: A, step: 6, reach: 200, kill: 12, rand: rand, iters: 200, jitter: 0.3 });
    function P(nodes, rev) { return Mycel.leaves(nodes).map(function (n) { var p = Mycel.pathToRoot(nodes, n); if (rev) p.reverse(); return Mycel.measure(p); }).filter(function (p) { return p.len > R * 0.8; }); }
    inP = P(inb); outP = P(out, true);
    var c0 = vert ? { x: node.x + R * 2.9, y: node.y + R * 0.15 } : { x: node.x + R * 0.2, y: node.y + R * 2.3 };
    var st = vert ? { x: node.x + R, y: node.y } : { x: node.x, y: node.y + R * 0.6 }; curl = [st];
    var a0 = Math.atan2(st.y - c0.y, st.x - c0.x), r0 = Math.hypot(st.x - c0.x, st.y - c0.y);
    for (i = 1; i <= 70; i++) { var f = i / 70, rr = Math.min(r0 * (1 - f) + R * 0.22 * f, R * 0.95 * (1 - f) + R * 0.22); curl.push({ x: c0.x + Math.cos(a0 + f * 9.6) * rr, y: c0.y + Math.sin(a0 + f * 9.6) * rr * 0.8 }); }
    Mycel.measure(curl); curl.c = c0;
    stat = document.createElement('canvas'); stat.width = cv.width; stat.height = cv.height;
    var c = stat.getContext('2d'); c.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
    Mycel.drawSegments(c, inb, 0, 1e9, { color: GOLD, glow: DEEP, maxW: 2.6, alpha: function (n, wd) { return 0.3 + 0.5 * Math.min(1, wd / 2.2); } });
    Mycel.drawSegments(c, out, 0, 1e9, { color: BLUE, glow: LINE, maxW: 2, alpha: function () { return 0.6; } });
    c.strokeStyle = GOLD; c.globalAlpha = 0.6; c.lineWidth = 1.3; c.beginPath(); curl.forEach(function (p, i) { i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y); }); c.stroke();
  }
  function frame(dt, t) {
    var c = S.ctx, i, hw = R * 0.66, hh = hw * 0.576;
    c.clearRect(0, 0, w, h); c.drawImage(stat, 0, 0, w, h);
    c.save(); c.globalCompositeOperation = 'lighter';
    for (i = queue.length - 1; i >= 0; i--) { queue[i].wait -= dt; if (queue[i].wait <= 0) { pulses.push({ p: inP[(Math.random() * inP.length) | 0], d: 0, v: 90, col: LIGHT, ph: 'in', tier: queue[i].tier }); queue.splice(i, 1); } }
    for (i = pulses.length - 1; i >= 0; i--) {
      var q = pulses[i]; q.d += q.v * dt;
      if (q.d >= q.p.len) { pulses.splice(i, 1);
        if (q.ph === 'in') { rings++; pulses.push(q.tier === 3 ? { p: curl, d: 0, v: 80, col: LIGHT, ph: 'curl' } : { p: outP[(Math.random() * outP.length) | 0], d: 0, v: 90, col: q.tier === 2 ? MOSS : TEAL, ph: 'out', soft: q.tier === 2 }); }
        else if (q.ph === 'curl') seal = 1; continue; }
      var pos = Mycel.at(q.p, q.d); Mycel.glowDot(c, pos.x, pos.y, q.soft ? 16 : 8, q.col, q.soft ? 0.45 : 0.9);
    }
    c.restore();
    seal = Math.max(0, seal - dt * 0.7);
    c.save(); c.fillStyle = INK; ell(c, R * 0.98, R * 0.59); c.fill();
    c.strokeStyle = GOLD; c.lineWidth = 0.7; for (i = 0; i < Math.min(rings, 8); i++) { c.globalAlpha = 0.3 * (1 - i / 9); ell(c, R + 5 + i * 4.5, (R + 5 + i * 4.5) * 0.6); c.stroke(); }
    c.globalAlpha = 1; var Mm = R * 2.5 / 100; if (SceneMini.mark) c.drawImage(SceneMini.mark, node.x - 50 * Mm, node.y - 48 * Mm, 100 * Mm, 100 * Mm);
    c.strokeStyle = LIGHT; c.lineWidth = 1.3; c.globalAlpha = 0.55 + 0.45 * seal; c.beginPath(); c.arc(curl.c.x, curl.c.y, R * 0.22 + seal * 3, 0, 6.3); c.stroke();
    c.restore();
  }
  build(); if (reduced) frame(0, 0); else Mycel.loop(cv, frame);
  onResize(function () { build(); pulses = []; if (reduced) frame(0, 0); });
  return { send: function (tier, n) { if (reduced) return; for (var i = 0; i < n; i++) queue.push({ tier: tier, wait: i * 0.22 }); } };
}

if (typeof TDS_MARK_SVG !== 'undefined') { (function () { var im = new Image(); im.onload = function () { SceneMini.mark = im; }; im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(TDS_MARK_SVG); })(); }

/* The rings: each real audit record as one growth ring, shaped by its own chain hash. */
function SceneRings(cv, rec, btns, cases) {
  var reduced = Mycel.reducedMotion() || /[?&]still/.test(location.search);
  var C = cases, S, w, h, c0, R0, active = reduced ? C.length - 1 : 0, removed = -1, timer = 0, born = C.map(function () { return reduced ? 1 : 0; });
  var TIER = { 1: ['Mask', TEAL], 2: ['Generalise', MOSS], 3: ['Keep local', LIGHT] };
  function shape(hash) {
    var b = []; for (var i = 0; i < 24; i += 2) b.push(parseInt(hash.substr(i, 2), 16) / 255);
    return function (th) { var s = 0; for (var k = 0; k < 5; k++) s += (b[k] - 0.5) * Math.sin(th * (k + 2) + b[k + 5] * 6.283) / (k + 1.5); return s; };
  }
  // the first record has no parent (its prev_hash is all zeros), so its shape comes from the next record's hash, which is its own
  var shapes = C.map(function (c, i) { return shape(i + 1 < C.length ? C[i + 1].audit.prev_hash : c.audit.prev_hash.split('').reverse().join('')); });
  function build() { S = Mycel.fit(cv, 2); w = S.w; h = S.h; c0 = { x: w * 0.5, y: h * 0.5 }; R0 = Math.min(w, h) * 0.45; }
  function ringR(i) { return R0 * (0.2 + 0.8 * (i + 1) / (C.length + 0.35)); }
  function drawRing(ctx, i, grow) {
    var base = ringR(i), inner = i ? ringR(i - 1) : R0 * 0.07, f = shapes[i], col = TIER[C[i].tier][1];
    var broken = removed >= 0 && i > removed, gone = i === removed, on = i === active, lines = 9, k, th;
    for (k = 0; k < lines; k++) {
      var u = k / (lines - 1), r = inner + (base - inner) * (0.14 + 0.86 * u), end = 6.283 * Math.min(1, grow), edge = k === lines - 1;
      ctx.beginPath();
      for (th = 0; th <= end + 0.001; th += 0.035) {
        var rr = r * (1 + f(th) * 0.075 * (0.5 + u * 0.5)) + Math.sin(th * 23 + k * 1.7 + i) * 0.7;
        var x = c0.x + Math.cos(th - 1.57) * rr, y = c0.y + Math.sin(th - 1.57) * rr; th ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      if (grow >= 1) ctx.closePath();
      ctx.strokeStyle = gone ? LINE : broken ? IVORY : edge ? col : (k % 3 === 0 ? DEEP : '#6E500E');
      ctx.globalAlpha = gone ? 0.4 : broken ? (edge ? 0.5 : 0.14) : edge ? (on ? 1 : 0.8) : (on ? 0.6 : 0.36);
      ctx.lineWidth = edge ? (on ? 2.4 : 1.4) : 0.8; ctx.setLineDash(gone ? [2, 7] : broken ? [9, 6] : []); ctx.stroke();
    }
    ctx.setLineDash([]); ctx.globalAlpha = 1;
  }
  function frame(dt, t) {
    var ctx = S.ctx, i; ctx.clearRect(0, 0, w, h);
    for (i = 0; i < C.length; i++) { if (!reduced && i <= active && born[i] < 1) born[i] = Math.min(1, born[i] + dt / 1.6); if (born[i] > 0) drawRing(ctx, i, born[i]); }
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; var br = 1.035 + Math.sin(t * 0.9) * 0.006;
    ctx.strokeStyle = DEEP; ctx.globalAlpha = 0.25; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(c0.x, c0.y, R0 * br, 0, 6.3); ctx.stroke();
    ctx.strokeStyle = LIGHT; ctx.globalAlpha = 1; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(c0.x, c0.y, R0 * br, 0, 6.3); ctx.stroke();
    Mycel.glowDot(ctx, c0.x, c0.y, R0 * 0.06, GOLD, 0.9); ctx.restore();
    if (!reduced && removed < 0) { timer += dt; if (timer > 3.4) { timer = 0; show((active + 1) % C.length); } }
  }
  function show(i) {
    active = i; var a = C[i].audit, n = Object.keys(a.entity_counts).map(function (k) { return k + ' ' + a.entity_counts[k]; }).join(', ') || 'none';
    var out = a.destination === 'ollama' ? 'a local model, nothing sent out' : 'a frontier model, ' + (C[i].tier === 1 ? 'masked' : 'generalised');
    rec.innerHTML = removed >= 0 && i > removed
      ? '<span class="broken">Ring ' + (i + 1) + ' no longer fits. It was grown on the ring you took out, and its record carries that ring’s fingerprint. The gap shows in every ring outside it.</span>'
      : '<b>Ring ' + (i + 1) + ' of ' + C.length + ' · ' + a.request_id + '</b><br>route: ' + TIER[C[i].tier][0] + ' (tier ' + a.tier + ', rule ' + a.rule + ')<br>found: ' + n + '<br>went to: ' + out +
        '<br>grown on: <span class="h">' + a.prev_hash.slice(0, 24) + '…</span><br>text stored: none<br>Synthetic example (router a822605)';
    btns.querySelectorAll('button[data-i]').forEach(function (b, k) { b.setAttribute('aria-pressed', k === i); });
  }
  C.forEach(function (c, i) {
    var b = document.createElement('button'); b.type = 'button'; b.dataset.i = i; b.textContent = 'ring ' + (i + 1);
    b.addEventListener('click', function () { timer = -8; born = born.map(function (v, k) { return k <= i ? 1 : v; }); show(i); if (reduced) frame(0, 0); });
    btns.appendChild(b);
  });
  var rm = document.createElement('button'); rm.type = 'button'; rm.className = 'take'; rm.textContent = 'Take ring 2 out';
  rm.addEventListener('click', function () {
    removed = removed < 0 ? 1 : -1; rm.textContent = removed < 0 ? 'Take ring 2 out' : 'Put it back';
    born = born.map(function () { return 1; }); show(removed < 0 ? 1 : 2); timer = 0; if (reduced) frame(0, 0);
  });
  btns.appendChild(rm);
  build(); show(active); if (reduced) frame(0, 0); else Mycel.loop(cv, frame);
  onResize(function () { build(); if (reduced) frame(0, 0); });
}

/* The live interception: real router output, one request at a time. */
function SceneLive(root, data) {
  var reduced = Mycel.reducedMotion() || /[?&]still/.test(location.search);
  var $ = function (s) { return root.querySelector(s); };
  var paneIn = $('#lv-in'), paneOut = $('#lv-out'), paneAns = $('#lv-ans'), verdict = $('#lv-verdict'), steps = root.querySelectorAll('#lv-steps li'), tabs = $('#lv-cases'), outH = $('#lv-out-h'), ansNote = $('#lv-ans-note');
  var mini = SceneMini($('#lv-cv')), timers = [], cur = 0;
  var order = ['email', 'generalise', 'vault', 'sv-email'], label = { email: 'A customer e-mail with bank details', generalise: 'A supplier e-mail with telling details', vault: 'A confidential deal', 'sv-email': 'Swedish example: an e-mail with a personnummer' };
  var cases = order.map(function (k) { return data.cases.filter(function (c) { return c.key === k; })[0]; });
  var TIER = { 1: ['Mask', 't1'], 2: ['Generalise', 't2'], 3: ['Keep local', 't3'] };
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function later(ms, fn) { timers.push(setTimeout(fn, reduced ? 0 : ms)); }
  function step(n) { steps.forEach(function (li, i) { li.classList.toggle('on', i === n); li.classList.toggle('done', i < n); }); }
  function swap(tok, txt, cls, i, gap) { later(i * gap, function () { tok.classList.add('go'); later(230, function () { tok.textContent = txt; tok.className = 'tok ' + cls; }); }); }
  function play(i) {
    timers.forEach(clearTimeout); timers = []; cur = i;
    var c = cases[i], found = c.parts.filter(function (p) { return 'a' in p; });
    tabs.querySelectorAll('button').forEach(function (b, k) { b.setAttribute('aria-pressed', k === i); });
    paneIn.textContent = ''; paneOut.textContent = ''; paneAns.textContent = ''; verdict.textContent = ''; verdict.className = 'verdict'; ansNote.textContent = '';
    var gloss = $('#lv-gloss'); if (gloss) gloss.textContent = c.key === 'sv-email' ? 'Swedish example. In English, it asks: translate this e-mail into English. The writer sends a CV before an interview and gives a personal identity number (personnummer) for the background check.' : '';
    outH.textContent = c.tier === 3 ? 'What was sent out' : 'What the model sees';
    c.parts.forEach(function (p) { paneIn.appendChild('a' in p ? el('span', 'tok raw', p.a) : document.createTextNode(p.lit)); });
    step(0);
    later(900, function () {
      step(1); verdict.textContent = TIER[c.tier][0] + ' · tier ' + c.tier + ', rule ' + c.rule; verdict.className = 'verdict ' + TIER[c.tier][1];
      mini.send(c.tier, Math.max(3, found.length));
      if (c.tier === 3) { paneOut.appendChild(el('span', 'none', 'Nothing. This request stayed on this side.')); return; }
      var toks = [];
      c.parts.forEach(function (p) { if ('a' in p) { var t = el('span', 'tok raw', p.a); toks.push([t, p]); paneOut.appendChild(t); } else paneOut.appendChild(document.createTextNode(p.lit)); });
      toks.forEach(function (tp, k) { swap(tp[0], tp[1].b, tp[1].kind === 'masked' ? 'ph' : 'wide', k + 1, 380); });
    });
    var t2 = 900 + (c.tier === 3 ? 1800 : (found.length + 2) * 380 + 500);
    later(t2, function () {
      step(2);
      if (c.tier === 3) { paneAns.appendChild(el('span', 'none', 'A local model answers here, on your own machine.')); ansNote.textContent = 'The local model is selected, not yet installed, so this example has no answer to show yet.'; later(1200, function () { step(3); }); return; }
      var toks = [];
      c.ans_parts.forEach(function (p) { if ('a' in p) { var t = el('span', 'tok ph', p.a); toks.push([t, p]); paneAns.appendChild(t); } else paneAns.appendChild(document.createTextNode(p.lit)); });
      ansNote.textContent = 'Example answer, written by us with the placeholders in it. No model was called. Putting the real details back is the router’s own work.' + (c.tier === 2 ? ' Blurred details stay blurred.' : '');
      later(1500, function () { step(3); toks.forEach(function (tp, k) { swap(tp[0], tp[1].b, 'raw', k, 320); }); });
    });
  }
  cases.forEach(function (c, i) { var b = el('button', '', label[c.key]); b.type = 'button'; b.addEventListener('click', function () { play(i); }); tabs.appendChild(b); });
  $('#lv-replay').addEventListener('click', function () { play(cur); });
  play(0);
}
