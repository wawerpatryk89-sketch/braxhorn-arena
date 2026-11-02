# Arena → Unity 6 migration

Native asset pipeline, ported rules, match simulation and a native combat integration scene. **This is not the completed Arena game or a Google Play release.**

## GitHub Actions build

No local Editor is required. `Arena Unity migration - native validation` on `codex/arena-unity6-migration-20261102` runs:

1. Presence-only check of Unity activation inputs, without printing values.
2. Native C# comparisons against frozen published v271 rules.
3. Hash-verified reconstruction of the source inputs in `native-source/`.
4. Full native model/action export and validation, with asset archive and SHA-256 artifacts.
5. Optional Unity 6000.3.27f2 import and Android ARM64/IL2CPP development build, only on manual dispatch with `build_apk=true` and configured activation.

The current user scope is the Unity project for an app they will build later. Push validation exports assets and runs tests; it does not request an APK.

Build entry point: `Braxhorn.Arena.Editor.ArenaBuild.AndroidCombat`. The separate `AndroidReview` entry point remains available for single-fighter inspection.
Output: `build/Android/BraxhornArena-UnityCombat.apk` (only after a successful licensed Unity build).
Review package ID: `com.braxhorn.arena.unityreview`.
The combat scene connects actual fighters to native fixed-step match simulation, two-finger touch/keyboard input, CPU, round results and Arcade/tournament/Survival plus the five native adventure routes. The model review scene remains separate. Neither interface is the final production menu. Unity rendering, scene wiring, mobile usability and device performance remain unverified.

The Arena repository currently has no Unity activation secrets. CI needs UNITY_EMAIL, UNITY_PASSWORD and either UNITY_LICENSE or UNITY_SERIAL through GitHub Actions secrets. Missing inputs fail only an explicitly requested APK build. An intentionally unrequested/skipped APK is not a successful app build. Never put secret values in code, artifacts, logs or chat.

## Source fidelity

`source-lock.json` pins v271 / f355fe6ac6af41518fde420382512d49bd27d51a. Public payload URLs and hashes are also pinned. Metadata is decoded from gzip, published model patches reproduce the source mesh, and packaged clips contain the exact selected source samples. Original and verified published encodings are accepted; arbitrary data is rejected. Three.js is used only for offline conversion; the native player runs C# without JavaScript, Three.js, WebView or browser canvas.

```bash
node --max-old-space-size=8192 --loader ./scripts/krov-three-loader.mjs unity-tools/arena/export-source.mjs
python3 unity-tools/arena/validate-export.py
```

These commands require the complete pinned source checkout. The CI reconstruction handles the older GitHub source tree automatically. Texture conversion preserves decoded pixels; all skin influences are retained. Constant animation channels keep identical endpoints instead of redundant repeated values.

## Rule verification

```bash
node unity-tools/arena/tests/campaign-reference.mjs
node unity-tools/arena/tests/combat-reference.mjs
node unity-tools/arena/tests/media-reference.mjs
dotnet run --project unity-tools/arena/tests/Arena.RulesParity.csproj -- unity-tools/arena/tests/campaign-reference.json.gz unity-tools/arena/tests
```

Evidence: 192 campaign scenarios / 3,312 states and 26,198 combat-reference comparisons across 18 variants. Extra checks cover mirrored contacts, once-per-group damage, once-per-action energy, regional guard, frame skipping and contact holds. The additional match regression runner checks native contacts, same-step trades, regional guard/evasion, training recovery, input release, round progression and paired grabs. With the full exported SourceData directory as a third argument it also executes every actual variant, checks each configured combo reaching its paired finisher, and runs CPU matches for base/NPC fighters. These checks do not establish full browser/Unity gameplay parity, rendering, multiplayer or production-menu equivalence. Adventure regressions exercise the route lifecycle, all original entrance motions, and playable fighters' paired actions against boss/zombie configurations.

See `unity-arena/Docs/AI/UnityProjectContext.md` and `validation.json` for remaining scope. C# compilation does not prove Unity import, APK build, device behavior or completed migration.

## Verified cloud artifact

The previous media/match run 41510507631 (code c5bbfb76fbccaf190a7d3f3fa3ba0b17ec7e2f45) passed asset/media/rule jobs and 200 native match checks. Fighter artifact 13172433665 and media artifact 13171983537 are data archives, not APKs. This run predates the 34 additional adventure motion actions. Its Android job was skipped; APK is now opt-in. See validation.json for exact links, checksums and current local evidence.

The two source guard clips omitted from public packaging are preserved verbatim in supplements/. Their hashes are pinned in source-lock.json; source conversion never substitutes another animation.

## Native match integration checkpoint

`ArenaMatch` owns simulation, contacts, pressure, action buffering, recovery, rounds and results. `CpuOpponent` submits the same commands as the player and keeps the source fighter preferences/reaction delays. The source-calibrated combo reaction selection, capsule pursuit, paired clocks/root tracks and post-pair recovery are ported in the match partials. Touch pointer ownership is in `TouchFightButton`; `NativeMatchPlayer` owns Unity loading, scene presentation and campaign navigation.

Keyboard: A/D or arrows to move, Ctrl guard, S low guard, Shift sprint, G grab modifier; J/K punches, U/I kicks, L evade, O combo, P energy, Escape pause. Touch controls mirror these commands. Jump is only accepted when an authored JUMP action exists. Backgrounding clears held input and requires explicit resume.

Fallback verification without running the Editor:

```bash
python unity-tools/arena/tests/compile-with-editor.py --editor-data /path/to/Editor/Data --out-dir /tmp/arena-rule-tests --with-assets
```

This compiles Domain, Runtime, Editor and EditMode test assemblies separately against real Unity references and executes plain C# tests; it cannot validate imported animation/materials, Play Mode, IL2CPP or phone behavior.

### Original offline arenas and audio

Run `python unity-tools/arena/export-media.py --offline` against the full verified source checkout, or omit `--offline` for hash-checked restoration from the pinned public source URLs. The script requires Pillow and ffmpeg/ffprobe. It writes generated media to `unity-arena/Assets/StreamingAssets/ArenaMedia` and the catalog to `Assets/Arena/Resources/ArenaMediaCatalog.json`; both are ignored by Git. CI separately packages/restores the payload before `ArenaBuild.AndroidCombat`.

The native match selector includes all 21 original backgrounds. No network/browser is required for playback. Audio uses the surviving v271 recorded clips, never TTS or replacement voices. MP4s and audio remain byte-identical; WebP posters decode to PNG; Harbor's animated GIF is transcoded to H.264 CRF 16. Thirty adventure films and all five route definitions are packaged and connected to the native adventure controller described below.

`node unity-tools/arena/tests/media-reference.mjs` produces 210 comparison cases from the frozen original arena catalog. The managed runner checks native floor/crop calculation and loop edges, plus countdown/swishes during misses/repeated hit frames/pause. Actual Unity video decoding, first-frame orientation/color, transition seams, audio synchronization, shader compilation and phone performance are untested. Night-market procedural effects, complete VFX/replay, full production UI and online features remain open.

Unity API basis: [StreamingAssets](https://docs.unity.com/en-us/engine/6000.3/manual/building-and-publishing/streaming-assets) and [Video Player](https://docs.unity.com/en-us/engine/6000.3/manual/video/player). Android StreamingAssets is a URL inside the APK, so native requests use UnityWebRequest/VideoPlayer rather than ordinary filesystem reads.


### Native adventure integration

`AdventureRun` owns a fixed-step six-encounter route. `AuthoredTravel` uses the original root-distance tracks; the exporter includes 16 outfit-specific adventure walks and all 18 entrance runs. The authored doorway path, 450 ms establishing shot, braking, turn and foreground occlusion are wired to the actual 3D fighter. Prefight poses receive the original foot-grounding correction before baking.

Exploration keeps the original chapter gates/camera follow. The player object, HP, energy and move state survive opponent replacement. Incoming rivals are prepared during combat, revealed at 20% enemy HP, and promoted without resetting their world position/clock. Final grounded KO poses are captured from the Unity rig once; source scoring, post-win healing, the city pickup, boss finale, defeat and local result are handled by the domain. NPC receiver compatibility extends the source KROV mappings exactly as the browser loader does.

`NativeAdventureWorld` bounds decoding to the current and next film, retains the preceding decoded edge, and uses the original narrow crossfade between chapters. Door masks and frozen bodies use explicitly referenced shaders. The original chapter AAC gain is applied through an audio-thread filter without modifying the media files. Backgrounding pauses films, combat and inputs. Rankings remain explicitly offline; account/backend/leaderboard integration is still required.

These are implemented and managed-code-tested paths. Unity shader import, video orientation, actual entrance rendering, corpse capture, mobile memory and touch ergonomics need runtime validation; no screenshot, recording or device result is implied.

Current local evidence: 18 variants / 2986 actions / 270381 pose frames passed payload validation; 200 match checks and 542 adventure checks passed with actual configurations. The BRAX/NYXA adventure unlit material profile is implemented separately from the original PBR variants. Overall lighting/tone-map equivalence still needs rendered comparison.
