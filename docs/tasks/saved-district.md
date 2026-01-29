# Saved District Preference

## Problem Statement

Users who have identified their congressional district through ZIP lookup or map selection shouldn't have to repeat this process every time they visit. Authenticated users should be able to save their district to their profile for a streamlined experience, with the ability to clear or change it if they move.

## Research Needed

- [x] Review current user schema for existing district fields
  - `savedZip` and `savedDistrict` already exist in users table
- [ ] Determine if we need `savedState` or can derive from ZIP
- [ ] Review current session/auth flow for where to prompt saving
- [ ] Consider UX for "Remember my district" opt-in

## Open Questions

- Should saving district be opt-in (checkbox) or automatic for logged-in users?
- Where in the flow should we prompt to save? (after lookup, on profile page, both?)
- Should anonymous users get localStorage-based saving as a lighter alternative?
- How to handle users who move to a new district?
- Should we show "You're viewing reps for [saved district]" indicator?

## Proposed Approach

_To be filled after research._

## Implementation Tasks

_To be filled after research._

### Database Changes

- Schema already has `savedZip` and `savedDistrict` columns in users table
- **Only use `savedDistrict` (and add `savedState`) - do NOT save ZIP**
- ZIP is unnecessarily precise; state+district is sufficient to identify reps
- May need migration to add `savedState` column

### API Changes

- `POST /api/user/district` - Save district preference
- `DELETE /api/user/district` - Clear district preference
- Include saved district in session/user context

### UI Changes

- "Remember my district" checkbox after successful lookup
- Profile page section showing saved district with "Clear" button
- Skip ZIP lookup and go directly to reps if district is saved
- "Change district" option for users with saved preference
- Indicator showing which saved district is being used

### Privacy Considerations

- **Never save ZIP code** - too close to address, unnecessary precision
- State + district is sufficient (identifies ~750k people, not a neighborhood)
- Make saving opt-in with clear explanation
- Easy to clear at any time

## Verification

- [ ] Logged-in user can save their district after lookup
- [ ] Saved district persists across sessions
- [ ] User can clear saved district from profile
- [ ] User with saved district skips lookup flow
- [ ] User can change their saved district
- [ ] Anonymous users are not prompted to save
- [ ] Clear messaging about what is being stored
