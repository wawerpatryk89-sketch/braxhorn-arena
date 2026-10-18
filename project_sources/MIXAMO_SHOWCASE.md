# Supplied Brax animations — 13 October 2026

Original upload: `mixamo-brax-20261013.zip` (all 12 FBX files retained).
The runtime contains only baked selections, not duplicate full-length imports.

| Fighter | Round (1.8 s) | Match (~4 s) |
| --- | --- | --- |
| BRAX | Rallying, raised arm | Rallying |
| NYXA | Victory, raised arms | Victory |
| VEXA | Victory, later gesture | House Dancing |
| KROV | Rallying, second gesture | Hip Hop Dancing |
| NINA | Victory, opening gesture | Breakdance Footwork To Freeze |
| DANNY | Rallying, later gesture | Dancing |

Contact: 1.8-second paired motion. Pushing is accelerated, blended with each
fighter's own guard and has matched forearm contact. The receiver uses the
standing portion of Stumble Backwards and the recovering steps of Dodging Back.
The pusher uses the final backward step of Dodging Back. Root curves drive the
same combat clock as both clips. Receiver travel and foot targets are shortened
together. The full stumble's ground fall and Crawl Backwards are intentionally
not used for ordinary automatic contact. No damage is caused by this separation.
Existing deep-overlap / 1.4-second persistent-contact trigger is retained.

Clips are retargeted to each model's proportions and local joint basis relative
to Brax. Model roots are Z-up while incoming animation data is Y-up. Final clips
are sampled at 30 FPS with quaternion interpolation; state geometry at 60 FPS.
Original attacks and other state configurations are checked against version 97.

Rebuild: extract the ZIP to a directory, then run:

    node --loader ./scripts/krov-three-loader.mjs scripts/build-mixamo-showcase.mjs /absolute/path/to/extracted/files
    node --loader ./scripts/krov-three-loader.mjs scripts/audit-mixamo-showcase.mjs
    node scripts/audit-contact-showcase.cjs
    node scripts/audit-contact-deadline.cjs
    node scripts/audit-natural-contact.cjs
    node scripts/audit-victory.cjs
    node --loader ./scripts/krov-three-loader.mjs scripts/build-runtime.mjs

QA: 144 contact cases, 48 round/match winner cases, 120 trigger-deadline cases,
72 natural-approach cases, plus six-rig geometry and original-animation checks.
Software-rendered mesh poses used for contact, recoil and transferred victories.
A live browser / physical-device visual check was unavailable in this environment.
