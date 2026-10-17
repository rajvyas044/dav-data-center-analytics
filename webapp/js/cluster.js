/* ---------- CLUSTERING (Tableau, P8) ---------- */
var k3_names = ['Weak on both', 'Water-lean, air cooled', 'Efficient energy, thirsty'];
var k3_text = [
  'Highest PUE and the highest WUE. Every facility here is evaporative cooled. First target for improvement.',
  'Largest group. Almost all air cooled, so water use is very low. PUE is mid-range.',
  'Best PUE of the three, but WUE is close to 2 L per kWh. All evaporative cooled: energy is saved, water is spent.'
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
  for (var key in obj) { if (obj[key] > bv) { bv = obj[key]; best = key; } }
  return best + ' ' + fmt(bv, 0) + '%';
}
pages.cluster = function () {
  var s = head('Practical 8', 'Tableau · Analytics pane, Cluster', 'Facility clustering',
    'K-means groups the 18,110 facilities by average PUE and average WUE (both normalised, one mark per Facility ID). Lower is better on both axes.');
  s += '<div class="bar"><div class="field">Number of clusters (k)<span class="seg" id="k_seg">';
  for (var k = 2; k <= 5; k++) {
    s += '<button class="btn" data-k="' + k + '" aria-pressed="' + (state.k === k) + '">k = ' + k + (k === 3 ? ' (practical)' : '') + '</button>';
  }
  s += '</span></div></div><div id="cl_out"></div>';
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
    datasets.push({label: 'Cluster ' + (i + 1) + ': ' + cluster_name(k, c), data: [], backgroundColor: sc(i), pointRadius: 3.5, pointHoverRadius: 6, borderWidth: 0});
  }
  for (i = 0; i < D.cluster.points.length; i++) {
    var lab = info.labels[i];
    datasets[lab].data.push({x: D.cluster.points[i][0], y: D.cluster.points[i][1]});
  }
  var desc = '';
  if (k === 3) {
    desc = '<ul class="steps">';
    for (i = 0; i < 3; i++) { desc += '<li><b>Cluster ' + (i + 1) + ' (' + k3_names[i] + '):</b> ' + k3_text[i] + '</li>'; }
    desc += '</ul>';
  } else {
    desc = '<p class="what" style="margin:0">Titles are generated from each cluster\'s centre: water level from WUE, energy level from PUE. Use k = 3 for the worked practical result.</p>';
  }
  var out = '<div class="grid g2">' +
    panel('Cluster scatter', 'Each dot is a facility (a random 5,000 of 18,110 are drawn). Hover a dot for its values. Click a legend item to hide a cluster.',
      '<div class="chart tall"><canvas id="cl_c"></canvas></div>', '<b>Bottom-left is best:</b> low PUE (little energy overhead) and low WUE (little water).') +
    panel('What each cluster means', 'Titles and plain-language reading of every group.', desc,
      '<b>Sum of squares:</b> between groups ' + fmt(info.between, 1) + ', within groups ' + fmt(info.within, 2) + '. More clusters lower the within-group value.') + '</div>' +
    panel('Describe clusters', 'The same summary as Tableau\'s Describe Clusters, using the full 18,110 facilities. Cooling shows the most common cooling system in each group.',
      '<div class="tw"><table><thead><tr><th>Cluster</th><th>Title</th><th class="num">Facilities</th><th class="num">Share</th><th class="num">Avg PUE</th><th class="num">Avg WUE</th><th class="num">MWh/day</th><th>Main cooling</th></tr></thead><tbody>' + rows + '</tbody></table></div>', '');
  el('cl_out').innerHTML = out;
  var opt = base_options('Average PUE (energy overhead)', 'Average WUE (litres per kWh)');
  opt.scales.x.min = 1.0;
  opt.scales.x.max = 2.0;
  opt.scales.y.min = 0;
  opt.scales.y.max = 3;
  opt.plugins.tooltip.callbacks = {
    title: function (items) { return items[0].dataset.label; },
    label: function (c) { return ['PUE ' + fmt(c.parsed.x, 3), 'WUE ' + fmt(c.parsed.y, 3) + ' L per kWh']; }
  };
  make_chart('cl_c', {type: 'scatter', data: {datasets: datasets}, options: opt});
}
after.cluster = function () {
  var btns = el('k_seg').getElementsByTagName('button');
  for (var i = 0; i < btns.length; i++) {
    btns[i].addEventListener('click', function (e) {
      state.k = Number(e.currentTarget.getAttribute('data-k'));
      for (var j = 0; j < btns.length; j++) { btns[j].setAttribute('aria-pressed', String(Number(btns[j].getAttribute('data-k')) === state.k)); }
      cluster_draw();
    });
  }
  cluster_draw();
};
