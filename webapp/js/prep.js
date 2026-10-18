/* ---------- PREPROCESSING (Python) ---------- */
pages.prep = function () {
  var P = D.prep;
  var s = head('Python', 'pandas, SciPy', 'Data preprocessing',
    'Five data-quality steps: smoothing by binning, normalisation, two redundancy tests, and discretisation with the 3-4-5 rule.');
  s += '<div class="grid g2">';
  s += panel('1. Smoothing by binning', 'The first 20 PUE values are sorted, split into 4 equal bins of 5, and each value is replaced by its bin mean. Bars are the original values, the line is the smoothed result.',
    '<div class="chart"><canvas id="p_bin"></canvas></div>',
    '<b>Reading:</b> smoothing removes small ups and downs and leaves four steps: ' + fmt(P.smooth[0], 3) + ', ' + fmt(P.smooth[1], 3) + ', ' + fmt(P.smooth[2], 3) + ', ' + fmt(P.smooth[3], 3) + '.');
  var rows = '';
  for (var i = 0; i < P.norm.length; i++) {
    rows += '<tr><td class="num">' + P.norm[i].pue + '</td><td class="num">' + fmt(P.norm[i].mm, 4) + '</td><td class="num">' + fmt(P.norm[i].z, 4) + '</td></tr>';
  }
  s += panel('2. Normalisation', 'PUE rescaled two ways. Min-max squeezes values into 0 to 1; z-score centres them on 0 with unit spread.',
    '<div class="tw"><table><thead><tr><th class="num">PUE</th><th class="num">Min-max</th><th class="num">Z-score</th></tr></thead><tbody>' + rows + '</tbody></table></div>',
    '<b>Formulas:</b> min-max = (x - ' + P.pmin + ') / (' + P.pmax + ' - ' + P.pmin + '). z = (x - ' + fmt(P.pmean, 3) + ') / ' + fmt(P.pstd, 3) + '. Use min-max for distance methods such as k-means, z-score when outliers matter less.');
  s += panel('3. Redundancy: Pearson correlation', 'Capacity against daily electricity. A very high |r| says one column carries almost the same information as the other.',
    '<div class="grid gk" style="margin-bottom:10px">' + kpi_card('Pearson r', fmt(P.pearson, 4), 'p-value ~ 0') + '</div><div class="chart short"><canvas id="p_pear"></canvas></div>',
    '<b>Reading:</b> r above 0.9 means the pair is redundant. For a model you could keep only one of them.');
  var chi = P.chi;
  var head_row = '<th>Facility type</th>';
  for (var c = 0; c < chi.cols.length; c++) { head_row += '<th class="num">' + chi.cols[c].replace(' Cooled', '') + '</th>'; }
  var body = '';
  for (var r = 0; r < chi.rows.length; r++) {
    body += '<tr><td>' + chi.rows[r] + '</td>';
    for (var cc = 0; cc < chi.cols.length; cc++) { body += '<td class="num">' + fmt(chi.table[r][cc]) + '</td>'; }
    body += '</tr>';
  }
  s += panel('4. Redundancy: chi-square test', 'Are Facility Type and Cooling System independent? Bars show the cooling mix within each facility type.',
    '<div class="chart short"><canvas id="p_chi"></canvas></div><div class="tw" style="margin-top:10px"><table><thead><tr>' + head_row + '</tr></thead><tbody>' + body + '</tbody></table></div>',
    '<b>Result:</b> chi-square = ' + fmt(chi.chi2, 1) + ', dof = ' + chi.dof + ', p below 0.0001, so the two attributes are dependent. Enterprise/Standard sites never use liquid cooling.');
  s += '</div>';
  var b = P.bins345;
  s += '<div class="bar"><div class="field">Count axis<span class="seg" id="p_log"><button class="btn" data-l="1" aria-pressed="' + state.prep_log + '">Log scale</button><button class="btn" data-l="0" aria-pressed="' + (!state.prep_log) + '">Linear scale</button></span></div></div>';
  s += panel('5. Discretisation with the 3-4-5 rule', 'Capacity runs from ' + b.low + ' to ' + b.high + ' MW. The rule looks at the leading digit of the range (5 here), which gives ' + b.parts + ' equal intervals with round edges (0 to 600).',
    '<div class="chart"><canvas id="p_345"></canvas></div>',
    '<b>Reading:</b> ' + pct(b.counts[0], D.overview.rows, 1) + ' of records fall in the first interval (0 to 120 MW). Only ' + fmt(b.counts[4]) + ' records sit above 480 MW, which is why a log scale shows the small bars.');
  return s;
};
function prep_345() {
  var b = D.prep.bins345;
  var labels = [];
  for (var i = 0; i < b.counts.length; i++) { labels.push(b.edges[i] + ' to ' + b.edges[i + 1]); }
  var opt = base_options('Capacity interval (MW)', 'Records');
  opt.plugins.legend.display = false;
  opt.scales.y.type = state.prep_log ? 'logarithmic' : 'linear';
  if (state.prep_log) { opt.scales.y.min = 1; }
  opt.plugins.tooltip.callbacks = {label: function (c) { return fmt(c.parsed.y) + ' records (' + pct(c.parsed.y, D.overview.rows, 2) + ')'; }};
  return {type: 'bar', data: {labels: labels, datasets: [{data: b.counts, backgroundColor: sc(0), borderRadius: 4}]}, options: opt};
}
after.prep = function () {
  var P = D.prep;
  var labels = [];
  var smooth = [];
  var bin_of = [];
  var k = 0;
  for (var g = 0; g < P.bin_sizes.length; g++) {
    for (var q = 0; q < P.bin_sizes[g]; q++) { smooth.push(P.smooth[g]); bin_of.push(g + 1); labels.push(String(++k)); }
  }
  var o1 = base_options('Sorted position', 'PUE');
  o1.scales.y.min = 1.6;
  o1.plugins.tooltip.callbacks = {
    label: function (c) {
      if (c.datasetIndex === 0) { return 'Original PUE ' + fmt(c.parsed.y, 3); }
      return 'Smoothed to ' + fmt(c.parsed.y, 4) + ' (bin ' + bin_of[c.dataIndex] + ' mean)';
    }
  };
  make_chart('p_bin', {type: 'bar', data: {labels: labels, datasets: [
    {label: 'Original', data: P.sorted, backgroundColor: sc(0), borderRadius: 3, order: 2},
    {label: 'Smoothed (bin mean)', data: smooth, type: 'line', borderColor: sc(1), backgroundColor: sc(1), stepped: true, pointRadius: 0, pointHitRadius: 8, borderWidth: 2.5, order: 1}
  ]}, options: o1});
  var pts = [];
  for (var i = 0; i < D.regression.points.length; i++) { pts.push({x: D.regression.points[i][0], y: D.regression.points[i][1]}); }
  var o2 = base_options('Capacity (MW)', 'Daily electricity (MWh)');
  o2.plugins.legend.display = false;
  o2.scales.x.max = 120;
  o2.scales.y.max = 3000;
  o2.plugins.tooltip.callbacks = {label: function (c) { return fmt(c.parsed.x, 1) + ' MW, ' + fmt(c.parsed.y, 0) + ' MWh'; }};
  make_chart('p_pear', {type: 'scatter', data: {datasets: [{data: pts, backgroundColor: sc(0), pointRadius: 2}]}, options: o2});
  var chi = P.chi;
  var ds = [];
  for (var c = 0; c < chi.cols.length; c++) {
    var v = [];
    for (var r = 0; r < chi.rows.length; r++) {
      var tot = 0;
      for (var cc = 0; cc < chi.cols.length; cc++) { tot += chi.table[r][cc]; }
      v.push(chi.table[r][c] / tot * 100);
    }
    ds.push({label: chi.cols[c], data: v, backgroundColor: sc(c), borderRadius: 2});
  }
  var o3 = base_options('Share of records (%)', '');
  o3.indexAxis = 'y';
  o3.scales.x.stacked = true;
  o3.scales.y.stacked = true;
  o3.scales.x.max = 100;
  o3.scales.y.title = {display: false};
  o3.plugins.tooltip.callbacks = {label: function (c) { return c.dataset.label + ': ' + fmt(c.parsed.x, 1) + '% (' + fmt(chi.table[c.dataIndex][c.datasetIndex]) + ' records)'; }};
  make_chart('p_chi', {type: 'bar', data: {labels: chi.rows, datasets: ds}, options: o3});
  make_chart('p_345', prep_345());
  var lb = el('p_log').getElementsByTagName('button');
  for (var j = 0; j < lb.length; j++) {
    lb[j].addEventListener('click', function (e) {
      state.prep_log = e.currentTarget.getAttribute('data-l') === '1';
      for (var z = 0; z < lb.length; z++) { lb[z].setAttribute('aria-pressed', String(lb[z].getAttribute('data-l') === (state.prep_log ? '1' : '0'))); }
      for (var m = 0; m < charts.length; m++) { if (charts[m].canvas.id === 'p_345') { charts[m].destroy(); charts.splice(m, 1); break; } }
      make_chart('p_345', prep_345());
    });
  }
};
