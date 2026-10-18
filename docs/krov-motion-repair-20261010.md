# Krov runtime motion repair — 2026-10-10

Reported: displaced spawn, apparent back-to-back start and broken-looking transitions.

Confirmed cause: `.fighter.krov canvas { transform:none!important }` removed the -50% canvas centering used by the combat coordinate system. The picture was displaced by half its full canvas width while hitboxes remained at the logical fighter root. Keep translateX(-50%) for Krov, while facing is handled by 3D rotation.

Runtime fixes:
- Preserve source mesh, textures, skeleton, master attack clips and master timing.
- Clone clips before adjusting locomotion; retain animated spine/neck/head instead of freezing them.
- Arm guard retains 16% of the source locomotion delta; close locomotion endpoints over the final <=100ms.
- Per-canvas actor transition state prevents mirror fights sharing poses. Transition from actual last pose over <=120ms; attack transition completes before the first active contact frame.
- Fractional animation samples follow the existing simulation clock; no independent attack speed change.
- K01–K06 active hitboxes are reprojected from actual hand/elbow/knee/shin joints at load; timing and damage remain unchanged.
- Reset actor transition state on training/round reset; refresh facing before countdown.

Validation:
- `npm run test:krov`: PASS, logic of 6 attacks, timing, movement, clinch, falls, imported model hash and 171 pose samples.
- `node --loader ./scripts/krov-three-loader.mjs scripts/audit-krov-motion.mjs`: PASS, 4144 fractional poses, finite transforms and normalized rotations, unchanged source clips, loop endpoints, moving spine, transition continuity, exact contact pose, mirror-actor isolation and centered-canvas rule.
- startup transition audit PASS.
- Legacy `npm test` game fixture fails because it does not supply BRAX_3D; it predates current 3D runtime. Not reported as a passing full-suite test.
- Browser visual QA unavailable in this managed environment (no control-browser skill). This repair is not certification of professional animation quality or complete Master compliance. Existing K01–K06 and King's Grip choreography has not been reauthored. Support-foot sliding, anatomical quality, paired throw contact still require visual evaluation. Combo-specific hitboxes are not covered by the K01–K06 limb resampling.
