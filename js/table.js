/* ========================================
   GTM Hypothesis Dashboard — Table Module
   ======================================== */

function getStatusBadge(status) {
  return `<span class="status ${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
}

function getSignalBadge(signal) {
  if (!signal) return '';
  const labels = {
    yes: 'YES',
    weak: 'WEAK',
    early: 'TOO EARLY',
    no: 'NO',
  };
  return `<span class="signal ${signal}">${labels[signal] || signal}</span>`;
}

function getPillarTag(pillar) {
  if (!pillar) return '';
  const parts = pillar.split('+').map(p => p.trim());
  return parts.map(p => {
    const cls = p.toLowerCase();
    return `<span class="pillar-tag ${cls}">${p}</span>`;
  }).join(' ');
}

function formatValue(val, prefix, suffix) {
  if (val === null || val === undefined) return '—';
  return (prefix || '') + val.toLocaleString() + (suffix || '');
}

/**
 * Render the experiment table into a container element
 */
function renderTable(containerId, experiments) {
  const container = document.getElementById(containerId);

  const thead = `
    <tr>
      <th>Experiment</th>
      <th>Channel</th>
      <th>Pillar</th>
      <th>Wk</th>
      <th>Status</th>
      <th>Sent</th>
      <th>Responses</th>
      <th>Demos</th>
      <th>Cost</th>
      <th>Resp %</th>
      <th>$/Demo</th>
      <th>Signal</th>
      <th>Verdict</th>
    </tr>
  `;

  const rows = experiments.map(e => {
    const isQueued = e.status === 'queued';
    const rowClass = isQueued ? 'class="queued"' : '';

    return `
      <tr ${rowClass}>
        <td>
          <strong>${e.name}</strong>
          ${e.variant ? `<br><span class="week-label">${e.variant}</span>` : ''}
        </td>
        <td>${e.channel}</td>
        <td>${getPillarTag(e.pillar)}</td>
        <td>W${e.week}</td>
        <td>${getStatusBadge(e.status)}</td>
        <td>${formatValue(e.sent)}</td>
        <td>${formatValue(e.responses)}</td>
        <td>${formatValue(e.demos)}</td>
        <td>${formatValue(e.cost, '$')}</td>
        <td>${e.responseRate !== null ? formatValue(e.responseRate, '', '%') : '—'}</td>
        <td>${e.costPerDemo !== null ? formatValue(e.costPerDemo, '$') : '—'}</td>
        <td>${getSignalBadge(e.signal)}</td>
        <td class="verdict">${e.verdict || ''}</td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <table>
      <thead>${thead}</thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

export { renderTable };
