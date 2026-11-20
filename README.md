[![GTA VI Trophy Guide](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Rank](https://make.fun/badge/gta6-trophy-guide-01/Huaminyo/gta6-trophy-guide-01-huaminyo-v2/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Reward](https://make.fun/badge/gta6-trophy-guide-01/Huaminyo/gta6-trophy-guide-01-huaminyo-v2/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

# The Leonida Field Manual

An offline guide and tracker for the 55 PlayStation 5 trophies of
Grand Theft Auto VI — every guide cited, every missable flagged, a
roadmap to the platinum. Built for the
[make.fun bounty](https://make.fun/bounty/gta6-trophy-guide-01).

## What it is

- **Tracker** — the full official list (1 platinum, 2 gold, 6 silver,
  46 bronze) with check-off progress, points, search, and filters by
  grade, kind, phase and missable status. Progress lives in the browser.
- **Guides** — every trophy has a guide in our own words with numbered
  steps, each guide naming the sources it was built from. Where sources
  disagree, the disagreement is shown and a call is made in the open.
- **Count trackers** — the 29 trophies with a count get a stepper
  (0 / N) so long grinds stay measured.
- **Roadmap** — four phases to the platinum, about 200 hours, with the
  trophies and points of each phase.
- **100% checklist** — the completion counts, with the confirmed list.
- **Routes** — fifteen efficient routes through the grind, staged.
- **Sources & disputes** — fifteen cited sources, nine open disputes
  with both sides and the call.
- **Missables** — the six trophies that can be missed, with their
  warnings up front.
- **Spoiler setting** — the 28 hidden trophies stay covered until
  revealed, on every tab.
- **Demo run** — one click checks the 18-trophy story-run set (345 PTS)
  so the tracker can be tried at a glance.

## Audit strip

The strip at the top of every page is computed from the data, not
typed in: 55/55 official, 160/160 steps cited, 32 backed 2+, 15
sources, 9 disputes, 29 count trackers, 28 hidden, demo 18/55,
345/1,350 PTS.

## Run it

Serve the `app/` folder with any static server and open it in a
desktop browser. The app fetches nothing — it reads only its own
local files.

```sh
cd app && python3 -m http.server 8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory
and writes `dossier.json` with the vendored make.fun library.

## License

MIT — see [LICENSE](LICENSE).
