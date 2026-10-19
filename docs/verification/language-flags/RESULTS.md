# Language flags

Polish and English now use shared inline SVG flags in login, registration, avatar crop, profile and settings. The compact dark frame, selected border and illuminated marker replace the previous solid green PL/EN buttons. Each target remains at least 44 × 44 px; buttons retain native keyboard operation, accessible language names and pressed state.

Verification: 30 screenshots across 844 × 390, 915 × 412 and 932 × 430, in both languages, with safe-area overrides (left/right 44 px, bottom 21 px). All five contexts passed `overlaps()` with zero overlaps or offscreen controls. Touching the flag graphics switches language and synchronizes every control. Login and registration drafts, selected avatar, crop canvas pixels and zoom, and selected difficulty remain unchanged. Account language persists on the server and after refresh. No browser exceptions or missing translation keys occurred.

The content localization regression audit passed. An independent DOM review also checked direct SVG-path clicks, accessible names, stable icon nodes and idempotent mounting.

These are Chromium landscape emulations, not tests on physical iPhones or Android devices. No camera hardware test was performed for this change. See [proof.json](proof.json) for the measured views and screenshots.

Production version 156 is published from Sites source `7dcaba27577567fafbea9af70585240dac5f2085` and GitHub source `7134902`. Production login/registration flag touches in both languages and refresh persistence passed with no collisions or browser exceptions. All 62 served HTML/JS/CSS/identity-art files match the built artifact byte for byte. See [production/proof.json](production/proof.json) and [production/served-bytes.json](production/served-bytes.json).
