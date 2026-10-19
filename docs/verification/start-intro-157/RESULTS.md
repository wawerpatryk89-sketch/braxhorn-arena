# Opening video and account entry repair

Restores the owner’s original `start-intro-20261007.mp4` after account/guest entry and before the mode menu. The video bytes are unchanged: SHA-256 `1c300421cfe59f9cf16d70560c19237a36dd339d5fbfb1ff98f942b705ee195a`. The old START and nickname screens remain removed.

An opaque first-paint shield prevents the arena from flashing before login initializes. A source-aligned opaque mask removes the printed reference form independently of the live form size. Large-screen form dimensions follow the original reference panel.

Browser verification passed at 844×390, 915×412, 932×430 and 1900×1000. The original 16.67-second clip played to its natural end; skip, playback failure/retry, restored session and logout were verified. No overlap, offscreen login control, browser exception or missing localization key occurred. `audit-transitions.cjs` passed 12 lifecycle checks; the account/i18n regression audit passed.

Chromium viewport emulation only. Physical iPhone/Android, Safari and camera hardware were not tested.
