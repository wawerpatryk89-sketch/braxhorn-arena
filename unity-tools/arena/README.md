# Arena → Unity 6 migration

Native asset pipeline, ported rules and a technical model/animation review player. **This is not the completed Arena game or a Google Play release.**

## GitHub Actions build

No local Editor is required. `Arena Unity migration - native validation` on `codex/arena-unity6-migration-20261102` runs:

1. Presence-only check of Unity activation inputs, without printing values.
2. Native C# comparisons against frozen published v271 rules.
3. Hash-verified reconstruction of the source inputs in `native-source/`.
4. Full native model/action export and validation, with asset archive and SHA-256 artifacts.
5. Unity 6000.3.27f2 import and an Android ARM64/IL2CPP development build when activation is configured.

Build entry point: `Braxhorn.Arena.Editor.ArenaBuild.AndroidReview`.
Output: `build/Android/BraxhornArena-UnityReview.apk`.
Review package ID: `com.braxhorn.arena.unityreview`.
The review scene loads actual models and authored actions with native Unity rendering, supports changing fighter/action/facing, and pauses on focus loss. Its technical UI is not the production menu and must not be described as a gameplay acceptance build.

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

Evidence: 192 campaign scenarios / 3,312 states and 26,198 combat-reference comparisons across 18 variants. Extra checks cover mirrored contacts, once-per-group damage, once-per-action energy, regional guard, frame skipping and contact holds. They do not validate the full match orchestrator, paired combos, adventure, multiplayer or native production menus.

See `unity-arena/Docs/AI/UnityProjectContext.md` and `validation.json` for remaining scope. C# compilation does not prove Unity import, APK build, device behavior or completed migration.
