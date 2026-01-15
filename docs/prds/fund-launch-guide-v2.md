# Fund Launch Guide v2 - Product Requirements Document

## Overview

The Fund Launch Guide is an interactive checklist tool for fund managers launching a new fund. It provides a comprehensive, phase-by-phase roadmap covering all aspects of fund formation - from strategy planning to first close. The v2 rebuild modernizes the state management using Zustand while preserving all existing functionality.

## Current State Analysis

### Existing Features

- Multi-phase checklist (8 phases: Strategy, Legal Formation, Documentation, Regulatory, Service Providers, Operations, Fundraising, First Close)
- Fund configuration options (strategy, size, jurisdiction, anchor investor)
- Progress tracking with localStorage persistence
- Multiple view modes (Timeline, Board, List)
- Task filtering (All, Incomplete, Completed)
- Quick Jump search (Cmd+K)
- Service provider tracking
- Export functionality (PDF, Excel)
- Share via URL
- Journey Mode onboarding wizard
- Strategy-specific tasks (conditional display based on fund type)
- Task dependencies (required vs recommended)
- Time estimates and benchmarks

### Current Architecture Issues

- Complex useState/useEffect patterns
- Manual localStorage serialization
- No centralized state management
- Difficult to maintain and extend

## v2 Architecture

### Zustand Store Pattern

```typescript
interface FundLaunchStore {
  // Configuration
  config: FundConfig | null;
  providers: Record<string, string>;

  // Progress
  completedTasks: Set<string>;
  expandedTasks: Set<string>;
  expandedPhases: Set<string>;

  // UI State
  activeTab: "checklist" | "learn";
  viewMode: "timeline" | "board" | "list";
  filterCompleted: "all" | "incomplete" | "completed";
  showOnboarding: boolean;
  showQuickJump: boolean;
  searchQuery: string;

  // Actions
  setConfig: (config: FundConfig) => void;
  setProviders: (providers: Record<string, string>) => void;
  toggleTaskComplete: (taskId: string) => void;
  toggleTaskExpand: (taskId: string) => void;
  togglePhaseExpand: (phaseId: string) => void;
  setActiveTab: (tab: "checklist" | "learn") => void;
  setViewMode: (mode: "timeline" | "board" | "list") => void;
  setFilterCompleted: (filter: "all" | "incomplete" | "completed") => void;
  setShowOnboarding: (show: boolean) => void;
  resetProgress: () => void;
  removeProvider: (key: string) => void;

  // Computed (via selectors)
  getApplicableTasks: () => FundLaunchTask[];
  getTasksByPhase: () => Map<string, FundLaunchTask[]>;
  getProgress: () => { completed: number; total: number; percent: number };
}
```

### File Structure

```
components/tools/fund-launch-guide/
├── index.tsx              # Main entry point with tabs
├── store.ts               # Zustand store with persist
├── types.ts               # Type definitions (existing)
├── data.ts                # Task/phase data (existing)
├── tabs/
│   ├── checklist-tab.tsx  # Main checklist view
│   └── learn-tab.tsx      # Glossary and FAQ
├── task-card.tsx          # Individual task component (existing)
├── progress-dashboard.tsx # Progress overview (existing)
├── journey-mode.tsx       # Onboarding wizard (existing)
└── onboarding-wizard.tsx  # Simple onboarding (existing)
```

### Key Changes from v1

1. **State Management**: Replace useState/useEffect patterns with Zustand store
2. **Persistence**: Use Zustand persist middleware instead of manual localStorage
3. **Tab Structure**: Add Learn tab with glossary and FAQ
4. **Cleaner Architecture**: Centralized state reduces prop drilling

### Preserved Features

- All 8 phases with full task database
- Strategy-specific tasks
- Task dependencies
- Multiple view modes
- Export (PDF/Excel)
- Share via URL
- Journey Mode onboarding
- Service provider tracking
- Quick Jump search

## Component Details

### index.tsx (Main Entry)

- Tabs: Checklist | Learn
- Key metrics bar (progress %, tasks completed, current phase)
- Export/Share/Reset actions
- Quick Start dialog

### tabs/checklist-tab.tsx

- View mode selector (Timeline, Board, List)
- Filter dropdown
- Phase-by-phase task display
- Progress dashboard
- Recommended next task
- Time estimate bar

### tabs/learn-tab.tsx

- Fund launch glossary (terms specific to fund formation)
- FAQ (common questions about fund launch process)

## Data Model

### Phases (8 total)

1. Strategy & Planning
2. Legal Entity Formation
3. Fund Documentation
4. Regulatory & Compliance
5. Service Provider Selection
6. Operations Infrastructure
7. Marketing & Fundraising
8. First Close & Beyond

### Task Applicability

Tasks are filtered based on:

- Fund strategy (VC, PE, Credit, Hedge Fund, Real Estate, Infrastructure)
- Fund size (emerging, mid, large)
- Jurisdiction (US Onshore, US + Cayman, EU/AIFMD)

### Storage

- Storage key: `fund-launch-guide-v2`
- Persisted fields: config, completedTasks, providers, showOnboarding

## Implementation Notes

1. Keep existing `types.ts` and `data.ts` unchanged
2. Keep existing `task-card.tsx`, `progress-dashboard.tsx`, `journey-mode.tsx`
3. Create new `store.ts` following management-fee-calculator pattern
4. Create new `index.tsx` with tab structure
5. Create new `tabs/checklist-tab.tsx` with existing checklist logic
6. Create new `tabs/learn-tab.tsx` with fund launch glossary/FAQ
7. Update page.tsx to import from `index.tsx`

## Success Criteria

- [ ] All existing functionality preserved
- [ ] Zustand store manages all state
- [ ] localStorage persistence works correctly
- [ ] No TypeScript errors
- [ ] Build passes successfully
- [ ] Journey Mode onboarding works
- [ ] Export/Share functionality works
- [ ] All view modes work (Timeline, Board, List)
