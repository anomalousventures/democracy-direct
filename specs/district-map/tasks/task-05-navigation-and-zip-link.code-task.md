---
status: completed
created: 2026-02-11
started: 2026-02-19
completed: 2026-02-19
---

# Task: Add Map to Navigation and ZIP Lookup Link

## Description

Add a "Map" link to the site's main navigation and add a "Find on map" link to the ZIP code lookup results, providing users with multiple ways to discover the map feature.

## Background

The site has a main navigation in the layout component. The ZIP lookup component (`src/components/ZipLookup.tsx`) shows district results after a user enters their ZIP code. Adding a map link here gives users a visual alternative to the text-based district information.

## Reference Documentation

**Required:**

- Design: docs/tasks/district-map.md (Implementation Tasks 16-17)

**Additional References:**

- Layout with navigation: src/layouts/Layout.astro
- ZIP lookup component: src/components/ZipLookup.tsx

## Technical Requirements

1. Add "Map" link to the main navigation in `src/layouts/Layout.astro`
2. Navigation link should point to `/map`
3. Show active state when the current page is `/map`
4. Place the Map link in a logical position (near other discovery features like "Find Your Rep")
5. Add a "Find on map" or "View on map" link in the ZIP lookup results area of `src/components/ZipLookup.tsx`
6. The map link in ZIP results should be unobtrusive (secondary styling, not competing with primary actions)

## Dependencies

- task-04 (map page exists at /map)

## Implementation Approach

1. Read `src/layouts/Layout.astro` to understand the current navigation structure and active-state pattern
2. Add a "Map" navigation item:
   - Follow the existing pattern for nav links
   - Add active state detection (check if current path is `/map`)
   - Position logically in the nav order
3. Read `src/components/ZipLookup.tsx` to understand the results display
4. Add a link after the ZIP results are displayed:
   - Text like "View districts on map" or "Find on map"
   - Link to `/map`
   - Use secondary/subtle styling so it doesn't compete with the main rep results
   - Only show after results are displayed (not in the initial input state)

## Acceptance Criteria

1. **Map link in navigation**
   - Given any page on the site
   - When the main navigation is viewed
   - Then a "Map" link is visible pointing to `/map`

2. **Active state on map page**
   - Given the user is on the `/map` page
   - When the navigation is viewed
   - Then the "Map" link shows an active/current state

3. **Logical navigation order**
   - Given the navigation items
   - When their order is reviewed
   - Then "Map" is positioned near other discovery features

4. **ZIP results include map link**
   - Given a user has entered a ZIP code and results are shown
   - When the results area is viewed
   - Then a "Find on map" or similar link to `/map` is present

5. **Map link not shown before results**
   - Given the ZIP lookup is in its initial state (no results)
   - When the component is viewed
   - Then no map link is displayed

6. **Map link styling is secondary**
   - Given the ZIP results with a map link
   - When the visual hierarchy is reviewed
   - Then the map link does not compete with primary actions (rep links, contact buttons)

## Metadata

- **Complexity**: Low
- **Labels**: ui, navigation, district-map
- **Required Skills**: Astro, React, CSS/Tailwind
