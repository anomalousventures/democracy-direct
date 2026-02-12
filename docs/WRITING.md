# Writing Guidelines — Democracy Direct

This document defines the voice, style, and conventions for all Democracy Direct content: product copy, blog posts, template descriptions, changelogs, social posts, and meta text (descriptions, alt text, error messages). It's written for both human authors and AI assistants. If this file is referenced in `CLAUDE.md` or an agent definition, treat it as binding.

## Foundational Voice

Democracy Direct inherits its voice from [Anomalous Ventures](https://anomalous.ventures), adapted for a civic audience. The core qualities carry over: first-person when Aaron is speaking, conversational, direct, technically honest, and allergic to marketing language. What changes is the audience and the stakes.

The Anomalous Ventures voice assumes the reader is a developer. Democracy Direct assumes the reader might be anyone: a parent researching school board decisions, a retiree calling their senator for the first time, a college student figuring out who represents them, or a developer auditing the source code. The voice has to work for all of them without talking down to any of them.

**The core tension to navigate:** Be trustworthy and serious about civic engagement without being preachy, self-important, or performatively earnest. This is a tool, not a movement. The tool works. Let that speak for itself.

## Voice by Content Type

### Product copy (landing page, feature descriptions, onboarding)

Clear, calm, confident. The reader might be skeptical (another civic tech project?) or anxious (am I going to get put on a list?). Address both without calling attention to either.

**Do this:**

> Enter your ZIP code, see who represents you, and contact them directly through their official channels.

> Your email address is never stored. Accounts use a one-way cryptographic hash. The original email cannot be recovered, even by someone with full database access. This isn't a policy; it's math.

**Not this:**

> Empower yourself to make your voice heard in the democratic process through our innovative civic engagement platform!

> We take your privacy seriously and employ industry-leading encryption standards to ensure your data remains safe and secure.

### Blog posts and changelogs

Aaron's voice. Same rules as the [Anomalous Ventures writing guide](https://github.com/anomalousventures/anomalous.ventures/blob/main/docs/WRITING.md) apply here: first-person, show the work, lead with the problem, be honest about tradeoffs. The audience difference is that DD blog posts may reach non-developers, so when the content gets technical, give a one-sentence plain-language version before (or instead of) the implementation details.

**Do this:**

> When you search for your ZIP code, that lookup happens entirely in your browser. The server never sees it. Here's how that works technically: we ship a JSON file with the page that maps ZIP codes to congressional districts...

**Not this:**

> The client-side lookup leverages a pre-loaded JSON dataset that maps ZIP codes to congressional districts via a binary search algorithm, eliminating server-side request overhead.

### Template descriptions and metadata

Neutral, factual, specific. Template descriptions tell the user what the letter says and who it's for. They don't editorialize about the issue. The template itself can (and should) have a point of view, but the description is a label, not an argument.

**Do this:**

> Urges your representative to oppose H.R. 1234, the proposed reduction in SNAP benefits. Includes specific data on food insecurity rates and the estimated impact on families in your district.

**Not this:**

> Fight back against the cruel and heartless attempt to strip food assistance from struggling families! Let your representative know you won't stand for this outrageous attack on the most vulnerable members of our community!

### Error messages and system text

Human, brief, helpful. Tell the user what happened and what they can do about it. Don't be cute. Don't blame them.

**Do this:**

> We couldn't find representatives for that ZIP code. Double-check the number, or try a nearby ZIP code.

> Something went wrong on our end. Your message wasn't sent. Try again in a minute, or copy your text and paste it directly into the contact form.

**Not this:**

> Oops! Looks like something went sideways! 😅 Don't worry though, we're on it!

> Error 500: Internal server error. Contact support.

### Social media and community posts

Conversational, direct, informational. Share what's new, what's coming, and what people can do. Don't beg for engagement. Don't use hashtag spam. Don't perform outrage or urgency unless something genuinely urgent is happening.

**Do this:**

> New templates up for the current appropriations debate. If you have opinions about where federal money goes (and you should), there's a letter for that now.

**Not this:**

> 🚨 BREAKING: We just dropped 5 AMAZING new templates! 🔥 Don't miss out! Like, share, and comment below! #CivicEngagement #Democracy #BeTheChange

## Rules

### Hard rules (never break these)

1. **No em-dashes.** Use parentheticals, commas, or restructure. Inherited from the AV guide. Still non-negotiable.

2. **No AI slop.** Banned words and patterns (unless in a direct quote or code):
   - "delve," "leverage," "utilize," "cutting-edge," "game-changer," "seamless," "empower," "elevate"
   - "In today's [adjective] landscape/world..."
   - "Let's dive in" / "Without further ado"
   - "Make your voice heard" (this one is specific to civic tech slop)
   - "Empower citizens" / "Strengthen democracy" / "civic duty"
   - Fake enthusiasm: "I'm thrilled to announce" / "Exciting news!"
   - Dramatic fragments: "Privacy. Transparency. Action."
   - Any sentence that could appear on a SaaS landing page or political campaign site without modification

3. **No em-dashes.** Yes, still listed twice.

4. **Non-partisan in product voice.** The platform doesn't take sides. Templates can and should have points of view, but product copy, descriptions, onboarding, and system text stay neutral. Aaron's blog posts can express personal political opinions (and do), but those are clearly Aaron speaking, not "Democracy Direct believes."

5. **Never overstate privacy claims.** Be precise about what the system does and doesn't do. "We never see your ZIP code" is true and verifiable. "Your data is completely safe" is a promise nobody can make. Stick to the first kind.

6. **No guilt or shame.** Don't guilt people into contacting their reps. Don't imply that not using the tool makes someone a bad citizen. The tool exists. It works. People will use it when they're ready.

### Soft rules (follow unless you have a good reason)

7. **Plain language first, technical details second.** If a sentence requires domain knowledge to understand, add a plain version. This applies to both civic process ("constituent services") and technical concepts ("SHA-256 hash").

8. **Short paragraphs.** 1-4 sentences. Especially important here because some users will be reading on phones while stressed about something political.

9. **Active voice.** "You can contact your representative" not "Your representative can be contacted."

10. **Specific over vague.** "700 people signed up in two weeks" not "our rapidly growing user base." Numbers, dates, and specifics build trust. Adjectives don't.

11. **Show, don't tell, on privacy.** Don't say "we value your privacy." Show the architecture. Link to the code. Explain the hashing. The README's privacy section is the template for this.

12. **Lowercase "democracy direct" in running text is fine.** The logo/brand uses title case. In a sentence, either works. Don't capitalize it like it's a Proper Noun every time unless it's starting a sentence or in a heading.

## Tone Calibration

**Too casual:** "yo check it out we got new templates lol"

**Too formal:** "Democracy Direct is pleased to announce the availability of new letter templates addressing current legislative priorities."

**Just right:** "New templates are up for the appropriations debate. Six letters covering different angles, from defense spending to education funding."

**Too preachy:** "In these trying times, it's more important than ever that every citizen exercise their sacred right to petition their government."

**Too detached:** "Templates have been added to the database. Users may access them via the browse interface."

**Just right:** "Most people don't contact their representatives because it's a pain, not because they don't care. That's the part we can fix."

## Humor

Same principles as the AV guide: earned through specificity and honesty. But more restrained in product copy. A blog post can be funny. An error message should be clear first and human second. A template description should never try to be funny.

Civic engagement is serious to the people doing it. Don't undercut that with jokes in the wrong place. But don't be so serious that the site feels like a government form either.

**Works:**

> ZIP code lookups happen in your browser. The server never sees what you search. If that sounds paranoid, you're welcome to read the source code. It's right there.

**Doesn't work:**

> We're so private we don't even know who you are! 😂 Take THAT, surveillance state!

## Structure

### Blog posts

Same structure as AV guide: hook first, problem statement, solution with specifics, honest tradeoffs, short close. For DD-specific posts, add context about why the feature matters for users (not just why it was interesting to build).

### Changelogs

Short, scannable, grouped by what users care about:

- What's new (features they'll notice)
- What's fixed (bugs they might have hit)
- What changed under the hood (brief, for the curious)

No version numbers in user-facing changelogs unless developers need them. Users don't care that this is v1.4.2. They care that ZIP code lookup is faster now.

### Template guidelines

Templates submitted by the community should:

- State a clear position (this is advocacy, not journalism)
- Include specific bill numbers, policy names, or data where relevant
- Be addressed to "Dear [Representative/Senator]" (the system fills in names)
- Be 200-500 words (long enough to make a point, short enough to actually get read)
- Close with a specific ask (vote yes/no, co-sponsor, hold a hearing, respond)
- Avoid personal attacks on specific politicians (criticize policy, not character)
- Include no threats, hate speech, or incitement

Template descriptions (the metadata, not the letter itself) follow the neutral voice described above.

## Words and Phrases

### Prefer

- "contact" (not "reach out to" or "engage with")
- "representative" or "rep" (not "elected official" unless distinguishing from appointed)
- "letter" or "message" (not "communication" or "correspondence")
- "use" (not "utilize" or "leverage")
- "because" / "so" (not "in order to")
- "your" (not "the user's" in product copy)
- "we" sparingly and only when it means the project/team, never the royal we

### Avoid

- "empower" / "elevate" / "amplify your voice"
- "stakeholders" (say who you mean)
- "civic duty" (implies guilt)
- "make a difference" (vague and overused)
- "in these unprecedented times"
- "passionate about democracy" (show it, don't say it)
- "user" in product copy (say "you" or "people")
- "simple" or "easy" (let the user decide if it's easy)
- "just" when minimizing effort ("just enter your ZIP code" implies they're dumb for not having done it already)

## Examples from Existing Content

These excerpts from the README and published content demonstrate the target voice:

**Privacy explanation that builds trust through specifics:**

> Your email address is never stored. Accounts use a one-way cryptographic hash. The original email cannot be recovered, even by someone with full database access. This isn't a policy; it's math.

**Stating what the tool does without overselling:**

> Democracy Direct makes it simple: enter your ZIP code, see who represents you, and contact them directly through their official channels.

**Moderation policy that's clear without being heavy-handed:**

> Templates are moderated for safety, not viewpoint. Hate speech, threats, and spam are removed. Strong political opinions (left, right, or otherwise) are welcome. Criticism of any politician or policy is permitted.

**Transparency without defensiveness:**

> This project is open source because civic tools should be transparent. When a website asks for your information, you deserve to know exactly what happens to it.

**Honest about motivation:**

> The thing that always gets me during times like these is feeling like there's nothing I can do about any of it. So I had a good think about what I actually can do.
