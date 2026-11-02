# Braxhorn Arena Unity migration

## Confirmed baseline

- User authorized migration of the whole Arena to Unity and eventual native Android/Google Play delivery on 2026-11-02.
- This is **Arena**, not the separate City/osiedle repository.
- Published source: Site version 271, commit `f355fe6ac6af41518fde420382512d49bd27d51a` (2026-10-28).
- GitHub `braxhorn-arena/main` was still `dc7a4f16ccd3214b2ba7cb43f06713ef90bf857a` (2026-10-20). It is not an interchangeable asset baseline.
- Unity project created in `unity-arena`, Editor `6000.3.27f2`, built-in render pipeline, C# domain rules isolated from Unity presentation.
- A native review scene generator and ARM64 IL2CPP build method exist but have not run in Unity. No production Scene, APK, AAB or validated Unity player exists yet. Do not describe this checkpoint as a completed game migration.

## Current implementation

`unity-tools/arena/export-source.mjs` uses the original Three.js math/rig **offline** to bake authored actions, including existing IK and tail corrections. The Unity player does not include Three.js, JavaScript, a WebView, or a browser canvas. The source models retain their mesh topology and full 8/12-weight skinning. Coordinate handedness is converted by reflecting Z, reversing triangle winding, and converting bind matrices/quaternions together.

The exported payload contains 10 base/NPC models plus 8 outfits, 2,952 configured action poses and all original combat configuration. Native Editor tooling converts them to Unity meshes, prefabs, ScriptableObjects and AnimationClips. Imported assets and source caches are regenerable and ignored by Git. The original source assets remain in the source repository at the pinned baseline.

`Arena.Domain` contains offline Arcade/tournament/Survival rules and circle/capsule contact math. `Arena.Runtime` owns fighter definitions and native Playables pose evaluation. `Arena.Editor` owns import and material conversion. Do not couple Editor namespaces into runtime assemblies.

## Still required for complete migration

1. Execute the importer through licensed cloud CI, validate bind poses, facing, 12-weight deformation, shader appearance and action transitions against original rendered samples.
2. Finish whole-game parity beyond the native match checkpoint below: moving-strike pose layering, complete source CPU/drill variants, neutral clinch/automatic gestures, recoil/lift/travel presentation, KO replay, all authored combo/ground VFX/audio and the procedural night market. Validate all matchup/direction combinations against browser reference traces; current actual-combo tests use each fighter against itself.
3. Replace the native integration menu with complete Polish/English production menus/art, account entry, portraits, outfit shop, training/challenges, rankings and save migration. Basic native touch and offline campaign navigation now exist; device validation remains required.
4. Port the adventure routes, films, camera travel, gates, encounters, corpses, boss/zombie behavior and outfit-specific adventure motion overrides.
5. Keep the existing backend authoritative for accounts/shop/online results. Implement native account/session handling, room/signaling protocol, multiplayer input/snapshot behavior and voice. Two-peer tests are mandatory before claiming parity.
6. Validate the packaged arenas/media on Android, optimize measured CPU/GPU/memory use, produce APK for device tests and signed AAB for Google Play. Confirm store account, sale price, product identity, signing and declarations before publication.

## Environment evidence and limits

The local Editor binary can start, but licensing IPC fails with `0x80000000`; Package Manager fails with `uv_interface_addresses` / operation not permitted. This is an environment blocker. It does **not** establish whether the user's Unity account has a license. Do not bypass activation or sandbox restrictions.

The C# source was compiled with Roslyn and actual 6000.3.27f2 managed reference assemblies; this is not an Editor import, shader compile or Android build. The offline rules passed 192 reference scenarios / 3,312 states and 3 contact edge cases. Asset payload validation passed for 18 models, 2,952 actions, 268,358 sampled frames and 1,083,207 vertices. Visual/device validation has not run.

## Ownership

Preserve the original web game and existing untracked source-restoration temporary files. Migration changes belong only to the dedicated branch. Never publish a diagnostic importer or partial scene as the finished paid game. Store release gates remain closed until the complete scope and device tests pass.

## Cloud continuation, 2026-11-02

The user cannot use a local Unity Editor. Continue through GitHub Actions; do not ask them to install/open the Editor. Native runtime compilation, tests and target builds remain distinct acceptance levels.

Added `CombatConfiguration`, `CombatRules`, `ActionClock`, `CombatContacts` and `AttackLedger`: authored timing, directional input mapping, frame-complete advancement, mirrored source capsule contacts, regional guard/evasion, and once-per-group damage/once-per-action energy. The full authoritative match orchestrator is still unported. The frozen source helpers passed 26,198 comparisons across 18 variants/2,952 actions, in addition to 192 campaign scenarios/3,312 states. Extra checks cover frame partitioning, exact contact holds, malformed durations, mirrored contacts and blocked/repeated energy awards.

`FighterReviewPlayer` and `ArenaBuild.AndroidReview` provide a native technical review scene and Android ARM64 IL2CPP build entry point. The review UI is explicitly not the production UI or a complete game. It loads only one fighter at a time from `Resources/Fighters`, supports actions/facing/pause, and stops on focus loss. Constant animation channels now retain two identical endpoints; authored changing samples and all skin weights are preserved.

CI restores published source payloads with verified hashes and the same model patch as the published client. Exact selected clip samples and reconstructed models were compared with the source baseline before pinning. A missing `vendor/three.core.js` dependency in the first isolated restoration was diagnosed and added to the lock. Do not weaken hashes or substitute older GitHub assets.

Cloud preflight on runs 41483474470 and 41486725021 found no UNITY_LICENSE, UNITY_EMAIL, UNITY_PASSWORD or UNITY_SERIAL in the Arena repository. This is a repository configuration gap, not evidence that the user lacks a license. The build job stays blocked and a separate prerequisite job fails explicitly; no APK exists. Do not copy or print secrets from City. The complete gameplay, paired choreography, adventure, production UI, network sessions and native audiovisual integration remain required as listed above.

## Confirmed final cloud evidence for this change

Run 41489510857 on source commit f196a428132bf16131c6f25ae69997c13b365e84 completed 2026-11-02 18:24:52 Europe/Zurich. Native rule comparisons and the complete 18-variant/2,952-action export validation passed. The verified native source archive is GitHub artifact 13164641101 (834,897,924 bytes). Overall workflow conclusion is failure solely because the explicit missing-activation job fails; the Unity Android job was skipped. No Unity Editor import, shader run, APK, device test or full-game completion is established.

Two referenced guard clips were missing from the published packages: BEAR/Blocking and DEMON/Standing Block End. Their exact original source samples are now pinned under unity-tools/arena/supplements and merged during offline conversion. Recursive clip coverage fails early if any future authored reference is missing. Ten restored pose payloads were compared after decompression with the original full-source export and matched byte for byte. Static animation-channel reduction keeps 49,095,070 keys instead of 185,273,970, without discarding changing samples; this is a data-size audit, not a runtime performance measurement.

The final evidence update is documentation-only and intentionally does not rerun the expensive unchanged asset exporter. Full gameplay migration still requires the implementation and validation items listed above.

## Native match continuation (after the asset checkpoint)

Added `ArenaMatch` (including Combo and Pairs partials), `CpuOpponent`, `NativeMatchPlayer`, and `TouchFightButton`. The 60 Hz authoritative simulation handles both fighters symmetrically: commands, movement/sprint, regional guards, authored capsule contacts, once-per-group damage, pressure/recoil/fall/getup protection, shared paired animation time/root travel, source combo reaction selection/pursuit, first-contact pose hold, paired finisher and recovery, training HP restoration, countdown, timed/best-of-three rounds and celebrations. CPU uses the same public commands. The native scene wires these to the actual meshes/clips, async configuration parsing, selection and existing offline campaign domains.

Native play is not yet validated in Unity. No final scene rendering, original arena films/audio/VFX, complete production menu, adventure or multiplayer was demonstrated. The integration UI explicitly states its test scope. Keep Android application ID separate from a paid release. All source remains on the migration branch.

`MatchParityRunner` adds behavioral regression tests and optional real-export tests, in addition to the original reference comparisons. Regression coverage caught and fixed timer rounding and dropping accumulated simulation time when resetting a round. The full-asset run checks 18 variants, configured paired-combo completion and base/NPC CPU matches. This is execution of C# gameplay rules, not an image/video or phone test. The pinned full Unity asset export is unchanged. CI now runs these tests against that export and uses `ArenaBuild.AndroidCombat`; actual build still depends on repository Unity activation.

## Original media continuation

The prior match checkpoint is confirmed in cloud run **41502992008**, commit `3c37f0fc0a36c9052d4f2088708997dd8e144533`: all 18 exports and 196 native match checks passed. The run finished 2026-11-02 **19:53:09 Europe/Zurich** with overall failure because activation inputs remain absent. The Android job was skipped. Artifact **13169783161** (834,899,254 bytes) is source assets, not an APK.

`export-media.py` locks 133 original media files by SHA-256 and packages 21 arenas, all five adventure routes/30 chapter films, and 31 retained audio keys for offline StreamingAssets use. MP4/audio/JPEG stay byte-identical. WebP posters become lossless PNG; the single Harbor GIF is transcoded to H.264 CRF 16, an explicit encoding change, not an invented scene. The output contains provenance and original audio credits. The source catalog and all route metadata are frozen under `unity-tools/arena/media`; do not silently refresh from the live website.

`NativeArenaMedia` and its explicitly referenced shader render behind 3D fighters, apply original cover/contain and brightness/contrast, retain decoded frames across stalls, and blend the final .45 seconds of a loop toward its first decoded frame. `NativeMatchPlayer` selects all 21 arena backgrounds, computes the original crop-dependent floor, and gates the fight on media/audio preparation. `NativeFightAudio` uses native AudioSources with bounded effects, per-fighter voice channels, announcer ducking, source gender/pitch and pause/mute behavior. Authoritative events include 3/2/1/FIGHT and one swish per authored hit group even on misses. Removed taunt/effort voices remain absent. This is implementation plus managed compilation, **not proof of Unity playback**.

Local exporter validation: 133 files / 312,704,687 output bytes; all 50 video streams H.264/yuv420p. Original catalog comparison: 210 floor/crop cases. Remaining audio gaps include source compressor/mix equivalence and every combo/ground cue; night-market procedural overlays and VFX have not yet been ported. Adventure media packaging alone is not adventure gameplay. No new screenshot/recording or APK exists.

`AdventureEntrance` ports the source doorway/edge path, reciprocal projected depth, yaw transition and bounds-based door fitting. It passed 90 original-source cases / 810 samples across all 18 variants and five routes. This domain component is not yet connected to a playable native adventure scene; full entrance run poses, foreground masking and encounters remain open.

The first media CI run (41509872935) exposed original-vs-published delivery paths: the existing `scripts/package-arena-assets.mjs` moves arena WebP/MP4 and underground chapter MP4 files to immutable `/api/arena-media/<stem>.<hash>.ext` URLs. The media lock now records those 28 exact delivery URLs without changing any source SHA-256. Do not interpret the old-path HTTP failure as missing original artwork, and never replace a failed file with a different asset. The decoder now waits until end-of-frame before snapshotting its first frame, and detects loop wrap without assuming that a device renders within 200 ms.
