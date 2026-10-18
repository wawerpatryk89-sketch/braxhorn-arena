# Compact mutual contact correction

User reported prolonged mesh overlap and wide straight-arm leaning. The push now applies a compact two-arm IK correction with low elbows and a straighter spine; transition into the original full fall blends from the corrected push endpoint. Pair spacing is 1.04 model units and applied when contact begins, rather than retaining the deep overlap for the first 0.12 seconds. Both still push/fall together, with the same pressure trigger and original fall/get-up.

Inspected textured offline poses for all six fighters; shortened hand reach again after the shorter arms remained extended. Rechecked pair synchronization, boundaries, release, pressure trigger and full fall. No live browser/device verification available. This corrects the automatic contact sequence; manual shoulder throws are separate.

## Superseded before deployment by the user's Push.fbx

The user supplied Push.fbx while the earlier compact correction was being packaged. That package was never saved or deployed. Final implementation replaces Pushing.fbx with the new 1.7-second Push.fbx, preserves its original joint rotations (no procedural compact-arm/spine correction), plays it over 0.5 source seconds / 0.4 real seconds, then uses the full existing fall/get-up. The pair gap is 1.08 model units; immediate overlap correction remains. New asset is tracked in source-assets/brax-contact-20261013/Push.fbx. Logic tests rerun with this final asset.
