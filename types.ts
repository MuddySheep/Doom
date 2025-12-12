export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

export enum WeaponType {
  PISTOL = 'PISTOL',
  SHOTGUN = 'SHOTGUN',
  CHAINGUN = 'CHAINGUN'
}

export enum EnemyType {
  IMP = 'IMP',
  DEMON = 'DEMON',
  CACODEMON = 'CACODEMON',
  BARON = 'BARON'
}

export enum PickupType {
  HEALTH = 'HEALTH',
  ARMOR = 'ARMOR',
  AMMO = 'AMMO',
  SHOTGUN = 'SHOTGUN',
  CHAINGUN = 'CHAINGUN'
}

export interface Position {
  x: number;
  y: number;
}

export interface Entity extends Position {
  id: string;
  radius: number;
}

export interface Player extends Entity {
  angle: number;
  health: number;
  maxHealth: number;
  armor: number;
  maxArmor: number;
  ammo: number; // For current weapon, excluding pistol infinite
  weapon: WeaponType;
  weapons: WeaponType[];
  isMoving: boolean;
  lastFired: number;
}

export interface Enemy extends Entity {
  type: EnemyType;
  health: number;
  maxHealth: number;
  speed: number;
  damage: number;
  scoreValue: number;
}

export interface Projectile extends Entity {
  vx: number;
  vy: number;
  damage: number;
  color: string;
  lifetime: number;
}

export interface Particle extends Entity {
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  decay: number;
}

export interface Pickup extends Entity {
  type: PickupType;
  value: number;
  spawnTime: number;
}

export interface GameStats {
  score: number;
  wave: number;
  highScore: number;
}