# Six basic attacks per fighter

The user requires six basic attacks, plus a separate combo, defense, movement and clinch. The number of supplied animation files is unlimited; source clips are retained for selection. Exact master choreography is not required by the latest scope.

| Input | Brax | Nyxa |
| --- | --- | --- |
| P1 | Jab Cross (1) | Body Jab Cross |
| P2 | Hook | Hook |
| K1 | Mma Kick (1) | Mma Kick (1) |
| K2 | Kicking | Mma Kick (1) (2) |
| Forward + P1 | Boxing | Illegal Elbow Punch |
| Forward + P2 | Kicking (2) | Illegal Knee |

Forward is relative to the opponent, including after switching sides. Backward input preserves the base attack; kicks no longer change with horizontal direction. CPU selection uses the same six attacks instead of sampling duplicate aliases. Nyxa's Martelo Do Chau remains in her combo and in the source pack. No model, texture, skeleton or clip has been deleted or altered.

Controls and six distinct clip mappings are verified in the combat VM. This is not visual WebGL validation: the available browser reported that GPU/WebGL is disabled earlier in this session. Nyxa still lacks supplied jump and run clips.

# New Krov package audit

`krov.zip` contains 24 FBX animations. Each loads with 65 bones, 53 animation tracks, zero meshes and zero materials. No model or texture files are present in this archive. This audit does not establish whether the model was supplied separately elsewhere.

There are sufficient strike candidates for six attacks and a separate combo. Fighting Idle, Jumping, Backflip and head/body hit reactions are present. Run With Sword needs visual evaluation for unarmed fighting. The package has no dedicated forward/backward combat walk, block, dodge, paired throw, complete knockdown/get-up or airborne defeat set identifiable as such. Pivot, Sitting Dazed, Wheelbarrow Dump and Rockin' Shackle A are not accepted as substitutes based only on their names. Shared existing motions can be evaluated for retargeting once the new model is available. No Krov asset was added to the published roster by this change.
