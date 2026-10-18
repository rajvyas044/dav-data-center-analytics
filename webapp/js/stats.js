/* ---------- STATISTICS ---------- */
var stat_note = {
  Estimated_Capacity_MW: 'Most facilities are small. A few very large ones stretch the right tail, so the mean (23.1) is far above the median (9.9).',
  PUE: 'Tight and nearly symmetric, between 1.06 and 2.00. Few outliers, so PUE is a reliable measure here.',
  WUE_L_per_kWh: 'Two humps: air-cooled sites near zero and evaporative sites near 2 L per kWh. No outliers by the IQR rule.',
  Daily_Electricity_Usage_MWh: 'Right-skewed, following capacity. The mean is about double the median.',
  Daily_Water_Usage_Gallons: 'Extremely right-skewed. Evaporative sites use far more water than air-cooled ones.'
};
pages.stats = function () {
  var s = head('Python', 'pandas, NumPy', 'Statistics and outliers',
    'Five-number summary, mode, midrange and two outlier tests for the five measures, plus how they relate to each other.');
  var opts = '';
  for (var i = 0; i < D.stats.length; i++) {
    opts += '<option value="' + i + '"' + (i === state.stat_attr ? ' selected' : '') + '>' + nice(D.stats[i].name) + '</option>';
  }
  s += '<div class="bar"><label class="field">Attribute<select id="stat_sel">' + opts + '</select></label></div>';
  s += '<div id="stat_out"></div>';
  var rows = '';
  for (var j = 0; j < D.stats.length; j++) {
    var t = D.stats[j];
    rows += '<tr><td><b>' + nice(t.name) + '</b></td><td class="num">' + fmt(t.mean, 2) + '</td><td class="num">' + fmt(t.median, 2) + '</td><td class="num">' + fmt(t.mode, 2) + '</td><td class="num">' + fmt(t.midrange, 2) +
      '</td><td class="num">' + fmt(t.iqr_n) + ' (' + t.iqr_pct + '%)</td><td class="num">' + fmt(t.z_n) + ' (' + t.z_pct + '%)</td></tr>';
  }
  s += panel('All measures side by side', 'Central tendency and outliers. Two outlier tests are shown: the 1.5 x IQR rule and |z| greater than 3.',
    '<div class="tw"><table><thead><tr><th>Attribute</th><th class="num">Mean</th><th class="num">Median</th><th class="num">Mode</th><th class="num">Midrange</th><th class="num">IQR outliers</th><th class="num">Z-score outliers</th></tr></thead><tbody>' + rows + '</tbody></table></div>',
    '<b>Takeaway:</b> the IQR rule flags far more rows than the z-score rule because the data is skewed. These large values are real big facilities, so they are kept.');
  s += '<div style="margin-top:16px">' + panel('Correlation between measures', 'Pearson r from -1 to +1. Blue is positive, orange is negative. Hover a cell for the pair and its meaning.',
    '<div class="tw"><div class="heat" id="heat" style="min-width:420px"></div></div>',
    '<b>Takeaway:</b> capacity and electricity move together (r = 0.98). PUE falls as capacity rises (r = -0.60), so bigger sites run more efficiently.') + '</div>';
  return s;
};
function box_svg(t) {
  var w = 440;
  var h = 130;
  var lo_w = Math.max(t.min, t.lo);
  var hi_w = Math.min(t.max, t.hi);
  var left = 24;
  var right = 140;
  function px(v) { return left + (v - lo_w) / (hi_w - lo_w) * (w - left - right); }
  var tipfn = function (name, v, extra) { return '<b>' + name + '</b><br>' + fmt(v, 3) + (extra ? '<br>' + extra : ''); };
  var s = '<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" role="img" aria-label="Box plot of ' + nice(t.name) + '">';
  s += '<line x1="' + px(lo_w) + '" x2="' + px(hi_w) + '" y1="52" y2="52" stroke="' + get_css('--ink2') + '" stroke-width="1.5" data-tip="' + tip_attr(tipfn('Whiskers', lo_w, 'to ' + fmt(hi_w, 3) + ' (furthest points inside the fences)')) + '"/>';
  s += '<line x1="' + px(lo_w) + '" x2="' + px(lo_w) + '" y1="40" y2="64" stroke="' + get_css('--ink2') + '" stroke-width="1.5"/>';
  s += '<line x1="' + px(hi_w) + '" x2="' + px(hi_w) + '" y1="40" y2="64" stroke="' + get_css('--ink2') + '" stroke-width="1.5"/>';
  s += '<rect x="' + px(t.q1) + '" y="30" width="' + Math.max(2, px(t.q3) - px(t.q1)) + '" height="44" rx="4" fill="' + sc(0) + '" fill-opacity=".35" stroke="' + sc(0) + '" stroke-width="1.5" data-tip="' + tip_attr(tipfn('Interquartile range (middle 50%)', t.iqr, 'Q1 ' + fmt(t.q1, 3) + ' to Q3 ' + fmt(t.q3, 3))) + '"/>';
  s += '<line x1="' + px(t.median) + '" x2="' + px(t.median) + '" y1="30" y2="74" stroke="' + sc(0) + '" stroke-width="3" data-tip="' + tip_attr(tipfn('Median', t.median)) + '"/>';
  if (t.mean >= lo_w && t.mean <= hi_w) {
    s += '<path d="M' + px(t.mean) + ' 44 l7 8 l-7 8 l-7 -8 z" fill="' + sc(1) + '" stroke="' + get_css('--panel') + '" stroke-width="1.5" data-tip="' + tip_attr(tipfn('Mean', t.mean)) + '"/>';
  }
  s += '<text x="' + px(lo_w) + '" y="96" font-size="12" fill="' + get_css('--ink2') + '" text-anchor="start">' + fmt(lo_w, 2) + '</text>';
  s += '<text x="' + px(hi_w) + '" y="96" font-size="12" fill="' + get_css('--ink2') + '" text-anchor="middle">' + fmt(hi_w, 2) + '</text>';
  s += '<text x="' + px(t.median) + '" y="22" font-size="12" fill="' + get_css('--ink') + '" text-anchor="middle">median ' + fmt(t.median, 2) + '</text>';
  if (t.max > t.hi) {
    s += '<path d="M' + (px(hi_w) + 16) + ' 52 h46 m-8 -6 l8 6 l-8 6" fill="none" stroke="' + sc(1) + '" stroke-width="2" data-tip="' + tip_attr('<b>' + fmt(t.iqr_n) + ' outliers</b><br>above the upper fence ' + fmt(t.hi, 2) + '<br>largest value ' + fmt(t.max, 2)) + '"/>';
    s += '<text x="' + (px(hi_w) + 16) + '" y="76" font-size="12" fill="' + sc(1) + '">outliers up to ' + fmt(t.max, 1) + '</text>';
  } else {
    s += '<text x="' + (px(hi_w) + 16) + '" y="56" font-size="12" fill="' + get_css('--ink2') + '">no high outliers</text>';
  }
  if (t.mean > hi_w) {
    s += '<text x="' + px(t.median) + '" y="116" font-size="12" fill="' + sc(1) + '" text-anchor="middle">mean ' + fmt(t.mean, 1) + ' lies beyond the whisker</text>';
  }
  return s + '</svg>';
}
function stat_draw() {
  var t = D.stats[state.stat_attr];
  var cards = '<div class="grid gk6">' +
    kpi_card('Min', fmt(t.min, 2), 'smallest value') + kpi_card('Q1', fmt(t.q1, 2), '25% fall below') +
    kpi_card('Median', fmt(t.median, 2), 'middle value') + kpi_card('Q3', fmt(t.q3, 2), '75% fall below') +
    kpi_card('Max', fmt(t.max, 2), 'largest value') + kpi_card('IQR', fmt(t.iqr, 2), 'Q3 minus Q1') + '</div>';
  var h = D.hist[t.name];
  var hist_note = h.log ? 'Bins are log-scaled because the values span several orders of magnitude.' : 'Counts per equal-width bin.';
  var out = cards + '<div class="grid g2">' +
    panel('Box plot', 'Box = middle 50%. Whiskers reach the furthest points inside the fences (' + fmt(Math.max(t.min, t.lo), 2) + ' to ' + fmt(t.hi, 2) + '). Hover each part.', box_svg(t),
      '<b>Outliers:</b> ' + fmt(t.iqr_n) + ' by the IQR rule (' + t.iqr_pct + '%) and ' + fmt(t.z_n) + ' by z-score (' + t.z_pct + '%).') +
    panel('Distribution', hist_note + ' Hover a bar for its range and count.', '<div class="chart"><canvas id="hist_c"></canvas></div>', '<b>Reading:</b> ' + stat_note[t.name]) + '</div>';
  el('stat_out').innerHTML = out;
  var labels = [];
  for (var i = 0; i < h.counts.length; i++) { labels.push(fmt(h.edges[i], h.log ? 1 : 2)); }
  var opt = base_options(nice(t.name) + (h.log ? ' (log bins)' : ''), 'Records');
  opt.plugins.legend.display = false;
  opt.scales.x.ticks.maxTicksLimit = 8;
  opt.plugins.tooltip.callbacks = {
    title: function (c) { var i = c[0].dataIndex; return fmt(h.edges[i], 2) + ' to ' + fmt(h.edges[i + 1], 2); },
    label: function (c) { return fmt(c.parsed.y) + ' records (' + pct(c.parsed.y, D.overview.rows, 2) + ')'; }
  };
  make_chart('hist_c', {type: 'bar', data: {labels: labels, datasets: [{data: h.counts, backgroundColor: sc(2), borderRadius: 2, categoryPercentage: 1, barPercentage: .94}]}, options: opt});
}
after.stats = function () {
  el('stat_sel').addEventListener('change', function () {
    state.stat_attr = Number(el('stat_sel').value);
    clear_charts();
    stat_draw();
  });
  stat_draw();
  var short_names = ['Capacity', 'PUE', 'WUE', 'Electricity', 'Water'];
  var m = D.corr.matrix;
  var html = '<div class="hd"></div>';
  for (var i = 0; i < 5; i++) { html += '<div class="hd">' + short_names[i] + '</div>'; }
  for (var r = 0; r < 5; r++) {
    html += '<div class="hd" style="text-align:right;align-self:center">' + short_names[r] + '</div>';
    for (var c = 0; c < 5; c++) {
      var v = m[r][c];
      var a = Math.abs(v);
      var base = v >= 0 ? 'var(--s1)' : 'var(--s2)';
      var strength = a > 0.7 ? 'strong' : (a > 0.4 ? 'moderate' : 'weak');
      var dir = v >= 0 ? 'positive' : 'negative';
      var txt = a > 0.6 ? '#fff' : 'var(--ink)';
      var tipt = '<b>' + short_names[r] + ' and ' + short_names[c] + '</b><br>r = ' + fmt(v, 2) + '<br>' + (r === c ? 'same variable' : strength + ' ' + dir + ' relationship');
      html += '<div style="background:color-mix(in srgb,' + base + ' ' + Math.round(a * 100) + '%,var(--panel));color:' + txt + '" data-tip="' + tip_attr(tipt) + '">' + fmt(v, 2) + '</div>';
    }
  }
  var heat = el('heat');
  heat.style.gridTemplateColumns = '90px repeat(5,minmax(0,1fr))';
  heat.innerHTML = html;
};
