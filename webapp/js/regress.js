/* ---------- REGRESSION (Tableau) ---------- */
function reg_alpha() { return state.reg.alpha_exp === 0 ? 0 : Math.pow(10, state.reg.alpha_exp); }
function reg_ridge() {
  var R = D.regression;
  var b = R.sxy / (R.sxx + reg_alpha());
  var sse = R.sst - 2 * b * R.sxy + b * b * R.sxx;
  return {b: b, a: R.ym - b * R.xm, r2: 1 - sse / R.sst};
}
function reg_value(model, x) {
  var R = D.regression;
  if (model === 'lin') { return R.linear.a + R.linear.b * x; }
  if (model === 'poly') { return R.poly.c2 * x * x + R.poly.c1 * x + R.poly.c0; }
  if (model === 'pow') { return R.power.a * Math.pow(x, R.power.b); }
  var rr = reg_ridge();
  return rr.a + rr.b * x;
}
var reg_names = {lin: 'Linear', poly: 'Polynomial (degree 2)', pow: 'Power', ridge: 'Ridge'};
pages.regress = function () {
  var r = state.reg;
  var s = head('Tableau', 'trend lines, Describe Trend Model', 'Regression of electricity on capacity',
    'How well does a facility\'s capacity predict its daily electricity use? Three trend-line models were fitted in Tableau on all ' + fmt(D.regression.n) + ' records. Ridge was done in Python.');
  s += '<div class="bar"><div class="field">Models on the chart<span class="seg" id="reg_models">';
  var keys = ['lin', 'poly', 'pow', 'ridge'];
  for (var i = 0; i < keys.length; i++) {
    s += '<button class="btn" data-m="' + keys[i] + '" aria-pressed="' + r[keys[i]] + '"><span class="sw" style="background:' + sc(i + 1) + '"></span>' + reg_names[keys[i]] + '</button>';
  }
  s += '</span></div><div class="field">View<span class="seg" id="reg_zoom">' +
    '<button class="btn" data-z="near" aria-pressed="' + (r.zoom === 'near') + '">0 to 120 MW (96% of records)</button>' +
    '<button class="btn" data-z="full" aria-pressed="' + (r.zoom === 'full') + '">Full range</button></span></div></div>';
  s += '<div class="grid g2">';
  s += panel('Capacity vs daily electricity', 'A random 3,000 of ' + fmt(D.regression.n) + ' records are drawn; the fitted lines use every record. Hover a dot or a line.',
    '<div class="chart tall"><canvas id="reg_c"></canvas></div>',
    '<b>Reading:</b> the cloud is a tight, almost straight band. Each extra MW of capacity adds about ' + fmt(D.regression.linear.b, 1) + ' MWh of daily electricity.');
  s += '<div style="display:grid;gap:16px;min-width:0" id="reg_side">' +
    panel('Predict electricity for a capacity', 'Type a planned capacity and see what each model predicts.',
      '<label class="field">Capacity (MW)<input type="number" id="reg_cap" min="1" max="600" step="1" value="' + r.cap + '"></label><div id="reg_pred" style="margin-top:12px"></div>', '') +
    panel('Ridge regression (Python)', 'Ridge adds a penalty alpha that shrinks the slope. Drag to see the effect; the numbers are exact.',
      '<label class="field" style="width:100%">Alpha (penalty)<input type="range" id="reg_alpha" min="0" max="8" step="0.1" value="' + r.alpha_exp + '"></label><div id="reg_ridge" style="margin-top:10px"></div>',
      '<b>Reading:</b> alpha only matters once it is comparable to the spread of capacity (Sxx = ' + fmt(D.regression.sxx / 1e6, 0) + ' million). Below that, Ridge equals ordinary least squares.') + '</div></div>';
  s += '<div id="reg_tab"></div>';
  return s;
};
function reg_draw() {
  clear_charts();
  var R = D.regression;
  var r = state.reg;
  var xmax = r.zoom === 'near' ? 120 : Math.ceil(R.xmax * 1.02);
  var ymax = r.zoom === 'near' ? 3000 : 15000;
  var pts = [];
  var i;
  for (i = 0; i < R.points.length; i++) { pts.push({x: R.points[i][0], y: R.points[i][1]}); }
  var datasets = [{label: 'Records (sample)', data: pts, backgroundColor: get_css('--muted'), pointRadius: 2, pointHoverRadius: 5, order: 5}];
  var keys = ['lin', 'poly', 'pow', 'ridge'];
  for (var k = 0; k < keys.length; k++) {
    if (!r[keys[k]]) { continue; }
    var line = [];
    for (i = 0; i <= 120; i++) {
      var x = Math.max(0.5, xmax * i / 120);
      line.push({x: x, y: reg_value(keys[k], x)});
    }
    datasets.push({label: reg_names[keys[k]], data: line, type: 'scatter', showLine: true, borderColor: sc(k + 1), backgroundColor: sc(k + 1), borderWidth: 2.5, pointRadius: 0, pointHitRadius: 10, pointHoverRadius: 5, tension: 0, borderDash: keys[k] === 'ridge' ? [6, 4] : [], order: 1});
  }
  var opt = base_options('Estimated capacity (MW)', 'Daily electricity usage (MWh)');
  opt.scales.x.min = 0; opt.scales.x.max = xmax;
  opt.scales.y.min = 0; opt.scales.y.max = ymax;
  opt.plugins.tooltip.callbacks = {
    title: function (items) { return items[0].dataset.label; },
    label: function (c) {
      if (c.datasetIndex === 0) { return ['Capacity ' + fmt(c.parsed.x, 1) + ' MW', 'Usage ' + fmt(c.parsed.y, 0) + ' MWh per day']; }
      return ['At ' + fmt(c.parsed.x, 0) + ' MW the model gives', fmt(c.parsed.y, 0) + ' MWh per day'];
    }
  };
  make_chart('reg_c', {type: 'scatter', data: {datasets: datasets}, options: opt});
}
function reg_numbers() {
  var R = D.regression;
  var cap = Number(el('reg_cap').value);
  if (!(cap > 0)) { cap = 1; }
  state.reg.cap = cap;
  var keys = ['lin', 'poly', 'pow', 'ridge'];
  var html = '<table><tbody>';
  for (var i = 0; i < keys.length; i++) {
    html += '<tr><td><span class="sw" style="background:' + sc(i + 1) + '"></span>' + reg_names[keys[i]] + '</td><td class="num">' + fmt(reg_value(keys[i], cap), 0) + ' MWh/day</td></tr>';
  }
  el('reg_pred').innerHTML = html + '</tbody></table>';
  var rr = reg_ridge();
  var shrink = (1 - rr.b / R.linear.b) * 100;
  el('reg_ridge').innerHTML = '<table><tbody><tr><td>Alpha</td><td class="num">' + (reg_alpha() === 0 ? '0 (none)' : fmt(reg_alpha(), 0)) + '</td></tr>' +
    '<tr><td>Slope</td><td class="num">' + fmt(rr.b, 2) + ' (' + (shrink < 0.005 ? 'same as OLS' : fmt(shrink, 1) + '% smaller') + ')</td></tr>' +
    '<tr><td>Intercept</td><td class="num">' + fmt(rr.a, 2) + '</td></tr>' +
    '<tr><td>R-squared</td><td class="num">' + fmt(rr.r2, 4) + '</td></tr></tbody></table>';
}
function reg_table() {
  var R = D.regression;
  var rr = reg_ridge();
  var rows = '<tr><td><span class="sw" style="background:' + sc(1) + '"></span><b>Linear</b></td><td class="eq">y = ' + fmt(R.linear.b, 4) + ' x + ' + fmt(R.linear.a, 4) + '</td><td class="num">' + fmt(R.linear.r2, 4) + '</td><td class="num">4.47e9</td><td class="num">35,297.8</td><td class="num">187.9</td></tr>' +
    '<tr><td><span class="sw" style="background:' + sc(2) + '"></span><b>Polynomial (deg 2)</b></td><td class="eq">y = ' + fmt(R.poly.c2, 7) + ' x² + ' + fmt(R.poly.c1, 4) + ' x + ' + fmt(R.poly.c0, 4) + '</td><td class="num">' + fmt(R.poly.r2, 4) + '</td><td class="num">4.22e9</td><td class="num">33,295.6</td><td class="num">182.5</td></tr>' +
    '<tr><td><span class="sw" style="background:' + sc(3) + '"></span><b>Power</b></td><td class="eq">ln y = ' + fmt(R.power.ln_a, 4) + ' + ' + fmt(R.power.b, 4) + ' ln x<br>y = ' + fmt(R.power.a, 2) + ' · x^' + fmt(R.power.b, 3) + '</td><td class="num">' + fmt(R.power.r2_log, 4) + ' (log scale)<br>' + fmt(R.power.r2_orig, 4) + ' (original)</td><td class="num">3,403.8 (log)</td><td class="num">0.0269 (log)</td><td class="num">0.164 (log)</td></tr>' +
    '<tr><td><span class="sw" style="background:' + sc(4) + '"></span><b>Ridge</b> (Python)</td><td class="eq">y = ' + fmt(rr.b, 4) + ' x + ' + fmt(rr.a, 4) + '</td><td class="num">' + fmt(rr.r2, 4) + '</td><td class="num">n/a</td><td class="num">n/a</td><td class="num">n/a</td></tr>';
  el('reg_tab').innerHTML = panel('Describe Trend Model', 'The numbers Tableau reports for each trend line. All p-values are below 0.0001. Ridge follows the alpha slider.',
    '<div class="tw"><table><thead><tr><th>Model</th><th>Equation</th><th class="num">R-squared</th><th class="num">SSE</th><th class="num">MSE</th><th class="num">Std. error</th></tr></thead><tbody>' + rows + '</tbody></table></div>',
    '<b>Which is best?</b> Polynomial has the highest R-squared on the original scale (' + fmt(R.poly.r2, 4) + ') but only by a hair over Linear (' + fmt(R.linear.r2, 4) + '). The Power model\'s 0.9756 is on a log scale, so it cannot be compared directly with the other two. Its exponent of ' + fmt(R.power.b, 3) + ' (below 1) means electricity grows slightly slower than capacity. The relationship is nearly linear, so the simple Linear model is a good choice.');
}
after.regress = function () {
  var mb = el('reg_models').getElementsByTagName('button');
  for (var i = 0; i < mb.length; i++) {
    mb[i].addEventListener('click', function (e) {
      var key = e.currentTarget.getAttribute('data-m');
      state.reg[key] = !state.reg[key];
      e.currentTarget.setAttribute('aria-pressed', String(state.reg[key]));
      reg_draw();
    });
  }
  var zb = el('reg_zoom').getElementsByTagName('button');
  for (var j = 0; j < zb.length; j++) {
    zb[j].addEventListener('click', function (e) {
      state.reg.zoom = e.currentTarget.getAttribute('data-z');
      for (var q = 0; q < zb.length; q++) { zb[q].setAttribute('aria-pressed', String(zb[q].getAttribute('data-z') === state.reg.zoom)); }
      reg_draw();
    });
  }
  el('reg_cap').addEventListener('input', reg_numbers);
  el('reg_alpha').addEventListener('input', function () {
    state.reg.alpha_exp = Number(el('reg_alpha').value);
    reg_numbers();
    reg_table();
    if (state.reg.ridge) { reg_draw(); }
  });
  reg_draw();
  reg_numbers();
  reg_table();
};
