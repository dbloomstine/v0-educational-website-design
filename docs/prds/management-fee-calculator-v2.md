# PRD: Management Fee Calculator v2

## Overview

**Tool Name**: Management Fee Calculator
**Purpose**: Model management fee schedules across fund life including step-downs and base changes
**Target Users**: Emerging managers, fund investors, LPA negotiators
**Current State**: 15 files, 4,770 total lines
**Goal**: Clean rebuild with unified architecture, same core calculations

---

## Problem Statement

Management fees are the primary revenue source for fund managers. Understanding fee structures requires:

1. Modeling different fee bases (committed capital, invested cost, NAV)
2. Understanding fee step-downs post-investment period
3. Comparing total fee load across fund life

---

## Core Features

### 1. Fund Configuration

- Fund type (PE, VC, Credit, RE, Hedge Fund)
- Fund size ($M)
- Fund term (years)
- Investment period (years)
- NAV growth rate (for NAV-based fees)

### 2. Fee Phase Editor

- Multiple fee phases
- Each phase: start year, end year, fee base, fee rate
- Visual timeline representation

### 3. Results Display

- Yearly fee breakdown table
- Cumulative fees chart
- Summary metrics (total fees, avg annual, first half vs second half)

### 4. Presets

- Standard PE (2% on committed, 1.5% on invested post-IP)
- VC Style (2.5% flat on committed)
- Credit Fund (1.5% on invested capital)
- Step-down example (2% → 1.75% → 1.5%)

---

## Architecture

### State Management (Zustand)

```typescript
interface FeeCalcStore {
  // Fund inputs
  fundInputs: FundInputs;
  feePhases: FeePhase[];
  results: FeeCalculationResult | null;

  // UI
  activeTab: "calculator" | "learn";
  showOnboarding: boolean;

  // Actions
  setFundInputs: (inputs: Partial<FundInputs>) => void;
  setFeePhases: (phases: FeePhase[]) => void;
  addPhase: () => void;
  updatePhase: (id: string, updates: Partial<FeePhase>) => void;
  removePhase: (id: string) => void;
  loadPreset: (preset: string) => void;
  reset: () => void;
}
```

### File Structure

```
components/tools/management-fee-calculator/
├── index.tsx              # Main entry
├── store.ts               # Zustand store
├── types.ts               # (keep existing)
├── calculator.ts          # (keep existing)
├── tabs/
│   ├── calculator-tab.tsx # Fund inputs + fee phases + results
│   └── learn-tab.tsx      # Glossary + FAQ
└── components/
    └── fee-chart.tsx      # Cumulative fees visualization
```

---

## Success Metrics

| Metric             | Target                |
| ------------------ | --------------------- |
| Total files        | < 10                  |
| Main component LOC | < 300                 |
| Journey mode       | Remove (simple modal) |

---

## Implementation

Simple rebuild following same pattern as Distribution Waterfall:

- Zustand store
- Two tabs (Calculator, Learn)
- Key metrics bar
- Export/Share functionality
