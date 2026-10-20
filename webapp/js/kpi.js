/* ---------- KPI DASHBOARD (Tableau) ---------- */
function kpi_calc() {
  var cube = D.cube;
  var f = state.kpi;
  var res = {
    n: 0, pue: 0, wue: 0, elec: 0, water: 0,
    year_n: [], year_pue: [], ctry_n: [], ctry_pue: [],
    type_n: [], type_elec: [], sc_n: [], sc_water: []
  };
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
  var s = head('Tableau', 'Interactive Dashboard', 'Sustainability KPI Dashboard',
    'Four linked views of fleet energy and water performance. Adjust the quick filters below; every chart updates together in real time.');

  // Elevated filter controls panel
  s += '<div class="filter-panel"><div class="bar">' +
    '<label class="field">Year<select id="f_year">' + opt_html(d.year, f.year, false) + '</select></label>' +
    '<label class="field">Facility type<select id="f_type">' + opt_html(d.type, f.type, true) + '</select></label>' +
    '<label class="field">Cooling system<select id="f_cool">' + opt_html(d.cool, f.cool, true) + '</select></label>' +
    '<label class="field">Water stress<select id="f_stress">' + opt_html(d.stress, f.stress, true) + '</select></label>' +
    '<label class="field">Totals shown as<select id="f_metric"><option value="total"' + (f.metric === 'total' ? ' selected' : '') + '>Total (sum of daily values)</option><option value="avg"' + (f.metric === 'avg' ? ' selected' : '') + '>Average per facility-year</option></select></label>' +
    '<button class="btn" id="f_reset">Reset filters</button></div></div>';

  s += '<div id="kpi_out"></div>';
  return s;
};

function kpi_draw() {
  var d = D.cube.dims;
  var f = state.kpi;
  var res = kpi_calc();
  clear_charts();

  if (res.n === 0) {
    el('kpi_out').innerHTML = '<div class="panel"><h2>No records match these filters</h2><p class="what">Some combinations do not exist, for example Liquid Cooled with Enterprise/Standard facilities. Reset the filters or choose a different combination.</p></div>';
    return;
  }

  var all_pue = 0;
  var all_n = 0;
  for (var i = 0; i < D.yearly.length; i++) {
    all_pue += D.yearly[i].pue * D.yearly[i].n;
    all_n += D.yearly[i].n;
  }
  var fleet_pue = all_pue / all_n;
  var total = (f.metric === 'total');

  var out = '';

  // 1. Metric Summary Strip (Open layout, no nested box clutter)
  out += '<div class="stat-strip five-items">';
  out += '<div class="stat-item"><span class="lbl">Active Records</span><span class="num">' + fmt(res.n) + '</span><span class="sub">facility-years in view</span></div>';
  out += '<div class="stat-item"><span class="lbl">Average PUE</span><span class="num">' + fmt(res.pue / res.n, 3) + '</span><span class="sub">fleet baseline ' + fmt(fleet_pue, 3) + ' (lower is better)</span></div>';
  out += '<div class="stat-item"><span class="lbl">Average WUE</span><span class="num">' + fmt(res.wue / res.n, 2) + '</span><span class="sub">litres per IT kWh</span></div>';
  out += '<div class="stat-item"><span class="lbl">' + (total ? 'Total Electricity' : 'Avg Electricity') + '</span><span class="num">' + (total ? fmt(res.elec / 1e6, 2) + 'M' : fmt(res.elec / res.n, 0)) + '</span><span class="sub">' + (total ? 'Million MWh sum' : 'MWh per site per day') + '</span></div>';
  out += '<div class="stat-item"><span class="lbl">' + (total ? 'Total Water Draw' : 'Avg Water Draw') + '</span><span class="num">' + (total ? fmt(res.water / 1e9, 2) + 'B' : fmt(res.water / res.n / 1000, 1) + 'k') + '</span><span class="sub">' + (total ? 'Billion gallons sum' : 'k gal per site per day') + '</span></div>';
  out += '</div>';

  // 2. Section 1: Hero Visualization - Fleet Efficiency Trajectory
  out += '<div class="kpi-section">';
  out += '<div class="section-header"><h2>1. Energy Overhead Trend (PUE Over Time)</h2><p>How power efficiency evolved across reporting years for the selected facilities.</p></div>';
  out += '<section class="panel hero-panel">';
  out += '<div class="chart tall"><canvas id="k_trend"></canvas></div>';
  out += '<div class="meaning-box" id="k_trend_note"></div>';

  // Collapsible detail table for Section 1
  var trend_rows = '';
  for (var y = 0; y < d.year.length; y++) {
    var yp = res.year_n[y] > 0 ? (res.year_pue[y] / res.year_n[y]) : null;
    if (yp !== null) {
      var diff = yp - fleet_pue;
      var status_tag = diff <= 0 ? '<span class="pill good">Better than baseline</span>' : '<span class="pill warn">Above baseline</span>';
      trend_rows += '<tr><td>' + d.year[y] + '</td><td class="num">' + fmt(res.year_n[y]) + '</td><td class="num">' + fmt(yp, 3) + '</td><td>' + status_tag + '</td></tr>';
    }
  }
  var trend_table = '<div class="tw"><table><thead><tr><th>Year</th><th class="num">Records</th><th class="num">Average PUE</th><th>Fleet Comparison</th></tr></thead><tbody>' + trend_rows + '</tbody></table></div>';
  out += details_box('Show detailed yearly metrics table', trend_table);
  out += '</section>';
  out += '</div>';

  // 3. Section 2: Operational Drivers - Facility Type & Geographic Efficiency
  out += '<div class="kpi-section">';
  out += '<div class="section-header"><h2>2. Operational Drivers: Facility Type & Geography</h2><p>Compare electricity demand across data center classifications and examine country-level energy overhead.</p></div>';
  out += '<div class="grid g2">';

  // Left: Facility Type (Interactive)
  out += '<section class="panel">';
  out += '<h2>Electricity Use by Facility Type</h2>';
  out += '<p class="what">Click any bar to filter the whole dashboard to that type (Tableau dashboard action).</p>';
  out += '<div class="chart"><canvas id="k_type"></canvas></div>';
  out += '<div class="meaning-box" id="k_type_note"></div>';
  out += '</section>';

  // Right: Country efficiency
  out += '<section class="panel">';
  out += '<h2>Average PUE by Country</h2>';
  out += '<p class="what">Countries with reporting records, showing lower (better) vs higher cooling overhead.</p>';
  out += '<div class="chart tall"><canvas id="k_ctry"></canvas></div>';
  out += '<div class="meaning-box" id="k_ctry_note"></div>';
  out += '</section>';

  out += '</div>'; // end g2
  out += '</div>'; // end kpi-section

  // 4. Section 3: Environmental Footprint - Water Stress & Cooling Systems
  out += '<div class="kpi-section">';
  out += '<div class="section-header"><h2>3. Environmental Impact: Water Stress & Cooling</h2><p>Examine water consumption in low, medium, and high stress regions across cooling technologies.</p></div>';
  out += '<section class="panel hero-panel">';
  out += '<div class="chart tall"><canvas id="k_water"></canvas></div>';
  out += '<div class="meaning-box" id="k_water_note"></div>';

  // Collapsible cooling technology details
  var cool_info = '<p class="what" style="margin-bottom:10px">Different cooling systems balance power vs water trade-offs:</p>' +
    '<ul class="steps">' +
    '<li><b>Evaporative cooling:</b> Uses water evaporation to reject heat; high water draw, very vulnerable in High water-stress regions.</li>' +
    '<li><b>Air cooling:</b> Consumes minimal site water, but relies on heavy chillers and fans, increasing PUE in hot weather.</li>' +
    '<li><b>Hybrid / Liquid cooling:</b> High thermal efficiency for dense computing clusters; balances water conservation with low PUE.</li>' +
    '</ul>';
  out += details_box('Show cooling technology & water stress guidance', cool_info);
  out += '</section>';
  out += '</div>';

  el('kpi_out').innerHTML = out;

  /* ---------- Chart 1: Trend line ---------- */
  var labels = [];
  var vals = [];
  var radii = [];
  for (var yr = 0; yr < d.year.length; yr++) {
    labels.push(d.year[yr]);
    vals.push(res.year_n[yr] > 0 ? res.year_pue[yr] / res.year_n[yr] : null);
    radii.push(String(d.year[yr]) === String(f.year) ? 8 : 4);
  }
  var o1 = base_options('Year', 'Average PUE');
  o1.plugins.legend.display = false;
  o1.scales.y.min = Math.floor(Math.min.apply(null, vals.filter(function (v) { return v !== null; })) * 20) / 20 - 0.05;
  o1.plugins.tooltip.callbacks = {
    label: function (c) {
      return 'Average PUE: ' + fmt(c.parsed.y, 3) + ' (' + fmt(res.year_n[c.dataIndex]) + ' records)';
    }
  };
  make_chart('k_trend', {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        data: vals,
        borderColor: sc(0),
        backgroundColor: sc(0),
        pointRadius: radii,
        pointHoverRadius: 9,
        tension: 0.25,
        borderWidth: 2.5
      }]
    },
    options: o1
  });

  var first = vals[0];
  var lastv = vals[vals.length - 1];
  el('k_trend_note').innerHTML = '<b>What this means in plain words:</b> Over the measured period, average PUE moved from ' + fmt(first, 3) + ' in ' + d.year[0] + ' to ' + fmt(lastv, 3) + ' in ' + d.year[d.year.length - 1] + ' (' + (lastv < first ? 'an improvement' : 'a decline') + ' of ' + fmt(Math.abs(first - lastv) / first * 100, 1) + '%). Lower PUE indicates less wasted energy on cooling overhead.';

  /* ---------- Chart 2: Country bar chart ---------- */
  var rows = [];
  for (var c = 0; c < d.ctry.length; c++) {
    if (d.ctry[c] === 'Other/Unknown' || res.ctry_n[c] === 0) { continue; }
    rows.push({name: d.ctry[c], pue: res.ctry_pue[c] / res.ctry_n[c], n: res.ctry_n[c]});
  }
  rows.sort(function (a, b) { return b.pue - a.pue; });
  var cl = [];
  var cv = [];
  for (var q = 0; q < rows.length; q++) {
    cl.push(rows[q].name);
    cv.push(rows[q].pue);
  }
  var o2 = base_options('Average PUE', '');
  o2.indexAxis = 'y';
  o2.plugins.legend.display = false;
  o2.scales.x.min = 1;
  o2.scales.y.title = {display: false};
  o2.plugins.tooltip.callbacks = {
    label: function (cx) {
      var r = rows[cx.dataIndex];
      return ['Average PUE: ' + fmt(r.pue, 3), fmt(r.n) + ' records'];
    }
  };
  make_chart('k_ctry', {
    type: 'bar',
    data: {
      labels: cl,
      datasets: [{
        data: cv,
        backgroundColor: sc(0),
        borderRadius: 5
      }]
    },
    options: o2
  });

  if (rows.length > 0) {
    el('k_ctry_note').innerHTML = '<b>What this means in plain words:</b> Among reporting countries, ' + rows[rows.length - 1].name + ' operates with the highest efficiency (' + fmt(rows[rows.length - 1].pue, 2) + ' PUE), while ' + rows[0].name + ' has the highest cooling energy overhead (' + fmt(rows[0].pue, 2) + ' PUE).';
  }

  /* ---------- Chart 3: Facility Type (Interactive click filter) ---------- */
  var tl = [];
  var tv = [];
  var tcol = [];
  for (var t = 0; t < d.type.length; t++) {
    tl.push(d.type[t]);
    var v2 = total ? res.type_elec[t] / 1e6 : (res.type_n[t] > 0 ? res.type_elec[t] / res.type_n[t] : 0);
    tv.push(v2);
    tcol.push(String(f.type) === String(t) || f.type === 'all' ? sc(3) : get_css('--panel2'));
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
  o3.plugins.tooltip.callbacks = {
    label: function (cx) {
      return [
        (total ? 'Total ' + fmt(cx.parsed.y, 2) + ' million MWh' : 'Average ' + fmt(cx.parsed.y, 0) + ' MWh per day'),
        fmt(res.type_n[cx.dataIndex]) + ' records'
      ];
    }
  };
  make_chart('k_type', {
    type: 'bar',
    data: {
      labels: tl,
      datasets: [{
        data: tv,
        backgroundColor: tcol,
        borderRadius: 5
      }]
    },
    options: o3
  });

  var best = -1;
  for (var b = 0; b < tv.length; b++) {
    if (best < 0 || tv[b] > tv[best]) { best = b; }
  }
  el('k_type_note').innerHTML = '<b>What this means in plain words:</b> ' + tl[best] + ' facilities account for the largest share of ' + (total ? 'total fleet electricity' : 'daily per-site electricity') + '. Click any bar above to filter all charts to that facility type.';

  /* ---------- Chart 4: Water by stress & cooling tech ---------- */
  var sl = d.stress;
  var datasets = [];
  for (var cc = 0; cc < d.cool.length; cc++) {
    var dv = [];
    for (var ss = 0; ss < 3; ss++) {
      var k_idx = ss * 3 + cc;
      dv.push(total ? res.sc_water[k_idx] / 1e9 : (res.sc_n[k_idx] > 0 ? res.sc_water[k_idx] / res.sc_n[k_idx] / 1000 : 0));
    }
    datasets.push({
      label: d.cool[cc],
      data: dv,
      backgroundColor: sc(cc),
      borderRadius: 4
    });
  }
  var o4 = base_options('Surrounding Water Stress Tier', total ? 'Billion gallons (sum of daily usage)' : 'Thousand gallons per site per day');
  o4.scales.x.stacked = true;
  o4.scales.y.stacked = true;
  o4.plugins.tooltip.callbacks = {
    label: function (cx) {
      var k2 = cx.dataIndex * 3 + cx.datasetIndex;
      return cx.dataset.label + ': ' + (total ? fmt(cx.parsed.y, 2) + ' billion gal' : fmt(cx.parsed.y, 1) + 'k gal/site/day') + ' (' + fmt(res.sc_n[k2]) + ' records)';
    }
  };
  make_chart('k_water', {
    type: 'bar',
    data: {
      labels: sl,
      datasets: datasets
    },
    options: o4
  });

  var evap = d.cool.indexOf('Evaporative');
  var tot_w = 0;
  var evap_w = 0;
  for (var z = 0; z < 9; z++) {
    tot_w += res.sc_water[z];
    if (z % 3 === evap) { evap_w += res.sc_water[z]; }
  }
  el('k_water_note').innerHTML = '<b>What this means in plain words:</b> Evaporative cooling consumes ' + pct(evap_w, tot_w, 0) + ' of all water in the current selection. Operating evaporative towers in High water-stress regions presents acute sustainability and operational risk.';
}

after.kpi = function () {
  var ids = ['year', 'type', 'cool', 'stress', 'metric'];
  for (var i = 0; i < ids.length; i++) {
    (function (key) {
      el('f_' + key).addEventListener('change', function () {
        state.kpi[key] = el('f_' + key).value;
        kpi_draw();
      });
    })(ids[i]);
  }
  el('f_reset').addEventListener('click', function () {
    state.kpi = {year: 'all', type: 'all', cool: 'all', stress: 'all', metric: 'total'};
    render_page();
  });
  kpi_draw();
};
