# Democracy Direct: Vision & Philosophy

## Mission

Make civic engagement effortless, private, and accessible to everyone.

## The Problem

Contacting elected representatives is unnecessarily difficult:

1. **Fragmented information** - Finding who represents you requires navigating multiple government websites
2. **No direct email** - Representatives don't publish email addresses; contact forms are clunky
3. **Writer's block** - Most people don't know how to write an effective letter to their rep
4. **Privacy concerns** - Existing tools require accounts, track usage, or sell data
5. **Technical barriers** - Current solutions assume tech literacy that excludes many citizens

## Our Solution

A single platform that:

1. **Finds your representatives** - Enter ZIP code, see your senators, representative, governor, and state legislators
2. **Provides contact paths** - Phone numbers, contact form links, mailing addresses
3. **Offers letter templates** - Community-contributed templates for common issues, easily customizable
4. **Respects privacy** - No accounts required for core features; optional auth uses hashed emails only
5. **Works for everyone** - Simple interface that boomers, Gen X, millennials, zoomers, and Gen Alpha can all use

## Core Principles

### 1. Privacy by Default

- **No PII storage** - We never store email addresses (only SHA-256 hashes for optional auth)
- **No address storage** - ZIP code lookup happens client-side against static data
- **No message storage** - Letters are copied to clipboard; we never see or transmit them
- **No tracking** - No analytics tied to individuals; aggregate counts only

### 2. User Controls the Message

We facilitate contact but never touch the actual communication:

- Letters go to clipboard → user pastes into rep's contact form
- Phone numbers open the phone app → user makes the call
- Print option → user prints, signs, and mails

This means:
- We can't be subpoenaed for message content (we don't have it)
- Users maintain full control over what they send
- No risk of us being used as a spam vector

### 3. Transparent Data

All representative data comes from public sources:
- Congress.gov API (federal legislators, voting records)
- unitedstates/congress-legislators GitHub repo
- Open States API (state legislators)
- Census Bureau (ZIP-to-district mapping)

Data is cached locally with stale-while-revalidate pattern. Users can audit exactly where information comes from.

### 4. Community-Driven Templates

Templates are the heart of the platform:
- Anyone can contribute (with bot protection and moderation)
- Templates are forkable - customize for your situation
- No political bias in moderation - we only filter harmful content, not viewpoints
- Trust system rewards good contributors

### 5. Sustainable & Independent

- **Donation-supported** - No ads, no data monetization
- **Low operational cost** - Designed for $0-30/month hosting
- **No VC money** - No pressure to grow at all costs or monetize users
- **Open about limitations** - We tell users what we can't do

## What We Are

- A civic tool that makes contacting representatives easier
- A letter template library maintained by the community
- A privacy-respecting alternative to existing civic tech
- A resource for people who want to participate in democracy

## What We Are Not

- A lobbying platform
- A petition site
- A social network
- A voter registration service
- A campaign finance tracker
- A news source

## Design Philosophy

### For All Generations

| Generation | What they need |
|------------|----------------|
| Boomers | Clear navigation, readable text, phone-friendly |
| Gen X | Efficiency, no BS, works on first try |
| Millennials | Modern design, mobile-first, shareable |
| Zoomers | Fast, clean, doesn't feel like a government site |
| Gen Alpha | Simple, visual, works on any device |

### Accessibility

- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- High contrast mode
- No CAPTCHA puzzles (Turnstile is invisible)

### Performance

- Zero JavaScript by default (Astro)
- Interactive islands only where needed
- Static data cached aggressively
- Works on slow connections

## Privacy Stance

We believe civic participation should not require surveillance.

**What we can truthfully tell users:**

> "We do not store your email address. When you log in, we hash your email using SHA-256 and store only the hash. This allows us to recognize you when you return, but we cannot recover your email address from the hash."

> "We do not log your ZIP code lookups. The lookup happens entirely in your browser against data we've pre-loaded. We have no way to know what ZIP codes you've searched."

> "We never see your letters. When you click 'Send via Contact Form,' your letter is copied to your clipboard and we open your representative's contact form. The letter content never touches our servers."

**Threat model we address:**
- Government subpoena for user emails → We don't have them
- Data breach exposing user activity → Minimal data to expose
- Third-party tracking → No third-party scripts

## Moderation Philosophy

Templates are moderated for safety, not viewpoint:

**We reject:**
- Hate speech, slurs, calls for violence
- Harassment or threats
- Spam or commercial content
- Illegal content

**We allow:**
- Strong political opinions (left, right, or otherwise)
- Criticism of any politician or party
- Controversial but legal viewpoints
- Passionate advocacy

We use AI moderation (OpenAI + Perspective API) for initial screening, with human review for borderline cases. The goal is to catch genuinely harmful content without becoming political censors.

## Success Metrics

We measure success by:

1. **Usage** - People actually contacting their reps through us
2. **Template quality** - Community contributing useful templates
3. **Privacy preserved** - No data breaches, no regrettable data collection
4. **Accessibility** - People of all ages and abilities using the platform
5. **Sustainability** - Running costs covered by donations

We do NOT measure:
- User retention/engagement metrics
- Time on site
- Social shares
- Growth rate

## Long-Term Vision

Phase 1 (MVP): Federal representatives + letter templates
Phase 2: State legislators, voting records
Phase 3: Become the default "how do I contact my rep?" answer

We want to be boring infrastructure - the thing people use without thinking about it, like looking up a phone number used to be.

---

**Name:** Democracy Direct  
**Domain:** democracy-direct.com  
**Tagline:** Direct access to your democracy.
