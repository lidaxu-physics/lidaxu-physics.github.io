// Shared page behaviour: mobile menu and the homepage portrait year switch.
(function () {
  // Mobile menu: the same .menu element becomes a drop-down below 860px.
  var nav = document.querySelector('.nav');
  var toggle = nav && nav.querySelector('.menu-toggle');
  if (toggle) {
    var setOpen = function (open) {
      nav.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      setOpen(!nav.classList.contains('open'));
    });
    nav.querySelectorAll('.menu a').forEach(function (a) {
      a.addEventListener('click', function () { setOpen(false); });
    });
    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
  }

  // Portrait: buttons carry data-target, photos and captions carry data-year.
  var portrait = document.getElementById('portrait');
  if (portrait) {
    var buttons = portrait.querySelectorAll('[data-target]');
    var items = portrait.querySelectorAll('[data-year]');
    var years = Array.prototype.map.call(buttons, function (b) { return b.dataset.target; });
    var timer = null;

    var show = function (year) {
      buttons.forEach(function (b) {
        var on = b.dataset.target === year;
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      items.forEach(function (el) {
        var on = el.dataset.year === year;
        el.classList.toggle('active', on);
        if (el.tagName === 'P') el.setAttribute('aria-hidden', on ? 'false' : 'true');
      });
    };
    var stop = function () { clearInterval(timer); timer = null; };

    buttons.forEach(function (b) {
      b.addEventListener('click', function () { stop(); show(b.dataset.target); });
    });

    // Auto-cycle every 5 s until the visitor hovers or picks a year.
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      timer = setInterval(function () {
        var current = portrait.querySelector('[data-target].active').dataset.target;
        show(years[(years.indexOf(current) + 1) % years.length]);
      }, 5000);
      portrait.addEventListener('mouseenter', stop);
    }
  }

  // Bilibili episodes: swap the placeholder for the player on click or Enter/Space.
  document.querySelectorAll('.video[data-bvid]').forEach(function (box) {
    var load = function () {
      if (box.classList.contains('loaded')) return;
      var iframe = document.createElement('iframe');
      iframe.src = 'https://player.bilibili.com/player.html?bvid=' + box.dataset.bvid +
                   '&page=1&high_quality=1&danmaku=0&autoplay=1';
      iframe.title = box.getAttribute('aria-label') || 'Bilibili video';
      iframe.setAttribute('scrolling', 'no');
      iframe.setAttribute('allow', 'autoplay; fullscreen');
      iframe.setAttribute('allowfullscreen', 'true');
      box.innerHTML = '';
      box.appendChild(iframe);
      box.classList.add('loaded');
      box.removeAttribute('role');
      box.removeAttribute('tabindex');
    };
    box.addEventListener('click', load);
    box.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        load();
      }
    });
  });
})();
