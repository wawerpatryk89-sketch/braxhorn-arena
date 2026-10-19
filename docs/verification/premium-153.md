# Character coverflow and readable local bracket

Fighter selection uses the mode picker's coverflow proportions: one card in front and two fully visible side cards at 83% scale. Side cards retain 88% opacity. Full portraits, a single rounded frame and larger statistics replace the double frame and cropped portrait treatment. Eight position markers and a horizontal swipe hint make the remaining fighters discoverable. Tapping a visible card confirms the fighter without a separate selection button.

Local and multiplayer share pointer handling. Cards translate and scale with the finger before release, consume full slots during longer drags, and snap into position on release. Cancellation restores the current slot. Swipe release cannot confirm the card under the finger. Both directions wrap through all eight fighters.

The eight-fighter local bracket uses seven compact two-row matches and six connections to the final. Opening matches are displayed in the order that matches the existing semifinal pairing. Known CPU winners appear in future rounds without advancing the tournament. Portraits reuse the unframed roster artwork. All rounds fit inside the SVG; the header leaves room for the sound control.

Validation: UI audit; campaign audit; touch browser checks at 844×390 and 915×412 including movement before release in both rosters, long drags, eight-position wrap, visible statistics and direct selection. Real local API/SQLite checks cover selection, reselection, tournament startup, bracket bounds and non-mutating preview, and two online clients exchanging movement and attacks. Publication includes a production browser check and served-file SHA-256 comparisons.

Combat controls and simulation rules are unchanged. Browser combat checks use model stubs and HTTP fallback; they do not measure physical phone GPU performance or mobile-network latency.
