# Democracy Direct

This is the source code for [democracy-direct.com](https://democracy-direct.com).

## Your representatives work for you

Elected officials are public servants. They represent *you*. But actually reaching them shouldn't require navigating five government websites, filling out invasive forms, or wondering if your message went into a void.

Democracy Direct makes it simple: enter your ZIP code, see who represents you, and contact them directly through their official channels. Use a community-contributed letter template or write your own. Copy it to your clipboard, paste it into their contact form, and you're done. Or print it out and drop it in the mail.

No account required. No app to download. No data harvested.

## Why this code is public

This project is open source because civic tools should be transparent. When a website asks for your information, you deserve to know exactly what happens to it.

The code in this repository is the same code running on democracy-direct.com. Anyone can read it, audit it, or run their own copy. There are no hidden trackers, no secret analytics, no background data collection that isn't visible right here.

**What you can verify by reading this code:**

Your email address is never stored. Accounts use a one-way cryptographic hash—the original email cannot be recovered, even by someone with full database access. This isn't a policy; it's math.

Your searches stay in your browser. When you enter a ZIP code, the lookup happens locally using data that's already loaded on the page. The server never sees what you searched for.

Your letters never touch the server. The text you write is copied to your clipboard and pasted into your representative's official contact form by *you*. Democracy Direct never sees, stores, or transmits what you write.

## Where the data comes from

Representative information comes from public sources maintained by government agencies and civic organizations:

Federal legislators are sourced from the [unitedstates/congress-legislators](https://github.com/unitedstates/congress-legislators) project, a public dataset maintained by volunteers and used by dozens of civic applications. Voting records come from [Congress.gov](https://api.congress.gov), the official Congressional database. State legislator data comes from [Open States](https://openstates.org), a nonpartisan nonprofit. ZIP code-to-district mapping comes from the [U.S. Census Bureau](https://www.census.gov/programs-surveys/decennial-census/about/rdo/congressional-districts.html).

This data is refreshed regularly. If something looks wrong, [open an issue](https://github.com/yourusername/democracy-direct/issues).

## Who runs this

Democracy Direct is an independent project. It is not affiliated with any political party, campaign, PAC, nonprofit, or government entity.

The project is funded entirely by donations. There are no ads, no sponsors, no "premium" features, and no data sales. Operating costs are minimal by design—the entire platform runs on free or near-free infrastructure.

## What the license means

The code is released under the AGPL-3.0 license. In practical terms: anyone can use, study, modify, and share this code. If someone takes this code, modifies it, and runs it as a public service, they're required to publish their modifications under the same license.

This ensures that Democracy Direct—or anything built from it—remains open and auditable. Civic infrastructure should stay in public hands.

## For developers

Technical documentation, setup instructions, and contribution guidelines are in [CONTRIBUTING.md](CONTRIBUTING.md).

---

Questions or concerns? Reach out at hello@democracy-direct.com
