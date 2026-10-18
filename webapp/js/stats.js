/* ---------- STATISTICS ---------- */
var stat_note = {
  Estimated_Capacity_MW: 'Most facilities are small to medium sized. A small subset of large hyperscale facilities stretches the upper tail, which pulls the arithmetic mean (23.1 MW) significantly above the median (9.9 MW).',
  PUE: 'PUE follows a tight and nearly symmetric distribution between 1.06 and 2.00 with very few outliers, confirming that PUE is an exceptionally reliable metric across the fleet.',
  WUE_L_per_kWh: 'Displays a distinct bimodal (two-humped) distribution: air-cooled sites cluster near zero, whereas evaporative cooling sites cluster around 2 litres per kWh. No outliers under the IQR fence.',
  Daily_Electricity_Usage_MWh: 'Strongly right-skewed following capacity. A small number of massive computational centers consume substantial electricity, doubling the mean relative to the median.',
  Daily_Water_Usage_Gallons: 'Extremely right-skewed. Evaporative cooling towers draw massive water volumes compared to dry air-cooled systems, stretching the tail.'
};

pages.stats = function () {
  var s = head('Python', 'pandas · NumPy · SciPy', 'Statistical Distributions & Outlier Analysis',
    'Comprehensive five-number summary, parametric vs non-parametric spread, dual outlier detection (IQR vs Z-score), and pairwise Pearson feature correlations.');

  var opts = '';
  for (var i = 0; i < D.stats.length; i++) {
    opts += '<option value="' + i + '"' + (i === state.stat_attr ? ' selected' : '') + '>' + nice(D.stats[i].name) + '</option>';
  }

  // Elevated filter panel
  s += '<div class="filter-panel"><div class="bar"><label class="field">Select Metric to Inspect<select id="stat_sel">' + opts + '</select></label></div></div>';
  s += '<div id="stat_out"></div>';

  // Section 2: Correlation Matrix
  s += '<div class="kpi-section">';
  s += '<div class="section-header"><h2>2. Feature Correlation Matrix (Pearson r)</h2><p>Pairwise linear correlation ranging from -1.0 (inverse) to +1.0 (direct). Hover any cell for interpretation.</p></div>';
  s += '<section class="panel hero-panel">';
  s += '<div class="tw"><div class="heat" id="heat" style="min-width:440px"></div></div>';
  s += '<div class="meaning-box">';
  s += '<b>What this means in plain words:</b> Capacity and electricity demand correlate almost perfectly (r = 0.98), demonstrating high feature redundancy (only one should be kept in predictive modeling). PUE shows a moderate negative correlation with capacity (r = -0.60), showing that larger hyperscale facilities achieve economies of scale in energy efficiency.';
  s += '</div>';
  s += '</section>';
  s += '</div>';

  // Section 3: Comparative 5-Measure Table (Behind Collapsible Toggle)
  var rows = '';
  for (var j = 0; j < D.stats.length; j++) {
    var t = D.stats[j];
    rows += '<tr><td><b>' + nice(t.name) + '</b></td><td class="num">' + fmt(t.mean, 2) + '</td><td class="num">' + fmt(t.median, 2) + '</td><td class="num">' + fmt(t.mode, 2) + '</td><td class="num">' + fmt(t.midrange, 2) +
      '</td><td class="num">' + fmt(t.iqr_n) + ' (' + t.iqr_pct + '%)</td><td class="num">' + fmt(t.z_n) + ' (' + t.z_pct + '%)</td></tr>';
  }
  var comp_table = '<div class="tw"><table><thead><tr><th>Attribute</th><th class="num">Mean</th><th class="num">Median</th><th class="num">Mode</th><th class="num">Midrange</th><th class="num">1.5 × IQR Outliers</th><th class="num">|z| > 3 Outliers</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
    '<p class="note" style="margin-top:12px"><b>Viva Note:</b> The 1.5 × IQR rule identifies significantly more outliers than the standard score (|z| > 3) because skewed distributions violate normality assumptions. These high-capacity records represent legitimate operational sites and are intentionally preserved.</p>';

  s += '<div class="kpi-section"><section class="panel">' +
    '<h2>Summary Statistics Across All Measures</h2>' +
    '<p class="what">Direct comparison of central tendency measures and dual outlier test criteria.</p>' +
    details_box('Show complete 5-measure central tendency & outlier comparison table', comp_table) +
    '</section></div>';

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
  s += '<line x1="' + px(lo_w) + '" x2="' + px(hi_w) + '" y1="52" y2="52" stroke="' + get_css('--ink2') + '" stroke-width="1.5" data-tip="' + tip_attr(tipfn('Whiskers', lo_w, 'to ' + fmt(hi_w, 3) + ' (inner fence limit)')) + '"/>';
  s += '<line x1="' + px(lo_w) + '" x2="' + px(lo_w) + '" y1="40" y2="64" stroke="' + get_css('--ink2') + '" stroke-width="1.5"/>';
  s += '<line x1="' + px(hi_w) + '" x2="' + px(hi_w) + '" y1="40" y2="64" stroke="' + get_css('--ink2') + '" stroke-width="1.5"/>';
  s += '<rect x="' + px(t.q1) + '" y="30" width="' + Math.max(2, px(t.q3) - px(t.q1)) + '" height="44" rx="4" fill="' + sc(0) + '" fill-opacity=".35" stroke="' + sc(0) + '" stroke-width="1.5" data-tip="' + tip_attr(tipfn('Interquartile Range (middle 50%)', t.iqr, 'Q1 ' + fmt(t.q1, 3) + ' to Q3 ' + fmt(t.q3, 3))) + '"/>';
  s += '<line x1="' + px(t.median) + '" x2="' + px(t.median) + '" y1="30" y2="74" stroke="' + sc(0) + '" stroke-width="3" data-tip="' + tip_attr(tipfn('Median', t.median)) + '"/>';

  if (t.mean >= lo_w && t.mean <= hi_w) {
    s += '<path d="M' + px(t.mean) + ' 44 l7 8 l-7 8 l-7 -8 z" fill="' + sc(1) + '" stroke="' + get_css('--panel') + '" stroke-width="1.5" data-tip="' + tip_attr(tipfn('Mean Value', t.mean)) + '"/>';
  }

  s += '<text x="' + px(lo_w) + '" y="96" font-size="12" fill="' + get_css('--ink2') + '" text-anchor="start">' + fmt(lo_w, 2) + '</text>';
  s += '<text x="' + px(hi_w) + '" y="96" font-size="12" fill="' + get_css('--ink2') + '" text-anchor="middle">' + fmt(hi_w, 2) + '</text>';
  s += '<text x="' + px(t.median) + '" y="22" font-size="12" fill="' + get_css('--ink') + '" text-anchor="middle">Median ' + fmt(t.median, 2) + '</text>';

  if (t.max > t.hi) {
    s += '<path d="M' + (px(hi_w) + 16) + ' 52 h46 m-8 -6 l8 6 l-8 6" fill="none" stroke="' + sc(3) + '" stroke-width="2" data-tip="' + tip_attr('<b>' + fmt(t.iqr_n) + ' outliers detected</b><br>above upper fence ' + fmt(t.hi, 2) + '<br>maximum value ' + fmt(t.max, 2)) + '"/>';
    s += '<text x="' + (px(hi_w) + 16) + '" y="76" font-size="12" fill="' + sc(3) + '">Outliers to ' + fmt(t.max, 1) + '</text>';
  } else {
    s += '<text x="' + (px(hi_w) + 16) + '" y="56" font-size="12" fill="' + get_css('--ink2') + '">Zero High Outliers</text>';
  }

  if (t.mean > hi_w) {
    s += '<text x="' + px(t.median) + '" y="116" font-size="12" fill="' + sc(3) + '" text-anchor="middle">Mean ' + fmt(t.mean, 1) + ' lies beyond whisker</text>';
  }
  return s + '</svg>';
}

function stat_draw() {
  var t = D.stats[state.stat_attr];

  // Open Metric Strip for chosen attribute
  var cards = '<div class="stat-strip five-items">' +
    '<div class="stat-item"><span class="lbl">Arithmetic Mean</span><span class="num">' + fmt(t.mean, 2) + '</span><span class="sub">central balance point</span></div>' +
    '<div class="stat-item"><span class="lbl">Median (Q2)</span><span class="num">' + fmt(t.median, 2) + '</span><span class="sub">50th percentile rank</span></div>' +
    '<div class="stat-item"><span class="lbl">IQR Spread</span><span class="num">' + fmt(t.iqr, 2) + '</span><span class="sub">Q1 ' + fmt(t.q1, 2) + ' to Q3 ' + fmt(t.q3, 2) + '</span></div>' +
    '<div class="stat-item"><span class="lbl">IQR Outliers</span><span class="num">' + fmt(t.iqr_n) + '</span><span class="sub">' + t.iqr_pct + '% beyond 1.5 × IQR</span></div>' +
    '<div class="stat-item"><span class="lbl">Z-Score Outliers</span><span class="num">' + fmt(t.z_n) + '</span><span class="sub">' + t.z_pct + '% beyond |z| > 3</span></div>' +
    '</div>';

  var h = D.hist[t.name];
  var hist_note = h.log ? 'Bins use logarithmic scaling to span wide dynamic ranges.' : 'Counts per equal-width bin.';

  var out = cards + '<div class="kpi-section">' +
    '<div class="section-header"><h2>1. Distribution Shape: Histogram & Box Plot</h2><p>Examine skewness, central tendency, and extreme tail points for ' + nice(t.name) + '.</p></div>' +
    '<div class="grid g2">' +
    '<section class="panel"><h2>Distribution Frequency</h2><p class="what">' + hist_note + '</p><div class="chart"><canvas id="hist_c"></canvas></div></section>' +
    '<section class="panel"><h2>Five-Number Box Plot</h2><p class="what">Middle 50% box with Q1, Median, Mean diamond, and fences (' + fmt(Math.max(t.min, t.lo), 2) + ' to ' + fmt(t.hi, 2) + ').</p>' + box_svg(t) + '</section>' +
    '</div>' +
    '<div class="meaning-box"><b>What this means in plain words:</b> ' + stat_note[t.name] + '</div>' +
    '</div>';

  el('stat_out').innerHTML = out;

  var labels = [];
  for (var i = 0; i < h.counts.length; i++) {
    labels.push(fmt(h.edges[i], h.log ? 1 : 2));
  }
  var opt = base_options(nice(t.name) + (h.log ? ' (Log Bins)' : ''), 'Record Count');
  opt.plugins.legend.display = false;
  opt.scales.x.ticks.maxTicksLimit = 8;
  opt.plugins.tooltip.callbacks = {
    title: function (c) {
      var idx = c[0].dataIndex;
      return fmt(h.edges[idx], 2) + ' to ' + fmt(h.edges[idx + 1], 2);
    },
    label: function (c) {
      return fmt(c.parsed.y) + ' records (' + pct(c.parsed.y, D.overview.rows, 2) + ')';
    }
  };
  make_chart('hist_c', {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        data: h.counts,
        backgroundColor: sc(0),
        borderRadius: 4,
        categoryPercentage: 1,
        barPercentage: 0.94
      }]
    },
    options: opt
  });
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
  for (var i = 0; i < 5; i++) {
    html += '<div class="hd">' + short_names[i] + '</div>';
  }
  for (var r = 0; r < 5; r++) {
    html += '<div class="hd" style="text-align:right;align-self:center">' + short_names[r] + '</div>';
    for (var c = 0; c < 5; c++) {
      var v = m[r][c];
      var a = Math.abs(v);
      var base = v >= 0 ? 'var(--s1)' : 'var(--s2)';
      var strength = a > 0.7 ? 'strong' : (a > 0.4 ? 'moderate' : 'weak');
      var dir = v >= 0 ? 'positive' : 'negative';
      var txt = a > 0.6 ? '#fff' : 'var(--ink)';
      var tipt = '<b>' + short_names[r] + ' and ' + short_names[c] + '</b><br>r = ' + fmt(v, 2) + '<br>' + (r === c ? 'identical variable' : strength + ' ' + dir + ' correlation');
      html += '<div style="background:color-mix(in srgb,' + base + ' ' + Math.round(a * 100) + '%,var(--panel));color:' + txt + '" data-tip="' + tip_attr(tipt) + '">' + fmt(v, 2) + '</div>';
    }
  }
  var heat = el('heat');
  heat.style.gridTemplateColumns = '90px repeat(5,minmax(0,1fr))';
  heat.innerHTML = html;
};
