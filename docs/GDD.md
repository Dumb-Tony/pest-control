# SMALL TOWN PEST CONTROL — Living GDD

**Status:** v0.1 playable browser slice  
**Last updated:** 2026-08-25  
**Long-term target:** 2–5 player co-op, 3D Unity/Steam  
**Immediate target:** a 10–15 minute, no-build browser prototype

**Repository policy:** The canonical checkout is `C:\Dev\pest-control`, versioned on the `main` branch of the public `pest-control` GitHub repository. The root of `main` must stay deployable as the GitHub Pages playtest with no build step. This GDD is living, version-controlled project source and must change alongside material design decisions.

## Premise and player fantasy

A small-town pest-control crew takes messy calls where the customer is sure something is “in the walls” but rarely knows what. Players inspect ordinary buildings, interpret imperfect evidence, choose a response, and then physically contain, capture, exclude, clean, and remove animals while the property pushes back.

The fantasy is not extermination power. It is competent, improvised teamwork: arriving with a van full of imperfect tools, reading a building, forming a plan, and somehow keeping the attic raccoon from dropping through a ceiling into a birthday party. Humor is the honest result of interacting systems and recoverable mistakes.

## Audience and session shape

- Players who enjoy readable co-op chaos: *PlateUp!*, *Overcooked*, *Phasmophobia*, *Moving Out*, *PowerWash Simulator*, and *Human: Fall Flat*.
- Friendly rather than graphic. Animal welfare and humane removal are default.
- Long-term sessions: 20–35 minute jobs, with 1–4 jobs forming a 60–120 minute town shift.
- Browser slice: one 10–15 minute solo job with instant restart.
- Solo must be viable through tool swapping and generous pause/planning. Co-op increases parallel capacity, not raw necessity.

## Design pillars

1. **Diagnose before acting.** Evidence narrows possibilities, but players decide when they know enough.
2. **Shape behavior, do not script outcomes.** Light, noise, food, barriers, openings, and stress influence animal decisions.
3. **Legible cascading chaos.** Every escalation has an observable cause, warning, consequence, and recovery option.
4. **Tools combine physically.** Simple tools gain depth through placement, timing, environment, and interference.
5. **The town remembers.** Damage, trust, repeat customers, and exclusion quality affect later calls.

## Core gameplay loop

**Dispatch → inspect → diagnose → prepare → contain/capture → exclude/clean → settle job → improve crew/town → next dispatch**

At the job scale:

1. Customer briefing supplies claims, constraints, and known hazards.
2. Crew searches rooms and exterior entry points for evidence.
3. Players log a likely species and select a humane response.
4. Crew places traps, closes doors, blocks routes, protects valuables, and assigns roles.
5. Disturbance begins. The animal evaluates routes and reacts continuously.
6. Crew improvises when containment fails: close a new route, reposition a trap, calm a customer, or accept damage to secure capture.
7. Crew removes the animal, seals entry points, cleans contamination, and invoices the job.

## Moment-to-moment interactions

Long-term 3D verbs: walk, crouch, carry, inspect, photograph, listen, probe, place, rotate, bait, arm, open/close, brace, sweep, vacuum, disinfect, patch, climb, drive, grab, and release. A player can carry one bulky item or two small tools. Most actions are readable holds or short progress interactions that can be interrupted.

The browser slice compresses these into cursor-based inspection and placement. Clicking evidence reveals a clue. Clicking rooms with a selected tool places traps or barriers. During containment, new barriers may be placed as a limited emergency response.

## Systemic simulation

### Animal model

Each species is a data-defined behavior package:

- Needs: escape, shelter, food, offspring, group cohesion.
- Senses: sight cone, hearing radius, smell attraction, vibration sensitivity.
- Temperament: freeze/flee/fight thresholds, curiosity, persistence, habituation.
- Locomotion tags: climb, squeeze, burrow, fly, swim, chew.
- Memory: visited danger, known exits, bait suspicion, home location.
- Stress: rises from proximity, noise, light, blocked routes, and failed traps; alters risk tolerance.

The browser raccoon uses a compact utility model: it scores adjacent rooms by exit value, safety, bait, stress, occupancy, and route blockage. It re-evaluates after each move. If its preferred attic route is blocked, it may choose the ceiling breach into the nursery, creating the intended cascading escape state.

### Building model

Rooms are nodes; doors, vents, wall voids, roofs, crawlspaces, and utility penetrations are edges. Edges have size, material, open/closed state, damage, noise transmission, and species traversal tags. Objects expose affordances such as breakable, climbable, hideable, edible, powered, wet, hot, or customer-valued.

### Legibility contract

Escalation should follow: **tell → cause → reaction → consequence → recovery**. The UI calls out heard movement, visibly marks the raccoon's next route, names damage when it occurs, and keeps emergency barriers available. Randomness may choose among plausible routes but never bypass rules.

## Species differentiation

- **Raccoon:** climbs, opens weak closures, protects den/young, raids food, panics into living space when cornered.
- **Rats:** use wall networks, travel in groups, learn trap danger, chew new routes.
- **Squirrels:** daylight-active, fast, leap across gaps, repeatedly return to nests.
- **Bats:** colony behavior, darkness/airflow navigation, protected-season constraints, exclusion timing.
- **Wasps:** nest-centered aggression, temperature/activity cycle, swarm response to vibration.
- **Skunk:** slow and readable, spray cone creates contamination and customer panic.
- **Beaver:** outdoor water/wood simulation; reroutes flow and undermines infrastructure.

No species is merely a reskinned speed/health value.

## Tools and vehicles

### Investigation

Flashlight, headlamp, inspection mirror, camera, trail camera, UV light, listening device, moisture meter, track powder, ladder, probe, and evidence bags.

### Control and removal

Species-sized live traps, one-way doors, catch poles, nets, transfer cages, blankets, bait, deterrent light/noise, temporary barriers, door wedges, and protective equipment. Tools can be misapplied without becoming weapons; wrong size, placement, timing, or bait creates escape and damage risk.

### Exclusion and cleanup

Mesh, flashing, sealant, fasteners, expanding fill, vent caps, patch panels, disinfectant, HEPA vacuum, scraper, waste bags, deodorizer, and portable work lights.

### Vehicles

The crew van is loadout, storage puzzle, upgrade surface, and physical object. Long-term vehicles include an animal-control truck, bucket truck shared with Public Works, and small boat for water jobs. Bad parking adds carry distance or blocks emergency access.

## Job types

- Unknown-noise residential inspections
- Active animal containment
- Recurring rodent programs across connected businesses
- Attic/crawlspace exclusion and cleanup
- Commercial food-service emergencies under time pressure
- Municipal infrastructure infestations
- Protected-species timing and non-lethal exclusion
- Storm-driven multi-property outbreaks
- Follow-up warranty calls that reveal inadequate prior work

Jobs combine property template, suspected species pool, occupant schedule, weather, valuable objects, access constraints, and hidden entry topology.

## Progression, economy, and unlocks

Payment = callout + verified work + safe capture + exclusion quality − damage − contamination − complaints − wasted supplies. Customer trust and town reputation are distinct: a quiet cover-up may preserve the invoice while later harming reputation.

Unlocks widen options rather than flatten difficulty: better cameras, quieter ladders, modular van storage, stronger temporary barriers, species permits, workshop fabrication, and staff training. Crew traits offer sidegrades. Town improvements repair recurring hotspots or unlock partner departments.

Persistent state tracks building damage, unresolved entry points, animal population pressure, customer relationships, weather aftermath, and prior crew choices. A cheap patch can generate a later warranty call; humane relocation can move pressure elsewhere if habitat remains unchanged.

## Multiplayer roles and coordination

Roles are soft and tool-driven:

- Lead/dispatcher interprets evidence and keeps the plan visible.
- Scout searches tight or elevated spaces and places cameras.
- Handler manages active containment and transfer.
- Exclusion tech controls routes and repairs openings.
- Support/customer liaison protects rooms, moves occupants, and cleans.

Players can swap at any time. Co-op friction comes from incomplete sightlines, bulky equipment, shared doors, noise, and simultaneous problems. Ping wheel communicates species, route, evidence, hazard, and intent. Downed states are avoided; mishaps cost time, cleanliness, and trust.

## Failure and chaos states

There is rarely an instant fail. Jobs degrade through recoverable states:

- Misdiagnosis wastes prep and increases animal stress.
- A weak barrier redirects rather than stops movement.
- Trap slams empty, frightening the animal and teaching avoidance.
- Animal enters occupied room; occupants move unpredictably and open doors.
- Broken ceiling, tipped furniture, spilled food, alarm, power loss, or contamination creates secondary work.
- An animal escapes outside uncontained, producing a follow-up call and reputation loss.
- Critical failure occurs only if safety, trust, or budget reaches zero, or the animal exits the playable property.

Browser cascade: attic → nursery ceiling breach → hall → kitchen food spill → front-door escape. Correct preparation can instead route attic → garage baited trap.

## Town and world design

The setting is a slightly compressed North American town where every block has overlapping civic and commercial systems. Recurring locations include the diner, school, marina, old courthouse, feed store, waste transfer station, historic houses, and municipal yard. Residents remember crews and gossip about results.

This project can share a universe with other ordinary-work games through recurring residents, department logos, radio chatter, work orders, and the same town map. Cross-game references remain texture, never required lore.

## Art direction

Long-term: chunky, tactile 3D with readable silhouettes, slightly exaggerated building cutaways, worn workwear, and grounded materials. Color carries systems: amber = uncertain evidence, cyan = crew intent, red = active escape/damage, green = secure/captured. Animals are expressive through posture and motion, not humanized faces.

The browser slice uses a clean municipal-work-order look, a dark cutaway against warm room colors, bold route lines, diagrammatic evidence, and restrained screen shake. It establishes readability rather than final asset style.

## Audio direction

Sound is evidence and simulation. Directional scratching, footfall weight, chirps, chewing cadence, wall resonance, occupant noise, and trap mechanisms identify state. Music is sparse during inspection, adding percussive work rhythms during setup and adaptive layers during a breach. Radio and vehicle ambience connect the town.

Accessibility options include visual sound rings, captions naming direction/distance/material, separate dynamic-range presets, and no information conveyed only by pitch.

## UI, UX, and accessibility

The work-order HUD shows phase, objective, selected tool, evidence confidence, property damage, customer trust, and event log. World overlays show planned containment routes without omnisciently revealing the animal during investigation.

Targets: remappable input; controller parity; hold/toggle choices; scalable text; colorblind-safe icon + color pairing; reduced motion; screen shake slider; sound visualization; subtitles; dyslexia-friendly font option; pause during solo planning; and simplified one-button tool actions. Browser slice supports mouse and shortcuts, responsive layout, visible focus, reduced-motion CSS, labels, and non-color status text.

## Replayability and content generation

Replayability comes from recombining authored parts, not opaque random maps. Property templates contain sockets for entry points, nests, valuables, occupants, and traversal edges. A job generator selects a compatible species ecology, season/weather, evidence set (including occasional misleading but explainable evidence), customer constraint, and escalation modifiers. Seeded jobs support daily challenges and bug reproduction.

Authored “incident cards” can add systemic complications—renovation noise, open food, a dog, a delivery, rain—only when their causes are present. Species, tools, properties, evidence, and job rules remain data-driven.

## Browser prototype scope

Included now:

- Six-room cutaway house and one unknown raccoon
- Four evidence clues, three diagnosis choices, confidence feedback
- Inspect, trap, and barrier tools
- Preparation phase and live utility-based room-to-room simulation
- One main capture route and a multi-step occupied-room escape cascade
- Property damage, customer trust, budget, event log, win/fail outcomes
- Post-capture exclusion patch and room-specific HEPA cleanup
- Reversible preparation placement, procedural sound cues, job-progress tracker, and share/replay controls
- Restart and a compact tutorial embedded in the work order

Explicitly deferred: avatar movement, deep repair minigames, inventory weight, multiple animals, customers moving in-world, procedural generation, persistence, networking, save data, 3D physics, and final authored audio.

## Technical approach

The prototype is plain HTML/CSS/JavaScript and Canvas 2D with no dependencies or build step. A fixed 960×600 logical canvas scales to available width. Simulation uses a finite state machine plus timed animal decisions. Lightweight sound cues are synthesized with Web Audio and duplicated in captions/logs. Render and simulation are separated conceptually in one file for fast iteration; the next refactor splits data, reducer/state, behavior, renderer, input, and audio.

Behavioral variation uses a deterministic seeded PRNG. A `?seed=` query parameter is displayed in the HUD and reproduces decision variation for shared playtests and debugging. Game state is serializable except transient animation time, preparing for replay logging and later multiplayer authority.

## Data and state architecture

Top-level state:

```text
GameState
  phase: briefing | investigate | diagnose | prepare | contain | resolved
  meters: damage, trust, budget, elapsed
  evidence: discovered IDs, confidence
  diagnosis: selected species
  placements: traps[], barriers[]
  seed: public label, PRNG state, decision count
  animal: roomId, stress, targetId, captured, escaped
  house: rooms{}, edges{}, incidents{}
  log: timestamped events[]
```

Commands (`INSPECT`, `SELECT_DIAGNOSIS`, `PLACE_TOOL`, `START_CONTAINMENT`, `TICK`, `RESTART`) mutate through phase guards. Events (`EVIDENCE_FOUND`, `EDGE_BLOCKED`, `ANIMAL_MOVED`, `DAMAGE`, `CAPTURED`, `ESCAPED`) support UI, audio, analytics, replay, and later network replication.

Content data should become JSON/ScriptableObjects with stable IDs. Behavior reads tags and weights rather than scene object names.

## Unity migration considerations

- Preserve stable IDs, command/event boundary, and data schemas; replace Canvas renderer with scene/prefab views.
- Unity authoritative simulation should use fixed ticks. Host authority is acceptable for early 2–5 player co-op; inputs become commands, outcomes become replicated events.
- Build rooms as volumes and traversal edges as explicit components layered over physics. Do not rely on unconstrained rigidbody chaos for animal navigation.
- Use NavMesh plus tagged off-mesh links for species movement; utility selection chooses goals/routes.
- ScriptableObjects hold species/tools/evidence/property definitions; save files reference versioned IDs.
- Steam networking, lobby, join-in-progress, host migration, and latency-tolerant placement require prototypes before content scale-up.
- Physical props may be client-predicted cosmetically, but capture, damage, doors, animal state, and inventory remain authoritative.
- Keep 3D interactions usable with keyboard/mouse and controller from the first Unity spike.

## First playable vertical slice

**“Something in the Attic”**: Mrs. Alvarez reports night scratching and a damaged soffit. The player investigates a two-floor cutaway, discovers large hand-like tracks, dark coarse fur, nocturnal noise, and a pried vent; chooses raccoon; places a baited live trap in the garage and blocks dangerous routes; begins containment; then seals the soffit and cleans the affected room before submitting the work order.

The raccoon seeks the safest perceived exit. A garage trap plus a nursery barrier captures it with low damage. Bait alone does not override an apparently open escape route: leaving the nursery route open drives a ceiling breach, followed by the hall and kitchen. The player can recover by blocking the kitchen route while the animal is still upstairs, redirecting it to the garage trap; otherwise it raids the kitchen and escapes through the front door. Final grading explains the chain.

Success must be possible in under five minutes after learning the controls, while a first blind run should commonly produce a funny but understandable breach.

## Milestones

1. **v0.1 Core proof (now):** investigation, diagnosis, placement, simulation, cascade, capture, scoring.
2. **v0.2 Legibility:** deterministic seed, animated route intent, sound cues/captions, clearer barrier edges, event telemetry.
3. **v0.3 Content proof:** second species (rats), alternate evidence, second house topology, cleanup/exclusion closeout.
4. **v0.4 Co-op paper prototype:** two cursors/roles locally or network spike; command/event architecture validation.
5. **Unity preproduction:** 3D one-room interaction gym, animal locomotion, network authority test, controller pass.

## Risks and mitigations

- **Diagnosis becomes trivia:** clues describe behavior/building interaction; partial knowledge changes plans rather than hard-locking progress.
- **Chaos feels random:** show cause and route intent; use seeded decisions and event history.
- **Optimal trap puzzle gets solved once:** vary topology, needs, occupants, false affordances, and incident timing.
- **Animal welfare tone:** humane tools, release framing, no gore, and credible best practices reviewed by subject experts.
- **3D physics hurts networking/readability:** constrain critical simulation to authored edges and authoritative events.
- **Solo overload:** planning pause, tool hotkeys, slower escalation, and optional AI helper.
- **Content cost:** modular building sockets and data-driven species, while preserving authored high-quality incident chains.

## Firm decisions

- Humane capture/removal is the default verb set.
- The prototype uses a cutaway floor plan, not avatar movement.
- Evidence is imperfect but never arbitrary; the full set supports one defensible diagnosis.
- Barriers modify graph edges and may redirect danger; they are not universal hard stops.
- Score meters update during play and the event log names causes.
- The first slice has one animal because behavior quality is the central risk.
- No build tool, framework, account, server, or asset download is required.

## Open questions

- How much uncertainty remains fun after repeated jobs: exact species unknown, count unknown, or route unknown?
- Should capture require a short physical handling step after trap closure?
- Which town consequences are meaningful without making imperfect jobs feel punishing?
- Can host-authoritative animal movement feel responsive with five players and many props?
- How explicitly should humane/legal constraints vary by region and season?
- Does the long-term game need fully destructible building elements, or authored break states?

## Decision log

- **2026-08-25:** Chose raccoon as first species because climbing, manipulation, occupancy conflict, and ceiling breach demonstrate more systemic range than a swarm.
- **2026-08-25:** Chose graph-based room simulation for the browser slice; it maps cleanly to later traversal volumes and keeps causes legible.
- **2026-08-25:** Kept emergency barrier placement during containment so a bad plan creates recovery play rather than a passive failure animation.
- **2026-08-25:** Deferred cleanup/exclusion to preserve a complete five-minute core loop; closeout is the first major feature after behavior legibility.
- **2026-08-25:** Reduced bait utility after playtesting showed traps were auto-solving poor preparation. Bait now works only when barriers make the capture route competitive.
- **2026-08-25:** Established `C:\Dev\pest-control` as the canonical checkout and a public GitHub Pages deployment as the standing playtest channel.
- **2026-08-25:** Added shareable seeded jobs through `?seed=`; behavioral tie variation is deterministic and the active seed is visible in the HUD and field log.
- **2026-08-25:** Completed the first job's exclusion/cleanup closeout instead of ending on capture. Capture now transitions to property restoration, and final grading requires both tasks.
- **2026-08-25:** Added reversible prep placement after playtest friction showed a mistaken click could invalidate an otherwise useful run.
- **2026-08-25:** Fixed restart to preserve one animation loop and changed the field log to text-node rendering so user-supplied seeds cannot become HTML.
- **2026-08-25:** Increased the post-nursery-breach reaction window to 2.6 seconds after hands-on testing showed 0.9 seconds was too short to read the warning and deploy an emergency barrier.
