# Leonida Roadmap Planner

An offline trophy guide and tracker for Grand Theft Auto VI on PlayStation 5, built for the make.fun gta6-trophy-guide-01 bounty.

## What it is

A static web app, no build step, that covers all 55 official trophies — 1 platinum, 2 gold, 6 silver, 46 bronze, 28 hidden — each with its official name, description and grade, and a guide written for this entry in my own words. The guides are built only from the official descriptions: where a description does not pin down a place or a step, the guide says so plainly instead of inventing one.

## What it does

- **Tracker** — a checklist of all 55 trophies with a checkbox each. Progress is saved in the browser (localStorage), exportable to a JSON file and importable back.
- **Filters** — search by name or description, filter by kind (story, missable, collectibles, activities, grind) and by grade.
- **Spoiler mode** — hides the names and descriptions of hidden trophies until they are earned.
- **Platinum roadmap** — nine stages in play order: the four story chapters, the finale and platinum, the named story missions and character finales, the fourteen one-chance moments, cleanup, and the open-world activities. Each stage shows its trophies and how many you have earned.
- **Missable Watch** — all 31 flagged missable trophies in one place, with the point-of-no-return rule beside them.
- **Guide panel** — click any trophy to read its guide. The source line sits right under the description and badges, before the guide heading: every fact comes from the official PlayStation trophy list as published via Exophase and PSNProfiles, and the guide is written from the official description alone.
- **Shareable state** — the current view, filters, spoiler setting and open guide live in the URL hash, so a link reopens the same screen.

## Running it

```sh
node serve.ts
```

Then open http://localhost:8080 (or `node serve.ts --port <n>` for another port). It works with the network off: every file it loads sits under `app/`.

## Handing it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library. Outside the grader, `MAKEFUN_OUTPUT_DIR` stands in for `/output`.

## Files

- `app/index.html`, `app/style.css`, `app/app.js` — the guide itself.
- `app/data/trophies.json` — the 55 trophies with guides and sources.
- `main.ts` — the hand-in program (Node 22, standard library only).
- `serve.ts` — a small static server for local use.
- `shots.json` — the manifest for the four screenshots in `screenshots/`.
- `vendor/makefun-frontend.ts` — the kit's dossier library, unchanged.

## License

MIT — see `LICENSE`.
