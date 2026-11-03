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

`NativeMatchPlayer` connects all 16 playable variants, 21 original arenas, fight/training/Arcade/tournament/Survival and five adventure routes. It uses async resource/configuration loading with generation guards; backgrounding pauses and releases input. The touch interface shows only supported special/jump buttons and fits a 1024×576 layout inside the device safe area. It is still an integration menu, not the original production UI.

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

1. Complete remaining source gameplay/presentation parity: runtime verification of moving-strike leg layers, remaining CPU parity and runtime drill verification, runtime verification of clinch hand IK, combo-aftermath gestures, recoil/lift/travel details, rendered KO replay parity, all authored VFX/audio and procedural night-market overlays. Expand matchup/direction reference coverage.
2. Implement the original production menus/art, account entry, portraits, outfit shop, production challenge/ranking UI and browser-to-app save transfer. The present integration selector is not a finished UI.
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

## Native training and local progress

Seven source training modes now run natively: movement/distance, repeat, counter, grabs, bag, block and spar. Repeat/grab use the source 1000 ms idle interval; counter uses 1300 ms (it is a timed exercise, not reactive counter AI). Selected source basic moves are validated against the fighter configuration. Movement respects combo approach, calibrated gap and source rest cycles. Live settings pause the match and restore its previous pause state. Reopening the panel cannot overwrite that state. The present menu remains integration UI.

`ArenaProgress` implements local v2 profiles, wins, best Survival, challenge completion storage and per-mode/per-difficulty TOP 5. Source v1 JSON can be migrated when supplied; the app does not automatically read browser localStorage. The runtime saves completed fights and campaign/Survival scores to `Application.persistentDataPath/braxhorn.progress.v2.json`, using the source score/completion/time ordering and tournament average duration. Training/adventure results do not enter ordinary fight records. The new active clock excludes countdown, celebration and pause, includes combat hitstop. No online authentication, account ownership, shop authority or cloud ranking is implemented by this local save.

The disk adapter writes/flushed temporary data, retains a previous-generation backup and can recover after interrupted replacement. Corrupt files are preserved; unrecoverable data or unsupported schema blocks overwriting and displays an error. Unknown extension fields in supported data remain preserved. A valid prior backup is not replaced by a corrupt main file.

Evidence: four managed assembly boundaries compile; 27 training and 32 progress checks pass. The full exported-asset regression before adding progress passed 200 match and 542 adventure checks across 18 configurations. Progress tests cover profiles, migration, ranking, save/reload, broken primary/backup, future schema, write errors and pause/countdown exclusion. Android filesystem behavior and rendered training UI remain unverified.

## Challenges, CPU corrections and KO replay

All 25 original challenge definitions and Polish descriptions are carried into `ChallengeCatalog` from the pinned v271 source. Native selection applies drill/mode/difficulty/boss target and Nina's guard exclusions. The active drill mode cannot be changed during a challenge. Hit, kick, block, evade, counter, pressure-push and pair-break objectives originate in the simulation; events are emitted once per contact group. Geometry-only dodges compare against the original standing pose. Cancelling one's own throw or get-up immunity never earns a break/dodge. Survival goals persist across opponents; ordinary rematches reset the challenge. Completion saves the source achievement and local challenge record. The selector is integration UI, not the production challenge hub.

CPU uses the original full move order (including all eight Nina moves and five BOSS/ZOMBIE moves), source reaction wait, adaptive guard duration, repeat-attack response, bounded approach, tactical retreat and authored paired grabs. The 18-second COMBO cooldown is now separate from ordinary attack cooldown; the previous native policy could suppress basic attacks during this interval. Combo approach cannot be overwritten by ordinary CPU decisions. Remaining deep source AI/matchup parity and all rendered behavior still need review.

`KnockoutReplay` stores up to 240 pose samples within 3.6 seconds, retains the source KO window (-850/+1200 ms), and uses the original speed curve (0.9 to 0.28 to 1). Only pose, gait and captured combat-event playback occurs; simulation/damage/progression do not advance. Actions, facing flips and loop wraps remain discrete. Native playback is final-match KO only, supports skip/pause/background suspension, then applies the result exactly once. It is not an MP4 recording or a screenshot artifact. Video/world effects, blood and dynamic contact-IK fidelity in replay remain unverified/incomplete.

Validation before replay integration: all 18 native configs, 200 match and 542 adventure checks passed with the CPU corrections. Four managed assembly boundaries compile after replay integration. Dedicated checks: 201 challenges, 9 CPU, 17 replay, plus local progress/recovery checks. No Unity process, native render, Android APK or real-device test was executed.

## Native blood and original direction gestures

The source blood burst/gravity formula, colours, particle limit 96, floor-stain limit 100 and head/body wound limits are ported into a plain C# cosmetic state and two reusable Unity meshes. Floor stains render behind fighters; particles and capsule-attached marks render in front. Source head marks begin on every second head hit; body marks use the nearest authored capsule and saturate at severity 3. Camera scrolling shifts the effects in adventure; replacing an opponent clears only that opponent's wounds. Round reset keeps marks/stains while a new match clears everything. No damage authority is in the effect renderer.

`ArenaBuild` now binds `OriginalBlood.shader` explicitly into the generated native scene. Managed compilation does not compile this shader. GPU occlusion, gamma, skin placement, mobile overdraw/performance and source visual equivalence remain unverified. Blood is deliberately hidden during pose replay until replay effect snapshots are implemented, so replay visual parity is incomplete; corpse-captured wound fidelity also remains to validate.

Direction gestures now retain the source released-double-tap window (<300 ms): forward sprints, backward selects existing BACKFLIP/BACK_ROLL/QUICK_BACK metadata and authored retreat motion. Pause releases/reset the input latch. Pointer ownership remains per finger. Grab presses can escape a paired move during the existing 200 ms window; held grab continues to modify attack buttons. Brax guard+COMBO selects ENERGY_SPECIAL; Nina's guard input triggers her authored evade. Unsupported jump/special buttons are hidden rather than shown as nonfunctional controls. This does not implement the final original production control artwork.

Validation: all four managed assembly boundaries compile. Dedicated tests now include 33 progress, 201 challenge, 9 CPU, 17 replay, 14 blood and 14 input checks, supplementing the existing campaign/combat/adventure/geometry suites. Native shader, touch hardware, images/video and APK still require an actual Unity/device run.

Latest inspected Arena CI preflight (job 125627200823, code 5b12899) reported activationInputsAvailable=false and all four Unity activation inputs absent. This blocks a requested APK job but not further source implementation. No credential values were read or copied from City.

Final regression for the blood/input checkpoint passed all 18 native exported configurations: 200 match checks and 542 adventure checks, plus every dedicated suite listed above. The final UI control-cache change also passed separate four-assembly compilation and executable regressions. This remains managed-only evidence.


## Original-art native menus and local records

The native entry now has title, eight-fighter scrolling roster, per-character outfit selection, six modes, setup/difficulty/drills, 21 arena posters and five adventure routes, challenge hub/list, local profile and TOP 5 screens. All 25 challenge descriptions remain the source definitions; unavailable Nina guard challenges cannot start. Records retain source score/round/time/completion formats and filter by mode/challenge and difficulty. Name entry validates the existing local v2 contract and commits the in-memory profile only after disk save succeeds. This is explicitly a local profile, not authenticated online identity.

27 original UI images and eight original outfit labels/prices are pinned to the v271 commit and SHA-256 in the media catalog. Export now packages 160 verified files / 334967409 bytes. Decoding WebP to PNG does not redraw or replace the artwork. Each visible native image owns its request/decoded texture, cancels requests and frees textures when hidden, and uses the Android-compatible StreamingAssets URL. Screens use the existing safe-area fitted uGUI root; code does not embed HTML or run JS. Layout/typography is native and has not been visually compared with source. Outfit selection remains review access, pending server-owned inventory integration; it is not a working shop or proof of ownership.

Pause now provides resume and return to menu; opening training hides the general pause panel, and returning from application suspension retains an explicit pause. Four managed assembly boundaries and all executable rule suites passed. Media hashes/encoding passed. Actual keyboard/touch focus, async image cancellation, rendered layout, shaders, Unity import and Android execution remain unverified. Prior GitHub run 41552921286 at 2ca6a0 completed successfully for source validation, not APK.


## Native account and server-owned outfit shop

`ArenaOnlineClient` is a plain C# HttpClient adapter to the original v271 `/api/account` and `/api/shop` contracts. It provides account refresh/login/registration/logout/guest, preset avatar/password calls, inventory refresh, purchases with expectedPrice, and server-authorized price calls. Native account and shop pages wire login/registration/logout, preset selection during registration, inventory browsing, explicit price confirmation, purchase and equip. Local profile remains separate. Owner price editing and password/avatar management currently have adapter methods but no native management screen. Camera/upload/crop, durable secure session storage and legacy platform owner login are still unported.

The server is the only authority for player identity, prices, balance and owned outfits. Requests serialize; changing account clears prior inventory. Confirmed ownership replaces the previous review-wide outfit access. Roster returns to a base outfit when the active server identity no longer owns the selected variant. No local wins grant virtual currency; ranking settlement integration remains necessary. On a price conflict the returned inventory is updated, then the error is shown and fresh confirmation is required. A timeout does not automatically retry a purchase. The UI clears password fields on submit/exit and disables repeated requests while waiting. CookieContainer stays in memory; no tokens/passwords are saved to progress/PlayerPrefs or exposed in logs. HTTPS origin validation, normal TLS certificate checks, redirect rejection, 20-second deadline and 256 KiB response limit apply. Android builder explicitly requests Internet permission.

34 executable mocked-transport tests passed for source request fields, authoritative identity/inventory, account isolation, changed prices, malformed/oversized responses, timeouts, serial requests and cancellation. Four managed assembly boundaries compile. No real account was registered/logged in, no purchase was made, and Android HttpClient/cookies/TLS/IL2CPP remain unvalidated.

The first menu CI run 41554689223 found a real export error: the published title PNG URL returned 404 because deployment converts source PNGs losslessly to WebP. Both title/training published WebP payload hashes are now locked, and their dimensions and every decoded RGBA byte were verified against pinned source PNGs. Export verifies both payload and pixels; it never accepts a changed image. All 27 published UI URLs were independently downloaded and hash-verified. `--prefer-delivery --offline` passed the full 160-file export, now 335269305 bytes after canonical PNG re-encoding. The next push must confirm this fix in CI; the failed menu run was not restarted or cancelled.


## Private server progress and durable result settlement

Native matches now start a server session before reporting results when an account is authenticated; guest fights remain local. `ArenaOnlineClient.Ranking` retains the original start/finish/challenge fields, original rounding and server-issued match IDs. `ArenaRankTracker` serializes the match start, settlement and win challenge, and flushes the prior bout before starting the next campaign bout. Results are client-reported private progress; this does not make CPU scores verified public competition. Adventure and multiplayer settlement are still separate/unported.

A per-account pending queue stores at most 30 results for one identity, never drops older pending results to make room, and uses flush/temporary replacement plus backup recovery. Unsupported/corrupt saves are preserved. Temporary failures and 429 remain queued; permanent 4xx rejection is surfaced; 401 waits for the same account to authenticate. Expected-identity checks run inside the HTTP serialization gate so an account switch cannot send old results under a new account. No tokens/passwords are stored with results. Results display their actual server status, and the records screen supports retry and separately labelled server-owned fighter progress. Local TOP 5 remains local; this is not a migrated public leaderboard UI.

25 executable ranking checks pass for durable queue/recovery, ordering, round/timer payloads, idempotent pending entries, transient/permanent rejection, retries, account isolation, authenticated statistics and malformed responses. Further runtime network/IL2CPP verification is required; no live ranking data was written. An additional pause correction keeps arena video frozen when resuming pose-only KO replay.

The account/media checkpoint's GitHub run 41555921861 at c2e12d9 passed the native C# rules and original media jobs, confirming the published WebP restoration fix. Fighter export was still running at the latest read. APK was not requested at this intermediate checkpoint; activation prerequisites still need configuration before a permitted CI build can execute.


## Original cinematics and menu audio

The native flow now plays the original start film, the eight fighter entrance films, the BOSS entrance for the authored Survival/tournament encounter, and six winning Arcade/tournament finales. Regular rematches omit the entrance as in source. The startup copyright image receives four foreground seconds after decoding; hiding the app pauses the deadline and video. Retry and skip remain available after preparation/decoding failure. Cancelling a sequence removes its completion callback and releases its decoder; stale decoder callbacks cannot start a replaced match. The match countdown/input and arena sound/video remain paused until the entrance finishes. Results are saved before a finale and each completed campaign is celebrated once. This is playback of authored original films, not a recording of native gameplay.

Menu title and roster music, selection and confirmation cues now use the original recordings and source volumes. Global sound state covers combat, menus and films. Focus and application-pause events are combined so one callback cannot resume audio while the other still reports suspension. Native menu artwork, cinematic decoding, audio focus and Android lifecycle still need runtime validation.

All 16 movie payloads are pinned to the published v271 source SHA-256. Copyright WebP pixels were compared with the original source PNG; the export locks both delivery payload and decoded RGBA hashes. Offline export with published encodings passes 177 files / 420611050 bytes, including 28 original interface images and 16 cinematics. Four managed assemblies and all executable suites pass, including 21 new cinematic transition/deadline/cancellation checks. No Unity Editor process or native gameplay capture was run.

GitHub native source validation for the previous ranking checkpoint (run 41557110279, commit 8b1ba04) completed successfully. The earlier account checkpoint also finished successfully. Neither is an Android application build.
