# Controls and State Machines

## Prototype controls

| Input | Action | Phase guard |
|---|---|---|
| `WASD` / arrow keys | Move technician relative to camera | Any active phase |
| On-screen direction pad | Hold or tap to move | Any active phase |
| Pointer drag | Turn over-the-shoulder camera | Any phase |
| Click/tap nearby evidence marker | Inspect clue | Investigate; same floor and within reach |
| `E` / center pad button / ladder prompt | Climb attic ladder up or down | Within reach of garage ladder or attic opening |
| Click diagnosis card | Commit species | Diagnose |
| `1` / Inspect button | Select inspect tool | Investigate |
| `2` / Trap button | Select live trap | Prepare or contain |
| `3` / Barrier button | Select barrier | Prepare or contain |
| `4` / Exclusion patch | Select soffit repair | Closeout |
| `5` / HEPA cleanup | Select decontamination | Closeout |
| Click/tap nearby room sign or floor | Place selected tool | Prepare or contain; technician must be in that room |
| Click placed tool location | Remove/refund or move equipment | Prepare only |
| Click highlighted closeout target | Perform repair or cleanup | Closeout; correct tool/room required |
| `Space` / Start button | Begin containment | Prepare; diagnosis and trap required |
| `R` / Restart button | Reset work order | Any phase |

Room and evidence labels are level-aware and hidden through floors. The attic cannot be targeted from downstairs; the player must use the ladder. Future controller mapping: move (left stick), look (right stick), interact/climb (south), primary tool (right trigger), alternate/rotate (left trigger), ping (D-pad up), tool belt (radial), carry/drop (west), crouch (east), sprint (stick press).

## Job phase state machine

```text
BRIEFING
  └─ acknowledge → INVESTIGATE
       ├─ inspect evidence → INVESTIGATE
       └─ enough evidence / diagnose → DIAGNOSE
            └─ commit species → PREPARE
                 ├─ place/move tools → PREPARE
                 └─ start → CONTAIN
                      ├─ place emergency barrier → CONTAIN
                      ├─ animal enters armed trap → CLOSEOUT
                      │    ├─ seal entry + clean affected room → READY_TO_SUBMIT
                      │    └─ submit job → RESOLVED_CAPTURE
                      ├─ animal exits property → RESOLVED_ESCAPE
                      └─ trust or damage threshold → RESOLVED_ABORT
```

Phase changes are explicit commands. UI visibility is derived from phase; it does not own game rules. Capture is not job completion: exclusion and cleanup are required before final scoring.

## Animal state machine

```text
HIDDEN (investigation/prep)
  └─ containment starts → ALERT
       └─ decision timer → MOVING
            ├─ enter trap room with valid armed trap → CAPTURED
            ├─ choose exterior edge → ESCAPED
            ├─ blocked preferred edge → STRESSED → ALERT
            ├─ incident edge → BREACH → ALERT
            └─ ordinary room → ALERT
```

On each decision, score traversable adjacent rooms:

```text
score = exitDrive + shelter + bait + familiarity
      - occupancyFear - crewPressure - barrierStrength
      + stressRiskTolerance + seededVariation
```

Barriers normally make an edge unattractive. A sufficiently stressed raccoon can defeat a weak barrier after a visible warning. In the current browser simplification, a barrier blocks the dangerous route completely and costs money; a later iteration adds strength and failure.

## Incident state machine

```text
DORMANT → route selected → WARNED → TRIGGERED → CONSEQUENCE → RECOVERABLE/CLEARED
```

Example: attic ceiling creaks → raccoon chooses nursery route → crack highlights → ceiling breaks (+damage, −trust) → player can block hall/kitchen routes and redirect toward garage trap.

## Scoring

Start: damage 0, trust 100, budget $240. Tool placement spends budget. Incidents add damage and reduce trust. Correct diagnosis arms the species-appropriate trap; a wrong diagnosis produces weak bait attraction and an early trap misfire. Results grade prioritizes capture, then trust, damage, and remaining budget.
