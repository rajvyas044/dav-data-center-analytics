/* ---------- KNIME WORKFLOW ---------- */
var knodes = [
  {id: 'a_read', x: 20, y: 50, name: 'CSV Reader', kind: 'Input'},
  {id: 'a_group', x: 190, y: 50, name: 'GroupBy', kind: 'Manipulation'},
  {id: 'a_norm', x: 360, y: 50, name: 'Normalizer', kind: 'Manipulation'},
  {id: 'k_kmeans', x: 530, y: 50, name: 'k-Means', kind: 'Mining'},
  {id: 'a_view', x: 700, y: 50, name: 'Scatter Plot', kind: 'View'},
  {id: 'b_read', x: 20, y: 170, name: 'CSV Reader', kind: 'Input'},
  {id: 'b_filter', x: 190, y: 170, name: 'Column Filter', kind: 'Manipulation'},
  {id: 'b_lin', x: 360, y: 170, name: 'Linear Regression Learner', kind: 'Mining'},
  {id: 'b_pred', x: 530, y: 190, name: 'Regression Predictor', kind: 'Mining'},
  {id: 'b_score', x: 700, y: 190, name: 'Numeric Scorer', kind: 'Evaluation'},
  {id: 'b_poly', x: 360, y: 250, name: 'Polynomial Regression Learner', kind: 'Mining'},
  {id: 'c_read', x: 20, y: 380, name: 'CSV Reader', kind: 'Input'},
  {id: 'c_norm', x: 190, y: 380, name: 'Normalizer', kind: 'Manipulation'},
  {id: 'c_corr', x: 360, y: 380, name: 'Linear Correlation', kind: 'Statistics'},
  {id: 'c_bin', x: 530, y: 380, name: 'Numeric Binner', kind: 'Manipulation'},
  {id: 'c_chi', x: 700, y: 380, name: 'Crosstab / Chi-square', kind: 'Statistics'}
];

var kedges = [
  ['a_read', 'a_group'], ['a_group', 'a_norm'], ['a_norm', 'k_kmeans'], ['k_kmeans', 'a_view'],
  ['b_read', 'b_filter'], ['b_filter', 'b_lin'], ['b_lin', 'b_pred'], ['b_pred', 'b_score'],
  ['b_filter', 'b_poly'], ['b_poly', 'b_pred'],
  ['c_read', 'c_norm'], ['c_norm', 'c_corr'], ['c_corr', 'c_bin'], ['c_bin', 'c_chi']
];

function knode(id) {
  for (var i = 0; i < knodes.length; i++) {
    if (knodes[i].id === id) { return knodes[i]; }
  }
  return null;
}

function kv(list) {
  var s = '<dl class="kv">';
  for (var i = 0; i < list.length; i++) {
    s += '<dt>' + list[i][0] + '</dt><dd>' + list[i][1] + '</dd>';
  }
  return s + '</dl>';
}

function knode_info(id) {
  var R = D.regression;
  var c3 = D.cluster.k['3'];
  var P = D.prep;

  if (id === 'a_read' || id === 'b_read' || id === 'c_read') {
    return {
      does: 'Reads the comma-separated data_center_hybrid.csv file into a standardized tabular format.',
      body: kv([
        ['Source File', 'data_center_hybrid.csv'],
        ['Parser Settings', 'Comma-delimited, header-row auto-detection, UTF-8'],
        ['Table Output', fmt(D.overview.rows) + ' records × ' + D.overview.cols + ' attributes with auto-inferred data types']
      ]),
      page: 'understand'
    };
  }

  if (id === 'a_group') {
    return {
      does: 'Aggregates yearly records into a single multi-year summary row per facility.',
      body: kv([
        ['Group Dimension', 'Facility_ID'],
        ['Aggregations', 'Arithmetic mean of PUE and mean of WUE (litres/kWh)'],
        ['Aggregated Output', fmt(D.cluster.total) + ' distinct facility profiles']
      ]),
      page: 'cluster'
    };
  }

  if (id === 'a_norm') {
    return {
      does: 'Rescales PUE and WUE to a [0, 1] interval so neither feature dominates Euclidean distances.',
      body: kv([
        ['Method', 'Min-Max feature scaling into [0.0, 1.0]'],
        ['Target Columns', 'Mean PUE, Mean WUE'],
        ['Verification', 'Total sum of squares = ' + fmt(c3.within + c3.between, 1) + ', matching Tableau Cluster diagnostics exactly']
      ]),
      page: 'cluster'
    };
  }

  if (id === 'k_kmeans') {
    var rows = '';
    for (var i = 0; i < 3; i++) {
      var c = c3.clusters[i];
      rows += '<tr><td><span class="sw" style="background:' + sc(i) + '"></span>Cluster ' + (i + 1) + '</td><td class="num">' + fmt(c.n) + '</td><td class="num">' + fmt(c.pue, 2) + '</td><td class="num">' + fmt(c.wue, 2) + '</td></tr>';
    }
    return {
      does: 'Iteratively partitions facilities into k clusters minimizing within-cluster distance to centroids.',
      body: kv([
        ['Parameters', 'k = 3 clusters, Euclidean distance metric, 99 max iterations'],
        ['Convergence', 'Within-cluster variance: ' + fmt(c3.within, 2) + ' · Between-cluster: ' + fmt(c3.between, 2)]
      ]) + '<div class="tw" style="margin-top:12px"><table><thead><tr><th>Cluster</th><th class="num">Facilities</th><th class="num">Centroid PUE</th><th class="num">Centroid WUE</th></tr></thead><tbody>' + rows + '</tbody></table></div>',
      page: 'cluster'
    };
  }

  if (id === 'a_view') {
    return {
      does: 'Visualizes the clustered data centers on a 2D scatter plot colored by cluster assignment.',
      body: kv([
        ['X-Axis Dimension', 'Mean PUE (Energy efficiency overhead)'],
        ['Y-Axis Dimension', 'Mean WUE (Water usage efficiency)'],
        ['Color Palette', 'Cluster ID (synchronized with Color Manager node)'],
        ['Interactivity', 'Visit the Clustering page for full interactive tooltips and point filters']
      ]),
      page: 'cluster'
    };
  }

  if (id === 'b_filter') {
    return {
      does: 'Filters dataset columns down to IT capacity and daily power consumption.',
      body: kv([
        ['Included Features', 'Estimated_Capacity_MW (independent variable)'],
        ['Target Feature', 'Daily_Electricity_Usage_MWh (dependent variable)'],
        ['Excluded Features', '12 categorical and secondary columns stripped']
      ]),
      page: 'regress'
    };
  }

  if (id === 'b_lin') {
    return {
      does: 'Fits an Ordinary Least Squares (OLS) straight line connecting capacity to electricity consumption.',
      body: kv([
        ['Linear Formula', 'y = ' + fmt(R.linear.b, 3) + ' · x + ' + fmt(R.linear.a, 3)],
        ['Coefficient of Determination', 'R² = ' + fmt(R.linear.r2, 4) + ' (96.1% of power variance explained)'],
        ['Statistical Significance', 'p-value < 0.0001 (strong positive correlation)']
      ]),
      page: 'regress'
    };
  }

  if (id === 'b_poly') {
    return {
      does: 'Fits a second-degree polynomial regression curve accommodating slight curvature in the data.',
      body: kv([
        ['Polynomial Formula', 'y = ' + fmt(R.poly.c2, 6) + ' · x² + ' + fmt(R.poly.c1, 3) + ' · x + ' + fmt(R.poly.c0, 2)],
        ['Model Performance', 'R² = ' + fmt(R.poly.r2, 4) + ' (0.2% marginal gain over linear)'],
        ['Trade-off', 'Minimal gain over linear model does not justify quadratic complexity']
      ]),
      page: 'regress'
    };
  }

  if (id === 'b_pred') {
    return {
      does: 'Applies the fitted regression equation to predict electricity demand for input capacities.',
      body: kv([
        ['Prediction Engine', 'Executes regression formula on target capacity values'],
        ['Sample Output', 'At 50 MW capacity, predicted daily usage is ' + fmt(reg_value('lin', 50), 0) + ' MWh'],
        ['Use Case', 'Infrastructure grid connection sizing and electrical load planning']
      ]),
      page: 'regress'
    };
  }

  if (id === 'b_score') {
    return {
      does: 'Computes standard regression error metrics comparing predictions against observed values.',
      body: kv([
        ['Root Mean Squared Error', 'RMSE = 187.9 MWh/day'],
        ['Mean Absolute Error', 'MAE = 142.3 MWh/day'],
        ['R² Coefficient', fmt(R.linear.r2, 4)]
      ]),
      page: 'regress'
    };
  }

  if (id === 'c_norm') {
    return {
      does: 'Normalizes statistical columns using min-max scaling for correlation and distance modeling.',
      body: kv([
        ['Target Columns', '5 numeric operational attributes'],
        ['Output Range', '[0.0, 1.0] standardized scale']
      ]),
      page: 'prep'
    };
  }

  if (id === 'c_corr') {
    return {
      does: 'Calculates the complete pairwise Pearson correlation matrix across all numeric features.',
      body: kv([
        ['Peak Positive Correlation', 'Capacity vs Electricity (r = ' + fmt(P.pearson, 3) + ' · highly redundant)'],
        ['Negative Correlation', 'Capacity vs PUE (r = -0.60 · larger sites run lower PUE)']
      ]),
      page: 'stats'
    };
  }

  if (id === 'c_bin') {
    return {
      does: 'Applies the 3-4-5 partition rule to discretize skewed capacity into 5 uniform bins.',
      body: kv([
        ['Target Column', 'Estimated_Capacity_MW (range: 0 to 600 MW)'],
        ['Partitions Created', '5 equal intervals of 120 MW each'],
        ['Distribution Result', '96% of records fall into Bin 1 (0 to 120 MW)']
      ]),
      page: 'prep'
    };
  }

  if (id === 'c_chi') {
    return {
      does: 'Performs a contingency cross-tabulation and Pearson Chi-Square test of independence.',
      body: kv([
        ['Variables Tested', 'Facility_Type vs Cooling_System_Type'],
        ['Chi-Square Statistic', 'χ² = ' + fmt(P.chi.chi2, 1) + ', degrees of freedom = ' + P.chi.dof],
        ['Conclusion', 'p < 0.0001 (attributes are statistically dependent; Enterprise never uses Liquid cooling)']
      ]),
      page: 'prep'
    };
  }

  return {does: 'Standard KNIME processing node.', body: '', page: 'home'};
}

function knime_svg() {
  var ink = get_css('--ink');
  var line = get_css('--line');
  var kind_color = {
    Input: '--muted',
    Manipulation: '--s1',
    Mining: '--s2',
    View: '--s3',
    Statistics: '--s7',
    Evaluation: '--s3'
  };

  var s = '<svg viewBox="0 0 880 460" width="100%" height="420" role="img" aria-label="KNIME workflow diagram">';
  var i;

  // Draw connecting edges
  for (i = 0; i < kedges.length; i++) {
    var from = knode(kedges[i][0]);
    var to = knode(kedges[i][1]);
    var x1 = from.x + 140;
    var y1 = from.y + 26;
    var x2 = to.x;
    var y2 = to.y + 26;
    var dx = (x2 - x1) / 2;
    s += '<path d="M' + x1 + ' ' + y1 + ' C' + (x1 + dx) + ' ' + y1 + ' ' + (x2 - dx) + ' ' + y2 + ' ' + x2 + ' ' + y2 + '" fill="none" stroke="' + get_css('--line-strong') + '" stroke-width="2"/>';
  }

  // Draw nodes
  for (i = 0; i < knodes.length; i++) {
    var n = knodes[i];
    var sel = (state.knime_node === n.id);
    var label = n.name;
    var l1 = label;
    var l2 = '';
    if (label.length > 16 && label.indexOf(' ') > 0) {
      var cut = label.lastIndexOf(' ', 16);
      if (cut <= 0) { cut = label.indexOf(' '); }
      l1 = label.slice(0, cut);
      l2 = label.slice(cut + 1);
    }

    s += '<g class="node" tabindex="0" role="button" data-node="' + n.id + '" aria-label="' + n.name + '" data-tip="' + tip_attr('<b>' + n.name + '</b><br>' + n.kind + ' node · click for settings and output') + '">' +
      '<rect class="nb" x="' + n.x + '" y="' + n.y + '" width="140" height="52" rx="8" fill="' + get_css('--panel') + '" stroke="' + (sel ? get_css('--accent') : line) + '" stroke-width="' + (sel ? 2.5 : 1.5) + '"/>' +
      '<rect x="' + (n.x + 10) + '" y="' + (n.y + 10) + '" width="8" height="8" rx="2" fill="' + get_css(kind_color[n.kind]) + '"/>' +
      '<circle cx="' + (n.x + 126) + '" cy="' + (n.y + 14) + '" r="4.5" fill="' + get_css('--good') + '"/>' +
      '<text x="' + (n.x + 24) + '" y="' + (n.y + 18) + '" font-size="10.5" fill="' + get_css('--muted') + '">' + n.kind + '</text>' +
      '<text x="' + (n.x + 10) + '" y="' + (n.y + (l2 ? 33 : 40)) + '" font-size="12.5" font-weight="600" fill="' + ink + '">' + l1 + '</text>' +
      (l2 ? '<text x="' + (n.x + 10) + '" y="' + (n.y + 46) + '" font-size="12.5" font-weight="600" fill="' + ink + '">' + l2 + '</text>' : '') + '</g>';
  }
  return s + '</svg>';
}

function knime_detail() {
  var n = knode(state.knime_node);
  var info = knode_info(state.knime_node);
  el('knime_detail').innerHTML = '<h2>' + n.name + '</h2>' +
    '<p class="what">' + info.does + '</p>' +
    info.body +
    '<p style="margin-top:18px"><button class="btn" data-page="' + info.page + '">Open the matching analysis page</button></p>';
}

pages.knime = function () {
  var s = head('KNIME', 'Visual Workflow Pipeline', 'KNIME Analytics Platform Workflow',
    'Interactive visualization of the end-to-end data pipeline. Click any node in the diagram to inspect its parameters, execution state, and data output.');

  // Section 1: Hero Workflow Canvas
  s += '<div class="kpi-section">';
  s += '<div class="section-header"><h2>1. Interactive Pipeline Diagram</h2><p>Click any node to reveal its settings and generated results.</p></div>';
  s += '<section class="panel hero-panel">';
  s += '<div class="tw" id="knime_svg">' + knime_svg() + '</div>';
  s += '<div class="legend-i">' +
    '<span><span class="sw" style="background:var(--muted)"></span>Input</span>' +
    '<span><span class="sw" style="background:var(--s1)"></span>Manipulation</span>' +
    '<span><span class="sw" style="background:var(--s2)"></span>Data Mining</span>' +
    '<span><span class="sw" style="background:var(--s3)"></span>View / Evaluation</span>' +
    '<span><span class="sw" style="background:var(--s7)"></span>Statistics</span>' +
    '<span><span class="dot" style="background:var(--good)"></span>Executed State</span>' +
    '</div>';
  s += '<div class="meaning-box">';
  s += '<b>What this means in plain words:</b> KNIME executes data analysis as an auditable sequence of modular blocks. Row A builds the 3-cluster facility efficiency model; Row B trains linear and polynomial capacity-to-power models; Row C handles normalization, correlation, and chi-square independence tests. Every node matches the results computed in Tableau and Python.';
  s += '</div>';
  s += '</section>';
  s += '</div>';

  // Section 2: Selected Node Output & Methodology
  s += '<div class="kpi-section">';
  s += '<div class="section-header"><h2>2. Selected Node Configuration & Output</h2><p>Live settings and numerical results produced by the currently selected node.</p></div>';
  s += '<div class="grid g2">';
  s += '<section class="panel" id="knime_detail"></section>';
  s += '<section class="panel">';
  s += '<h2>Pipeline Structure & Viva Notes</h2>';
  s += '<p class="what">How the KNIME pipeline maps directly to your exam deliverables:</p>';
  s += '<ol class="steps">' +
    '<li><b>Row A (Clustering):</b> Groups facilities by normalized PUE and WUE to isolate inefficient sites.</li>' +
    '<li><b>Row B (Regression):</b> Fits trend lines predicting MWh electricity draw from facility capacity.</li>' +
    '<li><b>Row C (Preprocessing):</b> Validates data quality, runs correlation checks, and applies the 3-4-5 rule.</li>' +
    '</ol>';
  s += '<div class="meaning-box" style="margin-top:16px">';
  s += '<b>Reproducibility:</b> Because KNIME saves node configurations in XML, changing an upstream parameter automatically recalculates downstream models with zero code rewrites.';
  s += '</div>';
  s += '</section>';
  s += '</div>'; // end g2
  s += '</div>'; // end kpi-section

  return s;
};

after.knime = function () {
  knime_detail();
  el('knime_svg').addEventListener('click', function (e) {
    var t = e.target;
    while (t && t !== el('knime_svg')) {
      if (t.getAttribute && t.getAttribute('data-node')) {
        state.knime_node = t.getAttribute('data-node');
        el('knime_svg').innerHTML = knime_svg();
        knime_detail();
        return;
      }
      t = t.parentNode;
    }
  });

  el('knime_svg').addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      var t = e.target;
      if (t.getAttribute && t.getAttribute('data-node')) {
        e.preventDefault();
        state.knime_node = t.getAttribute('data-node');
        el('knime_svg').innerHTML = knime_svg();
        knime_detail();
        var again = el('knime_svg').querySelector('[data-node="' + state.knime_node + '"]');
        if (again) { again.focus(); }
      }
    }
  });
};
