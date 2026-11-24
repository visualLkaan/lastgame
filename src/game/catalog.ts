import {
  BuildingDef,
  BuildingId,
  ResourceCost,
  ToolDef,
  ToolId,
  TurretLevelStats,
  WaveConfig,
  WeaponDef,
  WeaponId,
  ZombieStats,
  ZombieType,
} from './types';

export const BASE_LEVEL_NAMES: Record<number, string> = {
  1: 'Terk Edilmiş İstasyon',
  2: 'Temel Güvenlik',
  3: 'Tahkim Edilmiş Üs',
  4: 'Gelişmiş Savunma Üssü',
  5: 'Hayatta Kalma Kalesi',
};

export const BASE_LEVEL_COSTS: Record<number, ResourceCost> = {
  2: { wood: 60, stone: 30 },
  3: { wood: 110, stone: 80, scrap: 40 },
  4: { wood: 160, stone: 140, scrap: 90 },
  5: { wood: 220, stone: 220, scrap: 160 },
};

export const BASE_MAX_HP_BY_LEVEL: Record<number, number> = {
  1: 450,
  2: 750,
  3: 1100,
  4: 1550,
  5: 2200,
};

export const BASE_LEVEL_UNLOCKS: Record<number, string[]> = {
  2: [
    'Gözetleme Kulesi (12.5m keskin nişancı menzili)',
    'Taş Duvar (440 Dayanıklılık)',
    'Tıbbi İstasyon (Şifa desteği)',
    'Ahşap Pencere Barikatı & Giriş Aydınlatması',
  ],
  3: [
    'Metal Duvar (720 Dayanıklılık)',
    'Gelişmiş Taret (Çift namlu hızlı destek)',
    'Gelişmiş Jeneratör (+9 Güç ve projektör)',
    'Çelik Kanopi, Pencere Demirleri & Avlu Bariyerleri',
  ],
  4: [
    'Genişletilmiş İnşa Alanı (20×18 Izgara)',
    'Ağır Savunma Kulesi (Zırh delici alan topu)',
    'Zırhlı Cephe Panelleri, Çatı Kum Torbaları & Radar',
  ],
  5: [
    'Çift Güneş Enerjisi Çatı Paneli & Savunma Kulesi Spotları',
    'Maksimum İstasyon Zırhı (2200 Can)',
    'Tam Kale Zırh Kaplaması & Ön Güvenlik Siperleri',
  ],
};

export const WORKSHOP_LEVEL_UNLOCKS: Record<number, string[]> = {
  1: ['Tabanca açılır', 'Silah geliştirme sınırı: Sv.2'],
  2: ['Metal Boru ve Pompalı Tüfek açılır', 'Silah geliştirme sınırı: Sv.3'],
  3: ['Taarruz Tüfeği açılır', 'Silah geliştirme sınırı: Sv.4'],
  4: ['Ağır Makineli Tüfek açılır', 'Maksimum silah geliştirme: Sv.5'],
};

export const WEAPON_CATALOG: Record<WeaponId, WeaponDef> = {
  wooden_bat: {
    id: 'wooden_bat',
    name: 'Ahşap Sopa',
    shortDesc: 'Hızlı savurma · Orta geri itme',
    kind: 'melee',
    cost: 0,
    damage: 28,
    attackCooldown: 0.4,
    range: 2.95,
    magSize: 0,
    reloadTime: 0,
    pellets: 1,
    spread: 0,
    projectileSpeed: 0,
    knockback: 12.0,
    requiredWorkshopLevel: 0,
    color: '#c28b52',
  },
  pistol: {
    id: 'pistol',
    name: 'Tabanca',
    shortDesc: '9mm yarı otomatik · İsabetli',
    kind: 'firearm',
    cost: 140,
    damage: 40,
    attackCooldown: 0.27,
    range: 19,
    magSize: 12,
    reloadTime: 1.15,
    pellets: 1,
    spread: 0.03,
    projectileSpeed: 40,
    knockback: 5.5,
    requiredWorkshopLevel: 1,
    color: '#cbd5e1',
  },
  metal_pipe: {
    id: 'metal_pipe',
    name: 'Metal Boru',
    shortDesc: 'Ağır darbe · Güçlü geri itme',
    kind: 'melee',
    cost: 95,
    damage: 50,
    attackCooldown: 0.48,
    range: 3.4,
    magSize: 0,
    reloadTime: 0,
    pellets: 1,
    spread: 0,
    projectileSpeed: 0,
    knockback: 17.0,
    requiredWorkshopLevel: 2,
    color: '#94a3b8',
  },
  shotgun: {
    id: 'shotgun',
    name: 'Pompalı Tüfek',
    shortDesc: '5 saçma · Yakın menzil durdurucu',
    kind: 'firearm',
    cost: 260,
    damage: 24,
    attackCooldown: 0.7,
    range: 13.5,
    magSize: 6,
    reloadTime: 1.6,
    pellets: 5,
    spread: 0.26,
    projectileSpeed: 36,
    knockback: 13.5,
    requiredWorkshopLevel: 2,
    color: '#b45309',
  },
  assault_rifle: {
    id: 'assault_rifle',
    name: 'Taarruz Tüfeği',
    shortDesc: 'Tam otomatik · Uzun menzil',
    kind: 'firearm',
    cost: 460,
    damage: 36,
    attackCooldown: 0.12,
    range: 23,
    magSize: 30,
    reloadTime: 1.75,
    pellets: 1,
    spread: 0.055,
    projectileSpeed: 46,
    knockback: 4.8,
    requiredWorkshopLevel: 3,
    color: '#475569',
  },
  heavy_mg: {
    id: 'heavy_mg',
    name: 'Ağır Makineli',
    shortDesc: 'Zırh delici · Yüksek kalibre',
    kind: 'firearm',
    cost: 820,
    damage: 56,
    attackCooldown: 0.095,
    range: 26,
    magSize: 60,
    reloadTime: 2.25,
    pellets: 1,
    spread: 0.075,
    projectileSpeed: 52,
    knockback: 7.0,
    requiredWorkshopLevel: 4,
    color: '#f59e0b',
  },
};

export const WEAPON_ORDER: WeaponId[] = [
  'wooden_bat',
  'pistol',
  'metal_pipe',
  'shotgun',
  'assault_rifle',
  'heavy_mg',
];

export const TOOL_CATALOG: Record<ToolId, ToolDef> = {
  axe: {
    id: 'axe',
    name: 'Balta',
    shortDesc: 'Ağaçlardan odun keser',
    cost: 40,
    gatherPower: 30,
    gatherDuration: 0.55,
    yieldBonus: 1.0,
    targetLabel: 'Çam Ağaçları',
    color: '#d97706',
  },
  pickaxe: {
    id: 'pickaxe',
    name: 'Kazma',
    shortDesc: 'Kayalardan taş ve cevher kırar',
    cost: 60,
    gatherPower: 28,
    gatherDuration: 0.62,
    yieldBonus: 1.0,
    targetLabel: 'Kaya ve Cevher',
    color: '#64748b',
  },
  shovel: {
    id: 'shovel',
    name: 'Kürek',
    shortDesc: 'Toprak ve enkazdan hurda çıkarır',
    cost: 80,
    gatherPower: 34,
    gatherDuration: 0.58,
    yieldBonus: 1.15,
    targetLabel: 'Enkaz ve Toprak',
    color: '#0ea5e9',
  },
  jackhammer: {
    id: 'jackhammer',
    name: 'Kırıcı',
    shortDesc: 'Dev kayaları ve madenleri parçalar',
    cost: 190,
    gatherPower: 65,
    gatherDuration: 0.42,
    yieldBonus: 1.5,
    targetLabel: 'Dev Kaya & Maden',
    color: '#facc15',
  },
};

export const TOOL_ORDER: ToolId[] = ['axe', 'pickaxe', 'shovel', 'jackhammer'];

export const BUILDING_CATALOG: Record<BuildingId, BuildingDef> = {
  wooden_wall: {
    id: 'wooden_wall',
    category: 'walls',
    name: 'Ahşap Duvar',
    shortDesc: 'Can 150 · Temel barikat',
    cost: { wood: 10 },
    upgradeCostMultiplier: 1.0,
    maxLevel: 3,
    maxHp: 150,
    size: [1, 1],
    requiredBaseLevel: 1,
    powerUse: 0,
    powerProvide: 0,
    range: 0,
    damage: 0,
    fireRate: 0,
    accentColor: '#a16207',
    blocksZombies: true,
    blocksPlayer: true,
    evolvesTo: 'reinforced_wooden_wall',
  },
  reinforced_wooden_wall: {
    id: 'reinforced_wooden_wall',
    category: 'walls',
    name: 'Güçlü Ahşap Duvar',
    shortDesc: 'Can 280 · Çivili kereste',
    cost: { wood: 20 },
    upgradeCostMultiplier: 1.2,
    maxLevel: 3,
    maxHp: 280,
    size: [1, 1],
    requiredBaseLevel: 1,
    powerUse: 0,
    powerProvide: 0,
    range: 0,
    damage: 0,
    fireRate: 0,
    accentColor: '#b45309',
    blocksZombies: true,
    blocksPlayer: true,
    evolvesTo: 'stone_wall',
  },
  stone_wall: {
    id: 'stone_wall',
    category: 'walls',
    name: 'Taş Duvar',
    shortDesc: 'Can 440 · Sağlam taş örgü',
    cost: { stone: 15, wood: 8 },
    upgradeCostMultiplier: 1.25,
    maxLevel: 4,
    maxHp: 440,
    size: [1, 1],
    requiredBaseLevel: 2,
    powerUse: 0,
    powerProvide: 0,
    range: 0,
    damage: 0,
    fireRate: 0,
    accentColor: '#78716c',
    blocksZombies: true,
    blocksPlayer: true,
    evolvesTo: 'metal_wall',
  },
  metal_wall: {
    id: 'metal_wall',
    category: 'walls',
    name: 'Metal Duvar',
    shortDesc: 'Can 720 · Zırhlı çelik plaka',
    cost: { stone: 20, scrap: 15 },
    upgradeCostMultiplier: 1.35,
    maxLevel: 4,
    maxHp: 720,
    size: [1, 1],
    requiredBaseLevel: 3,
    powerUse: 0,
    powerProvide: 0,
    range: 0,
    damage: 0,
    fireRate: 0,
    accentColor: '#475569',
    blocksZombies: true,
    blocksPlayer: true,
  },
  metal_gate: {
    id: 'metal_gate',
    category: 'walls',
    name: 'Metal Kapı',
    shortDesc: 'Can 360 · E ile açılır geçit',
    cost: { wood: 12, scrap: 10 },
    upgradeCostMultiplier: 1.25,
    maxLevel: 4,
    maxHp: 360,
    size: [1, 1],
    requiredBaseLevel: 1,
    powerUse: 0,
    powerProvide: 0,
    range: 0,
    damage: 0,
    fireRate: 0,
    accentColor: '#38bdf8',
    blocksZombies: true,
    blocksPlayer: false,
  },
  auto_turret: {
    id: 'auto_turret',
    category: 'defenses',
    name: 'Otomatik Taret',
    shortDesc: 'Hasar 11 · Menzil 7.5m · Destek ateşi',
    cost: { gold: 105, scrap: 8 },
    upgradeCostMultiplier: 1.25,
    maxLevel: 4,
    maxHp: 190,
    size: [1, 1],
    requiredBaseLevel: 1,
    powerUse: 0,
    powerProvide: 0,
    range: 7.5,
    damage: 11,
    fireRate: 1.25,
    accentColor: '#f59e0b',
    blocksZombies: true,
    blocksPlayer: true,
  },
  watchtower: {
    id: 'watchtower',
    category: 'defenses',
    name: 'Gözetleme Kulesi',
    shortDesc: 'Hasar 28 · Menzil 12.5m · Nişancı',
    cost: { gold: 170, wood: 24 },
    upgradeCostMultiplier: 1.28,
    maxLevel: 4,
    maxHp: 250,
    size: [1, 1],
    requiredBaseLevel: 2,
    powerUse: 0,
    powerProvide: 0,
    range: 12.5,
    damage: 28,
    fireRate: 0.55,
    accentColor: '#d97706',
    blocksZombies: true,
    blocksPlayer: true,
  },
  spike_trap: {
    id: 'spike_trap',
    category: 'defenses',
    name: 'Çivili Tuzak',
    shortDesc: 'Hasar 26 · Yerde gizli tuzak',
    cost: { gold: 35 },
    upgradeCostMultiplier: 1.15,
    maxLevel: 3,
    maxHp: 140,
    size: [1, 1],
    requiredBaseLevel: 1,
    powerUse: 0,
    powerProvide: 0,
    range: 1.35,
    damage: 26,
    fireRate: 1.5,
    accentColor: '#dc2626',
    blocksZombies: false,
    blocksPlayer: false,
  },
  generator: {
    id: 'generator',
    category: 'buildings',
    name: 'Jeneratör',
    shortDesc: '+4 Güç üretir · Aydınlatır',
    cost: { gold: 100, scrap: 15 },
    upgradeCostMultiplier: 1.2,
    maxLevel: 3,
    maxHp: 250,
    size: [1, 1],
    requiredBaseLevel: 1,
    powerUse: 0,
    powerProvide: 4,
    range: 0,
    damage: 0,
    fireRate: 0,
    accentColor: '#eab308',
    blocksZombies: true,
    blocksPlayer: true,
  },
  weapon_workshop: {
    id: 'weapon_workshop',
    category: 'buildings',
    name: 'Silah Atölyesi',
    shortDesc: 'Sv.1–4 · Yeni silahlar ve geliştirmeler',
    cost: { gold: 50, wood: 45, stone: 30, scrap: 20 },
    upgradeCostMultiplier: 1.2,
    maxLevel: 4,
    maxHp: 320,
    size: [1, 1],
    requiredBaseLevel: 1,
    powerUse: 1,
    powerProvide: 0,
    range: 0,
    damage: 0,
    fireRate: 0,
    accentColor: '#3b82f6',
    blocksZombies: true,
    blocksPlayer: true,
  },
  storage: {
    id: 'storage',
    category: 'buildings',
    name: 'Depo Binası',
    shortDesc: 'Kapasite +500 · Dalga +25 A',
    cost: { wood: 40, stone: 25 },
    upgradeCostMultiplier: 1.2,
    maxLevel: 3,
    maxHp: 260,
    size: [1, 1],
    requiredBaseLevel: 1,
    powerUse: 0,
    powerProvide: 0,
    range: 0,
    damage: 0,
    fireRate: 0,
    accentColor: '#10b981',
    blocksZombies: true,
    blocksPlayer: true,
  },
  store_upgrade: {
    id: 'store_upgrade',
    category: 'buildings',
    name: 'İstasyon Güçlendirme',
    shortDesc: 'Üssü büyütür ve yeniler',
    cost: { wood: 60, stone: 30 },
    upgradeCostMultiplier: 1.5,
    maxLevel: 5,
    maxHp: 450,
    size: [1, 1],
    requiredBaseLevel: 1,
    powerUse: 0,
    powerProvide: 0,
    range: 0,
    damage: 0,
    fireRate: 0,
    accentColor: '#f97316',
    blocksZombies: false,
    blocksPlayer: false,
    isBaseUpgradeAction: true,
  },
  adv_turret: {
    id: 'adv_turret',
    category: 'special',
    name: 'Gelişmiş Taret',
    shortDesc: 'Çift namlu · Menzil 9.5m · 2 Güç',
    cost: { gold: 260, scrap: 20 },
    upgradeCostMultiplier: 1.28,
    maxLevel: 4,
    maxHp: 330,
    size: [1, 1],
    requiredBaseLevel: 3,
    powerUse: 2,
    powerProvide: 0,
    range: 9.5,
    damage: 14,
    fireRate: 2.3,
    accentColor: '#06b6d4',
    blocksZombies: true,
    blocksPlayer: true,
  },
  heavy_tower: {
    id: 'heavy_tower',
    category: 'special',
    name: 'Ağır Savunma Kulesi',
    shortDesc: 'Zırh delici alan topu · Menzil 11.5m · 3 Güç',
    cost: { gold: 410, scrap: 35 },
    upgradeCostMultiplier: 1.3,
    maxLevel: 4,
    maxHp: 560,
    size: [1, 1],
    requiredBaseLevel: 4,
    powerUse: 3,
    powerProvide: 0,
    range: 11.5,
    damage: 54,
    fireRate: 0.52,
    accentColor: '#ef4444',
    blocksZombies: true,
    blocksPlayer: true,
  },
  med_station: {
    id: 'med_station',
    category: 'special',
    name: 'Tıbbi İstasyon',
    shortDesc: 'Yakında şifa verir · 1 Güç',
    cost: { gold: 165 },
    upgradeCostMultiplier: 1.2,
    maxLevel: 3,
    maxHp: 250,
    size: [1, 1],
    requiredBaseLevel: 2,
    powerUse: 1,
    powerProvide: 0,
    range: 5.5,
    damage: 0,
    fireRate: 1,
    accentColor: '#22c55e',
    blocksZombies: true,
    blocksPlayer: true,
  },
  adv_generator: {
    id: 'adv_generator',
    category: 'special',
    name: 'Gelişmiş Jeneratör',
    shortDesc: '+9 Güç · Güçlü projektör',
    cost: { gold: 240, scrap: 25 },
    upgradeCostMultiplier: 1.25,
    maxLevel: 3,
    maxHp: 350,
    size: [1, 1],
    requiredBaseLevel: 3,
    powerUse: 0,
    powerProvide: 9,
    range: 0,
    damage: 0,
    fireRate: 0,
    accentColor: '#facc15',
    blocksZombies: true,
    blocksPlayer: true,
  },
};

export const BUILDING_LIST = Object.values(BUILDING_CATALOG);

export function isTurretBuilding(defId: BuildingId): boolean {
  return (
    defId === 'auto_turret' ||
    defId === 'watchtower' ||
    defId === 'adv_turret' ||
    defId === 'heavy_tower'
  );
}

export function getTurretStatsAtLevel(defId: BuildingId, level: number): TurretLevelStats | null {
  const lv = Math.max(1, Math.min(4, Math.round(level)));
  switch (defId) {
    case 'auto_turret': {
      const table: TurretLevelStats[] = [
        { damage: 11, fireRate: 1.25, range: 7.5, spread: 0.14, projectileSpeed: 24, targetDelay: 0.45, armorPierce: 0.55, burstSize: 10, reloadTime: 1.1, splashRadius: 0 },
        { damage: 14, fireRate: 1.4, range: 8.1, spread: 0.1, projectileSpeed: 26, targetDelay: 0.35, armorPierce: 0.62, burstSize: 12, reloadTime: 0.95, splashRadius: 0 },
        { damage: 18, fireRate: 1.55, range: 8.7, spread: 0.07, projectileSpeed: 28, targetDelay: 0.25, armorPierce: 0.72, burstSize: 14, reloadTime: 0.85, splashRadius: 0 },
        { damage: 23, fireRate: 1.75, range: 9.5, spread: 0.04, projectileSpeed: 30, targetDelay: 0.16, armorPierce: 0.85, burstSize: 16, reloadTime: 0.75, splashRadius: 0 },
      ];
      return table[lv - 1];
    }
    case 'watchtower': {
      const table: TurretLevelStats[] = [
        { damage: 28, fireRate: 0.55, range: 12.5, spread: 0.05, projectileSpeed: 38, targetDelay: 0.6, armorPierce: 1.05, burstSize: 6, reloadTime: 1.2, splashRadius: 0 },
        { damage: 36, fireRate: 0.62, range: 13.5, spread: 0.03, projectileSpeed: 40, targetDelay: 0.48, armorPierce: 1.15, burstSize: 7, reloadTime: 1.05, splashRadius: 0 },
        { damage: 46, fireRate: 0.7, range: 14.5, spread: 0.015, projectileSpeed: 42, targetDelay: 0.36, armorPierce: 1.25, burstSize: 8, reloadTime: 0.9, splashRadius: 0 },
        { damage: 58, fireRate: 0.8, range: 15.8, spread: 0.005, projectileSpeed: 45, targetDelay: 0.25, armorPierce: 1.4, burstSize: 10, reloadTime: 0.8, splashRadius: 0 },
      ];
      return table[lv - 1];
    }
    case 'adv_turret': {
      const table: TurretLevelStats[] = [
        { damage: 14, fireRate: 2.3, range: 9.5, spread: 0.07, projectileSpeed: 30, targetDelay: 0.32, armorPierce: 0.65, burstSize: 18, reloadTime: 1.15, splashRadius: 0 },
        { damage: 18, fireRate: 2.6, range: 10.2, spread: 0.05, projectileSpeed: 32, targetDelay: 0.24, armorPierce: 0.75, burstSize: 22, reloadTime: 1.0, splashRadius: 0 },
        { damage: 23, fireRate: 2.95, range: 11.0, spread: 0.03, projectileSpeed: 34, targetDelay: 0.18, armorPierce: 0.85, burstSize: 26, reloadTime: 0.88, splashRadius: 0 },
        { damage: 29, fireRate: 3.35, range: 12.0, spread: 0.015, projectileSpeed: 36, targetDelay: 0.12, armorPierce: 1.0, burstSize: 30, reloadTime: 0.75, splashRadius: 0 },
      ];
      return table[lv - 1];
    }
    case 'heavy_tower': {
      const table: TurretLevelStats[] = [
        { damage: 54, fireRate: 0.52, range: 11.5, spread: 0.045, projectileSpeed: 28, targetDelay: 0.55, armorPierce: 1.35, burstSize: 4, reloadTime: 1.4, splashRadius: 2.2 },
        { damage: 68, fireRate: 0.58, range: 12.2, spread: 0.03, projectileSpeed: 30, targetDelay: 0.45, armorPierce: 1.45, burstSize: 5, reloadTime: 1.25, splashRadius: 2.35 },
        { damage: 86, fireRate: 0.65, range: 13.0, spread: 0.02, projectileSpeed: 32, targetDelay: 0.34, armorPierce: 1.6, burstSize: 6, reloadTime: 1.1, splashRadius: 2.5 },
        { damage: 108, fireRate: 0.74, range: 14.0, spread: 0.01, projectileSpeed: 34, targetDelay: 0.24, armorPierce: 1.75, burstSize: 7, reloadTime: 0.95, splashRadius: 2.75 },
      ];
      return table[lv - 1];
    }
    default:
      return null;
  }
}

export function getWorkshopUpgradeCost(currentLevel: number): ResourceCost {
  const def = BUILDING_CATALOG.weapon_workshop;
  if (currentLevel <= 0) return { ...def.cost };
  return scaleResourceCost(def.cost, currentLevel, def.upgradeCostMultiplier);
}

export const ZOMBIE_STATS: Record<ZombieType, ZombieStats> = {
  normal: {
    type: 'normal',
    name: 'Normal Zombi',
    hp: 95,
    speed: 2.05,
    damage: 8,
    attackCooldown: 1.1,
    attackRange: 1.45,
    goldReward: 14,
    scale: 1.0,
    knockbackResist: 1.0,
  },
  runner: {
    type: 'runner',
    name: 'Koşucu Zombi',
    hp: 68,
    speed: 4.15,
    damage: 9,
    attackCooldown: 0.78,
    attackRange: 1.4,
    goldReward: 22,
    scale: 0.94,
    knockbackResist: 0.8,
  },
  heavy: {
    type: 'heavy',
    name: 'Ağır Zombi',
    hp: 290,
    speed: 1.42,
    damage: 18,
    attackCooldown: 1.45,
    attackRange: 1.75,
    goldReward: 48,
    scale: 1.28,
    knockbackResist: 3.0,
  },
  boss: {
    type: 'boss',
    name: 'Alfa Mutant Boss',
    hp: 880,
    speed: 1.58,
    damage: 28,
    attackCooldown: 1.6,
    attackRange: 2.25,
    goldReward: 250,
    scale: 1.72,
    knockbackResist: 6.5,
  },
};

export function getWaveConfig(wave: number): WaveConfig {
  // Early Game (Waves 1-5): Manageable normal zombies + gradual small runner count
  if (wave === 1) {
    return { wave: 1, title: 'İlk Temas', normal: 4, runner: 0, heavy: 0, boss: 0, isNight: false };
  }
  if (wave === 2) {
    return { wave: 2, title: 'Sürü Yaklaşıyor', normal: 6, runner: 1, heavy: 0, boss: 0, isNight: false };
  }
  if (wave === 3) {
    return { wave: 3, title: 'İlk Gece Baskını', normal: 7, runner: 2, heavy: 0, boss: 0, isNight: true };
  }
  if (wave === 4) {
    return { wave: 4, title: 'Hızlı Çevreleme', normal: 9, runner: 3, heavy: 0, boss: 0, isNight: false };
  }
  if (wave === 5) {
    return { wave: 5, title: 'Karanlık Kuşatma', normal: 10, runner: 4, heavy: 0, boss: 0, isNight: true };
  }

  // Mid Game (Waves 6-10): Gradual heavy introduction, mixed waves, first boss at Wave 10
  if (wave === 6) {
    return { wave: 6, title: 'Zırhlı Tehdit', normal: 10, runner: 4, heavy: 1, boss: 0, isNight: false };
  }
  if (wave === 7) {
    return { wave: 7, title: 'Gece Taarruzu', normal: 11, runner: 5, heavy: 2, boss: 0, isNight: true };
  }
  if (wave === 8) {
    return { wave: 8, title: 'Ağır Hücum', normal: 13, runner: 6, heavy: 3, boss: 0, isNight: false };
  }
  if (wave === 9) {
    return { wave: 9, title: 'Sınır Savunması', normal: 14, runner: 7, heavy: 3, boss: 0, isNight: true };
  }
  if (wave === 10) {
    return { wave: 10, title: 'Alfa Mutant Boss', normal: 10, runner: 5, heavy: 3, boss: 1, isNight: true };
  }

  // Late Game (Waves 11+): Stronger enemy combinations and periodic boss sieges
  const extra = wave - 10;
  const isBossWave = wave % 5 === 0;
  return {
    wave,
    title: isBossWave ? `${wave}. Dalga — Boss Kuşatması` : `${wave}. Dalga`,
    normal: 14 + extra * 2,
    runner: 7 + Math.floor(extra * 1.2),
    heavy: 3 + Math.floor(extra * 0.8),
    boss: isBossWave ? 1 + Math.floor(extra / 10) : 0,
    isNight: wave % 2 === 1 || isBossWave,
  };
}

export function getWavePrepDuration(wave: number): number {
  const cfg = getWaveConfig(wave);
  if (cfg.boss > 0) return 60;
  if (wave === 6) return 54;
  if (wave >= 11) return cfg.isNight ? 55 : 50;
  if (wave >= 6) return cfg.isNight ? 52 : 48;
  if (cfg.isNight) return 48;
  return 45;
}

export function scaleResourceCost(base: ResourceCost, level: number, mult: number): ResourceCost {
  const factor = Math.max(1, level) * mult;
  return {
    gold: base.gold ? Math.round(base.gold * factor) : undefined,
    wood: base.wood ? Math.round(base.wood * factor) : undefined,
    stone: base.stone ? Math.round(base.stone * factor) : undefined,
    scrap: base.scrap ? Math.round(base.scrap * factor) : undefined,
  };
}
