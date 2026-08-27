# SMALL TOWN PEST CONTROL

A no-build Three.js browser vertical slice for a systemic co-op pest-control game.

## [Play the public prototype](https://dumb-tony.github.io/pest-control/)

The static playtest is published directly from the root of `main`; no install, account, or build step is required.

Sending it to someone? Share the [short friend playtest guide](docs/PLAYTEST_GUIDE.md) with the game link so feedback includes the seed and final job report.

## Play

Play through the public link, or serve this folder with any static web server. ES modules require an HTTP address rather than opening `index.html` directly; no packages or build step are required.

1. Inspect highlighted evidence in the house.
2. Choose the animal that best fits the evidence.
3. Place a trap and barriers during preparation.
4. Start containment, then react to the raccoon's route.
5. Capture it before property damage or customer trust collapses.
6. Seal the entry point, clean the affected room, and submit the completed job.

Move the technician with `WASD`, arrow keys, or the on-screen movement pad. Drag the scene to turn the over-the-shoulder camera. Walk close to glowing evidence or a room target before tapping it. Use `E` or the center movement-pad button beside the garage ladder to climb into or out of the attic. Keyboard shortcuts: `1` inspect, `2` trap, `3` barrier, `4` exclusion patch, `5` HEPA cleanup, `Space` starts containment, and `R` restarts.

Add `?seed=your-name` to the playtest URL to reproduce and share the same behavioral variation, for example `https://dumb-tony.github.io/pest-control/?seed=garage-night`.

Use **Copy job link** to send the current seed to a friend. The sound toggle controls lightweight procedural cues; every cue also has a visible caption or field-log event.

## Project map

- `index.html` — accessible application shell
- `styles.css` — responsive presentation
- `game.js` — prototype state, simulation, UI, and job rules
- `scene3d.js` — Three.js clay-world renderer, avatar, camera, picking, and scene props
- `docs/GDD.md` — living game design document and decision log
- `docs/BUILD_PREP.md` — backlog, milestones, acceptance criteria, architecture, and implementation tasks
- `docs/STATE_AND_CONTROLS.md` — controls and state-machine specification
- `docs/QA_CHECKLIST.md` — manual test plan
- `docs/PLAYTEST_GUIDE.md` — spoiler-light instructions and feedback questions for friends

## Prototype intent

This slice tests the complete solo job inside a connected stylized 3D property: enter through the porch, walk between enclosed rooms, climb a garage ladder into the attic, read evidence at close range, shape the animal's route, recover from containment failures, remove it, seal the opening, clean contamination, and settle the job. It intentionally postpones online multiplayer, procedural houses, persistent economy, and freeform 3D physics.

## Repository and deployment policy

- The canonical local checkout is `C:\Dev\pest-control`.
- `main` is the primary branch and must remain playable as a static site.
- The public GitHub repository is named `pest-control`.
- GitHub Pages publishes the standalone prototype from the repository root without a build step.
- Design decisions and implementation changes must update `docs/GDD.md` when they affect the living design.
- Secrets, credentials, machine-specific settings, caches, and generated junk must never be committed.
