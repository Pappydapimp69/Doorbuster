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
      { dmg: 22, cd: 1.2, range: 34, arcs: 1 },
      { dmg: 28, cd: 1.1, range: 38, arcs: 1 },
      { dmg: 32, cd: 1.0, range: 40, arcs: 2 },
      { dmg: 40, cd: 0.9, range: 44, arcs: 2 },
      { dmg: 52, cd: 0.8, range: 50, arcs: 2 },
    ],
    lvText: ['', 'More damage, longer reach', 'Also slashes behind you', 'More damage, faster', 'Huge damage, reach'],
  },
  carts: {
    name: 'Runaway Carts', icon: 'cart',
    desc: 'Shopping carts circle you and run shoppers over.',
    lv: [
      { dmg: 8, count: 1, radius: 40, spin: 2.6 },
      { dmg: 10, count: 2, radius: 42, spin: 2.8 },
      { dmg: 12, count: 2, radius: 48, spin: 3.0 },
      { dmg: 14, count: 3, radius: 50, spin: 3.2 },
      { dmg: 18, count: 4, radius: 54, spin: 3.4 },
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
      { dmg: 7, cd: 1.4, count: 2, speed: 150 },
      { dmg: 8, cd: 1.3, count: 3, speed: 160 },
      { dmg: 10, cd: 1.2, count: 3, speed: 170 },
      { dmg: 11, cd: 1.1, count: 4, speed: 180 },
      { dmg: 14, cd: 1.0, count: 5, speed: 190 },
    ],
    lvText: ['', '+1 coupon', 'More damage', '+1 coupon', '+1 coupon'],
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
  wetFloor: { needs: 'lanyard', name: 'Flood Zone', desc: 'Somebody left the hose on.',
    stats: { dmg: 20, cd: 1.3, count: 6, size: 40, dur: 5 } },
};

export const ENEMIES = {
  shopper:   { name: 'Shopper', hp: 12, speed: 34, dmg: 6, xp: 1, r: 6, sprite: 'shopper' },
  walker:    { name: 'Speed Walker', hp: 9, speed: 62, dmg: 5, xp: 1, r: 5, sprite: 'walker' },
  cart:      { name: 'Cart Pusher', hp: 45, speed: 26, dmg: 12, xp: 3, r: 8, sprite: 'cartPusher', charge: true, knockResist: 0.6 },
  clipper:   { name: 'Coupon Clipper', hp: 16, speed: 30, dmg: 4, xp: 2, r: 6, sprite: 'clipper', ranged: true },
  requester: { name: 'Manager Requester', hp: 220, speed: 30, dmg: 15, xp: 25, r: 8, sprite: 'requester', elite: true, knockResist: 0.8 },
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

export const CHARACTERS = {
  stocker: { name: 'Stocker', cost: 0, weapon: 'priceGun', desc: 'Starts with the Price Gun. Steady all-rounder.',
    vest: '#d8433b', mods: {} },
  cashier: { name: 'Cashier', cost: 150, weapon: 'couponStorm', desc: 'Coupon Storm. +15% XP.',
    vest: '#3aa55d', mods: { xp: 0.15 } },
  security: { name: 'Security', cost: 300, weapon: 'boxCutter', desc: 'Box Cutter. +2 armor, +20 HP, 10% slower.',
    vest: '#2f4a8a', mods: { armor: 2, maxHp: 20, speed: -0.10 } },
  janitor: { name: 'Night Janitor', cost: 500, weapon: 'wetFloor', desc: 'Wet Floor. +25% pickup range, -10% cooldowns.',
    vest: '#7b7f8c', mods: { magnet: 0.25, cooldown: 0.10 } },
};

export const META = {
  seniority: { name: 'Seniority', desc: '+10 max HP', max: 5, cost: [30, 60, 100, 150, 220], stat: 'maxHp', per: 10 },
  insoles:   { name: 'Gel Insoles', desc: '+5% move speed', max: 5, cost: [40, 80, 130, 190, 260], stat: 'speed', per: 0.05 },
  smooth:    { name: 'Smooth Talker', desc: '+10% tips', max: 5, cost: [40, 80, 130, 190, 260], stat: 'greed', per: 0.10 },
  scanner:   { name: 'Quick Scan', desc: '+5% XP', max: 5, cost: [50, 100, 160, 230, 320], stat: 'xp', per: 0.05 },
  caffeine:  { name: 'Caffeine', desc: '-3% cooldowns', max: 5, cost: [60, 120, 190, 270, 360], stat: 'cooldown', per: 0.03 },
  rerolls:   { name: 'Price Check', desc: '+1 reroll per run', max: 3, cost: [50, 120, 220], stat: 'rerolls', per: 1 },
  secondWind:{ name: 'Second Wind', desc: 'Revive once per run', max: 1, cost: [400], stat: 'revives', per: 1 },
};

export const ACHIEVEMENTS = {
  FIRST_SHIFT: 'Clocked Out — survive a full shift',
  BOSS_DOWN: 'Escalated — defeat the Regional Manager',
  BLACK_FRIDAY: 'Black Friday — 1,000 shoppers in one run',
  EVOLVED: 'Promoted — evolve a weapon',
  FULL_STAFF: 'Full Staff — unlock every character',
  UNTOUCHABLE: 'Untouchable — survive a shift taking under 100 damage',
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
];
