(function () {
  'use strict';

  var store = window.DCStore;
  var app = window.DCApp;
  var esc = app.esc;

  var CATEGORY_COLORS = ['#a855f7', '#ec4899', '#f59e0b', '#22c55e', '#06b6d4', '#6366f1', '#ef4444', '#14b8a6'];
  var CATEGORY_ICONS = ['📦', '💰', '⏳', '👑', '🛠️', '⚔️', '🎮', '✨', '🔥', '🧩', '🗡️', '🏆'];

  var editingCatId = null;
  var editingPlugin = null;
  var editingMessageId = null;
  var pluginCatId = null;
  var draftImages = [];
  var draftLogo = '';

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
    renderMessagesAdmin();
    renderSettings();
    switchTab('dash');
  }

  function closeAdmin() {
    hide('admin');
    app.renderAll();
  }

  function switchTab(tab) {
    Array.prototype.forEach.call(document.querySelectorAll('.admin-tab'), function (b) {
      b.classList.toggle('active', b.getAttribute('data-tab') === tab);
    });
    Array.prototype.forEach.call(document.querySelectorAll('.admin-panel-view'), function (v) {
      v.classList.toggle('active', v.id === 'view-' + tab);
    });
    var titles = { dash: 'Dashboard', cats: 'Kategorie', plugins: 'Pluginy', messages: 'Wiadomości', settings: 'Ustawienia' };
    document.getElementById('adminTitle').textContent = titles[tab] || 'Panel';
    if (tab === 'dash') renderDash();
    if (tab === 'cats') renderCatsAdmin();
    if (tab === 'plugins') renderPluginsAdmin();
    if (tab === 'messages') renderMessagesAdmin();
    if (tab === 'settings') renderSettings();
  }

  function renderDash() {
    var cats = store.getCategories();
    var plugins = store.countPlugins();
    var msgs = store.getMessages().length;
    var view = document.getElementById('view-dash');
    view.innerHTML = '' +
      '<div class="dash-grid">' +
        card(plugins, 'Pluginów') +
        card(cats.length, 'Kategorii') +
        card(msgs, 'Wiadomości') +
        card(cats.filter(function (c) { return c.plugins && c.plugins.length; }).length, 'Aktywnych') +
      '</div>' +
      '<div class="admin-form">' +
        '<h3>Witaj, ' + esc(store.OWNER_NAME) + ' 👑</h3>' +
        '<p class="muted">Zarządzaj kategoriami, pluginami (ze zdjęciami) i wiadomościami. Zmiany zapisują się automatycznie w tej przeglądarce.</p>' +
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

  /* ---------- KATEGORIE ---------- */
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
      app.renderAll();
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
          app.renderAll();
          renderDash();
          toast('Kategoria usunięta', 'err');
        }
      });
    });
  }

  /* ---------- PLUGINY + ZDJĘCIA ---------- */
  function renderThumbs() {
    return draftImages.map(function (src, i) {
      return '<div class="thumb"><img src="' + esc(src) + '" alt="zdjęcie ' + (i + 1) + '"><button type="button" class="thumb-del" data-img-del="' + i + '" title="Usuń">✕</button></div>';
    }).join('');
  }

  function bindThumbDelete() {
    var wrap = document.getElementById('pluginThumbs');
    if (!wrap) return;
    Array.prototype.forEach.call(wrap.querySelectorAll('[data-img-del]'), function (b) {
      b.addEventListener('click', function () {
        draftImages.splice(Number(b.getAttribute('data-img-del')), 1);
        wrap.innerHTML = renderThumbs();
        bindThumbDelete();
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

    var thumbs = renderThumbs();

    var form = '' +
      '<form class="admin-form" id="pluginForm">' +
        '<h3>' + (editing ? 'Edytuj plugin' : 'Dodaj plugin') + '</h3>' +
        '<label>Kategoria<select name="catId">' + catSelect + '</select></label>' +
        '<label>Nazwa pluginu<input type="text" name="name" value="' + esc(editing ? editing.plugin.name : '') + '" placeholder="np. DarkEconomy" required></label>' +
        '<label>Opis<textarea name="desc" placeholder="Co robi ten plugin?">' + esc(editing ? editing.plugin.desc : '') + '</textarea></label>' +
        '<label>Tagi (oddziel przecinkami)<input type="text" name="tags" value="' + esc(editing ? (editing.plugin.tags || []).join(', ') : '') + '" placeholder="Paper, MySQL, GUI"></label>' +
        '<label>Zdjęcia pluginu</label>' +
        '<div class="img-picker" id="imgPicker">' +
          '<input type="file" id="pluginImages" accept="image/*" multiple hidden>' +
          '<button type="button" class="btn btn-outline btn-sm" id="pickImages">➕ Wybierz zdjęcia</button>' +
          '<span class="muted">przeciągnij i upuść tutaj albo wklej Ctrl+V</span>' +
        '</div>' +
        '<div class="thumbs" id="pluginThumbs">' + thumbs + '</div>' +
        '<button type="submit" class="btn btn-primary">' + (editing ? 'Zapisz zmiany' : 'Dodaj plugin') + '</button>' +
        (editing ? ' <button type="button" class="btn btn-ghost" id="cancelPluginEdit">Anuluj</button>' : '') +
      '</form>';

    var list = cats.map(function (c) {
      var plugins = c.plugins || [];
      var items = plugins.length ? plugins.map(function (p) {
        var n = (p.images || []).length;
        return '' +
          '<div class="admin-item">' +
            '<div class="ai-icon" style="--cat-color:' + esc(c.color) + '">🧩</div>' +
            '<div class="ai-body"><h4>' + esc(p.name) + (n ? ' <span class="muted">(' + n + ' zdj.)</span>' : '') + '</h4><p>' + esc(p.desc || '') + '</p></div>' +
            '<div class="ai-actions">' +
              '<button class="icon-btn" data-edit-plugin="' + esc(c.id) + '|' + esc(p.id) + '" title="Edytuj">✎</button>' +
              '<button class="icon-btn" data-del-plugin="' + esc(c.id) + '|' + esc(p.id) + '" title="Usuń">🗑</button>' +
            '</div>' +
          '</div>';
      }).join('') : '<div class="empty">Brak pluginów w tej kategorii.</div>';

      return '<h3 style="margin:22px 0 12px;font-size:1rem" class="muted">' + esc(c.icon + ' ' + c.name) + '</h3><div class="admin-list">' + items + '</div>';
    }).join('');

    view.innerHTML = form + list;

    function refreshThumbs() {
      var wrap = document.getElementById('pluginThumbs');
      if (wrap) wrap.innerHTML = renderThumbs();
      bindThumbDelete();
    }

    function addImages(files) {
      files = Array.prototype.slice.call(files || []).filter(function (f) {
        return f && f.type && f.type.indexOf('image/') === 0;
      });
      if (!files.length) return;
      var remaining = files.length;
      files.forEach(function (file) {
        resizeImage(file, 1200, function (dataUrl) {
          draftImages.push(dataUrl);
          remaining--;
          if (remaining === 0) {
            refreshThumbs();
            if (editing) {
              store.updatePlugin(editing.catId, editing.plugin.id, { images: draftImages.slice() });
              app.renderAll();
              toast('Zapisano zdjęcia');
            } else {
              toast('Dodano ' + files.length + ' zdjęć — kliknij Dodaj plugin');
            }
          }
        });
      });
    }

    window.DCPanelAddImages = addImages;

    document.getElementById('pickImages').addEventListener('click', function () {
      document.getElementById('pluginImages').click();
    });

    document.getElementById('pluginImages').addEventListener('change', function (e) {
      addImages(e.target.files);
      e.target.value = '';
    });

    var picker = document.getElementById('imgPicker');
    ['dragenter', 'dragover'].forEach(function (ev) {
      picker.addEventListener(ev, function (e) { e.preventDefault(); picker.classList.add('drag'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      picker.addEventListener(ev, function (e) { e.preventDefault(); picker.classList.remove('drag'); });
    });
    picker.addEventListener('drop', function (e) {
      addImages(e.dataTransfer && e.dataTransfer.files);
    });

    function onPaste(e) {
      if (!document.querySelector('.admin.open') || !document.getElementById('view-plugins').classList.contains('active')) return;
      var items = (e.clipboardData && e.clipboardData.items) || [];
      var files = [];
      for (var i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image/') === 0) {
          var f = items[i].getAsFile();
          if (f) files.push(f);
        }
      }
      if (files.length) { e.preventDefault(); addImages(files); }
    }
    document.removeEventListener('paste', window.DCPasteHandler || function () {});
    window.DCPasteHandler = onPaste;
    document.addEventListener('paste', onPaste);

    bindThumbDelete();

    document.getElementById('pluginForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(e.target);
      var catId = fd.get('catId');
      var data = {
        name: String(fd.get('name') || '').trim(),
        desc: String(fd.get('desc') || '').trim(),
        tags: String(fd.get('tags') || '').split(',').map(function (t) { return t.trim(); }).filter(Boolean),
        images: draftImages.slice()
      };
      if (!data.name) return;
      if (editing) {
        store.updatePlugin(editing.catId, editing.plugin.id, data);
        if (editing.catId !== catId) {
          store.deletePlugin(editing.catId, editing.plugin.id);
          store.addPlugin(catId, { id: editing.plugin.id, name: data.name, desc: data.desc, tags: data.tags, images: data.images });
        }
        editingPlugin = null;
        toast('Plugin zaktualizowany');
      } else {
        store.addPlugin(catId, data);
        toast('Plugin dodany');
      }
      if (!store.lastSaveOk()) {
        toast('Nie udało się zapisać — za dużo/za duże zdjęcia. Usuń część zdjęć.', 'err');
      }
      pluginCatId = catId;
      draftImages = [];
      renderPluginsAdmin();
      app.renderAll();
      renderDash();
    });

    var cancel = document.getElementById('cancelPluginEdit');
    if (cancel) cancel.addEventListener('click', function () {
      editingPlugin = null;
      draftImages = [];
      renderPluginsAdmin();
    });

    Array.prototype.forEach.call(view.querySelectorAll('[data-edit-plugin]'), function (b) {
      b.addEventListener('click', function () {
        var parts = b.getAttribute('data-edit-plugin').split('|');
        editingPlugin = { catId: parts[0], pluginId: parts[1] };
        var found = findPlugin(editingPlugin);
        draftImages = found ? (found.plugin.images || []).slice() : [];
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
          app.renderAll();
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

  function resizeImage(file, maxSize, cb) {
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        var w = img.width;
        var h = img.height;
        if (w > maxSize || h > maxSize) {
          if (w >= h) { h = Math.round(h * maxSize / w); w = maxSize; }
          else { w = Math.round(w * maxSize / h); h = maxSize; }
        }
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        cb(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = function () { cb(e.target.result); };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  /* ---------- WIADOMOŚCI ---------- */
  function renderMessagesAdmin() {
    var msgs = store.getMessages();
    var view = document.getElementById('view-messages');
    var editing = editingMessageId ? store.getMessage(editingMessageId) : null;

    var form = '' +
      '<form class="admin-form" id="msgForm">' +
        '<h3>' + (editing ? 'Edytuj wiadomość' : 'Dodaj wiadomość') + '</h3>' +
        '<label>Tytuł<input type="text" name="title" value="' + esc(editing ? editing.title : '') + '" placeholder="np. Nowy plugin!" required></label>' +
        '<label>Treść<textarea name="body" placeholder="Treść wiadomości...">' + esc(editing ? editing.body : '') + '</textarea></label>' +
        '<button type="submit" class="btn btn-primary">' + (editing ? 'Zapisz zmiany' : 'Dodaj wiadomość') + '</button>' +
        (editing ? ' <button type="button" class="btn btn-ghost" id="cancelMsgEdit">Anuluj</button>' : '') +
      '</form>';

    var list = msgs.length ? msgs.map(function (m) {
      return '' +
        '<div class="admin-item">' +
          '<div class="ai-icon" style="--cat-color:#a855f7">💬</div>' +
          '<div class="ai-body"><h4>' + esc(m.title) + '</h4><p>' + esc(m.body || '') + '</p></div>' +
          '<div class="ai-actions">' +
            '<button class="icon-btn" data-edit-msg="' + esc(m.id) + '" title="Edytuj">✎</button>' +
            '<button class="icon-btn" data-del-msg="' + esc(m.id) + '" title="Usuń">🗑</button>' +
          '</div>' +
        '</div>';
    }).join('') : '<div class="empty">Brak wiadomości.</div>';

    view.innerHTML = form + '<div class="admin-list">' + list + '</div>';

    document.getElementById('msgForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(e.target);
      var data = {
        title: String(fd.get('title') || '').trim(),
        body: String(fd.get('body') || '').trim()
      };
      if (!data.title) return;
      if (editingMessageId) {
        store.updateMessage(editingMessageId, data);
        editingMessageId = null;
        toast('Wiadomość zaktualizowana');
      } else {
        store.addMessage(data);
        toast('Wiadomość dodana');
      }
      renderMessagesAdmin();
      app.renderMessages();
      renderDash();
    });

    var cancel = document.getElementById('cancelMsgEdit');
    if (cancel) cancel.addEventListener('click', function () { editingMessageId = null; renderMessagesAdmin(); });

    Array.prototype.forEach.call(view.querySelectorAll('[data-edit-msg]'), function (b) {
      b.addEventListener('click', function () {
        editingMessageId = b.getAttribute('data-edit-msg');
        renderMessagesAdmin();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    Array.prototype.forEach.call(view.querySelectorAll('[data-del-msg]'), function (b) {
      b.addEventListener('click', function () {
        if (confirm('Usunąć tę wiadomość?')) {
          store.deleteMessage(b.getAttribute('data-del-msg'));
          renderMessagesAdmin();
          app.renderMessages();
          renderDash();
          toast('Wiadomość usunięta', 'err');
        }
      });
    });
  }

  /* ---------- USTAWIENIA (logo + teksty) ---------- */
  function renderSettings() {
    var site = store.getSite();
    var view = document.getElementById('view-settings');

    draftLogo = draftLogo || site.logo || 'DC';

    view.innerHTML = '' +
      '<form class="admin-form" id="siteForm">' +
        '<h3>Profil i teksty strony</h3>' +
        '<div class="logo-preview"><span class="logo-mark" id="logoPreview">' + esc(draftLogo) + '</span></div>' +
        '<label>Logo profilu (tekst lub obraz)<input type="text" name="logo" value="' + esc(site.logo || 'DC') + '" maxlength="60" placeholder="np. DC"></label>' +
        '<label>Albo wgraj obrazek logo<input type="file" id="logoFile" accept="image/*"></label>' +
        '<label>Tekst pod nagłówkiem (hero)<textarea name="heroSub">' + esc(site.heroSub || '') + '</textarea></label>' +
        '<label>Nagłówek "O mnie"<input type="text" name="aboutTitle" value="' + esc(site.aboutTitle || '') + '"></label>' +
        '<label>Opis "O mnie"<textarea name="aboutText">' + esc(site.aboutText || '') + '</textarea></label>' +
        '<label>Tekst kontaktu<textarea name="contactText">' + esc(site.contactText || '') + '</textarea></label>' +
        '<label>Nazwa Discord<input type="text" name="discord" value="' + esc(site.discord || 'darkcore67') + '"></label>' +
        '<label>Link Discord<input type="url" name="discordUrl" value="' + esc(site.discordUrl || '') + '"></label>' +
        '<button type="submit" class="btn btn-primary">Zapisz ustawienia</button>' +
      '</form>' +
      '<div class="admin-form">' +
        '<h3>Dane</h3>' +
        '<p class="muted">Wszystko zapisuje się lokalnie w przeglądarce.</p>' +
        '<button class="btn btn-danger" id="resetData">Przywróć dane domyślne</button>' +
      '</div>';

    var logoInput = view.querySelector('input[name="logo"]');
    var preview = document.getElementById('logoPreview');

    function setPreview(val) {
      if (/^(data:image|https?:|\.)/.test(val)) {
        preview.innerHTML = '<img src="' + esc(val) + '" alt="logo" style="width:100%;height:100%;object-fit:cover;border-radius:12px">';
      } else {
        preview.textContent = val || 'DC';
      }
    }

    logoInput.addEventListener('input', function () {
      draftLogo = logoInput.value;
      setPreview(draftLogo);
    });

    document.getElementById('logoFile').addEventListener('change', function (e) {
      var file = e.target.files && e.target.files[0];
      if (!file) return;
      resizeImage(file, 256, function (dataUrl) {
        draftLogo = dataUrl;
        logoInput.value = dataUrl;
        setPreview(dataUrl);
      });
    });

    document.getElementById('siteForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(e.target);
      store.updateSite({
        logo: String(fd.get('logo') || '').trim() || 'DC',
        heroSub: String(fd.get('heroSub') || '').trim(),
        aboutTitle: String(fd.get('aboutTitle') || '').trim(),
        aboutText: String(fd.get('aboutText') || '').trim(),
        contactText: String(fd.get('contactText') || '').trim(),
        discord: String(fd.get('discord') || '').trim(),
        discordUrl: String(fd.get('discordUrl') || '').trim()
      });
      app.applySite();
      toast('Ustawienia zapisane');
    });

    document.getElementById('resetData').addEventListener('click', function () {
      if (confirm('Przywrócić domyślne dane? Utracisz swoje zmiany.')) {
        store.resetAll();
        editingCatId = null;
        editingPlugin = null;
        editingMessageId = null;
        draftImages = [];
        draftLogo = '';
        renderCatsAdmin();
        renderPluginsAdmin();
        renderMessagesAdmin();
        renderSettings();
        app.renderAll();
        renderDash();
        toast('Przywrócono dane domyślne');
      }
    });
  }

  /* ---------- LOGIN ---------- */
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
