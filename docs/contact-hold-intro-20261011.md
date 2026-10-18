# Contact hold and supplied Brax greeting

- Fixed simulation advancing beyond a source contact before hitstop began. Source contact now holds the sampled active frame, zeroes fractional pose overshoot, and prevents the other participant from advancing after the hit.
- Hitstop also freezes push displacement and the transition clock.
- Separation preserves the facing order captured before movement; a close step cannot choose the opposite side merely by crossing the opponent's root.
- Reset clears the source renderer's previous transition pose.
- Imported original Breakdance Uprock Var 1 (1).fbx as Brax INTRO. All 65 source bones match the supplied Brax skeleton; maximum rest transform error 5.17e-8. Source duration retained (2.0999999 s). Nyxa greeting remains Breakdance Freezes.
- Verified no-input idle advancement for both characters over more than two loop periods, greeting playback after the film, active-frame hold, frozen hitstop positions/clocks, and crossing prevention. Existing contact, control and source-joint checks pass.
- No browser/GPU or iPhone QA available. Dedicated combat idle and missing motion set remain outstanding; see BRAKI_ANIMACJI_BRAX_NYXA.md.
