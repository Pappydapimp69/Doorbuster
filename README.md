# Doorbuster

A Black Friday survivors-like. It's 5:00 AM, the doors are opening, and you're
the only one working the floor. Weapons fire on their own; you move, level up,
and survive until 11:00 AM.

- 10-minute runs (a 6-hour shift), 11 weapons, 9 passives, 9 evolutions
- 9 shopper types, elite "Manager Requesters", three managers to beat
- Three departments: Main Floor, Electronics (unlocks after a full shift), Toys (unlocks after a shift in Electronics)
- Four weapons unlock at milestones; Inventory screen with records and evolution recipes
- Restock or Riot: shoppers strip shelves, empty shelves fill a riot meter, stand still to restock for tips
- Sale tags on the floor give random power-ups; coffee spills slow shoppers
- Endless Overtime after a win; timed events (Doorbuster Rush, Flash Sales)
- Break Room meta upgrades and 4 unlockable staff, paid in tips
- Keyboard, mouse, gamepad (Steam Deck friendly) and touch (floating stick); all sound synthesized, no assets to license
- 10 Steam achievements wired through steamworks.js
- English, 简体中文, Русский, Español, Português (Brasil), Deutsch — follows Steam's language, switchable in Settings
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
npm run i18n       # every language: missing strings, overflow, screenshots
```

The bot kites with a 16-direction danger score and levels owned weapons
first. Current balance (40 fresh/veteran runs, 20 per department): a fresh
save wins about 38%; a maxed Break Room 88%; Electronics with a maxed save
45%; Toys 20%; Overtime ends a strong build in ~4 minutes. Use at least 20
runs per number: 8-run batches swung by ±3 wins between code changes that
shouldn't matter.

All tuning is in `src/data.js`.

## Getting it on Steam

1. **Steamworks account**: pay the $100 app fee, get an App ID, put it in
   `steam_appid.txt` (480 is Valve's test app), and add the 10 achievement
   IDs from `src/data.js` (`ACHIEVEMENTS`) in the Steamworks admin.
2. **Store page first, game second.** Put the page up as early as possible.
   Wishlists drive launch visibility. Needs: capsule art, 5+ screenshots
   (`npm run shots` gives raw material), a 30–60s trailer that opens on
   gameplay in the first 3 seconds.
3. **Demo for Steam Next Fest.** Ship the first 5 minutes of a shift as a
   free demo. Next Fest is the biggest free wishlist spike available.
4. **Price**: $7.99, or $9.99 once a mechanical hook ships. The $5–9.99 band
   did best in 2024–25 and the 2025–26 breakouts sit at $9.99–14.99; see
   `research/steam-market-2026.md`.
5. **Build**: `npm run dist:win` / `dist:linux` / `dist:mac`, then upload
   with SteamPipe. Mark Steam Deck compatibility after testing on one.

## Before launch (what's missing)

- A mechanical hook, not just a theme: every recent breakout changed a core mechanic (`research/steam-market-2026.md` §2, §5)

- Real pixel art for capsule/trailer (in-game sprites are placeholder-good, not store-good)
- Native-speaker review of the 5 machine-written translations (zh, ru, es, pt-BR, de)
- Real music track; the synthesized muzak is a placeholder
- Playtests with humans: the bot sets the floor, not the feel
