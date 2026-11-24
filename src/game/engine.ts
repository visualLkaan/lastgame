import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { soundEngine } from './audio';
import {
  BASE_LEVEL_COSTS,
  BASE_LEVEL_NAMES,
  BASE_MAX_HP_BY_LEVEL,
  BUILDING_CATALOG,
  getTurretStatsAtLevel,
  getWaveConfig,
  getWavePrepDuration,
  getWorkshopUpgradeCost,
  isTurretBuilding,
  scaleResourceCost,
  TOOL_CATALOG,
  TOOL_ORDER,
  WEAPON_CATALOG,
  WEAPON_ORDER,
  ZOMBIE_STATS,
} from './catalog';
import {
  createBuildingMesh,
  createGasStationEnvironment,
  createResourceNodeMesh,
  createSharedMaterials,
  createWallConnectorArm,
  GasStationEnvHandle,
  getWorldPropExclusionZones,
  prepareOccludableMaterials,
  SharedMaterials,
} from './models';
import {
  getCoinTexture,
  getPlayerSpriteTexture,
  getZombieSpriteTexture,
  PlayerAnimState,
  ZombieAnimState,
} from './sprites';
import {
  clearSavedGame,
  GameActionsBridge,
  loadSavedGame,
  useGameStore,
  writeSavedGame,
} from './store';
import {
  BuildingId,
  CELL_SIZE,
  DayPhase,
  EquippedSlot,
  GameScreen,
  GRID_HALF,
  NearbyNodeInfo,
  PlacedBuilding,
  ResourceCost,
  ResourceNodeKind,
  SaveGameData,
  ToolId,
  WeaponId,
  ZombieType,
} from './types';

// Pre-allocated scratch math objects (zero GC in tick loop)
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _v3 = new THREE.Vector3();
const _ray = new THREE.Ray();
const _mouseNdc = new THREE.Vector2();
const _groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const _rayHit = new THREE.Vector3();
const _dayBg = new THREE.Color(0xcbd5c0);
const _nightBg = new THREE.Color(0x0b101b);
const _duskBg = new THREE.Color(0x614450);
const _daySunColor = new THREE.Color(0xfff1d6);
const _nightSunColor = new THREE.Color(0x6488d8);
const _daySky = new THREE.Color(0xbbe1fa);
const _nightSky = new THREE.Color(0x162033);
const _dayGround = new THREE.Color(0x8a7252);
const _nightGround = new THREE.Color(0x141210);

function createSeededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface ZombieEntity {
  id: number;
  type: ZombieType;
  group: THREE.Group;
  spriteMesh: THREE.Mesh;
  silhouetteMesh: THREE.Mesh;
  hpBarBg: THREE.Mesh;
  hpBarFill: THREE.Mesh;
  x: number;
  z: number;
  vx: number;
  vz: number;
  knockbackVx: number;
  knockbackVz: number;
  staggerTimer: number;
  lastHitSwingId: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  attackCooldown: number;
  attackTimer: number;
  attackRange: number;
  goldReward: number;
  animState: ZombieAnimState;
  animTimer: number;
  hurtTimer: number;
  dead: boolean;
  deathTimer: number;
  facingLeft: boolean;
  bossSlamTimer: number;
  hasDetectedPlayer: boolean;
  idleSoundTimer: number;
}

interface ProjectileEntity {
  active: boolean;
  mesh: THREE.Mesh;
  x: number;
  y: number;
  z: number;
  vx: number;
  vz: number;
  damage: number;
  knockback: number;
  life: number;
  splashRadius: number;
  fromTurret: boolean;
  armorPierce: number;
}

interface CoinEntity {
  active: boolean;
  mesh: THREE.Mesh;
  x: number;
  y: number;
  z: number;
  vy: number;
  value: number;
  life: number;
}

interface FxRingEntity {
  active: boolean;
  mesh: THREE.Mesh;
  age: number;
  duration: number;
  maxScale: number;
}

interface ParticleEntity {
  active: boolean;
  mesh: THREE.Mesh;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
}

interface ResourceNodeEntity {
  uid: string;
  kind: ResourceNodeKind;
  name: string;
  requiredTool: ToolId;
  altTool?: ToolId;
  x: number;
  z: number;
  radius: number;
  hp: number;
  maxHp: number;
  woodYield: number;
  stoneYield: number;
  scrapYield: number;
  goldBonus: number;
  depleted: boolean;
  regrowTimer: number;
  shakeTimer: number;
  mesh: THREE.Group;
}

interface PlacedRuntime extends PlacedBuilding {
  rotation: number;
  mesh: THREE.Group;
  hpBarFill?: THREE.Mesh;
  fadeMaterials: THREE.MeshStandardMaterial[];
  fadeAlpha: number;
  occludeBox: THREE.Box3;
  targetZombieId?: number;
  targetLockTimer: number;
  burstShots: number;
  reloadTimer: number;
}

export class LastStopEngine {
  private container: HTMLElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private raycaster = new THREE.Raycaster();
  private isSoftwareGl = false;
  private frameId = 0;
  private disposed = false;

  private mats!: SharedMaterials;
  private envHandle!: GasStationEnvHandle;
  private sunLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private playerFlashLight!: THREE.PointLight;

  // Grid & Ghost UI in 3D
  private gridVisualGroup = new THREE.Group();
  private ghostGroup = new THREE.Group();
  private ghostBox!: THREE.Mesh;
  private ghostRangeRing!: THREE.Mesh;
  private ghostPreviewMesh: THREE.Group | null = null;
  private ghostPreviewId: BuildingId | null = null;
  private ghostPreviewMat: THREE.MeshBasicMaterial | null = null;
  private aimReticle!: THREE.Mesh;
  private hoverGx = 0;
  private hoverGz = 0;
  private hoverValid = false;

  // Player
  private playerGroup = new THREE.Group();
  private playerSprite!: THREE.Mesh;
  private playerSilhouette!: THREE.Mesh;
  private playerX = 0;
  private playerZ = 7.5;
  private playerVx = 0;
  private playerVz = 0;
  private playerHp = 100;
  private playerMaxHp = 100;
  private playerLevel = 1;
  private playerXp = 0;
  private playerNextXp = 100;
  private stamina = 100;
  private maxStamina = 100;
  private dodgeTimer = 0;
  private dodgeCooldown = 0;
  private dodgeDirX = 0;
  private dodgeDirZ = 0;
  private playerFacingLeft = false;
  private aimAngle = 0;
  private playerAnimState: PlayerAnimState = 'idle';
  private playerAnimTimer = 0;
  private playerAttackAnimTimer = 0;
  private playerHurtTimer = 0;
  private weaponCooldownTimer = 0;
  private attackSwingSeq = 1;

  // Economy & Progression
  private worldSeed = Math.floor(Math.random() * 2147483646) + 1;
  private screen: GameScreen = 'title';
  private gold = 90;
  private goldCap = 1000;
  private wood = 30;
  private stone = 15;
  private scrap = 0;
  private resourceCap = 600;
  private baseLevel = 1;
  private baseHp = BASE_MAX_HP_BY_LEVEL[1];
  private baseMaxHp = BASE_MAX_HP_BY_LEVEL[1];
  private lastBaseDamageAt = 0;
  private lastBaseDamageNoticeAt = 0;
  private screenShake = 0;
  private wave = 1;
  private waveState: 'prep' | 'combat' = 'prep';
  private prepCountdown = getWavePrepDuration(1);
  private totalKills = 0;
  private spawnQueue: ZombieType[] = [];
  private spawnTimer = 0;
  private nightFactor = 0;
  private targetNightFactor = 0;

  // Unified 6-Slot Inventory (Weapons + Tools)
  private equippedSlot: EquippedSlot = { kind: 'weapon', id: 'wooden_bat' };
  private inventorySlots: Array<EquippedSlot | null> = [
    { kind: 'weapon', id: 'wooden_bat' },
    null,
    null,
    null,
    null,
    null,
  ];
  private activeSlotIndex = 0;
  private lastSwitchLabel: string | null = null;
  private lastSwitchAt = 0;
  private lastWeaponId: WeaponId = 'wooden_bat';
  private ownedWeapons: WeaponId[] = ['wooden_bat'];
  private weaponLevels: Record<WeaponId, number> = {
    wooden_bat: 1,
    metal_pipe: 1,
    pistol: 1,
    shotgun: 1,
    assault_rifle: 1,
    heavy_mg: 1,
  };
  private ownedTools: ToolId[] = [];
  private toolLevels: Record<ToolId, number> = {
    axe: 1,
    pickaxe: 1,
    shovel: 1,
    jackhammer: 1,
  };
  private ammoMap: Record<WeaponId, number> = {
    wooden_bat: 0,
    metal_pipe: 0,
    pistol: 12,
    shotgun: 6,
    assault_rifle: 30,
    heavy_mg: 60,
  };
  private isReloading = false;
  private reloadTimer = 0;

  // Gathering state
  private gatheringNode: ResourceNodeEntity | null = null;
  private gatherProgress = 0;
  private resourceNodes: ResourceNodeEntity[] = [];

  // Building State
  private placedBuildings = new Map<string, PlacedRuntime>();
  private cellOccupancy = new Map<string, string>();
  private buildMode = false;
  private selectedBuildId: BuildingId | null = null;
  private buildRotation = 0;
  private selectedPlacedUid: string | null = null;
  private powerUsed = 0;
  private powerGenerated = 0;
  private turretCount = 0;
  private wallCount = 0;
  private workshopLevel = 0;
  private storageCount = 0;
  private medStationCount = 0;
  private medHealAccum = 0;
  private uidSeq = 1;

  // Tutorial state
  private tutorialFlags = new Set<string>();
  private dismissedTutorial = false;

  // Entities & Pools
  private zombies: ZombieEntity[] = [];
  private zombieIdSeq = 1;
  private projectiles: ProjectileEntity[] = [];
  private coins: CoinEntity[] = [];
  private fxRings: FxRingEntity[] = [];
  private particles: ParticleEntity[] = [];

  // Input
  private keys: Record<string, boolean> = {};
  private mouseDown = false;
  private pointerClientX = 0;
  private pointerClientY = 0;
  private cameraZoom = 24;
  private lastTickTime = 0;
  private hudSyncAccum = 0;
  private lastSaveTime = 0;

  constructor(container: HTMLElement) {
    this.container = container;
    this.initRendererAndScene();
    this.initPlayer();
    this.initPools();
    this.initResourceNodes();
    this.initGridVisuals();
    this.bindEvents();
    this.registerBridge();
    this.syncHudToStore();

    this.lastTickTime = performance.now();
    this.startLoop();
  }

  private detectSoftwareWebGL(): boolean {
    try {
      const probe = document.createElement('canvas');
      const gl = probe.getContext('webgl2') || probe.getContext('webgl');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param) || '');
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } catch {
      return true;
    }
  }

  private initRendererAndScene() {
    this.isSoftwareGl = this.detectSoftwareWebGL();
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h);
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = _dayBg.clone();
    this.scene.fog = new THREE.FogExp2(_dayBg.getHex(), 0.01);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    this.camera = new THREE.PerspectiveCamera(36, w / h, 0.5, 220);
    this.camera.position.set(6, 23, 24);
    this.camera.lookAt(0, 0, 2);

    this.hemiLight = new THREE.HemisphereLight(_daySky, _dayGround, 0.72);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(_daySunColor, 1.55);
    this.sunLight.position.set(18, 28, 16);
    this.sunLight.castShadow = !this.isSoftwareGl;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    const d = 32;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.camera.near = 2;
    this.sunLight.shadow.camera.far = 95;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    const rimLight = new THREE.DirectionalLight(0x93c5fd, 0.4);
    rimLight.position.set(-18, 14, -20);
    this.scene.add(rimLight);

    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.mats = createSharedMaterials(maxAniso);
    this.envHandle = createGasStationEnvironment(this.scene, this.mats, this.baseLevel);

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }
  }

  private initPlayer() {
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.62, 18),
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
      }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.04;
    this.playerGroup.add(shadow);

    const spriteMat = new THREE.MeshBasicMaterial({
      map: getPlayerSpriteTexture('wooden_bat', 'idle', 0),
      transparent: true,
      alphaTest: 0.35,
      side: THREE.DoubleSide,
    });
    this.playerSprite = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 2.1), spriteMat);
    this.playerSprite.position.y = 1.05;
    this.playerGroup.add(this.playerSprite);

    const silMat = new THREE.MeshBasicMaterial({
      map: spriteMat.map,
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.42,
      alphaTest: 0.35,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.playerSilhouette = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 2.1), silMat);
    this.playerSilhouette.position.y = 1.05;
    this.playerSilhouette.renderOrder = 80;
    this.playerSilhouette.visible = false;
    this.playerGroup.add(this.playerSilhouette);

    this.playerFlashLight = new THREE.PointLight(0xfef08a, 0, 7, 2);
    this.playerFlashLight.position.set(0, 1.3, 0);
    this.playerGroup.add(this.playerFlashLight);

    this.playerGroup.position.set(this.playerX, 0, this.playerZ);
    this.scene.add(this.playerGroup);

    const reticleGeo = new THREE.RingGeometry(0.32, 0.45, 24);
    reticleGeo.rotateX(-Math.PI / 2);
    this.aimReticle = new THREE.Mesh(
      reticleGeo,
      new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.78,
        depthWrite: false,
      }),
    );
    this.aimReticle.position.y = 0.06;
    this.scene.add(this.aimReticle);
  }

  private initPools() {
    const projGeo = new THREE.SphereGeometry(0.14, 8, 8);
    const playerProjMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const turretProjMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    for (let i = 0; i < 60; i++) {
      const mesh = new THREE.Mesh(projGeo, i < 35 ? playerProjMat : turretProjMat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.projectiles.push({
        active: false,
        mesh,
        x: 0,
        y: 1,
        z: 0,
        vx: 0,
        vz: 0,
        damage: 0,
        knockback: 0,
        life: 0,
        splashRadius: 0,
        fromTurret: false,
        armorPierce: 1,
      });
    }

    const coinGeo = new THREE.PlaneGeometry(0.82, 0.82);
    const coinMat = new THREE.MeshBasicMaterial({
      map: getCoinTexture(),
      transparent: true,
      alphaTest: 0.35,
      side: THREE.DoubleSide,
    });
    for (let i = 0; i < 45; i++) {
      const mesh = new THREE.Mesh(coinGeo, coinMat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.coins.push({
        active: false,
        mesh,
        x: 0,
        y: 0.5,
        z: 0,
        vy: 0,
        value: 10,
        life: 0,
      });
    }

    const ringGeo = new THREE.RingGeometry(0.65, 0.95, 24);
    ringGeo.rotateX(-Math.PI / 2);
    for (let i = 0; i < 20; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(ringGeo, mat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.fxRings.push({
        active: false,
        mesh,
        age: 0,
        duration: 0.3,
        maxScale: 2,
      });
    }

    // Gathering & hit debris particle pool (60)
    const partGeo = new THREE.BoxGeometry(0.22, 0.22, 0.22);
    for (let i = 0; i < 60; i++) {
      const mat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.8 });
      const mesh = new THREE.Mesh(partGeo, mat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.particles.push({
        active: false,
        mesh,
        x: 0,
        y: 0,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
      });
    }
  }

  private isResourcePositionValid(
    x: number,
    z: number,
    radius: number,
    existing: ResourceNodeEntity[],
  ): boolean {
    if (x < -54 || x > 54 || z < -54 || z > 54) return false;

    // Exclude gas station forecourt & full buildable perimeter
    if (x > -21 && x < 19 && z > -19 && z < 14.5) return false;

    // Exclude highway road and shoulders
    if (z >= 14.2 && z <= 27.2) return false;

    // Exclude southeast ruined outpost concrete pad & wall
    if (x >= 26 && x <= 46 && z >= 28 && z <= 44) return false;

    // Exclude abandoned highway/field vehicles, containers, campsite & outpost
    for (const zone of getWorldPropExclusionZones()) {
      if (Math.hypot(x - zone.x, z - zone.z) < zone.r + radius) return false;
    }

    // Exclude existing placed buildings
    for (const b of this.placedBuildings.values()) {
      const [bx, bz] = this.gridToWorld(b.gx, b.gz);
      if (Math.hypot(x - bx, z - bz) < 3.2 + radius) return false;
    }

    // Prevent overlap or crowding between resource nodes
    for (const other of existing) {
      if (Math.hypot(x - other.x, z - other.z) < radius + other.radius + 3.0) {
        return false;
      }
    }

    return true;
  }

  private initResourceNodes(seed?: number) {
    if (seed !== undefined) {
      this.worldSeed = seed;
    }
    for (const rn of this.resourceNodes) {
      this.scene.remove(rn.mesh);
    }
    this.resourceNodes = [];
    this.gatheringNode = null;
    this.gatherProgress = 0;

    const rng = createSeededRng(this.worldSeed);

    const kindPool: ResourceNodeKind[] = [
      'tree_small', 'tree_small', 'tree_small', 'tree_small', 'tree_small',
      'tree_small', 'tree_small', 'tree_small', 'tree_small', 'tree_small',
      'tree_small', 'tree_small', 'tree_small',
      'tree_large', 'tree_large', 'tree_large', 'tree_large',
      'tree_large', 'tree_large', 'tree_large', 'tree_large',
      'rock_small', 'rock_small', 'rock_small', 'rock_small', 'rock_small',
      'rock_small', 'rock_small', 'rock_small', 'rock_small', 'rock_small',
      'rock_large', 'rock_large', 'rock_large', 'rock_large', 'rock_large',
      'mineral_vein', 'mineral_vein', 'mineral_vein', 'mineral_vein',
      'scrap_wreck', 'scrap_wreck', 'scrap_wreck', 'scrap_wreck', 'scrap_wreck',
      'dig_mound', 'dig_mound', 'dig_mound', 'dig_mound', 'dig_mound',
      // +10% natural resource density boost (appended to preserve existing seeded positions)
      'tree_small',
      'tree_large',
      'rock_small',
      'rock_large',
      'scrap_wreck',
    ];

    const cfgMap = {
      tree_small: {
        name: 'Genç Çam Ağacı',
        requiredTool: 'axe' as ToolId,
        altTool: undefined,
        hp: 75,
        wood: 18,
        stone: 0,
        scrap: 0,
        gold: 0,
        radius: 1.0,
      },
      tree_large: {
        name: 'Ulu Çam Ağacı',
        requiredTool: 'axe' as ToolId,
        altTool: undefined,
        hp: 140,
        wood: 36,
        stone: 0,
        scrap: 0,
        gold: 0,
        radius: 1.35,
      },
      rock_small: {
        name: 'Kaya Kütlesi',
        requiredTool: 'pickaxe' as ToolId,
        altTool: 'jackhammer' as ToolId,
        hp: 90,
        wood: 0,
        stone: 20,
        scrap: 2,
        gold: 0,
        radius: 1.05,
      },
      rock_large: {
        name: 'Dev Kaya',
        requiredTool: 'jackhammer' as ToolId,
        altTool: 'pickaxe' as ToolId,
        hp: 200,
        wood: 0,
        stone: 42,
        scrap: 8,
        gold: 0,
        radius: 1.5,
      },
      mineral_vein: {
        name: 'Maden Damarı',
        requiredTool: 'jackhammer' as ToolId,
        altTool: 'pickaxe' as ToolId,
        hp: 180,
        wood: 0,
        stone: 24,
        scrap: 26,
        gold: 10,
        radius: 1.35,
      },
      scrap_wreck: {
        name: 'Metal Enkaz Yığını',
        requiredTool: 'shovel' as ToolId,
        altTool: 'jackhammer' as ToolId,
        hp: 110,
        wood: 0,
        stone: 6,
        scrap: 24,
        gold: 8,
        radius: 1.3,
      },
      dig_mound: {
        name: 'Kazı Alanı',
        requiredTool: 'shovel' as ToolId,
        altTool: undefined,
        hp: 80,
        wood: 6,
        stone: 14,
        scrap: 10,
        gold: 18,
        radius: 1.15,
      },
    };

    kindPool.forEach((kind, idx) => {
      const cfg = cfgMap[kind];
      let px = 0;
      let pz = 0;
      let placed = false;

      // Natural clustering: 35% chance to spawn near a similar node (groves/outcrops), 65% scattered across world
      const sameCategoryNodes = this.resourceNodes.filter(
        (n) =>
          (kind.startsWith('tree') && n.kind.startsWith('tree')) ||
          (kind.startsWith('rock') && n.kind.startsWith('rock')),
      );

      for (let attempt = 0; attempt < 60; attempt++) {
        if (attempt < 15 && sameCategoryNodes.length > 0 && rng() < 0.35) {
          const anchor = sameCategoryNodes[Math.floor(rng() * sameCategoryNodes.length)];
          const ang = rng() * Math.PI * 2;
          const dist = 4.6 + rng() * 5.2;
          px = anchor.x + Math.cos(ang) * dist;
          pz = anchor.z + Math.sin(ang) * dist;
        } else {
          px = (rng() * 2 - 1) * 52;
          pz = (rng() * 2 - 1) * 52;
        }

        if (this.isResourcePositionValid(px, pz, cfg.radius, this.resourceNodes)) {
          placed = true;
          break;
        }
      }

      if (!placed) return;

      const variant = Math.floor(rng() * 12);
      const mesh = createResourceNodeMesh(kind, this.mats, variant);
      mesh.position.set(px, 0, pz);
      mesh.rotation.y = rng() * Math.PI * 2;
      this.scene.add(mesh);

      this.resourceNodes.push({
        uid: `rn_${idx}`,
        kind,
        name: cfg.name,
        requiredTool: cfg.requiredTool,
        altTool: cfg.altTool,
        x: px,
        z: pz,
        radius: cfg.radius,
        hp: cfg.hp,
        maxHp: cfg.hp,
        woodYield: cfg.wood,
        stoneYield: cfg.stone,
        scrapYield: cfg.scrap,
        goldBonus: cfg.gold,
        depleted: false,
        regrowTimer: 0,
        shakeTimer: 0,
        mesh,
      });
    });
  }

  private initGridVisuals() {
    this.gridVisualGroup.visible = false;
    this.scene.add(this.gridVisualGroup);
    this.rebuildGridOverlay();

    const boxGeo = new THREE.BoxGeometry(1, 0.14, 1);
    const boxMat = new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    });
    this.ghostBox = new THREE.Mesh(boxGeo, boxMat);
    this.ghostBox.position.y = 0.08;
    this.ghostGroup.add(this.ghostBox);

    const rangeGeo = new THREE.RingGeometry(0.95, 1.0, 48);
    rangeGeo.rotateX(-Math.PI / 2);
    const rangeMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    this.ghostRangeRing = new THREE.Mesh(rangeGeo, rangeMat);
    this.ghostRangeRing.position.y = 0.08;
    this.ghostRangeRing.visible = false;
    this.ghostGroup.add(this.ghostRangeRing);

    this.ghostGroup.visible = false;
    this.scene.add(this.ghostGroup);
  }

  private getBuildBounds(): { minX: number; maxX: number; minZ: number; maxZ: number } {
    if (this.baseLevel >= 4) {
      return { minX: -10, maxX: 9, minZ: -9, maxZ: 8 };
    }
    return { minX: -7, maxX: 6, minZ: -7, maxZ: 6 };
  }

  private isEssentialStationCell(gx: number, gz: number): boolean {
    return gx >= -2 && gx <= 1 && gz >= -3 && gz <= 2;
  }

  private rebuildGridOverlay() {
    while (this.gridVisualGroup.children.length > 0) {
      const c = this.gridVisualGroup.children.pop()!;
      this.gridVisualGroup.remove(c);
    }

    const { minX, maxX, minZ, maxZ } = this.getBuildBounds();
    const vertices: number[] = [];
    const x0 = minX * CELL_SIZE;
    const x1 = (maxX + 1) * CELL_SIZE;
    const z0 = minZ * CELL_SIZE;
    const z1 = (maxZ + 1) * CELL_SIZE;

    for (let gx = minX; gx <= maxX + 1; gx++) {
      const wx = gx * CELL_SIZE;
      vertices.push(wx, 0.06, z0, wx, 0.06, z1);
    }
    for (let gz = minZ; gz <= maxZ + 1; gz++) {
      const wz = gz * CELL_SIZE;
      vertices.push(x0, 0.06, wz, x1, 0.06, wz);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    const mat = new THREE.LineBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.28,
    });
    this.gridVisualGroup.add(new THREE.LineSegments(geo, mat));

    const borderVerts = [
      x0, 0.08, z0, x1, 0.08, z0,
      x1, 0.08, z0, x1, 0.08, z1,
      x1, 0.08, z1, x0, 0.08, z1,
      x0, 0.08, z1, x0, 0.08, z0,
    ];
    const bGeo = new THREE.BufferGeometry();
    bGeo.setAttribute('position', new THREE.Float32BufferAttribute(borderVerts, 3));
    const bMat = new THREE.LineBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.72,
    });
    this.gridVisualGroup.add(new THREE.LineSegments(bGeo, bMat));
  }

  private gridToWorld(gx: number, gz: number): [number, number] {
    return [(gx + 0.5) * CELL_SIZE, (gz + 0.5) * CELL_SIZE];
  }

  private worldToGrid(wx: number, wz: number): [number, number] {
    return [Math.floor(wx / CELL_SIZE), Math.floor(wz / CELL_SIZE)];
  }

  private cellKey(gx: number, gz: number): string {
    return `${gx},${gz}`;
  }

  private canAffordCost(cost: ResourceCost): boolean {
    if (cost.gold && this.gold < cost.gold) return false;
    if (cost.wood && this.wood < cost.wood) return false;
    if (cost.stone && this.stone < cost.stone) return false;
    if (cost.scrap && this.scrap < cost.scrap) return false;
    return true;
  }

  private payCost(cost: ResourceCost) {
    if (cost.gold) this.gold -= cost.gold;
    if (cost.wood) this.wood -= cost.wood;
    if (cost.stone) this.stone -= cost.stone;
    if (cost.scrap) this.scrap -= cost.scrap;
  }

  private isWallOrGate(defId: BuildingId): boolean {
    return BUILDING_CATALOG[defId].category === 'walls';
  }

  private getBuildingHalfExtents(defId: BuildingId, rotation: number): [number, number] {
    if (this.isWallOrGate(defId)) {
      const thick =
        defId === 'wooden_wall'
          ? 0.24
          : defId === 'reinforced_wooden_wall'
            ? 0.3
            : defId === 'stone_wall'
              ? 0.4
              : defId === 'metal_wall'
                ? 0.45
                : 0.28;
      return rotation % 2 === 1 ? [thick, 1.0] : [1.0, thick];
    }
    if (defId === 'spike_trap') return [0.75, 0.75];
    return [0.86, 0.86];
  }

  private rotateBuildSelection(dir: 1 | -1 = 1) {
    this.buildRotation = (this.buildRotation + (dir === 1 ? 1 : 3)) % 4;
    soundEngine.playEquip();
    this.updateGhostPreview();
    this.syncHudToStore();
  }

  private refreshWallConnectorsForCell(gx: number, gz: number) {
    const uid = this.cellOccupancy.get(this.cellKey(gx, gz));
    if (!uid) return;
    const b = this.placedBuildings.get(uid);
    if (!b || !this.isWallOrGate(b.defId) || b.defId === 'metal_gate') return;

    const connectorGroup = b.mesh.userData.connectorGroup as THREE.Group | undefined;
    if (!connectorGroup) return;

    while (connectorGroup.children.length > 0) {
      connectorGroup.remove(connectorGroup.children.pop()!);
    }

    const isVert = b.rotation % 2 === 1;
    const dirs: Array<[number, number]> = isVert
      ? [
          [1, 0],
          [-1, 0],
        ]
      : [
          [0, 1],
          [0, -1],
        ];

    for (const [dx, dz] of dirs) {
      const nUid = this.cellOccupancy.get(this.cellKey(gx + dx, gz + dz));
      if (!nUid) continue;
      const nb = this.placedBuildings.get(nUid);
      if (nb && this.isWallOrGate(nb.defId)) {
        connectorGroup.add(createWallConnectorArm(b.defId, this.mats, dx, dz));
      }
    }

    const visualRoot = b.mesh.userData.visualRoot as THREE.Group | undefined;
    const baseMats = visualRoot ? prepareOccludableMaterials(visualRoot) : b.fadeMaterials;
    const connMats = prepareOccludableMaterials(connectorGroup);
    b.fadeMaterials = [...baseMats, ...connMats];
    b.mesh.updateMatrixWorld(true);
    b.occludeBox = new THREE.Box3().setFromObject(b.mesh);
  }

  private refreshWallConnectorsAround(gx: number, gz: number) {
    const offsets: Array<[number, number]> = [
      [0, 0],
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    for (const [dx, dz] of offsets) {
      this.refreshWallConnectorsForCell(gx + dx, gz + dz);
    }
  }

  private isPlacementValid(gx: number, gz: number, defId: BuildingId): boolean {
    const def = BUILDING_CATALOG[defId];
    if (!def || def.isBaseUpgradeAction) return false;
    const bounds = this.getBuildBounds();
    if (gx < bounds.minX || gx > bounds.maxX || gz < bounds.minZ || gz > bounds.maxZ) {
      return false;
    }
    if (this.isEssentialStationCell(gx, gz)) return false;
    if (this.cellOccupancy.has(this.cellKey(gx, gz))) return false;
    if (this.baseLevel < def.requiredBaseLevel) return false;
    if (!this.canAffordCost(def.cost)) return false;
    if (def.powerUse > 0 && this.powerUsed + def.powerUse > this.powerGenerated) return false;

    const [wx, wz] = this.gridToWorld(gx, gz);
    const [hx, hz] = this.getBuildingHalfExtents(defId, this.buildRotation);
    if (
      def.blocksPlayer &&
      Math.abs(this.playerX - wx) < hx + 0.36 &&
      Math.abs(this.playerZ - wz) < hz + 0.36
    ) {
      return false;
    }

    const [pgx, pgz] = this.worldToGrid(this.playerX, this.playerZ);

    if (def.blocksPlayer) {
      const tempBlockedKey = this.cellKey(gx, gz);
      const visited = new Set<string>();
      const queue: [number, number][] = [[pgx, pgz]];
      visited.add(this.cellKey(pgx, pgz));
      let reachedExit = false;

      while (queue.length > 0) {
        const [cx, cz] = queue.shift()!;
        if (cx < bounds.minX || cx > bounds.maxX || cz < bounds.minZ || cz > bounds.maxZ) {
          reachedExit = true;
          break;
        }
        const neighbors: [number, number][] = [
          [cx + 1, cz],
          [cx - 1, cz],
          [cx, cz + 1],
          [cx, cz - 1],
        ];
        for (const [nx, nz] of neighbors) {
          const nk = this.cellKey(nx, nz);
          if (visited.has(nk)) continue;
          if (nk === tempBlockedKey) continue;
          if (this.isEssentialStationCell(nx, nz)) continue;
          const uid = this.cellOccupancy.get(nk);
          if (uid) {
            const b = this.placedBuildings.get(uid);
            if (b && BUILDING_CATALOG[b.defId].blocksPlayer) continue;
          }
          if (nx >= -GRID_HALF && nx <= GRID_HALF && nz >= -GRID_HALF && nz <= GRID_HALF) {
            visited.add(nk);
            queue.push([nx, nz]);
          }
        }
      }
      if (!reachedExit && visited.size < 8) return false;
    }

    return true;
  }

  private recomputeBaseSystems() {
    let pGen = 0;
    let pUse = 0;
    let wShop = 0;
    let stor = 0;
    let med = 0;
    let turrets = 0;
    let walls = 0;

    this.placedBuildings.forEach((b) => {
      const def = BUILDING_CATALOG[b.defId];
      const levelMult = 1 + (b.level - 1) * 0.5;
      pGen += Math.round(def.powerProvide * levelMult);
      pUse += def.powerUse;
      if (b.defId === 'weapon_workshop') wShop = Math.max(wShop, b.level);
      if (b.defId === 'storage') stor += b.level;
      if (b.defId === 'med_station') med += 1;
      if (def.category === 'defenses' || b.defId === 'adv_turret' || b.defId === 'heavy_tower') {
        turrets += 1;
      }
      if (def.category === 'walls') {
        walls += 1;
      }
    });

    this.powerGenerated = pGen;
    this.powerUsed = pUse;
    this.workshopLevel = wShop;
    this.storageCount = stor;
    this.medStationCount = med;
    this.turretCount = turrets;
    this.wallCount = walls;
    this.goldCap = 1000 + stor * 500;
    this.resourceCap = 600 + stor * 300;
    this.gold = Math.min(this.gold, this.goldCap);
    this.wood = Math.min(this.wood, this.resourceCap);
    this.stone = Math.min(this.stone, this.resourceCap);
    this.scrap = Math.min(this.scrap, this.resourceCap);
  }

  private buildComposedBuildingRoot(
    defId: BuildingId,
    level: number,
    isOpen: boolean,
    rotation: number,
  ): {
    mesh: THREE.Group;
    barFill: THREE.Mesh;
    fadeMaterials: THREE.MeshStandardMaterial[];
    occludeBox: THREE.Box3;
  } {
    const mesh = new THREE.Group();
    const visualRoot = createBuildingMesh(defId, this.mats, level, isOpen);
    visualRoot.rotation.y = (rotation % 4) * (Math.PI / 2);
    mesh.add(visualRoot);

    const connectorGroup = new THREE.Group();
    mesh.add(connectorGroup);

    mesh.userData.visualRoot = visualRoot;
    mesh.userData.connectorGroup = connectorGroup;
    mesh.userData.turretHead = visualRoot.userData.turretHead;
    mesh.userData.gateLeaf = visualRoot.userData.gateLeaf;
    mesh.userData.nightPointLight = visualRoot.userData.nightPointLight;

    const fadeMaterials = defId !== 'spike_trap' ? prepareOccludableMaterials(visualRoot) : [];
    mesh.updateMatrixWorld(true);
    const occludeBox = new THREE.Box3().setFromObject(mesh);

    const barBg = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 0.16),
      new THREE.MeshBasicMaterial({ color: 0x18181b, side: THREE.DoubleSide }),
    );
    barBg.position.set(0, 2.35, 0);
    barBg.userData.noFade = true;
    mesh.add(barBg);

    const barFill = new THREE.Mesh(
      new THREE.PlaneGeometry(1.32, 0.1),
      new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide }),
    );
    barFill.position.set(0, 0, 0.02);
    barFill.userData.noFade = true;
    barBg.add(barFill);

    mesh.userData.hpBarBg = barBg;
    return { mesh, barFill, fadeMaterials, occludeBox };
  }

  private placeStructureInternal(
    defId: BuildingId,
    gx: number,
    gz: number,
    level = 1,
    hpOverride?: number,
    isOpen = false,
    existingUid?: string,
    rotation = 0,
    skipConnectorRefresh = false,
  ): PlacedRuntime {
    const def = BUILDING_CATALOG[defId];
    const maxHp = Math.round(def.maxHp * (1 + (level - 1) * 0.45));
    const hp = hpOverride !== undefined ? Math.min(hpOverride, maxHp) : maxHp;
    const uid = existingUid || `b_${this.uidSeq++}`;
    const normRot = ((rotation % 4) + 4) % 4;
    const { mesh, barFill, fadeMaterials, occludeBox } = this.buildComposedBuildingRoot(
      defId,
      level,
      isOpen,
      normRot,
    );
    const [wx, wz] = this.gridToWorld(gx, gz);
    mesh.position.set(wx, 0, wz);
    this.scene.add(mesh);

    const item: PlacedRuntime = {
      uid,
      defId,
      gx,
      gz,
      level,
      hp,
      maxHp,
      isOpen,
      rotation: normRot,
      cooldownTimer: 0,
      turretAngle: 0,
      mesh,
      hpBarFill: barFill,
      fadeMaterials,
      fadeAlpha: 1,
      occludeBox,
      targetZombieId: undefined,
      targetLockTimer: 0,
      burstShots: 0,
      reloadTimer: 0,
    };
    this.placedBuildings.set(uid, item);
    this.cellOccupancy.set(this.cellKey(gx, gz), uid);
    this.updateBuildingHpVisual(item);
    if (!skipConnectorRefresh && this.isWallOrGate(defId)) {
      this.refreshWallConnectorsAround(gx, gz);
    }
    return item;
  }

  private updateBuildingHpVisual(b: PlacedRuntime) {
    const barBg = b.mesh.userData.hpBarBg as THREE.Mesh | undefined;
    if (!barBg || !b.hpBarFill) return;
    const ratio = Math.max(0, Math.min(1, b.hp / b.maxHp));
    barBg.visible = ratio < 0.99;
    b.hpBarFill.scale.x = Math.max(0.01, ratio);
    b.hpBarFill.position.x = -(1 - ratio) * 0.66;
    const mat = b.hpBarFill.material as THREE.MeshBasicMaterial;
    mat.color.setHex(ratio > 0.5 ? 0x22c55e : ratio > 0.25 ? 0xf59e0b : 0xef4444);
  }

  private removeBuilding(uid: string) {
    const b = this.placedBuildings.get(uid);
    if (!b) return;
    const { gx, gz, defId } = b;
    this.scene.remove(b.mesh);
    this.cellOccupancy.delete(this.cellKey(gx, gz));
    this.placedBuildings.delete(uid);
    if (this.selectedPlacedUid === uid) {
      this.selectedPlacedUid = null;
    }
    if (this.isWallOrGate(defId)) {
      this.refreshWallConnectorsAround(gx, gz);
    }
    this.recomputeBaseSystems();
  }

  private rebuildBuildingMeshVisual(b: PlacedRuntime) {
    this.scene.remove(b.mesh);
    const { mesh, barFill, fadeMaterials, occludeBox } = this.buildComposedBuildingRoot(
      b.defId,
      b.level,
      Boolean(b.isOpen),
      b.rotation,
    );
    const [wx, wz] = this.gridToWorld(b.gx, b.gz);
    mesh.position.set(wx, 0, wz);
    this.scene.add(mesh);
    b.mesh = mesh;
    b.hpBarFill = barFill;
    b.fadeMaterials = fadeMaterials;
    b.fadeAlpha = 1;
    b.occludeBox = occludeBox;
    this.updateBuildingHpVisual(b);
    if (this.isWallOrGate(b.defId)) {
      this.refreshWallConnectorsAround(b.gx, b.gz);
    }
  }

  private bindEvents() {
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    const dom = this.renderer.domElement;
    dom.addEventListener('pointermove', this.onPointerMove);
    dom.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointerup', this.onPointerUp);
    dom.addEventListener('contextmenu', this.onContextMenu);
    dom.addEventListener('wheel', this.onWheel, { passive: true });
    dom.addEventListener('webglcontextlost', this.onContextLost);
  }

  private unbindEvents() {
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    const dom = this.renderer.domElement;
    dom.removeEventListener('pointermove', this.onPointerMove);
    dom.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointerup', this.onPointerUp);
    dom.removeEventListener('contextmenu', this.onContextMenu);
    dom.removeEventListener('wheel', this.onWheel);
    dom.removeEventListener('webglcontextlost', this.onContextLost);
  }

  private onContextLost = (e: Event) => {
    e.preventDefault();
  };

  private onResize = () => {
    if (this.disposed) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private isModalOpen(): boolean {
    const st = useGameStore.getState();
    return st.shopOpen || st.baseUpgradeOpen || st.audioMixerOpen;
  }

  private onWheel = (e: WheelEvent) => {
    if (this.screen !== 'playing' || this.isModalOpen() || this.buildMode) {
      this.cameraZoom = THREE.MathUtils.clamp(this.cameraZoom + e.deltaY * 0.012, 16, 36);
      return;
    }
    if (e.shiftKey || e.ctrlKey) {
      this.cameraZoom = THREE.MathUtils.clamp(this.cameraZoom + e.deltaY * 0.012, 16, 36);
      return;
    }
    if (Math.abs(e.deltaY) > 2) {
      this.cycleInventorySlot(e.deltaY > 0 ? 1 : -1);
    }
  };

  private onContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    if (this.buildMode) {
      if (this.selectedBuildId) {
        this.selectedBuildId = null;
      } else {
        this.toggleBuildMode(false);
      }
      this.syncHudToStore();
    }
  };

  private onKeyDown = (e: KeyboardEvent) => {
    this.keys[e.code] = true;

    if (e.code === 'Escape') {
      const st = useGameStore.getState();
      if (st.shopOpen) {
        st.setShopOpen(false);
        return;
      }
      if (st.baseUpgradeOpen) {
        st.setBaseUpgradeOpen(false);
        return;
      }
      if (st.audioMixerOpen) {
        st.setAudioMixerOpen(false);
        return;
      }
      if (this.buildMode) {
        this.toggleBuildMode(false);
        this.syncHudToStore();
        return;
      }
      if (this.screen === 'playing') {
        this.setPaused(true);
      } else if (this.screen === 'paused') {
        this.setPaused(false);
      }
      return;
    }

    if (this.screen !== 'playing') return;

    if (e.code === 'KeyB') {
      this.toggleBuildMode();
    } else if (e.code === 'KeyU') {
      const st = useGameStore.getState();
      st.setBaseUpgradeOpen(!st.baseUpgradeOpen);
    } else if (e.code === 'Tab' || e.code === 'KeyI') {
      e.preventDefault();
      const store = useGameStore.getState();
      store.setShopOpen(!store.shopOpen);
    } else if (e.code === 'KeyR') {
      if (this.buildMode && this.selectedBuildId && !this.isModalOpen()) {
        if (!e.repeat) this.rotateBuildSelection(1);
      } else {
        this.startReload();
      }
    } else if (e.code === 'KeyQ') {
      if (this.buildMode && this.selectedBuildId && !this.isModalOpen()) {
        if (!e.repeat) this.rotateBuildSelection(-1);
      }
    } else if (e.code === 'KeyE') {
      if (this.buildMode && this.selectedBuildId && !this.isModalOpen()) {
        if (!e.repeat) this.rotateBuildSelection(1);
      } else {
        this.handleInteract();
      }
    } else if (e.code === 'Equal' || e.code === 'NumpadAdd') {
      this.cameraZoom = THREE.MathUtils.clamp(this.cameraZoom - 2.2, 16, 36);
    } else if (e.code === 'Minus' || e.code === 'NumpadSubtract') {
      this.cameraZoom = THREE.MathUtils.clamp(this.cameraZoom + 2.2, 16, 36);
    } else if (e.code === 'Space') {
      e.preventDefault();
      this.triggerDodge();
    } else if (e.code.startsWith('Digit') || e.code.startsWith('Numpad')) {
      const raw = e.code.replace('Digit', '').replace('Numpad', '');
      const num = Number(raw);
      if (num >= 1 && num <= 6) {
        this.selectInventorySlot(num - 1);
      }
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
  };

  private onPointerMove = (e: PointerEvent) => {
    this.pointerClientX = e.clientX;
    this.pointerClientY = e.clientY;
    this.updatePointerWorldHit();
  };

  private onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    if (this.screen !== 'playing') return;
    if (this.isModalOpen()) return;

    this.pointerClientX = e.clientX;
    this.pointerClientY = e.clientY;
    this.updatePointerWorldHit();

    if (this.buildMode) {
      if (this.selectedBuildId) {
        this.tryPlaceAtHover();
      } else {
        const uid = this.cellOccupancy.get(this.cellKey(this.hoverGx, this.hoverGz));
        this.selectedPlacedUid = uid || null;
        this.syncHudToStore();
      }
      return;
    }

    this.mouseDown = true;
    this.tryPlayerAction();
  };

  private onPointerUp = (e: PointerEvent) => {
    if (e.button === 0) {
      this.mouseDown = false;
    }
  };

  private updatePointerWorldHit() {
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    _mouseNdc.x = ((this.pointerClientX - rect.left) / rect.width) * 2 - 1;
    _mouseNdc.y = -((this.pointerClientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(_mouseNdc, this.camera);
    if (this.raycaster.ray.intersectPlane(_groundPlane, _rayHit)) {
      this.aimReticle.position.x = _rayHit.x;
      this.aimReticle.position.z = _rayHit.z;

      const dx = _rayHit.x - this.playerX;
      const dz = _rayHit.z - this.playerZ;
      if (dx * dx + dz * dz > 0.01) {
        this.aimAngle = Math.atan2(dz, dx);
        this.playerFacingLeft = dx < 0;
      }

      const [gx, gz] = this.worldToGrid(_rayHit.x, _rayHit.z);
      this.hoverGx = gx;
      this.hoverGz = gz;
    }
  }

  private getBuildingMaterialKind(defId: BuildingId): 'wood' | 'stone' | 'metal' {
    if (defId === 'wooden_wall' || defId === 'reinforced_wooden_wall' || defId === 'watchtower') {
      return 'wood';
    }
    if (defId === 'stone_wall' || defId === 'storage') {
      return 'stone';
    }
    return 'metal';
  }

  private tryPlaceAtHover() {
    if (!this.selectedBuildId) return;
    const def = BUILDING_CATALOG[this.selectedBuildId];
    if (def.isBaseUpgradeAction) {
      useGameStore.getState().setBaseUpgradeOpen(true);
      return;
    }
    if (!this.isPlacementValid(this.hoverGx, this.hoverGz, this.selectedBuildId)) {
      useGameStore.getState().pushNotice('Kaynak yetersiz veya geçersiz konum!', 'danger');
      return;
    }
    this.payCost(def.cost);
    this.placeStructureInternal(
      this.selectedBuildId,
      this.hoverGx,
      this.hoverGz,
      1,
      undefined,
      false,
      undefined,
      this.buildRotation,
    );
    this.recomputeBaseSystems();
    this.tutorialFlags.add('built_structure');
    const [wx, wz] = this.gridToWorld(this.hoverGx, this.hoverGz);
    soundEngine.playPlaceStructure(this.getBuildingMaterialKind(this.selectedBuildId), wx, wz);
    this.spawnFxRing(wx, wz, 0xfbbf24, 1.7, 0.35);
    this.saveGame();
    this.syncHudToStore();
  }

  private triggerDodge() {
    if (this.dodgeTimer > 0 || this.dodgeCooldown > 0 || this.stamina < 25) return;
    this.stamina -= 25;
    this.dodgeTimer = 0.24;
    this.dodgeCooldown = 0.65;
    let dx = 0;
    let dz = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) dz -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) dz += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) dx -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) dx += 1;
    if (dx === 0 && dz === 0) {
      dx = Math.cos(this.aimAngle);
      dz = Math.sin(this.aimAngle);
    } else {
      const len = Math.hypot(dx, dz);
      dx /= len;
      dz /= len;
    }
    this.dodgeDirX = dx;
    this.dodgeDirZ = dz;
    soundEngine.playSwing(false);
    this.spawnFxRing(this.playerX, this.playerZ, 0x94a3b8, 1.3, 0.25);
  }

  private getNearestResourceNode(): ResourceNodeEntity | null {
    let best: ResourceNodeEntity | null = null;
    let bestDist = 3.2;
    for (const node of this.resourceNodes) {
      if (node.depleted) continue;
      const d = Math.hypot(node.x - this.playerX, node.z - this.playerZ);
      if (d <= node.radius + 1.85 && d < bestDist) {
        bestDist = d;
        best = node;
      }
    }
    return best;
  }

  private getUsableToolForNode(node: ResourceNodeEntity): ToolId | null {
    if (this.equippedSlot.kind === 'tool') {
      const eq = this.equippedSlot.id;
      if (eq === node.requiredTool || eq === node.altTool) return eq;
    }
    if (this.ownedTools.includes(node.requiredTool)) return node.requiredTool;
    if (node.altTool && this.ownedTools.includes(node.altTool)) return node.altTool;
    return null;
  }

  private handleInteract() {
    // 1. Nearby Metal Gate toggle
    let nearestGate: PlacedRuntime | null = null;
    let gateDist = 3.2;
    let nearMed = false;

    this.placedBuildings.forEach((b) => {
      const [wx, wz] = this.gridToWorld(b.gx, b.gz);
      const d = Math.hypot(wx - this.playerX, wz - this.playerZ);
      if (b.defId === 'metal_gate' && d < gateDist) {
        gateDist = d;
        nearestGate = b;
      }
      if (b.defId === 'med_station' && d < 4.5) {
        nearMed = true;
      }
    });

    if (nearestGate) {
      const gate = nearestGate as PlacedRuntime;
      gate.isOpen = !gate.isOpen;
      const leaf = gate.mesh.userData.gateLeaf as THREE.Group | undefined;
      if (leaf) {
        leaf.rotation.y = gate.isOpen ? Math.PI * 0.45 : 0;
      }
      const [gxW, gzW] = this.gridToWorld(gate.gx, gate.gz);
      soundEngine.playGateMove(gxW, gzW);
      useGameStore
        .getState()
        .pushNotice(gate.isOpen ? 'Metal Kapı açıldı' : 'Metal Kapı kapatıldı', 'info');
      this.saveGame();
      return;
    }

    if (nearMed && this.playerHp < this.playerMaxHp) {
      if (this.gold >= 15) {
        this.gold -= 15;
        this.playerHp = this.playerMaxHp;
        soundEngine.playCoin();
        useGameStore.getState().pushNotice('Tıbbi İstasyon: Tam Şifa! (-15 Altın)', 'info');
        this.syncHudToStore();
        return;
      }
    }

    // 2. Gather from nearby Resource Node with E
    const nearNode = this.getNearestResourceNode();
    if (nearNode) {
      const toolId = this.getUsableToolForNode(nearNode);
      if (toolId) {
        if (this.equippedSlot.kind !== 'tool' || this.equippedSlot.id !== toolId) {
          this.equipTool(toolId);
        }
        this.stepGatherNode(nearNode, toolId, 0.45);
        return;
      } else {
        useGameStore
          .getState()
          .pushNotice(`${TOOL_CATALOG[nearNode.requiredTool].name} satın almalısın (Cephanelik)!`, 'danger');
        return;
      }
    }

    // 3. Near main gas station -> repair base if damaged
    const distToStation = Math.hypot(this.playerX, this.playerZ - 1);
    if (distToStation < 7.5 && this.baseHp < this.baseMaxHp) {
      this.repairGasStation();
    }
  }

  private isItemOwned(item: EquippedSlot): boolean {
    if (item.kind === 'weapon') return this.ownedWeapons.includes(item.id);
    return this.ownedTools.includes(item.id);
  }

  private getSlotItemLabel(item: EquippedSlot): string {
    return item.kind === 'weapon' ? WEAPON_CATALOG[item.id].name : TOOL_CATALOG[item.id].name;
  }

  private findSlotIndex(item: EquippedSlot): number {
    return this.inventorySlots.findIndex(
      (s) => s !== null && s.kind === item.kind && s.id === item.id,
    );
  }

  private ensureItemInSlotAndEquip(item: EquippedSlot) {
    if (!this.isItemOwned(item)) return;
    let idx = this.findSlotIndex(item);
    if (idx === -1) {
      const emptyIdx = this.inventorySlots.findIndex((s) => s === null);
      idx = emptyIdx !== -1 ? emptyIdx : this.activeSlotIndex;
      this.inventorySlots[idx] = { ...item };
    }
    this.selectInventorySlot(idx);
  }

  private assignToInventorySlot(item: EquippedSlot, slotIndex: number) {
    if (slotIndex < 0 || slotIndex >= 6) return;
    if (!this.isItemOwned(item)) return;
    const prevIndex = this.findSlotIndex(item);
    const displaced = this.inventorySlots[slotIndex];

    if (prevIndex !== -1 && prevIndex !== slotIndex) {
      this.inventorySlots[prevIndex] = displaced ? { ...displaced } : null;
    }
    this.inventorySlots[slotIndex] = { ...item };
    this.selectInventorySlot(slotIndex);
    this.saveGame();
  }

  private selectInventorySlot(index: number) {
    if (index < 0 || index >= 6) return;
    const item = this.inventorySlots[index];
    if (!item || !this.isItemOwned(item)) return;

    this.activeSlotIndex = index;
    this.equippedSlot = { ...item };
    if (item.kind === 'weapon') {
      this.lastWeaponId = item.id;
    }
    this.isReloading = false;
    this.reloadTimer = 0;
    this.lastSwitchLabel = this.getSlotItemLabel(item);
    this.lastSwitchAt = Date.now();
    soundEngine.playEquip();
    this.syncHudToStore();
  }

  private cycleInventorySlot(dir: 1 | -1) {
    const occupied: number[] = [];
    for (let i = 0; i < 6; i++) {
      const s = this.inventorySlots[i];
      if (s && this.isItemOwned(s)) occupied.push(i);
    }
    if (occupied.length <= 1) return;
    const curPos = occupied.indexOf(this.activeSlotIndex);
    const nextPos =
      curPos === -1
        ? 0
        : (curPos + dir + occupied.length) % occupied.length;
    this.selectInventorySlot(occupied[nextPos]);
  }

  private equipWeapon(id: WeaponId) {
    if (!this.ownedWeapons.includes(id)) return;
    this.ensureItemInSlotAndEquip({ kind: 'weapon', id });
  }

  private equipTool(id: ToolId) {
    if (!this.ownedTools.includes(id)) return;
    this.ensureItemInSlotAndEquip({ kind: 'tool', id });
  }

  private startReload() {
    if (this.equippedSlot.kind !== 'weapon') return;
    const def = WEAPON_CATALOG[this.equippedSlot.id];
    if (def.kind !== 'firearm' || this.isReloading) return;
    if (this.ammoMap[this.equippedSlot.id] >= def.magSize) return;
    this.isReloading = true;
    this.reloadTimer = def.reloadTime;
    soundEngine.playReload(this.equippedSlot.id);
    this.syncHudToStore();
  }

  private tryPlayerAction() {
    if (this.playerHp <= 0) return;

    // If holding a tool, attempt gathering on nearby matching node
    if (this.equippedSlot.kind === 'tool') {
      const nearNode = this.getNearestResourceNode();
      if (nearNode) {
        const toolId = this.equippedSlot.id;
        if (toolId === nearNode.requiredTool || toolId === nearNode.altTool) {
          return; // Continuous gathering handled cleanly in updateGathering
        }
      }
      // Fallback light melee poke if no resource node
      if (this.weaponCooldownTimer <= 0) {
        this.weaponCooldownTimer = 0.45;
        this.playerAttackAnimTimer = 0.22;
        soundEngine.playSwing(false);
        this.performMeleeSwing(14, 2.4, 7.0, 'tool');
      }
      return;
    }

    // Otherwise weapon attack
    this.tryPlayerWeaponAttack(this.equippedSlot.id);
  }

  private performMeleeSwing(
    damage: number,
    range: number,
    knockbackForce: number,
    weaponId: WeaponId | 'tool',
  ) {
    this.attackSwingSeq += 1;
    const swingId = this.attackSwingSeq;
    let hitAny = false;
    let hitX = this.playerX;
    let hitZ = this.playerZ;
    const fxX = this.playerX + Math.cos(this.aimAngle) * (range * 0.55);
    const fxZ = this.playerZ + Math.sin(this.aimAngle) * (range * 0.55);
    this.spawnFxRing(fxX, fxZ, 0xfbbf24, range * 0.6, 0.22);

    for (const z of this.zombies) {
      if (z.dead || z.lastHitSwingId === swingId) continue;
      const dx = z.x - this.playerX;
      const dz = z.z - this.playerZ;
      const dist = Math.hypot(dx, dz);
      if (dist <= range + 0.6) {
        const angleToZ = Math.atan2(dz, dx);
        let diff = angleToZ - this.aimAngle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        if (Math.abs(diff) <= 1.3 || dist < 1.25) {
          z.lastHitSwingId = swingId;
          const nx = dist > 0.01 ? dx / dist : Math.cos(this.aimAngle);
          const nz = dist > 0.01 ? dz / dist : Math.sin(this.aimAngle);
          this.damageZombie(z, damage, nx, nz, knockbackForce);
          hitAny = true;
          hitX = z.x;
          hitZ = z.z;
        }
      }
    }
    if (hitAny) {
      soundEngine.playMeleeHit(weaponId, 'flesh', hitX, hitZ);
    }
  }

  private tryPlayerWeaponAttack(weaponId: WeaponId) {
    if (this.weaponCooldownTimer > 0 || this.isReloading || this.playerHp <= 0) return;
    const def = WEAPON_CATALOG[weaponId];
    const wLevel = this.weaponLevels[weaponId] || 1;
    const charBonus = 1 + (this.playerLevel - 1) * 0.08;
    const dmgMult = (1 + (wLevel - 1) * 0.25) * charBonus;
    const damage = Math.round(def.damage * dmgMult);

    if (def.kind === 'firearm') {
      if (this.ammoMap[weaponId] <= 0) {
        soundEngine.playDryFire();
        this.startReload();
        return;
      }
      this.ammoMap[weaponId] -= 1;
      if (this.ammoMap[weaponId] === 0) {
        this.startReload();
      }
    }

    this.weaponCooldownTimer = def.attackCooldown * Math.max(0.68, 1 - (wLevel - 1) * 0.06);
    this.playerAttackAnimTimer = 0.22;
    this.playerAnimTimer = 0;

    if (def.kind === 'melee') {
      soundEngine.playSwing(def.id === 'metal_pipe', def.id);
      this.performMeleeSwing(damage, def.range, def.knockback, def.id);
    } else {
      const sndKind =
        def.id === 'pistol'
          ? 'pistol'
          : def.id === 'shotgun'
            ? 'shotgun'
            : def.id === 'heavy_mg'
              ? 'heavy'
              : 'rifle';
      soundEngine.playGunshot(sndKind, this.playerX, this.playerZ);
      this.playerFlashLight.intensity = 3.2;

      for (let i = 0; i < def.pellets; i++) {
        const angle = this.aimAngle + (Math.random() - 0.5) * def.spread;
        this.spawnProjectile(
          this.playerX + Math.cos(angle) * 0.7,
          1.0,
          this.playerZ + Math.sin(angle) * 0.7,
          Math.cos(angle) * def.projectileSpeed,
          Math.sin(angle) * def.projectileSpeed,
          damage,
          def.knockback,
          def.range / def.projectileSpeed,
          def.id === 'heavy_mg' ? 1.2 : 0,
          false,
          def.id === 'heavy_mg' ? 1.25 : 1.0,
        );
      }
    }
  }

  private spawnParticles(x: number, y: number, z: number, colorHex: number, count = 6) {
    let spawned = 0;
    for (const p of this.particles) {
      if (p.active) continue;
      p.active = true;
      p.x = x;
      p.y = y;
      p.z = z;
      const ang = Math.random() * Math.PI * 2;
      const spd = 1.8 + Math.random() * 3.5;
      p.vx = Math.cos(ang) * spd;
      p.vy = 2.5 + Math.random() * 3.5;
      p.vz = Math.sin(ang) * spd;
      p.life = 0.45 + Math.random() * 0.25;
      (p.mesh.material as THREE.MeshStandardMaterial).color.setHex(colorHex);
      p.mesh.position.set(x, y, z);
      p.mesh.visible = true;
      spawned += 1;
      if (spawned >= count) break;
    }
  }

  private spawnProjectile(
    x: number,
    y: number,
    z: number,
    vx: number,
    vz: number,
    damage: number,
    knockback: number,
    life: number,
    splashRadius: number,
    fromTurret: boolean,
    armorPierce = 1.0,
  ) {
    const p = this.projectiles.find((item) => !item.active);
    if (!p) return;
    p.active = true;
    p.x = x;
    p.y = y;
    p.z = z;
    p.vx = vx;
    p.vz = vz;
    p.damage = damage;
    p.knockback = knockback;
    p.life = life;
    p.splashRadius = splashRadius;
    p.fromTurret = fromTurret;
    p.armorPierce = armorPierce;
    p.mesh.position.set(x, y, z);
    p.mesh.visible = true;
  }

  private spawnFxRing(x: number, z: number, colorHex: number, maxScale: number, duration: number) {
    const ring = this.fxRings.find((r) => !r.active);
    if (!ring) return;
    ring.active = true;
    ring.age = 0;
    ring.duration = duration;
    ring.maxScale = maxScale;
    ring.mesh.position.set(x, 0.08, z);
    ring.mesh.scale.set(0.2, 1, 0.2);
    const mat = ring.mesh.material as THREE.MeshBasicMaterial;
    mat.color.setHex(colorHex);
    mat.opacity = 0.8;
    ring.mesh.visible = true;
  }

  private spawnCoin(x: number, z: number, value: number) {
    const c = this.coins.find((item) => !item.active);
    if (!c) {
      this.addGold(value);
      return;
    }
    c.active = true;
    c.x = x + (Math.random() - 0.5) * 0.6;
    c.z = z + (Math.random() - 0.5) * 0.6;
    c.y = 0.6;
    c.vy = 4.2 + Math.random() * 1.5;
    c.value = value;
    c.life = 45;
    c.mesh.position.set(c.x, c.y, c.z);
    c.mesh.visible = true;
  }

  private addGold(amount: number) {
    const gained = Math.min(amount, Math.max(0, this.goldCap - this.gold));
    this.gold += gained;
    if (gained > 0) {
      useGameStore.getState().pushNotice(`+${amount} Altın`, 'gold');
    }
  }

  private addResource(wood: number, stone: number, scrap: number) {
    if (wood > 0) {
      this.wood = Math.min(this.resourceCap, this.wood + wood);
      useGameStore.getState().pushNotice(`+${wood} Odun`, 'wood');
    }
    if (stone > 0) {
      this.stone = Math.min(this.resourceCap, this.stone + stone);
      useGameStore.getState().pushNotice(`+${stone} Taş`, 'stone');
    }
    if (scrap > 0) {
      this.scrap = Math.min(this.resourceCap, this.scrap + scrap);
      useGameStore.getState().pushNotice(`+${scrap} Hurda`, 'scrap');
    }
  }

  private addXp(amount: number) {
    this.playerXp += amount;
    while (this.playerXp >= this.playerNextXp) {
      this.playerXp -= this.playerNextXp;
      this.playerLevel += 1;
      this.playerNextXp = Math.round(100 * Math.pow(1.35, this.playerLevel - 1));
      this.playerMaxHp += 15;
      this.playerHp = Math.min(this.playerMaxHp, this.playerHp + 30);
      soundEngine.playWaveStart();
      useGameStore
        .getState()
        .pushNotice(`Seviye Atladın! Karakter Sv.${this.playerLevel} (+15 Maks Can)`, 'wave');
    }
  }

  private spawnZombie(type: ZombieType) {
    const stats = ZOMBIE_STATS[type];
    // Controlled wave progression curve: gentle early (1-5), steady mid (6-10), dangerous late (11+)
    let hpWaveScale = 1.0;
    if (this.wave <= 5) {
      hpWaveScale = 1 + (this.wave - 1) * 0.05;
    } else if (this.wave <= 10) {
      hpWaveScale = 1.2 + (this.wave - 5) * 0.07;
    } else {
      hpWaveScale = 1.55 + (this.wave - 10) * 0.08;
    }
    const nightHpMult = this.nightFactor > 0.5 ? 1.08 : 1.0;
    const maxHp = Math.round(stats.hp * hpWaveScale * nightHpMult);
    const dmgScale = 1 + Math.min(0.65, (this.wave - 1) * 0.035);

    const side = Math.floor(Math.random() * 4);
    let sx = 0;
    let sz = 0;
    const dist = 36 + Math.random() * 14;
    if (side === 0) {
      sx = (Math.random() - 0.5) * 68;
      sz = -dist;
    } else if (side === 1) {
      sx = (Math.random() - 0.5) * 68;
      sz = dist;
    } else if (side === 2) {
      sx = -dist;
      sz = (Math.random() - 0.5) * 60;
    } else {
      sx = dist;
      sz = (Math.random() - 0.5) * 60;
    }

    const group = new THREE.Group();
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.55 * stats.scale, 14),
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
      }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.03;
    group.add(shadow);

    const spriteMat = new THREE.MeshBasicMaterial({
      map: getZombieSpriteTexture(type, 'walk', 0),
      transparent: true,
      alphaTest: 0.35,
      side: THREE.DoubleSide,
    });
    const spriteSize = 2.1 * stats.scale;
    const spriteMesh = new THREE.Mesh(new THREE.PlaneGeometry(spriteSize, spriteSize), spriteMat);
    spriteMesh.position.y = spriteSize * 0.5;
    group.add(spriteMesh);

    const silMat = new THREE.MeshBasicMaterial({
      map: spriteMat.map,
      color: type === 'boss' ? 0xf59e0b : 0xef4444,
      transparent: true,
      opacity: 0.45,
      alphaTest: 0.35,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const silhouetteMesh = new THREE.Mesh(new THREE.PlaneGeometry(spriteSize, spriteSize), silMat);
    silhouetteMesh.position.y = spriteSize * 0.5;
    silhouetteMesh.renderOrder = 80;
    silhouetteMesh.visible = false;
    group.add(silhouetteMesh);

    const barW = 1.2 * stats.scale;
    const hpBarBg = new THREE.Mesh(
      new THREE.PlaneGeometry(barW, 0.15),
      new THREE.MeshBasicMaterial({ color: 0x111827, side: THREE.DoubleSide }),
    );
    hpBarBg.position.set(0, spriteSize + 0.2, 0);
    hpBarBg.visible = type === 'boss';
    hpBarBg.renderOrder = 85;
    group.add(hpBarBg);

    const hpBarFill = new THREE.Mesh(
      new THREE.PlaneGeometry(barW * 0.94, 0.09),
      new THREE.MeshBasicMaterial({
        color: type === 'boss' ? 0xf59e0b : 0xef4444,
        side: THREE.DoubleSide,
      }),
    );
    hpBarFill.position.set(0, 0, 0.02);
    hpBarFill.renderOrder = 86;
    hpBarBg.add(hpBarFill);

    group.position.set(sx, 0, sz);
    this.scene.add(group);

    this.zombies.push({
      id: this.zombieIdSeq++,
      type,
      group,
      spriteMesh,
      silhouetteMesh,
      hpBarBg,
      hpBarFill,
      x: sx,
      z: sz,
      vx: 0,
      vz: 0,
      knockbackVx: 0,
      knockbackVz: 0,
      staggerTimer: 0,
      lastHitSwingId: 0,
      hp: maxHp,
      maxHp,
      speed: stats.speed * (this.nightFactor > 0.5 ? 1.06 : 1.0),
      damage: Math.round(stats.damage * dmgScale),
      attackCooldown: stats.attackCooldown,
      attackTimer: 0,
      attackRange: stats.attackRange,
      goldReward: stats.goldReward,
      animState: 'walk',
      animTimer: Math.random() * 2,
      hurtTimer: 0,
      dead: false,
      deathTimer: 0,
      facingLeft: sx > 0,
      bossSlamTimer: 4.5,
      hasDetectedPlayer: false,
      idleSoundTimer: 2 + Math.random() * 5,
    });
  }

  private damageZombie(
    z: ZombieEntity,
    dmg: number,
    dirX: number,
    dirZ: number,
    knockbackForce: number,
  ) {
    if (z.dead) return;
    z.hp -= dmg;
    z.hurtTimer = 0.2;

    // Smooth physical knockback velocity impulse (NO teleportation)
    const resist = ZOMBIE_STATS[z.type].knockbackResist;
    const dmgScale = THREE.MathUtils.clamp(0.75 + dmg / 65, 0.75, 1.5);
    const impulse = (knockbackForce * dmgScale) / resist;
    z.knockbackVx += dirX * impulse;
    z.knockbackVz += dirZ * impulse;
    z.staggerTimer = Math.max(
      z.staggerTimer,
      z.type === 'boss' ? 0.08 : z.type === 'heavy' ? 0.16 : 0.28,
    );

    this.spawnParticles(z.x, 1.0, z.z, 0xb91c1c, 4);

    const ratio = Math.max(0, z.hp / z.maxHp);
    z.hpBarBg.visible = true;
    z.hpBarFill.scale.x = Math.max(0.01, ratio);
    const fullW = 1.2 * ZOMBIE_STATS[z.type].scale * 0.94;
    z.hpBarFill.position.x = -(1 - ratio) * (fullW * 0.5);

    if (z.hp <= 0) {
      z.dead = true;
      z.deathTimer = 0.55;
      z.animState = 'death';
      z.animTimer = 0;
      z.hpBarBg.visible = false;
      this.totalKills += 1;
      this.tutorialFlags.add('killed_zombie');
      soundEngine.playZombieSound('death', z.type, z.x, z.z);
      this.addXp(z.type === 'boss' ? 140 : z.type === 'heavy' ? 35 : z.type === 'runner' ? 22 : 14);
      this.spawnCoin(z.x, z.z, z.goldReward);
      if (z.type === 'boss') {
        useGameStore.getState().pushNotice('BOSS ZOMBİ YOK EDİLDİ! +220 Altın', 'wave');
      }
    } else {
      soundEngine.playZombieSound('hurt', z.type, z.x, z.z);
    }
  }

  private beginNextWaveCombat() {
    if (this.waveState === 'combat') return;
    const cfg = getWaveConfig(this.wave);
    this.waveState = 'combat';
    this.targetNightFactor = cfg.isNight ? 1 : 0;

    const list: ZombieType[] = [];
    for (let i = 0; i < cfg.normal; i++) list.push('normal');
    for (let i = 0; i < cfg.runner; i++) list.push('runner');
    for (let i = 0; i < cfg.heavy; i++) list.push('heavy');
    for (let i = 0; i < cfg.boss; i++) list.push('boss');
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    this.spawnQueue = list;
    this.spawnTimer = 0.4;

    soundEngine.playWaveStart();
    useGameStore
      .getState()
      .pushNotice(`Dalga ${cfg.wave} Başladı: ${cfg.title}`, cfg.boss > 0 ? 'danger' : 'wave');
    this.syncHudToStore();
  }

  private completeCurrentWave() {
    const waveBonus = 25 + this.wave * 10 + this.storageCount * 25;
    this.addGold(waveBonus);
    useGameStore
      .getState()
      .pushNotice(`Dalga ${this.wave} Temizlendi! +${waveBonus} Altın Ödül`, 'wave');

    this.wave += 1;
    this.waveState = 'prep';
    this.prepCountdown = getWavePrepDuration(this.wave);
    const nextCfg = getWaveConfig(this.wave);
    this.targetNightFactor = nextCfg.isNight ? 0.35 : 0;
    useGameStore
      .getState()
      .pushNotice(
        `Hazırlık Süresi (${this.prepCountdown}s) — Sıradaki: ${nextCfg.title}`,
        nextCfg.boss > 0 ? 'danger' : 'info',
      );
    this.saveGame();
    this.syncHudToStore();
  }

  private clearWorldEntities() {
    for (const z of this.zombies) {
      this.scene.remove(z.group);
    }
    this.zombies = [];
    for (const p of this.projectiles) {
      p.active = false;
      p.mesh.visible = false;
    }
    for (const c of this.coins) {
      c.active = false;
      c.mesh.visible = false;
    }
    for (const r of this.fxRings) {
      r.active = false;
      r.mesh.visible = false;
    }
    for (const pt of this.particles) {
      pt.active = false;
      pt.mesh.visible = false;
    }
    this.placedBuildings.forEach((b) => {
      this.scene.remove(b.mesh);
    });
    this.placedBuildings.clear();
    this.cellOccupancy.clear();

    for (const rn of this.resourceNodes) {
      rn.depleted = false;
      rn.hp = rn.maxHp;
      rn.regrowTimer = 0;
      rn.mesh.visible = true;
      rn.mesh.scale.set(1, 1, 1);
    }
  }

  private resetToFreshGame() {
    this.clearWorldEntities();
    this.worldSeed = Math.floor(Math.random() * 2147483646) + 1;
    this.initResourceNodes(this.worldSeed);

    this.playerX = 0;
    this.playerZ = 7.5;
    this.playerLevel = 1;
    this.playerXp = 0;
    this.playerNextXp = 100;
    this.playerMaxHp = 100;
    this.playerHp = 100;
    this.stamina = 100;
    this.gold = 90;
    this.wood = 30;
    this.stone = 15;
    this.scrap = 0;
    this.baseLevel = 1;
    this.baseMaxHp = BASE_MAX_HP_BY_LEVEL[1];
    this.baseHp = this.baseMaxHp;
    this.lastBaseDamageAt = 0;
    this.screenShake = 0;
    this.wave = 1;
    this.waveState = 'prep';
    this.prepCountdown = getWavePrepDuration(1);
    this.totalKills = 0;
    this.spawnQueue = [];
    this.nightFactor = 0;
    this.targetNightFactor = 0;
    this.lastWeaponId = 'wooden_bat';
    this.equippedSlot = { kind: 'weapon', id: 'wooden_bat' };
    this.inventorySlots = [
      { kind: 'weapon', id: 'wooden_bat' },
      null,
      null,
      null,
      null,
      null,
    ];
    this.activeSlotIndex = 0;
    this.lastSwitchLabel = null;
    this.lastSwitchAt = 0;
    this.ownedWeapons = ['wooden_bat'];
    this.weaponLevels = {
      wooden_bat: 1,
      metal_pipe: 1,
      pistol: 1,
      shotgun: 1,
      assault_rifle: 1,
      heavy_mg: 1,
    };
    this.ownedTools = [];
    this.toolLevels = { axe: 1, pickaxe: 1, shovel: 1, jackhammer: 1 };
    this.ammoMap = {
      wooden_bat: 0,
      metal_pipe: 0,
      pistol: 12,
      shotgun: 6,
      assault_rifle: 30,
      heavy_mg: 60,
    };
    this.isReloading = false;
    this.buildMode = false;
    this.selectedBuildId = null;
    this.selectedPlacedUid = null;
    this.tutorialFlags.clear();
    this.dismissedTutorial = false;
    this.gridVisualGroup.visible = false;
    this.ghostGroup.visible = false;

    this.envHandle.rebuildForLevel(1);
    this.envHandle.setDamageRatio(1);
    this.rebuildGridOverlay();
    this.recomputeBaseSystems();
    this.screen = 'playing';
    clearSavedGame();
    this.saveGame();
    this.syncHudToStore();
  }

  private loadFromSave(save: SaveGameData) {
    this.clearWorldEntities();
    this.worldSeed = save.worldSeed || 482917;
    this.initResourceNodes(this.worldSeed);

    this.playerX = 0;
    this.playerZ = 7.5;
    this.playerLevel = Math.max(1, save.playerLevel || 1);
    this.playerXp = save.playerXp || 0;
    this.playerNextXp = Math.round(100 * Math.pow(1.35, this.playerLevel - 1));
    this.playerMaxHp = 100 + (this.playerLevel - 1) * 15;
    this.playerHp = this.playerMaxHp;
    this.stamina = 100;
    this.gold = save.gold;
    this.wood = save.wood ?? 30;
    this.stone = save.stone ?? 15;
    this.scrap = save.scrap ?? 0;
    this.baseLevel = THREE.MathUtils.clamp(save.baseLevel, 1, 5);
    this.baseMaxHp = BASE_MAX_HP_BY_LEVEL[this.baseLevel];
    this.baseHp = Math.min(save.baseHp || this.baseMaxHp, this.baseMaxHp);
    this.lastBaseDamageAt = 0;
    this.screenShake = 0;
    this.wave = Math.max(1, save.wave || 1);
    this.waveState = 'prep';
    this.prepCountdown = getWavePrepDuration(this.wave);
    this.totalKills = save.totalKills || 0;
    this.spawnQueue = [];
    const eqWep = save.equippedWeapon || 'wooden_bat';
    this.lastWeaponId = eqWep;
    this.ownedWeapons = save.ownedWeapons?.length ? save.ownedWeapons : ['wooden_bat'];
    const savedLevels = save.weaponLevels;
    this.weaponLevels = {
      wooden_bat: savedLevels?.wooden_bat ?? 1,
      metal_pipe: savedLevels?.metal_pipe ?? 1,
      pistol: savedLevels?.pistol ?? 1,
      shotgun: savedLevels?.shotgun ?? 1,
      assault_rifle: savedLevels?.assault_rifle ?? 1,
      heavy_mg: savedLevels?.heavy_mg ?? 1,
    };
    this.ownedTools = save.ownedTools || [];
    const sTools = save.toolLevels;
    this.toolLevels = {
      axe: sTools?.axe ?? 1,
      pickaxe: sTools?.pickaxe ?? 1,
      shovel: sTools?.shovel ?? 1,
      jackhammer: sTools?.jackhammer ?? 1,
    };

    if (save.inventorySlots && save.inventorySlots.length === 6) {
      this.inventorySlots = save.inventorySlots.map((slot) =>
        slot && this.isItemOwned(slot) ? { ...slot } : null,
      );
    } else {
      const rebuilt: Array<EquippedSlot | null> = [null, null, null, null, null, null];
      let cursor = 0;
      for (const w of this.ownedWeapons) {
        if (cursor < 6) rebuilt[cursor++] = { kind: 'weapon', id: w };
      }
      for (const t of this.ownedTools) {
        if (cursor < 6) rebuilt[cursor++] = { kind: 'tool', id: t };
      }
      this.inventorySlots = rebuilt;
    }

    const desiredIdx = save.activeSlotIndex ?? 0;
    if (this.inventorySlots[desiredIdx] && this.isItemOwned(this.inventorySlots[desiredIdx]!)) {
      this.activeSlotIndex = desiredIdx;
      this.equippedSlot = { ...this.inventorySlots[desiredIdx]! };
    } else {
      const firstValid = this.inventorySlots.findIndex((s) => s !== null && this.isItemOwned(s));
      this.activeSlotIndex = firstValid >= 0 ? firstValid : 0;
      this.equippedSlot =
        this.inventorySlots[this.activeSlotIndex] ?? { kind: 'weapon', id: eqWep };
    }

    this.tutorialFlags = new Set(save.tutorialFlags || []);
    WEAPON_ORDER.forEach((wId) => {
      this.ammoMap[wId] = WEAPON_CATALOG[wId].magSize;
    });

    this.envHandle.rebuildForLevel(this.baseLevel);
    this.envHandle.setDamageRatio(this.baseHp / this.baseMaxHp);
    this.rebuildGridOverlay();

    for (const item of save.placedBuildings || []) {
      const migratedId = (
        item.defId === 'reinforced_wall' ? 'stone_wall' : item.defId
      ) as BuildingId;
      if (BUILDING_CATALOG[migratedId]) {
        this.placeStructureInternal(
          migratedId,
          item.gx,
          item.gz,
          item.level || 1,
          item.hp,
          Boolean(item.isOpen),
          item.uid,
          item.rotation ?? 0,
          true,
        );
      }
    }
    this.placedBuildings.forEach((b) => {
      if (this.isWallOrGate(b.defId)) {
        this.refreshWallConnectorsForCell(b.gx, b.gz);
      }
    });

    this.recomputeBaseSystems();
    this.screen = 'playing';
    this.syncHudToStore();
  }

  private saveGame() {
    if (this.screen === 'gameover') return;
    const placedBuildings = Array.from(this.placedBuildings.values()).map((b) => ({
      uid: b.uid,
      defId: b.defId,
      gx: b.gx,
      gz: b.gz,
      level: b.level,
      hp: Math.round(b.hp),
      isOpen: b.isOpen,
      rotation: b.rotation,
    }));
    writeSavedGame({
      version: 3,
      worldSeed: this.worldSeed,
      gold: Math.round(this.gold),
      wood: Math.round(this.wood),
      stone: Math.round(this.stone),
      scrap: Math.round(this.scrap),
      playerLevel: this.playerLevel,
      playerXp: this.playerXp,
      baseLevel: this.baseLevel,
      baseHp: Math.round(this.baseHp),
      wave: this.wave,
      totalKills: this.totalKills,
      equippedWeapon: this.lastWeaponId,
      inventorySlots: this.inventorySlots,
      activeSlotIndex: this.activeSlotIndex,
      ownedWeapons: this.ownedWeapons,
      weaponLevels: this.weaponLevels,
      ownedTools: this.ownedTools,
      toolLevels: this.toolLevels,
      tutorialFlags: Array.from(this.tutorialFlags),
      placedBuildings,
    });
    useGameStore.getState().setHasSave(true);
  }

  private registerBridge() {
    const bridge: GameActionsBridge = {
      startNewGame: () => this.resetToFreshGame(),
      continueSavedGame: () => {
        const save = loadSavedGame();
        if (save) this.loadFromSave(save);
        else this.resetToFreshGame();
      },
      setPaused: (paused) => this.setPaused(paused),
      toggleMute: () => {
        soundEngine.muted = !soundEngine.muted;
        this.syncHudToStore();
      },
      setAudioSettings: (patch) => {
        soundEngine.setSettings(patch);
        this.syncHudToStore();
      },
      toggleBuildMode: (force) => this.toggleBuildMode(force),
      selectBuildItem: (id) => {
        if (id && BUILDING_CATALOG[id].isBaseUpgradeAction) {
          useGameStore.getState().setBaseUpgradeOpen(true);
          return;
        }
        this.selectedBuildId = id;
        this.selectedPlacedUid = null;
        if (id && !this.buildMode) {
          this.buildMode = true;
          this.gridVisualGroup.visible = true;
        }
        this.updateGhostPreview();
        this.syncHudToStore();
      },
      rotateBuildItem: (dir = 1) => {
        if (!this.buildMode || !this.selectedBuildId) return;
        this.rotateBuildSelection(dir);
      },
      upgradeSelectedBuilding: () => {
        if (!this.selectedPlacedUid) return;
        const b = this.placedBuildings.get(this.selectedPlacedUid);
        if (!b) return;
        const def = BUILDING_CATALOG[b.defId];

        // Evolve wall to next tier when at maxLevel
        if (b.level >= def.maxLevel && def.evolvesTo) {
          const nextDef = BUILDING_CATALOG[def.evolvesTo];
          if (this.baseLevel < nextDef.requiredBaseLevel) {
            useGameStore
              .getState()
              .pushNotice(`Dönüşüm için Üs Sv.${nextDef.requiredBaseLevel} gerekli!`, 'danger');
            return;
          }
          if (!this.canAffordCost(nextDef.cost)) {
            useGameStore.getState().pushNotice('Dönüşüm için kaynak yetersiz!', 'danger');
            return;
          }
          this.payCost(nextDef.cost);
          b.defId = nextDef.id;
          b.level = 1;
          b.maxHp = nextDef.maxHp;
          b.hp = b.maxHp;
          this.rebuildBuildingMeshVisual(b);
          this.recomputeBaseSystems();
          const [wx, wz] = this.gridToWorld(b.gx, b.gz);
          soundEngine.playPlaceStructure(this.getBuildingMaterialKind(b.defId), wx, wz);
          useGameStore.getState().pushNotice(`Duvar dönüştürüldü: ${nextDef.name}!`, 'wave');
          this.saveGame();
          this.syncHudToStore();
          return;
        }

        if (b.level >= def.maxLevel) return;
        const upgCost = scaleResourceCost(def.cost, b.level, def.upgradeCostMultiplier);
        if (!this.canAffordCost(upgCost)) {
          useGameStore.getState().pushNotice('Yükseltme için kaynak yetersiz!', 'danger');
          return;
        }
        this.payCost(upgCost);
        b.level += 1;
        b.maxHp = Math.round(def.maxHp * (1 + (b.level - 1) * 0.45));
        b.hp = b.maxHp;
        this.rebuildBuildingMeshVisual(b);
        this.recomputeBaseSystems();
        const [wx, wz] = this.gridToWorld(b.gx, b.gz);
        soundEngine.playPlaceStructure(this.getBuildingMaterialKind(b.defId), wx, wz);
        useGameStore.getState().pushNotice(`${def.name} Sv.${b.level} oldu!`, 'info');
        this.saveGame();
        this.syncHudToStore();
      },
      repairSelectedBuilding: () => {
        if (!this.selectedPlacedUid) return;
        const b = this.placedBuildings.get(this.selectedPlacedUid);
        if (!b || b.hp >= b.maxHp) return;
        const cost = Math.max(5, Math.round(((b.maxHp - b.hp) / b.maxHp) * 20));
        if (this.gold < cost) {
          useGameStore.getState().pushNotice('Tamir için yetersiz Altın!', 'danger');
          return;
        }
        this.gold -= cost;
        b.hp = b.maxHp;
        this.updateBuildingHpVisual(b);
        const [wx, wz] = this.gridToWorld(b.gx, b.gz);
        soundEngine.playPlaceStructure(this.getBuildingMaterialKind(b.defId), wx, wz);
        this.saveGame();
        this.syncHudToStore();
      },
      toggleSelectedGate: () => {
        if (!this.selectedPlacedUid) return;
        const b = this.placedBuildings.get(this.selectedPlacedUid);
        if (!b || b.defId !== 'metal_gate') return;
        b.isOpen = !b.isOpen;
        const leaf = b.mesh.userData.gateLeaf as THREE.Group | undefined;
        if (leaf) {
          leaf.rotation.y = b.isOpen ? Math.PI * 0.45 : 0;
        }
        const [wx, wz] = this.gridToWorld(b.gx, b.gz);
        soundEngine.playGateMove(wx, wz);
        this.saveGame();
        this.syncHudToStore();
      },
      demolishSelectedBuilding: () => {
        if (!this.selectedPlacedUid) return;
        const b = this.placedBuildings.get(this.selectedPlacedUid);
        if (!b) return;
        const cost = BUILDING_CATALOG[b.defId].cost;
        if (cost.gold) this.addGold(Math.round(cost.gold * 0.5));
        this.addResource(
          cost.wood ? Math.round(cost.wood * 0.5) : 0,
          cost.stone ? Math.round(cost.stone * 0.5) : 0,
          cost.scrap ? Math.round(cost.scrap * 0.5) : 0,
        );
        const [wx, wz] = this.gridToWorld(b.gx, b.gz);
        const matKind = this.getBuildingMaterialKind(b.defId);
        this.removeBuilding(b.uid);
        soundEngine.playBuildingDestroy(matKind, wx, wz);
        this.saveGame();
        this.syncHudToStore();
      },
      clearSelectedPlaced: () => {
        this.selectedPlacedUid = null;
        this.syncHudToStore();
      },
      upgradeGasStation: () => this.upgradeGasStation(),
      repairGasStation: () => this.repairGasStation(),
      upgradeWeaponWorkshop: () => this.upgradeWeaponWorkshop(),
      buildWeaponWorkshopShortcut: () => this.buildWeaponWorkshopShortcut(),
      selectInventorySlot: (index) => this.selectInventorySlot(index),
      assignToInventorySlot: (item, slotIndex) => this.assignToInventorySlot(item, slotIndex),
      adjustCameraZoom: (delta) => {
        this.cameraZoom = THREE.MathUtils.clamp(this.cameraZoom + delta, 16, 36);
      },
      buyOrEquipWeapon: (id) => {
        if (this.ownedWeapons.includes(id)) {
          this.equipWeapon(id);
          return;
        }
        const def = WEAPON_CATALOG[id];
        if (this.workshopLevel < def.requiredWorkshopLevel) {
          useGameStore
            .getState()
            .pushNotice(`Silah Atölyesi Sv.${def.requiredWorkshopLevel} gerekli!`, 'danger');
          return;
        }
        if (this.gold < def.cost) {
          useGameStore.getState().pushNotice('Yetersiz Altın!', 'danger');
          return;
        }
        this.gold -= def.cost;
        this.ownedWeapons.push(id);
        this.ammoMap[id] = def.magSize;
        this.equipWeapon(id);
        soundEngine.playBuild();
        useGameStore.getState().pushNotice(`${def.name} envantere eklendi!`, 'info');
        this.saveGame();
        this.syncHudToStore();
      },
      upgradeWeapon: (id) => {
        if (!this.ownedWeapons.includes(id)) return;
        if (this.workshopLevel < 1) {
          useGameStore.getState().pushNotice('Silah geliştirmek için Silah Atölyesi kur!', 'danger');
          return;
        }
        const curLv = this.weaponLevels[id] || 1;
        if (curLv >= 5) return;
        const maxAllowedLv = Math.min(5, this.workshopLevel + 1);
        if (curLv >= maxAllowedLv) {
          useGameStore
            .getState()
            .pushNotice(`Sv.${curLv + 1} için Silah Atölyesi Sv.${curLv} gerekli!`, 'danger');
          return;
        }
        const cost = 60 + curLv * 55;
        if (this.gold < cost) {
          useGameStore.getState().pushNotice('Yetersiz Altın!', 'danger');
          return;
        }
        this.gold -= cost;
        this.weaponLevels[id] = curLv + 1;
        this.tutorialFlags.add('upgraded_weapon');
        soundEngine.playBuild();
        useGameStore
          .getState()
          .pushNotice(`${WEAPON_CATALOG[id].name} Sv.${curLv + 1} oldu!`, 'info');
        this.saveGame();
        this.syncHudToStore();
      },
      buyOrEquipTool: (id) => {
        if (this.ownedTools.includes(id)) {
          this.equipTool(id);
          return;
        }
        const def = TOOL_CATALOG[id];
        if (this.gold < def.cost) {
          useGameStore.getState().pushNotice('Yetersiz Altın!', 'danger');
          return;
        }
        this.gold -= def.cost;
        this.ownedTools.push(id);
        this.tutorialFlags.add('bought_tool');
        this.equipTool(id);
        soundEngine.playBuild();
        useGameStore.getState().pushNotice(`${def.name} envantere eklendi!`, 'info');
        this.saveGame();
        this.syncHudToStore();
      },
      upgradeTool: (id) => {
        if (!this.ownedTools.includes(id)) return;
        const curLv = this.toolLevels[id] || 1;
        if (curLv >= 5) return;
        const cost = 45 + curLv * 45;
        if (this.gold < cost) {
          useGameStore.getState().pushNotice('Yetersiz Altın!', 'danger');
          return;
        }
        this.gold -= cost;
        this.toolLevels[id] = curLv + 1;
        soundEngine.playBuild();
        useGameStore
          .getState()
          .pushNotice(`${TOOL_CATALOG[id].name} Sv.${curLv + 1} oldu!`, 'info');
        this.saveGame();
        this.syncHudToStore();
      },
      startWaveNow: () => {
        if (this.screen === 'playing' && this.waveState === 'prep') {
          this.beginNextWaveCombat();
        }
      },
      reloadWeapon: () => this.startReload(),
      dismissTutorial: () => {
        this.dismissedTutorial = true;
        this.syncHudToStore();
      },
    };
    useGameStore.getState().setBridge(bridge);
  }

  private setPaused(paused: boolean) {
    if (this.screen === 'gameover' || this.screen === 'title') return;
    this.screen = paused ? 'paused' : 'playing';
    this.mouseDown = false;
    this.syncHudToStore();
  }

  private toggleBuildMode(force?: boolean) {
    this.buildMode = force !== undefined ? force : !this.buildMode;
    this.gridVisualGroup.visible = this.buildMode;
    if (!this.buildMode) {
      this.ghostGroup.visible = false;
      this.selectedBuildId = null;
      this.selectedPlacedUid = null;
    }
    this.mouseDown = false;
    this.syncHudToStore();
  }

  private upgradeGasStation() {
    if (this.baseLevel >= 5) return;
    const nextLv = this.baseLevel + 1;
    const cost = BASE_LEVEL_COSTS[nextLv];
    if (!this.canAffordCost(cost)) {
      useGameStore
        .getState()
        .pushNotice(`İstasyon Sv.${nextLv} için kaynak yetersiz!`, 'danger');
      return;
    }
    this.payCost(cost);
    this.baseLevel = nextLv;
    this.baseMaxHp = BASE_MAX_HP_BY_LEVEL[nextLv];
    this.baseHp = this.baseMaxHp;
    this.envHandle.rebuildForLevel(this.baseLevel);
    this.envHandle.setDamageRatio(1);
    this.rebuildGridOverlay();
    soundEngine.playWaveStart();
    this.spawnFxRing(0, 1, 0xf59e0b, 7, 0.65);
    useGameStore
      .getState()
      .pushNotice(`Üs Seviyesi ${nextLv}: ${BASE_LEVEL_NAMES[nextLv]}!`, 'wave');
    this.saveGame();
    this.syncHudToStore();
  }

  private repairGasStation() {
    if (this.baseHp >= this.baseMaxHp) return;
    const missing = this.baseMaxHp - this.baseHp;
    const woodCost = Math.max(5, Math.round(missing * 0.08));
    if (this.wood < woodCost) {
      useGameStore.getState().pushNotice(`Tamir için ${woodCost} Odun gerekli!`, 'danger');
      return;
    }
    this.wood -= woodCost;
    this.baseHp = this.baseMaxHp;
    this.envHandle.setDamageRatio(1);
    soundEngine.playBuild();
    useGameStore.getState().pushNotice(`İstasyon tamir edildi (-${woodCost} Odun)`, 'info');
    this.saveGame();
    this.syncHudToStore();
  }

  private upgradeWeaponWorkshop() {
    let targetWorkshop: PlacedRuntime | null = null;
    this.placedBuildings.forEach((b) => {
      if (b.defId === 'weapon_workshop') {
        if (!targetWorkshop || b.level > targetWorkshop.level) {
          targetWorkshop = b;
        }
      }
    });

    if (!targetWorkshop) {
      this.buildWeaponWorkshopShortcut();
      return;
    }

    const b = targetWorkshop as PlacedRuntime;
    const def = BUILDING_CATALOG.weapon_workshop;
    if (b.level >= def.maxLevel) return;

    const upgCost = getWorkshopUpgradeCost(b.level);
    if (!this.canAffordCost(upgCost)) {
      useGameStore.getState().pushNotice('Silah Atölyesi yükseltmesi için kaynak yetersiz!', 'danger');
      return;
    }

    this.payCost(upgCost);
    b.level += 1;
    b.maxHp = Math.round(def.maxHp * (1 + (b.level - 1) * 0.45));
    b.hp = b.maxHp;
    this.rebuildBuildingMeshVisual(b);
    this.recomputeBaseSystems();
    const [wx, wz] = this.gridToWorld(b.gx, b.gz);
    soundEngine.playPlaceStructure('metal', wx, wz);
    this.spawnFxRing(wx, wz, 0x38bdf8, 2.4, 0.45);
    useGameStore.getState().pushNotice(`Silah Atölyesi Sv.${b.level} oldu!`, 'wave');
    this.saveGame();
    this.syncHudToStore();
  }

  private buildWeaponWorkshopShortcut() {
    const store = useGameStore.getState();
    store.setShopOpen(false);
    store.setActiveBuildTab('buildings');
    this.buildMode = true;
    this.gridVisualGroup.visible = true;
    this.selectedBuildId = 'weapon_workshop';
    this.selectedPlacedUid = null;
    store.pushNotice('Silah Atölyesini uygun bir ızgaraya yerleştir!', 'info');
    this.syncHudToStore();
  }

  private startLoop() {
    const tick = () => {
      if (this.disposed) return;
      const now = performance.now();
      const dt = Math.min(0.05, Math.max(0.001, (now - this.lastTickTime) / 1000));
      this.lastTickTime = now;

      this.update(dt, now);
      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      this.afterDraw(tick);
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private hasBasePower(): boolean {
    return (this.baseLevel >= 2 || this.powerGenerated > 0) && this.powerUsed <= this.powerGenerated;
  }

  private update(dt: number, nowMs: number) {
    this.nightFactor = THREE.MathUtils.damp(this.nightFactor, this.targetNightFactor, 1.4, dt);
    const powered = this.hasBasePower();
    this.updateAtmosphereLighting(powered);

    soundEngine.updateListener(this.playerX, this.playerZ);

    if (this.screen === 'playing' && !this.isModalOpen()) {
      this.updatePlayer(dt);
      this.updateGathering(dt);
      this.updateResourceNodes(dt);
      this.updateWaveAndSpawns(dt);
      this.updateDefenses(dt);
      this.updateZombies(dt);
      this.updateProjectiles(dt);
      this.updateCoins(dt);
      this.updateGhostPreview();
      soundEngine.updateAmbience(
        dt,
        this.nightFactor,
        this.waveState === 'combat',
        this.baseHp < this.baseMaxHp * 0.65,
      );
    }

    this.envHandle.updateDamageFx(dt, this.nightFactor, powered, (sx, sy, sz) => {
      this.spawnParticles(sx, sy, sz, 0xfbbf24, 3);
    });
    this.updateParticles(dt);
    this.updateFxRings(dt);
    this.updateCamera(dt);
    this.billboardSprites();
    this.updateOcclusionVisibility(dt);

    this.hudSyncAccum += dt;
    if (this.hudSyncAccum >= 0.08) {
      this.hudSyncAccum = 0;
      this.syncHudToStore();
    }

    if (this.screen === 'playing' && nowMs - this.lastSaveTime > 12000) {
      this.lastSaveTime = nowMs;
      this.saveGame();
    }
  }

  private updateAtmosphereLighting(hasBasePower: boolean) {
    const nf = this.nightFactor;
    if (nf < 0.5) {
      const t = nf * 2;
      (this.scene.background as THREE.Color).copy(_dayBg).lerp(_duskBg, t);
    } else {
      const t = (nf - 0.5) * 2;
      (this.scene.background as THREE.Color).copy(_duskBg).lerp(_nightBg, t);
    }
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.copy(this.scene.background as THREE.Color);
      this.scene.fog.density = 0.01 + nf * 0.01;
    }
    this.sunLight.color.copy(_daySunColor).lerp(_nightSunColor, nf);
    this.sunLight.intensity = THREE.MathUtils.lerp(1.55, 0.36, nf);
    this.hemiLight.color.copy(_daySky).lerp(_nightSky, nf);
    this.hemiLight.groundColor.copy(_dayGround).lerp(_nightGround, nf);
    this.hemiLight.intensity = THREE.MathUtils.lerp(0.74, 0.28, nf);
    this.envHandle.setNightFactor(nf, hasBasePower);

    this.placedBuildings.forEach((b) => {
      const pt = b.mesh.userData.nightPointLight as THREE.PointLight | undefined;
      if (pt) {
        const baseIntensity = b.defId === 'adv_generator' ? 3.2 : 2.1;
        pt.intensity = nf * baseIntensity * (b.hp > 0 ? 1 : 0);
      }
    });
  }

  private isPositionBlockedForPlayer(x: number, z: number): boolean {
    if (x > -4.0 && x < 4.0 && z > -5.0 && z < 0.1) return true;
    if (Math.abs(x - -2.0) < 0.8 && Math.abs(z - 2.8) < 0.7) return true;
    if (Math.abs(x - 2.0) < 0.8 && Math.abs(z - 2.8) < 0.7) return true;

    // Solid ruin walls & shipping containers
    if (x >= 30.6 && x <= 41.4 && z >= 30.3 && z <= 31.7) return true;
    if (x >= 40.3 && x <= 41.7 && z >= 30.8 && z <= 38.2) return true;
    if (Math.abs(x - 38) < 3.0 && Math.abs(z - 39.5) < 1.45) return true;
    if (Math.abs(x + 36) < 1.45 && Math.abs(z + 6) < 3.0) return true;

    // Solid abandoned cars & trucks
    const solidVehs: Array<[number, number, number]> = [
      [-16, 18.5, 2.0],
      [17, 21.2, 2.0],
      [-34, 29, 2.0],
      [44, 18.2, 2.0],
      [-40, 22.8, 2.7],
      [34, 17.6, 2.4],
      [-48, -28, 2.0],
      [48, -32, 2.0],
    ];
    for (const [vx, vz, vr] of solidVehs) {
      if (Math.hypot(x - vx, z - vz) < vr) return true;
    }

    for (const rn of this.resourceNodes) {
      if (rn.depleted) continue;
      if (Math.hypot(x - rn.x, z - rn.z) < rn.radius * 0.78) return true;
    }

    const [gx, gz] = this.worldToGrid(x, z);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const uid = this.cellOccupancy.get(this.cellKey(gx + dx, gz + dz));
        if (!uid) continue;
        const b = this.placedBuildings.get(uid);
        if (!b) continue;
        const def = BUILDING_CATALOG[b.defId];
        if (!def.blocksPlayer) continue;
        const [wx, wz] = this.gridToWorld(b.gx, b.gz);
        const [hx, hz] = this.getBuildingHalfExtents(b.defId, b.rotation);
        if (Math.abs(x - wx) < hx + 0.36 && Math.abs(z - wz) < hz + 0.36) {
          return true;
        }
      }
    }
    return false;
  }

  private isPositionBlockedForZombie(x: number, z: number): PlacedRuntime | 'station' | null {
    if (x > -4.0 && x < 4.0 && z > -5.0 && z < 0.2) return 'station';
    const [gx, gz] = this.worldToGrid(x, z);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const uid = this.cellOccupancy.get(this.cellKey(gx + dx, gz + dz));
        if (!uid) continue;
        const b = this.placedBuildings.get(uid);
        if (!b || !BUILDING_CATALOG[b.defId].blocksZombies) continue;
        const [wx, wz] = this.gridToWorld(b.gx, b.gz);
        const [hx, hz] = this.getBuildingHalfExtents(b.defId, b.rotation);
        if (Math.abs(x - wx) < hx + 0.42 && Math.abs(z - wz) < hz + 0.42) {
          return b;
        }
      }
    }
    return null;
  }

  private updatePlayer(dt: number) {
    if (this.playerHp <= 0) {
      this.playerAnimState = 'death';
      this.playerAnimTimer += dt;
      return;
    }

    if (this.weaponCooldownTimer > 0) this.weaponCooldownTimer -= dt;
    if (this.dodgeCooldown > 0) this.dodgeCooldown -= dt;
    if (this.playerHurtTimer > 0) this.playerHurtTimer -= dt;
    if (this.playerAttackAnimTimer > 0) this.playerAttackAnimTimer -= dt;
    if (this.playerFlashLight.intensity > 0) {
      this.playerFlashLight.intensity = Math.max(0, this.playerFlashLight.intensity - dt * 28);
    }

    if (this.isReloading && this.equippedSlot.kind === 'weapon') {
      this.reloadTimer -= dt;
      if (this.reloadTimer <= 0) {
        this.isReloading = false;
        this.ammoMap[this.equippedSlot.id] = WEAPON_CATALOG[this.equippedSlot.id].magSize;
      }
    }

    if (this.mouseDown && !this.buildMode && this.equippedSlot.kind === 'weapon') {
      this.tryPlayerWeaponAttack(this.equippedSlot.id);
    }

    let moveX = 0;
    let moveZ = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveZ -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveZ += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;

    const isMoving = moveX !== 0 || moveZ !== 0;
    const isSprinting =
      Boolean(this.keys['ShiftLeft'] || this.keys['ShiftRight']) && isMoving && this.stamina > 5;

    if (this.dodgeTimer > 0) {
      this.dodgeTimer -= dt;
      this.playerVx = this.dodgeDirX * 14.5;
      this.playerVz = this.dodgeDirZ * 14.5;
    } else if (isMoving) {
      const len = Math.hypot(moveX, moveZ);
      moveX /= len;
      moveZ /= len;
      const speed = isSprinting ? 8.8 : 6.4;
      if (isSprinting) {
        this.stamina = Math.max(0, this.stamina - 22 * dt);
      } else {
        this.stamina = Math.min(this.maxStamina, this.stamina + 16 * dt);
      }
      this.playerVx = moveX * speed;
      this.playerVz = moveZ * speed;
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + 20 * dt);
      this.playerVx = 0;
      this.playerVz = 0;
    }

    // Expanded playable world bounds (-58..+58)
    const nextX = THREE.MathUtils.clamp(this.playerX + this.playerVx * dt, -58, 58);
    if (!this.isPositionBlockedForPlayer(nextX, this.playerZ)) {
      this.playerX = nextX;
    }
    const nextZ = THREE.MathUtils.clamp(this.playerZ + this.playerVz * dt, -58, 58);
    if (!this.isPositionBlockedForPlayer(this.playerX, nextZ)) {
      this.playerZ = nextZ;
    }

    this.playerGroup.position.set(this.playerX, 0, this.playerZ);

    // Passive heal near Medical Station
    if (this.medStationCount > 0 && this.playerHp < this.playerMaxHp) {
      let nearMed = false;
      this.placedBuildings.forEach((b) => {
        if (b.defId === 'med_station') {
          const [wx, wz] = this.gridToWorld(b.gx, b.gz);
          if (Math.hypot(wx - this.playerX, wz - this.playerZ) <= BUILDING_CATALOG.med_station.range) {
            nearMed = true;
          }
        }
      });
      if (nearMed) {
        this.medHealAccum += dt * 4.5;
        if (this.medHealAccum >= 1) {
          const heal = Math.floor(this.medHealAccum);
          this.medHealAccum -= heal;
          this.playerHp = Math.min(this.playerMaxHp, this.playerHp + heal);
        }
      }
    }

    if (this.playerHurtTimer > 0) {
      this.playerAnimState = 'damage';
    } else if (this.playerAttackAnimTimer > 0) {
      this.playerAnimState = 'attack';
    } else if (isMoving || this.dodgeTimer > 0) {
      this.playerAnimState = isSprinting || this.dodgeTimer > 0 ? 'run' : 'walk';
    } else {
      this.playerAnimState = 'idle';
    }

    this.playerAnimTimer += dt;
    let frame = 0;
    if (this.playerAnimState === 'idle') {
      frame = Math.floor(this.playerAnimTimer * 2) % 2;
    } else if (this.playerAnimState === 'walk') {
      frame = Math.floor(this.playerAnimTimer * 8) % 4;
    } else if (this.playerAnimState === 'run') {
      frame = Math.floor(this.playerAnimTimer * 12) % 4;
    } else if (this.playerAnimState === 'attack') {
      frame = Math.min(2, Math.floor((1 - this.playerAttackAnimTimer / 0.22) * 3));
    }

    const pMat = this.playerSprite.material as THREE.MeshBasicMaterial;
    const heldId = this.equippedSlot.id;
    const nextTex = getPlayerSpriteTexture(heldId, this.playerAnimState, frame);
    if (pMat.map !== nextTex) {
      pMat.map = nextTex;
      pMat.needsUpdate = true;
      const silMat = this.playerSilhouette.material as THREE.MeshBasicMaterial;
      silMat.map = nextTex;
      silMat.needsUpdate = true;
    }
    this.playerSprite.scale.x = this.playerFacingLeft ? -1 : 1;
    this.playerSilhouette.scale.x = this.playerSprite.scale.x;
  }

  private stepGatherNode(node: ResourceNodeEntity, toolId: ToolId, dt: number) {
    const tool = TOOL_CATALOG[toolId];
    const lv = this.toolLevels[toolId] || 1;
    const speedFactor = 1 + (lv - 1) * 0.2;
    const duration = tool.gatherDuration / speedFactor;

    this.gatheringNode = node;
    this.playerFacingLeft = node.x < this.playerX;
    this.playerAttackAnimTimer = 0.2;
    this.gatherProgress += dt / duration;

    if (this.gatherProgress >= 1) {
      this.gatherProgress = 0;
      const power = Math.round(tool.gatherPower * (1 + (lv - 1) * 0.25));
      node.hp -= power;
      node.shakeTimer = 0.18;

      const soundKind =
        node.kind === 'scrap_wreck'
          ? 'scrap'
          : toolId === 'axe'
            ? 'chop'
            : toolId === 'pickaxe'
              ? 'mine'
              : toolId === 'shovel'
                ? 'dig'
                : 'drill';
      soundEngine.playGather(soundKind, node.x, node.z);

      const chipColor =
        node.kind.startsWith('tree')
          ? 0x92400e
          : node.kind === 'mineral_vein'
            ? 0x38bdf8
            : node.kind === 'scrap_wreck'
              ? 0xf59e0b
              : 0x78716c;
      this.spawnParticles(node.x, 1.1, node.z, chipColor, 6);

      const yieldMult = tool.yieldBonus * (1 + (lv - 1) * 0.15);
      const frac = Math.min(1, power / node.maxHp);

      if (node.hp <= 0) {
        node.depleted = true;
        node.regrowTimer = 45;
        node.mesh.visible = false;
        this.gatheringNode = null;
        this.tutorialFlags.add('gathered_resource');
        if (node.kind.startsWith('tree')) {
          soundEngine.playTreeFall(node.x, node.z);
        }

        const wGain = Math.round(node.woodYield * 0.65 * yieldMult);
        const sGain = Math.round(node.stoneYield * 0.65 * yieldMult);
        const mGain = Math.round(node.scrapYield * 0.65 * yieldMult);
        this.addResource(wGain, sGain, mGain);
        if (node.goldBonus > 0) this.addGold(node.goldBonus);
        this.addXp(20);
      } else {
        const wTick = node.woodYield > 0 ? Math.max(1, Math.round(node.woodYield * frac * 0.5 * yieldMult)) : 0;
        const sTick = node.stoneYield > 0 ? Math.max(1, Math.round(node.stoneYield * frac * 0.5 * yieldMult)) : 0;
        const mTick = node.scrapYield > 0 ? Math.max(1, Math.round(node.scrapYield * frac * 0.5 * yieldMult)) : 0;
        this.addResource(wTick, sTick, mTick);
        this.addXp(6);
      }
      this.saveGame();
    }
  }

  private updateGathering(dt: number) {
    const nearNode = this.getNearestResourceNode();
    if (!nearNode) {
      this.gatheringNode = null;
      this.gatherProgress = 0;
      return;
    }

    if (this.mouseDown && !this.buildMode && this.equippedSlot.kind === 'tool') {
      const toolId = this.equippedSlot.id;
      if (toolId === nearNode.requiredTool || toolId === nearNode.altTool) {
        this.stepGatherNode(nearNode, toolId, dt);
        return;
      }
    }

    if (this.gatheringNode !== nearNode) {
      this.gatherProgress = 0;
      this.gatheringNode = null;
    }
  }

  private updateResourceNodes(dt: number) {
    for (const node of this.resourceNodes) {
      if (node.depleted) {
        node.regrowTimer -= dt;
        if (node.regrowTimer <= 0) {
          node.depleted = false;
          node.hp = node.maxHp;
          node.mesh.visible = true;
          node.mesh.scale.set(0.3, 0.3, 0.3);
        }
      } else {
        if (node.mesh.scale.x < 0.99) {
          const s = THREE.MathUtils.damp(node.mesh.scale.x, 1, 5, dt);
          node.mesh.scale.set(s, s, s);
        }
        if (node.shakeTimer > 0) {
          node.shakeTimer -= dt;
          node.mesh.rotation.z = Math.sin(node.shakeTimer * 45) * 0.08;
        } else if (node.mesh.rotation.z !== 0) {
          node.mesh.rotation.z = 0;
        }
      }
    }
  }

  private updateParticles(dt: number) {
    for (const p of this.particles) {
      if (!p.active) continue;
      p.life -= dt;
      p.vy -= 12 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      if (p.y < 0.1) {
        p.y = 0.1;
        p.vy *= -0.3;
      }
      p.mesh.position.set(p.x, p.y, p.z);
      p.mesh.rotation.x += dt * 6;
      p.mesh.rotation.y += dt * 5;
      if (p.life <= 0) {
        p.active = false;
        p.mesh.visible = false;
      }
    }
  }

  private updateWaveAndSpawns(dt: number) {
    if (this.waveState === 'prep') {
      this.prepCountdown -= dt;
      if (this.prepCountdown <= 0) {
        this.beginNextWaveCombat();
      }
      return;
    }

    if (this.spawnQueue.length > 0) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        const nextType = this.spawnQueue.shift()!;
        this.spawnZombie(nextType);
        this.spawnTimer = Math.max(0.45, 1.35 - this.wave * 0.08);
      }
    } else {
      const alive = this.zombies.some((z) => !z.dead);
      if (!alive) {
        this.completeCurrentWave();
      }
    }
  }

  private updateDefenses(dt: number) {
    const hasPowerDeficit = this.powerUsed > this.powerGenerated;

    this.placedBuildings.forEach((b) => {
      const def = BUILDING_CATALOG[b.defId];
      if (b.cooldownTimer > 0) b.cooldownTimer -= dt;
      if (b.reloadTimer > 0) b.reloadTimer -= dt;
      if (b.targetLockTimer > 0) b.targetLockTimer -= dt;

      if (b.defId === 'spike_trap') {
        if (b.cooldownTimer <= 0) {
          const [wx, wz] = this.gridToWorld(b.gx, b.gz);
          let triggered = false;
          for (const z of this.zombies) {
            if (z.dead) continue;
            if (Math.hypot(z.x - wx, z.z - wz) <= def.range) {
              const dmg = Math.round(def.damage * (1 + (b.level - 1) * 0.35));
              this.damageZombie(z, dmg, 0, 0, 1.5);
              triggered = true;
            }
          }
          if (triggered) {
            b.cooldownTimer = 1 / def.fireRate;
            b.hp -= 12;
            soundEngine.playTrapSnap(wx, wz);
            this.updateBuildingHpVisual(b);
            if (b.hp <= 0) {
              this.removeBuilding(b.uid);
              soundEngine.playBuildingDestroy('metal', wx, wz);
            }
          }
        }
        return;
      }

      if (isTurretBuilding(b.defId)) {
        if (def.powerUse > 0 && hasPowerDeficit) return;
        const stats = getTurretStatsAtLevel(b.defId, b.level);
        if (!stats) return;

        const [bx, bz] = this.gridToWorld(b.gx, b.gz);

        // Keep existing target only if alive and still inside effective range (unless another threat is very close)
        let currentTarget: ZombieEntity | null = null;
        let currentDist = Infinity;
        if (b.targetZombieId !== undefined) {
          const found = this.zombies.find((z) => z.id === b.targetZombieId && !z.dead);
          if (found) {
            const d = Math.hypot(found.x - bx, found.z - bz);
            if (d <= stats.range) {
              currentTarget = found;
              currentDist = d;
            }
          }
        }

        // Prioritize closest threatening zombie within effective range
        let nearestTarget: ZombieEntity | null = null;
        let nearestScore = Infinity;
        let nearestDist = Infinity;

        for (const z of this.zombies) {
          if (z.dead) continue;
          const distFromTurret = Math.hypot(z.x - bx, z.z - bz);
          if (distFromTurret > stats.range) continue;
          const distFromStation = Math.hypot(z.x, z.z);
          const threatScore = distFromTurret + distFromStation * 0.15;
          if (threatScore < nearestScore) {
            nearestScore = threatScore;
            nearestTarget = z;
            nearestDist = distFromTurret;
          }
        }

        let chosen: ZombieEntity | null = currentTarget;
        if (!chosen || (nearestTarget && nearestDist < Math.min(4.2, currentDist - 2.0))) {
          chosen = nearestTarget;
        }

        if (!chosen) {
          b.targetZombieId = undefined;
          return;
        }

        if (b.targetZombieId !== chosen.id) {
          b.targetZombieId = chosen.id;
          b.targetLockTimer = stats.targetDelay;
        }

        const desiredAngle = Math.atan2(chosen.x - bx, chosen.z - bz);
        let angDiff = desiredAngle - b.turretAngle;
        while (angDiff > Math.PI) angDiff -= Math.PI * 2;
        while (angDiff < -Math.PI) angDiff += Math.PI * 2;

        const rotSpeed = 3.6 + b.level * 0.9;
        const maxStep = rotSpeed * dt;
        if (Math.abs(angDiff) > 0.25) {
          soundEngine.playTurretRotate(bx, bz);
        }
        if (Math.abs(angDiff) <= maxStep) {
          b.turretAngle = desiredAngle;
        } else {
          b.turretAngle += Math.sign(angDiff) * maxStep;
        }

        const head = b.mesh.userData.turretHead as THREE.Group | undefined;
        if (head) {
          head.rotation.y = b.turretAngle;
        }

        const distToChosen = Math.hypot(chosen.x - bx, chosen.z - bz);
        if (
          distToChosen <= stats.range &&
          Math.abs(angDiff) <= 0.35 &&
          b.targetLockTimer <= 0 &&
          b.reloadTimer <= 0 &&
          b.cooldownTimer <= 0
        ) {
          b.cooldownTimer = 1 / stats.fireRate;
          const fireAngle = b.turretAngle + (Math.random() - 0.5) * stats.spread;
          const dirX = Math.sin(fireAngle);
          const dirZ = Math.cos(fireAngle);
          const muzzleY = b.defId === 'watchtower' || b.defId === 'heavy_tower' ? 2.6 : 1.35;
          const maxLife = Math.max(0.06, (stats.range - 0.45) / stats.projectileSpeed);

          this.spawnProjectile(
            bx + dirX * 0.9,
            muzzleY,
            bz + dirZ * 0.9,
            dirX * stats.projectileSpeed,
            dirZ * stats.projectileSpeed,
            stats.damage,
            b.defId === 'heavy_tower' ? 6.5 : 1.6,
            maxLife,
            stats.splashRadius,
            true,
            stats.armorPierce,
          );
          soundEngine.playGunshot(b.defId === 'heavy_tower' ? 'heavy' : 'turret', bx, bz);

          b.burstShots += 1;
          if (b.burstShots >= stats.burstSize) {
            b.burstShots = 0;
            b.reloadTimer = stats.reloadTime;
          }
        }
      }
    });
  }

  private updateZombies(dt: number) {
    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const z = this.zombies[i];

      if (z.dead) {
        z.deathTimer -= dt;
        z.animTimer += dt;
        const dFrame = Math.min(2, Math.floor((1 - z.deathTimer / 0.55) * 3));
        const zMat = z.spriteMesh.material as THREE.MeshBasicMaterial;
        const dTex = getZombieSpriteTexture(z.type, 'death', dFrame);
        if (zMat.map !== dTex) {
          zMat.map = dTex;
          zMat.needsUpdate = true;
        }
        if (z.deathTimer <= 0) {
          this.scene.remove(z.group);
          this.zombies.splice(i, 1);
        }
        continue;
      }

      if (z.attackTimer > 0) z.attackTimer -= dt;
      if (z.hurtTimer > 0) z.hurtTimer -= dt;

      // 1. Apply smooth physics knockback velocity with wall/station collision
      const kbSpeedSq = z.knockbackVx * z.knockbackVx + z.knockbackVz * z.knockbackVz;
      if (kbSpeedSq > 0.002) {
        const nextKbX = THREE.MathUtils.clamp(z.x + z.knockbackVx * dt, -60, 60);
        if (!this.isPositionBlockedForZombie(nextKbX, z.z)) {
          z.x = nextKbX;
        } else {
          z.knockbackVx = 0;
        }

        const nextKbZ = THREE.MathUtils.clamp(z.z + z.knockbackVz * dt, -60, 60);
        if (!this.isPositionBlockedForZombie(z.x, nextKbZ)) {
          z.z = nextKbZ;
        } else {
          z.knockbackVz = 0;
        }

        const damp = Math.exp(-9.5 * dt);
        z.knockbackVx *= damp;
        z.knockbackVz *= damp;
      } else {
        z.knockbackVx = 0;
        z.knockbackVz = 0;
      }

      // 2. Stagger state pauses AI chase/attack briefly after hit
      if (z.staggerTimer > 0) {
        z.staggerTimer -= dt;
        z.group.position.set(z.x, 0, z.z);
        const zMat = z.spriteMesh.material as THREE.MeshBasicMaterial;
        const tex = getZombieSpriteTexture(z.type, 'damage', 0);
        if (zMat.map !== tex) {
          zMat.map = tex;
          zMat.needsUpdate = true;
        }
        z.spriteMesh.scale.x = z.facingLeft ? -1 : 1;
        continue;
      }

      // 3. Boss special ground-slam shockwave (damages player & briefly disrupts nearby turrets)
      if (z.type === 'boss') {
        z.bossSlamTimer -= dt;
        if (z.bossSlamTimer <= 0) {
          const distP = Math.hypot(this.playerX - z.x, this.playerZ - z.z);
          if (distP < 6.0) {
            z.bossSlamTimer = 5.5;
            this.spawnFxRing(z.x, z.z, 0xef4444, 5.5, 0.45);
            soundEngine.playZombieSound('boss_slam', 'boss', z.x, z.z);
            if (distP < 4.8 && this.dodgeTimer <= 0) {
              this.damagePlayer(22);
            }
            this.placedBuildings.forEach((b) => {
              if (isTurretBuilding(b.defId)) {
                const [bx, bz] = this.gridToWorld(b.gx, b.gz);
                if (Math.hypot(bx - z.x, bz - z.z) <= 7.5) {
                  b.reloadTimer = Math.max(b.reloadTimer, 1.35);
                }
              }
            });
          } else {
            z.bossSlamTimer = 1.0;
          }
        }
      }

      // 4. AI Target Selection & spatial vocals
      const distPlayer = Math.hypot(this.playerX - z.x, this.playerZ - z.z);
      z.idleSoundTimer -= dt;
      if (z.idleSoundTimer <= 0) {
        z.idleSoundTimer = 4.5 + Math.random() * 6.5;
        soundEngine.playZombieSound('idle', z.type, z.x, z.z);
      }

      let targetX = THREE.MathUtils.clamp(z.x, -4.0, 4.0);
      let targetZ = THREE.MathUtils.clamp(z.z, -5.0, 5.0);
      let targetKind: 'player' | 'base' | 'building' = 'base';
      let targetBuilding: PlacedRuntime | null = null;

      if (distPlayer < 12.0 && this.playerHp > 0) {
        targetX = this.playerX;
        targetZ = this.playerZ;
        targetKind = 'player';
        if (!z.hasDetectedPlayer) {
          z.hasDetectedPlayer = true;
          soundEngine.playZombieSound('detect', z.type, z.x, z.z);
        }
      } else if (distPlayer > 16.0) {
        z.hasDetectedPlayer = false;
      }

      const dx = targetX - z.x;
      const dz = targetZ - z.z;
      const distToTarget = Math.hypot(dx, dz);
      z.facingLeft = dx < 0;

      let blockedByBuilding: PlacedRuntime | null = null;
      if (distToTarget > 0.2) {
        const probeX = z.x + (dx / distToTarget) * 1.1;
        const probeZ = z.z + (dz / distToTarget) * 1.1;
        const hit = this.isPositionBlockedForZombie(probeX, probeZ);
        if (hit && hit !== 'station') {
          blockedByBuilding = hit;
        }
      }

      if (blockedByBuilding) {
        targetKind = 'building';
        targetBuilding = blockedByBuilding;
      }

      const inAttackRange = targetKind === 'building' ? true : distToTarget <= z.attackRange;

      if (!inAttackRange && distToTarget > 0.1) {
        z.vx = (dx / distToTarget) * z.speed;
        z.vz = (dz / distToTarget) * z.speed;

        for (let j = 0; j < this.zombies.length; j++) {
          if (i === j || this.zombies[j].dead) continue;
          const other = this.zombies[j];
          const sdx = z.x - other.x;
          const sdz = z.z - other.z;
          const sdSq = sdx * sdx + sdz * sdz;
          if (sdSq > 0.001 && sdSq < 0.85) {
            const sd = Math.sqrt(sdSq);
            z.vx += (sdx / sd) * 1.8;
            z.vz += (sdz / sd) * 1.8;
          }
        }

        const nx = z.x + z.vx * dt;
        const nz = z.z + z.vz * dt;
        if (!this.isPositionBlockedForZombie(nx, z.z)) z.x = nx;
        if (!this.isPositionBlockedForZombie(z.x, nz)) z.z = nz;
        z.animState = 'walk';
      } else {
        z.animState = 'attack';
        if (z.attackTimer <= 0) {
          z.attackTimer = z.attackCooldown;
          soundEngine.playZombieSound('attack', z.type, z.x, z.z);
          if (targetKind === 'player' && this.dodgeTimer <= 0) {
            this.damagePlayer(z.damage);
          } else if (targetKind === 'building' && targetBuilding) {
            const bDef = BUILDING_CATALOG[targetBuilding.defId];
            const wallArmorFactor = bDef.category === 'walls' || bDef.maxHp >= 250 ? 0.78 : 1.0;
            const appliedDmg = Math.max(1, Math.round(z.damage * wallArmorFactor));
            targetBuilding.hp -= appliedDmg;
            this.updateBuildingHpVisual(targetBuilding);
            const [bx, bz] = this.gridToWorld(targetBuilding.gx, targetBuilding.gz);
            soundEngine.playMeleeHit('tool', this.getBuildingMaterialKind(targetBuilding.defId), bx, bz);
            if (targetBuilding.hp <= 0) {
              const matKind = this.getBuildingMaterialKind(targetBuilding.defId);
              this.removeBuilding(targetBuilding.uid);
              soundEngine.playBuildingDestroy(matKind, bx, bz);
              useGameStore
                .getState()
                .pushNotice(`${bDef.name} yıkıldı!`, 'danger');
            }
          } else if (targetKind === 'base') {
            this.baseHp = Math.max(0, this.baseHp - z.damage);
            this.envHandle.setDamageRatio(this.baseHp / this.baseMaxHp);
            this.envHandle.triggerHitFlash();
            this.lastBaseDamageAt = Date.now();
            this.screenShake = Math.min(0.45, this.screenShake + 0.18);

            const impactX = THREE.MathUtils.clamp(z.x, -4.1, 4.1);
            const impactZ = THREE.MathUtils.clamp(z.z, -4.8, 5.1);
            this.spawnParticles(impactX, 1.15, impactZ, 0xfbbf24, 4);
            this.spawnParticles(impactX, 0.95, impactZ, 0x9ca3af, 3);
            this.spawnFxRing(impactX, impactZ, 0xef4444, 1.65, 0.28);
            soundEngine.playStationHit();

            const now = Date.now();
            if (now - this.lastBaseDamageNoticeAt > 3200) {
              this.lastBaseDamageNoticeAt = now;
              useGameStore.getState().pushNotice('İstasyon hasar alıyor!', 'danger');
            }

            if (this.baseHp <= 0) {
              this.triggerGameOver('Benzin İstasyonu yıkıldı!');
            }
          }
        }
      }

      z.group.position.set(z.x, 0, z.z);

      z.animTimer += dt;
      const state: ZombieAnimState = z.hurtTimer > 0 ? 'damage' : z.animState;
      let frame = 0;
      if (state === 'walk') {
        frame = Math.floor(z.animTimer * (z.type === 'runner' ? 10 : 6)) % 4;
      } else if (state === 'attack') {
        frame = Math.floor(z.animTimer * 6) % 3;
      }
      const zMat = z.spriteMesh.material as THREE.MeshBasicMaterial;
      const tex = getZombieSpriteTexture(z.type, state, frame);
      if (zMat.map !== tex) {
        zMat.map = tex;
        zMat.needsUpdate = true;
        const sMat = z.silhouetteMesh.material as THREE.MeshBasicMaterial;
        sMat.map = tex;
        sMat.needsUpdate = true;
      }
      z.spriteMesh.scale.x = z.facingLeft ? -1 : 1;
      z.silhouetteMesh.scale.x = z.spriteMesh.scale.x;
    }
  }

  private damagePlayer(dmg: number) {
    if (this.playerHp <= 0) return;
    this.playerHp = Math.max(0, this.playerHp - dmg);
    this.playerHurtTimer = 0.22;
    soundEngine.playHit();
    if (this.playerHp <= 0) {
      this.triggerGameOver('Hayatta kalan yere yığıldı!');
    }
  }

  private triggerGameOver(reason: string) {
    this.screen = 'gameover';
    this.mouseDown = false;
    useGameStore.getState().pushNotice(reason, 'danger');
    this.syncHudToStore();
  }

  private updateProjectiles(dt: number) {
    for (const p of this.projectiles) {
      if (!p.active) continue;
      p.life -= dt;
      p.x += p.vx * dt;
      p.z += p.vz * dt;
      p.mesh.position.set(p.x, p.y, p.z);

      let hit = false;
      for (const z of this.zombies) {
        if (z.dead) continue;
        const hitRad = 0.72 * ZOMBIE_STATS[z.type].scale;
        const dx = z.x - p.x;
        const dz = z.z - p.z;
        if (dx * dx + dz * dz <= hitRad * hitRad) {
          hit = true;
          const speedLen = Math.max(0.1, Math.hypot(p.vx, p.vz));
          const dirX = p.vx / speedLen;
          const dirZ = p.vz / speedLen;
          if (p.splashRadius > 0) {
            this.spawnFxRing(p.x, p.z, 0xf97316, p.splashRadius, 0.28);
            soundEngine.playExplosion(p.x, p.z);
            for (const z2 of this.zombies) {
              if (!z2.dead && Math.hypot(z2.x - p.x, z2.z - p.z) <= p.splashRadius) {
                const isArmored = z2.type === 'heavy' || z2.type === 'boss';
                const effDmg = Math.max(1, Math.round(p.damage * (isArmored ? p.armorPierce : 1.0)));
                this.damageZombie(z2, effDmg, dirX, dirZ, p.knockback);
              }
            }
          } else {
            const isArmored = z.type === 'heavy' || z.type === 'boss';
            const effDmg = Math.max(1, Math.round(p.damage * (isArmored ? p.armorPierce : 1.0)));
            this.damageZombie(z, effDmg, dirX, dirZ, p.knockback);
            soundEngine.playHit(effDmg >= 45, z.x, z.z);
          }
          break;
        }
      }

      if (hit || p.life <= 0) {
        p.active = false;
        p.mesh.visible = false;
      }
    }
  }

  private updateCoins(dt: number) {
    for (const c of this.coins) {
      if (!c.active) continue;
      c.life -= dt;
      if (c.y > 0.55 || c.vy > 0) {
        c.vy -= 14 * dt;
        c.y += c.vy * dt;
        if (c.y <= 0.55) {
          c.y = 0.55;
          c.vy = 0;
        }
      }

      const dx = this.playerX - c.x;
      const dz = this.playerZ - c.z;
      const dist = Math.hypot(dx, dz);

      if (dist < 4.8 && this.playerHp > 0) {
        const pull = 10.5 * dt;
        c.x += (dx / Math.max(0.1, dist)) * pull;
        c.z += (dz / Math.max(0.1, dist)) * pull;
      }

      if (dist < 1.15 && this.playerHp > 0) {
        c.active = false;
        c.mesh.visible = false;
        this.addGold(c.value);
        soundEngine.playCoin();
        continue;
      }

      c.mesh.position.set(c.x, c.y + Math.sin(c.life * 5) * 0.08, c.z);

      if (c.life <= 0) {
        c.active = false;
        c.mesh.visible = false;
      }
    }
  }

  private updateFxRings(dt: number) {
    for (const r of this.fxRings) {
      if (!r.active) continue;
      r.age += dt;
      const t = Math.min(1, r.age / r.duration);
      const s = 0.25 + t * r.maxScale;
      r.mesh.scale.set(s, 1, s);
      (r.mesh.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.75;
      if (t >= 1) {
        r.active = false;
        r.mesh.visible = false;
      }
    }
  }

  private updateGhostPreview() {
    if (!this.buildMode || !this.selectedBuildId) {
      this.ghostGroup.visible = false;
      return;
    }
    const def = BUILDING_CATALOG[this.selectedBuildId];
    if (def.isBaseUpgradeAction) {
      this.ghostGroup.visible = false;
      return;
    }

    // Rebuild 3D preview silhouette when selected build item changes
    if (this.ghostPreviewId !== this.selectedBuildId) {
      if (this.ghostPreviewMesh) {
        this.ghostGroup.remove(this.ghostPreviewMesh);
        this.ghostPreviewMesh = null;
      }
      if (!this.ghostPreviewMat) {
        this.ghostPreviewMat = new THREE.MeshBasicMaterial({
          color: 0x22c55e,
          transparent: true,
          opacity: 0.48,
          depthWrite: false,
        });
      }
      const preview = createBuildingMesh(this.selectedBuildId, this.mats, 1, false);
      preview.traverse((obj) => {
        if ((obj as THREE.PointLight).isPointLight) {
          obj.visible = false;
          return;
        }
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.castShadow = false;
          m.receiveShadow = false;
          m.material = this.ghostPreviewMat!;
        }
      });
      this.ghostPreviewMesh = preview;
      this.ghostPreviewId = this.selectedBuildId;
      this.ghostGroup.add(preview);
    }

    this.ghostGroup.visible = true;
    const [wx, wz] = this.gridToWorld(this.hoverGx, this.hoverGz);
    this.ghostGroup.position.set(wx, 0, wz);
    this.hoverValid = this.isPlacementValid(this.hoverGx, this.hoverGz, this.selectedBuildId);
    const previewColor = this.hoverValid ? 0x22c55e : 0xef4444;

    const mat = this.ghostBox.material as THREE.MeshBasicMaterial;
    mat.color.setHex(previewColor);
    const [hx, hz] = this.getBuildingHalfExtents(this.selectedBuildId, this.buildRotation);
    this.ghostBox.scale.set(hx * 2, 1, hz * 2);

    if (this.ghostPreviewMat) {
      this.ghostPreviewMat.color.setHex(previewColor);
    }
    if (this.ghostPreviewMesh) {
      this.ghostPreviewMesh.rotation.y = (this.buildRotation % 4) * (Math.PI / 2);
    }

    const turretPreviewRange = getTurretStatsAtLevel(this.selectedBuildId, 1)?.range ?? def.range;
    if (turretPreviewRange > 1.5) {
      this.ghostRangeRing.visible = true;
      this.ghostRangeRing.scale.set(turretPreviewRange, 1, turretPreviewRange);
    } else {
      this.ghostRangeRing.visible = false;
    }
  }

  private updateCamera(dt: number) {
    const focusX = this.playerX * 0.85;
    const focusZ = this.playerZ * 0.85 + 0.5;

    const desiredX = focusX + 6;
    const desiredY = this.cameraZoom * 0.92;
    const desiredZ = focusZ + this.cameraZoom;

    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, desiredX, 6.5, dt);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, desiredY, 6.5, dt);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, desiredZ, 6.5, dt);

    let shakeX = 0;
    let shakeY = 0;
    if (this.screenShake > 0.004) {
      shakeX = (Math.random() - 0.5) * this.screenShake;
      shakeY = (Math.random() - 0.5) * this.screenShake * 0.7;
      this.screenShake = THREE.MathUtils.damp(this.screenShake, 0, 14, dt);
    } else {
      this.screenShake = 0;
    }

    _v1.set(
      this.camera.position.x - 6 + shakeX,
      0.5 + shakeY,
      this.camera.position.z - this.cameraZoom,
    );
    this.camera.position.x += shakeX;
    this.camera.position.y += shakeY;
    this.camera.lookAt(_v1);

    this.sunLight.position.set(_v1.x + 18, 28, _v1.z + 16);
    this.sunLight.target.position.copy(_v1);
    this.sunLight.target.updateMatrixWorld();
  }

  private billboardSprites() {
    this.playerSprite.quaternion.copy(this.camera.quaternion);
    this.playerSilhouette.quaternion.copy(this.camera.quaternion);
    for (const z of this.zombies) {
      z.spriteMesh.quaternion.copy(this.camera.quaternion);
      z.silhouetteMesh.quaternion.copy(this.camera.quaternion);
      z.hpBarBg.quaternion.copy(this.camera.quaternion);
    }
    for (const c of this.coins) {
      if (c.active) c.mesh.quaternion.copy(this.camera.quaternion);
    }
    this.placedBuildings.forEach((b) => {
      const barBg = b.mesh.userData.hpBarBg as THREE.Mesh | undefined;
      if (barBg && barBg.visible) {
        barBg.quaternion.copy(this.camera.quaternion);
      }
    });
  }

  private isActorOccludedByBox(actorX: number, actorY: number, actorZ: number, box: THREE.Box3): boolean {
    _v2.set(actorX, actorY, actorZ);
    const totalDist = this.camera.position.distanceTo(_v2);
    _ray.origin.copy(this.camera.position);
    _ray.direction.copy(_v2).sub(this.camera.position).normalize();
    const hit = _ray.intersectBox(box, _v3);
    if (!hit) return false;
    return this.camera.position.distanceTo(hit) < totalDist - 0.4;
  }

  private updateOcclusionVisibility(dt: number) {
    let playerOccluded = false;
    const zombieOccludedFlags = new Uint8Array(this.zombies.length);

    const checkList = (box: THREE.Box3): boolean => {
      let any = false;
      if (this.isActorOccludedByBox(this.playerX, 1.05, this.playerZ, box)) {
        playerOccluded = true;
        any = true;
      }
      for (let i = 0; i < this.zombies.length; i++) {
        const z = this.zombies[i];
        if (z.dead) continue;
        if (this.isActorOccludedByBox(z.x, 1.0, z.z, box)) {
          zombieOccludedFlags[i] = 1;
          any = true;
        }
      }
      return any;
    };

    const applyMaterialsOpacity = (mats: THREE.MeshStandardMaterial[], alpha: number) => {
      const transparentMode = alpha < 0.96;
      for (const m of mats) {
        if (m.transparent !== transparentMode) {
          m.transparent = transparentMode;
          m.depthWrite = !transparentMode;
          m.needsUpdate = true;
        }
        m.opacity = transparentMode ? alpha : 1;
      }
    };

    // 1. Static & Gas Station Structures
    for (const occ of this.envHandle.occludables) {
      const hit = checkList(occ.box);
      const target = hit ? 0.28 : 1.0;
      occ.currentAlpha = THREE.MathUtils.damp(occ.currentAlpha, target, 12, dt);
      applyMaterialsOpacity(occ.materials, occ.currentAlpha);
    }

    // 2. Player-Placed Structures (Walls, Gates, Watchtowers, Storage, etc.)
    this.placedBuildings.forEach((b) => {
      if (b.fadeMaterials.length === 0) return;
      const hit = checkList(b.occludeBox);
      const target = hit ? 0.34 : 1.0;
      b.fadeAlpha = THREE.MathUtils.damp(b.fadeAlpha, target, 12, dt);
      applyMaterialsOpacity(b.fadeMaterials, b.fadeAlpha);
    });

    // 3. Guarantee crisp actor visibility with occluded silhouettes
    this.playerSilhouette.visible = playerOccluded;
    for (let i = 0; i < this.zombies.length; i++) {
      const z = this.zombies[i];
      const isOcc = zombieOccludedFlags[i] === 1 && !z.dead;
      z.silhouetteMesh.visible = isOcc;
      (z.hpBarBg.material as THREE.MeshBasicMaterial).depthTest = !isOcc;
      (z.hpBarFill.material as THREE.MeshBasicMaterial).depthTest = !isOcc;
    }
  }

  private computeNearPrompt(): string | null {
    if (this.screen !== 'playing' || this.buildMode) return null;
    let prompt: string | null = null;
    this.placedBuildings.forEach((b) => {
      const [wx, wz] = this.gridToWorld(b.gx, b.gz);
      const d = Math.hypot(wx - this.playerX, wz - this.playerZ);
      if (b.defId === 'metal_gate' && d < 3.2) {
        prompt = b.isOpen ? '[E] Metal Kapıyı Kapat' : '[E] Metal Kapıyı Aç';
      } else if (b.defId === 'med_station' && d < 4.5 && this.playerHp < this.playerMaxHp) {
        prompt = '[E] Acil Tam Şifa (15 Altın)';
      }
    });
    if (!prompt && Math.hypot(this.playerX, this.playerZ - 1) < 7.5 && this.baseHp < this.baseMaxHp) {
      const cost = Math.max(5, Math.round((this.baseMaxHp - this.baseHp) * 0.08));
      prompt = `[E] İstasyonu Tamir Et (${cost} Odun)`;
    }
    return prompt;
  }

  private computeTutorialHint(): string | null {
    if (this.dismissedTutorial || this.screen !== 'playing') return null;
    if (!this.tutorialFlags.has('killed_zombie')) {
      return 'Zombileri temizle ve altın topla (Sol Tık: Saldır · 1–6: Envanter)';
    }
    if (!this.tutorialFlags.has('bought_tool') && this.ownedTools.length === 0 && this.gold >= 40) {
      return 'Cephanelik & Aletler (Tab) menüsünden Balta veya Kazma alarak yuvalara ata';
    }
    if (!this.tutorialFlags.has('gathered_resource') && this.ownedTools.length > 0) {
      return 'Çevredeki ağaç, kaya ve enkazlardan kaynak topla (E veya Sol Tık)';
    }
    if (!this.tutorialFlags.has('built_structure') && this.wood >= 10) {
      return 'İnşa Modu (B) ile topladığın kaynaklarla duvar ve savunma kur';
    }
    return null;
  }

  private syncHudToStore() {
    const activeWeaponId =
      this.equippedSlot.kind === 'weapon' ? this.equippedSlot.id : this.lastWeaponId;
    const def = WEAPON_CATALOG[activeWeaponId];

    const selectedPlaced = this.selectedPlacedUid
      ? this.placedBuildings.get(this.selectedPlacedUid) || null
      : null;
    const selectedPlacedInfo: PlacedBuilding | null = selectedPlaced
      ? {
          uid: selectedPlaced.uid,
          defId: selectedPlaced.defId,
          gx: selectedPlaced.gx,
          gz: selectedPlaced.gz,
          level: selectedPlaced.level,
          hp: selectedPlaced.hp,
          maxHp: selectedPlaced.maxHp,
          isOpen: selectedPlaced.isOpen,
          rotation: selectedPlaced.rotation,
          cooldownTimer: selectedPlaced.cooldownTimer,
          turretAngle: selectedPlaced.turretAngle,
        }
      : null;

    const nearNode = this.getNearestResourceNode();
    const nearbyNode: NearbyNodeInfo | null = nearNode
      ? {
          name: nearNode.name,
          requiredTool: nearNode.requiredTool,
          requiredToolName: TOOL_CATALOG[nearNode.requiredTool].name,
          hasTool: this.getUsableToolForNode(nearNode) !== null,
          hp: nearNode.hp,
          maxHp: nearNode.maxHp,
          progress: this.gatheringNode === nearNode ? this.gatherProgress : 0,
          isGathering: this.gatheringNode === nearNode,
        }
      : null;

    const dayPhase: DayPhase =
      this.nightFactor > 0.6 ? 'night' : this.nightFactor > 0.2 ? 'dusk' : 'day';
    const nextBaseCost = this.baseLevel < 5 ? BASE_LEVEL_COSTS[this.baseLevel + 1] : {};
    const wsUpgradeCost =
      this.workshopLevel < 4 ? getWorkshopUpgradeCost(this.workshopLevel) : {};
    const wsCanUpgrade =
      this.workshopLevel > 0 &&
      this.workshopLevel < 4 &&
      this.canAffordCost(wsUpgradeCost);
    const nextWaveCfg = getWaveConfig(this.wave);

    useGameStore.getState().setHud({
      screen: this.screen,
      playerHp: Math.ceil(this.playerHp),
      playerMaxHp: this.playerMaxHp,
      playerLevel: this.playerLevel,
      playerXp: this.playerXp,
      playerNextXp: this.playerNextXp,
      stamina: Math.round(this.stamina),
      maxStamina: this.maxStamina,
      gold: Math.round(this.gold),
      goldCap: this.goldCap,
      wood: Math.round(this.wood),
      stone: Math.round(this.stone),
      scrap: Math.round(this.scrap),
      resourceCap: this.resourceCap,
      baseLevel: this.baseLevel,
      baseHp: Math.ceil(this.baseHp),
      baseMaxHp: this.baseMaxHp,
      wave: this.wave,
      waveState: this.waveState,
      prepCountdown: Math.max(0, Math.ceil(this.prepCountdown)),
      prepDuration: getWavePrepDuration(this.wave),
      nextWaveTitle: nextWaveCfg.title,
      nextWaveIsNight: nextWaveCfg.isNight,
      nextWaveHasBoss: nextWaveCfg.boss > 0,
      zombiesRemaining:
        this.waveState === 'combat'
          ? this.spawnQueue.length + this.zombies.filter((z) => !z.dead).length
          : 0,
      totalKills: this.totalKills,
      dayPhase,
      timeOfDay: this.nightFactor,
      equippedSlot: this.equippedSlot,
      inventorySlots: this.inventorySlots.map((s) => (s ? { ...s } : null)),
      activeSlotIndex: this.activeSlotIndex,
      lastSwitchLabel: this.lastSwitchLabel,
      lastSwitchAt: this.lastSwitchAt,
      lastBaseDamageAt: this.lastBaseDamageAt,
      ownedWeapons: [...this.ownedWeapons],
      weaponLevels: { ...this.weaponLevels },
      ownedTools: [...this.ownedTools],
      toolLevels: { ...this.toolLevels },
      ammoInMag: this.equippedSlot.kind === 'weapon' ? this.ammoMap[this.equippedSlot.id] || 0 : 0,
      maxMag: this.equippedSlot.kind === 'weapon' ? def.magSize : 0,
      isReloading: this.isReloading,
      powerUsed: this.powerUsed,
      powerGenerated: this.powerGenerated,
      turretCount: this.turretCount,
      wallCount: this.wallCount,
      workshopLevel: this.workshopLevel,
      storageCount: this.storageCount,
      medStationCount: this.medStationCount,
      buildMode: this.buildMode,
      selectedBuildId: this.selectedBuildId,
      buildRotation: this.buildRotation,
      selectedPlacedUid: this.selectedPlacedUid,
      selectedPlacedInfo,
      canUpgradeBase: this.baseLevel < 5 && this.canAffordCost(nextBaseCost),
      baseUpgradeCost: nextBaseCost,
      workshopUpgradeCost: wsUpgradeCost,
      workshopCanUpgrade: wsCanUpgrade,
      nearPrompt: this.computeNearPrompt(),
      nearbyNode,
      tutorialHint: this.computeTutorialHint(),
      muted: soundEngine.muted,
      audioSettings: soundEngine.getSettings(),
    });
  }

  public dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.unbindEvents();
    useGameStore.getState().setBridge(null);

    this.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh;
        m.geometry?.dispose();
        if (Array.isArray(m.material)) {
          m.material.forEach((mat) => mat.dispose());
        } else {
          m.material?.dispose();
        }
      }
    });

    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
