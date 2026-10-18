# Nina integration — 2026-10-11

User scope: capoeira, two hand/elbow attacks and four kicks; flowing stance rather than boxing guard; no initiating clinch, but must be grabbed/thrown; matching full-height character card.

Imported the supplied original rigged Tripo model and 37 animation candidates. Original mesh, all 12 weight slots, rig, outfit and texture pixels retained. Nine reaction/paired-motion candidates were retargeted to Nina's bind pose; the supplied Walking clip is used for approach. Full source animation data is retained in source-assets/nina/clips-all.json.gz; 19 selected clips ship.

## Selected moves

| Action | Source |
|---|---|
| Idle | Ginga Variation 3 |
| P1 | Rifle Punch (unarmed punch segment only) |
| P2 | Illegal Elbow Punch |
| K1 | Martelo 2 |
| K2 | Chapa 2 |
| Forward + K1 | Meia Lua De Frente |
| Forward + K2 | Armada |
| Combo | Martelo → Meia Lua → Armada → Chapa |
| Evade | Esquiva 3 |
| Introduction | Breakdance 1990 |
| Victory | Breakdance Ending 2 |
| Close forward/back | Retargeted short combat steps |
| Far approach | Shared Approach Walk |
| Hit reactions / knockdown / get-up | Retargeted body/head/fall/get-up clips |
| Thrown | Retargeted Shoulder Throw, Victim, synchronized with each attacker's source time |

Nina has no initiating throw and no free jump. She uses timed evasion instead of a held boxing guard. The grab button appears as ZERWIJ only while she is held; keyboard C can also break the grip within the existing timing window. D is an evasion alias. No still pose substitutes for the idle loop.

Config distances against Nina are measured on real strike bones/hurt capsules. No wider invisible damage boxes were added. Three incoming combos have Nina-specific approach distances. Two original fighters use measured Nina-specific basic-attack reach. Run scripts/tune-nina-matchups.mjs after rebuilding their configs.

## Validation

- 144 combo approach/contact scenarios, six fighters/opponents, both facings and arena edges: PASS.
- 144 basic strike/contact checks involving Nina in player and CPU roles, six basic attacks and both facings: PASS.
- All five opponents can grab/throw Nina in both directions; escape, single landing damage, recovery and no air-launch charge from a throw: PASS (10 pairs).
- Nina input mappings, movement release, evasion, hidden unused controls, no free jump, second-launch KO: PASS.
- 24 Nina/opponent edge launch/get-up scenarios: PASS.
- Original five fighters' pointer switching, multitouch, cancellations, walking and double-tap running: PASS.
- All six models: finite posed geometry, conserved skin weights, no exploding skin in sampled idle/intro/walk/approach/combo/fall/get-up: PASS.

Browser QA verified the restored full-card roster and generated Bear card. The QA browser does not provide WebGL: GPU-rendered combat and iPhone frame rate are not verified. This is a real verification limit, not a completed mobile gameplay audit.

Card assets: original metal character-card crops retained; Bear and Nina are separately generated in the same arena/metal/neon style. Bear's white-background source image is not used as a roster card. Generated card files: bear-card-pro.png and nina-card-pro.png. No Nina voice lines or separate cinematic were supplied; the source animation intro is used and no other fighter's film is substituted.
