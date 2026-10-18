# Mode art and panel width repair — 2026-10-15

The user reported character portraits representing generic game modes and pointless horizontal movement of a wide card. This revision replaces the portraits in the main hub entry, three hub cards, Survival introduction and generic challenge details with mode-specific artwork. Existing fighter portraits remain in fighter selection and character-specific contexts.

The main menu uses five complete grid columns. Hub uses three complete grid columns. Removed mode-scroll controls and their JavaScript. All destination grid columns explicitly permit shrinking; challenge list text uses minmax(0,1fr), metadata wraps, and the Survival/configuration/detail panels only scroll vertically. This fixes intrinsic-width overflow instead of retaining a nearly-empty horizontal carousel.

Artwork generated with the built-in ImageGen tool. Shared prompt: realistic cinematic BRAXHORN arena menu art, portrait 2:3, graphite steel and brushed silver with restrained lime-green lights, upper subject and dark lower space for live UI text; no portraits, typography, frame or watermark.

- game/assets/mode-art/survival.webp — empty octagonal arena, receding entrance gates, infinity emblem.
- game/assets/mode-art/challenges.webp — titanium target emblem and ascending chevrons above training platform.
- game/assets/mode-art/ranking.webp — silver championship trophy, podium and luminous globe.

Brax combo investigation: current COMBO uses Uppercut Jab followed by Kicking; six hand hit groups and final LeftFoot hit. audit-brax-reported.cjs --assert reaches KICKING against idle and guarding opponents. This is engine logic evidence, not a rendered-phone confirmation. No combat configuration changed in this revision.

Browser QA remains unavailable. Do not claim visual inspection of these layouts on a real device. Production publication is explicitly requested by the user despite this verification limit.
