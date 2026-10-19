# Premium touch interface and online display timing

The fighter selector now uses large swipeable portrait cards. Browsing does not confirm the player or select the opponent automatically. Tap the centre card for statistics; use the main action to confirm. Automatic opponent modes keep one selection step. Mode and multiplayer carousels use touch instead of redundant arrow buttons.

The tournament form uses compact native selectors, a formatted Polish date and a visible submit action on short landscape screens. The VS presentation stays until the transition covers the arena selector. The empty aquarium poster has been restored from the existing arena film.

Guest rendering adapts its interpolation delay to observed packet cadence and jitter (32–100 ms), with gradual recovery after jitter. Combat simulation, damage, packet format and server authority are preserved. This reduces the fixed display buffer on stable links; it does not remove physical network latency.

Validation: production build; combat/balance/regression suite; arena/interface repairs; fighter/renderer/metadata audits; network render/conflict/peer tests; viewport and UI audits; real local SQLite duel API tests; adaptive timing tests for stable delivery, jitter, recovery, invalid samples and reset. Browser checks use emulated phone viewports, with metadata-only fighter models for flow checks; they do not measure physical phone GPU performance or mobile-network RTT.

Browser flow checks passed at 844×390 and 915×412: real touch swipes, online entry, statistics, role confirmation, date formatting, form bounds and VS coverage. Two isolated clients created/joined a real local room, started combat and synchronized guest movement/attacks without a covering menu or JavaScript errors. This sandbox used the HTTP fallback; it did not establish WebRTC. Arena audio is external storage media and was unavailable in the local fixture.
