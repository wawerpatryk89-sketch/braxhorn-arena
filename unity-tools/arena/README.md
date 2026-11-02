# Arena → Unity 6 migration checkpoint

This checkpoint is an asset migration pipeline and a partial C# rules port, **not a finished Unity game or Android release**. The web game stays intact.

Use Unity **6000.3.27f2** (`22188f149405`). The project is `unity-arena/`.

## Source requirement

Assets and pose corrections are pinned by `source-lock.json` to published Arena v271, source commit `f355fe6ac6af41518fde420382512d49bd27d51a`. The complete source checkout is retained on the migration branch of the existing source repository. The GitHub migration branch mirrors the new Unity code/tooling; the older GitHub main asset tree alone cannot recreate v271. The exporter rejects missing or changed baseline files instead of silently importing an older game.

With that source checkout, Node 22+ and Python/Pillow:

```bash
node --max-old-space-size=8192 --loader ./scripts/krov-three-loader.mjs unity-tools/arena/export-source.mjs
python3 unity-tools/arena/validate-export.py
```

The exporter writes `unity-arena/Assets/Arena/SourceData`. Source bytes are hashed; textures are decoded losslessly to PNG; configured poses are baked using the original procedural rig. Dynamic gameplay pose combinations, adventure motion overrides and transitions still require runtime parity validation.

Open `unity-arena` in Unity, let package imports finish, then run **Braxhorn → Migration → Import exported fighters**. For automated import:

```bash
"$UNITY_EDITOR" -batchmode -nographics -quit -projectPath "$PWD/unity-arena" -executeMethod Braxhorn.Arena.Editor.NativeFighterImporter.ImportAll -logFile "$PWD/unity-import.log"
```

Run EditMode `NativeMigrationTests` in a working Editor. A non-graphical import does not verify appearance. No production startup Scene or Android build method is supplied at this checkpoint.

## Rules regression tests

```bash
node unity-tools/arena/tests/campaign-reference.mjs
dotnet run --project unity-tools/arena/tests/Arena.RulesParity.csproj -- unity-tools/arena/tests/campaign-reference.json.gz
```

The reference JS files are frozen from v271 and are used only by migration tests. The GitHub workflow runs these rule tests; it does not build an APK. C# runtime uses neither JS nor Three.js.

See `unity-arena/Docs/AI/UnityProjectContext.md` for the remaining full-game scope and validation blockers.
