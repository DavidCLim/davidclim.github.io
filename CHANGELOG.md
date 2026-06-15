# Changelog

## v1.18 - 2026-06-15

- Made Human room syncing use a shared move counter instead of device timestamps, so different-device games should stop randomly locking turns.
- Added a room state request when Player 2 connects, so joined devices can recover the current game state more reliably.
- Kept the GitHub Pages background from changing when someone clicks outside the UNO app card.

## v1.17 - 2026-06-15

- Made the home page UNO app card/button more futuristic all the time, with a stronger neon panel, light-blue glow, and white launch text.
- Changed the home page behavior so clicking the UNO card selects it and changes the background; Launch Game opens only after the card has been selected.
- Kept UNO card movement simple without extra animations.
- Moved the gold turn glow onto the turn heading only, so the draw pile button no longer glows.

## v1.16 - 2026-06-14

- Kept the home page UNO app button in the futuristic style at all times while only the page background changes on selection.
- Added an online Human room connection layer for different-device play, with same-device storage as a fallback.
- Made the UNO game background more futuristic with deeper neon layers.
- Added a gold glow to the turn panel and draw button when it is your turn.

## v1.15 - 2026-06-14

- Made the UNO game shell more futuristic with stronger neon panels, frame effects, and animated button highlights.
- Gave the home page UNO app button a matching futuristic style while keeping the rest of the GitHub page layout unchanged.
- Added a selected UNO state on the home page that changes the white background to the futuristic theme, then returns to white when deselected.
- Kept gameplay and card visuals unchanged.

## v1.14 - 2026-06-14

- Made Human room codes sync game state between browser tabs on the same site.
- Added Player 1 and Player 2 room roles so each player sees their own hand and can only play on their turn.
- Centered the Skip and Color Roulette symbols inside the card oval.

## v1.13 - 2026-06-14

- Improved the Mode, Opponent, Bot difficulty, and Changelog controls for tablet and mobile layouts.
- Made small-screen buttons arrange into cleaner responsive rows instead of stacking awkwardly.
- Kept card visuals and gameplay unchanged.

## v1.12 - 2026-06-14

- Changed visible opponent wording to Bot.
- Added a futuristic neon theme for the page, controls, panels, buttons, and changelog.
- Kept card visuals and gameplay unchanged.

## v1.11 - 2026-06-14

- Added an Opponent selector so players can choose Bot or Human.
- Added a Human room panel with Host Room, Join Room, and 4-number room codes.
- Centered the Color Roulette card symbol.

## v1.10 - 2026-06-14

- Rebuilt the Wild card symbol so its colored oval uses the exact same size, shape, and rotation as the card's white oval.
- Removed the separate rainbow oval background from Wild cards.
- Restored the Wild card body to a dark background so the oval itself carries the color blocks.

## v1.9 - 2026-06-14

- Changed Skip Everyone to a distinct group-skip symbol so it no longer looks like the regular Skip card.
- Scaled the Wild card oval back inside the card oval so the symbol does not spill out.
- Removed the rainbow oval background from the Color Roulette card.

## v1.8 - 2026-06-14

- Reworked Skip Everyone into a compact single-icon design that stays inside the oval.
- Enlarged the Wild card oval so it covers the full card oval and hides the white oval underneath.

## v1.7 - 2026-06-14

- Restored number cards to the earlier font style.
- Adjusted the Wild card icon oval to match the card oval more closely.

## v1.6 - 2026-06-14

- Added UNO-style corner labels to number cards and power cards.
- Reworked Draw, Discard All, Flip, and Color Roulette cards with code-drawn symbols.
- Made Classic, No Mercy, and Flip cards share the same David Edition card frame and sizing.

## v1.5 - 2026-06-13

- Rebuilt Wild, Reverse, Skip, and Skip Everyone as more accurate code-drawn card symbols.
- Made number cards larger and more slanted so they fill the center oval better.
- Updated the web changelog with the newest visual polish.

## v1.4 - 2026-06-13

- Slanted all card numbers and symbols to better fit the oval.
- Kept card dimensions and number sizes identical across desktop and mobile.
- Converted the changelog into a styled web page.

## v1.3 - 2026-06-13

- Simplified every card face to one centered number or symbol.
- Made unplayable cards dimmer and more faint.
- Fixed the win popup so it stays hidden at the start of a game.

## v1.2 - 2026-06-13

- Added Classic, No Mercy, and Flip game modes.
- Added Easy, Medium, and Hard bot difficulty.
- Added action-card symbols for Skip, Reverse, Draw cards, Wild, Discard All, Color Roulette, and Flip.
- Added No Mercy-style forced drawing, 0/7 hand swaps, larger draw cards, and 25-card mercy elimination.
- Added Flip-style light and dark sides, dark-side colors, Draw Five, Skip Everyone, and Wild Draw Color.

## v1.1 - 2026-06-13

- Added a dark blue game-table theme.
- Added David Edition card backs.
- Added a `You Win!` popup.

## v1.0 - 2026-06-13

- Added the first playable UNO web app under `apps/uno/`.
