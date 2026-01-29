# Democracy Direct: Feature Implementation List

**Purpose:** Ordered list of features for TDD implementation via Ralph Wiggum loop.  
**Test Frameworks:** Vitest (unit/integration), Playwright (E2E)  
**Stack:** Astro + React + Tailwind + shadcn/ui + Neon (Postgres) + Cloudflare Pages

---

## Phase 0: Project Foundation

### 0.1 Project Scaffolding

- [x] Astro project initialized with React, Tailwind, Cloudflare adapter
- [x] TypeScript configured with strict mode
- [x] shadcn/ui initialized with default components
- [x] ESLint + Prettier configured
- [x] Vitest configured for unit tests
- [x] Playwright configured for E2E tests
- [x] Environment variables schema defined (.env.example)

**Tests:**

- Vitest: Config files exist and are valid
- Vitest: TypeScript compiles without errors
- Playwright: Dev server starts and renders homepage

### 0.2 Database Connection

- [x] Neon Postgres connection via `@neondatabase/serverless`
- [x] Database client singleton with connection pooling
- [x] Environment variable for `DATABASE_URL`
- [x] Health check endpoint `/api/health` returns DB status

**Tests:**

- Vitest: Database client connects successfully
- Vitest: Health endpoint returns `{ status: 'ok', db: 'connected' }`

### 0.3 Database Schema - Core Tables

- [x] `legislators` table created (bioguide_id PK, name, party, state, district, chamber, contact info, social links)
- [x] `zip_districts` table created (zip, state, district, proportion)
- [x] Indexes on `legislators(state, district)` and `zip_districts(zip)`

**Tests:**

- Vitest: Tables exist with correct columns
- Vitest: Can insert and query test legislator
- Vitest: Can insert and query test ZIP mapping

### 0.4 Database Schema - User Tables

- [x] `users` table created (id, email_hash, trust_level, approved_templates_count, saved_zip, saved_district, timestamps)
- [x] `email_otps` table created (id, email_hash, otp_hash, expires_at, used_at, created_at)
- [x] `sessions` table created (id, user_id FK, expires_at, created_at)
- [x] Indexes on `users(email_hash)`, `sessions(user_id)`

**Tests:**

- Vitest: Tables exist with correct columns and constraints
- Vitest: Foreign key from sessions to users works
- Vitest: Can create user with hashed email

### 0.5 Database Schema - Template Tables

- [x] `templates` table created (id, slug, title, body, issue_tags, user_id FK, is_public, forked_from, moderation fields, counters, timestamps)
- [x] `template_flags` table created (id, template_id FK, user_id, reason, details, timestamps)
- [x] `moderation_log` table created (id, template_id FK, action, admin_id, reason, scores, timestamp)
- [x] `user_templates` table created (user_id, template_id, bookmarked_at) for bookmarks
- [x] Indexes for common queries (public templates, moderation queue)

**Tests:**

- Vitest: All tables exist with correct schema
- Vitest: Can create template with all fields
- Vitest: Can flag a template
- Vitest: Cascade delete works (user deletion removes their templates)

### 0.6 CI/CD Pipeline

- [x] GitHub Actions workflow for CI
- [x] Run tests on PR and push to main
- [x] Run linting on PR and push to main
- [x] Run build on PR and push to main
- [x] TypeScript type checking

**Tests:**

- Workflow file exists at `.github/workflows/ci.yml`
- All jobs pass on current codebase

---

## Phase 1: Static Data & Basic Pages

### 1.1 Legislator Data Import

- [x] Script to fetch legislators from unitedstates/congress-legislators GitHub
- [x] Parse YAML files (legislators-current.yaml)
- [x] Transform to database schema
- [x] Upsert legislators to database
- [x] Script runnable via `pnpm run import:legislators`

**Tests:**

- Vitest: Parser correctly extracts fields from sample YAML
- Vitest: Upsert creates new records
- Vitest: Upsert updates existing records without duplicates
- Vitest: All 535+ current members imported

### 1.2 ZIP-to-District Data Import

- [x] Script to download Census ZCTA-to-CD relationship file
- [x] Parse CSV format
- [x] Calculate proportion of ZIP in each district
- [x] Insert into `zip_districts` table
- [x] Script runnable via `pnpm run import:zips`

**Tests:**

- Vitest: Parser handles CSV format correctly
- Vitest: Proportions calculated correctly for split ZIPs
- Vitest: Known ZIP codes return expected districts
- Vitest: ~41,000 ZIP codes imported

### 1.3 ZIP Data JSON Export

- [x] Script to export `zip_districts` to static JSON file
- [x] Output to `public/data/zip-districts.json`
- [x] Compressed/minified for production
- [x] Script runnable via `pnpm run export:zips`

**Tests:**

- Vitest: JSON file generated at correct path
- Vitest: JSON structure matches expected schema
- Vitest: File size reasonable (<5MB)

### 1.4 Homepage

- [x] Static Astro page at `/`
- [x] Hero section with tagline
- [x] ZIP code input form (client-side, no server submission)
- [x] Brief explanation of what the site does
- [x] Footer with links

**Tests:**

- Playwright: Homepage loads with 200 status
- Playwright: ZIP input field exists and is focusable
- Playwright: Footer links are present

### 1.5 About Page

- [x] Static Astro page at `/about`
- [x] Mission statement
- [x] Privacy explanation
- [x] Data sources listed
- [x] Contact information

**Tests:**

- Playwright: About page loads
- Playwright: Contains privacy section
- Playwright: Contains data sources section

### 1.6 Privacy Policy Page

- [x] Static Astro page at `/privacy`
- [x] Full privacy policy text
- [x] Explains what we do and don't collect
- [x] Last updated date

**Tests:**

- Playwright: Privacy page loads
- Playwright: Contains required sections (data collection, retention, rights)

---

## Phase 2: ZIP Lookup & Representative Display

### 2.1 Client-Side ZIP Lookup Logic

- [x] TypeScript module for ZIP lookup
- [x] Loads JSON data once, caches in memory
- [x] Returns single district if unambiguous (>95% proportion)
- [x] Returns multiple options if ambiguous
- [x] Returns error for invalid/unknown ZIP

**Tests:**

- Vitest: Single-district ZIP returns correct state/district
- Vitest: Split ZIP returns multiple options sorted by proportion
- Vitest: Invalid ZIP returns appropriate error
- Vitest: Data loads only once (caching works)

### 2.2 ZIP Lookup React Component

- [x] `ZipLookup` React component (island)
- [x] Input field with 5-digit validation
- [x] Loading state while fetching JSON
- [x] Error state for invalid ZIP
- [x] Disambiguation UI for split ZIPs
- [x] Redirects to results page on success

**Tests:**

- Playwright: Can enter ZIP and submit
- Playwright: Shows error for invalid ZIP (e.g., "00000")
- Playwright: Shows disambiguation for known split ZIP
- Playwright: Navigates to results page for valid ZIP

### 2.3 Representatives Results Page

- [x] Dynamic Astro page at `/zip/[zip]`
- [x] Fetches legislators for state/district from database
- [x] Displays 2 senators + 1 representative
- [x] Each rep shows: photo, name, party, title
- [x] Link to individual rep profile page

**Tests:**

- Playwright: Results page loads for valid ZIP
- Playwright: Shows correct number of representatives (3 for most ZIPs)
- Playwright: Each rep card has name and photo
- Playwright: Rep cards link to profile pages

### 2.4 Ambiguous ZIP Handler

- [x] Page handles ZIPs that span multiple districts
- [x] Shows district options with context (e.g., "District 5 - 60% of ZIP")
- [x] User selection updates results
- [x] Selection persisted in URL params or session

**Tests:**

- Playwright: Ambiguous ZIP shows selection UI
- Playwright: Selecting district updates representative list
- Playwright: URL reflects selected district

### 2.5 Representative Profile Page

- [x] Dynamic Astro page at `/rep/[bioguideId]`
- [x] Full legislator details from database
- [x] Photo (from bioguide/GPO)
- [x] Name, party, state, district, title
- [x] Term start date
- [x] All contact options displayed

**Tests:**

- Playwright: Profile page loads for valid bioguide ID
- Playwright: Shows all expected fields
- Playwright: 404 for invalid bioguide ID

### 2.6 Contact Options Display

- [x] Phone numbers displayed (DC office, district office if available)
- [x] Phone numbers are clickable `tel:` links
- [x] Contact form URL displayed as button
- [x] Social media links (Twitter, Facebook) if available
- [x] Mailing address displayed

**Tests:**

- Playwright: Phone links have correct `tel:` href
- Playwright: Contact form button exists if rep has form URL
- Playwright: Social links open in new tab

---

## Phase 3: Contact Flow

### 3.1 Letter Composer Component

- [x] `LetterComposer` React component (island)
- [x] Textarea for letter body
- [x] Character count display
- [x] Template variable substitution preview ({{REP_NAME}}, etc.)
- [x] "Use Template" button to load from template

**Tests:**

- Vitest: Can type in composer
- Vitest: Character count updates
- Vitest: Variable substitution shows preview

### 3.2 Clipboard Copy Functionality

- [x] "Copy to Clipboard" button
- [x] Uses Clipboard API with fallback
- [x] Toast notification on success
- [x] Error handling for clipboard failures

**Tests:**

- Vitest: Copy button exists
- Vitest: Clicking copy shows success toast
- Vitest: Clipboard API called with correct content

### 3.3 Contact Form Flow

- [x] "Send via Contact Form" button
- [x] Copies letter to clipboard
- [x] Opens rep's contact form in new tab
- [x] Shows instruction toast: "Letter copied! Paste into the form."

**Tests:**

- Vitest: Button triggers copy + new tab
- Vitest: Toast message appears
- Vitest: New tab opens correct URL

### 3.4 Print Letter Feature

- [x] "Print & Mail" button
- [x] Print-optimized CSS (`@media print`)
- [x] Letter formatted with:
  - User's return address fields (editable, client-side only)
  - Date
  - Rep's mailing address
  - Salutation
  - Letter body
  - Signature line
- [x] `window.print()` triggered

**Tests:**

- Vitest: Print button exists
- Vitest: Print preview contains all sections
- Vitest: Return address fields are editable
- Vitest: Print styles hide non-letter elements

### 3.5 Print Address Form

- [x] Form fields for user's return address (name, street, city, state, ZIP)
- [x] Fields stored in localStorage (never sent to server)
- [x] Pre-fills on subsequent visits
- [x] Clear button to reset

**Tests:**

- Vitest: Address fields exist and are editable
- Vitest: Values persist (localStorage)
- Vitest: Clear button removes stored values

---

## Phase 4: Authentication

### 4.1 Email Hash Utility

- [x] `hashEmail(email: string): string` function
- [x] Normalizes email (lowercase, trim)
- [x] Returns SHA-256 hex digest
- [x] Deterministic (same input = same output)

**Tests:**

- Vitest: Hash is consistent for same email
- Vitest: Hash differs for different emails
- Vitest: Normalization works (case, whitespace)

### 4.2 OTP Generation

- [x] `generateOTP(): { otp: string, otpHash: string }` function
- [x] Generates 6-digit numeric OTP
- [x] Returns both plain OTP (for email) and hashed OTP (for storage)
- [x] Uses cryptographically secure random

**Tests:**

- Vitest: OTP is 6 digits
- Vitest: OTP hash is SHA-256 format
- Vitest: Multiple calls generate different OTPs

### 4.3 OTP Request Endpoint

- [x] POST `/api/auth/request-otp`
- [x] Accepts `{ email: string }`
- [x] Validates email format
- [x] Creates OTP record in database (hashed)
- [x] Sends OTP via SES (email in memory only)
- [x] Returns `{ success: true }` (no info leakage)
- [x] Rate limited (5 requests per email per hour)

**Tests:**

- Vitest: Valid email creates OTP record
- Vitest: Invalid email returns 400
- Vitest: Rate limit triggers after 5 requests
- Vitest: Response doesn't reveal if email exists

### 4.4 OTP Verification Endpoint

- [x] POST `/api/auth/verify-otp`
- [x] Accepts `{ email: string, otp: string }`
- [x] Validates OTP against hashed stored value
- [x] Checks expiration (10 minutes)
- [x] Marks OTP as used
- [x] Creates or gets user record
- [x] Creates session (30-day expiry)
- [x] Returns session cookie

**Tests:**

- Vitest: Correct OTP creates session
- Vitest: Wrong OTP returns 401
- Vitest: Expired OTP returns 401
- Vitest: Used OTP cannot be reused
- Vitest: Session cookie set correctly

### 4.5 Session Middleware

- [x] Astro middleware checks session cookie
- [x] Validates session exists and not expired
- [x] Attaches user to `locals` context
- [x] Works for both pages and API routes

**Tests:**

- Vitest: Valid session attaches user
- Vitest: Expired session returns null user
- Vitest: Missing cookie returns null user
- Vitest: Invalid session ID returns null user

### 4.6 Logout Endpoint

- [x] POST `/api/auth/logout`
- [x] Deletes session from database
- [x] Clears session cookie

**Tests:**

- Vitest: Session deleted from database
- Vitest: Cookie cleared in response

### 4.7 Login Dialog Component

- [x] `LoginDialog` React component (shadcn Dialog)
- [x] Email input step
- [x] OTP input step (6 digit boxes)
- [x] Loading states
- [x] Error display
- [x] Success redirects or closes dialog
- [x] Privacy notice (email not stored)
- [x] Step transition animations

**Tests:**

- Playwright: Dialog opens from login button
- Playwright: Can enter email and submit
- Playwright: OTP step appears after email submission
- Playwright: Can enter OTP and complete login
- Playwright: Error shown for invalid OTP

### 4.8 Auth State in UI

- [x] Header shows "Sign In" when logged out
- [x] Header shows user indicator when logged in (no email shown)
- [x] "Sign Out" option when logged in
- [x] Auth state persists across navigation

**Tests:**

- Playwright: Logged out state shows Sign In
- Playwright: Logged in state shows user indicator
- Playwright: Sign out returns to logged out state

---

## Phase 5: Templates

### 5.1 Template List Page

- [x] Astro page at `/templates`
- [x] Lists public, approved templates
- [x] Shows title, first 100 chars of body, issue tags
- [x] Client-side search and filtering (replaced pagination)
- [x] Links to individual template pages

**Tests:**

- Playwright: Page loads with template cards
- Playwright: Search input exists and filters results
- Playwright: Template cards link to detail pages

### 5.2 Template Detail Page

- [x] Astro page at `/templates/[slug]`
- [x] Full template body displayed
- [x] Issue tags shown
- [x] "Use This Template" button
- [x] "Fork" button (if logged in)
- [x] View count incremented
- [x] Report button

**Tests:**

- Playwright: Page loads for valid slug
- Playwright: Template content displayed
- Playwright: Use Template button exists
- Playwright: 404 for invalid slug

### 5.3 Template Variable Substitution

- [x] Parse template for `{{VARIABLE}}` patterns
- [x] Supported variables: REP_TITLE, REP_NAME, REP_FIRST, REP_LAST, REP_PARTY, STATE, DISTRICT, USER_NAME, USER_CITY, TODAY_DATE
- [x] Preview shows substituted values
- [x] Unknown variables left as-is

**Tests:**

- Vitest: All supported variables substituted
- Vitest: Unknown variables not modified
- Vitest: Handles multiple occurrences

### 5.4 Use Template Flow

- [x] "Use This Template" links to homepage with template param
- [x] Template param passed through ZIP lookup → zip page → rep profile
- [x] Rep profile page loads template content and passes to ContactFlow
- [x] LetterComposer pre-fills with template content

**Tests:**

- Playwright: Use Template button exists and links correctly
- Vitest: ContactFlow accepts and passes initialTemplate to LetterComposer

### 5.5 Template Search

- [x] Search input on templates page
- [x] Searches title and body (client-side full-text)
- [x] Filter by issue tags
- [x] Results update as user types (instant, no debounce needed)

**Tests:**

- Playwright: Search input exists
- Playwright: Typing filters results
- Playwright: Tag filter works
- Playwright: No results state shown when appropriate

### 5.6 Template Creation Form

- [x] Page at `/templates/new` (no auth required)
- [x] Title input (required, 5-100 chars)
- [x] Body textarea (required, 50-10000 chars)
- [x] Issue tags multi-select
- [x] Turnstile widget (when configured)
- [x] Submit button
- [x] Anonymous templates treated as NEW_USER for moderation

**Tests:**

- Playwright: Anonymous user can access form
- Playwright: Form validates required fields
- Playwright: Can submit valid form

### 5.7 Template Creation Endpoint

- [x] POST `/api/templates`
- [x] Allows anonymous users (creates template without userId)
- [x] Validates Turnstile token (when configured)
- [x] Validates input (length, format, spam patterns)
- [x] Generates unique slug
- [x] Runs content moderation (Phase 6)
- [x] Saves with pending moderation_status
- [x] Anonymous templates use NEW_USER trust level for moderation
- [x] Returns created template

**Tests:**

- Vitest: Anonymous user can create template
- Vitest: Valid input creates template
- Vitest: Slug is unique
- Vitest: Anonymous template has null userId

### 5.8 Template Fork Feature

- [x] "Fork" button on template detail (requires auth)
- [x] Creates copy with forked_from reference
- [x] Opens in edit mode
- [x] New template has own slug

**Tests:**

- Playwright: Fork button requires login
- Playwright: Fork creates new template

### 5.9 My Templates Page

- [x] Page at `/templates/mine` (requires auth)
- [x] Auth only required for viewing own templates, not creating
- [x] Lists user's own templates
- [x] Shows moderation status for each
- [x] Edit and delete actions

**Tests:**

- Playwright: Redirects to login if not authenticated
- Playwright: Shows only current user's templates
- Playwright: Edit links to edit page
- Playwright: Delete removes template (with confirmation)

### 5.10 Template Edit

- [x] Page at `/templates/[slug]/edit` (requires auth, owner only)
- [x] Pre-filled form with existing values
- [x] Same validation as create
- [x] Saves changes

**Tests:**

- Playwright: Only owner can access edit page
- Playwright: Form pre-filled with existing values
- Playwright: Can update and save
- Playwright: Non-owner gets 403

### 5.11 Template Delete

- [x] DELETE `/api/templates/[slug]`
- [x] Requires auth and ownership
- [x] Hard delete implementation
- [x] Confirmation required in UI

**Tests:**

- Vitest: Unauthenticated returns 401
- Vitest: Non-owner returns 403
- Vitest: Owner can delete
- Playwright: Confirmation dialog shown

### 5.12 Rich Text Editor Enhancement (Optional)

- [ ] Replace plain textarea with Tiptap editor
- [ ] Markdown export for template storage
- [ ] Variable placeholder highlighting
- [ ] Toolbar with basic formatting (bold, italic, lists)

**Notes:** Tiptap recommended over Lexical for better Markdown support and faster integration

---

## Phase 6: Content Moderation

### 6.1 OpenAI Moderation Integration

- [x] Function to call OpenAI Moderation API
- [x] Accepts text content
- [x] Returns category scores and flagged boolean
- [x] Handles API errors gracefully

**Tests:**

- Vitest: API called with correct parameters
- Vitest: Response parsed correctly
- Vitest: Error handling works (mock failure)

### 6.3 Moderation Decision Logic

- [x] Function that takes API response
- [x] Returns decision: 'approve', 'reject', or 'review'
- [x] Rejection thresholds configurable
- [x] Review thresholds configurable
- [x] Logs reasoning

**Tests:**

- Vitest: Clear harmful content returns 'reject'
- Vitest: Clean content returns 'approve'
- Vitest: Borderline content returns 'review'
- Vitest: Thresholds respected

### 6.4 Basic Validation Layer

- [x] Validates before API calls (implemented in Phase 5)
- [x] Minimum length (50 chars)
- [x] Maximum length (10,000 chars)
- [x] No all-caps titles
- [x] Regex for obvious spam patterns

**Tests:**

- Vitest: Too short rejected
- Vitest: Too long rejected
- Vitest: All caps title rejected
- Vitest: Spam patterns rejected

### 6.5 Template Flag Endpoint

- [x] POST `/api/templates/[slug]/flag`
- [x] Accepts `{ reason: string, details?: string }`
- [x] Creates flag record
- [x] Hides template if flag count >= 3
- [x] Rate limited per user (1 flag per user per template)

**Tests:**

- Vitest: Flag created successfully
- Vitest: Template hidden after 3 flags
- Vitest: Rate limit prevents spam flagging

### 6.6 Trust Level System

- [x] New users: trust_level = 0
- [x] After 2 approved templates: trust_level = 1
- [x] Admin users: trust_level = 2 (set manually in database)
- [x] Banned users: trust_level = -1 (manual admin action via `/admin/users` only - NOT automatic on template rejection)
- [x] Trust level affects auto-publish threshold

**Trust Level Values:**

- `-1` = BANNED (manual admin action only, cannot create templates)
- `0` = NEW_USER (templates require moderation)
- `1` = TRUSTED (templates auto-approved if not flagged by AI)
- `2` = ADMIN (full access to admin features)

**Tests:**

- Vitest: New user has trust_level 0
- Vitest: Trust level increases after approvals
- Vitest: Banned user cannot create templates
- Vitest: Auto-publish logic respects trust level

---

## Phase 7: Admin Features

### 7.1 Admin Authentication Check

- [x] Middleware/utility to check admin status
- [x] Admin users identified by trust_level = 2 (set manually in database, no self-service admin creation)
- [x] Returns 403 for non-admins on admin routes

**Tests:**

- Vitest: Admin user passes check
- Vitest: Non-admin user fails check
- Vitest: Unauthenticated fails check

### 7.2 Admin Dashboard Page

- [x] Page at `/admin` (requires admin)
- [x] Summary stats: pending reviews, flagged items, users
- [x] Quick links to queues

**Tests:**

- Playwright: Non-admin redirected
- Playwright: Admin sees dashboard
- Playwright: Stats displayed

### 7.3 Moderation Queue Page

- [x] Page at `/admin/queue`
- [x] Lists templates with status 'pending_review' or 'flagged'
- [x] Shows template content, moderation scores, flags
- [x] Approve/Reject buttons

**Tests:**

- Playwright: Queue shows pending items
- Playwright: Can view template details
- Playwright: Approve moves to approved status
- Playwright: Reject moves to rejected status

### 7.4 Moderation Actions Endpoint

- [x] POST `/api/admin/moderate/[templateId]`
- [x] Accepts `{ action: 'approve' | 'reject', reason?: string }`
- [x] Updates template status
- [x] Creates moderation_log entry
- [x] Updates user trust level

**Tests:**

- Vitest: Approve updates status correctly
- Vitest: Reject updates status and logs reason
- Vitest: Moderation log created
- Vitest: User trust level updated

### 7.5 User Management Page

- [x] Page at `/admin/users`
- [x] List users with search
- [x] Shows trust level, template count, created date
- [x] Actions: adjust trust level, ban

**Tests:**

- Playwright: User list loads
- Playwright: Search filters users
- Playwright: Can change trust level

### 7.6 Tag Suggestions System

- [x] New `tag_suggestions` table (id, name, suggested_by, status, approved_by, timestamps)
- [x] Tag suggestion API endpoint (`/api/tags/suggest`)
- [x] Admin tag suggestions queue at `/admin/tags`
- [x] Approve/reject actions for suggested tags (`/api/admin/tags`)
- [x] Approved tags available via API (`/api/tags`)
- [x] Admin dashboard shows pending tags count

**Notes:** Core API and admin UI implemented. Future enhancement: add "Suggest a tag" input directly in template form.

**Tests:**

- Vitest: User can suggest new tag ✓
- Vitest: Suggested tag saved as pending ✓
- Vitest: Admin can approve/reject tags ✓
- Playwright: Admin tag management page exists ✓

---

## Phase 8: Polish & Production

### 8.1 Error Pages

- [x] Custom 404 page
- [x] Custom 500 page
- [x] Consistent styling with main site

**Tests:**

- Playwright: 404 page renders for invalid route
- Playwright: Error pages have navigation back to home

### 8.2 Loading States

- [x] Skeleton loaders for async content
- [x] Loading spinners on buttons during submission
- [x] Consistent loading patterns across site

**Tests:**

- Playwright: Loading states visible during slow operations
- Playwright: Loading states disappear when complete

### 8.3 Toast Notifications

- [x] Toast component (shadcn Sonner or similar)
- [x] Success, error, info variants
- [x] Auto-dismiss after 5 seconds
- [x] Used consistently for user feedback

**Tests:**

- Playwright: Toasts appear for key actions
- Playwright: Toasts auto-dismiss

### 8.4 SEO & Meta Tags

- [x] Title tags on all pages
- [x] Meta descriptions
- [x] Open Graph tags for sharing
- [x] Canonical URLs
- [x] robots.txt
- [x] sitemap.xml

**Tests:**

- Playwright: Pages have title tags
- Playwright: Meta descriptions present
- Vitest: Sitemap generated correctly

### 8.5 Analytics Setup (Optional)

- [ ] Privacy-respecting analytics (Plausible or Fathom)
- [ ] Page view tracking only
- [ ] No user identification

**Notes:** Optional - implement only if analytics needed. Privacy-first approach may prefer no analytics.

**Tests:**

- Playwright: Analytics script loaded (if configured)
- Vitest: No PII in analytics calls

### 8.6 Rate Limiting

- [x] Rate limiting on authentication endpoints (OTP: 5 requests/email/hour)
- [x] Database-backed rate limiting with privacy (uses email hash)
- [x] Turnstile CAPTCHA on template creation endpoints

**Notes:** OTP rate limiting implemented in `request-otp.ts`. Template creation protected by Turnstile CAPTCHA. Additional rate limiting can be added at Cloudflare edge if needed.

**Tests:**

- Vitest: Rate limit triggers after threshold ✓
- Vitest: OTP requests limited per email hash ✓

### 8.7 CORS Configuration

- [x] N/A - All API requests are same-origin
- [x] Default browser same-origin policy provides security
- [x] No cross-origin API access needed or desired

**Notes:** CORS not required. This is a server-rendered Astro app where all `/api/*` routes are same-origin. Default browser behavior correctly blocks cross-origin requests, which is the desired security posture for a privacy-focused platform.

### 8.8 Production Build

- [x] Build succeeds without errors
- [x] All static assets optimized
- [x] Environment variables validated at build time
- [x] Cloudflare Pages deployment works

**Tests:**

- Vitest: `pnpm build` succeeds
- Playwright: Production build serves correctly

### 8.9 Dynamic Page SEO Meta

- [ ] Representative profile pages (`/rep/[bioguideId]`) pass dynamic title, description, ogImage
  - Title: "Rep. [Name] ([Party]-[State]) | Democracy Direct"
  - Description: "Contact information for [Full Name], [Title] representing [State/District]"
  - ogImage: Use `https://theunitedstates.io/images/congress/450x550/{bioguideId}.jpg`
  - Fallback to `/og-default.png` if photo unavailable
- [ ] Template detail pages (`/templates/[slug]`) pass dynamic title, description
  - Title: "[Template Title] | Democracy Direct"
  - Description: First 150 chars of template body
  - ogImage: Branded template preview or fallback
- [ ] ZIP results pages (`/zip/[zip]`) pass dynamic title, description
  - Title: "Your Representatives for [ZIP] | Democracy Direct"
  - Description: "Find and contact your elected officials for ZIP code [ZIP]"
- [ ] Create branded OG image fallback (`public/og-default.png`, 1200x630)
- [ ] Verify all pages render correct meta in HTML source
- [ ] Test with Facebook Sharing Debugger and Twitter Card Validator

**Tests:**

- Playwright: Rep page has correct og:title containing rep name
- Playwright: Template page has correct og:description
- Playwright: ZIP page has correct title tag
- Vitest: OG image URLs are absolute and valid

---

## Phase 9: Security Hardening & Code Quality

### 9.1 OTP Rate Limit Info Leak Fix

- [x] Fix `request-otp.ts` to return success even when rate limited
- [x] Prevents email enumeration via rate limit error messages
- [x] Rate-limited requests should silently succeed (no OTP created/sent)

**Status:** Already implemented correctly in `src/pages/api/auth/request-otp.ts:65-66`. The code returns `{ success: true }` for ALL cases with comment "Always return success to prevent email enumeration".

**Tests:**

- Vitest: Rate-limited request returns 200 with `{ success: true }`
- Vitest: No OTP record created when rate limited
- Vitest: No email sent when rate limited

### 9.2 Magic Number Cleanup

- [x] Replace magic number `1` with `TRUST_LEVELS.TRUSTED` in `decision.ts`
- [x] Replace magic number `< 0` with `=== TRUST_LEVELS.BANNED` in `decision.ts`
- [x] Replace magic number `0` with `TRUST_LEVELS.NEW_USER` in `fork.ts`
- [x] Use constants from `trust-level.ts` consistently

**Tests:**

- Vitest: All trust level comparisons use named constants

### 9.3 HTTP Status Code Correction

- [x] Change "already flagged" response from 429 to 409 Conflict
- [x] 429 should only be used for actual rate limiting
- [x] Review other endpoints for correct status codes

**Tests:**

- Vitest: Duplicate flag returns 409 Conflict
- Vitest: 429 only returned for rate limit scenarios

### 9.4 Perspective API Integration (Optional)

- [x] Decision: Not implementing - OpenAI Moderation API is sufficient
- [x] Removed `PERSPECTIVE_API_KEY` from `.env.example`

**Note:** OpenAI Moderation API provides comprehensive content moderation. Perspective API would add complexity without significant benefit for this use case.

### 9.5 Site-Wide Design Review

- [x] Review all pages for consistent styling
- [x] Check responsive design on mobile/tablet/desktop
- [x] Verify accessibility (WCAG 2.1 AA)
- [x] Review copy for clarity and consistency
- [x] Test all interactive elements

**Accessibility Improvements (2026-01-28):**

- Added skip-to-main-content link in Layout.astro
- Added `id="main-content"` to all page `<main>` elements
- Added `aria-pressed` to toggle buttons (tag filters in TemplateSearch and TemplateForm)
- Added `aria-invalid` and `aria-describedby` to form inputs with validation errors
- Wrapped tag groups in `<fieldset>` with `<legend>` for screen readers
- Added `aria-atomic="true"` to toast notifications
- Added `:focus-visible` outlines to `.btn-primary`, `.btn-civic`, and `.btn-civic-secondary`

**Tests:**

- Playwright: Visual regression tests for key pages
- Lighthouse: Accessibility score > 90

### 9.6 Security & Code Review

- [ ] Audit all API endpoints for proper auth checks
- [ ] Review input validation across all forms
- [ ] Check for SQL injection, XSS vulnerabilities
- [ ] Verify rate limiting on sensitive endpoints
- [ ] Code simplification pass for maintainability

**Tests:**

- Vitest: Security-focused test suite
- Manual: Penetration testing checklist

### 9.7 Tiptap Rich Text Editor (Optional)

- [ ] Replace plain textarea with Tiptap editor in LetterComposer
- [ ] Basic formatting: bold, italic, lists
- [ ] Export to plain text for contact forms
- [ ] Preserve Markdown-style variable syntax ({{VAR}})

**Tests:**

- Vitest: Tiptap component renders and handles input
- Playwright: User can format text and variables still work

---

## Completion Criteria

All phases complete when:

1. All checkboxes checked
2. All tests passing (Vitest + Playwright)
3. Test coverage > 80%
4. Build succeeds for Cloudflare Pages
5. No TypeScript errors
6. No ESLint errors

Output `<promise>DONE</promise>` when all criteria met.
