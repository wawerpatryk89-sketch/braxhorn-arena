# BRAXHORN account and PL/EN acceptance

The final browser run in `proof.json` passed all 12 scenarios and captured 103 screenshots. It used the real game, real assets, account/duel/ranking/tournament handlers, an isolated SQLite database and the documented local fixture. No production results or tournament entries were created by this suite.

Verified in both languages at 844×390, 915×412, 932×430 and 1366×768, with safe-area emulation on phone viewports:

- Login, separate registration dialog, repeated password, avatar selection and unchanged form drafts.
- Uploaded image/crop state, profile drafts, guest preference after reload and account language after login on another browser.
- Mode/settings, roster, arena selection, real local fight start, HUD and result presentation without resetting selection, round, score or identity.
- Real ranking/history/tournament data and persistent account avatars.
- Two actual browser clients sharing an online fight while the host uses Polish and the peer uses English; canonical network/audio tokens remain independent from displayed language.
- Zero detected overlapping controls, offscreen controls, clipped interface labels, missing/raw translation keys, visible untranslated Polish interface text in English, or uncaught JavaScript errors in the exercised views.

Long player-owned nicknames may shorten in the HUD; the separate TY/YOU badge stays visible. Nicknames, fighter proper names, the brand and user-authored tournament content intentionally remain unchanged.

The local result was forced through a browser-only test hook to verify the result screen; it is not evidence of a played or ranked win. The online PAUZA callout was triggered through the same test-only route and then travelled over the real duel connection. Physical iPhone/Android devices, Safari and a physical selfie camera were not tested. Account camera acquisition, denial and track shutdown were tested with Chromium's simulated camera in the separate account acceptance suite.

Run the isolated server, then the browser suite:

```sh
BRAX_ACCOUNT_FIXTURE=1 node --experimental-strip-types --experimental-sqlite --import ./scripts/local-server-hooks.mjs scripts/local-server.mjs 8789
BRAX_URL=http://localhost:8789 BRAX_CHROMIUM_PATH=/usr/lib/chromium/chromium node scripts/verify-i18n-game.mjs docs/verification/i18n-game
```

Restart the isolated server before another full run so the real account login rate limits start with a fresh in-memory database. Do not disable production limits.

Additional passing checks: account worker/data/session audits; account, content, online and combat localization/state audits; TypeScript; duel/ranking/tournament/RTC audits; combat integrity (912 contacts), combo confirmation (2688 cases), fair pressure (5120 matchups), and network rendering. Fighter configuration bytes, attack assignments and mechanics were preserved.
