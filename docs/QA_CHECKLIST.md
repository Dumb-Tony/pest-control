# Prototype QA Checklist

## Smoke test

- [ ] Page loads without a blank canvas or console error.
- [ ] Briefing advances to investigation.
- [ ] Evidence markers react to hover/click and log only once.
- [ ] Diagnosis panel becomes available after two clues.
- [ ] Selecting raccoon advances to preparation.
- [ ] Trap and barrier placement update canvas, counts, and budget.
- [ ] Containment starts only after a trap is placed.
- [ ] Raccoon moves, event log updates, and meters react.
- [ ] Capture and escape each show a result with restart.
- [ ] `R` resets all meters, placements, evidence, and simulation timers.

## Acceptance routes

### Clean capture

- [ ] Discover 3+ clues; diagnose raccoon.
- [ ] Place trap in garage.
- [ ] Place barrier in nursery.
- [ ] Start containment.
- [ ] Raccoon routes from attic toward garage and is captured.
- [ ] Final state shows capture with low damage and high trust.

### Cascading escape

- [ ] Diagnose and place trap away from garage.
- [ ] Leave nursery unblocked.
- [ ] Start containment.
- [ ] Ceiling breach produces immediate named damage.
- [ ] Raccoon can proceed through hall to kitchen.
- [ ] Kitchen incident adds damage/trust loss.
- [ ] Without recovery, exterior escape resolves the job.

### Recovery

- [ ] Allow nursery breach.
- [ ] During containment, place an emergency barrier ahead of the raccoon.
- [ ] Animal re-evaluates and chooses another legal route.
- [ ] Capture remains possible after at least one incident.

## Input and accessibility

- [ ] All HTML buttons are reachable with Tab and have visible focus.
- [ ] Enter/Space activates focused HTML controls.
- [ ] `1`, `2`, `3`, `Space`, and `R` work when focus is not in a form field.
- [ ] Status is understandable without color alone.
- [ ] Text remains readable at 200% browser zoom.
- [ ] Layout works at 1280×720 and 390×844 without horizontal page overflow.
- [ ] Reduced-motion OS preference disables decorative animation.
- [ ] Event log exposes updates as polite live-region announcements.

## Simulation integrity

- [ ] Animal never occupies a nonexistent room.
- [ ] A blocked route is not selected.
- [ ] Placement never drives budget below zero.
- [ ] Result resolves only once; timers stop afterward.
- [ ] Restart cannot receive a late timer from the previous run.
- [ ] Capture requires animal and armed trap in same room.
- [ ] Every damage/trust change has a corresponding log message.

## Browser matrix

- [ ] Current Chrome/Edge
- [ ] Current Firefox
- [ ] Current Safari desktop
- [ ] iOS Safari touch
- [ ] Android Chrome touch

## Playtest questions

1. What animal did you think it was, and which clues mattered?
2. Before pressing Start, what route did you expect?
3. When something went wrong, what caused it?
4. Did you notice a way to recover during containment?
5. Which action felt like pest-control work rather than a generic puzzle?

