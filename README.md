# Leonida Roadmap Planner — GTA 6 Trophy Guide

[![gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![Rank](https://make.fun/badge/gta6-trophy-guide-01/AlfianBagas225/gta6-trophy-guide/rank.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![Reward](https://make.fun/badge/gta6-trophy-guide-01/AlfianBagas225/gta6-trophy-guide/reward.svg)](https://make.fun/c/gta6-trophy-guide-01)

An offline, open-source platinum roadmap and tracker for the 55 PlayStation 5 trophies of Grand Theft Auto VI. No build step, no network at run time: serve `app/` with any static server and open `app/index.html`.

## What it is

**Roadmap-first, not a flat table.** The guide is built around a 9-stage platinum roadmap: Chapters 1–4, the finale, story missions and character finales, the one-chance moments, cleanup (collectibles and 100% completion), and the activities and open-world grinds. Each stage shows its trophies and earned/total progress, and clicking a stage jumps to its next unearned trophy.

**Tracker.** A checklist of all 55 trophies with official name, description, grade, kind, PSN count where PlayStation tracks one, and a missable flag. Progress saves in the browser (localStorage) and can be exported to a JSON file and imported back. Filters by kind (story, missable, collectibles, activities, online), by grade, and by text search. A spoiler toggle hides story trophy names and descriptions until they are earned.

**Missable watch.** 31 trophies are flagged missable: the 17 story chapter, mission and character-finale trophies, and 14 one-chance moments. Each carries a point-of-no-return warning in its detail panel, and the Missable Watch view lists all 31 in one place. The rule the roadmap is built on: finish a chapter's flagged trophies before the chapter ends, and do a flagged moment the first time it appears.

**Detail panel.** Clicking any trophy opens its guide beside the list, with its sources named beside it.

## The data — and what it does not claim

Every trophy's name, description and grade is the official PlayStation list as published (via Exophase and PSNProfiles, frozen 2026-11-18): 1 platinum, 2 gold, 6 silver, 46 bronze, 28 hidden. Counts are the targets the official descriptions state (42 Shooting Range challenges, 100 WAiNK locations, 52 areas of Leonida, and so on).

Every guide is written for this entry, in our own words, from the official description alone. Where the description does not pin down a place or a step, the guide says so instead of inventing one — a cited, honest general guide beats a fabricated specific. Each guide names its source beside it: the official list via Exophase and PSNProfiles. Hidden flags mark the story and secret trophies PlayStation hides until earned; kinds and roadmap stages are built from the official descriptions. The game has no online trophies in its list, so the online filter correctly shows none.

No Rockstar logo, official artwork, box art or game screenshot is used anywhere; the look is our own.

## Use it

```sh
node serve.ts        # serves app/ on http://localhost:8080
```

State lives in the URL hash, so a link always shows the same view: `#view=roadmap`, `#view=missable`, `#filter=missable`, `#spoiler=on`, `#open=33`, `#grade=silver`.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library. Screenshots are real renders of the app in Chromium at 1280×800, taken with Playwright; `shots.json` records the view each one shows.

## License

MIT — see `LICENSE`.
