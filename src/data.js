// All tuning lives here. Numbers are per level, index 0 = level 1.

export const RUN_SECONDS = 600; // a 6-hour shift squeezed into 10 minutes
export const SHIFT_START_MIN = 5 * 60; // doors open 5:00 AM
export const SHIFT_GAME_MINUTES = 6 * 60;
export const BOSS_AT = 540;
export const MAX_WEAPONS = 6;
export const MAX_PASSIVES = 4;
export const MAX_LEVEL = 5;

export const WEAPONS = {
  priceGun: {
    name: 'Price Gun', icon: 'sticker',
    desc: 'Fires price stickers at the closest shopper.',
    lv: [
      { dmg: 10, cd: 0.9, count: 1, pierce: 1, speed: 220 },
      { dmg: 12, cd: 0.8, count: 2, pierce: 1, speed: 230 },
      { dmg: 15, cd: 0.75, count: 2, pierce: 2, speed: 240 },
      { dmg: 18, cd: 0.65, count: 3, pierce: 2, speed: 250 },
      { dmg: 22, cd: 0.55, count: 4, pierce: 3, speed: 260 },
    ],
    lvText: ['', '+1 sticker, faster', '+1 pierce, more damage', '+1 sticker, faster', '+1 sticker, +1 pierce'],
  },
  boxCutter: {
    name: 'Box Cutter', icon: 'cutter',
    desc: 'Slashes in front of you. Close range, big damage.',
    lv: [
      { dmg: 30, cd: 1.1, range: 36, arcs: 1 },
      { dmg: 38, cd: 1.0, range: 40, arcs: 1 },
      { dmg: 45, cd: 0.9, range: 42, arcs: 2 },
      { dmg: 56, cd: 0.8, range: 46, arcs: 2 },
      { dmg: 72, cd: 0.7, range: 52, arcs: 2 },
    ],
    lvText: ['', 'More damage, longer reach', 'Also slashes behind you', 'More damage, faster', 'Huge damage, reach'],
  },
  carts: {
    name: 'Runaway Carts', icon: 'cart',
    desc: 'Shopping carts circle you and run shoppers over.',
    lv: [
      { dmg: 10, count: 1, radius: 40, spin: 2.6 },
      { dmg: 13, count: 2, radius: 42, spin: 2.8 },
      { dmg: 16, count: 2, radius: 48, spin: 3.0 },
      { dmg: 19, count: 3, radius: 50, spin: 3.2 },
      { dmg: 24, count: 4, radius: 54, spin: 3.4 },
    ],
    lvText: ['', '+1 cart', 'Wider, more damage', '+1 cart', '+1 cart, faster'],
  },
  wetFloor: {
    name: 'Wet Floor', icon: 'puddle',
    desc: 'Mops puddles that damage and slow shoppers.',
    lv: [
      { dmg: 8, cd: 1.9, count: 2, size: 24, dur: 3.0 },
      { dmg: 8, cd: 2.2, count: 2, size: 24, dur: 3.2 },
      { dmg: 9, cd: 2.0, count: 2, size: 28, dur: 3.6 },
      { dmg: 11, cd: 1.9, count: 3, size: 30, dur: 4.0 },
      { dmg: 14, cd: 1.7, count: 4, size: 34, dur: 4.5 },
    ],
    lvText: ['', '+1 puddle', 'Bigger, lasts longer', '+1 puddle', '+1 puddle, bigger'],
  },
  paSystem: {
    name: 'PA System', icon: 'speaker',
    desc: 'An announcement blasts shoppers back.',
    lv: [
      { dmg: 12, cd: 3.0, radius: 60, knock: 120 },
      { dmg: 15, cd: 2.8, radius: 70, knock: 130 },
      { dmg: 19, cd: 2.6, radius: 80, knock: 140 },
      { dmg: 23, cd: 2.4, radius: 90, knock: 150 },
      { dmg: 30, cd: 2.1, radius: 105, knock: 170 },
    ],
    lvText: ['', 'Louder, wider', 'Louder, wider', 'More frequent', 'Max volume'],
  },
  couponStorm: {
    name: 'Coupon Storm', icon: 'coupon',
    desc: 'Homing coupons that never miss.',
    lv: [
      { dmg: 10, cd: 1.3, count: 2, speed: 150 },
      { dmg: 12, cd: 1.2, count: 3, speed: 160 },
      { dmg: 14, cd: 1.1, count: 4, speed: 170 },
      { dmg: 17, cd: 1.0, count: 5, speed: 180 },
      { dmg: 22, cd: 0.9, count: 6, speed: 190 },
    ],
    lvText: ['', '+1 coupon', '+1 coupon', '+1 coupon', '+1 coupon, more damage'],
  },
  barcode: {
    name: 'Barcode Laser', icon: 'laser',
    desc: 'A scanner beam that cuts through a whole line.',
    lv: [
      { dmg: 18, cd: 2.2, length: 120, beams: 1 },
      { dmg: 22, cd: 2.0, length: 140, beams: 1 },
      { dmg: 26, cd: 1.9, length: 160, beams: 2 },
      { dmg: 30, cd: 1.7, length: 170, beams: 2 },
      { dmg: 38, cd: 1.5, length: 190, beams: 3 },
    ],
    lvText: ['', 'Longer, more damage', '+1 beam', 'Faster', '+1 beam'],
  },
  giftCard: {
    name: 'Gift Card', icon: 'card',
    desc: 'Flies out and comes back. Hits on the way both ways.',
    lv: [
      { dmg: 14, cd: 1.6, count: 1, range: 90, speed: 200 },
      { dmg: 17, cd: 1.5, count: 2, range: 95, speed: 210 },
      { dmg: 20, cd: 1.4, count: 2, range: 110, speed: 220 },
      { dmg: 24, cd: 1.3, count: 3, range: 115, speed: 230 },
      { dmg: 30, cd: 1.1, count: 3, range: 130, speed: 240 },
    ],
    lvText: ['', '+1 card', 'Farther, more damage', '+1 card', 'Farther, faster'],
  },
  extinguisher: {
    name: 'Fire Extinguisher', icon: 'spray',
    desc: 'Sprays a cone that pushes and slows.',
    lv: [
      { dmg: 12, cd: 1.5, range: 60, width: 0.5, knock: 110 },
      { dmg: 15, cd: 1.4, range: 66, width: 0.55, knock: 120 },
      { dmg: 18, cd: 1.3, range: 74, width: 0.6, knock: 130 },
      { dmg: 22, cd: 1.2, range: 80, width: 0.7, knock: 140 },
      { dmg: 28, cd: 1.0, range: 90, width: 0.8, knock: 160 },
    ],
    lvText: ['', 'Longer spray', 'Wider, more damage', 'Wider, faster', 'Full blast'],
  },
  alarm: {
    name: 'Anti-Theft Alarm', icon: 'bolt',
    desc: 'A jolt that jumps from shopper to shopper.',
    lv: [
      { dmg: 14, cd: 1.8, chains: 3 },
      { dmg: 16, cd: 1.7, chains: 4 },
      { dmg: 19, cd: 1.6, chains: 5 },
      { dmg: 22, cd: 1.5, chains: 6 },
      { dmg: 27, cd: 1.3, chains: 8 },
    ],
    lvText: ['', '+1 jump', '+1 jump, more damage', '+1 jump', '+2 jumps'],
  },
  chicken: {
    name: 'Rotisserie Chicken', icon: 'chicken',
    desc: 'Lobbed into the crowd. Explodes. Somehow.',
    lv: [
      { dmg: 34, cd: 2.3, count: 1, radius: 28 },
      { dmg: 42, cd: 2.1, count: 1, radius: 32 },
      { dmg: 50, cd: 2.0, count: 2, radius: 34 },
      { dmg: 58, cd: 1.8, count: 2, radius: 38 },
      { dmg: 72, cd: 1.6, count: 3, radius: 42 },
    ],
    lvText: ['', 'Bigger boom', '+1 chicken', 'Bigger boom, faster', '+1 chicken'],
  },
};

// Weapons that start locked, and the milestone that puts them on the shelves.
export const UNLOCKS = {
  giftCard: { stat: 'bestTime', need: 300 },
  extinguisher: { stat: 'totalKills', need: 2000 },
  alarm: { stat: 'bestLevel', need: 25 },
  chicken: { stat: 'bossKills', need: 1 },
};

export const PASSIVES = {
  shoes: { name: 'Comfy Shoes', icon: 'shoe', desc: '+10% move speed.', stat: 'speed', per: 0.10 },
  energy: { name: 'Energy Drink', icon: 'can', desc: '-8% weapon cooldowns.', stat: 'cooldown', per: 0.08 },
  nameTag: { name: 'Name Tag', icon: 'tag', desc: '+20 max HP.', stat: 'maxHp', per: 20 },
  lanyard: { name: 'Lanyard', icon: 'lanyard', desc: '+25% pickup range.', stat: 'magnet', per: 0.25 },
  overtime: { name: 'Overtime', icon: 'clock', desc: '+10% receipts (XP).', stat: 'xp', per: 0.10 },
  union: { name: 'Union Card', icon: 'card', desc: '+1 armor (less damage per hit).', stat: 'armor', per: 1 },
};

// Max-level weapon + owned passive = evolution, offered on a level-up.
export const EVOLUTIONS = {
  priceGun: { needs: 'energy', name: 'Clearance Cannon', desc: 'Stickers everywhere. Everything must go.',
    stats: { dmg: 30, cd: 0.35, count: 6, pierce: 5, speed: 280 } },
  carts: { needs: 'shoes', name: 'Cart Train', desc: 'Eight carts. No brakes.',
    stats: { dmg: 26, count: 8, radius: 62, spin: 3.8 } },
  paSystem: { needs: 'nameTag', name: 'Store-Wide Announcement', desc: 'The whole store hears it.',
    stats: { dmg: 45, cd: 1.6, radius: 150, knock: 220 } },
  giftCard: { needs: 'overtime', name: 'Black Card', desc: 'No limit. Literally.',
    stats: { dmg: 42, cd: 0.8, count: 5, range: 160, speed: 270 } },
  alarm: { needs: 'union', name: 'Lockdown', desc: 'Every door in the store just locked.',
    stats: { dmg: 40, cd: 0.9, chains: 14 } },
  wetFloor: { needs: 'lanyard', name: 'Flood Zone', desc: 'Somebody left the hose on.',
    stats: { dmg: 20, cd: 1.3, count: 6, size: 40, dur: 5 } },
};

export const ENEMIES = {
  shopper:   { name: 'Shopper', hp: 12, speed: 34, dmg: 6, xp: 1, r: 6, sprite: 'shopper' },
  walker:    { name: 'Speed Walker', hp: 9, speed: 62, dmg: 5, xp: 1, r: 5, sprite: 'walker' },
  cart:      { name: 'Cart Pusher', hp: 45, speed: 26, dmg: 12, xp: 3, r: 8, sprite: 'cartPusher', charge: true, knockResist: 0.6 },
  clipper:   { name: 'Coupon Clipper', hp: 16, speed: 30, dmg: 4, xp: 2, r: 6, sprite: 'clipper', ranged: true },
  requester: { name: 'Manager Requester', hp: 220, speed: 30, dmg: 15, xp: 25, r: 8, sprite: 'requester', elite: true, knockResist: 0.8 },
  scalper:   { name: 'Scalper', hp: 14, speed: 66, dmg: 5, xp: 2, r: 5, sprite: 'scalper', ranged: true },
  camper:    { name: 'Line Camper', hp: 90, speed: 16, dmg: 10, xp: 4, r: 9, sprite: 'camper', knockResist: 0.7, splits: 3 },
  kid:       { name: 'Sugar Rush Kid', hp: 7, speed: 84, dmg: 3, xp: 1, r: 4, sprite: 'kid' },
  hoarder:   { name: 'Toy Hoarder', hp: 70, speed: 24, dmg: 11, xp: 4, r: 8, sprite: 'hoarder', knockResist: 0.6 },
  boss:      { name: 'Regional Manager', hp: 6000, speed: 28, dmg: 25, xp: 0, r: 16, sprite: 'boss', boss: true, knockResist: 1 },
};

// Spawn weights by minute of the shift.
export const WAVES = [
  { shopper: 1 },
  { shopper: 3, walker: 1 },
  { shopper: 4, walker: 2, clipper: 1 },
  { shopper: 3, walker: 2, clipper: 1, cart: 1 },
  { shopper: 3, walker: 3, clipper: 1, cart: 1 },
  { shopper: 3, walker: 3, clipper: 1, cart: 2 },
  { shopper: 2, walker: 4, clipper: 2, cart: 2 },
  { shopper: 1, walker: 4, clipper: 3, cart: 3 },
  { shopper: 1, walker: 4, clipper: 3, cart: 3 },
  { shopper: 1, walker: 3, clipper: 2, cart: 2 },
];

export const MAPS = {
  floor: {
    name: 'Main Floor', desc: 'Groceries, home goods, and 400 people who woke up at 3 AM for a toaster.',
    tiles: ['#d8d5cc', '#cfccc2'], stripe: '#e6c84a', bg: '#c9c6bd', waves: WAVES, boss: 'Regional Manager', bossHp: 1, hpMul: 1, speedMul: 1, dmgMul: 1,
  },
  electronics: {
    name: 'Electronics', desc: 'TVs, consoles, and the people who camped in the parking lot for them. Unlocks after your first full shift.',
    tiles: ['#2b2f3a', '#252934'], stripe: '#3fd0ff', bg: '#1e2129', unlockWins: 1, boss: 'District Manager', bossHp: 1.5, hpMul: 1.5, speedMul: 1.1, dmgMul: 1.2,
    waves: [
      { shopper: 2, walker: 1 },
      { shopper: 2, walker: 2, scalper: 1 },
      { shopper: 2, walker: 2, scalper: 1, camper: 1 },
      { shopper: 2, walker: 3, scalper: 2, camper: 1 },
      { shopper: 2, walker: 3, scalper: 2, camper: 1, cart: 1 },
      { shopper: 1, walker: 3, scalper: 2, camper: 2, cart: 1 },
      { shopper: 1, walker: 4, scalper: 2, camper: 2, cart: 2 },
      { shopper: 1, walker: 4, scalper: 3, camper: 2, cart: 2 },
      { shopper: 1, walker: 4, scalper: 3, camper: 3, cart: 2 },
      { shopper: 1, walker: 3, scalper: 2, camper: 2, cart: 2 },
    ],
  },
};

MAPS.toys = {
  name: 'Toys', desc: 'The aisle every parent fears. Unlocks after a full shift in Electronics.',
  tiles: ['#f3d9e6', '#ead0de'], stripe: '#53b96f', bg: '#e9cfdc', unlockMap: 'electronics', boss: 'Store Owner', bossHp: 2.6, hpMul: 2.5, speedMul: 1.15, dmgMul: 1.7,
  waves: [
    { shopper: 2, kid: 2 },
    { shopper: 2, kid: 3, walker: 1 },
    { shopper: 2, kid: 3, hoarder: 1, clipper: 1 },
    { shopper: 2, kid: 4, hoarder: 1, clipper: 1, walker: 1 },
    { shopper: 1, kid: 4, hoarder: 2, clipper: 1, walker: 2 },
    { shopper: 1, kid: 5, hoarder: 2, scalper: 1, walker: 2 },
    { shopper: 1, kid: 5, hoarder: 2, scalper: 2, cart: 1 },
    { shopper: 1, kid: 6, hoarder: 3, scalper: 2, cart: 2 },
    { shopper: 1, kid: 6, hoarder: 3, scalper: 2, cart: 2 },
    { shopper: 1, kid: 5, hoarder: 2, scalper: 2, cart: 2 },
  ],
};

export const CHARACTERS = {
  stocker: { name: 'Stocker', cost: 0, weapon: 'priceGun', desc: 'Starts with the Price Gun. Steady all-rounder.',
    vest: '#d8433b', mods: {} },
  cashier: { name: 'Cashier', cost: 150, earn: { stat: 'receipts', need: 3000, text: 'Collect 3,000 receipts' }, weapon: 'couponStorm', desc: 'Coupon Storm. +15% XP.',
    vest: '#3aa55d', mods: { xp: 0.15 } },
  security: { name: 'Security', cost: 300, earn: { stat: 'bossKills', need: 1, text: 'Dismiss a manager' }, weapon: 'boxCutter', desc: 'Box Cutter. +2 armor, +20 HP, 10% slower.',
    vest: '#2f4a8a', mods: { armor: 2, maxHp: 20, speed: -0.10 } },
  janitor: { name: 'Night Janitor', cost: 500, earn: { stat: 'riots', need: 3, text: 'Survive 3 riots' }, weapon: 'wetFloor', desc: 'Wet Floor. +25% pickup range, -10% cooldowns.',
    vest: '#7b7f8c', mods: { magnet: 0.25, cooldown: 0.10 } },
  // Each of these has a skill no stat upgrade gives (handled by id in main.js).
  greeter: { name: 'Greeter', cost: 600, earn: { stat: 'bestTime', need: 480, text: 'Survive 8 minutes' }, weapon: 'giftCard',
    desc: 'Gift Card. Every 15s a "Welcome!" stuns shoppers around you.', vest: '#5bc0eb', mods: {}, skill: 'welcome' },
  inventory: { name: 'Inventory Lead', cost: 700, earn: { stat: 'restocks', need: 25, text: 'Restock 25 shelves' }, weapon: 'carts',
    desc: 'Runaway Carts. Restocks twice as fast; each full restock heals 8 HP.', vest: '#f08a24', mods: {}, skill: 'restock' },
  lossprev: { name: 'Loss Prevention', cost: 800, earn: { stat: 'elites', need: 8, text: 'Knock out 8 Manager Requesters' }, weapon: 'alarm',
    desc: 'Anti-Theft Alarm. +60% damage to elites and managers.', vest: '#1b1a24', mods: { armor: 1 }, skill: 'elite' },
  deli: { name: 'Deli Cook', cost: 900, earn: { stat: 'powerups', need: 20, text: 'Grab 20 sale-tag power-ups' }, weapon: 'chicken',
    desc: 'Rotisserie Chicken. +30 HP; every heal is doubled.', vest: '#f3f1ea', mods: { maxHp: 30 }, skill: 'heal' },
};

export const META = {
  seniority: { name: 'Seniority', desc: '+10 max HP', max: 5, cost: [60, 120, 200, 300, 440], stat: 'maxHp', per: 10 },
  insoles:   { name: 'Gel Insoles', desc: '+5% move speed', max: 5, cost: [80, 160, 260, 380, 520], stat: 'speed', per: 0.05 },
  smooth:    { name: 'Smooth Talker', desc: '+10% tips', max: 5, cost: [80, 160, 260, 380, 520], stat: 'greed', per: 0.10 },
  scanner:   { name: 'Quick Scan', desc: '+5% XP', max: 5, cost: [100, 200, 320, 460, 640], stat: 'xp', per: 0.05 },
  caffeine:  { name: 'Caffeine', desc: '-3% cooldowns', max: 5, cost: [120, 240, 380, 540, 720], stat: 'cooldown', per: 0.03 },
  rerolls:   { name: 'Price Check', desc: '+1 reroll per run', max: 3, cost: [100, 240, 440], stat: 'rerolls', per: 1 },
  secondWind:{ name: 'Second Wind', desc: 'Revive once per run', max: 1, cost: [800], stat: 'revives', per: 1 },
};

// Sale tags lying on the floor: walk over one for a random power-up.
// Every power-up says what it does (desc is shown on pickup and in the HUD).
export const POWERUPS = [
  { id: 'deal', name: 'Doorbuster Deal', desc: 'Double damage for 7s', icon: '💥', dur: 7, weight: 3 },
  { id: 'rush', name: 'Rush Hour', desc: '+50% move speed for 8s', icon: '⚡', dur: 8, weight: 3 },
  { id: 'markdown', name: 'Markdown', desc: 'Weapons fire twice as fast for 6s', icon: '⏩', dur: 6, weight: 3 },
  { id: 'freeze', name: 'Price Freeze', desc: 'Shoppers frozen for 3s', icon: '🧊', dur: 3, weight: 2 },
  { id: 'clearance', name: 'Clearance', desc: 'Every receipt on screen flies to you', icon: '🧲', weight: 3 },
  { id: 'sample', name: 'Free Sample', desc: 'Heal 30 HP', icon: '🍪', weight: 3 },
  { id: 'evacuate', name: 'Everything Must Go', desc: 'Knocks out shoppers around you', icon: '🚨', weight: 0.5 },
];
// Restock or Riot. Shelves sit on a fixed grid of floor tiles; shoppers who
// crowd one strip it; empty shelves near you fill the riot meter; standing
// still beside a shelf restocks it.
export const RIOT = {
  enabled: true,
  gridX: 9, gridY: 7,        // a shelf every 9 x 7 tiles (216 x 168 px)
  grabR: 26,                 // shoppers this close to a shelf take stock
  grabRate: 0.04,            // stock per second per shopper (cap below)
  grabCap: 0.3,
  lureR: 120,                // plain shoppers within this of a stocked shelf go for it
  restockR: 22, restockRate: 0.75,
  fillPerEmpty: 2.5,         // riot meter per second per empty shelf on screen (one empty shelf: 40 s to riot)
  calmRate: 12,              // meter drain per second with no empty shelf on screen
  duration: 12,              // a riot lasts this long, then the meter starts from zero
  grace: 60,                 // no riot in the first minute of a shift
  speed: 1.1, spawn: 1.2, dmg: 1, tipMul: 2, // riot pay: tips count double while it lasts
  rewardTips: 1, rewardXp: 3,
};

export const POWERUP_DENSITY = 0.0015; // chance per floor tile (24px); about one on screen at a time

export const ACHIEVEMENTS = {
  FIRST_SHIFT: 'Clocked Out — survive a full shift',
  BOSS_DOWN: 'Escalated — defeat the Regional Manager',
  BLACK_FRIDAY: 'Black Friday — 1,000 shoppers in one run',
  EVOLVED: 'Promoted — evolve a weapon',
  FULL_STAFF: 'Full Staff — unlock every character',
  UNTOUCHABLE: 'Untouchable — survive a shift taking under 100 damage',
  OVERTIME: 'Unpaid Overtime — last 5 minutes past 11:00 AM',
  ELECTRONICS: 'Gadget Hound — survive a shift in Electronics',
  FULL_ARSENAL: 'Stocked Shelves — hold 6 weapons at once',
  TOYS: 'Toy Story — survive a shift in Toys',
};

export const ANNOUNCEMENTS = [
  'Attention shoppers: cleanup on aisle 4. And 5. And 6.',
  'The TVs are not actually 90% off. Please stop asking.',
  'Would the owner of a silver minivan please stop doing that.',
  'Reminder: the line starts back there. Way back there.',
  'Employees, your break has been moved to January.',
  'Customer service is now closed. It was never really open.',
  'Due to demand, we are out of demand.',
  'Shoppers, the fire exit is not a shortcut to electronics.',
  'Price matching is available on prices we like.',
  'A reminder that tackling is a form of shoplifting.',
  'Gift cards are not a love language. Please calm down.',
  'Lost child at the front. Not ours. Please come get him.',
  'The 4K TV was 4 dollars. It was also a typo.',
  'Please do not lick the display models.',
  'Our return policy is: no.',
  'Attention: the blender demo was not an invitation.',
];
