import { EnemyType, WeaponType } from "./types";

export const COLORS = {
  VOID_BLACK: '#0A0A0A',
  GUNMETAL: '#2F2F2F',
  BLOOD_RED: '#8B0000',
  HELLFIRE_ORANGE: '#FF4500',
  HEALTH_GREEN: '#00FF00',
  AMMO_GOLD: '#FFD700',
  WHITE: '#FFFFFF',
};

export const GAME_CONFIG = {
  PLAYER_SPEED: 4,
  PLAYER_RADIUS: 12,
  BULLET_SPEED: 12,
  MAX_PARTICLES: 200,
  ARENA_WIDTH: 800, // Logical width, scaled to canvas
  ARENA_HEIGHT: 600, // Logical height
};

export const WEAPON_STATS = {
  [WeaponType.PISTOL]: {
    damage: 25,
    cooldown: 400,
    spread: 0,
    color: COLORS.AMMO_GOLD,
    ammoCost: 0
  },
  [WeaponType.SHOTGUN]: {
    damage: 15, // Per pellet
    pellets: 6,
    cooldown: 900,
    spread: 0.4, // Radians
    color: COLORS.AMMO_GOLD,
    ammoCost: 1
  },
  [WeaponType.CHAINGUN]: {
    damage: 12,
    cooldown: 100,
    spread: 0.15,
    color: COLORS.HELLFIRE_ORANGE,
    ammoCost: 1
  }
};

export const ENEMY_STATS = {
  [EnemyType.IMP]: {
    health: 40,
    speed: 2.5,
    damage: 10,
    radius: 14,
    color: COLORS.BLOOD_RED,
    score: 100,
    spawnWave: 1
  },
  [EnemyType.DEMON]: {
    health: 120,
    speed: 1.8,
    damage: 20,
    radius: 18,
    color: '#500000', // Darker red
    score: 300,
    spawnWave: 2
  },
  [EnemyType.CACODEMON]: {
    health: 80,
    speed: 2.0,
    damage: 15,
    radius: 20,
    color: COLORS.HELLFIRE_ORANGE,
    score: 500,
    spawnWave: 4
  },
  [EnemyType.BARON]: {
    health: 300,
    speed: 1.5,
    damage: 35,
    radius: 24,
    color: '#004400', // Dark green tint mixed with red visuals
    score: 1000,
    spawnWave: 6
  }
};