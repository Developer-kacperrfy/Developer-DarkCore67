(function () {
  'use strict';

  var store = window.DCStore;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderCategories() {
    var wrap = document.getElementById('categories');
    var empty = document.getElementById('emptyCats');
    var cats = store.getCategories();

    if (!cats.length) {
      wrap.innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }
    empty.classList.add('hidden');

    wrap.innerHTML = cats.map(function (c) {
      var count = c.plugins ? c.plugins.length : 0;
      return '' +
        '<article class="cat-card" data-cat="' + esc(c.id) + '" style="--cat-color:' + esc(c.color || '#a855f7') + '">' +
          '<div class="cat-card-inner">' +
            '<div class="cat-icon">' + esc(c.icon || '📦') + '</div>' +
            '<h3>' + esc(c.name) + '</h3>' +
            '<p>' + esc(c.desc || '') + '</p>' +
            '<div class="cat-foot">' +
              '<span class="cat-count">' + count + ' ' + plural(count) + '</span>' +
              '<span class="cat-arrow">Zobacz →</span>' +
            '</div>' +
          '</div>' +
        '</article>';
    }).join('');

    Array.prototype.forEach.call(wrap.querySelectorAll('.cat-card'), function (card) {
      card.addEventListener('click', function () {
        openCategory(card.getAttribute('data-cat'));
      });
    });
  }

  function plural(n) {
    if (n === 1) return 'plugin';
    if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'pluginy';
    return 'pluginów';
  }

  function openCategory(id) {
    var cat = store.getCategory(id);
    if (!cat) return;
    var box = document.getElementById('catModalBox');
    var content = document.getElementById('catModalContent');

    box.style.setProperty('--cat-color', cat.color || '#a855f7');

    var plugins = cat.plugins || [];
    var list = plugins.length
      ? plugins.map(function (p) {
          var tags = (p.tags || []).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('');
          return '' +
            '<div class="plugin-item">' +
              '<h4>' + esc(p.name) + '</h4>' +
              '<p>' + esc(p.desc || '') + '</p>' +
              (tags ? '<div class="plugin-tags">' + tags + '</div>' : '') +
            '</div>';
        }).join('')
      : '<div class="empty">Ta kategoria nie ma jeszcze pluginów.</div>';

    content.innerHTML = '' +
      '<div class="cat-modal-head">' +
        '<div class="cat-modal-icon">' + esc(cat.icon || '📦') + '</div>' +
        '<div><h2>' + esc(cat.name) + '</h2><p>' + esc(cat.desc || '') + '</p></div>' +
      '</div>' +
      '<div class="plugin-list">' + list + '</div>';

    openModal('catModal');
  }

  function openModal(id) {
    var m = document.getElementById(id);
    m.classList.add('open');
    m.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(id) {
    var m = document.getElementById(id);
    m.classList.remove('open');
    m.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function bindModals() {
    Array.prototype.forEach.call(document.querySelectorAll('.modal'), function (m) {
      m.addEventListener('click', function (e) {
        if (e.target.hasAttribute('data-close')) closeModal(m.id);
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        Array.prototype.forEach.call(document.querySelectorAll('.modal.open'), function (m) { closeModal(m.id); });
      }
    });
  }

  function animateCounters() {
    var plug = document.getElementById('statPlugins');
    var cats = document.getElementById('statCats');
    var targetPlug = store.countPlugins();
    var targetCats = store.getCategories().length;
    countTo(plug, targetPlug);
    countTo(cats, targetCats);
  }

  function countTo(el, target) {
    if (!el) return;
    var cur = 0;
    var step = Math.max(1, Math.ceil(target / 24));
    var t = setInterval(function () {
      cur += step;
      if (cur >= target) { cur = target; clearInterval(t); }
      el.textContent = cur;
    }, 28);
  }

  function bindNav() {
    var burger = document.getElementById('burger');
    var links = document.querySelector('.nav-links');
    if (burger && links) {
      burger.addEventListener('click', function () { links.classList.toggle('open'); });
      links.addEventListener('click', function (e) {
        if (e.target.tagName === 'A') links.classList.remove('open');
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('year').textContent = new Date().getFullYear();
    renderCategories();
    animateCounters();
    bindModals();
    bindNav();
  });

  window.DCApp = {
    renderCategories: renderCategories,
    animateCounters: animateCounters,
    esc: esc
  };
})();
