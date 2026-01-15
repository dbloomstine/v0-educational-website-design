# PRD: Subscription Credit Line Impact Visualizer v2

## Overview

**Tool Name**: Subscription Credit Line Impact Visualizer
**Purpose**: Model how subscription lines of credit affect fund IRR, MOIC, J-curve, and fee drag
**Target Users**: Fund managers, LPs evaluating fund performance, fund administrators
**Current State**: 10 files, ~2,500 total lines
**Goal**: Clean rebuild with unified Zustand architecture, same core calculations

---

## Problem Statement

Subscription credit lines (capital call facilities) have become standard for PE/VC/Credit funds. Understanding their impact requires:

1. Modeling IRR boost from delayed capital calls
2. Understanding MOIC drag from interest expense
3. Visualizing J-curve flattening effects
4. Ensuring ILPA compliance (15-25% facility size, 180 days max)
5. Comparing levered vs unlevered returns (ILPA best practice)

---

## Core Features

### 1. Fund Configuration

- Fund size ($M)
- Investment period (years)
- Total fund term (years)
- Deployment pace (front-loaded, linear, back-loaded)
- Gross MOIC target
- Realization schedule (j-curve, linear, back-loaded)

### 2. Economics Settings

- Management fee rate (%)
- Management fee basis (commitments vs invested capital)
- Carried interest rate (%)
- Preferred return (%)

### 3. Subscription Line Settings

- Use line toggle
- Facility size (% of commitments) - with ILPA compliance indicator
- Interest rate (%)
- Max days outstanding - with ILPA compliance indicator
- Repayment trigger (automatic vs distribution-funded)

### 4. Results Display

- Impact summary (IRR boost, MOIC drag, annual interest cost)
- Performance comparison (with/without line for IRR, MOIC, TVPI, DPI)
- J-curve visualization
- Cash flow timeline table
- Key insights narrative

### 5. Presets

- Conservative Use: $100M fund, 15% facility, 90 days, 4% rate
- Typical PE Fund: $200M fund, 20% facility, 180 days, 4.5% rate
- Aggressive Use: $300M fund, 25% facility, 360 days, 5.5% rate
- No Credit Facility: $150M fund, no subscription line

---

## Architecture

### State Management (Zustand)

```typescript
interface SubscriptionLineStore {
  // Inputs
  input: SubscriptionLineInput;

  // Results (computed)
  results: SubscriptionLineOutput;

  // Comparison mode
  compareMode: boolean;
  compareInput: SubscriptionLineInput | null;
  compareResults: SubscriptionLineOutput | null;

  // UI
  activeTab: "calculator" | "learn";
  showOnboarding: boolean;
  expandedSections: Record<string, boolean>;

  // Actions
  setInput: (input: Partial<SubscriptionLineInput>) => void;
  loadPreset: (preset: string) => void;
  startComparison: () => void;
  updateCompareInput: (input: Partial<SubscriptionLineInput>) => void;
  exitComparison: () => void;
  setActiveTab: (tab: "calculator" | "learn") => void;
  setShowOnboarding: (show: boolean) => void;
  toggleSection: (section: string) => void;
  reset: () => void;

  // Export/Share
  exportToJson: () => string;
  getShareableUrl: () => string;
}
```

### File Structure

```
components/tools/subscription-credit-line/
├── index.tsx                      # Main entry (header, metrics bar, tabs)
├── store.ts                       # Zustand store
├── subscriptionLineCalculations.ts # Keep existing calculations
├── export.ts                      # Keep existing export functions
├── tabs/
│   ├── calculator-tab.tsx        # Fund inputs + line settings + results
│   └── learn-tab.tsx             # Glossary + FAQ
└── (legacy files to be deprecated)
```

---

## Key Metrics Bar

Display these metrics prominently:

- Fund Size
- IRR Boost (bps)
- MOIC Drag (%)
- Total Interest Cost

---

## Success Metrics

| Metric             | Target                                      |
| ------------------ | ------------------------------------------- |
| Total new files    | 4 (index, store, calculator-tab, learn-tab) |
| Main component LOC | < 300                                       |
| Journey mode       | Remove (use simple onboarding modal)        |
| Walkthrough        | Remove (integrate insights into results)    |

---

## Implementation Notes

1. Keep existing `subscriptionLineCalculations.ts` - calculations are well-tested
2. Keep existing `export.ts` - export functionality is complete
3. Move glossary and FAQ content from separate files into learn-tab
4. Remove journey-mode.tsx, results-walkthrough.tsx, what-if-sliders.tsx
5. Consolidate input-form.tsx and results-view.tsx into calculator-tab

---

## ILPA Compliance Indicators

Visual badges to show compliance with ILPA guidance:

- Facility size: Green (15-25%), Amber (outside range)
- Days outstanding: Green (≤180), Amber (>180)

---

## Migration Strategy

1. Create new files alongside existing
2. Update tool-placeholder.tsx to use new index.tsx
3. Verify build passes
4. Legacy files can be removed in follow-up cleanup
