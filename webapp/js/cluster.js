/* ---------- CLUSTERING (Tableau) ---------- */
var k3_names = ['Weak on both', 'Water-lean, air cooled', 'Efficient energy, thirsty'];
var k3_text = [
  'Highest PUE and highest WUE. Every facility in this cluster uses evaporative cooling. Prime candidate for modernization and efficiency retrofits.',
  'Largest cluster. Almost entirely air-cooled facilities, resulting in near-zero water draw, while maintaining moderate energy efficiency.',
  'Best energy efficiency (lowest PUE), but WUE approaches 2 litres per kWh. Evaporative cooling saves electricity at the expense of heavy water draw.'
];

function cluster_name(k, c) {
  if (k === 3) { return k3_names[c.id]; }
  var w = c.wue < 0.8 ? 'Low water' : (c.wue > 2.2 ? 'Highest water' : 'High water');
  var e = c.pue < 1.5 ? 'efficient PUE' : (c.pue > 1.7 ? 'weaker PUE' : 'mid PUE');
  return w + ', ' + e;
}

function top_mix(obj) {
  var best = '';
  var bv = -1;
  for (var key in obj) {
    if (obj[key] > bv) { bv = obj[key]; best = key; }
  }
  return best + ' ' + fmt(bv, 0) + '%';
}

pages.cluster = function () {
  var s = head('Tableau', 'Analytics Pane · K-Means', 'Facility Efficiency Clustering',
    'Unsupervised K-means clustering grouping all 18,110 facilities by average PUE and WUE. Lower values on both axes indicate superior operational sustainability.');

  // Elevated filter controls panel
  s += '<div class="filter-panel"><div class="bar">' +
    '<div class="field">Number of clusters (k)<span class="seg" id="k_seg">';
  for (var k = 2; k <= 5; k++) {
    s += '<button class="btn" data-k="' + k + '" aria-pressed="' + (state.k === k) + '">k = ' + k + (k === 3 ? ' (default)' : '') + '</button>';
  }
  s += '</span></div></div></div>';

  s += '<div id="cl_out"></div>';
  return s;
};

function cluster_draw() {
  clear_charts();
  var k = state.k;
  var info = D.cluster.k[String(k)];
  var cl = info.clusters;
  var total = D.cluster.total;
  var rows = '';
  var datasets = [];
  var i;

  for (i = 0; i < cl.length; i++) {
    var c = cl[i];
    rows += '<tr><td><span class="sw" style="background:' + sc(i) + '"></span><b>Cluster ' + (i + 1) + '</b></td><td>' + cluster_name(k, c) + '</td><td class="num">' + fmt(c.n) + '</td><td class="num">' + pct(c.n, total, 0) + '</td><td class="num">' + fmt(c.pue, 2) + '</td><td class="num">' + fmt(c.wue, 2) + '</td><td class="num">' + fmt(c.elec, 0) + '</td><td>' + top_mix(c.cool) + '</td></tr>';
    datasets.push({
      label: 'Cluster ' + (i + 1) + ': ' + cluster_name(k, c),
      data: [],
      backgroundColor: sc(i),
      pointRadius: 3.5,
      pointHoverRadius: 6,
      borderWidth: 0
    });
  }

  for (i = 0; i < D.cluster.points.length; i++) {
    var lab = info.labels[i];
    datasets[lab].data.push({x: D.cluster.points[i][0], y: D.cluster.points[i][1]});
  }

  var desc = '';
  if (k === 3) {
    desc = '<ul class="steps">';
    for (i = 0; i < 3; i++) {
      desc += '<li><b><span class="sw" style="background:' + sc(i) + '"></span>Cluster ' + (i + 1) + ' (' + k3_names[i] + '):</b> ' + k3_text[i] + '</li>';
    }
    desc += '</ul>';
  } else {
    desc = '<p class="what" style="margin:0">Titles are derived from each cluster centroid (water intensity from WUE, energy overhead from PUE). Use k = 3 for the primary baseline result.</p>';
  }

  var out = '';

  // Section 1: Hero Scatter Plot
  out += '<div class="kpi-section">';
  out += '<div class="section-header"><h2>1. Energy vs Water Trade-off (Cluster Scatter)</h2><p>Sample of 5,000 facilities plotted by PUE against WUE. Bottom-left represents optimal dual efficiency.</p></div>';
  out += '<section class="panel hero-panel">';
  out += '<div class="chart tall"><canvas id="cl_c"></canvas></div>';
  out += '<div class="meaning-box">';
  out += '<b>What this means in plain words:</b> Facilities located towards the bottom-left achieve the best sustainability profile: low PUE (minimal power wasted on cooling) and low WUE (minimal water consumption). Air-cooled sites congregate near the bottom axis (low water, moderate PUE), while evaporative facilities shift upward (consuming water to depress PUE).';
  out += '</div>';
  out += '</section>';
  out += '</div>';

  // Section 2: Group Archetypes & Detailed Table
  out += '<div class="kpi-section">';
  out += '<div class="section-header"><h2>2. Cluster Profiles & Centroids</h2><p>Breakdown of group characteristics, cooling composition, and mathematical separation.</p></div>';
  out += '<section class="panel">';
  out += '<h2>Understanding Each Cluster Profile</h2>';
  out += '<div style="margin-top:14px">' + desc + '</div>';

  // Collapsible detail table
  var cluster_table = '<div class="tw"><table><thead><tr><th>Cluster</th><th>Title</th><th class="num">Facilities</th><th class="num">Share</th><th class="num">Avg PUE</th><th class="num">Avg WUE</th><th class="num">MWh/day</th><th>Main Cooling</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
    '<p class="note" style="margin-top:12px"><b>Variance analysis:</b> Between-group sum of squares: ' + fmt(info.between, 1) + ' · Within-group sum of squares: ' + fmt(info.within, 2) + '. Higher k reduces within-group variance at the cost of model simplicity.</p>';
  out += details_box('Show detailed cluster metrics & centroids table', cluster_table);
  out += '</section>';
  out += '</div>';

  el('cl_out').innerHTML = out;

  var opt = base_options('Average PUE (Energy Overhead · Lower is better)', 'Average WUE (Litres per kWh · Lower is better)');
  opt.scales.x.min = 1.0;
  opt.scales.x.max = 2.0;
  opt.scales.y.min = 0;
  opt.scales.y.max = 3;
  opt.plugins.tooltip.callbacks = {
    title: function (items) { return items[0].dataset.label; },
    label: function (c) {
      return ['PUE: ' + fmt(c.parsed.x, 3), 'WUE: ' + fmt(c.parsed.y, 3) + ' L/kWh'];
    }
  };
  make_chart('cl_c', {type: 'scatter', data: {datasets: datasets}, options: opt});
}

after.cluster = function () {
  var btns = el('k_seg').getElementsByTagName('button');
  for (var i = 0; i < btns.length; i++) {
    btns[i].addEventListener('click', function (e) {
      state.k = Number(e.currentTarget.getAttribute('data-k'));
      for (var j = 0; j < btns.length; j++) {
        btns[j].setAttribute('aria-pressed', String(Number(btns[j].getAttribute('data-k')) === state.k));
      }
      cluster_draw();
    });
  }
  cluster_draw();
};
