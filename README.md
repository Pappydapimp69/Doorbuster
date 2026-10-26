# Doorbuster

A Black Friday survivors-like. It's 5:00 AM, the doors are opening, and you're
the only one working the floor. Weapons fire on their own; you move, level up,
and survive until 11:00 AM.

- 10-minute runs (a 6-hour shift), 11 weapons, 6 passives, 6 evolutions
- 7 shopper types, elite "Manager Requesters", Regional / District Manager bosses
- Two departments: Main Floor, and Electronics (unlocks after a full shift)
- Endless Overtime after a win; timed events (Doorbuster Rush, Flash Sales)
- Break Room meta upgrades and 4 unlockable staff, paid in tips
- Keyboard, mouse and gamepad (Steam Deck friendly); all sound synthesized, no assets to license
- 9 Steam achievements wired through steamworks.js
- Demo mode for Steam Next Fest (`?demo`, `npm run demo`, or a `demo.flag` file in the build's resources)

## Run it

```bash
npm run web          # browser build at http://localhost:8080
npm install && npm start   # desktop (Electron) build
```

No build step: plain JS modules, canvas rendering at 480×270 scaled up.

## Store assets

`npm run store` renders every Steam capsule size, 1920×1080 screenshots and
a ~42s gameplay trailer (needs ffmpeg) into `store/`. Store page copy, tags,
price and the asset checklist are in `store/store-page.md`.

## Test it

```bash
npm run playtest   # headless bot runs: errors + balance (fresh vs maxed meta)
npm run shots      # gameplay screenshots into test/shots/
```

The bot kites with a 16-direction danger score and levels owned weapons
first. Current balance (20 runs each): a fresh save wins about 1 in 5 with a
median of ~5 minutes; a maxed Break Room wins ~3 in 4; Electronics with a
maxed save about 1 in 2; Overtime ends a strong build in ~4 minutes.

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
- Localization (at least Simplified Chinese, German, Spanish, Portuguese-BR, Russian)
- Real music track; the synthesized muzak is a placeholder
- Playtests with humans: the bot sets the floor, not the feel
