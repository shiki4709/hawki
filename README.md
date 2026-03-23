# GTM Hypothesis Dashboard

A modular, data-driven dashboard for tracking B2B GTM hypothesis experiments. Plug in any company, any ICP, any channel mix. Built on the [ColdIQ compounding flywheel](https://coldiq.com) framework: signal-based outbound → content trust layer → inbound that converts.

## Structure

```
gtm-hypothesis-dashboard/
├── index.html              # Dashboard shell — no logic, no data
├── css/
│   └── styles.css          # All styling — metric cards, tables, charts, responsive
├── js/
│   ├── app.js              # Entry point — loads data, wires modules together
│   ├── charts.js           # Chart rendering (response rate, cost/demo, channel breakdown)
│   ├── table.js            # Experiment table rendering + status/signal badges
│   └── metrics.js          # KPI computation + metric card rendering
└── data/
    └── experiments.json    # ALL dashboard data — edit this file to update the dashboard
```

## Quickstart — use for any company

1. Fork this repo
2. Edit `data/experiments.json` — change `company`, `operator`, and replace the sample experiments with yours
3. Open `index.html` in a browser — done
4. Deploy: drag the folder to [Netlify Drop](https://app.netlify.com/drop) for a live URL

The dashboard is fully driven by `experiments.json`. No code changes needed to switch companies, channels, or experiments.

## How to use

1. **Update experiments:** Edit `data/experiments.json` — add experiments, update statuses, fill in results
2. **View dashboard:** Open `index.html` in a browser (or serve with any static server)
3. **Deploy:** Drag the entire folder to [Netlify Drop](https://app.netlify.com/drop) for a live URL

## Data format

The dashboard reads from a single `experiments.json` file:

```json
{
  "meta": { "company": "...", "week": 1, "weekOf": "2026-03-24", "operator": "..." },
  "summary": { "ideasReceived": 14, ... },
  "insight": { "title": "...", "body": "...", "recommendation": "..." },
  "experiments": [
    {
      "id": 1,
      "name": "Experiment name",
      "variant": "A/B variant description",
      "channel": "Outbound | Social | Events | Product-Led",
      "pillar": "P1 | P2 | P3 | P1+P2",
      "week": 1,
      "status": "done | running | queued",
      "sent": 200,
      "responses": 42,
      "demos": 7,
      "cost": 0,
      "responseRate": 21.0,
      "costPerDemo": 0,
      "signal": "yes | weak | early | no",
      "verdict": "What to do next"
    }
  ]
}
```

## Modules

| Module | Responsibility |
|--------|---------------|
| `app.js` | Loads data, initializes all modules |
| `charts.js` | Three chart types: response rate bar, cost/demo bar, channel doughnut |
| `table.js` | Experiment table with status badges, signal indicators, pillar tags |
| `metrics.js` | Computes KPIs from raw data, renders metric cards |
| `styles.css` | Full styling — responsive, dark-mode ready structure |

## Flywheel pillars

- **P1: Signal-based outbound** — Clay signals, LinkedIn automation, post-engager lists, referral post DMs
- **P2: Content trust layer** — Social listening replies, helpful content, event presence
- **P3: Inbound that converts** — Product-led, churned user re-engagement, docs, SEO

## Future: Automation path

The modular architecture supports progressive automation:

1. **Manual (now):** Operator edits `experiments.json` weekly → dashboard updates
2. **Semi-auto:** GTM bot outputs structured JSON → operator pastes into data file
3. **Full auto:** Bot writes directly to `experiments.json` via API → dashboard is always live

## License

MIT
