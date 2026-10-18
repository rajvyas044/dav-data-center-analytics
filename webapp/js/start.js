/* ---------- start ---------- */
function pick_tool(tl) {
  state.tool = tl;
  if (tl === 'all') { build_menu(); return; }
  for (var i = 0; i < menu.length; i++) {
    if (menu[i].tool === tl) { go(menu[i].id); return; }
  }
}

/* ---------- light/dark theme management ---------- */
function update_theme_ui(theme) {
  var toggle_btn = el('theme_toggle');
  if (toggle_btn) {
    var label = toggle_btn.querySelector('.theme-label');
    var icon = toggle_btn.querySelector('.theme-icon');
    if (theme === 'dark') {
      if (label) { label.textContent = 'Light mode'; }
      if (icon) { icon.textContent = '☼'; }
    } else {
      if (label) { label.textContent = 'Dark mode'; }
      if (icon) { icon.textContent = '◑'; }
    }
  }
  var mobile_btn = el('theme_toggle_mobile');
  if (mobile_btn) {
    mobile_btn.textContent = (theme === 'dark') ? '☼' : '◑';
  }
}

function init_theme() {
  var saved_theme = null;
  try {
    saved_theme = localStorage.getItem('dc_theme');
  } catch (err) { }

  if (saved_theme) {
    document.documentElement.setAttribute('data-theme', saved_theme);
    update_theme_ui(saved_theme);
  }

  function handle_theme_toggle() {
    var cur = document.documentElement.getAttribute('data-theme');
    var is_dark = false;
    if (cur === 'dark') {
      is_dark = true;
    } else if (!cur && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      is_dark = true;
    }
    var next = is_dark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('dc_theme', next);
    } catch (err) { }
    update_theme_ui(next);
  }

  var toggle_btn = el('theme_toggle');
  if (toggle_btn) {
    toggle_btn.addEventListener('click', handle_theme_toggle);
  }
  var mobile_btn = el('theme_toggle_mobile');
  if (mobile_btn) {
    mobile_btn.addEventListener('click', handle_theme_toggle);
  }
}

/* ---------- mobile collapsible sidebar ---------- */
function init_mobile_sidebar() {
  var menu_toggle = el('menu_toggle');
  var menu_close = el('menu_close');
  var side = el('sidebar');

  if (menu_toggle && side) {
    menu_toggle.addEventListener('click', function () {
      var is_open = side.classList.contains('open');
      if (is_open) {
        side.classList.remove('open');
        menu_toggle.setAttribute('aria-expanded', 'false');
      } else {
        side.classList.add('open');
        menu_toggle.setAttribute('aria-expanded', 'true');
      }
    });
  }

  if (menu_close && side) {
    menu_close.addEventListener('click', function () {
      side.classList.remove('open');
      if (menu_toggle) {
        menu_toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Close sidebar on small screens when a navigation button is clicked
  var nav = el('nav');
  if (nav && side) {
    nav.addEventListener('click', function () {
      if (window.innerWidth <= 960) {
        side.classList.remove('open');
        if (menu_toggle) {
          menu_toggle.setAttribute('aria-expanded', 'false');
        }
      }
    });
  }
}

function start() {
  tip_box = el('tip');
  document.addEventListener('mousemove', tip_move);
  document.addEventListener('click', function (e) {
    var t = e.target;
    while (t && t !== document) {
      if (t.getAttribute) {
        var pg = t.getAttribute('data-page');
        if (pg) { go(pg); return; }
        var tl = t.getAttribute('data-tool');
        if (tl) { pick_tool(tl); return; }
      }
      t = t.parentNode;
    }
    tip_move(e);
  });
  try {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { render_page(); });
    new MutationObserver(function () { render_page(); }).observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme']});
  } catch (err) { }
  
  init_theme();
  init_mobile_sidebar();

  var h = (location.hash || '').replace('#', '');
  if (pages[h]) { state.page = h; }
  build_menu();
  render_page();
}
start();
