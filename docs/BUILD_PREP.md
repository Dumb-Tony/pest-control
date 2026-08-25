# Build Preparation Package

## Prioritized prototype backlog

### P0 — core proof

- [x] Phase flow: briefing, investigation, diagnosis, preparation, containment, result
- [x] Clickable evidence and evidence log
- [x] Three-species diagnosis choice with feedback
- [x] Placeable live trap and route barriers
- [x] Raccoon room-graph behavior
- [x] Attic-to-nursery-to-kitchen escape cascade
- [x] Capture, escape, property damage, trust, and budget results
- [x] Restart and concise instructions
- [ ] Replace native randomness with seeded PRNG and show seed
- [ ] Add visualized sound cues and simple procedural audio
- [ ] Make barriers target door edges explicitly rather than room zones
- [ ] Add one automated simulation test per acceptance route

### P1 — validate breadth

- [ ] Add post-capture exclusion: identify and seal soffit entry
- [ ] Add contamination cleanup with time/supply tradeoff
- [ ] Add rat behavior: group count uncertainty, wall routes, trap learning
- [ ] Add second property topology (diner kitchen + basement)
- [ ] Add resident/dog incident card
- [ ] Add daily seeded work order and local best grade
- [ ] Split `game.js` into data/state/sim/render/input/audio modules
- [ ] Add reduced-motion game setting and full keyboard canvas navigation

### P2 — migration proof

- [ ] Unity one-room interaction gym
- [ ] ScriptableObject schemas mirroring browser content IDs
- [ ] Raccoon NavMesh/off-mesh-link locomotion spike
- [ ] Two-player host-authoritative command/event network test
- [ ] Controller and Steam Input pass
- [ ] Persistent town-state schema and save versioning spike

## Milestone plan

| Milestone | Outcome | Exit gate |
|---|---|---|
| M0 Core loop | One complete raccoon job | All vertical-slice criteria below pass |
| M1 Readability | Players explain why each breach happened | 4/5 blind testers correctly recount route cause |
| M2 Replayability | Two species × two sites | At least four meaningfully distinct viable plans |
| M3 Closeout | Capture, exclusion, cleanup, invoice | Quality vs speed creates a real choice |
| M4 Co-op proof | Two players coordinate separate jobs | Parallel action helps without mandatory role lock |
| M5 Unity gate | 3D networked interaction gym | Animal/door/trap states remain authoritative and readable |

## Vertical-slice acceptance criteria

1. A new player can begin without reading external documentation.
2. At least three evidence items can be discovered and logged.
3. Evidence makes raccoon more defensible than rat or squirrel.
4. The player can place at least one live trap and two barriers.
5. Starting containment causes the animal to move according to open routes and attractions.
6. A trap in the garage plus a nursery barrier can produce a clean capture.
7. Poor preparation can cause attic → nursery → hall/kitchen movement.
8. At least one live containment decision can recover a deteriorating route.
9. Damage and trust change immediately with named causes in the event log.
10. Capture and escape both reach a clear result screen with grade and restart.
11. The job is completable in five minutes by an informed player.
12. The prototype runs from static files with no dependencies or build step.

## Suggested production folder/module structure

```text
pest-control/
  index.html
  styles.css
  src/
    main.js
    content/
      species.js
      tools.js
      properties.js
      jobs.js
    state/
      game-state.js
      commands.js
      events.js
      reducer.js
    simulation/
      animal-brain.js
      routing.js
      incidents.js
      scoring.js
      seeded-random.js
    view/
      canvas-renderer.js
      hud.js
      input.js
      audio.js
    accessibility/
      captions.js
      settings.js
  tests/
    simulation.test.js
    acceptance.test.js
  docs/
    GDD.md
    BUILD_PREP.md
    STATE_AND_CONTROLS.md
    QA_CHECKLIST.md
```

Keep the first playable in a single `game.js` until rules stabilize. Split only at v0.2, preserving command/event names.

## Data contracts (draft)

```js
SpeciesDef = { id, name, evidenceTags, locomotionTags, senses, weights, stressThresholds }
RoomDef = { id, label, rect, tags, value, occupants, evidenceIds }
EdgeDef = { id, a, b, traversalTags, strength, blocked, incidentId }
ToolDef = { id, placementTags, cost, strength, attracts, speciesTags }
JobDef = { id, propertyId, speciesId, evidenceSet, constraints, startingMeters, incidents }
GameEvent = { seq, at, type, actorId, targetId, values, message }
```

All IDs are stable lowercase strings. Saves reference IDs, never array positions. Schema versions migrate forward.

## Next implementation tasks

1. Add a tiny seeded PRNG and expose `?seed=` so route failures reproduce.
2. Extract the adjacency graph and raccoon scoring into pure functions.
3. Add headless tests for clean capture, nursery breach, kitchen damage, and exterior escape.
4. Render barriers on exact door edges and show “weakening” before failure.
5. Add three spatial sound cues (scratch, thump, trap snap) with text equivalents.
6. Add exclusion/cleanup closeout: seal soffit, bag contamination, choose when to leave.
7. Run five blind tests; record first-click time, diagnosis confidence, containment cause recall, recovery rate, and session length.
8. Update GDD decision log from findings before adding the rat job.

## Telemetry for playtests

Log seed, phase durations, evidence order, diagnosis, placements, every route score/choice, damage events, emergency barriers, capture/escape, final meters, restart count, and whether instructions were opened. Store locally only during prototype testing and offer export as JSON.

