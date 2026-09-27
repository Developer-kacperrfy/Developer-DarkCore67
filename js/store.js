(function () {
  'use strict';

  var SALT = 'dc67::DarkCore::2026';
  var OWNER_HASH = '3bdba8e38ff603fec7e1ac96f81a5a77ff5f5d3d2b023969ab14565dda451cce';
  var OWNER_NAME = 'darkcore67';
  var KEY = 'dc67_portfolio_v1';

  var DEFAULT_CATEGORIES = [
    {
      id: 'cat-ekonomia',
      name: 'Ekonomia',
      icon: '💰',
      color: '#f59e0b',
      desc: 'Systemy walut, sklepy, banki i giełdy dla serwerów.',
      plugins: [
        { id: 'p1', name: 'DarkEconomy', desc: 'Zaawansowana ekonomia z walutą VPLN, bankiem i historią transakcji.', tags: ['Paper', 'MySQL', 'PlaceholderAPI'] },
        { id: 'p2', name: 'PortalShop', desc: 'Sklep GUI z kategoriami, płatnościami i integracją Discord.', tags: ['GUI', 'Vault', 'Discord'] }
      ]
    },
    {
      id: 'cat-afk',
      name: 'Strefy AFK',
      icon: '⏳',
      color: '#22c55e',
      desc: 'Nagrody za przebywanie w bezpiecznych strefach AFK.',
      plugins: [
        { id: 'p3', name: 'AfkStrefa', desc: 'Tworzenie stref AFK różdżką, nagrody co N sekund, GUI odbioru.', tags: ['Paper', 'WorldGuard'] },
        { id: 'p4', name: 'AfkRewardsGUI', desc: 'Losowe nagrody (kity, klucze, waluta) za czas w strefie.', tags: ['GUI', 'Rewards'] }
      ]
    },
    {
      id: 'cat-rangi',
      name: 'Rangi i VIP',
      icon: '👑',
      color: '#ec4899',
      desc: 'Systemy rang, VIP, globalne boostery i perksy.',
      plugins: [
        { id: 'p5', name: 'GVIP', desc: 'Rangi VIP z perksami, kolorami czatu i komendami premium.', tags: ['LuckPerms', 'Perks'] }
      ]
    },
    {
      id: 'cat-narzedzia',
      name: 'Narzędzia',
      icon: '🛠️',
      color: '#6366f1',
      desc: 'Narzędzia administracyjne, moderacyjne i developerskie.',
      plugins: [
        { id: 'p6', name: 'PraceTechniczne', desc: 'Tryb prac technicznych: blokada wejścia, ekran informacyjny, odliczanie.', tags: ['Maintenance', 'Motd'] },
        { id: 'p7', name: 'ForgeMC Core', desc: 'Główne jądro serwera ForgeMC — API, hooki i zarządzanie modułami.', tags: ['API', 'Core'] }
      ]
    }
  ];

  function uid(prefix) {
    return (prefix || 'id') + '-' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return { categories: clone(DEFAULT_CATEGORIES) };
      var data = JSON.parse(raw);
      if (!data || !Array.isArray(data.categories)) throw new Error('bad');
      return data;
    } catch (e) {
      return { categories: clone(DEFAULT_CATEGORIES) };
    }
  }

  function save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function getCategories() {
    return load().categories;
  }

  function getCategory(id) {
    var cats = getCategories();
    for (var i = 0; i < cats.length; i++) {
      if (cats[i].id === id) return cats[i];
    }
    return null;
  }

  function addCategory(cat) {
    var data = load();
    cat.id = cat.id || uid('cat');
    cat.plugins = cat.plugins || [];
    data.categories.push(cat);
    save(data);
    return cat;
  }

  function updateCategory(id, patch) {
    var data = load();
    for (var i = 0; i < data.categories.length; i++) {
      if (data.categories[i].id === id) {
        for (var k in patch) {
          if (Object.prototype.hasOwnProperty.call(patch, k)) data.categories[i][k] = patch[k];
        }
        save(data);
        return data.categories[i];
      }
    }
    return null;
  }

  function deleteCategory(id) {
    var data = load();
    data.categories = data.categories.filter(function (c) { return c.id !== id; });
    save(data);
  }

  function addPlugin(catId, plugin) {
    var data = load();
    for (var i = 0; i < data.categories.length; i++) {
      if (data.categories[i].id === catId) {
        plugin.id = plugin.id || uid('p');
        data.categories[i].plugins.push(plugin);
        save(data);
        return plugin;
      }
    }
    return null;
  }

  function updatePlugin(catId, pluginId, patch) {
    var data = load();
    for (var i = 0; i < data.categories.length; i++) {
      if (data.categories[i].id === catId) {
        for (var j = 0; j < data.categories[i].plugins.length; j++) {
          if (data.categories[i].plugins[j].id === pluginId) {
            for (var k in patch) {
              if (Object.prototype.hasOwnProperty.call(patch, k)) data.categories[i].plugins[j][k] = patch[k];
            }
            save(data);
            return data.categories[i].plugins[j];
          }
        }
      }
    }
    return null;
  }

  function deletePlugin(catId, pluginId) {
    var data = load();
    for (var i = 0; i < data.categories.length; i++) {
      if (data.categories[i].id === catId) {
        data.categories[i].plugins = data.categories[i].plugins.filter(function (p) { return p.id !== pluginId; });
      }
    }
    save(data);
  }

  function countPlugins() {
    return getCategories().reduce(function (n, c) { return n + (c.plugins ? c.plugins.length : 0); }, 0);
  }

  function resetAll() {
    save({ categories: clone(DEFAULT_CATEGORIES) });
  }

  function sha256Hex(text) {
    if (window.crypto && window.crypto.subtle && window.TextEncoder) {
      var buf = new TextEncoder().encode(text);
      return window.crypto.subtle.digest('SHA-256', buf).then(function (hash) {
        return Array.prototype.map.call(new Uint8Array(hash), function (b) {
          return b.toString(16).padStart(2, '0');
        }).join('');
      });
    }
    return Promise.resolve(fallbackHash(text));
  }

  function fallbackHash(text) {
    var h = 0x811c9dc5;
    for (var i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = (h * 0x01000193) >>> 0;
    }
    return ('00000000' + h.toString(16)).slice(-8) + text.length.toString(16);
  }

  function login(user, pass) {
    if (!user || !pass) return Promise.resolve(false);
    if (user.trim().toLowerCase() !== OWNER_NAME) return Promise.resolve(false);
    return sha256Hex(SALT + pass).then(function (hex) {
      return hex === OWNER_HASH;
    });
  }

  function isOwnerName(user) {
    return (user || '').trim().toLowerCase() === OWNER_NAME;
  }

  window.DCStore = {
    OWNER_NAME: OWNER_NAME,
    uid: uid,
    getCategories: getCategories,
    getCategory: getCategory,
    addCategory: addCategory,
    updateCategory: updateCategory,
    deleteCategory: deleteCategory,
    addPlugin: addPlugin,
    updatePlugin: updatePlugin,
    deletePlugin: deletePlugin,
    countPlugins: countPlugins,
    resetAll: resetAll,
    login: login,
    isOwnerName: isOwnerName
  };
})();
