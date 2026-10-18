# Brax and Nyxa: readability, timing and Nyxa combination

Original model JSON, geometry, bones, skinning weights, UVs, all four source textures and logos are unchanged. Arenas and menus are unchanged except asset cache version.

## Rendering
Neutral tone mapping, balanced neutral key/fill/rim lights and a small prefiltered studio reflection environment replace the flat single-key setup. Texture anisotropy uses up to 8x when supported. Render states use reusable typed arrays rather than allocating per-bone objects every frame; unchanged poses skip redraw. GPU/iPhone appearance has NOT been visually verified because the supported browser capability is unavailable.

## Gameplay
Primary attacks preserve every source frame. Startup and recovery playback rates are separately tuned; active contact frames retain their supplied trajectory and existing playback rate. Nominal no-contact button lock durations are Brax 533–733 ms, Nyxa 533–633 ms. Forward K2 for Brax uses the supplied knee chain instead of a 16-second capoeira lock. Capoeira source is retained.

Both torso collision radii increase from 30 to 42 source pixels. During a solo attack, collision correction constrains the attacker rather than sliding the idle defender away. Contact hitstop now returns immediately before subsequent motion/separation. CPU animation clock converts remaining frame time across startup/recovery speed changes. Input buffer still allows one command in the final 100 ms. Walking speed uses a stable 1.7 m height reference rather than an idle animation's changing bounding box.

## Nyxa combo requested during implementation
Punch To Elbow Combo FBX matches Nyxa's 65 rest-pose bones (maximum error 5.17e-8). Linked to Martelo Do Chau, with a 120 ms source-time transition (60 ms at 2x). Whole combo duration 4.017 seconds excluding contact freezes. Seven independent contact groups: three fists, three elbows and final turning kick. Maximum unblocked damage 44; damage requires actual range/contact. Finisher calls Brax's full fall/down/getup chain. Source root translation is extracted in place for this linked sequence to prevent a teleport at the clip boundary. No model skeleton or limb tracks are rewritten.

This is the user-requested combined source choreography, not a claim to implement the exact master BLACK THUNDER sequence. No camera teleport or pulling the opponent into strikes.

Nyxa still uses supplied Walking for forward locomotion; user is preparing a dedicated forward combat walk. Her dedicated Fighting Idle has not been supplied. Brax's guard clip cannot be directly copied: bind rotations differ substantially, including the right shoulder/arm.

## Validation
PASS: primary controls, action durations, contact timing and original bone-centred hitboxes, buffer, hitstop, two-direction paired Brax throw/recovery, guard seam continuity, seven Nyxa contact groups, compound combo completion. Numeric combo bounds fit the 1024x640 source canvas. No GPU/browser visual QA or iPhone performance measurement; do not claim perfection or Mixamo-identical rendering.
