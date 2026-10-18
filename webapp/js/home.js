/* ---------- HOME ---------- */
pages.home = function () {
  var o = D.overview;
  var y1 = year_row(o.years[0]);
  var y2 = year_row(o.years[1]);
  var elec_growth = pct(y2.elec - y1.elec, y1.elec, 0);

  var s = '';

  // 1. Introduction Header
  s += '<div class="home-intro">';
  s += '<div class="crumb"><span class="pill">Project</span><span>Data Analytics & Visualization</span></div>';
  s += '<h1>Data Center Energy and Water Efficiency</h1>';
  s += '<p class="lead">An end-to-end analysis of facility power consumption, cooling overhead, and regional water stress using real-world operational records from ' + o.years[0] + ' to ' + o.years[1] + '. Explore the analyses below or use the menu to jump directly to any technique.</p>';
  s += '</div>';

  // 2. Open Stat Strip (Varied layout: no boxes-inside-boxes)
  s += '<div class="stat-strip">';
  s += '<div class="stat-item"><span class="lbl">Total Records</span><span class="num">' + fmt(o.rows) + '</span><span class="sub">Facility-year rows</span></div>';
  s += '<div class="stat-item"><span class="lbl">Monitored Fleet</span><span class="num">' + fmt(o.facilities) + '</span><span class="sub">' + o.years[0] + ' to ' + o.years[1] + ' (' + (o.years[1] - o.years[0] + 1) + ' years)</span></div>';
  s += '<div class="stat-item"><span class="lbl">Key Measures</span><span class="num">' + o.cols + '</span><span class="sub">PUE, WUE, Electricity, Water</span></div>';
  s += '<div class="stat-item"><span class="lbl">Data Quality</span><span class="num">Clean</span><span class="sub">' + (o.dups === 0 ? 'Zero duplicates found' : o.dups + ' duplicates') + '</span></div>';
  s += '</div>';

  // 3. Hero Section: Fleet at a Glance (The primary visual focus)
  s += '<section class="panel hero-panel">';
  s += '<h2>Fleet at a glance: Efficiency vs Power Demand</h2>';
  s += '<p class="what">Average Power Usage Effectiveness (PUE) compared with average daily electricity consumption per facility over time.</p>';
  s += '<div class="chart tall"><canvas id="home_c"></canvas></div>';
  s += '<div class="meaning-box">';
  s += '<b>What this means in plain words:</b> Over the four years, energy efficiency steadily improved across the fleet (average PUE dropped from ' + fmt(y1.pue, 3) + ' to ' + fmt(y2.pue, 3) + '). At the same time, total power drawn by the average facility grew by ' + elec_growth + ' (from ' + fmt(y1.elec, 0) + ' to ' + fmt(y2.elec, 0) + ' MWh per day) due to heavier computational workloads.';
  s += '</div>';
  s += '</section>';

  // 4. Structured Pathways (Grouped by tool with subtle tints, not 8 identical boxes)
  s += '<div class="paths-container">';
  s += '<h3>Explore the Analyses by Tool</h3>';

  // Group 1: Tableau Interactive Dashboards
  s += '<div class="path-group">';
  s += '<div class="path-group-title"><span class="dot" style="background:var(--tool-tableau)"></span><span>Tableau Interactive Dashboards</span></div>';
  s += '<div class="path-grid">';

  s += '<button class="path-card" data-page="kpi" data-tool="tableau">';
  s += '<span class="pill" style="background:var(--tool-tableau-bg);color:var(--tool-tableau);border-color:var(--tool-tableau-border)">Tableau</span>';
  s += '<div class="t">KPI Dashboard</div>';
  s += '<div class="d">Four linked charts tracking PUE trends, country comparisons, facility types, and water stress with interactive filters.</div>';
  s += '</button>';

  s += '<button class="path-card" data-page="cluster" data-tool="tableau">';
  s += '<span class="pill" style="background:var(--tool-tableau-bg);color:var(--tool-tableau);border-color:var(--tool-tableau-border)">Tableau</span>';
  s += '<div class="t">Facility Clustering</div>';
  s += '<div class="d">K-Means clustering grouping data centers by energy and water efficiency. Adjust k from 2 to 5 to observe group movement.</div>';
  s += '</button>';

  s += '<button class="path-card" data-page="regress" data-tool="tableau">';
  s += '<span class="pill" style="background:var(--tool-tableau-bg);color:var(--tool-tableau);border-color:var(--tool-tableau-border)">Tableau</span>';
  s += '<div class="t">Power Regression Models</div>';
  s += '<div class="d">Linear, polynomial, and power curve fits linking IT capacity to power draw, featuring Ridge regularization.</div>';
  s += '</button>';

  s += '</div></div>';

  // Group 2: KNIME Pipeline
  s += '<div class="path-group">';
  s += '<div class="path-group-title"><span class="dot" style="background:var(--tool-knime)"></span><span>KNIME Analytics Platform</span></div>';
  s += '<div class="path-grid">';

  s += '<button class="path-card" data-page="knime" data-tool="knime">';
  s += '<span class="pill" style="background:var(--tool-knime-bg);color:var(--tool-knime);border-color:var(--tool-knime-border)">KNIME</span>';
  s += '<div class="t">Visual Node Workflow</div>';
  s += '<div class="d">An interactive visual flow showing reading, filtering, clustering, and modeling nodes. Click any node for configuration and output.</div>';
  s += '</button>';

  s += '</div></div>';

  // Group 3: Python Data Science & Statistical Methods
  s += '<div class="path-group">';
  s += '<div class="path-group-title"><span class="dot" style="background:var(--tool-python)"></span><span>Python Data Science & Statistics</span></div>';
  s += '<div class="path-grid">';

  s += '<button class="path-card" data-page="understand" data-tool="python">';
  s += '<span class="pill" style="background:var(--tool-python-bg);color:var(--tool-python);border-color:var(--tool-python-border)">Python</span>';
  s += '<div class="t">Data Understanding</div>';
  s += '<div class="d">Feature dictionary, missing value audit, class balance, and the data cleaning plan.</div>';
  s += '</button>';

  s += '<button class="path-card" data-page="stats" data-tool="python">';
  s += '<span class="pill" style="background:var(--tool-python-bg);color:var(--tool-python);border-color:var(--tool-python-border)">Python</span>';
  s += '<div class="t">Statistics & Outliers</div>';
  s += '<div class="d">Five-number summary, distribution histograms, interquartile box plots, and correlation matrices for every measure.</div>';
  s += '</button>';

  s += '<button class="path-card" data-page="prep" data-tool="python">';
  s += '<span class="pill" style="background:var(--tool-python-bg);color:var(--tool-python);border-color:var(--tool-python-border)">Python</span>';
  s += '<div class="t">Data Preprocessing</div>';
  s += '<div class="d">Equal-width binning, min-max vs z-score scaling, chi-square independence, and 3-4-5 rule segmentation.</div>';
  s += '</button>';

  s += '<button class="path-card" data-page="apps" data-tool="python">';
  s += '<span class="pill" style="background:var(--tool-python-bg);color:var(--tool-python);border-color:var(--tool-python-border)">Python</span>';
  s += '<div class="t">Real-World Applications</div>';
  s += '<div class="d">How data center operators, facility managers, and sustainability leads apply each analytical finding to make decisions.</div>';
  s += '</button>';

  s += '</div></div>';

  s += '</div>'; // end paths-container

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
  opt.scales.y = {
    position: 'left',
    ticks: {color: sc(0)},
    grid: {color: get_css('--line')},
    title: {display: true, text: 'Average PUE (Lower is better)', color: sc(0)},
    min: 1.5,
    max: 1.75
  };
  opt.scales.y2 = {
    position: 'right',
    ticks: {color: sc(3)},
    grid: {drawOnChartArea: false},
    title: {display: true, text: 'Avg Daily Electricity (MWh)', color: sc(3)},
    min: 0
  };
  opt.plugins.tooltip.callbacks = {
    label: function (c) {
      if (c.datasetIndex === 0) {
        return 'Average PUE: ' + fmt(c.parsed.y, 3) + ' (lower is better)';
      }
      return 'Avg Daily Electricity: ' + fmt(c.parsed.y, 1) + ' MWh';
    }
  };
  make_chart('home_c', {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Average PUE',
          data: pue,
          borderColor: sc(0),
          backgroundColor: sc(0),
          yAxisID: 'y',
          tension: 0.25,
          pointRadius: 5,
          pointHoverRadius: 7,
          borderWidth: 2.5
        },
        {
          label: 'Avg Daily Electricity (MWh)',
          data: elec,
          borderColor: sc(3),
          backgroundColor: sc(3),
          yAxisID: 'y2',
          tension: 0.25,
          pointRadius: 5,
          pointHoverRadius: 7,
          borderWidth: 2.5
        }
      ]
    },
    options: opt
  });
};
