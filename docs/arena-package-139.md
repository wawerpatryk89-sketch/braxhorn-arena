# Arena package update

19 selectable arenas: seven new (carrier, canyon, reactor, savanna, brooklyn, dragon, aquarium), seven existing source-video arenas, snowy rooftop, underground, metro, harbor and the preserved night market.

`arena-media/manifest.json` lists 16 immutable MP4s; `arena-media/assets-manifest.json` lists two unchanged animated GIFs and three ambience MP3s. Total external media: 122,525,662 bytes. The main game retains posters and compact menu thumbnails; video download is selected-arena-only. The uploader handles both manifests. Existing files need upload under their new hashes before deployment.

Seven new clips retain their source dimensions and 30 fps, encoded at the existing CRF 14 quality setting. Each uses a 0.7-second visual overlap. Encoding is lossy, so this is not a byte-identical video claim. Original uploads remain in source-assets/arena-videos. No fighter visuals, masters or combat moves were edited.

The old video preparation's short-head `acrossfade` unexpectedly emitted zero audio frames; every one of the old seven remote loops had no audio stream. `repair-arena-audio.py` restores the original soundtrack with a deterministic PCM overlap, then copies the existing video stream unchanged. The exceptionally quiet Temple source is amplified by 30 dB (without changing video frames). All 16 delivered MP4s now have a decoded, nonzero audio signal. Metro, harbor and market retain their existing ambience, moved byte-for-byte to the separate package. Snow and underground retain their existing synthesized soundtracks and video frames.

Removed superseded rooftop/jungle/volcano GIFs and the old beach MP4/poster; the obsolete rooftop GIF reference in settings now uses the current rooftop poster. Snow is retained because visual inspection shows a distinct snow-covered skyline; it is not the rainy city roof. Existing metro and harbor GIFs remain playable from the package.

Validation:
- `python scripts/audit-arena-pack.py`: PASS, 16 videos (hash, package size ceiling, source dimensions/frame rate, audio stream, non-silent PCM), auxiliary asset hashes. Details: arena-media/validation.json.
- `node scripts/audit-arena-selection.cjs`: PASS, 19 unique cards and 16 video launch/exit/download paths in mock DOM.
- `node scripts/audit-arena-video-loader.mjs`: PASS, reuse, abort/error recovery, selected-only fetching, ten blob create/release cycles.
- `node --experimental-strip-types scripts/audit-arena-media.mjs`: PASS, full/range/HEAD, immutable/authenticated upload and GIF/MP3/WebP MIME.
- `node scripts/audit-arena-audio.cjs`: PASS, audible state, mute/unmute and correct packaged ambience URLs for all 19 choices in mock DOM.

Not verified: actual iOS/Android audio autoplay, speaker mix, browser loop scheduling, listening quality, invisible seams on physical displays, listening on physical devices. Live CDN verification is recorded in verification-20261018.md. Seam measurements are luma differences, not guarantees that a crossfade cannot be noticed (especially moving animals/dragon). Device checks: launch each arena after a tap, mute/unmute, pause/resume, background/resume, then let at least three loops play with sound. Verify no doubled ambience, audible clicks or delayed restart.
