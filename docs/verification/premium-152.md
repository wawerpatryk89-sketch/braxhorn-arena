# Three-card fighter carousel

Local and online selection show three equally sized, fully visible fighter cards, plus a dimmed half-card at each outside edge. A shared ResizeObserver calculates card spacing from the available screen area. Swiping wraps through all eight fighters in either direction.

Every card permanently shows strength, speed and reach from the existing generated combat statistics. The illustration atlases and shared metal frame from release 151 are retained. The green selection buttons are hidden; tapping any of the three full cards confirms that fighter. Local fights select the player, then the opponent. Automatic-opponent modes need one selection. The original confirmation event keeps challenge eligibility checks and lazy engine loading, including reselection after returning from the arena. Combat touch controls remain unchanged.

Validation: UI audit; screen-flow audit; phone browser checks at 844×390 and 915×412, verifying three full cards, two dimmed halves, three visible statistics, full-circle swipes, direct selection, online entry, tournament form and VS transition. A local API/SQLite browser story checks single-player selection, reselection, automatic-opponent startup and two online clients exchanging movement and attacks. Production artifact build and served-file SHA-256 comparisons are recorded separately.

Browser combat checks use model metadata stubs. They verify menus, engine startup and API behavior, not physical phone GPU performance or real mobile-network latency. The two-client sandbox uses HTTP fallback; WebRTC/TURN behavior requires device testing.
