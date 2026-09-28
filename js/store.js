(function () {
  'use strict';

  var SALT = 'dc67::DarkCore::2026';
  var OWNER_HASH = '3bdba8e38ff603fec7e1ac96f81a5a77ff5f5d3d2b023969ab14565dda451cce';
  var OWNER_NAME = 'darkcore67';
  var KEY = 'dc67_portfolio_v2';

  var DEFAULT_SITE = {
    logo: 'DC',
    heroSub: 'Cześć, jestem DarkCore67 — Witaj w moim Centrum Portfolio',
    aboutTitle: 'DarkCore67',
    aboutText: 'Programuję pluginy od roku. Nie jestem jeszcze mistrzem, ale potrafię napisać dobry plugin — wszystko zależy od projektu.',
    contactText: 'Masz pomysł na plugin? Napisz do mnie. Czas oczekiwania wynosi do 24 godzin.',
    discord: 'darkcore67',
    discordUrl: 'https://discord.com'
  };

  var DEFAULT_CATEGORIES = [
    {
      id: 'cat-ekonomia',
      name: 'Ekonomia',
      icon: '💰',
      color: '#f59e0b',
      desc: 'Systemy walut, sklepy, banki i giełdy dla serwerów.',
      plugins: [
        { id: 'p1', name: 'DarkEconomy', desc: 'Zaawansowana ekonomia z walutą VPLN, bankiem i historią transakcji.', tags: ['Paper', 'MySQL', 'PlaceholderAPI'], images: [] },
        { id: 'p2', name: 'PortalShop', desc: 'Sklep GUI z kategoriami, płatnościami i integracją Discord.', tags: ['GUI', 'Vault', 'Discord'], images: [] }
      ]
    },
    {
      id: 'cat-afk',
      name: 'Strefy AFK',
      icon: '⏳',
      color: '#22c55e',
      desc: 'Nagrody za przebywanie w bezpiecznych strefach AFK.',
      plugins: [
        { id: 'p3', name: 'AfkStrefa', desc: 'Tworzenie stref AFK różdżką, nagrody co N sekund, GUI odbioru.', tags: ['Paper', 'WorldGuard'], images: [] },
        { id: 'p4', name: 'AfkRewardsGUI', desc: 'Losowe nagrody (kity, klucze, waluta) za czas w strefie.', tags: ['GUI', 'Rewards'], images: [] }
      ]
    },
    {
      id: 'cat-rangi',
      name: 'Rangi i VIP',
      icon: '👑',
      color: '#ec4899',
      desc: 'Systemy rang, VIP, globalne boostery i perksy.',
      plugins: [
        { id: 'p5', name: 'GVIP', desc: 'Rangi VIP z perksami, kolorami czatu i komendami premium.', tags: ['LuckPerms', 'Perks'], images: [] }
      ]
    },
    {
      id: 'cat-narzedzia',
      name: 'Narzędzia',
      icon: '🛠️',
      color: '#6366f1',
      desc: 'Narzędzia administracyjne, moderacyjne i developerskie.',
      plugins: [
        { id: 'p6', name: 'PraceTechniczne', desc: 'Tryb prac technicznych: blokada wejścia, ekran informacyjny, odliczanie.', tags: ['Maintenance', 'Motd'], images: [] },
        { id: 'p7', name: 'ForgeMC Core', desc: 'Główne jądro serwera ForgeMC — API, hooki i zarządzanie modułami.', tags: ['API', 'Core'], images: [] }
      ]
    }
  ];

  var DEFAULT_MESSAGES = [
    { id: 'm1', title: 'Witaj na moim portfolio!', body: 'Znajdziesz tu moje pluginy podzielone na kategorie. Po więcej zapraszam na Discord.', date: '2026-09-27' }
  ];

  function uid(prefix) {
    return (prefix || 'id') + '-' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function defaults() {
    return {
      site: clone(DEFAULT_SITE),
      categories: clone(DEFAULT_CATEGORIES),
      messages: clone(DEFAULT_MESSAGES)
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return defaults();
      var data = JSON.parse(raw);
      if (!data || !Array.isArray(data.categories)) throw new Error('bad');
      if (!data.site) data.site = clone(DEFAULT_SITE);
      if (!Array.isArray(data.messages)) data.messages = clone(DEFAULT_MESSAGES);
      return data;
    } catch (e) {
      return defaults();
    }
  }

  var lastSaveOk = true;

  function save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      lastSaveOk = true;
      return true;
    } catch (e) {
      lastSaveOk = false;
      return false;
    }
  }

  function getData() {
    return load();
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
        plugin.images = plugin.images || [];
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

  function getSite() {
    return load().site;
  }

  function updateSite(patch) {
    var data = load();
    for (var k in patch) {
      if (Object.prototype.hasOwnProperty.call(patch, k)) data.site[k] = patch[k];
    }
    save(data);
    return data.site;
  }

  function getMessages() {
    return load().messages;
  }

  function getMessage(id) {
    var msgs = getMessages();
    for (var i = 0; i < msgs.length; i++) {
      if (msgs[i].id === id) return msgs[i];
    }
    return null;
  }

  function addMessage(msg) {
    var data = load();
    msg.id = msg.id || uid('m');
    msg.date = msg.date || new Date().toISOString().slice(0, 10);
    data.messages.unshift(msg);
    save(data);
    return msg;
  }

  function updateMessage(id, patch) {
    var data = load();
    for (var i = 0; i < data.messages.length; i++) {
      if (data.messages[i].id === id) {
        for (var k in patch) {
          if (Object.prototype.hasOwnProperty.call(patch, k)) data.messages[i][k] = patch[k];
        }
        save(data);
        return data.messages[i];
      }
    }
    return null;
  }

  function deleteMessage(id) {
    var data = load();
    data.messages = data.messages.filter(function (m) { return m.id !== id; });
    save(data);
  }

  function resetAll() {
    save(defaults());
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
    getData: getData,
    getCategories: getCategories,
    getCategory: getCategory,
    addCategory: addCategory,
    updateCategory: updateCategory,
    deleteCategory: deleteCategory,
    addPlugin: addPlugin,
    updatePlugin: updatePlugin,
    deletePlugin: deletePlugin,
    countPlugins: countPlugins,
    getSite: getSite,
    updateSite: updateSite,
    getMessages: getMessages,
    getMessage: getMessage,
    addMessage: addMessage,
    updateMessage: updateMessage,
    deleteMessage: deleteMessage,
    resetAll: resetAll,
    lastSaveOk: function () { return lastSaveOk; },
    login: login,
    isOwnerName: isOwnerName
  };
})();