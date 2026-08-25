# Controls and State Machines

## Prototype controls

| Input | Action | Phase guard |
|---|---|---|
| Click evidence marker | Inspect clue | Investigate |
| Click diagnosis card | Commit species | Diagnose |
| `1` / Inspect button | Select inspect tool | Investigate |
| `2` / Trap button | Select live trap | Prepare or contain |
| `3` / Barrier button | Select barrier | Prepare or contain |
| `4` / Exclusion patch | Select soffit repair | Closeout |
| `5` / HEPA cleanup | Select decontamination | Closeout |
| Click room | Place selected tool | Prepare or contain; placement limit/cost applies |
| Click placed tool location | Remove/refund or move equipment | Prepare only |
| Click highlighted closeout target | Perform repair or cleanup | Closeout; correct tool/room required |
| `Space` / Start button | Begin containment | Prepare; diagnosis and trap required |
| `R` / Restart button | Reset work order | Any phase |

Future 3D mapping: move (WASD/stick), look (mouse/right stick), interact (E/south), primary tool (mouse 1/right trigger), alternate/rotate (mouse 2/left trigger), ping (middle/D-pad up), tool belt (1–5/radial), carry/drop (Q/west), crouch (Ctrl/east), sprint (Shift/stick press).

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
