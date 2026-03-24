/* ================================================================
   Board — Two views: Experiments (working view) + Compare
   Health indicators on every experiment row.
   ================================================================ */

var activeMode = 'outbound';
var activeView = 'experiments';
var activeFlow = null;

function setMode(m) { activeMode = m; activeFlow = null; render(); }
function setView(v) { activeView = v; render(); }
function setFlow(ch) { activeFlow = ch; render(); }

function render() {
  var exps = load();
  var modeChannels = Object.entries(CH).filter(function(p) { return p[1].mode === activeMode; }).map(function(p) { return p[0]; });
  if (!activeFlow || !modeChannels.includes(activeFlow)) activeFlow = modeChannels[0];

  // Sprint label
  var sp = loadSprint();
  document.getElementById('sprint-label').textContent = sp.name + ' · ' + sp.start + ' – ' + sp.end + ', ' + sp.year;

  // Mode toggle
  var outCount = exps.filter(function(e) { return CH[e.ch] && CH[e.ch].mode === 'outbound' && e.verdict !== 'Stop'; }).length;
  var inCount = exps.filter(function(e) { return CH[e.ch] && CH[e.ch].mode === 'inbound' && e.verdict !== 'Stop'; }).length;
  document.getElementById('mode-toggle').innerHTML =
    '<button class="mode-pill ' + (activeMode === 'outbound' ? 'active' : '') + '" onclick="setMode(\'outbound\')">Out <span class="mode-pill-n">' + outCount + '</span></button>' +
    '<button class="mode-pill ' + (activeMode === 'inbound' ? 'active' : '') + '" onclick="setMode(\'inbound\')">In <span class="mode-pill-n">' + inCount + '</span></button>';

  // View tabs — just two
  document.getElementById('view-tabs').innerHTML =
    '<button class="vtab ' + (activeView === 'experiments' ? 'active' : '') + '" onclick="setView(\'experiments\')">Experiments</button>' +
    '<button class="vtab ' + (activeView === 'weekly' ? 'active' : '') + '" onclick="setView(\'weekly\')">Compare</button>';

  document.getElementById('view-experiments').style.display = activeView === 'experiments' ? 'block' : 'none';
  document.getElementById('view-weekly').style.display = activeView === 'weekly' ? 'block' : 'none';

  if (activeView === 'experiments') {
    renderExperimentsView(exps, modeChannels);
  } else {
    if (typeof renderTimeSeries === 'function') renderTimeSeries();
  }
}

/* ================================================================
   Experiments View
   ================================================================ */

function renderExperimentsView(exps, modeChannels) {
  var el = document.getElementById('view-experiments');
  var modeExps = exps.filter(function(e) { return CH[e.ch] && CH[e.ch].mode === activeMode; });
  var isOut = activeMode === 'outbound';

  // North star
  var total = modeExps.reduce(function(s, e) { return s + expBottomVal(e); }, 0);
  var nsTarget = isOut ? 15 : 30;
  var pct = Math.min(100, Math.round((total / nsTarget) * 100));
  var color = pct >= 100 ? 'var(--hit)' : pct >= 60 ? 'var(--change)' : (isOut ? 'var(--accent)' : 'var(--inbound)');

  var totalRateNum = 0, totalRateDen = 0;
  modeExps.forEach(function(e) {
    if (!e.stages || !e.rateIdx) return;
    totalRateNum += e.stages[e.rateIdx[0]] ? e.stages[e.rateIdx[0]].val : 0;
    totalRateDen += e.stages[e.rateIdx[1]] ? e.stages[e.rateIdx[1]].val : 0;
  });
  var avgRate = totalRateDen > 0 ? ((totalRateNum / totalRateDen) * 100).toFixed(1) + '%' : '—';

  var html = '<div class="ns-row">' +
    '<div class="ns-block"><div class="ns-label">' + (isOut ? 'Signups' : 'Audience gained') + '</div>' +
    '<div class="ns-val-row"><span class="ns-value">' + total + '</span><span class="ns-of">/ ' + nsTarget + '</span></div>' +
    '<div class="ns-track"><div class="ns-fill" style="width:' + pct + '%;background:' + color + '"></div></div></div>' +
    '<div class="ns-block ns-rate-block"><div class="ns-label">Avg ' + (isOut ? 'reply rate' : 'engagement') + '</div>' +
    '<div class="ns-rate-val">' + avgRate + '</div></div></div>';

  // Channel tabs
  var groups = {};
  exps.forEach(function(e) { if (!groups[e.ch]) groups[e.ch] = []; groups[e.ch].push(e); });

  html += '<div class="flow-nav">';
  modeChannels.filter(function(k) { return groups[k]; }).forEach(function(k) {
    var info = CH[k], g = groups[k] || [];
    var keyNum = g.reduce(function(s, e) { return s + expKeyVal(e); }, 0);
    html += '<div class="flow-tab ' + (activeFlow === k ? 'active' : '') + '" onclick="setFlow(\'' + k + '\')">' +
      '<div class="flow-tab-label">' + info.label + '</div>' +
      '<div class="flow-tab-num ' + (keyNum > 0 ? 'has-data' : '') + '">' + keyNum + '</div>' +
      '<div class="flow-tab-count">' + g.length + ' exp' + (g.length !== 1 ? 's' : '') + '</div></div>';
  });
  html += '</div>';

  // Board
  var info = CH[activeFlow];
  if (info) {
    var g = groups[activeFlow] || [];
    var active = g.filter(function(e) { return e.verdict !== 'Stop'; });
    var stopped = g.filter(function(e) { return e.verdict === 'Stop'; });
    html += renderBoard(info, active, stopped);
  }

  el.innerHTML = html;
}

/* ================================================================
   Experiment Board — with health indicators
   ================================================================ */

function renderBoard(info, active, stopped) {
  var html = '<div class="exp-list">';

  active.forEach(function(e) {
    var rate = expRateStr(e);
    var rateNum = expRate(e);
    var hasData = expHasData(e);
    var vCls = verdictCls(e.verdict);

    // Health indicator from benchmarks
    var bm = getBenchmark(e);
    var health = '';
    if (hasData && bm) {
      if (rateNum >= bm.good)       health = '<span class="health health-good" title="Above benchmark">●</span>';
      else if (rateNum >= bm.avg)   health = '<span class="health health-ok" title="At average">●</span>';
      else if (rateNum > 0)         health = '<span class="health health-low" title="Below average">●</span>';
    }

    html += '<div class="exp-item"><div class="exp-row-v2">' +
      '<div class="exp-name" onclick="editName(' + e.id + ',this)">' + health + e.name + '</div>' +
      '<div class="exp-rate">' + rate + '</div>' +
      '<div><span class="verdict ' + vCls + '" onclick="cycleVerdict(' + e.id + ')">' + (e.verdict || '—') + '</span>' +
      '<span class="exp-expand-btn" onclick="toggleExp(' + e.id + ')">&#9662;</span></div></div>';

    // Expanded detail
    html += '<div class="exp-expand-wrap" id="expand-' + e.id + '"><div class="exp-expand-inner"><div class="exp-detail">';

    // AI suggestion inside detail
    if (hasData) {
      var sg = suggestVerdict(e);
      if (sg.verdict) {
        html += '<div class="exp-ai">AI: <strong>' + sg.verdict + '</strong> — ' + sg.reason + '</div>';
      } else if (sg.reason) {
        html += '<div class="exp-ai exp-ai-wait">' + sg.reason + '</div>';
      }
    }

    // Pipeline
    html += '<div class="pipe">';
    e.stages.forEach(function(stg, idx) {
      if (idx > 0) {
        var prev = e.stages[idx - 1].val;
        html += '<div class="pipe-conv">' + (prev > 0 ? ((stg.val / prev) * 100).toFixed(0) + '%' : '—') + '</div>';
      }
      var isKey = e.rateIdx && (idx === e.rateIdx[0] || idx === e.rateIdx[1]);
      html += '<div class="pipe-stage' + (isKey ? ' pipe-stage-key' : '') + '" onclick="event.stopPropagation();editStage(' + e.id + ',' + idx + ',this)">' +
        '<div class="pipe-stage-val">' + formatNum(stg.val) + '</div>' +
        '<div class="pipe-stage-label">' + stg.label + '</div></div>';
    });
    html += '</div>';

    // Fields
    html += '<div class="exp-detail-row">' +
      '<div class="detail-field"><div class="detail-label">Target</div><div class="detail-value editable" onclick="editTarget(' + e.id + ',this)">' + e.target + '</div></div>' +
      '<div class="detail-field"><div class="detail-label">Hours</div><div class="detail-value editable" onclick="editHours(' + e.id + ',this)">' + (e.hours || 0) + 'h</div></div></div>';

    html += '<div class="detail-next"><div class="detail-label">Next step</div>' +
      '<div class="detail-next-text" onclick="event.stopPropagation();editNext(' + e.id + ',this)">' +
      (e.next || '<span class="ph">What to do next...</span>') + '</div></div>';

    // Verdict
    html += '<div class="verdict-group"><span class="verdict-group-label">Verdict</span>' +
      ['Keep going', 'Change variables', 'Close, iterate', 'Stop'].map(function(v) {
        var bc = v === 'Keep going' ? 'keep' : v === 'Change variables' ? 'change' : v === 'Close, iterate' ? 'close' : 'stop';
        return '<div class="vbtn v-' + bc + ' ' + (e.verdict === v ? 'active' : '') + '" onclick="event.stopPropagation();setVerdict(' + e.id + ',\'' + v + '\')">' + v + '</div>';
      }).join('') + '</div>';

    // More + Delete
    html += '<div class="detail-more-toggle" onclick="event.stopPropagation();this.nextElementSibling.classList.toggle(\'open\')">More details</div>' +
      '<div class="detail-more">';
    html += '<div class="detail-field"><div class="detail-label">Tools</div><div class="detail-value editable" onclick="editTools(' + e.id + ',this)">' + (e.tools || '<span class="ph">Add tools...</span>') + '</div></div>';
    html += '<div class="detail-field"><div class="detail-label">Idea</div><div class="detail-value editable" onclick="editIdea(' + e.id + ',this)">' + (e.idea || '<span class="ph">Add idea...</span>') + '</div></div>';
    html += '</div>';

    html += '<div class="detail-danger"><button class="delete-btn" onclick="event.stopPropagation();deleteExp(' + e.id + ')">Delete experiment</button></div>';
    html += '</div></div></div></div>';
  });

  html += '<div class="inline-add-trigger" onclick="inlineAdd()"><span class="inline-add-icon">+</span> New experiment</div>';
  html += '</div>';

  if (stopped.length) {
    html += '<div class="stopped-toggle" onclick="document.getElementById(\'stopped-' + activeFlow + '\').style.display=document.getElementById(\'stopped-' + activeFlow + '\').style.display===\'none\'?\'block\':\'none\'">Stopped &middot; ' + stopped.length + '</div>' +
      '<div id="stopped-' + activeFlow + '" class="stopped-list"><div class="exp-list">' +
      stopped.map(function(e) {
        return '<div class="exp-item"><div class="exp-row-v2"><div class="exp-name">' + e.name + '</div>' +
          '<div class="exp-rate pending">—</div>' +
          '<div style="display:flex;gap:var(--s-6);align-items:center;justify-content:flex-end">' +
          '<button class="delete-btn-sm" onclick="deleteExp(' + e.id + ')">x</button>' +
          '<span class="verdict stop">Stop</span></div></div></div>';
      }).join('') + '</div></div>';
  }

  return html;
}

/* ── Editing ── */
function toggleExp(id) { document.getElementById('expand-' + id).classList.toggle('open'); }

function cycleVerdict(id) {
  var exps = load(), e = exps.find(function(x) { return x.id === id; });
  var opts = ['', 'Keep going', 'Change variables', 'Close, iterate', 'Stop'];
  e.verdict = opts[(opts.indexOf(e.verdict) + 1) % opts.length];
  save(exps); flash(); render();
}

function setVerdict(id, v) {
  var exps = load(); exps.find(function(x) { return x.id === id; }).verdict = v;
  save(exps); flash(); render();
}

function editName(id, el) {
  inlineEdit(el, load().find(function(x) { return x.id === id; }).name, function(val) {
    if (!val.trim()) return;
    var exps = load(); exps.find(function(x) { return x.id === id; }).name = val.trim();
    save(exps); flash(); render();
  }, { type: 'text', label: 'Experiment name' });
}

function editTarget(id, el) {
  var exps = load(), e = exps.find(function(x) { return x.id === id; });
  inlineEdit(el, e.target, function(val) {
    var exps2 = load(), e2 = exps2.find(function(x) { return x.id === id; });
    e2.target = val || 'TBD';
    var match = val.match(/>?\s*(\d+(?:\.\d+)?)\s*%/);
    if (match) e2.targetNum = parseFloat(match[1]) / 100;
    save(exps2); flash(); render();
  }, { type: 'text', label: 'Target' });
}

function editTools(id, el) {
  inlineEdit(el, load().find(function(x) { return x.id === id; }).tools || '', function(val) {
    var exps = load(); exps.find(function(x) { return x.id === id; }).tools = val;
    save(exps); flash(); render();
  }, { type: 'text', label: 'Tools' });
}

function editIdea(id, el) {
  inlineEdit(el, load().find(function(x) { return x.id === id; }).idea || '', function(val) {
    var exps = load(); exps.find(function(x) { return x.id === id; }).idea = val;
    save(exps); flash(); render();
  }, { type: 'text', label: 'Idea' });
}

function deleteExp(id) {
  var exps = load(), e = exps.find(function(x) { return x.id === id; });
  if (!e || !confirm('Delete "' + e.name + '"?')) return;
  save(exps.filter(function(x) { return x.id !== id; })); flash(); render();
}

function editNext(id, el) {
  var exps = load(), e = exps.find(function(x) { return x.id === id; });
  var input = document.createElement('input'); input.type = 'text'; input.value = e.next || '';
  input.placeholder = 'What to do next...';
  el.innerHTML = ''; el.appendChild(input); input.focus();
  function c() { e.next = input.value; save(exps); flash(); render(); }
  input.addEventListener('blur', c);
  input.addEventListener('keydown', function(ev) { if (ev.key === 'Enter') c(); });
}
