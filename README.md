# SMALL TOWN PEST CONTROL

A no-build browser vertical slice for a systemic co-op pest-control game.

## [Play the public prototype](https://dumb-tony.github.io/pest-control/)

The static playtest is published directly from the root of `main`; no install, account, or build step is required.

## Play

Open `index.html` directly in a modern browser, or serve this folder with any static web server. No packages or build step are required.

1. Inspect highlighted evidence in the house.
2. Choose the animal that best fits the evidence.
3. Place a trap and barriers during preparation.
4. Start containment, then react to the raccoon's route.
5. Capture it before property damage or customer trust collapses.

Mouse controls are primary. Keyboard shortcuts: `1` inspect, `2` trap, `3` barrier, `Space` starts containment, `R` restarts. Buttons and instructions are also exposed as HTML for keyboard and screen-reader use.

Add `?seed=your-name` to the playtest URL to reproduce and share the same behavioral variation, for example `https://dumb-tony.github.io/pest-control/?seed=garage-night`.

## Project map

- `index.html` — accessible application shell
- `styles.css` — responsive presentation
- `game.js` — prototype state, simulation, rendering, and input
- `docs/GDD.md` — living game design document and decision log
- `docs/BUILD_PREP.md` — backlog, milestones, acceptance criteria, architecture, and implementation tasks
- `docs/STATE_AND_CONTROLS.md` — controls and state-machine specification
- `docs/QA_CHECKLIST.md` — manual test plan

## Prototype intent

This slice tests the risky part of the concept: whether reading evidence and shaping an animal's route creates legible, emergent chaos. It intentionally postpones character movement, online multiplayer, procedural houses, economy, and 3D physics.

## Repository and deployment policy

- The canonical local checkout is `C:\Dev\pest-control`.
- `main` is the primary branch and must remain playable as a static site.
- The public GitHub repository is named `pest-control`.
- GitHub Pages publishes the standalone prototype from the repository root without a build step.
- Design decisions and implementation changes must update `docs/GDD.md` when they affect the living design.
- Secrets, credentials, machine-specific settings, caches, and generated junk must never be committed.
