# Account entry acceptance

`scripts/verify-account-entry.mjs` checks the real account and duel handlers through the isolated loopback test server. It creates disposable accounts and refuses to run against a public hostname. It does not write to production.

Run the local server from the repository root:

```sh
BRAX_ACCOUNT_FIXTURE=1 node --experimental-strip-types --experimental-sqlite --import ./scripts/local-server-hooks.mjs scripts/local-server.mjs 8788
```

Run browser acceptance in another terminal:

```sh
BRAX_URL=http://localhost:8788 BRAX_CHROMIUM_PATH=/usr/lib/chromium/chromium node scripts/verify-account-entry.mjs docs/verification/account-entry
```

Restart the isolated server before repeating a full run: registration and login rate limits remain enabled in the acceptance environment. The fixtures contain publicly documented test credentials for the local, in-memory database only.

For the seeded ranking/history/tournament screenshots and a real online engine start, run the additional mode after core acceptance. It logs into existing fixture accounts and creates no registrations:

```sh
BRAX_ACCOUNT_FIXTURE_ONLY=1 BRAX_URL=http://localhost:8788 BRAX_CHROMIUM_PATH=/usr/lib/chromium/chromium node scripts/verify-account-entry.mjs docs/verification/account-entry/fixture
```

Keep the local server's imported compatibility manifest equal to the served game: building or changing compatibility files after starting that server requires a server restart. A stale server correctly rejects a newer client with HTTP 409.

The script writes `proof.json` and CSS-pixel screenshots. It uses actual source JPEG assets, the real HTTP API, and server-issued session cookies. If 3D model binaries are absent, only model rendering is stubbed; this acceptance does not claim to test combat mechanics or animation.

The browser camera is Chromium's fake video device. Permission denial is simulated with `NotAllowedError`, and teardown is checked using actual `MediaStreamTrack.readyState` values from that fake device. These checks do not establish that a physical phone camera works. Phone viewport screenshots use Chromium emulation and do not establish Safari or physical-device behavior.

Current results belong to `proof.json`; no acceptance result should be inferred from the presence of this document alone. Data continuity for pre-existing accounts, rankings, match history and tournaments is also covered by `scripts/audit-account-data.mjs` against the real handlers and isolated SQLite fixtures.
