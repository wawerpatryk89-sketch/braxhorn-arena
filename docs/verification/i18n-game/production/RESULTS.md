# Production verification — version 155

Published successfully to the existing public game on 2026-10-19. Existing D1/R2 bindings, audience and runtime environment revision 8 were preserved. Account migrations 0008 and language migration 0009 are additive.

`proof.json` confirms live Polish/English login and separate registration with password confirmation, actual registration, saved profile language after reload and login in an independent browser session, unchanged player ID/avatar, and no missing localization keys or uncaught JavaScript errors. The screenshot files in this directory were captured from the production URL.

`served-bytes.json`: all 62 checked production HTML, script, stylesheet and original account image responses exactly match the saved deployment artifact. GitHub application code: `adf986658d168a81dba577cdbeca2861f126d726`; full Sites source: `3cbcf7cee4ada6e6d0eed0f3933b0b9c2dae5f90`.

The earlier production account check in `../../account-entry/production/proof.json` also verifies real R2 photo upload/read, session restoration, independent-browser login, logout and server rejection of guest ranking writes.

The complete game path, ranking, tournament, avatar and mixed-language online acceptance ran against the isolated local API and is documented in `../RESULTS.md`. Physical phones and a physical camera were not tested. No production ranked win or tournament participation was created by these checks.
