/* ---------- HOME ---------- */
pages.home = function () {
  var o = D.overview;
  var y1 = year_row(o.years[0]);
  var y2 = year_row(o.years[1]);
  var s = '<div class="hero"><div><div class="crumb"><span class="pill">Project</span><span>Data analytics and visualization</span></div>' +
    '<h1>Data center energy and water, from first look to decisions</h1>' +
    '<p class="lead">One dataset, every analysis. Pick a tool in the menu, then hover over any chart for the exact numbers. Each panel says what it shows and what to conclude from it.</p></div>' +
    '<div class="facts">' +
    kpi_card('Records', fmt(o.rows), 'facility-year rows') +
    kpi_card('Facilities', fmt(o.facilities), o.years[0] + ' to ' + o.years[1] + ', one row per year') +
    kpi_card('Attributes', o.cols, '5 numeric measures') +
    kpi_card('Duplicates', o.dups, 'none found') + '</div></div>';
  s += '<h3>Jump to</h3><div class="cards">';
  var blurbs = {
    kpi: 'Four linked KPI charts with filters for year, facility type, cooling and water stress.',
    cluster: 'K-means on average PUE and WUE. Change k from 2 to 5 and see the groups move.',
    regress: 'Linear, polynomial and power fits of electricity on capacity, plus a Ridge slider and a predictor.',
    knime: 'The same analyses as a node workflow. Click any node to see its settings and output.',
    understand: 'Data dictionary, class balance, missing and corrupted values, and the cleaning plan.',
    stats: 'Five-number summary, box plot, histogram, outliers and correlations for every measure.',
    prep: 'Binning, min-max and z-score scaling, Pearson, chi-square and the 3-4-5 rule.',
    apps: 'Who uses each analysis, what decision it supports, and what to watch out for.'
  };
  for (var i = 1; i < menu.length; i++) {
    var m = menu[i];
    var toolname = m.tool === 'all' ? 'Overview' : m.tool.charAt(0).toUpperCase() + m.tool.slice(1);
    s += '<button class="go" data-page="' + m.id + '"><span class="tag">' + toolname + (m.tag ? ' · ' + m.tag : '') + '</span><div class="t">' + m.label + '</div><div class="d">' + blurbs[m.id] + '</div></button>';
  }
  s += '</div>';
  s += '<section class="panel" style="margin-top:16px"><h2>Fleet at a glance</h2><p class="what">Average PUE (energy overhead, lower is better) and average daily electricity per facility, by year.</p>' +
    '<div class="chart"><canvas id="home_c"></canvas></div>' +
    '<div class="insight"><b>Read it as:</b> efficiency improved every year (PUE ' + fmt(y1.pue, 3) + ' to ' + fmt(y2.pue, 3) + ') while the average facility drew ' + pct(y2.elec - y1.elec, y1.elec, 0) + ' more electricity (' + fmt(y1.elec, 0) + ' to ' + fmt(y2.elec, 0) + ' MWh per day).</div></section>';
  return s;
};
after.home = function () {
  var labels = [];
  var pue = [];
  var elec = [];
  for (var i = 0; i < D.yearly.length; i++) {
    labels.push(D.yearly[i].year);
    pue.push(D.yearly[i].pue);
    elec.push(D.yearly[i].elec);
  }
  var opt = base_options('Year', '');
  opt.scales.y = {position: 'left', ticks: {color: sc(0)}, grid: {color: get_css('--line')}, title: {display: true, text: 'Average PUE', color: sc(0)}, min: 1.5, max: 1.75};
  opt.scales.y2 = {position: 'right', ticks: {color: sc(1)}, grid: {drawOnChartArea: false}, title: {display: true, text: 'Avg daily electricity (MWh)', color: sc(1)}, min: 0};
  opt.plugins.tooltip.callbacks = {
    label: function (c) {
      if (c.datasetIndex === 0) { return 'Average PUE: ' + fmt(c.parsed.y, 3) + ' (lower is better)'; }
      return 'Avg electricity: ' + fmt(c.parsed.y, 1) + ' MWh per day';
    }
  };
  make_chart('home_c', {type: 'line', data: {labels: labels, datasets: [
    {label: 'Average PUE', data: pue, borderColor: sc(0), backgroundColor: sc(0), yAxisID: 'y', tension: .25, pointRadius: 4, borderWidth: 2},
    {label: 'Avg daily electricity', data: elec, borderColor: sc(1), backgroundColor: sc(1), yAxisID: 'y2', tension: .25, pointRadius: 4, borderWidth: 2}
  ]}, options: opt});
};
