# Industrial Fire Detection & Classification System — Project Rules

## Source of Truth & Implementation Roadmap
The file `agent.md` in the project root is the architecture baseline.
The file `.agents/rules/project_evaluation.md` is the **authoritative implementation roadmap and evaluation standard**. Every improvement, gap-closure, and feature enhancement must align with and fulfill the priorities and requirements set in `project_evaluation.md`.

## Core Principles — NEVER violate these
1. **Every architectural decision was made deliberately.** Do not deviate from the tech stack without a documented reason.
2. **Do not add a technology without a clear, justified purpose.** No tech for buzz value.
3. **Do not make a performance or accuracy claim without a measured result.** All metrics must be labeled with how and when they were measured.
4. **₹0 / $0 cost constraint.** The entire stack must run on free-tier infrastructure.
5. **Honesty over impressiveness.** Label everything as built, planned, or simulated. Never present MVP capabilities as production capabilities.

## Tech Stack (locked — do not change without justification)
- **Backend**: Python 3.11+, FastAPI, uvicorn
- **ML**: XGBoost, scikit-learn, SHAP, pandas, geopandas
- **Database**: Supabase (PostgreSQL + PostGIS + Auth + Realtime)
- **Frontend**: Next.js 14 (App Router), Tailwind CSS, shadcn/ui, Leaflet.js (react-leaflet)
- **Infra**: GitHub Actions (cron), Render (backend), Vercel (frontend), Sentry, UptimeRobot

## Classification Labels
`industrial_fire` | `normal_flare` | `agricultural_burn` | `wildfire` | `mining_activity` | `unregistered_anomaly`

## Core Innovation
Deviation-from-baseline (per-site z-score of FRP) is the classification signal, NOT raw temperature thresholds.

## Build Order
Phase 1 (Foundation/Data Pipeline) → Phase 2 (ML/Intelligence) → Phase 3 (Backend API) → Phase 4 (Frontend Dashboard) → Phase 5 (Demo Prep). Do not jump ahead.

## Security From Day One
JWT auth on every route, RBAC, RLS on Supabase tables, full audit trail, Pydantic validation, rate limiting, Sentry error tracking, HTTPS enforced, secrets in `.env` only.
