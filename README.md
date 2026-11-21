[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/AlfianBagas225/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/AlfianBagas225/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

Bounty: https://make.fun/bounty/gta6-trophy-guide-01

# Leonida Roadmap Planner — GTA 6 Trophy Guide & Tracker

An offline web app that guides and tracks all 55 PlayStation 5 trophies of
Grand Theft Auto VI: 1 platinum, 2 gold, 6 silver, 46 bronze; 28 hidden.

## What it does

- **Checklist** — every trophy with its official name, description and grade,
  a checkbox saved in `localStorage`, and a detail pane with the guide and its
  sources. Filters by kind (story 18 / activity 26 / collectible 6 / grind 5),
  grade, missable-only, hide-earned, and free-text search.
- **Roadmap to the platinum** — 9 stages in play order
  (2 / 1 / 1 / 1 / 2 / 11 / 14 / 9 / 14 trophies), each with its own progress.
- **Missable (31)** — every hidden trophy, plus three more whose character or
  partner may not be around later, each with its roadmap stage.
- **Spoiler-free story** — with the spoiler setting on, story trophies stay
  hidden (name, description and guide) until earned.
- **Export / import** — progress downloads as JSON and imports back.
- **State in the URL hash** — view, filters, spoiler setting and the selected
  trophy are all shareable links.

## Sources and honesty

Each trophy's guide is written for this planner from its official description
alone, and cites its sources directly under the description, before the guide:
the Exophase GTA VI PS5 trophy list (official name, description, grade) and,
where PlayStation tracks a count, PSNProfiles (e.g. 42 Shooting Range
challenges, 500 choices for "Actions Speak Louder"). Where a description names
no place or step, the guide says so instead of inventing one. No Rockstar
Games logo or artwork is used; the look is our own.

## Try it

```
node serve.ts   # then open http://localhost:8080
```

No build step, no network at run time: every file the app loads is under
`app/`.

## Handing it in

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes
`dossier.json` with the kit's vendored `vendor/makefun-frontend.ts`.
Screenshots (4, first by name is the cover) are listed in `shots.json`.

## Files

- `app/index.html` — page shell: progress, views, toolbar
- `app/style.css` — the night-drive look
- `app/app.js` — data loading, filters, spoiler mode, storage, hash state
- `app/data/trophies.json` — the 55 trophies (11 keys each: id, name,
  description, grade, kind, missable, hidden, stage, count, guide, source)
- `main.ts`, `serve.ts`, `shots.json`
