/* ---------- start ---------- */
function pick_tool(tl) {
  state.tool = tl;
  if (tl === 'all') { build_menu(); return; }
  for (var i = 0; i < menu.length; i++) {
    if (menu[i].tool === tl) { go(menu[i].id); return; }
  }
}

/* ---------- mobile collapsible sidebar with scroll trap ---------- */
function init_mobile_sidebar() {
  var menu_toggle = el('menu_toggle');
  var menu_close = el('menu_close');
  var side = el('sidebar');
  var backdrop = el('drawer_backdrop');

  function open_menu() {
    if (side) { side.classList.add('open'); }
    if (menu_toggle) { menu_toggle.setAttribute('aria-expanded', 'true'); }
    if (backdrop) { backdrop.classList.add('show'); }
    document.body.style.overflow = 'hidden';
  }

  function close_menu() {
    if (side) { side.classList.remove('open'); }
    if (menu_toggle) { menu_toggle.setAttribute('aria-expanded', 'false'); }
    if (backdrop) { backdrop.classList.remove('show'); }
    document.body.style.overflow = '';
  }

  if (menu_toggle) {
    menu_toggle.addEventListener('click', function () {
      var is_open = side && side.classList.contains('open');
      if (is_open) {
        close_menu();
      } else {
        open_menu();
      }
    });
  }

  if (menu_close) {
    menu_close.addEventListener('click', close_menu);
  }

  if (backdrop) {
    backdrop.addEventListener('click', close_menu);
  }

  // Close sidebar on small screens when a navigation button is clicked
  var nav = el('nav');
  if (nav) {
    nav.addEventListener('click', function () {
      if (window.innerWidth <= 960) {
        close_menu();
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

  init_mobile_sidebar();

  var h = (location.hash || '').replace('#', '');
  if (pages[h]) { state.page = h; }
  build_menu();
  render_page();
}
start();
