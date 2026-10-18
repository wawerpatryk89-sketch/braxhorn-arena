# Brax compact walking and control review — 2026-10-11

User screenshots IMG_8012/IMG_8013 visibly show deep, wide forward/backward lunges. Prior foot-excursion checks measured each foot separately and missed the total stance width. Corrected audit measures the gap between both feet throughout the entire loop.

Brax only: blend both walking clips 30% toward movement / 70% supplied Center Block guard at source 1.2 s. This changes the walking pose amplitude as requested, without altering the model, skeleton, textures or attack choreography. Root foot support remains grounded. Forward gait rate 1.5, backward 1.4. Arena travel speeds stay at v59 values.

Measured max canonical foot gap: forward 284.41 → 179.96 px; backward 256.52 → 166.21 px. Complete cycles: forward 622 ms, backward 571 ms. Head height variation: 7.69 / 4.58 px. Loop boundary continuous, no planar root drift, support contact remains on floor. CPU mesh audit finite including intro, walking, combo and recovery.

Controls: removed active scale(.9) so the hit area does not shrink beneath a held finger. Verified pointer slide left/right/outside, release, multi-touch, cancel, capture loss, blur, pause, double-tap run; movement plus P1/P2/K1/K2/evade, input recovery, Brax jump. Nyxa has no JUMP source/config: her jump button is disabled and labelled unavailable. Down button described as a modifier for down+C rather than claiming unsupported separate low-block/duck animations. Existing clinch tests pass for both directions and all Brax/Nyxa pairings.

Fixed secondary fighter-selection carousel after return from combat: it still had a third obsolete Krov slot although the initial menu had two available fighters. Both now use only Brax/Nyxa.

Browser limit: prior live cloud-browser attempt confirmed WebGL disabled / Error creating WebGL context. Menu and startup video observed; live 3D gameplay and iPhone feel have NOT been visually verified. No claim that all game features are perfect or certified.
