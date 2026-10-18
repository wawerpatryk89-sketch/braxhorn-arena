# Danny, Brax and CPU difficulty

- Danny WALK_FORWARD and APPROACH use a retargeted original Short Step Forward from the supplied Krov package. It is a short combat step instead of the previous supplied Walking clip. Mesh, materials, backward step and idle remain unchanged. Loop seam measured below 0.001 px in projected bone coordinates; planted feet and all collision samples rebuilt.
- Brax HEAVY_KICK (K2) uses the supplied Side Kick from Danny's kickboxing package, retargeted to Brax's proportions. The jump kick Kicking seen in IMG_8082.mp4 remains in Brax COMBO; the combo is unchanged. All six basic attack clips are distinct. Original source archives remain untouched.
- CPU selects attacks already in reach rather than requiring both fighters' short-punch distance before attacking. During cooldown it closes distance; collision still separates pelvis envelopes. It avoids repeating the same attack when another is available.
- Easy / medium / hard: reaction 520 / 300 / 160 ms, recovery between actions 1450 / 750 / 260 ms, approach 72 / 88 / 100 percent of normal fighter speed, defense chance 12 / 32 / 55 percent. These are AI decisions; damage and player animation speeds are unchanged. Counter after defense waits the corresponding reaction time. Throw intervals remain 12 / 10 / 8 seconds, with lower attempt probabilities than before.
- UI names now ŁATWY / ŚREDNI / TRUDNY. No controls added or rearranged. All preceding Nina and six-input fixes are included.

Validation: 432 actual touch/direction attack cases; 144 full combo approaches; 72 body separation cases; 24 CPU grab cooldown cases; 18 deterministic 30-second CPU bouts plus all 108 fighter/difficulty matchups. Longest difficulty bouts show 8–11 easy attacks versus 13–20 hard attacks in 30 seconds. These are simulation checks, not a claim about human win rates.

The user video and sampled original skeleton motion were inspected. Browser/iPhone visual and hands-on playtesting were unavailable in this environment; perceived difficulty and rendered motion still require device review.
