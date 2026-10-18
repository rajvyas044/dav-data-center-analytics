/* ---------- DATA UNDERSTANDING ---------- */
pages.understand = function () {
  var o = D.overview;
  var u = D.uncertainty;
  var s = head('Python', 'pandas', 'Data understanding',
    'What the dataset holds, how balanced its classes are, where the data is uncertain, and what has to be cleaned before modelling.');
  s += '<div class="grid gk">' +
    kpi_card('Rows', fmt(o.rows), '18,110 facilities x 7 years') +
    kpi_card('Missing values', fmt(u.nulls), 'pandas finds no nulls') +
    kpi_card('Hidden gaps', fmt(u.city_unknown), 'City = "Unknown" (' + pct(u.city_unknown, o.rows) + ')', 'Missing data written as text, so isnull() does not see it.') +
    kpi_card('Corrupt countries', fmt(u.country_digits), 'Country contains digits') + '</div>';
  var rows = '';
  for (var i = 0; i < D.columns.length; i++) {
    var c = D.columns[i];
    rows += '<tr><td><b>' + nice(c.name) + '</b></td><td>' + c.kind + '</td><td class="eq">' + c.example + '</td><td class="num">' + fmt(c.unique) + '</td></tr>';
  }
  s += panel('Data dictionary', 'All 14 attributes with their type, a sample value and how many distinct values each has.',
    '<div class="tw"><table><thead><tr><th>Attribute</th><th>Type</th><th>Example</th><th class="num">Distinct</th></tr></thead><tbody>' + rows + '</tbody></table></div>',
    '<b>Class attribute:</b> Facility Type (3 classes). Cooling System Type and Water Stress Tier are secondary class candidates.');
  s += '<div class="grid g3" style="margin-top:16px">';
  var keys = ['Facility_Type', 'Cooling_System_Type', 'Surrounding_Water_Stress_Tier'];
  for (var j = 0; j < keys.length; j++) {
    var b = D.balance[keys[j]];
    s += panel(nice(keys[j]), 'Records per class. Imbalance ratio = biggest class divided by smallest.',
      '<div class="chart short"><canvas id="bal_' + j + '"></canvas></div>',
      '<b>Imbalance: ' + b.ratio + ' : 1</b> ' + (b.ratio > 5 ? '<span class="pill bad">imbalanced</span>' : '<span class="pill good">fairly balanced</span>'));
  }
  s += '</div>';
  s += '<div class="grid g2">';
  s += panel('Where the data is uncertain', 'Counts of rows with each problem. Hover a bar for the share of all records.',
    '<div class="chart"><canvas id="unc_c"></canvas></div>',
    '<b>Takeaway:</b> the numeric core (PUE, WUE, electricity, water) is complete. The location columns are the weak part.');
  s += panel('Cleaning plan', 'Steps applied in the Python analysis. Outliers are flagged, not deleted, because large facilities are real.',
    '<ol class="steps"><li>Audit nulls and duplicates. Result: 0 nulls, 0 duplicates.</li>' +
    '<li>Replace placeholder text ("Unknown", "N/A", empty) with real missing values.</li>' +
    '<li>Flag City and Country entries that contain digits (postal codes, address fragments) and blank them.</li>' +
    '<li>Check that each Facility ID keeps one Facility Type across years.</li>' +
    '<li>Add an is_outlier flag per numeric column using the 1.5 x IQR rule.</li>' +
    '<li>Validate again and save data_center_hybrid_cleaned.csv.</li></ol>',
    '<b>Why it matters:</b> any country-level chart, such as the KPI map, is only as good as the Country column.');
  s += '</div>';
  return s;
};
after.understand = function () {
  var keys = ['Facility_Type', 'Cooling_System_Type', 'Surrounding_Water_Stress_Tier'];
  for (var j = 0; j < keys.length; j++) {
    var b = D.balance[keys[j]];
    var total = 0;
    var cols = [];
    for (var a = 0; a < b.counts.length; a++) { total += b.counts[a]; cols.push(sc(a)); }
    var opt = base_options('', '');
    opt.indexAxis = 'y';
    opt.plugins.legend.display = false;
    opt.scales.x.ticks.callback = function (v) { return fmt(v / 1000) + 'k'; };
    (function (tot) {
      opt.plugins.tooltip.callbacks = {label: function (c) { return fmt(c.parsed.x) + ' records (' + pct(c.parsed.x, tot) + ')'; }};
    })(total);
    make_chart('bal_' + j, {type: 'bar', data: {labels: b.labels, datasets: [{data: b.counts, backgroundColor: cols, borderRadius: 4}]}, options: opt});
  }
  var u = D.uncertainty;
  var o = D.overview;
  var labels = ['City = Unknown', 'City has digits', 'Country = Unknown', 'Country has digits', 'Null values', 'Duplicate rows'];
  var vals = [u.city_unknown, u.city_digits, u.country_unknown, u.country_digits, u.nulls, o.dups];
  var opt2 = base_options('', 'Rows');
  opt2.indexAxis = 'y';
  opt2.plugins.legend.display = false;
  opt2.scales.x.title = {display: true, text: 'Rows', color: get_css('--ink2')};
  opt2.scales.y.title = {display: false};
  opt2.plugins.tooltip.callbacks = {label: function (c) { return fmt(c.parsed.x) + ' rows (' + pct(c.parsed.x, o.rows, 2) + ' of all records)'; }};
  make_chart('unc_c', {type: 'bar', data: {labels: labels, datasets: [{data: vals, backgroundColor: sc(1), borderRadius: 4}]}, options: opt2});
};
