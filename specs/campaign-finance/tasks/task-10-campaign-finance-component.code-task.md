---
status: completed
created: 2026-02-11
started: 2026-02-13
completed: 2026-02-13
---

# Task: Create CampaignFinance React Component

## Description

Create a React component that displays campaign finance data for a legislator, including total raised, disbursements, cash on hand, PAC vs individual contribution breakdown, and debts owed. Includes unit tests.

## Background

The component receives campaign finance data as props (server-rendered via Astro). It should display financial information clearly with proper currency formatting. The PAC vs individual contribution breakdown should be visualized (percentage bar or similar). The component must handle null/missing data gracefully by showing a "Not available" message.

## Reference Documentation

**Required:**

- Design: docs/tasks/campaign-finance.md (UI Considerations section)

**Additional References:**

- Existing component patterns: src/components/ (any React component)
- CampaignFinanceData type from task-09

## Technical Requirements

1. Create `src/components/CampaignFinance.tsx`
2. Accept `CampaignFinanceData | null` as the primary prop
3. Display:
   - Total receipts (total raised) prominently with cycle year context (e.g., "2024 Cycle")
   - Total disbursements
   - Cash on hand
   - PAC vs individual contribution breakdown as a visual (percentage bar, stacked bar, or similar)
   - Debts owed (only when present/non-zero)
4. Format currency values consistently (e.g., `$1,234,567`)
5. Handle null data: show a tasteful "Campaign finance data not available" message
6. Follow existing component patterns in the codebase (Tailwind classes, functional components)
7. Write comprehensive unit tests

## Dependencies

- task-09 (CampaignFinanceData type available)

## Implementation Approach

1. Create `src/components/CampaignFinance.tsx`:
   - Define props interface using the `CampaignFinanceData` type
   - Create a currency formatter utility (e.g., `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })`)
   - Render a section with heading like "Campaign Finance" or "Fundraising"
   - Show total raised prominently with cycle year
   - Show disbursements and cash on hand as supporting figures
   - Calculate PAC/individual percentages and render as a horizontal bar or similar visual
   - Conditionally show debts owed only when > 0
   - Return a "not available" message when data is null
2. Create `src/components/CampaignFinance.test.tsx`:
   - Test rendering with complete finance data (all fields populated)
   - Test rendering with null data (shows "not available" message)
   - Test rendering with zero debts (debts section hidden)
   - Test rendering with non-zero debts (debts section visible)
   - Test currency formatting (large numbers, zero values)
   - Test PAC vs individual percentages are calculated correctly
   - Test cycle year is displayed
3. Run `pnpm test -- src/components/CampaignFinance` to verify

## Acceptance Criteria

1. **Total raised displayed prominently**
   - Given finance data with totalReceipts of 5000000
   - When the component renders
   - Then "$5,000,000" (or similar formatted value) is displayed with cycle year

2. **Disbursements and cash on hand shown**
   - Given finance data with all fields
   - When the component renders
   - Then totalDisbursements and cashOnHand are displayed with proper formatting

3. **PAC vs individual breakdown visualized**
   - Given totalFromPACs of 2000000 and totalFromIndividuals of 3000000
   - When the component renders
   - Then a visual shows 40% PAC / 60% individual (or similar ratio display)

4. **Debts shown conditionally**
   - Given finance data with debtsOwed > 0
   - When the component renders
   - Then debts are displayed; and when debtsOwed is 0 or null, they are hidden

5. **Null data handled gracefully**
   - Given null is passed as the data prop
   - When the component renders
   - Then a "not available" message is shown instead of financial data

6. **Currency formatting consistent**
   - Given various monetary values
   - When they are displayed
   - Then all use consistent USD currency formatting

7. **Unit tests pass**
   - Given `src/components/CampaignFinance.test.tsx`
   - When `pnpm test -- src/components/CampaignFinance` runs
   - Then all tests pass

## Metadata

- **Complexity**: Medium
- **Labels**: ui, react, campaign-finance, testing
- **Required Skills**: React, TypeScript, Tailwind CSS, Vitest, component testing
