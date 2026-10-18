# Vexa and new Krov — 2026-10-11

## Sources and appearance
Vexa: supplied tiger+humanoid+3d+model.zip and vexa.zip. Krov: supplied lion+humanoid+3d+model.zip, krov(1).zip and krov (3).zip. The old Krov model is not used. Original geometry, bone hierarchy, UVs and all four texture maps are preserved. Vexa has 56,850 vertices; Krov has 58,056. Vexa retains eight influence slots. Krov requires a third vec4 of skin weights; the loader and renderer preserve all twelve slots rather than truncating to eight. The extra unused animation clips remain available in source-assets/<fighter>/clips-all.json.gz. Only the clips referenced by the runtime configuration are deployed, to stay below the hosting archive limit. Run scripts/package-fighter-clips.mjs after generating configs. Exact duplicate clips are recorded in the source audit JSONs.

## Play
Both fighters are selectable as player or CPU, including mirror matches. Six basic attacks use P1, P2, K1, K2, forward+P1 and forward+P2. Combo, U evasion, C grapple, guard, jump and double-tap-forward run are separate.

Vexa is the faster kicking specialist: Boxing, Boxing (2), Pontera, Roundhouse Kick (1), Armada and Flying Kick. Her combo has two punches and three kicks, ending in an airborne knockback after an actual unguarded contact. Her introduction is a two-kick presentation. Her Boxing (1) guard loops continuously.

Krov is the slower close-range striker: Jab Cross, Hook Punch, Mma Kick, Kicking, Illegal Elbow Punch and Uppercut. His introduction uses the first 5.5 seconds of Salsa Dancing facing the camera. His combo combines Jab Cross, Elbow Uppercut Combo, Illegal Elbow Punch and Elbow Punching: two punches, three elbows, then a paired shoulder throw if the last elbow lands unguarded within grapple range. A miss, block or protected target does not trigger the throw. The defender can use the existing early grapple-break input. A throw is a ground knockdown, not an airborne-launch counter.

Movement is driven by input with animation root travel removed for locomotion. Compact combat steps use the supplied guard and walk clips. Vexa speed is 0.73 character-heights/second, Krov 0.58, backward movement 80%, sprint 140%. Holding forward alone remains walking; a second tap and hold runs. Contact windows are sampled from the actual striking hand, elbow or foot and checked against body capsules. Normal knockdowns recover; the second airborne launch ends the round outside training.

## Shared motions and remaining assets
Vexa borrows retargeted Jump and Kip Up from Brax, and Step Backward plus the shoulder-throw victim from Nyxa. Krov uses his own paired shoulder throw, Jumping and Getting Up. His regular backfall is retargeted from Vexa, evasion from Brax, and sprint from Vexa. Supplied Run With Sword is retained but not chosen for an unarmed fighter. No additional animation file is required for these two fighters' implemented basic moveset. Dedicated Vexa/Krov voice recordings would be optional additions. Nyxa's previously missing own jump/run are not fabricated or claimed delivered by this change.

## Loading
Only the selected pair receives complete models, textures and WebGL renderers. Unused fighters retain lightweight configuration metadata. Switching the selected pair disposes the former GPU resources; mirror matches share a renderer with separate per-actor animation state. Original texture resolution is unchanged.

## Verification
- 192 real-capsule basic-attack scenarios: both new fighters, player/CPU roles, four opponents, both facings; no duplicate damage per contact group.
- Vexa's five-contact combo passes against all four opponents on both sides.
- Krov's five-contact combo and subsequent paired throw pass against all four opponents on both sides. Guarded and distant combos cannot auto-grab.
- 32 close-contact throw pair/direction cases pass: C catch, C throw, one landing damage, recovery, neutral release, distance and get-up protection.
- Four-fighter touch tests pass: captured drag, direction replacement, release outside button, cancel, lost capture, blur, pause, multi-touch, walk and double-tap run.
- Jump, guard, evasion, recovery and second-airborne-launch KO pass for Vexa/Krov.
- Original Brax/Nyxa six-attack and contact-timing regressions pass.
- CPU skinning tests preserve summed original weights and finite animated geometry for all four models. Generated shader paths include every influence for position and normals; this is not a GPU shader compile test.
- Pair loading/disposal and mirror deduplication pass with instrumented resource mocks.

Browser limitation: the available cloud browser previously failed to create any WebGL context (GL_VENDOR/GL_RENDERER Disabled). Full rendered 3D motion, shader compilation and actual iPhone frame rate have NOT been visually certified. Numeric tests and skeleton contact sheets do not replace that visual verification.

## Cleanup
Removed nine unreferenced legacy menu/background/source-icon media files from dist (12.8 MiB). Active menu artwork, arena GIFs, original model textures and user uploads are unchanged. Unselected source animation candidates are preserved outside the deployment output.

Vexa color PNG was losslessly recompressed below the 25 MiB per-file hosting limit; all original RGBA pixel bytes are identical.
