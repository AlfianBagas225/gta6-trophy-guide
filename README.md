[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/AlfianBagas225/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/AlfianBagas225/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

Bounty: https://make.fun/bounty/gta6-trophy-guide-01

# Leonida Roadmap Planner — GTA 6 Trophy Guide & Tracker

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI. Static files under `app/`, no build step, no network at run time: open `app/index.html` in desktop Chrome with the network off and everything works.

## What it does

- **Checklist of all 55 trophies** — official name, description and grade for each, saved in `localStorage`. Tick a trophy off and it stays ticked.
- **Guide for every trophy, in our own words, with its sources named** — each trophy's detail pane shows the source citation directly under its description and grade badge, before the Guide heading. Sources are the official list on Exophase (name, description, grade) and PSNProfiles where PSN lists a progress target. Where a description names no place or step, the guide says so instead of inventing one.
- **9-stage roadmap to the platinum** — 2 / 1 / 1 / 1 / 2 / 11 / 14 / 9 / 14 trophies: story chapters in order, then the named missions and stranger strands, activities, heists and one-offs, and the long grinds last.
- **31 missable trophies flagged** — a trophy is flagged missable when it is tied to a specific story mission, chapter or one-off event. Free-roam and repeatable trophies are not flagged.
- **Filters** — by kind (story / activity / collectible / grind), grade, missable-only, earned-only, and free-text search across names, descriptions and guides.
- **Spoiler mode** — hides the names and descriptions of the 28 hidden story trophies until they are earned.
- **Export / import** — progress exports to a JSON file and imports back. State (view, selected trophy, spoiler) also lives in the URL hash, so a link reopens the same view.

## The list at a glance

55 trophies: 1 platinum, 2 gold, 6 silver, 46 bronze; 28 hidden. Kinds: 18 story, 26 activity, 6 collectible, 5 grind. Counts come only from the trophy descriptions or PSN's own progress targets — 250 stunts, 42 Shooting Range challenges, 20 races, 8 stranger strands, 3 card sets, 100 WAiNK locations, 50 challenges, 3 shops, 100 vehicles, 5 enemies in one Combat Focus, 5 bank vaults, 500 choices, $250,000 laundered, $100,000 spent, 10 vehicles registered.

## Try it

```
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome.

## Hand in

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library. Screenshots (3 or 4, first by name is the cover) are real renders of this app in a browser, listed in `shots.json`.

## Sources

- Exophase — Grand Theft Auto VI trophy list: every official name, description and grade.
- PSNProfiles — Grand Theft Auto VI trophies: PSN progress targets where listed (42 Shooting Range challenges; 500 choices for Actions Speak Louder).
- Every guide is written in our own words from the official descriptions alone.

## License

MIT — see `LICENSE`. No Rockstar Games logo, artwork or screenshots are used; the look is our own.
