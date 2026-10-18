/* ---------- KPI DASHBOARD (Tableau) ---------- */
function kpi_calc() {
  var cube = D.cube;
  var f = state.kpi;
  var res = {n: 0, pue: 0, wue: 0, elec: 0, water: 0,
    year_n: [], year_pue: [], ctry_n: [], ctry_pue: [], type_n: [], type_elec: [], sc_n: [], sc_water: []};
  var i;
  for (i = 0; i < cube.dims.year.length; i++) { res.year_n.push(0); res.year_pue.push(0); }
  for (i = 0; i < cube.dims.ctry.length; i++) { res.ctry_n.push(0); res.ctry_pue.push(0); }
  for (i = 0; i < cube.dims.type.length; i++) { res.type_n.push(0); res.type_elec.push(0); }
  for (i = 0; i < 9; i++) { res.sc_n.push(0); res.sc_water.push(0); }
  for (i = 0; i < cube.rows.length; i++) {
    var r = cube.rows[i];
    if (f.type !== 'all' && r[1] !== Number(f.type)) { continue; }
    if (f.cool !== 'all' && r[2] !== Number(f.cool)) { continue; }
    if (f.stress !== 'all' && r[3] !== Number(f.stress)) { continue; }
    var yi = cube.dims.year.indexOf(r[0]);
    res.year_n[yi] += r[5];
    res.year_pue[yi] += r[6];
    if (f.year !== 'all' && r[0] !== Number(f.year)) { continue; }
    res.n += r[5]; res.pue += r[6]; res.wue += r[7]; res.elec += r[8]; res.water += r[9];
    res.ctry_n[r[4]] += r[5]; res.ctry_pue[r[4]] += r[6];
    res.type_n[r[1]] += r[5]; res.type_elec[r[1]] += r[8];
    var k = r[3] * 3 + r[2];
    res.sc_n[k] += r[5]; res.sc_water[k] += r[9];
  }
  return res;
}
function opt_html(list, value, with_index) {
  var s = '<option value="all">All</option>';
  for (var i = 0; i < list.length; i++) {
    var v = with_index ? i : list[i];
    s += '<option value="' + v + '"' + (String(v) === String(value) ? ' selected' : '') + '>' + list[i] + '</option>';
  }
  return s;
}
pages.kpi = function () {
  var d = D.cube.dims;
  var f = state.kpi;
  var s = head('Tableau', 'interactive dashboard', 'Sustainability KPI dashboard',
    'Four linked views of energy and water performance. Use the filters like Tableau quick filters; every chart updates together.');
  s += '<div class="bar">' +
    '<label class="field">Year<select id="f_year">' + opt_html(d.year, f.year, false) + '</select></label>' +
    '<label class="field">Facility type<select id="f_type">' + opt_html(d.type, f.type, true) + '</select></label>' +
    '<label class="field">Cooling system<select id="f_cool">' + opt_html(d.cool, f.cool, true) + '</select></label>' +
    '<label class="field">Water stress<select id="f_stress">' + opt_html(d.stress, f.stress, true) + '</select></label>' +
    '<label class="field">Totals shown as<select id="f_metric"><option value="total"' + (f.metric === 'total' ? ' selected' : '') + '>Total (sum of daily values)</option><option value="avg"' + (f.metric === 'avg' ? ' selected' : '') + '>Average per facility-year</option></select></label>' +
    '<button class="btn" id="f_reset">Reset filters</button></div>';
  s += '<div id="kpi_out"></div>';
  return s;
};
function kpi_draw() {
  var d = D.cube.dims;
  var f = state.kpi;
  var res = kpi_calc();
  clear_charts();
  if (res.n === 0) {
    el('kpi_out').innerHTML = '<div class="panel"><h2>No records match these filters</h2><p class="what">Some combinations do not exist, for example Liquid Cooled with Enterprise/Standard facilities. Reset the filters or change one of them.</p></div>';
    return;
  }
  var all_pue = 0;
  var all_n = 0;
  for (var i = 0; i < D.yearly.length; i++) { all_pue += D.yearly[i].pue * D.yearly[i].n; all_n += D.yearly[i].n; }
  var fleet_pue = all_pue / all_n;
  var cards = '<div class="grid gk">' +
    kpi_card('Records', fmt(res.n), 'facility-year rows in view') +
    kpi_card('Average PUE', fmt(res.pue / res.n, 3), 'fleet average ' + fmt(fleet_pue, 3) + ' · lower is better', 'PUE = total facility energy divided by IT energy. 1.0 would be perfect.') +
    kpi_card('Average WUE', fmt(res.wue / res.n, 2), 'litres per kWh · lower is better', 'WUE = litres of water used per kWh of IT energy.') +
    kpi_card('Avg daily electricity', fmt(res.elec / res.n, 0), 'MWh per facility per day') +
    kpi_card('Avg daily water', fmt(res.water / res.n / 1000, 1) + 'k', 'gallons per facility per day') + '</div>';
  var out = cards + '<div class="grid g2">' +
    panel('Average PUE by year', 'Energy efficiency over time. The chosen year is highlighted; other filters still apply.', '<div class="chart"><canvas id="k_trend"></canvas></div>', '<span id="k_trend_note"></span>') +
    panel('Average PUE by country', 'Countries with the most records, worst PUE first. Records with an unknown or corrupted country are left out.', '<div class="chart tall"><canvas id="k_ctry"></canvas></div>', '<span id="k_ctry_note"></span>') +
    panel('Electricity use by facility type', 'Click a bar to filter the whole dashboard to that type, like a Tableau dashboard action.', '<div class="chart"><canvas id="k_type"></canvas></div>', '<span id="k_type_note"></span>') +
    panel('Water use by stress tier and cooling system', 'Where water is used: regions with low, medium and high water stress, split by cooling technology.', '<div class="chart"><canvas id="k_water"></canvas></div>', '<span id="k_water_note"></span>') +
    '</div>';
  el('kpi_out').innerHTML = out;
  var total = (f.metric === 'total');
  /* trend */
  var labels = [];
  var vals = [];
  var radii = [];
  for (var y = 0; y < d.year.length; y++) {
    labels.push(d.year[y]);
    vals.push(res.year_n[y] > 0 ? res.year_pue[y] / res.year_n[y] : null);
    radii.push(String(d.year[y]) === String(f.year) ? 8 : 4);
  }
  var o1 = base_options('Year', 'Average PUE');
  o1.plugins.legend.display = false;
  o1.scales.y.min = Math.floor(Math.min.apply(null, vals.filter(function (v) { return v !== null; })) * 20) / 20 - 0.05;
  o1.plugins.tooltip.callbacks = {label: function (c) { return 'Average PUE ' + fmt(c.parsed.y, 3) + ' (' + fmt(res.year_n[c.dataIndex]) + ' records)'; }};
  make_chart('k_trend', {type: 'line', data: {labels: labels, datasets: [{data: vals, borderColor: sc(0), backgroundColor: sc(0), pointRadius: radii, tension: .25, borderWidth: 2}]}, options: o1});
  var first = vals[0];
  var lastv = vals[vals.length - 1];
  el('k_trend_note').innerHTML = '<b>Reading:</b> PUE moved from ' + fmt(first, 3) + ' in ' + d.year[0] + ' to ' + fmt(lastv, 3) + ' in ' + d.year[d.year.length - 1] + ', ' + (lastv < first ? 'an improvement' : 'a decline') + ' of ' + fmt(Math.abs(first - lastv) / first * 100, 1) + '%.';
  /* country */
  var rows = [];
  for (var c = 0; c < d.ctry.length; c++) {
    if (d.ctry[c] === 'Other/Unknown' || res.ctry_n[c] === 0) { continue; }
    rows.push({name: d.ctry[c], pue: res.ctry_pue[c] / res.ctry_n[c], n: res.ctry_n[c]});
  }
  rows.sort(function (a, b) { return b.pue - a.pue; });
  var cl = [];
  var cv = [];
  for (var q = 0; q < rows.length; q++) { cl.push(rows[q].name); cv.push(rows[q].pue); }
  var o2 = base_options('Average PUE', '');
  o2.indexAxis = 'y';
  o2.plugins.legend.display = false;
  o2.scales.x.min = 1;
  o2.scales.y.title = {display: false};
  o2.plugins.tooltip.callbacks = {label: function (cx) { var r = rows[cx.dataIndex]; return ['Average PUE ' + fmt(r.pue, 3), fmt(r.n) + ' records']; }};
  make_chart('k_ctry', {type: 'bar', data: {labels: cl, datasets: [{data: cv, backgroundColor: sc(0), borderRadius: 3}]}, options: o2});
  if (rows.length > 0) {
    el('k_ctry_note').innerHTML = '<b>Reading:</b> ' + rows[rows.length - 1].name + ' is the most efficient (' + fmt(rows[rows.length - 1].pue, 2) + ') and ' + rows[0].name + ' the least (' + fmt(rows[0].pue, 2) + ') among these countries.';
  }
  /* type */
  var tl = [];
  var tv = [];
  var tcol = [];
  for (var t = 0; t < d.type.length; t++) {
    tl.push(d.type[t]);
    var v2 = total ? res.type_elec[t] / 1e6 : (res.type_n[t] > 0 ? res.type_elec[t] / res.type_n[t] : 0);
    tv.push(v2);
    tcol.push(String(f.type) === String(t) || f.type === 'all' ? sc(2) : get_css('--line'));
  }
  var o3 = base_options('', total ? 'Million MWh (sum of daily usage)' : 'MWh per facility per day');
  o3.plugins.legend.display = false;
  o3.onClick = function (ev, els) {
    if (els.length > 0) {
      var idx = els[0].index;
      state.kpi.type = (String(state.kpi.type) === String(idx)) ? 'all' : String(idx);
      el('f_type').value = state.kpi.type;
      setTimeout(kpi_draw, 0);
    }
  };
  o3.plugins.tooltip.callbacks = {label: function (cx) {
    return [(total ? 'Total ' + fmt(cx.parsed.y, 2) + ' million MWh' : 'Average ' + fmt(cx.parsed.y, 0) + ' MWh per day'), fmt(res.type_n[cx.dataIndex]) + ' records'];
  }};
  make_chart('k_type', {type: 'bar', data: {labels: tl, datasets: [{data: tv, backgroundColor: tcol, borderRadius: 4}]}, options: o3});
  var best = -1;
  for (var b = 0; b < tv.length; b++) { if (best < 0 || tv[b] > tv[best]) { best = b; } }
  el('k_type_note').innerHTML = '<b>Reading:</b> ' + tl[best] + ' facilities lead on ' + (total ? 'total' : 'per-site') + ' electricity. Switch the totals menu to Average to see how much power a single site draws.';
  /* water */
  var sl = d.stress;
  var datasets = [];
  for (var cc = 0; cc < d.cool.length; cc++) {
    var dv = [];
    for (var ss = 0; ss < 3; ss++) {
      var k = ss * 3 + cc;
      dv.push(total ? res.sc_water[k] / 1e9 : (res.sc_n[k] > 0 ? res.sc_water[k] / res.sc_n[k] / 1000 : 0));
    }
    datasets.push({label: d.cool[cc], data: dv, backgroundColor: sc(cc), borderRadius: 3});
  }
  var o4 = base_options('Surrounding water stress', total ? 'Billion gallons (sum of daily usage)' : 'Thousand gallons per facility per day');
  o4.scales.x.stacked = true;
  o4.scales.y.stacked = true;
  o4.plugins.tooltip.callbacks = {label: function (cx) {
    var k2 = cx.dataIndex * 3 + cx.datasetIndex;
    return cx.dataset.label + ': ' + (total ? fmt(cx.parsed.y, 2) + ' billion gal' : fmt(cx.parsed.y, 1) + 'k gal per site per day') + ' (' + fmt(res.sc_n[k2]) + ' records)';
  }};
  make_chart('k_water', {type: 'bar', data: {labels: sl, datasets: datasets}, options: o4});
  var wl = 0;
  var evap = d.cool.indexOf('Evaporative');
  var tot_w = 0;
  var evap_w = 0;
  for (var z = 0; z < 9; z++) { tot_w += res.sc_water[z]; if (z % 3 === evap) { evap_w += res.sc_water[z]; } }
  el('k_water_note').innerHTML = '<b>Reading:</b> evaporative cooling accounts for ' + pct(evap_w, tot_w, 0) + ' of the water in view. That is a risk where the stress tier is High.';
}
after.kpi = function () {
  var ids = ['year', 'type', 'cool', 'stress', 'metric'];
  for (var i = 0; i < ids.length; i++) {
    (function (key) {
      el('f_' + key).addEventListener('change', function () { state.kpi[key] = el('f_' + key).value; kpi_draw(); });
    })(ids[i]);
  }
  el('f_reset').addEventListener('click', function () {
    state.kpi = {year: 'all', type: 'all', cool: 'all', stress: 'all', metric: 'total'};
    render_page();
  });
  kpi_draw();
};
