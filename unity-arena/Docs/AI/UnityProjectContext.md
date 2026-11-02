# Braxhorn Arena — Unity project context

## Scope and authority

The user authorized continuing the entire **Arena** migration to native Unity, preserving the original models, animations and artwork. This is separate from the City/osiedle repository. On 2026-11-02 they clarified that the current deliverable is the Unity project **for an app they will build later**. Continue source work without treating Android activation as a blocker. Do not run the local Editor, publish a site/store release, merge main, or present a partial integration scene as the finished game.

- Source: published Site v271, commit `f355fe6ac6af41518fde420382512d49bd27d51a` (2026-10-28).
- GitHub repository: `wawerpatryk89-sketch/braxhorn-arena`.
- Dedicated branch in both source and GitHub repositories: `codex/arena-unity6-migration-20261102`.
- GitHub main was the older 2026-10-20 baseline. Never silently substitute its assets.
- Unity project: `unity-arena`, version `6000.3.27f2`, built-in pipeline.
- Generated imports, source caches and original offline media are reproducible/ignored. Preserve unrelated source-restoration temporary files. Stage migration files explicitly.

## Implemented native code

`Arena.Domain` is plain C# with no Unity reference. It owns campaign progression, capsule contact geometry, authored action clocks, input mapping, guards/evasion, damage/energy ledgers and the 60 Hz `ArenaMatch`. Match partials implement pressure/fall/getup, paired action clocks/root movement, source combo reaction selection, first-contact pose hold, paired finishers/recovery, countdown, timed/best-of-three rounds, CPU commands and training recovery. Original v271 `middleGrab`, `airCombo` and `groundContinuation` settings remain authoritative.

`Arena.Runtime` owns original rig definitions, Playables, native audio/video, touch controls and scene presentation. `Arena.Editor` imports meshes, full 8/12-weight skinning, textures, clips and generates integration scenes. C# assemblies must compile separately: a monolithic compile can conceal forbidden access to internal Domain members.

`NativeMatchPlayer` connects all 16 playable variants, 21 original arenas, fight/training/Arcade/tournament/Survival and five adventure routes. It uses async resource/configuration loading with generation guards; backgrounding pauses and releases input. The touch interface has a jump button and fits a 1024×576 layout inside the device safe area. It is still an integration menu, not the original production UI.

## Asset fidelity

`unity-tools/arena/export-source.mjs` uses the original Three.js rig **only offline** to bake authored transforms, IK, tail and prefight foot-grounding corrections. The player does not run JavaScript, Three.js, WebView or browser canvas. Reflecting Z, winding, bind poses and quaternions are converted together. Constant animation channels retain endpoints without losing changing samples.

The complete current local export passed validation: **18 models/outfits, 2986 actions, 270381 sampled frames, 1083207 vertices**. The 34 new actions are 16 outfit-specific adventure walks and 18 entry runs. Their source files are hash-pinned. The two previously omitted BEAR/Blocking and DEMON/Standing Block End clips remain exact original supplements. Adventure walk clip names do not overwrite combat/prefight clips.

`export-media.py` packages 133 locked source files: 21 arenas, 30 chapter films on five routes, and 31 retained audio keys. Output is 312704687 bytes with 50 H.264/yuv420p streams. Original MP4/audio/JPEG bytes stay unchanged; WebP posters become PNG; Harbor GIF is explicitly transcoded to H.264 CRF16. Immutable delivery URLs reproduce published packaging without weakening source hashes.

## Adventure implementation

`AdventureRun` owns the six-encounter route and keeps the same player instance across encounters. `AuthoredTravel` follows original root-distance samples. Entry includes the 450 ms establishing shot, source door/edge projection, reciprocal depth, braking and 420 ms yaw turn. `ADVENTURE_WALK` is distinct from normal prefight motion.

Exploration gates at the current encounter, follows the source camera, and preserves HP, energy and move state. The next opponent is preloaded during combat, revealed at 20% enemy HP, walks to its authored staging position, and transfers its position/clock when promoted. Final corpses wait for a grounded settled KO pose. Win scores, no-damage bonuses, post-win healing, the city pickup, boss completion, death and result idempotence are domain-owned. Source KROV receiver metadata is extended to BOSS/ZOMBIE exactly like the browser loader.

`NativeAdventureWorld` uses at most two video decoders and retains the previous decoded edge for narrow chapter blending. Doorway foreground masks use the actual film. Corpses are snapshots of the rendered original Unity rig, not generated artwork. The original AAC gain uses an audio-thread filter. Following the owner’s later lighting instruction, all fighters retain imported PBR materials in adventure, including BRAX and the three NYXA variants that previously used an unlit override. Original textures remain unchanged. Overall PBR/studio/tone-map equivalence is still unvalidated. Rankings are explicitly local/offline.

## Current evidence

- All four managed asmdef boundaries (Domain, Runtime, Editor, EditMode tests) compile against actual Unity 6000.3.27f2 assemblies. This does not execute Unity.
- 192 campaign scenarios / 3312 reference states / 3 contact edge cases.
- 26198 source combat-helper comparisons across 18 variants / the original 2952 combat actions.
- 210 original arena floor/crop cases, 90 entrance projections / 810 source samples.
- 200 native match checks using all 18 actual exported configurations.
- 542 adventure checks: lifecycle, gates, pause, root travel, incoming rivals, persistent state, KO settlement, healing/scoring, simultaneous KO, all 16 playable variants on five entrances, and 98 paired action/receiver combinations against BOSS/ZOMBIE.
- Full native payload validation: 18 / 2986 / 270381 / 1083207 as above.
- Known standalone compiler warning: Newtonsoft netstandard2.0 resolves against netstandard2.1. UPM resolution requires Unity import.
- No Unity import, shader compilation, Play Mode, screenshots/recordings, Android package or phone validation has been performed for this checkpoint.

The previous media/match cloud run `41510507631`, code `c5bbfb76fbccaf190a7d3f3fa3ba0b17ec7e2f45`, passed all native asset/media/rule jobs, including 200 match checks. Fighter artifact `13172433665` is 834897395 bytes (ZIP SHA256 `9d15dabee6d05a016ec8a1cf2ba9a53a78130b2a7cbaa32d491425caa64b6863`). Media artifact `13171983537` is 312286395 bytes (ZIP SHA256 `abe9f43c6fd382026c438d9c5d71316c8c28ece943d5e9369b3e43f8cbb31080`). These are previous-checkpoint data archives, not APKs or the newly expanded adventure export.

## App build workflow

Push CI restores/validates source, exports native assets/media, and runs domain regressions. APK execution is now opt-in through workflow_dispatch `build_apk=true`. `ArenaBuild.AndroidCombat` generates native scenes/imports and an ARM64 IL2CPP development package; `AndroidReview` remains the single-model inspection entry point. Both are review builds using `com.braxhorn.arena.unityreview`, not a paid-release identity.

Previous preflight found no configured Arena UNITY_LICENSE/EMAIL/PASSWORD/SERIAL. The previous run failed its explicit activation prerequisite and skipped Android. This is not evidence about the user's license entitlement. Current source-only validation does not fail merely because no APK was requested. Do not copy secrets from City or expose credentials. Local Editor invocation previously failed licensing IPC and Package Manager; do not retry it against the user's instruction.

## Required before claiming the whole migration is finished

1. Complete remaining source gameplay/presentation parity: runtime verification of moving-strike leg layers, full CPU/drill variants, runtime verification of clinch hand IK, combo-aftermath gestures, recoil/lift/travel details, KO replay, all authored VFX/audio and procedural night-market overlays. Expand matchup/direction reference coverage.
2. Implement the original production menus/art, account entry, portraits, outfit shop, challenges, rankings and save migration. The present integration selector is not a finished UI.
3. Implement native backend account/session/shop authority, adventure ranking protocol, online rooms/signaling, input/snapshots and voice; verify two peers. Do not fake successful online results.
4. Execute native import and visual/runtime checks when a permitted Unity execution path is available. Validate rig deformation, facing, entrance masks, unlit/PBR output, actual video orientation/loop seams, audio synchronization and corpse capture.
5. Measure mobile CPU/GPU/memory and touch usability; then build/test the app. Store signing, product identity, pricing and publication remain later explicit steps.

Never describe managed compilation or source export as a verified working phone game or as full migration completion. Missing later build credentials do not prevent continuing the remaining source implementation.

## Native gesture and clinch checkpoint

Automatic taunts, queued joy/anger, alternating variants and authored cooldowns now run in C#. Movement, guard and strikes interrupt a gesture immediately. Exploration suppresses combat gestures. Normal throw completion, fall and get-up queue original actions. Combo-specific aftermath presentation remains incomplete.

Neutral clinch detects original torso/push-capsule proximity and forward pressure, uses CLINCH_HOLD, freezes its pose at 280 ms, and supports break or original paired-move selection. Contact itself causes no damage. Release restores separation/protection/cooldown; pause freezes the timeout. CPU waits for its reaction window; passive training does not act. Round/adventure transitions reset the state. Dynamic hand-to-opponent IK is now implemented after both Unity poses have been sampled; visual placement still requires runtime verification across different sizes.

Validation: 15 dedicated gesture checks and 18 dedicated clinch checks supplement the existing match/adventure suite. Managed compilation is performed without running the Unity Editor. No new APK or runtime images are produced by this checkpoint.

## Native clinch contact IK

`FighterPosePlayer.Contact` consumes the original contactShoulders/contactClavicles metadata and scale ratio. It uses the original 0.07 horizontal / 0.06 vertical offsets, reachable-height fallback, 75% clavicle fallback and 180 ms smoothstep. Source Z is reflected consistently with the imported rig. Actor-facing/scale transforms are applied outside the solver. Both base poses are sampled before contact correction; rotations are corrected without changing bone translations or scale. Hand world orientation is retained at full blend. No generated replacement animation is introduced.

`ArmContactGeometry` has 4019 executable geometry checks over 1000 varied chains/targets plus vertical, unreachable, degenerate and invalid inputs. All four Unity assembly boundaries compile. These checks validate geometry and compilation, not rendered skin deformation or touch-device behavior.

## Moving strikes and requested lighting improvements

Raw RUN/WALK_FORWARD/ADVENTURE_WALK quaternion layers are now exported separately from baked poses. Full export includes 52 layers across 18 variants, with eight leg bones each. Original retargeted samples remain intact apart from the same Z reflection as all imported animation. Export input is not mutated; metadata hashes are checked by the importer and payload validator. `prepare-source.py` copies both new exporter and its test into the pinned export workspace. Old serialized definitions can load without layers, but new imports reject incomplete/mismatched gait payloads.

Native basic attacks now retain source forward travel, minimum opponent distance, sprint/walk gait clocks and 100 ms combat blending. Adventure allows free direction changes with 70 ms blending and authored walk speed. Foot/leg attacks retain their own leg pose. Stun, push, pause and action changes stop/freeze the layer appropriately. Run/adventure stride time is retained when an attack finishes. The runtime changes leg rotations only, then applies the source floor-leg IK with preserved foot world orientation. Fourteen focused simulation checks pass; source gait conversion tests check reflection, original timing and immutable input. Rendered floor contact/skin deformation remains unverified.

The owner requested lit fighters closer to Tripo and improved adventure exits on 2026-11-03. The previous unlit override is removed; original PBR colour/normal/metallic-roughness textures remain. Generated combat and review scenes share enabled key/fill/rim lights and hemispheric ambient light. Values are initial studio settings, not a measured Tripo match. Visual calibration and mobile GPU cost remain to validate.

Adventure chapter loading now freezes ready films while another visible chapter is buffering, hides/relinquishes controls while waiting and clears the loading message after recovery. This addresses stream-boundary behavior, not a claim that doorway geometry or every exit is visually corrected. Original entrance masks/projections stay unchanged pending visual evidence.
