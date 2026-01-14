# PRD: Distribution Waterfall Visualizer v2

## Overview

**Tool Name**: Distribution Waterfall Visualizer
**Purpose**: Help users understand and model PE/VC fund economics - how proceeds get split between LPs and GPs
**Target Users**: Emerging managers, fund investors, finance students, LPA negotiators
**Current State**: 16 files, 7,296 total lines, journey mode alone is 54KB
**Goal**: Clean rebuild with unified architecture, simplified UX, same core calculations

---

## Problem Statement

Understanding distribution waterfalls is critical for:

1. **GPs**: Structuring fund economics, modeling carry scenarios
2. **LPs**: Evaluating fund terms, comparing managers
3. **Students/New Entrants**: Learning PE/VC fund mechanics
4. **Advisors**: Explaining economics to clients

Key questions the tool answers:

- What's my LP multiple under different exit scenarios?
- How does carry split between GP and LPs?
- What's the impact of different pref rates, catch-up provisions?
- European vs American waterfall - what's the difference?

---

## User Personas

### Primary: Emerging Manager (First-time GP)

- **Context**: Structuring first fund, needs to model economics for LPA
- **Pain points**: Doesn't fully understand waterfall mechanics
- **Needs**: Clear explanations, preset scenarios, visual breakdown

### Secondary: Fund Investor (LP)

- **Context**: Evaluating fund terms, comparing multiple managers
- **Pain points**: Hard to compare different structures
- **Needs**: Quick scenario comparison, export for diligence

### Tertiary: Finance Student

- **Context**: Learning PE/VC for class or career prep
- **Pain points**: Textbook examples don't show real-world nuance
- **Needs**: Step-by-step explanation, quiz to test understanding

---

## Core Features (Must Have)

### 1. Waterfall Calculator

**Inputs**

- Fund size ($M)
- Contributed capital ($M)
- Gross proceeds ($M)
- Waterfall type (European / American)
- Preferred return rate (%)
- Pref compounding (Simple / Compound)
- Carry rate (%)
- Catch-up (Yes/No, rate %)
- Years to exit
- GP commitment (%)

**Outputs**

- Tier-by-tier breakdown (Return of Capital → Preferred Return → Catch-up → Carry Split)
- LP distributions and multiple
- GP distributions and carry
- Effective carry rate on profits
- Visual waterfall chart

### 2. Key Metrics Display

Always visible summary:

- Total distributed
- LP Multiple (MOIC)
- GP Carry
- Effective carry rate

### 3. Waterfall Visualization

**Simple Stacked Bar Chart**

- Shows each tier as a segment
- LP portion vs GP portion clearly distinguished
- Hover for tier details

### 4. Preset Scenarios

Quick-load common structures:

- Classic PE: $100M, 8% pref, 20% carry, European
- VC Style: $50M, no pref, 25% carry, American
- Higher Carry: $200M, 6% pref, 25% carry
- No Catch-up: Standard terms without GP catch-up

### 5. Scenario Comparison (Simplified)

**Two-panel layout** (not complex matrix):

- Base scenario on left
- "What if" scenario on right
- Sliders to adjust key variables
- Delta display between scenarios

---

## Features to Cut/Simplify

| Feature               | Current State        | New Approach                |
| --------------------- | -------------------- | --------------------------- |
| Journey Mode (54KB!)  | 10+ step onboarding  | Simple modal with 3 presets |
| Results Walkthrough   | Separate component   | Inline tooltips             |
| Peer Comparison       | Complex benchmarking | Remove (out of scope)       |
| Quiz Panel            | Full quiz component  | Keep but simplify           |
| Sample Scenarios      | 20+ scenarios        | 4-5 presets only            |
| What-If Sliders       | Separate component   | Inline in comparison panel  |
| Calculation Breakdown | Verbose explanations | Collapsible detail section  |
| Visual Effects        | Animations galore    | Subtle transitions only     |

---

## Architecture

### State Management (Zustand)

```typescript
interface WaterfallStore {
  // Core state
  input: WaterfallInput;
  output: WaterfallOutput | null;

  // Comparison
  compareInput: WaterfallInput | null;
  compareOutput: WaterfallOutput | null;
  showComparison: boolean;

  // UI
  activeTab: "calculator" | "learn";
  showOnboarding: boolean;

  // Actions
  setInput: (input: Partial<WaterfallInput>) => void;
  loadPreset: (preset: string) => void;
  toggleComparison: () => void;
  copyToCompare: () => void;
  reset: () => void;
  recalculate: () => void;
}
```

### File Structure

```
components/tools/distribution-waterfall/
├── index.tsx                    # Main entry
├── store.ts                     # Zustand store
├── types.ts                     # TypeScript interfaces
├── calculations.ts              # Pure calculation functions
│
├── tabs/
│   ├── calculator-tab.tsx       # Main calculator + results
│   └── learn-tab.tsx            # Glossary + FAQ + Quiz
│
├── components/
│   ├── waterfall-chart.tsx      # Stacked bar visualization
│   ├── tier-breakdown.tsx       # Table showing each tier
│   ├── comparison-panel.tsx     # Side-by-side comparison
│   └── preset-selector.tsx      # Quick preset buttons
│
└── shared/                      # Import from shared
    └── (quiz, glossary, faq from shared components)
```

### Data Flow

```
User Input → Zustand Store → calculations.ts → Output
                ↓                                ↓
        localStorage sync               Chart + Results
                ↓
          URL param sync
```

---

## UI/UX Specifications

### Layout (Desktop)

```
┌─────────────────────────────────────────────────────┐
│  Header: Title, Export, Share, Reset                │
├─────────────────────────────────────────────────────┤
│  Key Metrics Bar: Distributed | LP MOIC | GP Carry  │
├─────────────────────────────────────────────────────┤
│  Tab navigation: Calculator | Learn                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Tab Content]                                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Calculator Tab Layout

```
┌─────────────────────────────────────────────────────┐
│  Presets: [Classic PE] [VC Style] [Higher Carry]    │
├─────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────────────┐ │
│  │  INPUT FORM      │  │  WATERFALL CHART         │ │
│  │                  │  │                          │ │
│  │  Fund Size       │  │  [Stacked Bar]           │ │
│  │  Proceeds        │  │                          │ │
│  │  Pref Rate       │  ├──────────────────────────┤ │
│  │  Carry Rate      │  │  TIER BREAKDOWN          │ │
│  │  ...             │  │                          │ │
│  │                  │  │  Tier 1: Return Capital  │ │
│  │  [Compare Mode]  │  │  Tier 2: Pref Return     │ │
│  │                  │  │  Tier 3: Catch-Up        │ │
│  │                  │  │  Tier 4: Carry Split     │ │
│  └──────────────────┘  └──────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Comparison Mode

When "Compare" is enabled, show side-by-side:

```
┌─────────────────────────────────────────────────────┐
│  ┌──────────────────┐  ┌──────────────────────────┐ │
│  │  BASE SCENARIO   │  │  COMPARISON SCENARIO     │ │
│  │                  │  │                          │ │
│  │  [Input Form]    │  │  [Sliders to adjust]     │ │
│  │  [Results]       │  │  [Results with delta]    │ │
│  └──────────────────┘  └──────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Learn Tab

- Glossary (collapsible terms)
- FAQ accordion
- Optional quiz

---

## Calculation Logic

### European Waterfall (Whole Fund)

1. **Return of Capital**: All contributed capital returned to LPs first
2. **Preferred Return**: LPs receive pref (typically 8%) on capital
3. **GP Catch-Up**: GP receives 100% until they have 20% of profits
4. **Carry Split**: Remaining split 80/20 between LPs and GP

### American Waterfall (Deal-by-Deal)

- Similar tiers but calculated per investment
- GP receives carry on each profitable deal
- No cross-subsidization between deals

### Key Formulas

```typescript
// Simple pref
prefReturn = contributedCapital * prefRate * years;

// Compound pref
prefReturn = contributedCapital * (Math.pow(1 + prefRate, years) - 1);

// Catch-up amount (to get GP to target carry %)
catchUpAmount = (prefReturn * carryRate) / (1 - carryRate);

// LP Multiple
lpMultiple = totalToLPs / contributedCapital;
```

---

## Mobile Experience

- Input form full width
- Chart below form
- Tier breakdown as cards
- Comparison as tabs (not side-by-side)
- Sticky metrics bar at bottom

---

## Export Options

**JSON**: Full scenario data
**CSV**: Tier breakdown + metrics
**Share URL**: Encoded parameters for sharing

---

## Success Metrics

| Metric                    | Target              |
| ------------------------- | ------------------- |
| Main component LOC        | < 300               |
| Total files               | < 12                |
| Journey mode              | Remove (modal only) |
| Time to first calculation | < 2 seconds         |

---

## Implementation Phases

### Phase 1: Core Calculator

- [ ] Set up Zustand store
- [ ] Port calculation functions
- [ ] Build main calculator tab
- [ ] Add preset scenarios

### Phase 2: Visualization

- [ ] Build waterfall stacked bar chart
- [ ] Add tier breakdown table
- [ ] Add comparison panel

### Phase 3: Learning Features

- [ ] Port glossary (simplified)
- [ ] Port FAQ (simplified)
- [ ] Keep quiz if time permits

### Phase 4: Polish

- [ ] Export functionality
- [ ] URL sharing
- [ ] Mobile optimization

---

## Open Questions

1. **Quiz**: Keep or cut? Currently 8KB component
2. **American vs European**: Explain difference more prominently?
3. **Deal-level modeling**: Add individual investment tracking? (Probably cut - too complex)
