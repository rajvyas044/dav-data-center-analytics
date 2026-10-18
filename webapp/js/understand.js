/* ---------- DATA UNDERSTANDING ---------- */
pages.understand = function () {
  var o = D.overview;
  var u = D.uncertainty;
  var s = head('Python', 'pandas · Data Quality Audit', 'Data Understanding & Quality Audit',
    'Comprehensive audit of dataset schema, categorical class balance, hidden data anomalies, and the formal preprocessing cleaning protocol.');

  // Open Stat Strip (No box-in-box nesting)
  s += '<div class="stat-strip">';
  s += '<div class="stat-item"><span class="lbl">Total Observations</span><span class="num">' + fmt(o.rows) + '</span><span class="sub">18,110 sites × 7 reporting years</span></div>';
  s += '<div class="stat-item"><span class="lbl">Native Nulls</span><span class="num">' + fmt(u.nulls) + '</span><span class="sub">pandas isnull() detects zero gaps</span></div>';
  s += '<div class="stat-item"><span class="lbl">Hidden Missing Values</span><span class="num">' + fmt(u.city_unknown) + '</span><span class="sub">City = "Unknown" (' + pct(u.city_unknown, o.rows) + ')</span></div>';
  s += '<div class="stat-item"><span class="lbl">Corrupted Geography</span><span class="num">' + fmt(u.country_digits) + '</span><span class="sub">Country contains address digits</span></div>';
  s += '</div>';

  // Section 1: Class Balance Distributions
  s += '<div class="kpi-section">';
  s += '<div class="section-header"><h2>1. Target Class Balance</h2><p>Distribution of facility records across primary operational classifications. Imbalance ratio = majority / minority.</p></div>';
  s += '<div class="grid g3">';
  var keys = ['Facility_Type', 'Cooling_System_Type', 'Surrounding_Water_Stress_Tier'];
  for (var j = 0; j < keys.length; j++) {
    var b = D.balance[keys[j]];
    s += '<section class="panel">' +
      '<h2>' + nice(keys[j]) + '</h2>' +
      '<p class="what">Records per categorical tier.</p>' +
      '<div class="chart short"><canvas id="bal_' + j + '"></canvas></div>' +
      '<div style="margin-top:12px"><b>Imbalance: ' + b.ratio + ' : 1</b> ' + (b.ratio > 5 ? '<span class="pill bad">Heavily Imbalanced</span>' : '<span class="pill good">Fairly Balanced</span>') + '</div>' +
      '</section>';
  }
  s += '</div>'; // end g3
  s += '<div class="meaning-box">';
  s += '<b>What this means in plain words:</b> The primary operational classes (facility types and cooling technologies) are well-distributed. Because no single class heavily dominates the dataset (ratios < 5:1), predictive algorithms and clustering can be trained without synthetic oversampling (SMOTE).';
  s += '</div>';
  s += '</div>';

  // Section 2: Data Quality Issues & Cleaning Protocol
  s += '<div class="kpi-section">';
  s += '<div class="section-header"><h2>2. Data Hygiene & Cleaning Protocol</h2><p>Identifying hidden corruption and executing a reproducible cleaning pipeline in Python.</p></div>';
  s += '<div class="grid g2">';

  // Left: Uncertainty Chart
  s += '<section class="panel">';
  s += '<h2>Where the Data is Uncertain</h2>';
  s += '<p class="what">Frequency of placeholder strings and corrupted text fields across the dataset.</p>';
  s += '<div class="chart"><canvas id="unc_c"></canvas></div>';
  s += '<div class="meaning-box">';
  s += '<b>Takeaway:</b> The technical core (PUE, WUE, electricity, water) is 100% complete. Data quality problems are strictly confined to geographical metadata (City/Country).';
  s += '</div>';
  s += '</section>';

  // Right: 6-Step Cleaning Protocol
  s += '<section class="panel">';
  s += '<h2>Python Data Cleaning Protocol</h2>';
  s += '<p class="what">Systematic steps applied in pandas before exploratory modeling:</p>';
  s += '<ol class="steps">' +
    '<li><b>Audit nulls & duplicates:</b> Verified zero system nulls and zero duplicate rows.</li>' +
    '<li><b>Expose hidden text gaps:</b> Replace string placeholders ("Unknown", "N/A", whitespace) with true NaN objects.</li>' +
    '<li><b>Clean corrupted geography:</b> Identify Country and City entries containing digits (postal fragments) and blank them.</li>' +
    '<li><b>Type consistency check:</b> Verify that each Facility ID retains the exact same Facility Type across reporting years.</li>' +
    '<li><b>Flag statistical outliers:</b> Apply 1.5 × IQR fencing to add binary is_outlier indicator columns without deleting real high-capacity sites.</li>' +
    '<li><b>Export cleaned artifact:</b> Save data_center_hybrid_cleaned.csv for downstream KNIME and Tableau consumption.</li>' +
    '</ol>';
  s += '</section>';

  s += '</div>'; // end g2
  s += '</div>'; // end kpi-section

  // Section 3: Data Dictionary (Behind Collapsible Toggle)
  var dict_rows = '';
  for (var i = 0; i < D.columns.length; i++) {
    var c = D.columns[i];
    dict_rows += '<tr><td><b>' + nice(c.name) + '</b></td><td><span class="tag">' + c.kind + '</span></td><td class="eq">' + c.example + '</td><td class="num">' + fmt(c.unique) + '</td></tr>';
  }
  var dict_table = '<div class="tw"><table><thead><tr><th>Attribute Name</th><th>Data Type</th><th>Sample Value</th><th class="num">Distinct Values</th></tr></thead><tbody>' + dict_rows + '</tbody></table></div>' +
    '<p class="note" style="margin-top:12px"><b>Target Class:</b> Facility Type (3 classes: Enterprise/Standard, Colocation, Hyperscale/AI). Cooling System Type and Water Stress Tier serve as secondary analysis dimensions.</p>';

  s += '<div class="kpi-section"><section class="panel">' +
    '<h2>Complete Dataset Schema</h2>' +
    '<p class="what">All 14 attributes with data types, sample values, and unique cardinality counts.</p>' +
    details_box('Show complete 14-attribute data dictionary & schema table', dict_table) +
    '</section></div>';

  return s;
};

after.understand = function () {
  var keys = ['Facility_Type', 'Cooling_System_Type', 'Surrounding_Water_Stress_Tier'];
  for (var j = 0; j < keys.length; j++) {
    var b = D.balance[keys[j]];
    var total = 0;
    var cols = [];
    for (var a = 0; a < b.counts.length; a++) {
      total += b.counts[a];
      cols.push(sc(a));
    }
    var opt = base_options('', '');
    opt.indexAxis = 'y';
    opt.plugins.legend.display = false;
    opt.scales.x.ticks.callback = function (v) { return fmt(v / 1000) + 'k'; };
    (function (tot) {
      opt.plugins.tooltip.callbacks = {
        label: function (c) { return fmt(c.parsed.x) + ' records (' + pct(c.parsed.x, tot) + ')'; }
      };
    })(total);
    make_chart('bal_' + j, {
      type: 'bar',
      data: {labels: b.labels, datasets: [{data: b.counts, backgroundColor: cols, borderRadius: 5}]},
      options: opt
    });
  }

  var u = D.uncertainty;
  var o = D.overview;
  var labels = ['City = Unknown', 'City has digits', 'Country = Unknown', 'Country has digits', 'Null values', 'Duplicate rows'];
  var vals = [u.city_unknown, u.city_digits, u.country_unknown, u.country_digits, u.nulls, o.dups];
  var opt2 = base_options('', 'Rows Affected');
  opt2.indexAxis = 'y';
  opt2.plugins.legend.display = false;
  opt2.scales.x.title = {display: true, text: 'Affected Records', color: get_css('--ink2')};
  opt2.scales.y.title = {display: false};
  opt2.plugins.tooltip.callbacks = {
    label: function (c) { return fmt(c.parsed.x) + ' records (' + pct(c.parsed.x, o.rows, 2) + ' of dataset)'; }
  };
  make_chart('unc_c', {
    type: 'bar',
    data: {labels: labels, datasets: [{data: vals, backgroundColor: sc(3), borderRadius: 5}]},
    options: opt2
  });
};
