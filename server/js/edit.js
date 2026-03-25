/* ================================================================
   Edit — Shared inline number editing (replaces all prompt() calls)

   Usage: inlineEdit(element, currentValue, onSave)
   - Transforms the element into an input in-place
   - Pre-selects the value for quick overwrite
   - Enter/blur saves, Escape cancels
   - +/- stepper buttons for quick increments
   ================================================================ */

function inlineEdit(el, currentVal, onSave, opts) {
  opts = opts || {};
  var isNum = opts.type !== 'text';
  var label = opts.label || '';

  // Prevent double-editing
  if (el.querySelector('.ie-wrap')) return;

  var originalHTML = el.innerHTML;
  var originalVal = currentVal;

  var wrap = document.createElement('div');
  wrap.className = 'ie-wrap';
  wrap.onclick = function(e) { e.stopPropagation(); };

  if (label) {
    var labelEl = document.createElement('div');
    labelEl.className = 'ie-label';
    labelEl.textContent = label;
    wrap.appendChild(labelEl);
  }

  // Tracking hint
  if (opts.hint) {
    var hintEl = document.createElement('div');
    hintEl.className = 'ie-hint';
    hintEl.textContent = opts.hint;
    wrap.appendChild(hintEl);
  }

  var row = document.createElement('div');
  row.className = 'ie-row';

  if (isNum) {
    // Minus button
    var minus = document.createElement('button');
    minus.className = 'ie-step ie-minus';
    minus.textContent = '−';
    minus.onclick = function(e) {
      e.stopPropagation();
      var v = parseInt(input.value) || 0;
      if (v > 0) { input.value = v - 1; input.focus(); }
    };
    row.appendChild(minus);
  }

  var input = document.createElement('input');
  input.type = isNum ? 'number' : 'text';
  input.className = 'ie-input' + (isNum ? ' ie-input-num' : ' ie-input-text');
  input.value = currentVal;
  if (isNum) { input.min = '0'; input.step = '1'; }
  if (opts.placeholder) input.placeholder = opts.placeholder;
  row.appendChild(input);

  if (isNum) {
    // Plus button
    var plus = document.createElement('button');
    plus.className = 'ie-step ie-plus';
    plus.textContent = '+';
    plus.onclick = function(e) {
      e.stopPropagation();
      var v = parseInt(input.value) || 0;
      input.value = v + 1;
      input.focus();
    };
    row.appendChild(plus);
  }

  wrap.appendChild(row);


  // Save/cancel row
  var actions = document.createElement('div');
  actions.className = 'ie-actions';

  var saveBtn = document.createElement('button');
  saveBtn.className = 'ie-save';
  saveBtn.textContent = 'Save';
  saveBtn.onclick = function(e) { e.stopPropagation(); doSave(); };

  var cancelBtn = document.createElement('button');
  cancelBtn.className = 'ie-cancel';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.onclick = function(e) { e.stopPropagation(); doCancel(); };

  actions.appendChild(cancelBtn);
  actions.appendChild(saveBtn);
  wrap.appendChild(actions);

  el.innerHTML = '';
  el.appendChild(wrap);

  // Focus and select
  setTimeout(function() { input.focus(); input.select(); }, 30);

  function doSave() {
    var val = isNum ? (parseInt(input.value) || 0) : input.value;
    onSave(val);
  }

  function doCancel() {
    el.innerHTML = originalHTML;
  }

  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { e.preventDefault(); doSave(); }
    if (e.key === 'Escape') { e.preventDefault(); doCancel(); }
  });
}

/* editVarStage is in board.js — these old functions are removed */
