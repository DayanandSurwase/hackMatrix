# FIN-03 — Financial Policy Discovery, Eligibility & Application Assistant (Frontend)

## Context

The PRD (FIN-03) defines an **evidence-backed scheme-assistance web app**, not a chatbot. Its
signature idea is an inspectable proof chain: **Applicant Fact → Document Evidence → Policy Rule →
Evaluation → Decision → Source**, with three explicit outcomes — **ELIGIBLE / NOT ELIGIBLE /
NEEDS REVIEW** — and a hard rule that uncertain information is never shown as a confirmed decision.

The project is an empty Vite + React 19 + Tailwind v4 scaffold (`src/App.tsx` is a blank div), so
this is a greenfield build with nothing to preserve. The PRD names Next.js + FastAPI; this Figma
Make environment is Vite + React, so we build a **client-side prototype**: in-app routing plus a
typed **mock data layer** that mirrors the PRD's API contract (§13) and data model (§14). Every
component is written so the mock layer can later be swapped for real `fetch` calls without UI
changes.

The product name is intentionally **TBD** — the UI uses a neutral placeholder wordmark
("Scheme Assist — working title") and never hardcodes a final brand name.

## Aesthetic direction

Civic-tech / trustworthy SaaS. Light near-white canvas, dark navy primary text, professional blue
interactive color, restrained cyan accent, neutral grey surfaces. Subtle shadows, clean cards with
modest radius (8–10px), generous spacing. No gradients-as-decoration, no AI/robot imagery, no
glassmorphism. Status is always conveyed by **text + icon + color together**, never color alone.
Font pairing: a humanist sans for UI (e.g. Inter / Source Sans) + a slightly firmer face for
numbers/headings; wired via Google Fonts `@import` at the top of `src/index.css` per AGENTS.md.
Tokens defined once as CSS custom properties in `src/index.css` under Tailwind v4 `@theme`.

## Tech approach

- **Routing:** `react-router` (invoke the `react-router` skill during implementation). Routes map
  1:1 to screens below. App shell = persistent sidebar + top bar around an `<Outlet>`.
- **State:** lightweight — React context for the active case + a `useCase()` hook reading the mock
  layer. Async screens (upload/processing) simulate polling with `setInterval` against a mock job.
- **Mock layer:** `src/lib/mock/` — typed fixtures for the 5–8 pilot schemes (PMEGP as the rich
  anchor per §21), one worked applicant case, evidence facts with sources, rule results, benefit
  calc, document checklist, and review cases. Includes the three canonical outcomes plus a
  borderline/conflicting case so all states are demonstrable.
- **Types:** `src/lib/types.ts` — `Applicant, Document, ExtractedFact, EvidenceSource, Scheme,
  EligibilityRule, RuleResult, Decision, BenefitCalculation, RequiredDocument, ReviewCase,
  ProcessingJob` (fields per PRD §14/§19).

## File structure

```
src/
  App.tsx                      // Router + providers
  index.css                    // fonts, @theme tokens, base
  lib/
    types.ts
    mock/{schemes,case,evidence,reviews,jobs}.ts
    api.ts                     // mock functions shaped like PRD §13 endpoints
    context/CaseContext.tsx
  components/
    layout/{AppShell,Sidebar,TopBar,Breadcrumbs}.tsx
    ui/{Button,Card,Badge,StatusPill,Tabs,Drawer,Modal,Table,
        Dropzone,EmptyState,Skeleton,Alert,Toast}.tsx
    domain/
      DecisionBadge.tsx        // ELIGIBLE / NOT ELIGIBLE / NEEDS REVIEW
      SchemeCard.tsx  RuleCard.tsx  EvidenceCard.tsx  DocumentRow.tsx
      BenefitBreakdown.tsx  ReviewCard.tsx  ConfidenceIndicator.tsx
      EvidenceGraph.tsx        // desktop connected cards / mobile proof timeline
      EvidenceDrawer.tsx       // fact → source → page → snippet
  pages/
    Landing.tsx  SignIn.tsx  Dashboard.tsx
    NewAssessment.tsx  Upload.tsx  Processing.tsx
    ExtractionReview.tsx        // review + correct extracted facts
    SchemeResults.tsx  SchemeDetail.tsx   // tabs: General Info | This Applicant's Evaluation
    NeedsReview.tsx  ApplicationGuidance.tsx  History.tsx  Settings.tsx
```

## Screens & routes (full journey)

| Route | Screen | Core purpose / states |
|---|---|---|
| `/` | Landing | Trust model, "how it works" proof-chain diagram, start CTA |
| `/signin` | Sign-in | Mock auth → dashboard |
| `/dashboard` | Dashboard | Active case, docs uploaded, processing status, schemes found / eligible / not-eligible / needs-review counts, est. benefits, missing docs, recent assessments. Empty + loading states |
| `/assessment/new` | Start Assessment | Case creation intro |
| `/assessment/:id/upload` | Document Upload | Dropzone (PDF/image), multi-file, progress, per-file classification + status; unsupported/corrupt file errors |
| `/assessment/:id/processing` | Processing | Simulated job polling: QUEUED→PROCESSING→COMPLETED/FAILED, per-step, retry on failure |
| `/assessment/:id/extraction` | Extraction Review | Editable fact list (name, age, location, income, category, business/project) each with source doc+page+confidence; confirm/correct before evaluate; LOW_CONFIDENCE + conflict flags |
| `/assessment/:id/schemes` | Scheme Results | Scheme cards: name, ministry, purpose, decision status, benefit preview, missing docs, source freshness. No opaque match %. Filters by status |
| `/assessment/:id/schemes/:sid` | Scheme Detail | **Two clearly separated regions.** Tabs: *General scheme info* (overview, who can apply, conditions, benefit, required docs, process, official source) and *This applicant's evaluation* (rule-by-rule checklist, evidence graph, benefit calc, doc checklist, "why this decision") |
| — (in Scheme Detail) | Rule-by-rule | Each rule row: ✓/✕/⚠ + label; expand → rule text, applicant value, required value, PASS/FAIL/REVIEW, evidence source, official source page, plain-language evaluation ("24 ≥ 18 → PASS") |
| — (in Scheme Detail) | Evidence Graph | Fact→Evidence→Rule→Evaluation→Decision; expandable nodes; source drawer; desktop = connected cards, mobile = vertical proof timeline |
| — (in Scheme Detail) | Benefit | Estimated amount, formula, inputs used, cap, source ref, "estimate" disclaimer; ESTIMATE_UNAVAILABLE state when inputs missing |
| — (in Scheme Detail) | Documents | PRESENT / MISSING / CONFLICTING / LOW_CONFIDENCE / NOT_REQUIRED with reason + upload action |
| `/reviews` | Needs Review | Reason code (MISSING_FACT, CONFLICTING_FACT, LOW_CONFIDENCE, RULE_AMBIGUITY, SOURCE_STALE, UNSUPPORTED_CASE), affected rule, conflicting evidence, docs involved, correction action, status/history. Explicit "Manual review required" language |
| `/assessment/:id/guidance` | Application Guidance | Required + still-missing docs, prep checklist, official process steps, official link, conditions, "does not submit on your behalf" note |
| `/history` | Assessment History | Past cases list |
| `/settings` | Settings / Account | Privacy summary, data handling note |

**Navigation model:** primary sidebar (Dashboard, Assessments/History, Needs Review, Settings);
top bar (case switcher, breadcrumbs, account); workflow steps (upload→processing→extraction→schemes)
as a horizontal stepper; Evidence detail = drawer; confirmations = modal.

## Signature interaction (build first, make it excellent)

The Evidence Graph + rule drill-down is the flagship. Implement `EvidenceGraph` and
`EvidenceDrawer` early against the PMEGP mock case so the proof chain
(Age=24 → Aadhaar p.1 → age≥18 → PASS → contributes to ELIGIBLE) is fully clickable on desktop and
collapses to a readable vertical timeline on mobile.

## Decision-state safety (non-negotiable UI rules)

- `DecisionBadge` renders only the three PRD states; NEEDS REVIEW is visually distinct (amber) and
  never styled to look like a pass.
- Never show a benefit number when inputs are missing — show ESTIMATE_UNAVAILABLE.
- Wording is source-grounded: "Eligibility determined from the verified rule set using the evidence
  shown below," never "AI says you're eligible."
- Every decisive rule result exposes its source document + page + last-verified date.

## Responsive strategy

Dashboard grid → stacked cards; scheme results multi-column → stacked; rule table/card hybrid →
expandable rule cards; evidence graph connected → vertical timeline; sidebar → collapsible/drawer on
mobile. Relative units + `clamp()`, flex/grid `auto-fit minmax`.

## Accessibility

WCAG-conscious navy-on-white contrast, visible focus rings, semantic landmarks, labelled form
fields, status by text+icon+color, keyboard-navigable tabs/drawers/expanders, accessible tables.

## Error / edge states (explicitly built)

Unsupported file, corrupt PDF, OCR/extraction failure, missing required field, conflicting docs,
scheme/source unavailable, rule-not-verified, benefit-uncalculable, backend timeout, stuck job,
auth failure, network failure — each with a safe message and, where relevant, retry. No false
success states.

## Implementation order

1. Tokens + fonts in `index.css`; `App.tsx` router + `AppShell`.
2. `types.ts` + mock layer + `api.ts` + `CaseContext`.
3. Core UI primitives (Button, Card, Badge, StatusPill, Tabs, Drawer, Table, Dropzone, EmptyState, Skeleton, Alert).
4. Dashboard + Scheme Results (surface the whole picture early).
5. **Scheme Detail: rule-by-rule + Evidence Graph + Evidence Drawer** (flagship).
6. Upload → Processing → Extraction Review flow (async/polling states).
7. Benefit, Documents, Needs Review, Application Guidance.
8. Landing, Sign-in, History, Settings.
9. Responsive passes + edge/error states + a11y sweep.

## Design risks / open decisions

- **Next.js vs Vite:** environment is Vite; APIs are shaped like the PRD contract so a later
  Next.js port is mechanical. (Assumption — flag if a true Next.js repo is required instead.)
- **Product name** stays a placeholder wordmark until finalized.
- **Real backend** is out of scope for this pass; all data is mock but contract-accurate.

## Verification

Dev server is already running on `$PORT`; verify hot-reload renders each route. Walk the demo path
from PRD §25: dashboard → new assessment → upload → processing → extraction → schemes → open PMEGP
→ rule-by-rule → click a rule → evidence drawer → benefit + missing docs → toggle a boundary
input/remove a doc and watch the decision transition to NOT ELIGIBLE / NEEDS REVIEW → finish on
guidance. Check mobile widths for the evidence timeline and stacked layouts.
