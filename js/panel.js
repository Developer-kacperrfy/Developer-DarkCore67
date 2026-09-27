(function () {
  'use strict';

  var store = window.DCStore;
  var app = window.DCApp;
  var esc = app.esc;

  var CATEGORY_COLORS = ['#a855f7', '#ec4899', '#f59e0b', '#22c55e', '#06b6d4', '#6366f1', '#ef4444', '#14b8a6'];
  var CATEGORY_ICONS = ['📦', '💰', '⏳', '👑', '🛠️', '⚔️', '🎮', '✨', '🔥', '🧩', '🗡️', '🏆'];

  var editingCatId = null;
  var editingPlugin = null;
  var pluginCatId = null;

  function toast(msg, type) {
    var wrap = document.getElementById('toasts');
    var el = document.createElement('div');
    el.className = 'toast ' + (type || 'ok');
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(function () {
      el.style.opacity = '0';
      el.style.transform = 'translateX(30px)';
      setTimeout(function () { el.remove(); }, 300);
    }, 2600);
  }

  function show(id) {
    var el = document.getElementById(id);
    el.classList.add('open');
    el.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function hide(id) {
    var el = document.getElementById(id);
    el.classList.remove('open');
    el.setAttribute('aria-hidden', 'true');
    if (!document.querySelector('.admin.open')) document.body.style.overflow = '';
  }

  function openLogin() {
    show('loginModal');
    setTimeout(function () { document.getElementById('loginUser').focus(); }, 80);
  }

  function closeLogin() {
    hide('loginModal');
    document.getElementById('loginError').classList.add('hidden');
    document.getElementById('loginForm').reset();
  }

  function openAdmin() {
    show('admin');
    renderDash();
    renderCatsAdmin();
    renderPluginsAdmin();
    renderSettings();
    switchTab('dash');
  }

  function closeAdmin() {
    hide('admin');
    renderCats();
    app.animateCounters();
  }

  function switchTab(tab) {
    Array.prototype.forEach.call(document.querySelectorAll('.admin-tab'), function (b) {
      b.classList.toggle('active', b.getAttribute('data-tab') === tab);
    });
    Array.prototype.forEach.call(document.querySelectorAll('.admin-panel-view'), function (v) {
      v.classList.toggle('active', v.id === 'view-' + tab);
    });
    var titles = { dash: 'Dashboard', cats: 'Kategorie', plugins: 'Pluginy', settings: 'Ustawienia' };
    document.getElementById('adminTitle').textContent = titles[tab] || 'Panel';
    if (tab === 'dash') renderDash();
    if (tab === 'cats') renderCatsAdmin();
    if (tab === 'plugins') renderPluginsAdmin();
  }

  function renderDash() {
    var cats = store.getCategories();
    var plugins = store.countPlugins();
    var view = document.getElementById('view-dash');
    view.innerHTML = '' +
      '<div class="dash-grid">' +
        card(plugins, 'Pluginów') +
        card(cats.length, 'Kategorii') +
        card(cats.filter(function (c) { return c.plugins && c.plugins.length; }).length, 'Aktywnych') +
      '</div>' +
      '<div class="admin-form">' +
        '<h3>Witaj, ' + esc(store.OWNER_NAME) + ' 👑</h3>' +
        '<p class="muted">Zarządzaj kategoriami i pluginami po lewej stronie. Zmiany zapisują się automatycznie w tej przeglądarce (localStorage).</p>' +
      '</div>';
  }

  function card(n, l) {
    return '<div class="dash-card"><div class="n">' + n + '</div><div class="l">' + l + '</div></div>';
  }

  function colorOptions(selected) {
    return CATEGORY_COLORS.map(function (c) {
      return '<option value="' + c + '"' + (c === selected ? ' selected' : '') + '>' + c + '</option>';
    }).join('');
  }

  function iconOptions(selected) {
    return CATEGORY_ICONS.map(function (i) {
      return '<option value="' + i + '"' + (i === selected ? ' selected' : '') + '>' + i + '</option>';
    }).join('');
  }

  function renderCatsAdmin() {
    var cats = store.getCategories();
    var view = document.getElementById('view-cats');
    var editing = editingCatId ? store.getCategory(editingCatId) : null;

    var form = '' +
      '<form class="admin-form" id="catForm">' +
        '<h3>' + (editing ? 'Edytuj kategorię' : 'Dodaj kategorię') + '</h3>' +
        '<label>Nazwa<input type="text" name="name" value="' + esc(editing ? editing.name : '') + '" placeholder="np. Ekonomia" required></label>' +
        '<label>Opis<textarea name="desc" placeholder="Krótki opis kategorii">' + esc(editing ? editing.desc : '') + '</textarea></label>' +
        '<div class="form-row">' +
          '<label>Ikona<select name="icon">' + iconOptions(editing ? editing.icon : '📦') + '</select></label>' +
          '<label>Kolor<select name="color">' + colorOptions(editing ? editing.color : '#a855f7') + '</select></label>' +
        '</div>' +
        '<button type="submit" class="btn btn-primary">' + (editing ? 'Zapisz zmiany' : 'Dodaj kategorię') + '</button>' +
        (editing ? ' <button type="button" class="btn btn-ghost" id="cancelCatEdit">Anuluj</button>' : '') +
      '</form>';

    var list = cats.length ? cats.map(function (c) {
      return '' +
        '<div class="admin-item">' +
          '<div class="ai-icon" style="--cat-color:' + esc(c.color) + '">' + esc(c.icon) + '</div>' +
          '<div class="ai-body"><h4>' + esc(c.name) + '</h4><p>' + esc(c.desc || '') + '</p></div>' +
          '<div class="ai-actions">' +
            '<button class="icon-btn" data-edit-cat="' + esc(c.id) + '" title="Edytuj">✎</button>' +
            '<button class="icon-btn" data-del-cat="' + esc(c.id) + '" title="Usuń">🗑</button>' +
          '</div>' +
        '</div>';
    }).join('') : '<div class="empty">Brak kategorii — dodaj pierwszą powyżej.</div>';

    view.innerHTML = form + '<div class="admin-list">' + list + '</div>';

    document.getElementById('catForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(e.target);
      var data = {
        name: String(fd.get('name') || '').trim(),
        desc: String(fd.get('desc') || '').trim(),
        icon: fd.get('icon'),
        color: fd.get('color')
      };
      if (!data.name) return;
      if (editingCatId) {
        store.updateCategory(editingCatId, data);
        editingCatId = null;
        toast('Kategoria zaktualizowana');
      } else {
        store.addCategory(data);
        toast('Kategoria dodana');
      }
      renderCatsAdmin();
      renderCats();
      app.animateCounters();
      renderDash();
    });

    var cancel = document.getElementById('cancelCatEdit');
    if (cancel) cancel.addEventListener('click', function () { editingCatId = null; renderCatsAdmin(); });

    Array.prototype.forEach.call(view.querySelectorAll('[data-edit-cat]'), function (b) {
      b.addEventListener('click', function () {
        editingCatId = b.getAttribute('data-edit-cat');
        renderCatsAdmin();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    Array.prototype.forEach.call(view.querySelectorAll('[data-del-cat]'), function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-del-cat');
        var cat = store.getCategory(id);
        if (confirm('Usunąć kategorię "' + cat.name + '" wraz z pluginami?')) {
          store.deleteCategory(id);
          if (editingCatId === id) editingCatId = null;
          renderCatsAdmin();
          renderPluginsAdmin();
          renderCats();
          app.animateCounters();
          renderDash();
          toast('Kategoria usunięta', 'err');
        }
      });
    });
  }

  function renderPluginsAdmin() {
    var cats = store.getCategories();
    var view = document.getElementById('view-plugins');

    if (!cats.length) {
      view.innerHTML = '<div class="empty">Najpierw dodaj kategorię.</div>';
      return;
    }

    if (!pluginCatId || !store.getCategory(pluginCatId)) pluginCatId = cats[0].id;
    var editing = editingPlugin ? findPlugin(editingPlugin) : null;

    var catSelect = cats.map(function (c) {
      return '<option value="' + esc(c.id) + '"' + (c.id === (editing ? editing.catId : pluginCatId) ? ' selected' : '') + '>' + esc(c.icon + ' ' + c.name) + '</option>';
    }).join('');

    var form = '' +
      '<form class="admin-form" id="pluginForm">' +
        '<h3>' + (editing ? 'Edytuj plugin' : 'Dodaj plugin') + '</h3>' +
        '<label>Kategoria<select name="catId">' + catSelect + '</select></label>' +
        '<label>Nazwa pluginu<input type="text" name="name" value="' + esc(editing ? editing.plugin.name : '') + '" placeholder="np. DarkEconomy" required></label>' +
        '<label>Opis<textarea name="desc" placeholder="Co robi ten plugin?">' + esc(editing ? editing.plugin.desc : '') + '</textarea></label>' +
        '<label>Tagi (oddziel przecinkami)<input type="text" name="tags" value="' + esc(editing ? (editing.plugin.tags || []).join(', ') : '') + '" placeholder="Paper, MySQL, GUI"></label>' +
        '<button type="submit" class="btn btn-primary">' + (editing ? 'Zapisz zmiany' : 'Dodaj plugin') + '</button>' +
        (editing ? ' <button type="button" class="btn btn-ghost" id="cancelPluginEdit">Anuluj</button>' : '') +
      '</form>';

    var list = cats.map(function (c) {
      var plugins = c.plugins || [];
      var items = plugins.length ? plugins.map(function (p) {
        return '' +
          '<div class="admin-item">' +
            '<div class="ai-icon" style="--cat-color:' + esc(c.color) + '">🧩</div>' +
            '<div class="ai-body"><h4>' + esc(p.name) + '</h4><p>' + esc(p.desc || '') + '</p></div>' +
            '<div class="ai-actions">' +
              '<button class="icon-btn" data-edit-plugin="' + esc(c.id) + '|' + esc(p.id) + '" title="Edytuj">✎</button>' +
              '<button class="icon-btn" data-del-plugin="' + esc(c.id) + '|' + esc(p.id) + '" title="Usuń">🗑</button>' +
            '</div>' +
          '</div>';
      }).join('') : '<div class="empty">Brak pluginów w tej kategorii.</div>';

      return '<h3 style="margin:22px 0 12px;font-size:1rem" class="muted">' + esc(c.icon + ' ' + c.name) + '</h3><div class="admin-list">' + items + '</div>';
    }).join('');

    view.innerHTML = form + list;

    document.getElementById('pluginForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(e.target);
      var catId = fd.get('catId');
      var data = {
        name: String(fd.get('name') || '').trim(),
        desc: String(fd.get('desc') || '').trim(),
        tags: String(fd.get('tags') || '').split(',').map(function (t) { return t.trim(); }).filter(Boolean)
      };
      if (!data.name) return;
      if (editing) {
        store.updatePlugin(editing.catId, editing.plugin.id, data);
        if (editing.catId !== catId) {
          store.deletePlugin(editing.catId, editing.plugin.id);
          store.addPlugin(catId, { id: editing.plugin.id, name: data.name, desc: data.desc, tags: data.tags });
        }
        editingPlugin = null;
        toast('Plugin zaktualizowany');
      } else {
        store.addPlugin(catId, data);
        toast('Plugin dodany');
      }
      pluginCatId = catId;
      renderPluginsAdmin();
      renderCats();
      app.animateCounters();
      renderDash();
    });

    var cancel = document.getElementById('cancelPluginEdit');
    if (cancel) cancel.addEventListener('click', function () { editingPlugin = null; renderPluginsAdmin(); });

    Array.prototype.forEach.call(view.querySelectorAll('[data-edit-plugin]'), function (b) {
      b.addEventListener('click', function () {
        var parts = b.getAttribute('data-edit-plugin').split('|');
        editingPlugin = { catId: parts[0], pluginId: parts[1] };
        renderPluginsAdmin();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    Array.prototype.forEach.call(view.querySelectorAll('[data-del-plugin]'), function (b) {
      b.addEventListener('click', function () {
        var parts = b.getAttribute('data-del-plugin').split('|');
        var p = findPlugin({ catId: parts[0], pluginId: parts[1] });
        if (confirm('Usunąć plugin "' + p.plugin.name + '"?')) {
          store.deletePlugin(parts[0], parts[1]);
          renderPluginsAdmin();
          renderCats();
          app.animateCounters();
          renderDash();
          toast('Plugin usunięty', 'err');
        }
      });
    });
  }

  function findPlugin(ref) {
    var cat = store.getCategory(ref.catId);
    if (!cat) return null;
    for (var i = 0; i < cat.plugins.length; i++) {
      if (cat.plugins[i].id === ref.pluginId) {
        return { catId: cat.id, plugin: cat.plugins[i] };
      }
    }
    return null;
  }

  function renderSettings() {
    var view = document.getElementById('view-settings');
    view.innerHTML = '' +
      '<div class="admin-form">' +
        '<h3>Konto właściciela</h3>' +
        '<label>Nazwa<input type="text" value="' + esc(store.OWNER_NAME) + '" disabled></label>' +
        '<p class="muted">Login jest zaszyfrowany (SHA-256 + salt) w pliku <code>js/store.js</code>. Hasło nigdy nie jest zapisywane jawnie.</p>' +
      '</div>' +
      '<div class="admin-form">' +
        '<h3>Dane</h3>' +
        '<p class="muted">Wszystkie kategorie i pluginy zapisują się lokalnie w przeglądarce.</p>' +
        '<button class="btn btn-danger" id="resetData">Przywróć dane domyślne</button>' +
      '</div>';

    document.getElementById('resetData').addEventListener('click', function () {
      if (confirm('Przywrócić domyślne kategorie i pluginy? Utracisz swoje zmiany.')) {
        store.resetAll();
        editingCatId = null;
        editingPlugin = null;
        renderCatsAdmin();
        renderPluginsAdmin();
        renderCats();
        app.animateCounters();
        renderDash();
        toast('Przywrócono dane domyślne');
      }
    });
  }

  function bindLogin() {
    document.getElementById('panelBtn').addEventListener('click', openLogin);

    document.getElementById('loginForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var user = document.getElementById('loginUser').value;
      var pass = document.getElementById('loginPass').value;
      var err = document.getElementById('loginError');
      err.classList.add('hidden');

      store.login(user, pass).then(function (ok) {
        if (!ok) {
          err.classList.remove('hidden');
          return;
        }
        closeLogin();
        document.getElementById('adminWho').textContent = '👑 ' + store.OWNER_NAME;
        openAdmin();
        toast('Zalogowano jako ' + store.OWNER_NAME);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    bindLogin();

    document.getElementById('logoutBtn').addEventListener('click', function () {
      closeAdmin();
      toast('Wylogowano');
    });
    document.getElementById('closeAdmin').addEventListener('click', closeAdmin);

    Array.prototype.forEach.call(document.querySelectorAll('.admin-tab'), function (b) {
      b.addEventListener('click', function () { switchTab(b.getAttribute('data-tab')); });
    });
  });
})();
