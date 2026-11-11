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
  var threads = [];
  function makeThread(sec, k) {
    var W = phone() ? 62 : 118, H = phone() ? 112 : 196, rand = Mycel.rng(97 + k * 131), A = [], i;
    for (i = 0; i < 30; i++) { var y = 12 + rand() * (H - 16), sp = 0.16 + 0.84 * (y / H); A.push({ x: W / 2 + (rand() - 0.5) * W * sp, y: y }); }
    var net = Mycel.grow({ roots: [{ x: W / 2, y: 0 }], attractors: A, step: 4.2, reach: 70, kill: 8, rand: rand, iters: 200, jitter: 0.7 });
    var deep = net[0]; net.forEach(function (n) { if (n.y > deep.y) deep = n; });
    var path = Mycel.measure(Mycel.pathToRoot(net, deep).reverse());
    var box = document.createElement('div'); box.className = 'weave'; box.setAttribute('aria-hidden', 'true'); box.style.width = W + 'px'; box.style.height = H + 'px';
    var clip = document.createElement('div'); clip.className = 'weave-clip';
    var cv = document.createElement('canvas'); cv.style.width = W + 'px'; cv.style.height = H + 'px';
    var bead = document.createElement('i');
    clip.appendChild(cv); box.appendChild(clip); box.appendChild(bead); main.appendChild(box);
    var dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = W * dpr; cv.height = H * dpr;
    var c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.lineCap = 'round'; c.strokeStyle = '#C79A3A';
    net.forEach(function (n) {
      if (n.p < 0) return; var P = net[n.p]; c.globalAlpha = 0.5 + 0.45 * Math.min(1, n.w / 14); c.lineWidth = Math.max(0.6, Math.min(1.7, 0.45 + Math.sqrt(n.w) * 0.16));
      var mx = (P.x + n.x) / 2, my = (P.y + n.y) / 2; c.beginPath();
      if (P.p >= 0) { var G = net[P.p]; c.moveTo((G.x + P.x) / 2, (G.y + P.y) / 2); c.quadraticCurveTo(P.x, P.y, mx, my); } else { c.moveTo(P.x, P.y); c.lineTo(mx, my); }
      if (n.kids === 0) c.lineTo(n.x, n.y); c.stroke();
    });
    return { sec: sec, box: box, clip: clip, cv: cv, bead: bead, path: path, H: H, W: W, top: 0, p: -1 };
  }
  function place() {   // where each thread sits: across the top edge of its section, toward the right, where the page is quiet
    var m = main.getBoundingClientRect();
    threads.forEach(function (t) {
      var r = t.sec.getBoundingClientRect(), pad = Math.max(22, Math.min(150, innerWidth * 0.09));
      t.top = r.top - m.top - t.H * 0.5;
      t.box.style.top = Math.round(t.top) + 'px';
      t.box.style.left = Math.round(innerWidth - pad - t.W - (phone() ? 0 : 36)) + 'px';
    });
  }
  function drawThread(t, p) {
    if (Math.abs(p - t.p) < 0.002) return; t.p = p;
    var e = ease(p), off = (1 - e) * t.H;
    t.clip.style.transform = 'translate3d(0,' + (-off).toFixed(1) + 'px,0)';
    t.cv.style.transform = 'translate3d(0,' + off.toFixed(1) + 'px,0)';
    var at = Mycel.at(t.path, t.path.len * e);
    t.bead.style.transform = 'translate3d(' + (at.x - 3.5).toFixed(1) + 'px,' + (at.y - 3.5).toFixed(1) + 'px,0)';
    t.bead.style.opacity = (Math.min(1, p * 8) * Math.min(1, (1 - p) * 5)).toFixed(2);
  }
  function build() {
    threads.forEach(function (t) { t.box.remove(); });
    threads = secs.map(makeThread); place();
    if (still) threads.forEach(function (t) { t.bead.style.display = 'none'; });
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
      drawThread(t, clamp((vh * 0.86 - y) / (vh * 0.5)));
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
