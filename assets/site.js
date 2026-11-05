// Shared page behaviour: leaves behind the page, mobile menu and the homepage portrait year switch.
(function () {
  // Leaves in the wind (snow in winter) behind every page: the wide picture on a wide screen, the tall one on a tall screen,
  // in the season the visitor picked (summer unless they chose another). A still picture for less motion or less data.
  var assets = document.currentScript.src;
  var wide = window.matchMedia('(min-aspect-ratio: 1/1)').matches;
  var zh = (document.documentElement.lang || '').indexOf('zh') === 0;
  var seasons = [['summer', 'Summer', '夏'], ['autumn', 'Autumn', '秋'], ['winter', 'Winter', '冬']];
  var season = 'summer';
  try {
    var saved = localStorage.getItem('bg-season');
    if (seasons.some(function (s) { return s[0] === saved; })) season = saved;
  } catch (e) {}
  var picture = function (s) {
    return new URL('../images/leaves_bg' + (s === 'summer' ? '' : '_' + s) + (wide ? '_wide' : ''), assets).href;
  };
  var still = (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) ||
              (navigator.connection && navigator.connection.saveData);
  var bg = document.createElement(still ? 'img' : 'video');
  bg.className = 'page-bg';
  bg.setAttribute('aria-hidden', 'true');
  if (still) {
    bg.alt = '';
  } else {
    bg.muted = true;
    bg.loop = true;
    bg.autoplay = true;
    bg.playsInline = true;
    bg.setAttribute('playsinline', '');
  }
  var showSeason = function (s) {
    bg.setAttribute('data-season', s);
    if (still) {
      bg.src = picture(s) + '.jpg';
      return;
    }
    bg.poster = picture(s) + '.jpg';
    bg.src = picture(s) + '.mp4';
    var playing = bg.play();
    if (playing && playing.catch) playing.catch(function () {});
  };
  showSeason(season);
  document.body.insertBefore(bg, document.body.firstChild);

  // The season switch: in the top bar beside EN | 中文 and like it, on computers and phones (site.css).
  var pick = document.createElement('div');
  pick.className = 'season';
  pick.setAttribute('role', 'group');
  pick.setAttribute('aria-label', zh ? '背景季节' : 'Background season');
  seasons.forEach(function (s) {
    var b = document.createElement('button');
    b.type = 'button';
    var full = document.createElement('span');
    full.className = 'long';
    full.textContent = zh ? s[2] : s[1];
    var one = document.createElement('span');
    one.className = 'short';
    one.textContent = s[2];
    b.appendChild(full);
    b.appendChild(one);
    b.setAttribute('aria-label', full.textContent);
    b.title = full.textContent;
    b.dataset.season = s[0];
    pick.appendChild(b);
  });
  var mark = function () {
    pick.querySelectorAll('button').forEach(function (b) {
      var on = b.dataset.season === season;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  };
  pick.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b || b.dataset.season === season) return;
    season = b.dataset.season;
    try { localStorage.setItem('bg-season', season); } catch (err) {}
    mark();
    showSeason(season);
  });
  mark();
  var lang = document.querySelector('.nav-right > .lang');
  if (lang) lang.parentNode.insertBefore(pick, lang);
  else document.body.appendChild(pick);      // (a page without the top bar: bottom right)

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
