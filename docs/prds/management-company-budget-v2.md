# PRD: Management Company Budget Tool v2

## Overview

**Tool Name**: Management Company Budget Calculator
**Purpose**: Help fund managers plan operational budgets and forecast cash runway
**Target Users**: Emerging managers, CFOs, COOs at PE/VC/Credit/RE/Infrastructure funds
**Current State**: 31 files, 1,477-line main component, Frankensteined architecture
**Goal**: Complete rebuild with unified architecture, cleaner UX, same features

---

## Problem Statement

Fund management companies need to plan their operational budgets before launching or during operation. Key questions:

1. **How long will my cash last?** (Runway calculation)
2. **How much seed capital do I need?** (Break-even analysis)
3. **What happens if my fund size changes?** (Sensitivity modeling)
4. **How do I compare to peers?** (Benchmarking)

The current tool answers all these questions but is architecturally messy with duplicate code, scattered state management, and confusing user flows.

---

## User Personas

### Primary: Emerging Manager (First-time GP)

- **Context**: Raising first fund, needs to plan management company ops
- **Pain points**: Doesn't know typical cost structures, needs guidance
- **Needs**: Templates, benchmarks, educational content

### Secondary: Fund CFO/COO

- **Context**: Managing existing fund ops, forecasting future costs
- **Pain points**: Needs scenario modeling, export for board/LP reporting
- **Needs**: Advanced features, export, precision

### Tertiary: Advisor/Consultant

- **Context**: Helping clients plan fund economics
- **Pain points**: Needs to share scenarios, compare multiple funds
- **Needs**: URL sharing, scenario comparison, professional exports

---

## Core Features (Must Have)

### 1. Budget Input Management

**Fund Revenue Sources**

- Add multiple funds (name, size, fee rate, close year)
- Auto-calculate annual/monthly management fee revenue
- Support fee ramp-up modeling (optional advanced)

**Expense Categories**

- **Team**: Role + monthly all-in cost (with typical range hints)
- **Operations**: Fund admin, audit, legal, compliance, tax
- **Overhead**: Office, insurance, tech, travel

**Settings**

- Starting cash (seed capital)
- Inflation rate (default 3%)
- GP commitment % (default 2%)

### 2. Core Calculations

**Key Metrics Displayed**

- Monthly burn rate
- Annual budget (burn × 12)
- Annual revenue (total fees)
- Runway months (until cash = $0)
- Break-even month (revenue ≥ expenses)
- Seed capital needed (to avoid shortfall)

**Projection Table**

- 60-month forecast with monthly detail
- Revenue, expenses, net cash flow, running balance

### 3. Visualization (3 Charts - Simplified from 8)

**Chart 1: Cash Runway Timeline**

- Line chart: cash balance over 60 months
- Milestone markers: first close, break-even, 50% runway, depletion
- Toggle: 1 year / 3 year / 5 year views

**Chart 2: Expense Breakdown**

- Donut chart: Team vs Operations vs Overhead
- Shows percentages and dollar amounts

**Chart 3: Runway Health Gauge**

- Circular progress showing runway months
- Color-coded: Green (24+), Amber (12-24), Red (<12)

### 4. Export Capabilities

**Excel Export**

- Multi-sheet workbook: Summary, Funds, Team, Operations, Overhead, Projections
- Professional formatting

**PDF Export**

- Executive summary + detailed breakdown
- Printable format for board/LP meetings

**URL Sharing**

- Shareable link with encoded parameters
- Recipients see same scenario

### 5. Onboarding (Single Flow)

**Journey Mode** (first-time users)

1. Welcome + fund strategy selection
2. Fund size input (with typical ranges)
3. Fee rate input
4. Team size preset (Solo/Small/Mid/Large)
5. Office location preset (Tier 1/2/Remote)
6. Starting cash input
7. Review + launch

---

## Advanced Features (Keep but Simplify)

### 1. Sensitivity Analysis (Simplified)

**Single Panel, Not 4 Cards**

- Sliders: Fund size ±20%, Fee rate ±0.5%, Burn ±15%
- Real-time runway impact display
- "What breaks?" indicator (when runway drops below 12 months)

### 2. Scenario Comparison (Keep)

- Save named scenarios
- Compare 2-3 side by side
- Show delta on key metrics

### 3. Benchmarking (Simplified)

- Compare user metrics to industry medians
- Traffic light indicators (above/in/below range)
- Remove complex peer comparison charts

---

## Features to Cut

| Feature                     | Reason                              |
| --------------------------- | ----------------------------------- |
| 8 chart types → 3           | Overwhelming, redundant views       |
| Goal-seeking                | Rarely used, adds complexity        |
| Separate walkthrough        | Redundant with journey mode         |
| Advanced carry projections  | Outside core scope                  |
| GP commitment tracking      | Niche, separate tool candidate      |
| Duplicate onboarding wizard | Confusing, keep only journey        |
| Peer comparison mode        | Too complex, keep simple benchmarks |

---

## Architecture

### State Management (Zustand)

```typescript
// Single store for all budget state
interface BudgetStore {
  // Data
  data: BudgetData;
  results: BudgetResults | null;

  // Actions
  setFunds: (funds: Fund[]) => void;
  setExpenses: (expenses: Expenses) => void;
  setStartingCash: (cash: number) => void;
  recalculate: () => void;

  // Persistence
  saveToLocal: () => void;
  loadFromLocal: () => void;

  // Scenarios
  savedScenarios: SavedScenario[];
  saveScenario: (name: string) => void;
  loadScenario: (id: string) => void;

  // UI
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
}
```

### File Structure

```
components/tools/management-company-budget/
├── index.tsx                    # Main entry, layout
├── store.ts                     # Zustand store
├── types.ts                     # TypeScript interfaces
├── calculator.ts                # Pure calculation functions
│
├── tabs/
│   ├── overview-tab.tsx         # Charts + key metrics
│   ├── inputs-tab.tsx           # Budget form
│   └── analysis-tab.tsx         # Sensitivity + scenarios
│
├── charts/
│   ├── cash-runway-chart.tsx    # Main runway line chart
│   ├── expense-chart.tsx        # Donut breakdown
│   └── runway-gauge.tsx         # Health indicator
│
├── forms/
│   ├── fund-form.tsx            # Fund inputs
│   ├── team-form.tsx            # Team member inputs
│   └── expense-form.tsx         # Operations + overhead
│
├── onboarding/
│   └── journey-mode.tsx         # Single onboarding flow
│
├── export/
│   ├── excel-export.ts          # Excel generation
│   ├── pdf-export.ts            # PDF generation
│   └── url-share.ts             # URL param handling
│
└── shared/                      # Shared with other tools
    ├── glossary.tsx
    ├── faq.tsx
    └── methodology.tsx
```

### Data Flow

```
User Input → Zustand Store → calculator.ts → Results
                ↓                               ↓
        localStorage sync              Chart components
                ↓
          URL param sync
```

---

## User Journey

### First-Time User

```
Landing → Journey Mode (7 steps) → Results View → Explore/Edit
```

### Returning User

```
Landing → Auto-load from localStorage → Results View
```

### Shared Link User

```
URL with params → Parse params → Results View (no save)
```

---

## Design Specifications

### Layout

**Desktop (≥1024px)**

```
┌─────────────────────────────────────────────────────┐
│  Header: Title, Export dropdown, Share button       │
├─────────────────────────────────────────────────────┤
│  Tab navigation: Overview | Edit Budget | Analysis  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Tab Content]                                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Mobile (<768px)**

- Tabs stack as full-width buttons
- Charts scale to container width
- Forms stack vertically
- Sticky bottom bar with key metrics

### Colors

- **Primary action**: Brand blue
- **Success/healthy**: Green (#22c55e)
- **Warning/monitor**: Amber (#f59e0b)
- **Danger/critical**: Red (#ef4444)
- **Neutral**: Gray scale (muted-foreground)

### Typography

- **Headings**: DM Sans, bold
- **Body**: Inter, regular
- **Numbers/Data**: Mono or tabular nums

### Accessibility

- All inputs have visible labels
- Min 44px touch targets
- Color not sole indicator (icons + text)
- Screen reader announcements for calculations
- Keyboard navigation for all interactive elements

---

## Mobile Experience

### Critical Mobile Features

1. **Key Metrics Card** - Always visible summary
2. **Swipeable tabs** - Easy navigation
3. **Collapsible sections** - Manage vertical space
4. **Bottom action bar** - Export, Share always accessible
5. **Input groups** - Stack cleanly on narrow screens

### Mobile-Specific Considerations

- Charts must be readable at 320px width
- Touch-friendly number inputs (increment buttons)
- Gesture support for tab switching
- Pull-to-refresh for recalculation

---

## Export Specifications

### Excel Workbook Structure

**Sheet 1: Summary**
| Metric | Value |
|--------|-------|
| Starting Cash | $500,000 |
| Monthly Burn | $85,000 |
| ... | ... |

**Sheet 2: Funds**
| Name | Size ($M) | Fee Rate | Annual Fee | Monthly Fee |
|------|-----------|----------|------------|-------------|
| Fund I | 100 | 2.0% | $2,000,000 | $166,667 |

**Sheet 3: Team** (similar structure)
**Sheet 4: Operations** (similar structure)
**Sheet 5: Overhead** (similar structure)
**Sheet 6: 60-Month Projections**

### PDF Structure

1. Cover page with title + date
2. Executive summary (1 page)
3. Fund details (1 page)
4. Expense breakdown (1 page)
5. 12-month projection table (1 page)
6. Methodology disclaimer

---

## Validation Rules

| Field         | Rule   | Error Message                               |
| ------------- | ------ | ------------------------------------------- |
| Fund size     | > 0    | "Fund size must be greater than zero"       |
| Fee rate      | 0.5-5% | "Fee rate typically ranges from 0.5% to 5%" |
| Team cost     | > 0    | "Monthly cost must be positive"             |
| Starting cash | ≥ 0    | "Starting cash cannot be negative"          |

### Warnings (Non-blocking)

| Condition            | Warning                                          |
| -------------------- | ------------------------------------------------ |
| Runway < 12 months   | "Low runway - consider increasing starting cash" |
| Team > 60% of budget | "High team costs relative to budget"             |
| No funds added       | "Add at least one fund to calculate revenue"     |
| Fee rate < 1%        | "Fee rate seems low - typical range is 1.5-2.5%" |

---

## URL Parameter Schema

```
/tools/management-company-budget?
  cash=500000&
  funds=[{"name":"Fund I","size":100,"feeRate":2}]&
  team=[{"role":"Partner","cost":25000}]&
  ops=[{"name":"Fund Admin","cost":5000}]&
  overhead=[{"name":"Office","cost":3000}]
```

Parameters are URL-encoded JSON. Recipients see read-only view unless they save.

---

## Testing Requirements

### Unit Tests

- calculator.ts: All calculation functions
- Validation: All rules fire correctly
- Export: Data formats correctly

### Integration Tests

- Complete user journey from onboarding to export
- URL sharing round-trip
- localStorage persistence

### Visual/E2E Tests

- Desktop layout at 1920px, 1440px, 1024px
- Mobile layout at 768px, 375px, 320px
- Charts render correctly with edge case data

---

## Success Metrics

| Metric              | Target                  |
| ------------------- | ----------------------- |
| Main component LOC  | < 400 (from 1,478)      |
| Total files         | < 20 (from 31)          |
| Build size          | < 150KB (tool-specific) |
| First paint         | < 1s                    |
| Time to interactive | < 2s                    |

---

## Implementation Phases

### Phase 1: Foundation (Week 1)

- [ ] Set up Zustand store
- [ ] Implement calculator.ts (pure functions)
- [ ] Create types.ts with clean interfaces

### Phase 2: Core UI (Week 2)

- [ ] Build tab structure
- [ ] Implement Overview tab with 3 charts
- [ ] Implement Inputs tab with forms

### Phase 3: Features (Week 3)

- [ ] Add onboarding flow
- [ ] Implement sensitivity analysis
- [ ] Add scenario comparison

### Phase 4: Export & Polish (Week 4)

- [ ] Excel export
- [ ] PDF export
- [ ] URL sharing
- [ ] Mobile optimization
- [ ] Accessibility audit

---

## Open Questions

1. **GP commitment tracking** - Cut entirely or move to separate tool?
2. **Carry projections** - Cut entirely or defer to v3?
3. **Historical data** - Should we store previous versions?
4. **Collaboration** - Future feature for team editing?

---

## Appendix: Current vs. New Feature Mapping

| Current Feature           | New Approach                  |
| ------------------------- | ----------------------------- |
| Journey Mode              | Keep, simplify to 7 steps     |
| Onboarding Wizard         | Remove (duplicate)            |
| Results Walkthrough       | Remove (use tooltips instead) |
| 8 Chart Types             | Reduce to 3 essential charts  |
| Goal Seeking              | Remove                        |
| GP Commitment             | Remove (separate tool)        |
| Carry Projections         | Remove (separate tool)        |
| Sensitivity (4 scenarios) | Simplify to sliders           |
| Peer Comparison           | Simplify to benchmark table   |
| Excel Export              | Keep                          |
| PDF Export                | Keep, simplify                |
| JSON Export               | Keep                          |
| URL Sharing               | Keep                          |
| Undo/Redo                 | Keep (via Zustand middleware) |
| Auto-save                 | Keep                          |
| Presets                   | Keep as "Saved Scenarios"     |
