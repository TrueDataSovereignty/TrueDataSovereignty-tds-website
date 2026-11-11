/* flow: what follows the reader's scroll. The mark in the header, the gold line that opens each dark band,
   sections rising into place, and the "On this page" list on reading pages.
   With reduced motion, or with ?still, it does nothing: the page is whole without it. */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var top = document.querySelector('.top');
  // "On this page": mark the section being read. This is not motion, so it runs for everyone.
  var links = [].slice.call(document.querySelectorAll('.read-side nav a'));
  var secs = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
  function here() {
    var cur = 0;
    for (var i = 0; i < secs.length; i++) if (secs[i] && secs[i].getBoundingClientRect().top < innerHeight * 0.35) cur = i;
    links.forEach(function (a, i) { if (i === cur) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
  }
  if (links.length) { addEventListener('scroll', here, { passive: true }); here(); }
  if (reduce || /[?&]still/.test(location.search)) return;

  var root = document.documentElement, mark = document.querySelector('.top .mark');
  var bands = [].slice.call(document.querySelectorAll('div.marine'));
  root.classList.add('flow');
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ease(v) { return v * v * (3 - 2 * v); }
  var rise = [].slice.call(document.querySelectorAll('main section, main .route')).filter(function (s) {
    // sections rise into place as they enter; reading pages stay still under the eye, and what is already on screen is simply there
    return !s.closest('.read-body') && !s.querySelector('section') && s.getBoundingClientRect().top > innerHeight * 0.9;
  });
  rise.forEach(function (s) { s.classList.add('rv'); });
  function frame() {
    var y = window.scrollY || 0, max = root.scrollHeight - innerHeight;
    var p = max > 40 ? clamp(y / max) : 1;          // a page too short to scroll shows the whole mark
    if (top) top.classList.toggle('moved', y > 30);
    if (mark) {
      var q = clamp((p - 0.04) / 0.9);              // the roots finish a little before the very end
      mark.style.setProperty('--g', (0.5 + 0.5 * ease(clamp(max > 40 ? y / 260 : 1))).toFixed(3));   // the gold line settles first
      mark.style.setProperty('--q0', clamp(q / 0.12).toFixed(3));
      mark.style.setProperty('--q1', ease(clamp((q - 0.08) / 0.62)).toFixed(3));
      mark.style.setProperty('--q2', ease(clamp((q - 0.5) / 0.5)).toFixed(3));
    }
    for (var i = 0; i < bands.length; i++) {
      var t = bands[i].getBoundingClientRect().top;
      bands[i].style.setProperty('--in', ease(clamp((innerHeight - t) / (innerHeight * 0.6))).toFixed(3));
    }
    for (var k = rise.length - 1; k >= 0; k--) {
      if (rise[k].getBoundingClientRect().top < innerHeight * 0.9) { rise[k].classList.add('in'); rise.splice(k, 1); }
    }
  }
  // Scroll events already arrive once per frame, so the work is done right here: a few numbers and a handful of style writes.
  addEventListener('scroll', frame, { passive: true });
  addEventListener('resize', frame);
  frame();
})();
