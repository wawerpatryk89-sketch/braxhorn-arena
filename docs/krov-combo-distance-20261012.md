# Krov elbow combo distance

Reproduced: combo against a stationary opponent reaches all five groups, but a short retreat after the second punch can put later elbows out of reach. The old setup established distance only before the opening jab/cross.

Krov now closes excess root distance during the combo after the second punch connects, at 80% of his forward approach speed. This applies symmetrically to player and CPU. It stops after the finisher, on stun/down states, and outside a bounded pursuit range. It never moves the target, enlarges hitboxes, or changes original animation tracks. Collision separation remains active. Opponents can still block, interrupt, or escape.

Regression: move each victim back 3 arena percentage points after group 1. Old logic fails with only 3/5 groups against Brax. New logic passes 24 cases (six victims, both directions, center/edge) with all five groups. Existing arena-launch and CPU-combo checks also pass. Tests exercise runtime geometry, not visual Safari playback.
