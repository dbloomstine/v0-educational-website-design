# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FundOpsHQ is an educational resource hub for fund operations professionals, covering 8 alternative asset fund types (Private Equity, Venture Capital, Private Credit, Hedge Funds, Real Estate, Infrastructure, Secondaries, GP-Stakes). Built with Next.js 16 (App Router) + React 19, TypeScript, and Tailwind CSS. Deployed on Vercel and synced with v0.app.

## Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
npm run start    # Start production server
```

Note: No test suite is configured. TypeScript build errors are ignored in next.config.mjs.

## Architecture

### Content System

All content is defined in TypeScript files under `lib/content/`:

- **Fund Types** (`fund-types.ts`): 8 fund types, each with associated "pillars" (operational areas like CFO, Compliance, Tax, etc.)
- **Pillars** (`pillars.ts`): Operational topic areas that vary by fund type
- **Articles** (`articles.ts`): Registry that imports individual article files from `lib/content/articles/`. Each article belongs to one fund type + one pillar. Article IDs follow pattern: `{fundType}-{pillar}-{slug}`
- **Tools** (`tools.ts`): 6 interactive calculators/visualizers
- **Types** (`types.ts`): Core interfaces for FundType, Pillar, Article, Tool

### Routing Structure

```
/                              → Homepage
/funds/[fundType]              → Fund type landing (e.g., /funds/private-equity)
/funds/[fundType]/[pillar]     → Pillar page with article content
/tools/[toolSlug]              → Tool pages (dynamic route for most tools)
/tools/fund-launch-guide       → Dedicated page (not dynamic route)
/roles/[role]                  → Career guidance by role
/help/[topic]                  → Static help pages (not dynamic, each is its own file)
/newsletter/[newsletterSlug]/[postSlug] → Newsletter posts
```

### Interactive Tools

Six tools under `components/tools/`:

1. **fund-launch-guide/** - Multi-phase checklist with progress tracking, localStorage persistence
2. **management-fee-calculator/** - Fee schedule modeling with charts
3. **management-company-budget/** - Burn rate/runway calculator with sensitivity analysis
4. **distribution-waterfall/** - LP/GP economics visualization
5. **subscription-credit-line/** - IRR/MOIC impact modeling
6. **fund-expense-allocation/** - Expense classification helper

Each tool has its own subdirectory with components like onboarding wizards, charts, export functionality, glossaries, and FAQs.

### Shared Tool Components

`components/tools/shared/` contains reusable tool infrastructure:
- `tool-page-layout.tsx` - Standard layout wrapper
- `export-toolbar.tsx` - PDF/Excel/CSV export buttons
- `disclaimer-block.tsx`, `methodology-block.tsx` - Standard disclosures

### Export System

`lib/exports/` provides PDF, Excel, and CSV export utilities used by tools.

### UI Components

`components/ui/` contains Radix UI-based primitives (shadcn/ui pattern). Use these instead of creating custom form elements.

## Key Patterns

- Articles are Markdown content stored in individual `.ts` files, not MDX
- Tool state often uses localStorage for persistence and URL params for shareability (see `lib/hooks/use-url-state.ts`)
- Dark mode only (hardcoded in `app/layout.tsx` as `className="dark"`)
- Fonts: DM Sans for headings, Inter for body
- Colors use OKLCH format in fund-types for brand consistency
