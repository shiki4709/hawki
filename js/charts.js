/* ========================================
   Nevara GTM Dashboard — Chart Module
   ======================================== */

const COLORS = {
  green: '#059669',
  blue: '#3b82f6',
  yellow: '#d97706',
  gray: '#6b7280',
  purple: '#8b5cf6',
};

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: '#f3f4f6' },
    },
    x: {
      grid: { display: false },
      ticks: { font: { size: 10 } },
    },
  },
};

function getSignalColor(signal) {
  if (signal === 'yes') return COLORS.green;
  if (signal === 'weak') return COLORS.yellow;
  if (signal === 'early') return COLORS.gray;
  return COLORS.gray;
}

/**
 * Render response rate bar chart from completed experiments
 */
function renderResponseRateChart(canvasId, experiments) {
  const completed = experiments
    .filter(e => e.status === 'done' || e.status === 'running')
    .filter(e => e.responseRate !== null)
    .sort((a, b) => b.responseRate - a.responseRate);

  const labels = completed.map(e => {
    const name = e.name.length > 20 ? e.name.slice(0, 20) + '...' : e.name;
    return e.variant ? `${name}\n(${e.variant.slice(0, 25)})` : name;
  });

  const data = completed.map(e => e.responseRate);
  const colors = completed.map(e => getSignalColor(e.signal));

  new Chart(document.getElementById(canvasId), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Response Rate',
        data,
        backgroundColor: colors,
        borderRadius: 6,
      }],
    },
    options: {
      ...CHART_DEFAULTS,
      scales: {
        ...CHART_DEFAULTS.scales,
        y: {
          ...CHART_DEFAULTS.scales.y,
          ticks: { callback: v => v + '%' },
        },
      },
    },
  });
}

/**
 * Render cost per demo bar chart from completed experiments with demos
 */
function renderCostPerDemoChart(canvasId, experiments) {
  const withDemos = experiments
    .filter(e => e.status === 'done' && e.demos > 0)
    .sort((a, b) => a.costPerDemo - b.costPerDemo);

  const labels = withDemos.map(e => {
    const name = e.name.length > 20 ? e.name.slice(0, 20) + '...' : e.name;
    return e.variant ? `${name}\n(${e.variant.slice(0, 25)})` : name;
  });

  const data = withDemos.map(e => e.costPerDemo);
  const colors = withDemos.map(e =>
    e.costPerDemo === 0 ? COLORS.green : COLORS.blue
  );

  new Chart(document.getElementById(canvasId), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Cost per Demo',
        data,
        backgroundColor: colors,
        borderRadius: 6,
      }],
    },
    options: {
      ...CHART_DEFAULTS,
      scales: {
        ...CHART_DEFAULTS.scales,
        y: {
          ...CHART_DEFAULTS.scales.y,
          ticks: { callback: v => '$' + v },
        },
      },
    },
  });
}

/**
 * Render channel breakdown doughnut chart
 */
function renderChannelBreakdown(canvasId, experiments) {
  const channelMap = {};
  for (const e of experiments) {
    if (!channelMap[e.channel]) {
      channelMap[e.channel] = { count: 0, demos: 0 };
    }
    channelMap[e.channel].count++;
    channelMap[e.channel].demos += e.demos || 0;
  }

  const labels = Object.keys(channelMap);
  const data = labels.map(c => channelMap[c].count);
  const colorMap = {
    Outbound: COLORS.blue,
    Social: COLORS.green,
    Events: COLORS.yellow,
    'Product-Led': COLORS.purple,
  };
  const colors = labels.map(c => colorMap[c] || COLORS.gray);

  new Chart(document.getElementById(canvasId), {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderWidth: 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { size: 11 }, padding: 12 },
        },
      },
    },
  });
}

export {
  renderResponseRateChart,
  renderCostPerDemoChart,
  renderChannelBreakdown,
};
