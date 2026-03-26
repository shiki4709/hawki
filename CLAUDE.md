# Syval — Shared Context for All Agents

Copy this file into each Syval repo's CLAUDE.md (or append to existing).

---

## What is Syval?

Syval is a **second brain for GTM**. Three AI agents form a learning loop that gets smarter about your market every cycle.

## The Loop

```
Foxxi posts content → Hawki scrapes engagers → filters to ICP → drafts DMs →
You send DMs → Pingi detects replies via Gmail → Second brain learns what worked →
Loop restarts smarter
```

## Repos & Roles

| Repo | Agent | Role in the loop | Deploy URL |
|------|-------|-----------------|------------|
| `shiki4709/hawki` | Hawki | LinkedIn lead scraping, ICP filtering, DM drafting | hawki-sigma.vercel.app |
| `shiki4709/pingi-ai` | Pingi | X reply automation, Gmail reply detection, conversation tracking | pingi-ai.vercel.app |
| `shiki4709/foxxi` | Foxxi | Content generation + publishing (LinkedIn, X, Substack, RedNote) | foxxi-azure.vercel.app |
| `shiki4709/syval-landing` | — | Landing page + roadmap + design system | syvalapp.com |

## Shared Backend

All agents share one Supabase project with these tables:

- `sb_users` — user profiles + ICP config
- `sb_scrapes` — scrape history with post metadata + topic tags
- `sb_leads` — leads with full lifecycle status (scraped → icp → drafted → sent → replied → converted)
- `sb_replies` — reply detection records matched to leads
- `sb_posts` — content published by Foxxi, tracked for inbound lead attribution
- `sb_insights` — the "brain" — learned patterns with confidence scores (topic performance, ICP patterns, DM effectiveness, timing signals)

Schema defined in: `syval-landing/ROADMAP-SPRINTS.md`

## Current Phase

**Phase 1: Hawki works for Maruthi (Nevara)**
- Goal: Maruthi pastes a LinkedIn post URL, gets ICP-filtered leads with draft DMs, daily, without help
- Key work: Supabase backend replacing localStorage, Apify reliability fixes, user separation
- Success: Maruthi uses Hawki 3x/week for 2 weeks without messaging the founder

## Design System

- **Colors**: Blue (#2196F3) → Orange (#FF8A65) gradient
- **Fonts**: Space Grotesk (headings), DM Sans (body)
- **CSS variables**: See `syval-landing/DESIGN-SYSTEM.md`

## Rules for All Repos

1. **Every data write should feed the second brain.** When storing a scrape, include the topic tag. When storing a lead, include the source post. When tracking a DM, record the angle used. This accumulated data IS the product.
2. **Shared Supabase tables use `sb_` prefix** to distinguish from repo-specific tables (e.g., Pingi's existing `reply_items` table).
3. **All queries must be scoped to `user_id`** — multi-tenant from day one.
4. **Don't build what another agent owns.** Hawki does LinkedIn scraping. Pingi does reply detection. Foxxi does content generation. If you need cross-agent data, read from the shared tables.
5. **Roadmap is the source of truth.** Check `syval-landing/ROADMAP-SPRINTS.md` for current tasks, priorities, and acceptance criteria before starting work.
