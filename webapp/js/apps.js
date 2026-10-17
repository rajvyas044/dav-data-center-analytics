/* ---------- APPLICATIONS ---------- */
function type_row(name) {
  for (var i = 0; i < D.by_type.length; i++) { if (D.by_type[i].type === name) { return D.by_type[i]; } }
  return null;
}
pages.apps = function () {
  var c3 = D.cluster.k['3'].clusters;
  var total = D.cluster.total;
  var y1 = year_row(D.overview.years[0]);
  var y2 = year_row(D.overview.years[1]);
  var hyp = type_row('Hyperscale/AI');
  var ent = type_row('Enterprise/Standard');
  var R = D.regression;
  var s = head('Use cases', 'Application and usefulness', 'Where this analysis is used, and why',
    'Each analysis answers a question someone has to decide on. Here is who asks it, what they do with the answer, and the evidence from this dataset.');
  var items = [
    {who: 'Data center operators', page: 'cluster', tag: 'Clustering · KPI', ask: 'Which of our sites are falling behind?',
      does: 'Benchmark each site against its peers on PUE and WUE and send upgrade budget to the weakest group.',
      ev: fmt(c3[0].n) + ' facilities (' + pct(c3[0].n, total, 0) + ') sit in the group that is weak on both measures, all with evaporative cooling.'},
    {who: 'ESG and sustainability teams', page: 'kpi', tag: 'KPI dashboard', ask: 'Are we getting more efficient, and where?',
      does: 'Report year-on-year efficiency and compare countries and facility types in annual sustainability disclosures.',
      ev: 'Fleet PUE improved from ' + fmt(y1.pue, 3) + ' to ' + fmt(y2.pue, 3) + ' between ' + D.overview.years[0] + ' and ' + D.overview.years[1] + '.'},
    {who: 'Capacity and energy planners', page: 'regress', tag: 'Regression', ask: 'How much power will a new site draw?',
      does: 'Estimate electricity demand from planned capacity to size grid connections and power contracts before construction.',
      ev: 'About ' + fmt(R.linear.b, 1) + ' MWh per day for each MW of capacity, with R-squared ' + fmt(R.linear.r2, 3) + '.'},
    {who: 'Water-risk and site-selection teams', page: 'kpi', tag: 'KPI · Clustering', ask: 'Where does cooling choice put water at risk?',
      does: 'Avoid evaporative cooling in high water-stress regions, or plan for air or liquid cooling there.',
      ev: 'Evaporative groups average about 2 L per kWh. The air-cooled group averages ' + fmt(c3[1].wue, 2) + '.'},
    {who: 'Regulators and policy makers', page: 'stats', tag: 'Statistics', ask: 'What is a realistic efficiency target?',
      does: 'Use the distribution of PUE and WUE to set targets that most facilities can reach, and to spot true outliers.',
      ev: 'PUE sits between ' + find_stat('PUE').min + ' and ' + find_stat('PUE').max + ' with a median of ' + find_stat('PUE').median + '.'},
    {who: 'Investors, lenders and cloud buyers', page: 'kpi', tag: 'KPI dashboard', ask: 'Which operators or regions carry efficiency risk?',
      does: 'Compare owners, regions and facility types on energy and water performance as part of due diligence.',
      ev: 'Hyperscale/AI sites average PUE ' + fmt(hyp.pue, 2) + ' against ' + fmt(ent.pue, 2) + ' for Enterprise/Standard, but draw about ' + fmt(hyp.elec / ent.elec, 0) + ' times the electricity per site.'},
    {who: 'Analysts building models', page: 'prep', tag: 'Preprocessing', ask: 'Is the data ready for machine learning?',
      does: 'Scale features, drop redundant columns and bin skewed ones so models train on clean, comparable inputs.',
      ev: 'Capacity and electricity correlate at r = ' + fmt(D.prep.pearson, 2) + ', so only one is needed as an input.'}
  ];
  s += '<div class="grid g2">';
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    s += '<section class="panel apps-card"><h2>' + it.who + '</h2><p class="tag" style="margin:0 0 8px">' + it.tag + '</p><dl class="kv"><dt>Question</dt><dd>' + it.ask + '</dd><dt>Decision</dt><dd>' + it.does + '</dd><dt>Evidence</dt><dd>' + it.ev + '</dd></dl>' +
      '<p style="margin:12px 0 0"><button class="btn" data-page="' + it.page + '">See the analysis</button></p></section>';
  }
  s += '</div>';
  var trows = [
    ['Data understanding', 'Can we trust this data?', 'Find hidden gaps before they distort a chart or model.'],
    ['Summary statistics and outliers', 'What is typical, and what is unusual?', 'Set benchmarks and decide which extremes are real.'],
    ['KPI dashboard', 'How are we doing right now?', 'Monitor and report performance, filter to the group you care about.'],
    ['Clustering', 'Which facilities behave alike?', 'Target actions at a segment instead of the whole fleet.'],
    ['Regression', 'How does one measure drive another?', 'Forecast demand and quantify the link between size and power.'],
    ['Preprocessing', 'Is the data ready to model?', 'Make inputs comparable and remove redundancy.']
  ];
  var tb = '';
  for (var t = 0; t < trows.length; t++) { tb += '<tr><td><b>' + trows[t][0] + '</b></td><td>' + trows[t][1] + '</td><td>' + trows[t][2] + '</td></tr>'; }
  s += panel('Why each technique earns its place', 'One line per practical.', '<div class="tw"><table><thead><tr><th>Technique</th><th>Question it answers</th><th>What it is used for</th></tr></thead><tbody>' + tb + '</tbody></table></div>', '');
  s += '<div style="margin-top:16px">' + panel('Limits to keep in mind', 'Where the results should be used with care.',
    '<ul class="steps"><li><b>Location data is weak.</b> ' + pct(D.uncertainty.city_unknown, D.overview.rows, 0) + ' of rows have an unknown city, so country and city comparisons cover only part of the fleet.</li>' +
    '<li><b>Correlation is not cause.</b> Bigger sites use more power and run at lower PUE, but this data does not show that size alone makes them efficient.</li>' +
    '<li><b>Regression uses one predictor.</b> Capacity explains most of the variation, yet cooling type, climate and workload are not in the model.</li>' +
    '<li><b>Power-model R-squared is on a log scale.</b> Compare it with the other models only through the original-scale value (' + fmt(R.power.r2_orig, 3) + ').</li>' +
    '<li><b>Clusters depend on choices.</b> The grouping changes with k and with the scaling method, so treat the titles as descriptions, not facts about each facility.</li></ul>', '') + '</div>';
  return s;
};
