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
var kedges = [['a_read', 'a_group'], ['a_group', 'a_norm'], ['a_norm', 'k_kmeans'], ['k_kmeans', 'a_view'],
  ['b_read', 'b_filter'], ['b_filter', 'b_lin'], ['b_lin', 'b_pred'], ['b_pred', 'b_score'], ['b_filter', 'b_poly'], ['b_poly', 'b_pred'],
  ['c_read', 'c_norm'], ['c_norm', 'c_corr'], ['c_corr', 'c_bin'], ['c_bin', 'c_chi']];
function knode(id) {
  for (var i = 0; i < knodes.length; i++) { if (knodes[i].id === id) { return knodes[i]; } }
  return null;
}
function kv(list) {
  var s = '<dl class="kv">';
  for (var i = 0; i < list.length; i++) { s += '<dt>' + list[i][0] + '</dt><dd>' + list[i][1] + '</dd>'; }
  return s + '</dl>';
}
function knode_info(id) {
  var R = D.regression;
  var c3 = D.cluster.k['3'];
  var P = D.prep;
  var rmse_l = Math.sqrt(R.linear.sse / R.n);
  var rmse_p = Math.sqrt(R.poly.sse / R.n);
  var csv = ['File', 'data_center_hybrid.csv'];
  if (id === 'a_read' || id === 'b_read' || id === 'c_read') {
    return {does: 'Reads the data file into a KNIME table.', body: kv([['Settings', 'Comma separated, first row is the header.'], ['Output', fmt(D.overview.rows) + ' rows x ' + D.overview.cols + ' columns, ' + D.columns.length + ' attributes typed automatically.']]), page: 'understand'};
  }
  if (id === 'a_group') {
    return {does: 'Collapses the facility-year rows into one row per facility.', body: kv([['Group by', 'Facility_ID'], ['Aggregations', 'Mean of PUE and Mean of WUE_L_per_kWh'], ['Output', fmt(D.cluster.total) + ' rows (one per facility)']]), page: 'cluster'};
  }
  if (id === 'a_norm') {
    return {does: 'Rescales both inputs so neither dominates the distance.', body: kv([['Method', 'Min-Max to [0, 1]'], ['Columns', 'Mean PUE, Mean WUE'], ['Check', 'Total sum of squares = ' + fmt(c3.within + c3.between, 1) + ', the same total Tableau reports for its Cluster.']]), page: 'cluster'};
  }
  if (id === 'k_kmeans') {
    var rows = '';
    for (var i = 0; i < 3; i++) {
      var c = c3.clusters[i];
      rows += '<tr><td><span class="sw" style="background:' + sc(i) + '"></span>cluster_' + i + '</td><td class="num">' + fmt(c.n) + '</td><td class="num">' + fmt(c.pue, 2) + '</td><td class="num">' + fmt(c.wue, 2) + '</td></tr>';
    }
    return {does: 'Assigns each facility to the nearest of k centres and updates the centres until they settle.', body: kv([['Settings', 'k = 3, Euclidean distance, max 99 iterations'], ['Within / between', fmt(c3.within, 2) + ' / ' + fmt(c3.between, 2)]]) +
      '<div class="tw" style="margin-top:10px"><table><thead><tr><th>Cluster</th><th class="num">Facilities</th><th class="num">Avg PUE</th><th class="num">Avg WUE</th></tr></thead><tbody>' + rows + '</tbody></table></div>', page: 'cluster'};
  }
  if (id === 'a_view') {
    return {does: 'Plots average PUE against average WUE, coloured by cluster.', body: kv([['X axis', 'Mean PUE'], ['Y axis', 'Mean WUE'], ['Colour', 'Cluster (from Color Manager)'], ['Interactive', 'Open the Clustering page to hover over the points.']]), page: 'cluster'};
  }
  if (id === 'b_filter') {
    return {does: 'Keeps only the two columns the regression needs.', body: kv([['Predictor (X)', 'Estimated_Capacity_MW'], ['Target (Y)', 'Daily_Electricity_Usage_MWh']]), page: 'regress'};
  }
  if (id === 'b_lin') {
    return {does: 'Fits a straight line by least squares.', body: kv([['Coefficients', 'slope ' + fmt(R.linear.b, 4) + ', intercept ' + fmt(R.linear.a, 4)], ['R-squared', fmt(R.linear.r2, 4)], ['Meaning', 'About ' + fmt(R.linear.b, 1) + ' MWh of daily electricity per extra MW of capacity.']]), page: 'regress'};
  }
  if (id === 'b_poly') {
    return {does: 'Fits a curve with an x squared term.', body: kv([['Degree', '2'], ['Coefficients', fmt(R.poly.c2, 7) + ' x², ' + fmt(R.poly.c1, 4) + ' x, ' + fmt(R.poly.c0, 4)], ['R-squared', fmt(R.poly.r2, 4)], ['Meaning', 'The negative x² term bends the line down slightly at high capacity.']]), page: 'regress'};
  }
  if (id === 'b_pred') {
    return {does: 'Applies the learned models to every row and adds a Prediction column.', body: kv([['Output', 'Original columns plus Prediction (Linear) and Prediction (Polynomial)'], ['Try it', 'The Regression page has a predictor box for any capacity.']]), page: 'regress'};
  }
  if (id === 'b_score') {
    return {does: 'Compares predictions with real values.', body: kv([['Linear', 'R-squared ' + fmt(R.linear.r2, 4) + ', RMSE ' + fmt(rmse_l, 1) + ' MWh'], ['Polynomial', 'R-squared ' + fmt(R.poly.r2, 4) + ', RMSE ' + fmt(rmse_p, 1) + ' MWh'], ['Reading', 'Both predict daily electricity to within about ' + fmt(rmse_l, 0) + ' MWh on average.']]), page: 'regress'};
  }
  if (id === 'c_norm') {
    var n0 = P.norm[0];
    return {does: 'Scales PUE two ways for comparison.', body: kv([['Min-Max', '(x - ' + P.pmin + ') / (' + P.pmax + ' - ' + P.pmin + '), range 0 to 1'], ['Z-score', '(x - ' + fmt(P.pmean, 3) + ') / ' + fmt(P.pstd, 3)], ['First row', 'PUE ' + n0.pue + ' becomes ' + fmt(n0.mm, 3) + ' (min-max) and ' + fmt(n0.z, 3) + ' (z-score)']]), page: 'prep'};
  }
  if (id === 'c_corr') {
    return {does: 'Computes Pearson correlation between numeric columns.', body: kv([['Pair', 'Capacity and daily electricity'], ['Result', 'r = ' + fmt(P.pearson, 4)], ['Reading', 'Very high, so one of the two is largely redundant for modelling.']]), page: 'prep'};
  }
  if (id === 'c_bin') {
    var b = P.bins345;
    var lines = '';
    for (var j = 0; j < b.counts.length; j++) { lines += b.edges[j] + ' to ' + b.edges[j + 1] + ': ' + fmt(b.counts[j]) + '<br>'; }
    return {does: 'Turns capacity into readable intervals using the 3-4-5 rule.', body: kv([['Range', b.low + ' to ' + b.high], ['Intervals', b.parts], ['Counts (MW)', lines]]), page: 'prep'};
  }
  if (id === 'c_chi') {
    return {does: 'Tests whether Facility Type and Cooling System are independent.', body: kv([['Chi-square', fmt(P.chi.chi2, 1)], ['Degrees of freedom', P.chi.dof], ['P-value', 'below 0.0001'], ['Reading', 'They are dependent: facility type strongly predicts cooling type.']]), page: 'prep'};
  }
  return {does: '', body: '', page: 'home'};
}
function knime_svg() {
  var ink = get_css('--ink');
  var line = get_css('--line');
  var s = '<svg viewBox="0 0 900 470" width="100%" style="min-width:760px" role="img" aria-label="KNIME-style workflow">';
  var rows = [['A · Clustering (Practical 8)', 28], ['B · Regression (Practical 9)', 148], ['C · Preprocessing (Practical 10)', 358]];
  for (var r = 0; r < rows.length; r++) {
    s += '<text x="20" y="' + rows[r][1] + '" font-size="12" fill="' + get_css('--muted') + '" letter-spacing="1">' + rows[r][0].toUpperCase() + '</text>';
  }
  for (var e = 0; e < kedges.length; e++) {
    var a = knode(kedges[e][0]);
    var b = knode(kedges[e][1]);
    var x1 = a.x + 140;
    var y1 = a.y + 26;
    var x2 = b.x;
    var y2 = b.y + 26;
    var mid = (x1 + x2) / 2;
    s += '<path d="M' + x1 + ' ' + y1 + ' C' + mid + ' ' + y1 + ' ' + mid + ' ' + y2 + ' ' + x2 + ' ' + y2 + '" fill="none" stroke="' + get_css('--muted') + '" stroke-width="1.5"/>';
  }
  var kind_color = {Input: '--muted', Manipulation: '--s1', Mining: '--s2', View: '--s3', Evaluation: '--s3', Statistics: '--s7'};
  for (var i = 0; i < knodes.length; i++) {
    var n = knodes[i];
    var sel = n.id === state.knime_node;
    var label = n.name;
    var l1 = label;
    var l2 = '';
    if (label.length > 17) {
      var cut = label.lastIndexOf(' ', 17);
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
  el('knime_detail').innerHTML = '<h2>' + n.name + '</h2><p class="what">' + info.does + '</p>' + info.body +
    '<p style="margin-top:14px"><button class="btn" data-page="' + info.page + '">Open the matching page</button></p>';
}
pages.knime = function () {
  var s = head('KNIME', 'Node workflow', 'KNIME workflow view',
    'The same three analyses laid out as KNIME nodes. Click a node to see its settings and the output it produces on this dataset.');
  s += '<div class="panel" style="margin-bottom:16px"><div class="tw" id="knime_svg">' + knime_svg() + '</div>' +
    '<div class="legend-i"><span><span class="sw" style="background:var(--muted)"></span>Input</span><span><span class="sw" style="background:var(--s1)"></span>Manipulation</span><span><span class="sw" style="background:var(--s2)"></span>Mining</span><span><span class="sw" style="background:var(--s3)"></span>View / evaluation</span><span><span class="sw" style="background:var(--s7)"></span>Statistics</span><span><span class="dot" style="background:var(--good)"></span>Executed</span></div></div>';
  s += '<div class="grid g2"><section class="panel" id="knime_detail"></section>' +
    '<section class="panel"><h2>About these results</h2><p class="what">Node outputs are computed here with the same method each KNIME node uses (min-max k-means, least squares, Pearson, chi-square). They match the Tableau and Python results for this dataset. Your own KNIME workbook may use slightly different node names or settings.</p>' +
    '<ol class="steps"><li>Row A feeds the Clustering page.</li><li>Row B feeds the Regression page.</li><li>Row C feeds the Preprocessing page.</li></ol></section></div>';
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
