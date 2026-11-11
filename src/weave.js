/* weave: what ties the landing page together while you scroll.
   1. A thin thread of mycelium grows across each section boundary, and a gold bead rides down it.
   2. Each section comes into focus as it enters (it slides in a little and clears), and dims once you have read past it.
   3. One line holds the screen for a moment: the gate statement.
   Everything is driven by the scroll position, with transform and opacity only. With reduced motion, with ?still or
   without scripts, the page is whole and still: threads are simply drawn, nothing is pinned, nothing is dimmed. Needs Mycel. */
(function () {
  'use strict';
  var root = document.documentElement, main = document.getElementById('main');
  if (!main || !window.Mycel) return;
  var still = Mycel.reducedMotion() || /[?&]still/.test(location.search);
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ease(v) { return v * v * (3 - 2 * v); }
  var phone = function () { return innerWidth < 760; };
  var secs = [].slice.call(main.querySelectorAll('section.sec')).filter(function (s) { return !/padding-top:\s*0/.test(s.getAttribute('style') || ''); });

  /* ---- 1. the threads ---- */
  /* One family, several characters: the same gold, the same fine line, but each edge grows its own way.
     fan: a fine fan that opens downward. runner: one long thread with a few short side shoots. web: a low, dense root web.
     burst: a short burst of tips. line: no thread at all, a gold ball runs left to right along the edge and lights it.
     at: where it sits across the page (0 left, 1 right). pace: how much scrolling it takes (1 = half a screen). */
  var PLAN = { vision: ['fan', 1, 1], problem: ['runner', 1, 1.5], gate: ['burst', 0.5, 0.75], live: ['line', 0, 1.6], rings: ['web', 1, 1.2],
    proof: ['fan', 0.5, 0.9], products: ['burst', 0.3, 0.7], pilot: ['runner', 1, 1.3], contact: ['web', 0.5, 1.1] };
  var threads = [];
  function shape(kind, rand) {
    var ph = phone(), W, H, n, A = [], i, y, o = { step: 4.2, jitter: 0.7, kill: 8 };
    if (kind === 'runner') { W = ph ? 46 : 74; H = ph ? 150 : 270; n = 18; o.jitter = 0.45; o.kill = 7;
      for (i = 0; i < n; i++) { y = 10 + (i + rand()) / n * (H - 14); A.push({ x: W / 2 + Math.sin(y / H * 5.2) * W * 0.24 + (rand() - 0.5) * W * 0.16, y: y }); } }
    else if (kind === 'web') { W = ph ? 112 : 210; H = ph ? 96 : 150; n = ph ? 46 : 78; o.step = 3.6; o.jitter = 1.0; o.kill = 6;
      for (i = 0; i < n; i++) A.push({ x: 4 + rand() * (W - 8), y: 10 + rand() * (H - 14) }); }
    else if (kind === 'burst') { W = ph ? 84 : 136; H = ph ? 70 : 100; n = 24; o.step = 3.8; o.jitter = 0.6; o.kill = 6;
      for (i = 0; i < n; i++) { var an = Math.PI * (0.12 + 0.76 * rand()), r = (0.5 + 0.5 * rand()) * (H - 6); A.push({ x: W / 2 + Math.cos(an) * r * (W / 2 - 3) / (H - 6), y: 2 + Math.sin(an) * r }); } }
    else { W = ph ? 62 : 118; H = ph ? 112 : 196; n = 30;
      for (i = 0; i < n; i++) { y = 12 + rand() * (H - 16); A.push({ x: W / 2 + (rand() - 0.5) * W * (0.16 + 0.84 * y / H), y: y }); } }
    o.W = W; o.H = H; o.A = A; return o;
  }
  function makeThread(sec, k) {
    var plan = PLAN[sec.id] || ['fan', 1, 1], kind = plan[0];
    var box = document.createElement('div'); box.className = 'weave'; box.setAttribute('aria-hidden', 'true');
    var bead = document.createElement('i');
    if (kind === 'line') {   // the gold ball on the cut-off line
      var trail = document.createElement('b'); box.className = 'weave weave-line'; box.appendChild(trail); box.appendChild(bead); main.appendChild(box);
      return { sec: sec, box: box, bead: bead, trail: trail, line: true, H: 16, W: 0, at: 0, pace: plan[2], top: 0, p: -1 };
    }
    var rand = Mycel.rng(97 + k * 131), s = shape(kind, rand), W = s.W, H = s.H;
    var net = Mycel.grow({ roots: [{ x: W / 2, y: 0 }], attractors: s.A, step: s.step, reach: 70, kill: s.kill, rand: rand, iters: 220, jitter: s.jitter });
    var deep = net[0]; net.forEach(function (n) { if (n.y > deep.y) deep = n; });
    var path = Mycel.measure(Mycel.pathToRoot(net, deep).reverse());
    box.style.width = W + 'px'; box.style.height = H + 'px';
    var clip = document.createElement('div'); clip.className = 'weave-clip';
    var cv = document.createElement('canvas'); cv.style.width = W + 'px'; cv.style.height = H + 'px';
    clip.appendChild(cv); box.appendChild(clip); box.appendChild(bead); main.appendChild(box);
    var dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = W * dpr; cv.height = H * dpr;
    var c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.lineCap = 'round'; c.strokeStyle = '#C79A3A';
    net.forEach(function (n) {
      if (n.p < 0) return; var P = net[n.p]; c.globalAlpha = 0.5 + 0.45 * Math.min(1, n.w / 14); c.lineWidth = Math.max(0.6, Math.min(1.7, 0.45 + Math.sqrt(n.w) * 0.16));
      var mx = (P.x + n.x) / 2, my = (P.y + n.y) / 2; c.beginPath();
      if (P.p >= 0) { var G = net[P.p]; c.moveTo((G.x + P.x) / 2, (G.y + P.y) / 2); c.quadraticCurveTo(P.x, P.y, mx, my); } else { c.moveTo(P.x, P.y); c.lineTo(mx, my); }
      if (n.kids === 0) c.lineTo(n.x, n.y); c.stroke();
    });
    return { sec: sec, box: box, clip: clip, cv: cv, bead: bead, path: path, H: H, W: W, at: plan[1], pace: plan[2], top: 0, p: -1 };
  }
  function place() {   // where each one sits: across the top edge of its section. Never lower than the section's own top space, so it meets no text.
    var m = main.getBoundingClientRect(), full = main.clientWidth, pad = Math.max(22, Math.min(150, full * 0.09));
    threads.forEach(function (t) {
      var r = t.sec.getBoundingClientRect();
      if (t.line) { t.W = full; t.top = r.top - m.top - 8; t.box.style.top = Math.round(t.top) + 'px'; t.box.style.left = '0'; t.box.style.width = full + 'px'; return; }
      var space = parseFloat(getComputedStyle(t.sec).paddingTop) || 88, down = t.at >= 0.99 ? t.H * 0.5 : Math.min(t.H * 0.5, space - 14);
      t.top = r.top - m.top - (t.H - down);
      t.box.style.top = Math.round(t.top) + 'px';
      t.box.style.left = Math.round(pad + (full - 2 * pad - t.W) * t.at - (t.at >= 0.99 && !phone() ? 36 : 0)) + 'px';
    });
  }
  function drawThread(t, p) {
    if (Math.abs(p - t.p) < 0.002) return; t.p = p;
    var e = ease(p);
    if (t.line) {   // the ball runs along the edge and the line lights up behind it
      t.trail.style.transform = 'scaleX(' + e.toFixed(4) + ')';
      t.bead.style.transform = 'translate3d(' + (e * (t.W - 11)).toFixed(1) + 'px,0,0)';
      t.bead.style.opacity = (Math.min(1, p * 10) * Math.min(1, (1 - p) * 8)).toFixed(2);
      return;
    }
    var off = (1 - e) * t.H;
    t.clip.style.transform = 'translate3d(0,' + (-off).toFixed(1) + 'px,0)';
    t.cv.style.transform = 'translate3d(0,' + off.toFixed(1) + 'px,0)';
    var at = Mycel.at(t.path, t.path.len * e);
    t.bead.style.transform = 'translate3d(' + (at.x - 3.5).toFixed(1) + 'px,' + (at.y - 3.5).toFixed(1) + 'px,0)';
    t.bead.style.opacity = (Math.min(1, p * 8) * Math.min(1, (1 - p) * 5)).toFixed(2);
  }
  function build() {
    threads.forEach(function (t) { t.box.remove(); });
    threads = secs.map(makeThread); place();
    if (still) threads.forEach(function (t) { t.bead.style.display = 'none'; if (t.line) t.trail.style.transform = 'none'; });
  }
  var lastW = innerWidth;
  build();
  if (still) return;

  /* ---- 2 and 3. focus, and the line that holds ---- */
  root.classList.add('weave-on');
  var beat = document.getElementById('gate'), beatIn = null, rule = null;
  if (beat) {   // the gate statement holds the screen for about half a screen of scrolling
    beatIn = document.createElement('div'); beatIn.className = 'beat-in';
    while (beat.firstChild) beatIn.appendChild(beat.firstChild);
    rule = document.createElement('span'); rule.className = 'beat-rule'; beatIn.appendChild(rule);
    beat.appendChild(beatIn); beat.classList.add('beat');
  }
  var focus = secs.filter(function (s) { return s !== beat; });
  focus.forEach(function (s) { s.classList.add('fx'); });
  place();

  function frame() {
    var vh = innerHeight, m = main.getBoundingClientRect().top, i;
    for (i = 0; i < threads.length; i++) {
      var t = threads[i], y = m + t.top;
      if (y > vh + 40 || y + t.H < -vh) { if (y > vh + 40) drawThread(t, 0); else drawThread(t, 1); continue; }
      drawThread(t, clamp((vh * 0.86 - y) / (vh * 0.5 * t.pace)));
    }
    for (i = 0; i < focus.length; i++) {
      var s = focus[i], r = s.getBoundingClientRect();
      if (r.top > vh * 1.2 || r.bottom < -vh * 0.4) continue;
      var en = ease(clamp((vh * 0.96 - r.top) / (vh * 0.42))), out = clamp((vh * 0.34 - r.bottom) / (vh * 0.34));
      s.style.opacity = (en * (1 - 0.6 * out)).toFixed(3);
      s.style.transform = en > 0.999 ? 'none' : 'translate3d(' + (-(1 - en) * 34).toFixed(1) + 'px,' + ((1 - en) * 16).toFixed(1) + 'px,0)';
    }
    if (beat) {
      var b = beat.getBoundingClientRect(), span = Math.max(1, b.height - vh), q = clamp(-b.top / span), inn = ease(clamp((vh * 0.9 - b.top) / (vh * 0.5)));
      var h = beatIn.children;   // label, heading, the line under it: they arrive one after the other, and the rule draws across
      for (var k = 0; k < h.length; k++) {
        if (h[k] === rule) continue;
        var a = k < 2 ? inn : ease(clamp((q - 0.12 - (k - 2) * 0.16) / 0.3));
        h[k].style.opacity = (a * (1 - 0.75 * ease(clamp((q - 0.86) / 0.14)))).toFixed(3);
        h[k].style.transform = 'translate3d(' + (-(1 - a) * 30).toFixed(1) + 'px,0,0)';
      }
      rule.style.transform = 'scaleX(' + ease(clamp((q - 0.05) / 0.75)).toFixed(3) + ')';
    }
  }
  addEventListener('scroll', frame, { passive: true });
  addEventListener('resize', function () { if (Math.abs(innerWidth - lastW) > 2) { lastW = innerWidth; build(); } else place(); frame(); });
  if (window.ResizeObserver) new ResizeObserver(function () { place(); frame(); }).observe(main);   // a section that changes height moves the ones below it
  addEventListener('load', function () { place(); frame(); });
  frame();
})();
