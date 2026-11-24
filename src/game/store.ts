import { create } from 'zustand';
import {
  BASE_LEVEL_COSTS,
  BASE_MAX_HP_BY_LEVEL,
  getWaveConfig,
  getWavePrepDuration,
  getWorkshopUpgradeCost,
} from './catalog';
import {
  AudioSettings,
  BuildingCategory,
  BuildingId,
  EquippedSlot,
  FloatingNotice,
  GameScreen,
  HudSnapshot,
  SaveGameData,
  ToolId,
  WeaponId,
} from './types';

export const SAVE_KEY = 'last_stop_save_v1';

export function loadSavedGame(): SaveGameData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SaveGameData;
    if (!parsed || typeof parsed.gold !== 'number' || !parsed.baseLevel) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSavedGame(data: SaveGameData): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors
  }
}

export function clearSavedGame(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // Ignore
  }
}

const INITIAL_HUD: HudSnapshot = {
  screen: 'title',
  playerHp: 100,
  playerMaxHp: 100,
  playerLevel: 1,
  playerXp: 0,
  playerNextXp: 100,
  stamina: 100,
  maxStamina: 100,
  gold: 90,
  goldCap: 1000,
  wood: 30,
  stone: 15,
  scrap: 0,
  resourceCap: 600,
  baseLevel: 1,
  baseHp: BASE_MAX_HP_BY_LEVEL[1],
  baseMaxHp: BASE_MAX_HP_BY_LEVEL[1],
  wave: 1,
  waveState: 'prep',
  prepCountdown: getWavePrepDuration(1),
  prepDuration: getWavePrepDuration(1),
  nextWaveTitle: getWaveConfig(1).title,
  nextWaveIsNight: getWaveConfig(1).isNight,
  nextWaveHasBoss: getWaveConfig(1).boss > 0,
  zombiesRemaining: 0,
  totalKills: 0,
  dayPhase: 'day',
  timeOfDay: 0.25,
  equippedSlot: { kind: 'weapon', id: 'wooden_bat' },
  inventorySlots: [{ kind: 'weapon', id: 'wooden_bat' }, null, null, null, null, null],
  activeSlotIndex: 0,
  lastSwitchLabel: null,
  lastSwitchAt: 0,
  lastBaseDamageAt: 0,
  ownedWeapons: ['wooden_bat'],
  weaponLevels: {
    wooden_bat: 1,
    metal_pipe: 1,
    pistol: 1,
    shotgun: 1,
    assault_rifle: 1,
    heavy_mg: 1,
  },
  ownedTools: [],
  toolLevels: {
    axe: 1,
    pickaxe: 1,
    shovel: 1,
    jackhammer: 1,
  },
  ammoInMag: 0,
  maxMag: 0,
  isReloading: false,
  powerUsed: 0,
  powerGenerated: 0,
  turretCount: 0,
  wallCount: 0,
  workshopLevel: 0,
  storageCount: 0,
  medStationCount: 0,
  buildMode: false,
  selectedBuildId: null,
  buildRotation: 0,
  selectedPlacedUid: null,
  selectedPlacedInfo: null,
  canUpgradeBase: false,
  baseUpgradeCost: BASE_LEVEL_COSTS[2],
  workshopUpgradeCost: getWorkshopUpgradeCost(0),
  workshopCanUpgrade: false,
  nearPrompt: null,
  nearbyNode: null,
  tutorialHint: null,
  muted: false,
  audioSettings: {
    masterVolume: 0.85,
    musicVolume: 0.45,
    sfxVolume: 0.9,
    ambientVolume: 0.65,
    muted: false,
  },
};

export interface GameActionsBridge {
  startNewGame: () => void;
  continueSavedGame: () => void;
  setPaused: (paused: boolean) => void;
  toggleMute: () => void;
  setAudioSettings: (patch: Partial<AudioSettings>) => void;
  toggleBuildMode: (force?: boolean) => void;
  selectBuildItem: (id: BuildingId | null) => void;
  rotateBuildItem: (dir?: 1 | -1) => void;
  upgradeSelectedBuilding: () => void;
  repairSelectedBuilding: () => void;
  toggleSelectedGate: () => void;
  demolishSelectedBuilding: () => void;
  clearSelectedPlaced: () => void;
  upgradeGasStation: () => void;
  repairGasStation: () => void;
  upgradeWeaponWorkshop: () => void;
  buildWeaponWorkshopShortcut: () => void;
  selectInventorySlot: (index: number) => void;
  assignToInventorySlot: (item: EquippedSlot, slotIndex: number) => void;
  buyOrEquipWeapon: (id: WeaponId) => void;
  upgradeWeapon: (id: WeaponId) => void;
  buyOrEquipTool: (id: ToolId) => void;
  upgradeTool: (id: ToolId) => void;
  adjustCameraZoom: (delta: number) => void;
  startWaveNow: () => void;
  reloadWeapon: () => void;
  dismissTutorial: () => void;
}

export type ShopTab = 'weapons' | 'tools';

interface GameStoreState {
  hud: HudSnapshot;
  hasSave: boolean;
  activeBuildTab: BuildingCategory;
  shopOpen: boolean;
  shopTab: ShopTab;
  baseUpgradeOpen: boolean;
  audioMixerOpen: boolean;
  notices: FloatingNotice[];
  bridge: GameActionsBridge | null;
  setHud: (hud: HudSnapshot) => void;
  setHasSave: (hasSave: boolean) => void;
  setActiveBuildTab: (tab: BuildingCategory) => void;
  setShopOpen: (open: boolean, tab?: ShopTab) => void;
  setShopTab: (tab: ShopTab) => void;
  setBaseUpgradeOpen: (open: boolean) => void;
  setAudioMixerOpen: (open: boolean) => void;
  pushNotice: (text: string, kind?: FloatingNotice['kind']) => void;
  setBridge: (bridge: GameActionsBridge | null) => void;
  setScreenDirect: (screen: GameScreen) => void;
}

let noticeCounter = 1;

export const useGameStore = create<GameStoreState>((set) => ({
  hud: INITIAL_HUD,
  hasSave: typeof window !== 'undefined' ? loadSavedGame() !== null : false,
  activeBuildTab: 'walls',
  shopOpen: false,
  shopTab: 'weapons',
  baseUpgradeOpen: false,
  audioMixerOpen: false,
  notices: [],
  bridge: null,
  setHud: (hud) => set({ hud }),
  setHasSave: (hasSave) => set({ hasSave }),
  setActiveBuildTab: (activeBuildTab) => set({ activeBuildTab }),
  setShopOpen: (shopOpen, tab) =>
    set((s) => ({
      shopOpen,
      shopTab: tab ?? s.shopTab,
      baseUpgradeOpen: shopOpen ? false : s.baseUpgradeOpen,
      audioMixerOpen: shopOpen ? false : s.audioMixerOpen,
    })),
  setShopTab: (shopTab) => set({ shopTab }),
  setBaseUpgradeOpen: (baseUpgradeOpen) =>
    set((s) => ({
      baseUpgradeOpen,
      shopOpen: baseUpgradeOpen ? false : s.shopOpen,
      audioMixerOpen: baseUpgradeOpen ? false : s.audioMixerOpen,
    })),
  setAudioMixerOpen: (audioMixerOpen) =>
    set((s) => ({
      audioMixerOpen,
      shopOpen: audioMixerOpen ? false : s.shopOpen,
      baseUpgradeOpen: audioMixerOpen ? false : s.baseUpgradeOpen,
    })),
  pushNotice: (text, kind = 'info') =>
    set((state) => {
      const now = Date.now();
      const filtered = state.notices.filter((n) => now - n.createdAt < 2500).slice(-4);
      return {
        notices: [
          ...filtered,
          { id: noticeCounter++, text, kind, createdAt: now },
        ],
      };
    }),
  setBridge: (bridge) => set({ bridge }),
  setScreenDirect: (screen) =>
    set((state) => ({ hud: { ...state.hud, screen } })),
}));
