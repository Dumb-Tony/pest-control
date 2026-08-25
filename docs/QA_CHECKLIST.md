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
- [ ] Capture transitions to closeout rather than directly showing results.
- [ ] Exclusion patch works only on the outside soffit target.
- [ ] HEPA cleanup targets the attic after a clean capture and nursery after a breach.
- [ ] Completing both closeout tasks enables job submission and results.
- [ ] Escape shows a result with same-seed and new-seed replay choices.
- [ ] `R` resets all meters, placements, evidence, and simulation timers.
- [ ] Repeated restarts do not accelerate or duplicate animal decisions.

## Acceptance routes

### Clean capture

- [ ] Discover 3+ clues; diagnose raccoon.
- [ ] Place trap in garage.
- [ ] Place barrier in nursery.
- [ ] Start containment.
- [ ] Raccoon routes from attic toward garage and is captured.
- [ ] Final state shows capture with low damage and high trust.
- [ ] Seal the outside entry, clean the attic, and submit for grade A.

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
- [ ] Repeating the same actions with the same `?seed=` produces the same route decisions.
- [ ] A long or unusual seed is safely shortened in the HUD and does not affect layout.
- [ ] HTML-like text in `?seed=` renders as literal text and never creates markup.
- [ ] Sound off suppresses subsequent procedural cues without hiding captions.
- [ ] Copy job link copies the current seeded URL or displays it as fallback text.

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
