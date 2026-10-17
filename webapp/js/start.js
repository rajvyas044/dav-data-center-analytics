/* ---------- start ---------- */
function pick_tool(tl) {
  state.tool = tl;
  if (tl === 'all') { build_menu(); return; }
  for (var i = 0; i < menu.length; i++) {
    if (menu[i].tool === tl) { go(menu[i].id); return; }
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
  var h = (location.hash || '').replace('#', '');
  if (pages[h]) { state.page = h; }
  build_menu();
  render_page();
}
start();
