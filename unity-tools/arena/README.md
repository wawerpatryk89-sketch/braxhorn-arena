# Arena → Unity 6 migration

Native asset pipeline, ported rules, match simulation and a native combat integration scene. **This is not the completed Arena game or a Google Play release.**

## GitHub Actions build

No local Editor is required. `Arena Unity migration - native validation` on `codex/arena-unity6-migration-20261102` runs:

1. Presence-only check of Unity activation inputs, without printing values.
2. Native C# comparisons against frozen published v271 rules.
3. Hash-verified reconstruction of the source inputs in `native-source/`.
4. Full native model/action export and validation, with asset archive and SHA-256 artifacts.
5. Unity 6000.3.27f2 import and an Android ARM64/IL2CPP development build when activation is configured.

Build entry point: `Braxhorn.Arena.Editor.ArenaBuild.AndroidCombat`. The separate `AndroidReview` entry point remains available for single-fighter inspection.
Output: `build/Android/BraxhornArena-UnityCombat.apk` (only after a successful licensed Unity build).
Review package ID: `com.braxhorn.arena.unityreview`.
The combat scene connects actual fighters to native fixed-step match simulation, two-finger touch/keyboard input, CPU, round results and the existing Arcade/tournament/Survival domains. The model review scene remains separate. Neither interface is the final production menu. Unity rendering, scene wiring, mobile usability and device performance remain unverified.

The Arena repository currently has no Unity activation secrets. CI needs UNITY_EMAIL, UNITY_PASSWORD and either UNITY_LICENSE or UNITY_SERIAL through GitHub Actions secrets. Missing inputs cause an explicit failure; a skipped APK is not success. Never put secret values in code, artifacts, logs or chat.

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
dotnet run --project unity-tools/arena/tests/Arena.RulesParity.csproj -- unity-tools/arena/tests/campaign-reference.json.gz unity-tools/arena/tests
```

Evidence: 192 campaign scenarios / 3,312 states and 26,198 combat-reference comparisons across 18 variants. Extra checks cover mirrored contacts, once-per-group damage, once-per-action energy, regional guard, frame skipping and contact holds. The additional match regression runner checks native contacts, same-step trades, regional guard/evasion, training recovery, input release, round progression and paired grabs. With the full exported SourceData directory as a third argument it also executes every actual variant, checks each configured combo reaching its paired finisher, and runs CPU matches for base/NPC fighters. These checks do not establish full browser/Unity gameplay parity, rendering, adventure, multiplayer or production-menu equivalence.

See `unity-arena/Docs/AI/UnityProjectContext.md` and `validation.json` for remaining scope. C# compilation does not prove Unity import, APK build, device behavior or completed migration.

## Verified cloud artifact

Run 41489510857 (code f196a428132bf16131c6f25ae69997c13b365e84) successfully exported and validated the full native asset payload and passed the rule comparisons. Artifact 13164641101 is the native asset archive, not an APK. The workflow remains failed because Unity activation is absent, and the Android build was skipped. See validation.json for direct artifact links and checksums.

The two source guard clips omitted from public packaging are preserved verbatim in supplements/. Their hashes are pinned in source-lock.json; source conversion never substitutes another animation.

## Native match integration checkpoint

`ArenaMatch` owns simulation, contacts, pressure, action buffering, recovery, rounds and results. `CpuOpponent` submits the same commands as the player and keeps the source fighter preferences/reaction delays. The source-calibrated combo reaction selection, capsule pursuit, paired clocks/root tracks and post-pair recovery are ported in the match partials. Touch pointer ownership is in `TouchFightButton`; `NativeMatchPlayer` owns Unity loading, scene presentation and campaign navigation.

Keyboard: A/D or arrows to move, Ctrl guard, S low guard, Shift sprint, G grab modifier; J/K punches, U/I kicks, L evade, O combo, P energy, Escape pause. Touch controls mirror these commands. Jump is only accepted when an authored JUMP action exists. Backgrounding clears held input and requires explicit resume.

Fallback verification without running the Editor:

```bash
python unity-tools/arena/tests/compile-with-editor.py --editor-data /path/to/Editor/Data --out-dir /tmp/arena-rule-tests --with-assets
```

This compiles managed source against real Unity assemblies and executes plain C# tests; it cannot validate imported animation/materials, Play Mode, IL2CPP or phone behavior.
