/* ---------- APPLICATIONS ---------- */
function type_row(name) {
  for (var i = 0; i < D.by_type.length; i++) {
    if (D.by_type[i].type === name) { return D.by_type[i]; }
  }
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

  var s = head('Applications', 'Decision Support & Practical Impact', 'Operational Applications & Viva Defense',
    'How engineering, sustainability, and regulatory stakeholders translate each analytical finding in this project into concrete operational decisions.');

  var items = [
    {
      who: 'Data Center Site Operators',
      page: 'cluster',
      tag: 'Clustering · Tableau',
      ask: 'Which facilities in our fleet lag behind efficiency benchmarks?',
      does: 'Benchmark individual facilities against peers on dual PUE/WUE axes and prioritize retrofit capital toward the lowest-performing cluster.',
      ev: fmt(c3[0].n) + ' facilities (' + pct(c3[0].n, total, 0) + ') occupy the cluster weak on both metrics; all employ evaporative cooling towers.'
    },
    {
      who: 'ESG & Sustainability Leads',
      page: 'kpi',
      tag: 'KPI Dashboard · Tableau',
      ask: 'Are efficiency initiatives yielding quantifiable year-over-year gains?',
      does: 'Publish verified multi-year efficiency improvements in annual ESG sustainability disclosures and regulatory compliance filings.',
      ev: 'Fleetwide average PUE improved from ' + fmt(y1.pue, 3) + ' to ' + fmt(y2.pue, 3) + ' between ' + D.overview.years[0] + ' and ' + D.overview.years[1] + '.'
    },
    {
      who: 'Capacity & Electrical Planners',
      page: 'regress',
      tag: 'Regression · Tableau & Python',
      ask: 'What grid electrical capacity is required for a planned new facility?',
      does: 'Forecast peak daily power draw from planned server capacity to negotiate utility power purchase agreements prior to construction.',
      ev: 'Each 1 MW of IT capacity adds approximately ' + fmt(R.linear.b, 1) + ' MWh of daily power demand (R² = ' + fmt(R.linear.r2, 3) + ').'
    },
    {
      who: 'Water-Risk & Site Selection Teams',
      page: 'kpi',
      tag: 'KPI & Clustering · Tableau',
      ask: 'Where does cooling architecture exacerbate regional water stress?',
      does: 'Mandate dry air or closed-loop liquid cooling in High water-stress watersheds to mitigate severe community and drought risks.',
      ev: 'Evaporative cooling systems consume ~2.0 L/kWh; air-cooled facilities operate near ' + fmt(c3[1].wue, 2) + ' L/kWh.'
    },
    {
      who: 'Environmental Regulators & Policy Makers',
      page: 'stats',
      tag: 'Statistics · Python',
      ask: 'What constitutes an ambitious yet achievable efficiency mandate?',
      does: 'Establish regulatory PUE/WUE thresholds based on empirical 25th-75th percentile distributions rather than unrealistic theoretical ideals.',
      ev: 'Empirical PUE spans ' + find_stat('PUE').min + ' to ' + find_stat('PUE').max + ' with a median of ' + find_stat('PUE').median + '; 95% of sites operate below 1.75.'
    },
    {
      who: 'Cloud Buyers & Infrastructure Investors',
      page: 'kpi',
      tag: 'KPI Dashboard · Tableau',
      ask: 'Which operator archetypes carry long-term cost and environmental exposure?',
      does: 'Evaluate prospective colocation contracts on energy efficiency and power intensity as part of financial due diligence.',
      ev: 'Hyperscale/AI sites achieve lower PUE (' + fmt(hyp.pue, 2) + ' vs ' + fmt(ent.pue, 2) + '), but draw ' + fmt(hyp.elec / ent.elec, 0) + '× more electricity per facility.'
    },
    {
      who: 'Machine Learning Engineers',
      page: 'prep',
      tag: 'Preprocessing · Python & KNIME',
      ask: 'Is the operational data suitable for downstream machine learning?',
      does: 'Normalize skewed measures, drop redundant collinear features, and discretize capacity to stabilize model training pipelines.',
      ev: 'Capacity and electricity correlate at r = ' + fmt(D.prep.pearson, 2) + ', confirming that preserving both introduces severe collinearity.'
    }
  ];

  // Section 1: Stakeholder Decision Archetypes
  s += '<div class="kpi-section">';
  s += '<div class="section-header"><h2>1. Stakeholder Decision Archetypes</h2><p>Specific questions, decisions supported, and empirical proof points from this dataset.</p></div>';
  s += '<div class="grid g2">';
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    s += '<section class="panel apps-card">' +
      '<h2>' + it.who + '</h2>' +
      '<p class="pill" style="margin:2px 0 12px;display:inline-block">' + it.tag + '</p>' +
      '<dl class="kv">' +
      '<dt>Question</dt><dd>' + it.ask + '</dd>' +
      '<dt>Decision</dt><dd>' + it.does + '</dd>' +
      '<dt>Evidence</dt><dd><b>' + it.ev + '</b></dd>' +
      '</dl>' +
      '<p style="margin:16px 0 0"><button class="btn" data-page="' + it.page + '">Inspect the analysis →</button></p>' +
      '</section>';
  }
  s += '</div>'; // end g2
  s += '</div>'; // end kpi-section

  // Section 2: Method Justification Table
  var trows = [
    ['Data Understanding', 'Can we trust this data?', 'Expose hidden placeholder text and corrupted location strings before modeling.'],
    ['Summary Statistics & Outliers', 'What is typical and what is extreme?', 'Establish baseline medians, interquartile spreads, and legitimate tail observations.'],
    ['KPI Dashboard', 'How does the fleet perform over time?', 'Monitor efficiency trajectories and filter by facility type, cooling, and water stress.'],
    ['K-Means Clustering', 'Which facilities share operational traits?', 'Segment sites into actionable archetypes rather than applying blunt one-size-fits-all policies.'],
    ['Regression Modeling', 'How does capacity drive power draw?', 'Quantify scaling laws and predict electrical demand for planned data centers.'],
    ['Data Preprocessing', 'How do we prepare data for algorithms?', 'Remove collinear features, scale inputs into [0, 1], and discretize continuous ranges.']
  ];

  var tb = '';
  for (var t = 0; t < trows.length; t++) {
    tb += '<tr><td><b>' + trows[t][0] + '</b></td><td>' + trows[t][1] + '</td><td>' + trows[t][2] + '</td></tr>';
  }

  s += '<div class="kpi-section">';
  s += '<div class="section-header"><h2>2. Methodological Justification (Viva Guide)</h2><p>Why every analytical technique in this study earns its place in the pipeline.</p></div>';
  s += '<section class="panel hero-panel">';
  s += '<div class="tw"><table><thead><tr><th>Analytical Technique</th><th>Question It Resolves</th><th>Applied Decision Purpose</th></tr></thead><tbody>' + tb + '</tbody></table></div>';
  s += '</section>';
  s += '</div>';

  // Section 3: Analytical Boundaries & Practical Caveats
  s += '<div class="kpi-section">';
  s += '<div class="section-header"><h2>3. Analytical Boundaries & Limitations</h2><p>Key assumptions and constraints to bear in mind during viva defense.</p></div>';
  s += '<section class="panel hero-panel">';
  s += '<ul class="steps">' +
    '<li><b>Geographic Uncertainty:</b> ' + pct(D.uncertainty.city_unknown, D.overview.rows, 0) + ' of rows contain an "Unknown" city. Country and city comparisons reflect reporting subsets, not the full fleet.</li>' +
    '<li><b>Correlation vs Causation:</b> Hyperscale facilities achieve lower PUE while consuming higher absolute power. Size correlates with efficiency, but modern architectural design (not scale alone) is the underlying driver.</li>' +
    '<li><b>Univariate Model Scope:</b> The primary regression models capacity against power. While R² is high (0.96), external variables like ambient climate and cooling choice also influence real-time consumption.</li>' +
    '<li><b>Cluster Sensitivity:</b> K-Means cluster boundaries depend on distance scaling and chosen k. Cluster titles serve as descriptive archetypes, not immutable facts.</li>' +
    '</ul>';
  s += '<div class="meaning-box" style="margin-top:16px">';
  s += '<b>Viva Summary:</b> A robust data analytics project does not claim perfection: it clearly defines its assumptions, audits data limitations, and explains the engineering rationale behind every model.';
  s += '</div>';
  s += '</section>';
  s += '</div>';

  return s;
};
