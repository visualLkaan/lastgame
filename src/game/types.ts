export type GameScreen = 'title' | 'playing' | 'paused' | 'gameover';

export type WeaponId =
  | 'wooden_bat'
  | 'metal_pipe'
  | 'pistol'
  | 'shotgun'
  | 'assault_rifle'
  | 'heavy_mg';

export type ToolId = 'axe' | 'pickaxe' | 'shovel' | 'jackhammer';

export type EquippedSlot =
  | { kind: 'weapon'; id: WeaponId }
  | { kind: 'tool'; id: ToolId };

export type WeaponKind = 'melee' | 'firearm';

export interface WeaponDef {
  id: WeaponId;
  name: string;
  shortDesc: string;
  kind: WeaponKind;
  cost: number;
  damage: number;
  attackCooldown: number;
  range: number;
  magSize: number;
  reloadTime: number;
  pellets: number;
  spread: number;
  projectileSpeed: number;
  knockback: number;
  requiredWorkshopLevel: number;
  color: string;
}

export interface ToolDef {
  id: ToolId;
  name: string;
  shortDesc: string;
  cost: number;
  gatherPower: number;
  gatherDuration: number; // seconds per strike
  yieldBonus: number;
  targetLabel: string;
  color: string;
}

export type ResourceType = 'wood' | 'stone' | 'scrap';

export interface ResourceCost {
  gold?: number;
  wood?: number;
  stone?: number;
  scrap?: number;
}

export type ResourceNodeKind =
  | 'tree_small'
  | 'tree_large'
  | 'rock_small'
  | 'rock_large'
  | 'mineral_vein'
  | 'scrap_wreck'
  | 'dig_mound';

export type BuildingCategory = 'walls' | 'defenses' | 'buildings' | 'special';

export type BuildingId =
  | 'wooden_wall'
  | 'reinforced_wooden_wall'
  | 'stone_wall'
  | 'metal_wall'
  | 'metal_gate'
  | 'auto_turret'
  | 'watchtower'
  | 'spike_trap'
  | 'generator'
  | 'weapon_workshop'
  | 'storage'
  | 'store_upgrade'
  | 'adv_turret'
  | 'heavy_tower'
  | 'med_station'
  | 'adv_generator';

export interface BuildingDef {
  id: BuildingId;
  category: BuildingCategory;
  name: string;
  shortDesc: string;
  cost: ResourceCost;
  upgradeCostMultiplier: number;
  maxLevel: number;
  maxHp: number;
  size: [number, number];
  requiredBaseLevel: number;
  powerUse: number;
  powerProvide: number;
  range: number;
  damage: number;
  fireRate: number;
  accentColor: string;
  blocksZombies: boolean;
  blocksPlayer: boolean;
  isBaseUpgradeAction?: boolean;
  evolvesTo?: BuildingId; // e.g. wooden_wall -> reinforced_wooden_wall
}

export interface TurretLevelStats {
  damage: number;
  fireRate: number;
  range: number;
  spread: number;
  projectileSpeed: number;
  targetDelay: number;
  armorPierce: number;
  burstSize: number;
  reloadTime: number;
  splashRadius: number;
}

export interface PlacedBuilding {
  uid: string;
  defId: BuildingId;
  gx: number;
  gz: number;
  level: number;
  hp: number;
  maxHp: number;
  isOpen?: boolean;
  rotation?: number;
  cooldownTimer: number;
  turretAngle: number;
}

export type ZombieType = 'normal' | 'runner' | 'heavy' | 'boss';

export interface ZombieStats {
  type: ZombieType;
  name: string;
  hp: number;
  speed: number;
  damage: number;
  attackCooldown: number;
  attackRange: number;
  goldReward: number;
  scale: number;
  knockbackResist: number; // higher = less knockback
}

export type DayPhase = 'day' | 'dusk' | 'night';

export interface WaveConfig {
  wave: number;
  title: string;
  normal: number;
  runner: number;
  heavy: number;
  boss: number;
  isNight: boolean;
}

export interface FloatingNotice {
  id: number;
  text: string;
  kind: 'gold' | 'wood' | 'stone' | 'scrap' | 'wave' | 'info' | 'danger';
  createdAt: number;
}

export interface NearbyNodeInfo {
  name: string;
  requiredTool: ToolId;
  requiredToolName: string;
  hasTool: boolean;
  hp: number;
  maxHp: number;
  progress: number; // 0..1 while gathering
  isGathering: boolean;
}

export interface AudioSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  ambientVolume: number;
  muted: boolean;
}

export interface HudSnapshot {
  screen: GameScreen;
  playerHp: number;
  playerMaxHp: number;
  playerLevel: number;
  playerXp: number;
  playerNextXp: number;
  stamina: number;
  maxStamina: number;
  gold: number;
  goldCap: number;
  wood: number;
  stone: number;
  scrap: number;
  resourceCap: number;
  baseLevel: number;
  baseHp: number;
  baseMaxHp: number;
  wave: number;
  waveState: 'prep' | 'combat';
  prepCountdown: number;
  prepDuration: number;
  nextWaveTitle: string;
  nextWaveIsNight: boolean;
  nextWaveHasBoss: boolean;
  zombiesRemaining: number;
  totalKills: number;
  dayPhase: DayPhase;
  timeOfDay: number;
  equippedSlot: EquippedSlot;
  inventorySlots: Array<EquippedSlot | null>;
  activeSlotIndex: number;
  lastSwitchLabel: string | null;
  lastSwitchAt: number;
  lastBaseDamageAt: number;
  ownedWeapons: WeaponId[];
  weaponLevels: Record<WeaponId, number>;
  ownedTools: ToolId[];
  toolLevels: Record<ToolId, number>;
  ammoInMag: number;
  maxMag: number;
  isReloading: boolean;
  powerUsed: number;
  powerGenerated: number;
  turretCount: number;
  wallCount: number;
  workshopLevel: number;
  storageCount: number;
  medStationCount: number;
  buildMode: boolean;
  selectedBuildId: BuildingId | null;
  buildRotation: number;
  selectedPlacedUid: string | null;
  selectedPlacedInfo: PlacedBuilding | null;
  canUpgradeBase: boolean;
  baseUpgradeCost: ResourceCost;
  workshopUpgradeCost: ResourceCost;
  workshopCanUpgrade: boolean;
  nearPrompt: string | null;
  nearbyNode: NearbyNodeInfo | null;
  tutorialHint: string | null;
  muted: boolean;
  audioSettings: AudioSettings;
}

export interface SaveGameData {
  version: number;
  worldSeed?: number;
  gold: number;
  wood: number;
  stone: number;
  scrap: number;
  playerLevel: number;
  playerXp: number;
  baseLevel: number;
  baseHp: number;
  wave: number;
  totalKills: number;
  equippedWeapon: WeaponId;
  inventorySlots?: Array<EquippedSlot | null>;
  activeSlotIndex?: number;
  ownedWeapons: WeaponId[];
  weaponLevels: Record<WeaponId, number>;
  ownedTools: ToolId[];
  toolLevels: Record<ToolId, number>;
  tutorialFlags: string[];
  placedBuildings: Array<{
    uid: string;
    defId: string;
    gx: number;
    gz: number;
    level: number;
    hp: number;
    isOpen?: boolean;
    rotation?: number;
  }>;
}

export const GRID_HALF = 11;
export const CELL_SIZE = 2.0;
