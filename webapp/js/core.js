var charts = [];
var state = {
  page: 'home', tool: 'all', k: 3, stat_attr: 0,
  kpi: {year: 'all', type: 'all', cool: 'all', stress: 'all', metric: 'total'},
  reg: {lin: true, poly: true, pow: true, ridge: false, zoom: 'near', alpha_exp: 0, cap: 50},
  prep_log: true, knime_node: 'k_kmeans'
};
var menu = [
  {id: 'home', label: 'Home', tool: 'all', tag: '', group: 'Start'},
  {id: 'kpi', label: 'KPI dashboard', tool: 'tableau', tag: '', group: 'Tableau'},
  {id: 'cluster', label: 'Clustering', tool: 'tableau', tag: '', group: 'Tableau'},
  {id: 'regress', label: 'Regression', tool: 'tableau', tag: '', group: 'Tableau'},
  {id: 'knime', label: 'KNIME workflow', tool: 'knime', tag: '', group: 'KNIME'},
  {id: 'understand', label: 'Data understanding', tool: 'python', tag: '', group: 'Python'},
  {id: 'stats', label: 'Statistics and outliers', tool: 'python', tag: '', group: 'Python'},
  {id: 'prep', label: 'Preprocessing', tool: 'python', tag: '', group: 'Python'},
  {id: 'apps', label: 'Applications and usefulness', tool: 'all', tag: '', group: 'Why it matters'}
];
var tool_list = [
  {id: 'all', label: 'All', color: ''},
  {id: 'tableau', label: 'Tableau', color: 's1'},
  {id: 'knime', label: 'KNIME', color: 's2'},
  {id: 'python', label: 'Python', color: 's3'}
];

/* ---------- small helpers ---------- */
function get_css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
function sc(i) { return get_css('--s' + (i + 1)); }
function fmt(n, d) {
  if (d === undefined) { d = 0; }
  return Number(n).toLocaleString('en-US', {minimumFractionDigits: d, maximumFractionDigits: d});
}
function pct(a, b, d) { if (d === undefined) { d = 1; } return fmt(a / b * 100, d) + '%'; }
function nice(name) { return name.split('_').join(' '); }
function el(id) { return document.getElementById(id); }
function clear_charts() {
  for (var i = 0; i < charts.length; i++) { charts[i].destroy(); }
  charts = [];
}
function make_chart(id, config) {
  var c = el(id);
  if (!c) { return null; }
  var ch = new Chart(c, config);
  charts.push(ch);
  return ch;
}
function base_options(x_title, y_title) {
  var ink = get_css('--ink2');
  var line = get_css('--line');
  return {
    responsive: true, maintainAspectRatio: false, animation: {duration: 200},
    plugins: {
      legend: {labels: {color: ink, boxWidth: 10, boxHeight: 10, usePointStyle: true}},
      tooltip: {
        backgroundColor: get_css('--ink'), titleColor: get_css('--bg'), bodyColor: get_css('--bg'),
        padding: 10, boxPadding: 4, titleFont: {weight: '600'}
      }
    },
    scales: {
      x: {ticks: {color: ink}, grid: {color: line}, border: {color: line}, title: {display: !!x_title, text: x_title, color: ink}},
      y: {ticks: {color: ink}, grid: {color: line}, border: {color: line}, title: {display: !!y_title, text: y_title, color: ink}}
    }
  };
}
function tip_attr(text) { return text.split('"').join('&quot;'); }
function kpi_card(label, value, note, tip) {
  var t = tip ? ' data-tip="' + tip_attr(tip) + '"' : '';
  return '<div class="kpi"' + t + '><div class="l">' + label + '</div><div class="v">' + value + '</div><div class="n">' + note + '</div></div>';
}
function panel(title, what, inner, insight) {
  var s = '<section class="panel"><h2>' + title + '</h2><p class="what">' + what + '</p>' + inner;
  if (insight) { s += '<div class="insight">' + insight + '</div>'; }
  return s + '</section>';
}
function details_box(summary_text, content_html) {
  return '<details class="detail-box">' +
    '<summary class="detail-summary">' +
    '<span>' + summary_text + '</span>' +
    '<span class="detail-chevron" aria-hidden="true">▾</span>' +
    '</summary>' +
    '<div class="detail-body">' + content_html + '</div>' +
    '</details>';
}
function head(tag, tool, title, aim) {
  return '<div class="crumb"><span class="pill">' + tag + '</span><span>' + tool + '</span></div><h1>' + title + '</h1><p class="lead">' + aim + '</p>';
}
function find_stat(name) {
  for (var i = 0; i < D.stats.length; i++) { if (D.stats[i].name === name) { return D.stats[i]; } }
  return null;
}
function year_row(y) {
  for (var i = 0; i < D.yearly.length; i++) { if (D.yearly[i].year === y) { return D.yearly[i]; } }
  return null;
}

/* ---------- hover tooltip for html / svg parts ---------- */
var tip_box = null;
function tip_move(e) {
  var t = e.target;
  var text = null;
  while (t && t !== document) {
    if (t.getAttribute && t.getAttribute('data-tip')) { text = t.getAttribute('data-tip'); break; }
    t = t.parentNode;
  }
  if (!text) { tip_box.style.display = 'none'; return; }
  tip_box.innerHTML = text;
  tip_box.style.display = 'block';
  var x = e.clientX + 14;
  var y = e.clientY + 14;
  var w = tip_box.offsetWidth;
  var h = tip_box.offsetHeight;
  if (x + w > window.innerWidth - 8) { x = e.clientX - w - 14; }
  if (y + h > window.innerHeight - 8) { y = e.clientY - h - 14; }
  if (x < 8) { x = 8; }
  tip_box.style.left = x + 'px';
  tip_box.style.top = y + 'px';
}

/* ---------- navigation ---------- */
function build_menu() {
  var chips = '';
  for (var i = 0; i < tool_list.length; i++) {
    var t = tool_list[i];
    var d = t.color ? '<span class="dot" style="background:var(--' + t.color + ')"></span>' : '';
    chips += '<button class="chip" data-tool="' + t.id + '" aria-pressed="' + (state.tool === t.id) + '">' + d + t.label + '</button>';
  }
  el('tool_chips').innerHTML = chips;
  var nav = '';
  var last_group = '';
  for (var j = 0; j < menu.length; j++) {
    var m = menu[j];
    var show = (state.tool === 'all') || (m.tool === 'all') || (m.tool === state.tool);
    if (m.id === state.page) { show = true; }
    if (!show) { continue; }
    if (m.group !== last_group && m.group !== 'Start') {
      nav += '<div class="nav-label">' + m.group + '</div>';
    }
    last_group = m.group;
    var cur = (m.id === state.page) ? ' aria-current="page"' : '';
    nav += '<button data-page="' + m.id + '"' + cur + '>' + m.label + '<span class="tag">' + m.tag + '</span></button>';
  }
  el('nav').innerHTML = nav;
}
function go(page) {
  state.page = page;
  try { history.replaceState(null, '', '#' + page); } catch (err) { }
  build_menu();
  render_page();
  window.scrollTo(0, 0);
}
function render_page() {
  clear_charts();
  var main = el('main');
  var fn = pages[state.page];
  if (!fn) { fn = pages.home; }
  main.innerHTML = fn();
  if (after[state.page]) { after[state.page](); }
}
var pages = {};
var after = {};
