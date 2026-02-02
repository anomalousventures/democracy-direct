---
name: sync-data
description: Run data sync scripts (legislators, zips, votes, templates)
disable-model-invocation: true
---

# Sync Data

Run data import/sync scripts for the democracy-direct database.

## Usage

`/sync-data [target]`

## Targets

| Target        | Command                   | Description                                        |
| ------------- | ------------------------- | -------------------------------------------------- |
| `legislators` | `pnpm import:legislators` | Import legislators from Congress API               |
| `zips`        | `pnpm import:zips`        | Import ZIP code to district mappings               |
| `votes`       | `pnpm sync:votes`         | Sync voting records from Congress.gov + Senate.gov |
| `templates`   | `pnpm seed:templates`     | Seed example templates                             |
| `all`         | Run all above             | Full data refresh                                  |

## Options

- `--force` - For votes sync, bypass time-based skip (12hr cooldown)
- `--congress N` - For votes sync, specify congress number

## Examples

```
/sync-data legislators
/sync-data votes --force
/sync-data all
```

## Requirements

- `DATABASE_URL` environment variable must be set
- `CONGRESS_API_KEY` required for legislators and votes
