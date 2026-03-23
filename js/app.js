/* ========================================
   Nevara GTM Dashboard — App Entry Point
   ======================================== */

import { renderResponseRateChart, renderCostPerDemoChart, renderChannelBreakdown } from './charts.js';
import { renderTable } from './table.js';
import { computeMetrics, renderMetrics } from './metrics.js';

async function loadData() {
  const res = await fetch('./data/experiments.json');
  return res.json();
}

function renderInsight(containerId, insight) {
  const container = document.getElementById(containerId);
  container.innerHTML = `
    <div class="insight-box">
      <h3>${insight.title}</h3>
      <p><strong>${insight.body}</strong></p>
      <p style="margin-top: 8px;"><strong>Recommendation:</strong> ${insight.recommendation}</p>
    </div>
  `;
}

async function init() {
  const data = await loadData();
  const { meta, summary, insight, experiments } = data;

  // Header
  document.getElementById('header-title').textContent = `${meta.company} GTM Experiments`;
  document.getElementById('header-subtitle').textContent =
    `Week ${meta.week} Dashboard — ${meta.weekOf} — Operated by ${meta.operator}`;

  // Metrics
  const metrics = computeMetrics(summary, experiments);
  renderMetrics('metrics', metrics);

  // Charts
  renderResponseRateChart('responseRateChart', experiments);
  renderCostPerDemoChart('costPerDemoChart', experiments);
  renderChannelBreakdown('channelBreakdownChart', experiments);

  // Table
  renderTable('experiment-table', experiments);

  // Insight
  renderInsight('insight', insight);
}

init();
