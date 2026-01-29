# District Map Picker

## Problem Statement

Most people don't know their congressional district number. When a ZIP code spans multiple districts, asking users to choose between "District 5" and "District 6" is confusing - they have no way to know which one they live in without looking it up elsewhere. A visual map showing district boundaries would let users click on their location to identify their district intuitively.

## Research Needed

- [ ] Evaluate map libraries (Mapbox, Leaflet, Google Maps, MapLibre)
- [ ] Find congressional district boundary data (GeoJSON/TopoJSON)
  - Census Bureau TIGER/Line shapefiles
  - github.com/unitedstates/districts
- [ ] Evaluate hosting options for boundary data (static files vs tile server)
- [ ] Research reverse geocoding options (click → coordinates → district)
- [ ] Consider mobile UX for map interactions
- [ ] Evaluate bundle size impact of map libraries
- [ ] Research HTML Geolocation element for declarative location permissions
  - Modern browsers may support declarative permission prompts
  - Better UX than imperative `navigator.geolocation` API

## Open Questions

- Which map provider balances cost, features, and privacy?
- Should we use vector tiles or GeoJSON for district boundaries?
- How to handle the full US map vs zoomed state/region views?
- Should clicking the map be primary or secondary to ZIP lookup?
- How to make the map accessible for screen reader users?
- Can we use browser geolocation API as an option?

## Proposed Approach

_To be filled after research._

## Implementation Tasks

_To be filled after research._

### Use Cases

1. **Primary lookup alternative**: User clicks their location on map instead of entering ZIP
2. **ZIP disambiguation**: When ZIP spans multiple districts, show map zoomed to that area with district boundaries highlighted, let user click their location
3. **Geolocation option**: "Use my location" button that requests browser location and finds district

### UI Considerations

- Lightweight initial load (don't block page render)
- Clear district boundary visualization
- Mobile-friendly touch interactions
- Fallback for users who can't/won't use map
- Loading states while map/boundaries load

### Privacy Considerations

- Geolocation should be opt-in only
- Don't store or log user coordinates
- Consider privacy-respecting map tile providers

## Verification

- [ ] Map displays congressional district boundaries
- [ ] Clicking on map identifies correct district
- [ ] ZIP disambiguation shows relevant map section
- [ ] Works on mobile devices
- [ ] Accessible alternatives exist for non-map users
- [ ] Geolocation works when permitted
- [ ] Bundle size impact is acceptable
- [ ] Map loads without blocking page render
