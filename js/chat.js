/* ================================================================
   Quick Add — Inline + panel experiment creation
   ================================================================ */

/* --- Inline add --- */
function inlineAdd() {
  var existing = document.getElementById('inline-add-row');
  if (existing) { existing.querySelector('input').focus(); return; }
  var list = document.querySelector('.exp-list');
  if (!list) return;
  var row = document.createElement('div');
  row.id = 'inline-add-row'; row.className = 'inline-add';
  row.innerHTML = '<input type="text" class="inline-add-input" placeholder="Experiment name..." onkeydown="inlineAddKey(event)" autofocus>' +
    '<button class="inline-add-cancel" onclick="inlineAddCancel()">Esc</button>';
  list.appendChild(row);
  setTimeout(function() { row.querySelector('input').focus(); }, 50);
}

function inlineAddKey(e) {
  if (e.key === 'Enter') { var n = e.target.value.trim(); if (n) { createExperiment(n, Object.keys(CH)[0]); } inlineAddCancel(); }
  if (e.key === 'Escape') inlineAddCancel();
}

function inlineAddCancel() { var r = document.getElementById('inline-add-row'); if (r) r.remove(); }

/* --- Quick-add panel --- */
var qaOpen = false;
var qaChannel = null;

function openModal() {
  if (qaOpen) { closeModal(); return; }
  qaOpen = true;

  var outChannels = Object.entries(CH).filter(function(p) { return p[1].mode === 'outbound'; });
  var inChannels = Object.entries(CH).filter(function(p) { return p[1].mode === 'inbound'; });
  // Default to first channel of current mode
  qaChannel = qaChannel || (activeMode === 'outbound' ? outChannels[0][0] : inChannels[0][0]);

  document.getElementById('modal').classList.add('open');
  document.querySelector('.chat').innerHTML =
    '<div class="qa-panel"><div class="qa-header"><h2 class="qa-title">New Experiment</h2>' +
    '<button class="chat-close" onclick="closeModal()">&times;</button></div>' +
    '<div class="qa-body">' +
    '<div class="qa-field"><label class="qa-label">Name</label>' +
    '<input type="text" class="qa-input" id="qa-name" placeholder="What are you testing?" onkeydown="if(event.key===\'Enter\')qaSubmit()"></div>' +
    '<div class="qa-field"><label class="qa-label">Channel</label>' +
    '<div class="qa-mode-label">Outbound</div><div class="qa-chips">' +
    outChannels.map(function(p) {
      return '<button class="qa-chip ' + (p[0] === qaChannel ? 'active' : '') + '" onclick="qaPickChannel(\'' + p[0] + '\')" style="--chip-color:' + p[1].color + '">' +
        '<span class="qa-chip-dot" style="background:' + p[1].color + '"></span>' + p[1].label + '</button>';
    }).join('') + '</div>' +
    '<div class="qa-mode-label" style="margin-top:var(--s-8)">Inbound</div><div class="qa-chips">' +
    inChannels.map(function(p) {
      return '<button class="qa-chip ' + (p[0] === qaChannel ? 'active' : '') + '" onclick="qaPickChannel(\'' + p[0] + '\')" style="--chip-color:' + p[1].color + '">' +
        '<span class="qa-chip-dot" style="background:' + p[1].color + '"></span>' + p[1].label + '</button>';
    }).join('') + '</div></div>' +
    '<div class="qa-field"><label class="qa-label">What is it?</label>' +
    '<input type="text" class="qa-input qa-input-sm" id="qa-idea" placeholder="One line description"></div>' +
    '</div><div class="qa-footer"><button class="qa-cancel" onclick="closeModal()">Cancel</button>' +
    '<button class="qa-submit" onclick="qaSubmit()">Add to Sprint</button></div></div>';

  setTimeout(function() { var n = document.getElementById('qa-name'); if (n) n.focus(); }, 100);
}

function closeModal() {
  qaOpen = false;
  qaChannel = null;
  document.getElementById('modal').classList.remove('open');
}

function qaPickChannel(ch) {
  qaChannel = ch;
  document.querySelectorAll('.qa-chip').forEach(function(c) { c.classList.remove('active'); });
  var t = document.querySelector('.qa-chip[onclick*="' + ch + '"]');
  if (t) t.classList.add('active');
}

function qaSuggestTarget() {
  var name = document.getElementById('qa-name').value.trim();
  var idea = document.getElementById('qa-idea').value.trim();
  var ch = qaChannel || Object.keys(CH)[0];
  var info = CH[ch];
  var key = getAIKey();

  if (!key) { showToast('Set API key in Settings first'); return; }
  if (!name) { document.getElementById('qa-name').focus(); return; }

  var btn = document.getElementById('qa-ai-btn');
  if (btn) { btn.textContent = '...'; btn.disabled = true; }

  var prompt = 'You are a B2B SaaS GTM expert. Suggest a target metric for this experiment.\n\n' +
    'Experiment: ' + name + '\n' +
    'Channel: ' + (info ? info.label : ch) + ' (' + (info ? info.mode : 'outbound') + ')\n' +
    'Key metric: ' + (info ? info.metric : 'rate') + '\n' +
    (idea ? 'Idea: ' + idea + '\n' : '') +
    '\nRespond with ONLY a JSON object (no markdown):\n' +
    '{"target": "<target string like >15% reply rate>", "reasoning": "<1 sentence why>"}';

  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'https://api.anthropic.com/v1/messages');
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('x-api-key', key);
  xhr.setRequestHeader('anthropic-version', '2023-06-01');
  xhr.setRequestHeader('anthropic-dangerous-direct-browser-access', 'true');

  xhr.onload = function() {
    if (btn) { btn.textContent = 'AI'; btn.disabled = false; }
    if (xhr.status === 200) {
      try {
        var resp = JSON.parse(xhr.responseText);
        var text = resp.content[0].text;
        var json = JSON.parse(text.match(/\{[\s\S]*\}/)[0]);
        var targetInput = document.getElementById('qa-target');
        if (targetInput) targetInput.value = json.target;
        var hint = document.getElementById('qa-target-hint');
        if (hint) hint.textContent = json.reasoning;
      } catch (err) {
        showToast('Could not parse AI response');
      }
    } else {
      showToast('API error: ' + xhr.status);
    }
  };
  xhr.onerror = function() {
    if (btn) { btn.textContent = 'AI'; btn.disabled = false; }
    showToast('Network error');
  };

  xhr.send(JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 150,
    messages: [{ role: 'user', content: prompt }]
  }));
}

function qaSubmit() {
  var name = document.getElementById('qa-name').value.trim();
  if (!name) { document.getElementById('qa-name').focus(); return; }
  var idea = document.getElementById('qa-idea').value.trim();
  var ch = qaChannel || Object.keys(CH)[0];
  createExperiment(name, ch, null, null, idea, '');
  closeModal();
}

/* --- Sprint editor --- */
function editSprint() {
  var sp = loadSprint();
  document.getElementById('modal').classList.add('open');
  qaOpen = true;
  document.querySelector('.chat').innerHTML =
    '<div class="qa-panel"><div class="qa-header"><h2 class="qa-title">Sprint Settings</h2>' +
    '<button class="chat-close" onclick="closeModal()">&times;</button></div>' +
    '<div class="qa-body">' +
    '<div class="qa-field"><label class="qa-label">Sprint Name</label>' +
    '<input type="text" class="qa-input qa-input-sm" id="sp-name" value="' + sp.name + '"></div>' +
    '<div class="qa-field"><label class="qa-label">Start Date</label>' +
    '<input type="text" class="qa-input qa-input-sm" id="sp-start" value="' + sp.start + '" placeholder="e.g. Mar 24"></div>' +
    '<div class="qa-field"><label class="qa-label">End Date</label>' +
    '<input type="text" class="qa-input qa-input-sm" id="sp-end" value="' + sp.end + '" placeholder="e.g. Apr 7"></div>' +
    '<div class="qa-field"><label class="qa-label">Year</label>' +
    '<input type="text" class="qa-input qa-input-sm" id="sp-year" value="' + sp.year + '"></div>' +
    '</div><div class="qa-footer"><button class="qa-cancel" onclick="closeModal()">Cancel</button>' +
    '<button class="qa-submit" onclick="saveSprint({name:document.getElementById(\'sp-name\').value,start:document.getElementById(\'sp-start\').value,end:document.getElementById(\'sp-end\').value,year:document.getElementById(\'sp-year\').value});closeModal();render()">Save</button></div></div>';
}

/* --- Settings panel --- */
function openSettings() {
  var key = getAIKey();
  var masked = key ? key.slice(0, 8) + '...' + key.slice(-4) : '';

  qaOpen = true;
  document.getElementById('modal').classList.add('open');
  document.querySelector('.chat').innerHTML =
    '<div class="qa-panel"><div class="qa-header"><h2 class="qa-title">Settings</h2>' +
    '<button class="chat-close" onclick="closeModal()">&times;</button></div>' +
    '<div class="qa-body">' +
    '<div class="qa-field"><label class="qa-label">Anthropic API Key</label>' +
    '<input type="password" class="qa-input qa-input-sm" id="settings-key" placeholder="sk-ant-..." value="' + key + '">' +
    '<div style="font-size:var(--fs-xs);color:var(--text-4);margin-top:var(--s-4)">Used to generate AI benchmarks for experiments. Key is stored locally in your browser only.' +
    (masked ? ' Current: ' + masked : '') + '</div></div>' +
    '<div class="qa-field"><label class="qa-label">AI Benchmarks</label>' +
    '<div style="display:flex;gap:var(--s-8);flex-wrap:wrap">' +
    '<button class="td-action-btn" onclick="runGenAll()" id="gen-all-btn">Generate benchmarks for all experiments</button>' +
    '<button class="td-edit-btn" onclick="clearAllBenchmarks()">Reset to defaults</button></div>' +
    '<div style="font-size:var(--fs-xs);color:var(--text-4);margin-top:var(--s-4)" id="gen-status">Uses Claude Haiku to analyze each experiment and suggest appropriate benchmarks.</div></div>' +
    '</div><div class="qa-footer"><button class="qa-submit" onclick="saveSettings()">Save</button></div></div>';
}

function saveSettings() {
  var key = document.getElementById('settings-key').value.trim();
  setAIKey(key);
  flash();
  closeModal();
}

function runGenAll() {
  var btn = document.getElementById('gen-all-btn');
  var status = document.getElementById('gen-status');
  if (btn) btn.textContent = 'Generating...';
  if (status) status.textContent = 'Calling Claude Haiku for each experiment...';

  generateAllBenchmarks(function() {
    if (btn) btn.textContent = 'Done!';
    if (status) status.textContent = 'Benchmarks generated. Close settings to see suggestions.';
    render();
  });
}

function clearAllBenchmarks() {
  localStorage.removeItem(BM_KEY);
  flash();
  render();
  var status = document.getElementById('gen-status');
  if (status) status.textContent = 'Reset to channel defaults.';
}

/* --- Shared creation --- */
function createExperiment(name, ch, target, targetNum, idea, tools) {
  var exps = load();
  var id = exps.reduce(function(m, e) { return Math.max(m, e.id); }, 0) + 1;
  var now = new Date();
  var info = CH[ch];

  // Default target
  if (!target && info) {
    var defs = {
      li_outreach: '>20% reply rate', lead_lists: '>15% reply rate',
      warm_intros: '>40% meeting rate', gifts: '>35% response rate',
      email: '>30% click rate', events: '>10% conv-to-signup',
      li_content: '>3% engagement', twitter: '>2% engagement',
      reddit: '>10% upvote rate', content_seo: '>2% visit-to-signup',
      product: '>10% activation'
    };
    target = defs[ch] || 'TBD';
  }

  if (!targetNum) {
    var match = (target || '').match(/>?\s*(\d+(?:\.\d+)?)\s*%/);
    if (match) targetNum = parseFloat(match[1]) / 100;
  }

  // Build stages from channel defaults
  var stages = (info ? info.defaultStages : ['Input', 'Output', 'Result']).map(function(label) {
    return { label: label, val: 0 };
  });

  var varId = id + 'a';
  exps.push({
    id: id, ch: ch, name: name,
    idea: idea || '', tools: tools || '',
    variations: [{
      id: varId,
      name: 'Initial',
      stages: stages,
      rateIdx: info ? info.rateIdx : [1, 0],
      started: MONTHS[now.getMonth()] + ' ' + now.getDate(),
      verdict: '',
      next: ''
    }]
  });

  save(exps); flash();
  if (info) activeMode = info.mode;
  render();
}
