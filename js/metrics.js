/* ========================================
   GTM Hypothesis Dashboard — Metrics Module
   ======================================== */

/**
 * Compute derived metrics from summary and experiment data
 */
function computeMetrics(summary, experiments) {
  const completed = experiments.filter(e => e.status === 'done');
  const totalDemos = completed.reduce((sum, e) => sum + (e.demos || 0), 0);
  const totalCost = completed.reduce((sum, e) => sum + (e.cost || 0), 0);
  const costPerDemo = totalDemos > 0 ? (totalCost / totalDemos).toFixed(2) : 0;

  const signalYes = experiments.filter(e => e.signal === 'yes').length;
  const signalWeak = experiments.filter(e => e.signal === 'weak').length;

  return {
    ideasReceived: summary.ideasReceived,
    experimentsRun: experiments.filter(e => e.status !== 'queued').length,
    signalsReceived: signalYes + signalWeak,
    signalBreakdown: `${signalYes} yes, ${signalWeak} weak`,
    demosBooked: totalDemos,
    totalCost: totalCost,
    costPerDemo: costPerDemo,
  };
}

/**
 * Render metric cards into the container
 */
function renderMetrics(containerId, metrics) {
  const container = document.getElementById(containerId);

  const cards = [
    {
      label: 'Ideas Received',
      value: metrics.ideasReceived,
      change: 'From Maruthi',
      changeClass: 'neutral',
    },
    {
      label: 'Experiments Run',
      value: metrics.experimentsRun,
      change: `W${1}: ${metrics.experimentsRun} active`,
      changeClass: 'neutral',
    },
    {
      label: 'Signals Received',
      value: metrics.signalsReceived,
      change: metrics.signalBreakdown,
      changeClass: 'positive',
    },
    {
      label: 'Demos Booked',
      value: metrics.demosBooked,
      change: '$0 ad spend',
      changeClass: 'positive',
    },
    {
      label: 'Total Cost',
      value: '$' + metrics.totalCost,
      change: `$${metrics.costPerDemo}/demo`,
      changeClass: 'positive',
    },
  ];

  container.innerHTML = cards.map(c => `
    <div class="metric-card">
      <div class="label">${c.label}</div>
      <div class="value">${c.value}</div>
      <div class="change ${c.changeClass}">${c.change}</div>
    </div>
  `).join('');
}

export { computeMetrics, renderMetrics };
