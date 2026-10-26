# Doorbuster

A Black Friday survivors-like. It's 5:00 AM, the doors are opening, and you're
the only one working the floor. Weapons fire on their own; you move, level up,
and survive until 11:00 AM.

- 10-minute runs (a 6-hour shift), 7 weapons, 6 passives, 4 evolutions
- 5 shopper types, elite "Manager Requesters", a Regional Manager boss
- Timed events: Doorbuster Rush, Flash Sale rings
- Break Room meta upgrades and 4 unlockable staff, paid in tips
- Keyboard, mouse and gamepad (Steam Deck friendly); all sound synthesized, no assets to license
- 6 Steam achievements wired through steamworks.js

## Run it

```bash
npm run web          # browser build at http://localhost:8080
npm install && npm start   # desktop (Electron) build
```

No build step: plain JS modules, canvas rendering at 480×270 scaled up.

## Test it

```bash
npm run playtest   # headless bot runs: errors + balance (fresh vs maxed meta)
npm run shots      # gameplay screenshots into test/shots/
```

The bot kites with a 16-direction danger score and levels owned weapons
first. Current balance (12 runs each): a fresh save wins about 1 in 3 with a
median of ~8 minutes survived; a maxed Break Room wins ~11 in 12. A human
should land in between: lose the first shifts, win after a few upgrades.

All tuning is in `src/data.js`.

## Getting it on Steam

1. **Steamworks account**: pay the $100 app fee, get an App ID, put it in
   `steam_appid.txt` (480 is Valve's test app), and add the 6 achievement
   IDs from `src/data.js` (`ACHIEVEMENTS`) in the Steamworks admin.
2. **Store page first, game second.** Put the page up as early as possible.
   Wishlists drive launch visibility. Needs: capsule art, 5+ screenshots
   (`npm run shots` gives raw material), a 30–60s trailer that opens on
   gameplay in the first 3 seconds.
3. **Demo for Steam Next Fest.** Ship the first 5 minutes of a shift as a
   free demo. Next Fest is the biggest free wishlist spike available.
4. **Price**: $3.99–$4.99. That's where this genre sells (Vampire Survivors
   launched at $2.99, Brotato at $4.99).
5. **Build**: `npm run dist:win` / `dist:linux` / `dist:mac`, then upload
   with SteamPipe. Mark Steam Deck compatibility after testing on one.

## Before launch (what's missing)

- Real pixel art for capsule/trailer (in-game sprites are placeholder-good, not store-good)
- A second store map (e.g. the electronics department after midnight)
- 4–6 more weapons and 2 more evolutions for replay depth
- Endless mode after 11:00 AM
- Localization (at least Simplified Chinese, German, Spanish, Portuguese-BR, Russian)
- Real music track; the synthesized muzak is a placeholder
- Playtests with humans: the bot sets the floor, not the feel
