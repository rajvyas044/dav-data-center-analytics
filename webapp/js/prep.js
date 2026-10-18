/* ---------- PREPROCESSING (Python) ---------- */
pages.prep = function () {
  var P = D.prep;
  var s = head('Python', 'pandas · SciPy · Feature Engineering', 'Data Preprocessing & Transformation',
    'Five foundational data preparation methods: smoothing by binning, dual normalization, numeric and categorical redundancy tests, and the 3-4-5 discretization rule.');

  // Section 1: Data Smoothing & Normalization
  s += '<div class="kpi-section">';
  s += '<div class="section-header"><h2>1. Data Smoothing & Feature Normalization</h2><p>Removing noise through equal-frequency binning and comparing feature scaling techniques.</p></div>';
  s += '<section class="panel hero-panel">';
  s += '<h2>Smoothing by Bin Means (PUE Sorting)</h2>';
  s += '<p class="what">The first 20 PUE records sorted and partitioned into 4 equal bins of 5. Each value is replaced by its bin mean.</p>';
  s += '<div class="chart"><canvas id="p_bin"></canvas></div>';
  s += '<div class="meaning-box">';
  s += '<b>What this means in plain words:</b> Binning acts as a low-pass filter: it eliminates random measurement jitter and reduces the data to 4 distinct operational tiers (' + fmt(P.smooth[0], 3) + ', ' + fmt(P.smooth[1], 3) + ', ' + fmt(P.smooth[2], 3) + ', ' + fmt(P.smooth[3], 3) + ') without altering the underlying trend.';
  s += '</div>';

  // Normalization Table (Behind Collapsible Toggle)
  var norm_rows = '';
  for (var i = 0; i < P.norm.length; i++) {
    norm_rows += '<tr><td class="num">' + P.norm[i].pue + '</td><td class="num">' + fmt(P.norm[i].mm, 4) + '</td><td class="num">' + fmt(P.norm[i].z, 4) + '</td></tr>';
  }
  var norm_table = '<div class="tw"><table><thead><tr><th class="num">Original PUE</th><th class="num">Min-Max Scaled [0, 1]</th><th class="num">Z-Score Standardized</th></tr></thead><tbody>' + norm_rows + '</tbody></table></div>' +
    '<p class="note" style="margin-top:14px"><b>Mathematical Formulations:</b><br>' +
    '• <b>Min-Max:</b> (x - ' + P.pmin + ') / (' + P.pmax + ' - ' + P.pmin + '). Essential for Euclidean distance metrics like K-Means where features must share identical [0, 1] boundaries.<br>' +
    '• <b>Z-Score:</b> (x - ' + fmt(P.pmean, 3) + ') / ' + fmt(P.pstd, 3) + '. Centers data around zero with unit standard deviation; optimal when preserving outlier distance in linear models.</p>';

  s += details_box('Show Min-Max vs Z-Score Normalization Table & Formulas', norm_table);
  s += '</section>';
  s += '</div>';

  // Section 2: Redundancy Testing (Pearson & Chi-Square)
  s += '<div class="kpi-section">';
  s += '<div class="section-header"><h2>2. Feature Redundancy & Independence Testing</h2><p>Identifying collinear numeric features and testing dependency between categorical dimensions.</p></div>';
  s += '<div class="grid g2">';

  // Left: Pearson Redundancy
  s += '<section class="panel">';
  s += '<h2>Numeric Redundancy: Pearson Correlation</h2>';
  s += '<p class="what">Capacity vs daily electricity. |r| > 0.9 confirms extreme feature redundancy.</p>';
  s += '<div class="stat-strip" style="margin:10px 0 16px"><div class="stat-item"><span class="lbl">Pearson Correlation</span><span class="num">r = ' + fmt(P.pearson, 4) + '</span><span class="sub">p-value < 0.0001 (redundant)</span></div></div>';
  s += '<div class="chart short"><canvas id="p_pear"></canvas></div>';
  s += '<div class="meaning-box">';
  s += '<b>Takeaway:</b> Because capacity and daily power draw move in near-perfect lockstep, keeping both in a regression model causes severe multicollinearity. One must be eliminated.';
  s += '</div>';
  s += '</section>';

  // Right: Chi-Square Test
  var chi = P.chi;
  var head_row = '<th>Facility Type</th>';
  for (var c = 0; c < chi.cols.length; c++) {
    head_row += '<th class="num">' + chi.cols[c].replace(' Cooled', '') + '</th>';
  }
  var body = '';
  for (var r = 0; r < chi.rows.length; r++) {
    body += '<tr><td><b>' + chi.rows[r] + '</b></td>';
    for (var cc = 0; cc < chi.cols.length; cc++) {
      body += '<td class="num">' + fmt(chi.table[r][cc]) + '</td>';
    }
    body += '</tr>';
  }

  s += '<section class="panel">';
  s += '<h2>Categorical Dependency: Chi-Square (χ²) Test</h2>';
  s += '<p class="what">Testing whether Facility Type and Cooling System Type are statistically independent.</p>';
  s += '<div class="chart short"><canvas id="p_chi"></canvas></div>';
  s += '<div class="tw" style="margin-top:14px"><table><thead><tr>' + head_row + '</tr></thead><tbody>' + body + '</tbody></table></div>';
  s += '<div class="meaning-box">';
  s += '<b>Test Result:</b> χ² = ' + fmt(chi.chi2, 1) + ', df = ' + chi.dof + ', p < 0.0001. The variables are strongly dependent (Enterprise sites never adopt liquid cooling).';
  s += '</div>';
  s += '</section>';

  s += '</div>'; // end g2
  s += '</div>'; // end kpi-section

  // Section 3: Discretization with 3-4-5 Rule
  var b = P.bins345;
  s += '<div class="kpi-section">';
  s += '<div class="section-header"><h2>3. Data Discretization: The 3-4-5 Rule</h2><p>Partitioning continuous facility capacity into intuitive, human-readable integer bins.</p></div>';

  s += '<div class="filter-panel"><div class="bar"><div class="field">Y-Axis Scale Mode<span class="seg" id="p_log">' +
    '<button class="btn" data-l="1" aria-pressed="' + state.prep_log + '">Logarithmic Scale (reveals tail)</button>' +
    '<button class="btn" data-l="0" aria-pressed="' + (!state.prep_log) + '">Linear Scale</button>' +
    '</span></div></div></div>';

  s += '<section class="panel hero-panel">';
  s += '<p class="what">Capacity spans ' + b.low + ' to ' + b.high + ' MW. The 3-4-5 heuristic selects ' + b.parts + ' equal intervals with clean round boundaries (0 to 600 MW).</p>';
  s += '<div class="chart tall"><canvas id="p_345"></canvas></div>';
  s += '<div class="meaning-box">';
  s += '<b>What this means in plain words:</b> ' + pct(b.counts[0], D.overview.rows, 1) + ' of facilities occupy the first bin (0 to 120 MW). Only ' + fmt(b.counts[4]) + ' facilities exceed 480 MW. Toggling to Logarithmic Scale enables inspecting these rare high-capacity sites without squashing the rest of the chart.';
  s += '</div>';
  s += '</section>';
  s += '</div>';

  return s;
};

function prep_345() {
  var b = D.prep.bins345;
  var labels = [];
  for (var i = 0; i < b.counts.length; i++) {
    labels.push(b.edges[i] + ' to ' + b.edges[i + 1] + ' MW');
  }
  var opt = base_options('Capacity Interval (MW)', 'Record Count');
  opt.plugins.legend.display = false;
  opt.scales.y.type = state.prep_log ? 'logarithmic' : 'linear';
  if (state.prep_log) { opt.scales.y.min = 1; }
  opt.plugins.tooltip.callbacks = {
    label: function (c) {
      return fmt(c.parsed.y) + ' records (' + pct(c.parsed.y, D.overview.rows, 2) + ')';
    }
  };
  return {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        data: b.counts,
        backgroundColor: sc(0),
        borderRadius: 5
      }]
    },
    options: opt
  };
}

after.prep = function () {
  var P = D.prep;
  var labels = [];
  var smooth = [];
  var bin_of = [];
  var k = 0;
  for (var g = 0; g < P.bin_sizes.length; g++) {
    for (var q = 0; q < P.bin_sizes[g]; q++) {
      smooth.push(P.smooth[g]);
      bin_of.push(g + 1);
      labels.push(String(++k));
    }
  }

  var o1 = base_options('Sorted Observation Index', 'PUE Value');
  o1.scales.y.min = 1.6;
  o1.plugins.tooltip.callbacks = {
    label: function (c) {
      if (c.datasetIndex === 0) { return 'Original PUE: ' + fmt(c.parsed.y, 3); }
      return 'Smoothed Mean: ' + fmt(c.parsed.y, 4) + ' (Bin ' + bin_of[c.dataIndex] + ')';
    }
  };
  make_chart('p_bin', {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {label: 'Original Measured PUE', data: P.sorted, backgroundColor: sc(0), borderRadius: 3, order: 2},
        {label: 'Smoothed Bin Mean', data: smooth, type: 'line', borderColor: sc(3), backgroundColor: sc(3), stepped: true, pointRadius: 0, pointHitRadius: 8, borderWidth: 2.5, order: 1}
      ]
    },
    options: o1
  });

  var pts = [];
  for (var i = 0; i < D.regression.points.length; i++) {
    pts.push({x: D.regression.points[i][0], y: D.regression.points[i][1]});
  }
  var o2 = base_options('Capacity (MW)', 'Daily Electricity (MWh)');
  o2.plugins.legend.display = false;
  o2.scales.x.max = 120;
  o2.scales.y.max = 3000;
  o2.plugins.tooltip.callbacks = {
    label: function (c) { return fmt(c.parsed.x, 1) + ' MW · ' + fmt(c.parsed.y, 0) + ' MWh/day'; }
  };
  make_chart('p_pear', {
    type: 'scatter',
    data: {datasets: [{data: pts, backgroundColor: sc(0), pointRadius: 2}]},
    options: o2
  });

  var chi = P.chi;
  var ds = [];
  for (var c = 0; c < chi.cols.length; c++) {
    var v = [];
    for (var r = 0; r < chi.rows.length; r++) {
      var tot = 0;
      for (var cc = 0; cc < chi.cols.length; cc++) { tot += chi.table[r][cc]; }
      v.push(chi.table[r][c] / tot * 100);
    }
    ds.push({label: chi.cols[c], data: v, backgroundColor: sc(c), borderRadius: 3});
  }
  var o3 = base_options('Share of Facilities (%)', '');
  o3.indexAxis = 'y';
  o3.scales.x.stacked = true;
  o3.scales.y.stacked = true;
  o3.scales.x.max = 100;
  o3.scales.y.title = {display: false};
  o3.plugins.tooltip.callbacks = {
    label: function (c) {
      return c.dataset.label + ': ' + fmt(c.parsed.x, 1) + '% (' + fmt(chi.table[c.dataIndex][c.datasetIndex]) + ' records)';
    }
  };
  make_chart('p_chi', {type: 'bar', data: {labels: chi.rows, datasets: ds}, options: o3});

  make_chart('p_345', prep_345());

  var lb = el('p_log').getElementsByTagName('button');
  for (var j = 0; j < lb.length; j++) {
    lb[j].addEventListener('click', function (e) {
      state.prep_log = e.currentTarget.getAttribute('data-l') === '1';
      for (var z = 0; z < lb.length; z++) {
        lb[z].setAttribute('aria-pressed', String(lb[z].getAttribute('data-l') === (state.prep_log ? '1' : '0')));
      }
      for (var m = 0; m < charts.length; m++) {
        if (charts[m].canvas.id === 'p_345') {
          charts[m].destroy();
          charts.splice(m, 1);
          break;
        }
      }
      make_chart('p_345', prep_345());
    });
  }
};
