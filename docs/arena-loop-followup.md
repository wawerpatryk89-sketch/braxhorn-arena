# Arena loop follow-up

Both rooftop movie entries remain: `rooftop` (DACH · BURZA) and `rooftop-city` (DACH · METROPOLIA). Neither entry is a GIF. The superseded `/assets/rooftop.gif` is absent from current game assets, runtime JavaScript/HTML, and existing build output. No arena was deleted in this follow-up.

`arena-media.js` now prepares two video decoders backed by one selected-arena Blob. A 120 ms overlap starts the incoming cycle before the outgoing clip reaches EOF. The incoming picture fades over the outgoing picture; the outgoing decoder is then rewound while hidden. Audio element gains follow the overlap where the browser supports per-element volume. Both decoders pause together and are released on leaving the match. Native looping remains the fallback when the standby decoder cannot play. No movie is recompressed, resized or given a different frame rate. The transient cost is one additional decoder for the selected arena, not another network download.

Validation:

- `node scripts/audit-arena-loop.mjs`: PASS, controlled media clock, 150 seconds / 21 transitions, zero modeled blank or silent frames; pause/resume, mute, play-rejection fallback and decoder release checked.
- `node scripts/audit-arena-video-loader.mjs`: PASS, selected-only fetch, reuse, ten release cycles, failed fetch and cancellation.
- `node scripts/audit-arena-audio.cjs`: PASS, all 19 choices audible and mutable in the mock DOM.
- `node scripts/audit-arena-selection.cjs`: PASS, 19 cards / 16 movies, selected-only loading, match entry and exit.
- `python scripts/audit-arena-pack.py`: PASS, exact SHA-256, size ceiling, source dimensions/rate, audio signal and immutable GIF/audio hashes.
- `python scripts/audit-arena-loop-media.py`: PASS, all 16 movie audio/video endpoints match within 1 ms (measured difference zero). Decoded first/last-frame luma differences range 0.435–2.045 on an 8-bit scale; measured adjacent-frame p95 is reported beside each seam. Tail 100 ms audio RMS is nonzero for every movie (minimum 0.005794). Full values: `docs/verification/arena-loop-media.json`.

These tests do not establish imperceptible transitions on phones. Actual Safari/Android decode startup latency, memory pressure, audible crossfade (iOS can restrict element volume), and real RAF continuity still require two or more complete loops per arena on devices. Also check mute, pause, background/resume and leaving a fight during overlap. No new media upload is needed: all MP4 bytes are unchanged.
