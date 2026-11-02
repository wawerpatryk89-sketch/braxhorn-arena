# Braxhorn Arena Unity migration

## Confirmed baseline

- User authorized migration of the whole Arena to Unity and eventual native Android/Google Play delivery on 2026-11-02.
- This is **Arena**, not the separate City/osiedle repository.
- Published source: Site version 271, commit `f355fe6ac6af41518fde420382512d49bd27d51a` (2026-10-28).
- GitHub `braxhorn-arena/main` was still `dc7a4f16ccd3214b2ba7cb43f06713ef90bf857a` (2026-10-20). It is not an interchangeable asset baseline.
- Unity project created in `unity-arena`, Editor `6000.3.27f2`, built-in render pipeline, C# domain rules isolated from Unity presentation.
- No production Scene, APK, AAB or validated Unity player exists yet. Do not describe this checkpoint as a completed game migration.

## Current implementation

`unity-tools/arena/export-source.mjs` uses the original Three.js math/rig **offline** to bake authored actions, including existing IK and tail corrections. The Unity player does not include Three.js, JavaScript, a WebView, or a browser canvas. The source models retain their mesh topology and full 8/12-weight skinning. Coordinate handedness is converted by reflecting Z, reversing triangle winding, and converting bind matrices/quaternions together.

The exported payload contains 10 base/NPC models plus 8 outfits, 2,952 configured action poses and all original combat configuration. Native Editor tooling converts them to Unity meshes, prefabs, ScriptableObjects and AnimationClips. Imported assets and source caches are regenerable and ignored by Git. The original source assets remain in the source repository at the pinned baseline.

`Arena.Domain` contains offline Arcade/tournament/Survival rules and circle/capsule contact math. `Arena.Runtime` owns fighter definitions and native Playables pose evaluation. `Arena.Editor` owns import and material conversion. Do not couple Editor namespaces into runtime assemblies.

## Still required for complete migration

1. Execute the importer in a working licensed Unity Editor, validate bind poses, facing, 12-weight deformation, shader appearance and action transitions against original rendered samples.
2. Port the complete authoritative combat loop, paired moves, moving-strike layering, combo aftermath, CPU behavior, input buffering, round/KO/replay behavior and audio/VFX; preserve damage/timing configuration.
3. Port the Polish/English menus, touch controls, account entry, portraits, outfit shop, training/challenges, rankings and save migration.
4. Port the adventure routes, films, camera travel, gates, encounters, corpses, boss/zombie behavior and outfit-specific adventure motion overrides.
5. Keep the existing backend authoritative for accounts/shop/online results. Implement native account/session handling, room/signaling protocol, multiplayer input/snapshot behavior and voice. Two-peer tests are mandatory before claiming parity.
6. Package arenas/media for Android, optimize measured CPU/GPU/memory use, produce APK for device tests and signed AAB for Google Play. Confirm store account, sale price, product identity, signing and declarations before publication.

## Environment evidence and limits

The local Editor binary can start, but licensing IPC fails with `0x80000000`; Package Manager fails with `uv_interface_addresses` / operation not permitted. This is an environment blocker. It does **not** establish whether the user's Unity account has a license. Do not bypass activation or sandbox restrictions.

The C# source was compiled with Roslyn and actual 6000.3.27f2 managed reference assemblies; this is not an Editor import, shader compile or Android build. The offline rules passed 192 reference scenarios / 3,312 states and 3 contact edge cases. Asset payload validation passed for 18 models, 2,952 actions, 268,358 sampled frames and 1,083,207 vertices. Visual/device validation has not run.

## Ownership

Preserve the original web game and existing untracked source-restoration temporary files. Migration changes belong only to the dedicated branch. Never publish a diagnostic importer or partial scene as the finished paid game. Store release gates remain closed until the complete scope and device tests pass.
