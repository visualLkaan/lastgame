import * as THREE from 'three';
import { BuildingId, ResourceNodeKind } from './types';

function makeCanvasTexture(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  repeatX = 1,
  repeatY = 1,
  maxAnisotropy = 4,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  draw(ctx, width, height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

export interface SharedMaterials {
  desertMat: THREE.MeshStandardMaterial;
  asphaltMat: THREE.MeshStandardMaterial;
  concreteMat: THREE.MeshStandardMaterial;
  woodMat: THREE.MeshStandardMaterial;
  darkWoodMat: THREE.MeshStandardMaterial;
  steelMat: THREE.MeshStandardMaterial;
  darkSteelMat: THREE.MeshStandardMaterial;
  hazardMat: THREE.MeshStandardMaterial;
  rustMat: THREE.MeshStandardMaterial;
  redAccentMat: THREE.MeshStandardMaterial;
  amberMat: THREE.MeshStandardMaterial;
  cyanMat: THREE.MeshStandardMaterial;
  greenMat: THREE.MeshStandardMaterial;
  glassDarkMat: THREE.MeshStandardMaterial;
  emissiveWarmMat: THREE.MeshStandardMaterial;
}

export function createSharedMaterials(maxAnisotropy: number): SharedMaterials {
  const desertTex = makeCanvasTexture(
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#9b8362';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 900; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const r = 1 + Math.random() * 3;
        ctx.fillStyle = Math.random() > 0.5 ? '#8a7252' : '#ab9270';
        ctx.fillRect(x, y, r, r);
      }
    },
    18,
    18,
    maxAnisotropy,
  );

  const asphaltTex = makeCanvasTexture(
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#2d3138';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 1200; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#353a42' : '#24272d';
        ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      }
      ctx.strokeStyle = '#1c1e22';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(20, 40);
      ctx.lineTo(95, 110);
      ctx.lineTo(130, 180);
      ctx.stroke();
    },
    6,
    6,
    maxAnisotropy,
  );

  const concreteTex = makeCanvasTexture(
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#6e7278';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#55585e';
      ctx.lineWidth = 2;
      ctx.strokeRect(2, 2, w - 4, h - 4);
      for (let i = 0; i < 400; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#7a7e85' : '#61656b';
        ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      }
    },
    6,
    6,
    maxAnisotropy,
  );

  const woodTex = makeCanvasTexture(
    128,
    128,
    (ctx, w, h) => {
      ctx.fillStyle = '#925e2e';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#653e1a';
      ctx.lineWidth = 3;
      for (let y = 0; y < h; y += 22) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    },
    1,
    1,
    maxAnisotropy,
  );

  const hazardTex = makeCanvasTexture(
    128,
    128,
    (ctx, w, h) => {
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#18181b';
      for (let i = -h; i < w + h; i += 28) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 14, 0);
        ctx.lineTo(i + 14 - h, h);
        ctx.lineTo(i - h, h);
        ctx.closePath();
        ctx.fill();
      }
    },
    2,
    1,
    maxAnisotropy,
  );

  return {
    desertMat: new THREE.MeshStandardMaterial({
      map: desertTex,
      roughness: 0.94,
      metalness: 0.02,
    }),
    asphaltMat: new THREE.MeshStandardMaterial({
      map: asphaltTex,
      roughness: 0.88,
      metalness: 0.05,
    }),
    concreteMat: new THREE.MeshStandardMaterial({
      map: concreteTex,
      roughness: 0.85,
      metalness: 0.05,
    }),
    woodMat: new THREE.MeshStandardMaterial({
      map: woodTex,
      roughness: 0.82,
      metalness: 0.04,
    }),
    darkWoodMat: new THREE.MeshStandardMaterial({
      color: 0x5c3a1b,
      roughness: 0.85,
      metalness: 0.05,
    }),
    steelMat: new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.36,
      metalness: 0.78,
    }),
    darkSteelMat: new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.42,
      metalness: 0.72,
    }),
    hazardMat: new THREE.MeshStandardMaterial({
      map: hazardTex,
      roughness: 0.55,
      metalness: 0.25,
    }),
    rustMat: new THREE.MeshStandardMaterial({
      color: 0x7c3f23,
      roughness: 0.78,
      metalness: 0.35,
    }),
    redAccentMat: new THREE.MeshStandardMaterial({
      color: 0xb91c1c,
      roughness: 0.5,
      metalness: 0.25,
    }),
    amberMat: new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.38,
      metalness: 0.45,
    }),
    cyanMat: new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      roughness: 0.3,
      metalness: 0.65,
      emissive: new THREE.Color(0x0891b2),
      emissiveIntensity: 0.35,
    }),
    greenMat: new THREE.MeshStandardMaterial({
      color: 0x16a34a,
      roughness: 0.45,
      metalness: 0.2,
    }),
    glassDarkMat: new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.15,
      metalness: 0.4,
    }),
    emissiveWarmMat: new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: new THREE.Color(0xfbbf24),
      emissiveIntensity: 1.4,
      roughness: 0.2,
    }),
  };
}

function makeGasSignTexture(level: number): THREE.CanvasTexture {
  return makeCanvasTexture(
    512,
    128,
    (ctx, w, h) => {
      ctx.fillStyle = level >= 3 ? '#991b1b' : '#7f1d1d';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = level >= 3 ? '#fbbf24' : '#9ca3af';
      ctx.lineWidth = 8;
      ctx.strokeRect(8, 8, w - 16, h - 16);

      ctx.fillStyle = level >= 3 ? '#fef08a' : '#e5e7eb';
      ctx.font = 'bold 62px "Barlow Condensed", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('LAST STOP', w / 2, h / 2 - 6);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(
        level === 1 ? 'TERK EDİLMİŞ İSTASYON' : `BENZİN & SAVUNMA • SV.${level}`,
        w / 2,
        h - 24,
      );
    },
    1,
    1,
    4,
  );
}

export interface OccludableHandle {
  id: string;
  group: THREE.Object3D;
  box: THREE.Box3;
  materials: THREE.MeshStandardMaterial[];
  currentAlpha: number;
}

export interface GasStationEnvHandle {
  root: THREE.Group;
  stationGroup: THREE.Group;
  nightLights: THREE.PointLight[];
  occludables: OccludableHandle[];
  rebuildForLevel: (level: number) => void;
  setNightFactor: (nightFactor: number, hasBasePower?: boolean) => void;
  setDamageRatio: (hpRatio: number) => void;
  triggerHitFlash: () => void;
  updateDamageFx: (
    dt: number,
    nightFactor: number,
    hasBasePower?: boolean,
    onSpark?: (x: number, y: number, z: number) => void,
  ) => void;
}

export function getWorldPropExclusionZones(): Array<{ x: number; z: number; r: number }> {
  return [
    { x: -16, z: 18.5, r: 4.2 },
    { x: 17, z: 21.2, r: 4.2 },
    { x: -34, z: 29, r: 4.2 },
    { x: 44, z: 18.2, r: 4.2 },
    { x: -40, z: 22.8, r: 5.5 }, // Box truck
    { x: 34, z: 17.6, r: 4.8 },  // Burned pickup
    { x: -48, z: -28, r: 4.4 },  // Burned sedan
    { x: 48, z: -32, r: 4.4 },   // Burned sedan
    { x: -36, z: -6, r: 5.2 },   // Shipping container NW
    { x: 38, z: 34, r: 5.2 },    // Shipping container SE
    { x: -32, z: -26, r: 5.5 },  // Abandoned campsite
    { x: 36, z: 36, r: 8.5 },    // Ruined outpost
    { x: -24, z: -14, r: 3.0 },  // Perimeter scrap
    { x: 24, z: -12, r: 3.0 },   // Perimeter scrap
  ];
}

export function prepareOccludableMaterials(group: THREE.Object3D): THREE.MeshStandardMaterial[] {
  const cloned: THREE.MeshStandardMaterial[] = [];
  const cloneMap = new Map<THREE.Material, THREE.MeshStandardMaterial>();
  group.traverse((obj) => {
    if (!(obj as THREE.Mesh).isMesh) return;
    if (obj.userData.noFade) return;
    const mesh = obj as THREE.Mesh;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const nextMats = mats.map((m) => {
      if (!(m instanceof THREE.MeshStandardMaterial)) return m;
      let c = cloneMap.get(m);
      if (!c) {
        c = m.clone();
        cloneMap.set(m, c);
        cloned.push(c);
      }
      return c;
    });
    mesh.material = Array.isArray(mesh.material) ? nextMats : nextMats[0];
  });
  return cloned;
}

function makeCrackTexture(): THREE.CanvasTexture {
  return makeCanvasTexture(
    256,
    256,
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(20, 18, 16, 0.92)';
      ctx.lineCap = 'round';
      const branches = [
        [
          [32, 24],
          [78, 68],
          [94, 118],
          [148, 162],
          [184, 224],
        ],
        [
          [94, 118],
          [56, 154],
          [40, 206],
        ],
        [
          [210, 38],
          [165, 86],
          [176, 134],
          [135, 190],
        ],
        [
          [78, 68],
          [124, 52],
          [156, 30],
        ],
      ];
      branches.forEach((pts, idx) => {
        ctx.lineWidth = idx % 2 === 0 ? 5.5 : 3.2;
        ctx.beginPath();
        pts.forEach(([x, y], i) => {
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      });
    },
    1,
    1,
    4,
  );
}

function buildAbandonedCar(mats: SharedMaterials, colorHex: number): THREE.Group {
  const car = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: 0.72,
    metalness: 0.35,
  });

  // Lower chassis
  const hull = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.75, 1.65), bodyMat);
  hull.position.y = 0.62;
  hull.castShadow = true;
  hull.receiveShadow = true;
  car.add(hull);

  // Cabin
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.62, 1.45), bodyMat);
  cabin.position.set(-0.2, 1.25, 0);
  cabin.castShadow = true;
  car.add(cabin);

  // Windshield
  const glass = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.44, 1.32), mats.glassDarkMat);
  glass.position.set(-0.2, 1.24, 0);
  car.add(glass);

  // 4 wheels
  const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.24, 12);
  wheelGeo.rotateX(Math.PI / 2);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
  const offsets: [number, number][] = [
    [-1.05, 0.8],
    [1.05, 0.8],
    [-1.05, -0.8],
    [1.05, -0.8],
  ];
  offsets.forEach(([x, z]) => {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.position.set(x, 0.36, z);
    w.castShadow = true;
    car.add(w);
  });

  // Rust bumper
  const bumper = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.25, 1.72), mats.rustMat);
  bumper.position.set(1.74, 0.42, 0);
  car.add(bumper);

  return car;
}

function buildBrokenTruck(mats: SharedMaterials, burned = false): THREE.Group {
  const truck = new THREE.Group();
  const cabMat = new THREE.MeshStandardMaterial({
    color: burned ? 0x262626 : 0x9a3412,
    roughness: burned ? 0.95 : 0.72,
    metalness: burned ? 0.18 : 0.35,
  });
  const cargoMat = new THREE.MeshStandardMaterial({
    color: burned ? 0x1f2937 : 0xbdb7aa,
    roughness: 0.85,
    metalness: 0.25,
  });

  const chassis = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.4, 1.95), mats.darkSteelMat);
  chassis.position.y = 0.55;
  chassis.castShadow = true;
  truck.add(chassis);

  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.65, 1.55, 1.85), cabMat);
  cab.position.set(1.65, 1.45, 0);
  cab.rotation.z = burned ? -0.06 : 0;
  cab.castShadow = true;
  cab.receiveShadow = true;
  truck.add(cab);

  const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.7, 1.55), mats.glassDarkMat);
  windshield.position.set(2.42, 1.68, 0);
  truck.add(windshield);

  const cargo = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.95, 2.02), cargoMat);
  cargo.position.set(-0.85, 1.68, 0);
  cargo.castShadow = true;
  cargo.receiveShadow = true;
  truck.add(cargo);

  const wheelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.28, 12);
  wheelGeo.rotateX(Math.PI / 2);
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.92 });
  [
    [-1.75, 0.98],
    [-1.75, -0.98],
    [1.65, 0.98],
    [1.65, -0.98],
  ].forEach(([wx, wz]) => {
    const w = new THREE.Mesh(wheelGeo, tireMat);
    w.position.set(wx, 0.45, wz);
    w.castShadow = true;
    truck.add(w);
  });

  return truck;
}

function buildShippingContainer(mats: SharedMaterials, colorHex: number): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: 0.75,
    metalness: 0.4,
  });
  const box = new THREE.Mesh(new THREE.BoxGeometry(5.6, 2.5, 2.3), bodyMat);
  box.position.y = 1.25;
  box.castShadow = true;
  box.receiveShadow = true;
  g.add(box);

  for (let x = -2.2; x <= 2.2; x += 0.88) {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.35, 2.38), mats.rustMat);
    rib.position.set(x, 1.25, 0);
    g.add(rib);
  }
  const roof = new THREE.Mesh(new THREE.BoxGeometry(5.7, 0.14, 2.36), mats.darkSteelMat);
  roof.position.y = 2.52;
  g.add(roof);
  return g;
}

function buildVendingMachine(mats: SharedMaterials, flickering = false): THREE.Group {
  const vm = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.85, 0.75), mats.redAccentMat);
  body.position.y = 0.925;
  body.castShadow = true;
  vm.add(body);
  const front = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 1.1, 0.12),
    flickering ? mats.emissiveWarmMat : mats.glassDarkMat,
  );
  front.position.set(0, 1.15, 0.36);
  vm.add(front);
  const slot = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.22, 0.14), mats.darkSteelMat);
  slot.position.set(0, 0.35, 0.36);
  vm.add(slot);
  return vm;
}

function buildShoppingCart(mats: SharedMaterials): THREE.Group {
  const cart = new THREE.Group();
  const basket = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.55, 0.56), mats.steelMat);
  basket.position.y = 0.65;
  basket.castShadow = true;
  cart.add(basket);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.12, 0.52), mats.darkSteelMat);
  frame.position.y = 0.22;
  cart.add(frame);
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.35, 0.58), mats.redAccentMat);
  handle.position.set(-0.42, 0.95, 0);
  cart.add(handle);
  return cart;
}

function buildStreetLight(
  mats: SharedMaterials,
  hasLight: boolean,
): { group: THREE.Group; light?: THREE.PointLight; bulb: THREE.Mesh } {
  const g = new THREE.Group();
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 5.6, 8), mats.darkSteelMat);
  post.position.y = 2.8;
  post.castShadow = true;
  g.add(post);

  const arm = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 0.12), mats.darkSteelMat);
  arm.position.set(0.62, 5.5, 0);
  g.add(arm);

  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: new THREE.Color(0xf59e0b),
    emissiveIntensity: hasLight ? 1.2 : 0.15,
    roughness: 0.3,
  });
  const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.16, 0.26), bulbMat);
  bulb.position.set(1.18, 5.38, 0);
  g.add(bulb);

  let light: THREE.PointLight | undefined;
  if (hasLight) {
    light = new THREE.PointLight(0xffcf7a, 0, 17, 1.7);
    light.position.set(1.18, 5.0, 0);
    g.add(light);
  }
  return { group: g, light, bulb };
}

function buildPalletWithCrates(mats: SharedMaterials): THREE.Group {
  const g = new THREE.Group();
  const pallet = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.14, 1.1), mats.darkWoodMat);
  pallet.position.y = 0.07;
  pallet.receiveShadow = true;
  g.add(pallet);
  const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.48, 0.55), mats.woodMat);
  c1.position.set(-0.28, 0.38, -0.15);
  c1.rotation.y = 0.12;
  c1.castShadow = true;
  g.add(c1);
  const c2 = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.42, 0.48), mats.woodMat);
  c2.position.set(0.28, 0.35, 0.18);
  c2.rotation.y = -0.22;
  c2.castShadow = true;
  g.add(c2);
  return g;
}

function buildFuelPump(mats: SharedMaterials, level: number): THREE.Group {
  const pump = new THREE.Group();

  const base = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.25, 0.72), mats.concreteMat);
  base.position.y = 0.125;
  base.receiveShadow = true;
  pump.add(base);

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 1.5, 0.48),
    level >= 3 ? mats.redAccentMat : mats.rustMat,
  );
  body.position.y = 1.0;
  body.castShadow = true;
  body.receiveShadow = true;
  pump.add(body);

  const screen = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.32, 0.52),
    level >= 3 ? mats.emissiveWarmMat : mats.glassDarkMat,
  );
  screen.position.y = 1.32;
  pump.add(screen);

  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.18, 0.56), mats.steelMat);
  cap.position.y = 1.82;
  pump.add(cap);

  // Side nozzle & curved hose detail
  const hoseCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.36, 1.35, 0),
    new THREE.Vector3(0.54, 0.95, 0.14),
    new THREE.Vector3(0.48, 0.45, 0.08),
    new THREE.Vector3(0.34, 0.78, -0.05),
  ]);
  const hose = new THREE.Mesh(
    new THREE.TubeGeometry(hoseCurve, 10, 0.045, 6, false),
    new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 }),
  );
  pump.add(hose);

  return pump;
}

export function createGasStationEnvironment(
  scene: THREE.Scene,
  mats: SharedMaterials,
  initialLevel: number,
): GasStationEnvHandle {
  const root = new THREE.Group();
  const stationGroup = new THREE.Group();
  const nightLights: THREE.PointLight[] = [];
  const poweredLights: THREE.PointLight[] = [];
  const streetLights: THREE.PointLight[] = [];
  const flickerLights: THREE.PointLight[] = [];
  const occludables: OccludableHandle[] = [];
  const staticOccludables: OccludableHandle[] = [];
  const stationOccludables: OccludableHandle[] = [];

  // 1. Vast desert ground extending far to fog horizon
  const desertFloor = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), mats.desertMat);
  desertFloor.rotation.x = -Math.PI / 2;
  desertFloor.position.y = -0.02;
  desertFloor.receiveShadow = true;
  root.add(desertFloor);

  // Subtle organic ground variation patches scattered naturally across the wasteland
  const mossPatchMat = new THREE.MeshStandardMaterial({ color: 0x55623a, roughness: 0.96 });
  const gravelPatchMat = new THREE.MeshStandardMaterial({ color: 0x625c54, roughness: 0.94 });
  const organicPatches: Array<[number, number, number, boolean]> = [
    [-34, -22, 12, true],
    [-46, 8, 10, true],
    [-18, -38, 11, false],
    [28, -32, 13, false],
    [42, -8, 9, true],
    [24, 34, 10, false],
    [-28, 36, 11, true],
    [46, 28, 12, false],
    [-8, 42, 9, false],
    [14, -46, 11, true],
  ];
  organicPatches.forEach(([px, pz, rad, isMoss]) => {
    const patch = new THREE.Mesh(
      new THREE.CircleGeometry(rad, 18),
      isMoss ? mossPatchMat : gravelPatchMat,
    );
    patch.rotation.x = -Math.PI / 2;
    patch.position.set(px, -0.008, pz);
    patch.receiveShadow = true;
    root.add(patch);
  });

  // Region C: Ruined Exploration Outpost pad (South-East across highway)
  const ruinPad = new THREE.Mesh(new THREE.BoxGeometry(16, 0.14, 12), mats.concreteMat);
  ruinPad.position.set(36, 0.03, 36);
  ruinPad.receiveShadow = true;
  root.add(ruinPad);
  const ruinWall = new THREE.Mesh(new THREE.BoxGeometry(10, 1.8, 0.6), mats.concreteMat);
  ruinWall.position.set(36, 0.9, 31);
  ruinWall.castShadow = true;
  root.add(ruinWall);
  const ruinSideWall = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.45, 7), mats.concreteMat);
  ruinSideWall.position.set(41, 0.72, 34.5);
  ruinSideWall.castShadow = true;
  root.add(ruinSideWall);
  staticOccludables.push({
    id: 'ruin_wall',
    group: ruinWall,
    box: new THREE.Box3().setFromObject(ruinWall),
    materials: prepareOccludableMaterials(ruinWall),
    currentAlpha: 1,
  });

  // Outpost container, shopping cart, vending machine & lantern
  const seContainer = buildShippingContainer(mats, 0x2b4c5e);
  seContainer.position.set(38, 0, 39.5);
  seContainer.rotation.y = 0.08;
  root.add(seContainer);
  seContainer.updateMatrixWorld(true);
  staticOccludables.push({
    id: 'container_se',
    group: seContainer,
    box: new THREE.Box3().setFromObject(seContainer),
    materials: prepareOccludableMaterials(seContainer),
    currentAlpha: 1,
  });

  const cartSe = buildShoppingCart(mats);
  cartSe.position.set(32.5, 0, 38);
  cartSe.rotation.y = 0.7;
  root.add(cartSe);

  const vmOutpost = buildVendingMachine(mats, false);
  vmOutpost.position.set(31.8, 0, 32.5);
  vmOutpost.rotation.y = 0.35;
  root.add(vmOutpost);

  const outpostLantern = new THREE.PointLight(0xffa94d, 0, 13, 1.8);
  outpostLantern.position.set(35, 2.2, 33.5);
  root.add(outpostLantern);
  streetLights.push(outpostLantern);

  // NW Shipping container & scrapyard corner
  const nwContainer = buildShippingContainer(mats, 0x7c2d12);
  nwContainer.position.set(-36, 0, -6);
  nwContainer.rotation.y = Math.PI / 2 - 0.14;
  root.add(nwContainer);
  nwContainer.updateMatrixWorld(true);
  staticOccludables.push({
    id: 'container_nw',
    group: nwContainer,
    box: new THREE.Box3().setFromObject(nwContainer),
    materials: prepareOccludableMaterials(nwContainer),
    currentAlpha: 1,
  });

  // Abandoned Survivor Campsite (-32, -26)
  const campGroup = new THREE.Group();
  const tarpMat = new THREE.MeshStandardMaterial({ color: 0x4d5e3a, roughness: 0.9, side: THREE.DoubleSide });
  const tent = new THREE.Mesh(new THREE.ConeGeometry(2.1, 1.75, 4), tarpMat);
  tent.position.set(-1.8, 0.88, -0.8);
  tent.rotation.y = 0.6;
  tent.castShadow = true;
  campGroup.add(tent);
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2;
    const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22, 0), mats.concreteMat);
    stone.position.set(1.2 + Math.cos(ang) * 0.58, 0.12, 0.8 + Math.sin(ang) * 0.58);
    campGroup.add(stone);
  }
  const emberCore = new THREE.Mesh(
    new THREE.SphereGeometry(0.26, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xf97316 }),
  );
  emberCore.position.set(1.2, 0.14, 0.8);
  campGroup.add(emberCore);
  const campPallets = buildPalletWithCrates(mats);
  campPallets.position.set(-0.2, 0, 2.2);
  campGroup.add(campPallets);
  const campLight = new THREE.PointLight(0xff7b29, 0, 12, 1.8);
  campLight.position.set(1.2, 0.9, 0.8);
  campGroup.add(campLight);
  streetLights.push(campLight);
  campGroup.position.set(-32, 0, -26);
  root.add(campGroup);

  // 2. Highway Road running along south side (Z = +15.5 to +24.5)
  const road = new THREE.Mesh(new THREE.PlaneGeometry(260, 9), mats.asphaltMat);
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.01, 20);
  road.receiveShadow = true;
  root.add(road);

  // Dashed yellow highway centerline
  const lineMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.75 });
  for (let x = -114; x <= 114; x += 6) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.25), lineMat);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(x, 0.025, 20);
    root.add(dash);
  }

  // Functional & Damaged Highway Streetlights
  const lampPositions: Array<{ x: number; z: number; rotY: number; mode: 'ok' | 'flicker' | 'fallen' }> = [
    { x: -38, z: 15.2, rotY: Math.PI / 2, mode: 'ok' },
    { x: -14, z: 15.2, rotY: Math.PI / 2, mode: 'ok' },
    { x: 14, z: 15.2, rotY: Math.PI / 2, mode: 'flicker' },
    { x: 38, z: 15.2, rotY: Math.PI / 2, mode: 'ok' },
    { x: -24, z: 24.8, rotY: -Math.PI / 2, mode: 'ok' },
    { x: 24, z: 24.8, rotY: -Math.PI / 2, mode: 'fallen' },
  ];
  lampPositions.forEach((lp) => {
    const built = buildStreetLight(mats, lp.mode !== 'fallen');
    built.group.position.set(lp.x, 0, lp.z);
    built.group.rotation.y = lp.rotY;
    if (lp.mode === 'fallen') {
      built.group.rotation.z = 1.38;
      built.group.position.y = 0.18;
    }
    root.add(built.group);
    if (built.light) {
      if (lp.mode === 'flicker') flickerLights.push(built.light);
      else streetLights.push(built.light);
    }
  });

  // Concrete Jersey Barriers & Damaged Road Signs along highway
  const barrierCoords: Array<[number, number, number]> = [
    [-26, 15.4, 0.08],
    [-22.8, 15.5, -0.05],
    [8.5, 15.4, 0.12],
    [28, 24.4, -0.15],
  ];
  barrierCoords.forEach(([bx, bz, rot]) => {
    const barrier = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.9, 0.65), mats.concreteMat);
    barrier.position.set(bx, 0.45, bz);
    barrier.rotation.y = rot;
    barrier.castShadow = true;
    barrier.receiveShadow = true;
    root.add(barrier);
  });

  const signCoords: Array<[number, number, number]> = [
    [-11, 15.3, 0.25],
    [22, 24.6, -0.35],
  ];
  signCoords.forEach(([sx, sz, tilt]) => {
    const sg = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.4, 6), mats.steelMat);
    pole.position.y = 1.2;
    sg.add(pole);
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.95, 0.08), mats.amberMat);
    board.position.y = 2.3;
    board.rotation.z = Math.PI / 4;
    sg.add(board);
    sg.position.set(sx, 0, sz);
    sg.rotation.z = tilt;
    root.add(sg);
  });

  // 3. Parking / Forecourt Asphalt Pad around gas station
  const forecourt = new THREE.Mesh(new THREE.PlaneGeometry(36, 28), mats.asphaltMat);
  forecourt.rotation.x = -Math.PI / 2;
  forecourt.position.set(0, 0.005, 2);
  forecourt.receiveShadow = true;
  root.add(forecourt);

  // Concrete apron under central gas station & pumps
  const apron = new THREE.Mesh(new THREE.BoxGeometry(16, 0.12, 12), mats.concreteMat);
  apron.position.set(0, 0.04, 0);
  apron.receiveShadow = true;
  root.add(apron);

  // 4. Abandoned Cars & Trucks on highway & exploration areas
  const car1 = buildAbandonedCar(mats, 0x7c2d12);
  car1.position.set(-16, 0, 18.5);
  car1.rotation.y = 0.25;
  root.add(car1);

  const car2 = buildAbandonedCar(mats, 0x334155);
  car2.position.set(17, 0, 21.2);
  car2.rotation.y = -0.18;
  root.add(car2);

  const car3 = buildAbandonedCar(mats, 0x854d0e);
  car3.position.set(-34, 0, 29);
  car3.rotation.y = 0.85;
  root.add(car3);

  const car4 = buildAbandonedCar(mats, 0x475569);
  car4.position.set(44, 0, 18.2);
  car4.rotation.y = -0.35;
  root.add(car4);

  const truck1 = buildBrokenTruck(mats, false);
  truck1.position.set(-40, 0, 22.8);
  truck1.rotation.y = 0.15;
  root.add(truck1);

  const truck2 = buildBrokenTruck(mats, true);
  truck2.position.set(34, 0, 17.6);
  truck2.rotation.y = -2.85;
  root.add(truck2);

  const burnedCar1 = buildAbandonedCar(mats, 0x1f2937);
  burnedCar1.position.set(-48, 0, -28);
  burnedCar1.rotation.y = 1.25;
  root.add(burnedCar1);

  const burnedCar2 = buildAbandonedCar(mats, 0x27272a);
  burnedCar2.position.set(48, 0, -32);
  burnedCar2.rotation.y = -0.75;
  root.add(burnedCar2);

  [car1, car2, car3, car4, truck1, truck2, burnedCar1, burnedCar2].forEach((veh, idx) => {
    veh.updateMatrixWorld(true);
    staticOccludables.push({
      id: `veh_${idx}`,
      group: veh,
      box: new THREE.Box3().setFromObject(veh),
      materials: prepareOccludableMaterials(veh),
      currentAlpha: 1,
    });
  });

  // 5. Outer ambient rocks & scrub bushes + overgrown grass tufts across wasteland
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x786b59, roughness: 0.92 });
  const bushMat = new THREE.MeshStandardMaterial({ color: 0x5c6b3c, roughness: 0.9 });
  const propCoords: [number, number, number][] = [
    [-64, -52, 2.5],
    [64, -54, 2.8],
    [-66, 26, 2.2],
    [66, -12, 2.4],
    [56, 52, 2.1],
    [-54, 54, 1.9],
    [-12, -62, 2.6],
    [16, 62, 2.3],
  ];
  propCoords.forEach(([x, z, s], idx) => {
    const g = new THREE.Group();
    const rock = new THREE.Mesh(rockGeo, rockMat);
    rock.scale.set(s, s * 0.65, s * 0.9);
    rock.position.y = s * 0.3;
    rock.castShadow = true;
    rock.receiveShadow = true;
    g.add(rock);
    if (idx % 2 === 0) {
      const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(s * 0.55, 0), bushMat);
      bush.position.set(s * 0.8, s * 0.35, 0);
      bush.castShadow = true;
      g.add(bush);
    }
    g.position.set(x, 0, z);
    root.add(g);
  });

  // Scattered overgrown dry scrub & grass tufts (outside buildable grid, non-blocking)
  const tuftCoords: Array<[number, number, number]> = [
    [-25, -24, 0.85], [-28, -12, 0.7], [-23, 4, 0.8], [-39, 10, 0.9],
    [-46, -16, 0.8], [24, -22, 0.85], [29, -8, 0.7], [38, 6, 0.85],
    [45, -20, 0.9], [-12, -26, 0.75], [8, -32, 0.85], [-18, 34, 0.8],
    [14, 38, 0.85], [-44, 42, 0.9], [28, 44, 0.75], [0, -42, 0.9],
  ];
  tuftCoords.forEach(([tx, tz, ts]) => {
    const tuft = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55 * ts, 0), bushMat);
    tuft.scale.set(1.25, 0.65, 1.15);
    tuft.position.set(tx, 0.22 * ts, tz);
    tuft.receiveShadow = true;
    root.add(tuft);
  });

  // Perimeter Storytelling Props outside buildable zone (barrels, crates, tires, broken fences, trash)
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.95 });
  const tireGeo = new THREE.TorusGeometry(0.36, 0.14, 6, 12);
  tireGeo.rotateX(Math.PI / 2);

  const perimeterClusters: Array<[number, number, number]> = [
    [-23.5, -14.5, 0.4],
    [23.5, -12.5, -0.5],
    [-23.0, 9.5, 0.9],
    [23.5, 9.5, -0.3],
  ];
  perimeterClusters.forEach(([cx, cz, rot], idx) => {
    const cl = new THREE.Group();
    const fence = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.05, 0.14), mats.darkWoodMat);
    fence.position.set(0, 0.52, 0);
    fence.rotation.z = idx % 2 === 0 ? 0.12 : -0.1;
    fence.castShadow = true;
    cl.add(fence);

    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 1.05, 10), mats.rustMat);
    barrel.position.set(1.1, 0.52, 0.6);
    barrel.castShadow = true;
    cl.add(barrel);

    const t1 = new THREE.Mesh(tireGeo, tireMat);
    t1.position.set(-1.1, 0.14, 0.55);
    cl.add(t1);
    const t2 = new THREE.Mesh(tireGeo, tireMat);
    t2.position.set(-1.05, 0.4, 0.58);
    t2.rotation.z = 0.15;
    cl.add(t2);

    cl.position.set(cx, 0, cz);
    cl.rotation.y = rot;
    root.add(cl);
  });

  // Highway Utility Poles
  for (let x = -80; x <= 80; x += 20) {
    const poleGroup = new THREE.Group();
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 6.5, 8), mats.darkWoodMat);
    post.position.y = 3.25;
    post.castShadow = true;
    poleGroup.add(post);
    const cross = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.14, 0.14), mats.darkWoodMat);
    cross.position.y = 6.0;
    poleGroup.add(cross);
    poleGroup.position.set(x, 0, 26);
    root.add(poleGroup);
  }

  // Fuel barrels near parking corner (inside non-buildable apron edge or outer yard)
  const barrelPositions: [number, number][] = [
    [-21.5, -9],
    [-22.4, -8.3],
    [21.8, -8.5],
  ];
  barrelPositions.forEach(([bx, bz]) => {
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.1, 10), mats.redAccentMat);
    barrel.position.set(bx, 0.55, bz);
    barrel.castShadow = true;
    barrel.receiveShadow = true;
    root.add(barrel);
  });

  root.add(stationGroup);
  scene.add(root);

  const crackTex = makeCrackTexture();
  let crackMeshes: THREE.Mesh[] = [];
  let mediumDamageGroup = new THREE.Group();
  let lowDamageGroup = new THREE.Group();
  let criticalDamageGroup = new THREE.Group();
  let flashMats: THREE.MeshStandardMaterial[] = [];
  let signBoardMesh: THREE.Mesh | null = null;
  let criticalBeaconLight: THREE.PointLight | null = null;
  const smokePuffs: Array<{ mesh: THREE.Mesh; phase: number; speed: number; baseX: number; baseZ: number }> = [];

  let currentDamageRatio = 1;
  let hitFlashTimer = 0;
  let shudderTimer = 0;
  let sparkCooldown = 0;
  let flickerClock = 0;

  const syncOccludablesList = () => {
    occludables.length = 0;
    occludables.push(...staticOccludables, ...stationOccludables);
  };

  const clearStationGroup = () => {
    while (stationGroup.children.length > 0) {
      const child = stationGroup.children.pop()!;
      stationGroup.remove(child);
    }
    nightLights.length = 0;
    poweredLights.length = 0;
    stationOccludables.length = 0;
    crackMeshes = [];
    flashMats = [];
    smokePuffs.length = 0;
    signBoardMesh = null;
    criticalBeaconLight = null;
  };

  const applyDamageVisibility = () => {
    const r = currentDamageRatio;
    const medActive = r <= 0.75;
    const lowActive = r <= 0.42;
    const critActive = r <= 0.18;

    crackMeshes.forEach((m) => {
      m.visible = medActive;
      const mat = m.material as THREE.MeshBasicMaterial;
      mat.opacity = critActive ? 0.95 : lowActive ? 0.8 : 0.5;
    });
    mediumDamageGroup.visible = medActive;
    lowDamageGroup.visible = lowActive;
    criticalDamageGroup.visible = critActive;

    if (signBoardMesh) {
      signBoardMesh.rotation.z = critActive ? -0.14 : lowActive ? -0.07 : 0;
    }
    if (criticalBeaconLight) {
      criticalBeaconLight.intensity = critActive ? 2.4 : 0;
    }
  };

  const rebuildForLevel = (level: number) => {
    clearStationGroup();

    // Main Convenience Store Building (footprint within X: -3.8..+3.8, Z: -4.8..-0.2)
    const store = new THREE.Group();
    const wallColor =
      level === 1
        ? 0x7e838b
        : level === 2
          ? 0xc4b7a3
          : level === 3
            ? 0x9ca3af
            : level === 4
              ? 0x475569
              : 0x1e293b;
    const storeWallMat = new THREE.MeshStandardMaterial({
      color: wallColor,
      roughness: level >= 4 ? 0.42 : level === 1 ? 0.95 : 0.78,
      metalness: level >= 5 ? 0.68 : level >= 4 ? 0.52 : level === 3 ? 0.32 : 0.06,
    });

    const storeHeight = level === 1 ? 3.05 : level === 2 ? 3.25 : level === 3 ? 3.45 : level === 4 ? 3.7 : 4.05;
    const storeWidth = level >= 5 ? 7.5 : level >= 4 ? 7.4 : 7.2;
    const storeDepth = level >= 5 ? 4.4 : 4.2;
    const storeCenterZ = -2.55;

    const storeBody = new THREE.Mesh(
      new THREE.BoxGeometry(storeWidth, storeHeight, storeDepth),
      storeWallMat,
    );
    storeBody.position.set(0, storeHeight * 0.5 + 0.05, storeCenterZ);
    storeBody.castShadow = true;
    storeBody.receiveShadow = true;
    store.add(storeBody);

    // Level 1: Neglected damaged concrete shell, crooked trim, wall stains & debris
    if (level === 1) {
      const stainMat = new THREE.MeshStandardMaterial({ color: 0x3f3a36, roughness: 0.98 });
      const stain1 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.3, 0.06), stainMat);
      stain1.position.set(-2.5, 0.9, -0.44);
      store.add(stain1);
      const stain2 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.6, 0.06), stainMat);
      stain2.position.set(2.8, 1.1, -0.44);
      store.add(stain2);

      // Damaged sagging roof edge & missing corner trim
      const crookedTrim = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.28, 4.45), mats.rustMat.clone());
      crookedTrim.position.set(-0.6, 3.16, storeCenterZ);
      crookedTrim.rotation.z = -0.045;
      crookedTrim.castShadow = true;
      store.add(crookedTrim);

      const brokenEdge = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.24, 3.8), mats.darkWoodMat);
      brokenEdge.position.set(2.75, 3.02, storeCenterZ);
      brokenEdge.rotation.z = 0.09;
      store.add(brokenEdge);
    }

    // Level 2+: Masonry / Reinforced Plinth Base
    if (level >= 2) {
      const plinth = new THREE.Mesh(
        new THREE.BoxGeometry(storeWidth + 0.26, 0.48, storeDepth + 0.26),
        level >= 4 ? mats.darkSteelMat : mats.concreteMat,
      );
      plinth.position.set(0, 0.25, storeCenterZ);
      plinth.receiveShadow = true;
      store.add(plinth);
    }

    // Level 3+: Heavy Structural Steel Pilasters & Lower Armor Skirt
    if (level >= 3) {
      const pilasterPositions: [number, number][] = [
        [-storeWidth * 0.5, -0.42],
        [-1.18, -0.42],
        [1.18, -0.42],
        [storeWidth * 0.5, -0.42],
        [-storeWidth * 0.5, -4.68],
        [storeWidth * 0.5, -4.68],
      ];
      pilasterPositions.forEach(([px, pz]) => {
        const col = new THREE.Mesh(
          new THREE.BoxGeometry(0.34, storeHeight + 0.14, 0.34),
          level >= 5 ? mats.hazardMat : mats.darkSteelMat,
        );
        col.position.set(px, storeHeight * 0.5 + 0.08, pz);
        col.castShadow = true;
        store.add(col);
      });

      // Bolted corrugated metal skirt around lower half of walls
      const skirt = new THREE.Mesh(
        new THREE.BoxGeometry(storeWidth + 0.18, 1.05, storeDepth + 0.18),
        level >= 4 ? mats.darkSteelMat : mats.steelMat,
      );
      skirt.position.set(0, 0.62, storeCenterZ);
      skirt.castShadow = true;
      store.add(skirt);
    }

    // Level 4+: Heavy Horizontal Armor Ribs, Side Armor Plates & Protruding Entrance Airlock
    if (level >= 4) {
      const upperArmorBand = new THREE.Mesh(
        new THREE.BoxGeometry(storeWidth + 0.28, 0.42, storeDepth + 0.28),
        mats.darkSteelMat,
      );
      upperArmorBand.position.set(0, storeHeight - 0.55, storeCenterZ);
      upperArmorBand.castShadow = true;
      store.add(upperArmorBand);

      // Side ribbed armor panels visible from isometric angle
      [-1, 1].forEach((side) => {
        for (let rz = -4.1; rz <= -1.0; rz += 0.95) {
          const rib = new THREE.Mesh(new THREE.BoxGeometry(0.16, storeHeight - 0.8, 0.48), mats.steelMat);
          rib.position.set(side * (storeWidth * 0.5 + 0.12), storeHeight * 0.5, rz);
          rib.castShadow = true;
          store.add(rib);
        }
      });
    }

    // Level 5: Towering Armored Corner Bastions with Sloped Caps & Fortress Buttresses
    if (level >= 5) {
      const bastionCoords: [number, number][] = [
        [-3.72, -0.35],
        [3.72, -0.35],
        [-3.72, -4.72],
        [3.72, -4.72],
      ];
      bastionCoords.forEach(([bx, bz]) => {
        const bastionBase = new THREE.Mesh(new THREE.BoxGeometry(0.92, 1.35, 0.92), mats.steelMat);
        bastionBase.position.set(bx, 0.68, bz);
        bastionBase.castShadow = true;
        store.add(bastionBase);

        const bastionTower = new THREE.Mesh(new THREE.BoxGeometry(0.76, 4.65, 0.76), mats.darkSteelMat);
        bastionTower.position.set(bx, 2.32, bz);
        bastionTower.castShadow = true;
        store.add(bastionTower);

        const cap = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.26, 0.94), mats.amberMat);
        cap.position.set(bx, 4.72, bz);
        store.add(cap);

        const turretCrenel = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.34, 0.54), mats.darkSteelMat);
        turretCrenel.position.set(bx, 4.98, bz);
        store.add(turretCrenel);
      });
    }

    // Roof Structure & Parapet (distinct per level)
    if (level >= 2) {
      const roofTrim = new THREE.Mesh(
        new THREE.BoxGeometry(
          level >= 5 ? 8.2 : level >= 4 ? 7.9 : 7.65,
          level >= 4 ? 0.52 : 0.4,
          level >= 5 ? 5.1 : level >= 4 ? 4.85 : 4.65,
        ),
        level >= 5
          ? mats.darkSteelMat.clone()
          : level >= 3
            ? mats.redAccentMat.clone()
            : mats.rustMat.clone(),
      );
      roofTrim.position.set(0, storeHeight + 0.16, storeCenterZ);
      roofTrim.castShadow = true;
      store.add(roofTrim);
    }

    // Lv.3+: Steel Roof Parapet Rails & Overhead Security Floodlight Bar
    if (level === 3) {
      const roofDeck = new THREE.Mesh(new THREE.BoxGeometry(7.35, 0.16, 4.35), mats.steelMat);
      roofDeck.position.set(0, storeHeight + 0.42, storeCenterZ);
      store.add(roofDeck);
      const frontRail = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.36, 0.12), mats.darkSteelMat);
      frontRail.position.set(0, storeHeight + 0.62, -0.35);
      store.add(frontRail);
    }

    // Rooftop AC unit (tilted/broken at Lv.1, intact Lv.2+)
    const acUnit = new THREE.Mesh(
      new THREE.BoxGeometry(1.45, 0.65, 1.1),
      level === 1 ? mats.rustMat : mats.steelMat,
    );
    acUnit.position.set(-2.1, storeHeight + 0.48, -2.85);
    if (level === 1) acUnit.rotation.z = 0.08;
    acUnit.castShadow = true;
    store.add(acUnit);

    // Lv.4+: Elevated Rooftop Defense Platform (Sandbag Parapet, Corner Watch-Platform, Comms Radar)
    if (level >= 4) {
      const roofY = storeHeight + 0.42;
      const platformDeck = new THREE.Mesh(
        new THREE.BoxGeometry(storeWidth + 0.45, 0.22, storeDepth + 0.45),
        mats.darkSteelMat,
      );
      platformDeck.position.set(0, roofY, storeCenterZ);
      platformDeck.castShadow = true;
      store.add(platformDeck);

      // Front & side rooftop sandbag parapet
      for (let sx = -3.1; sx <= 3.1; sx += 0.9) {
        const bag = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.44, 0.48), mats.desertMat);
        bag.position.set(sx, roofY + 0.32, -0.35);
        bag.castShadow = true;
        store.add(bag);
      }
      for (let sz = -4.3; sz <= -0.9; sz += 0.95) {
        const bagL = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.4, 0.82), mats.desertMat);
        bagL.position.set(-3.55, roofY + 0.3, sz);
        store.add(bagL);
        const bagR = bagL.clone();
        bagR.position.set(3.55, roofY + 0.3, sz);
        store.add(bagR);
      }

      // Elevated Corner Watch-Platform on roof (+X front corner, prominent from isometric view)
      const watchDeck = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.85, 2.0), mats.steelMat);
      watchDeck.position.set(2.75, roofY + 0.52, -1.25);
      watchDeck.castShadow = true;
      store.add(watchDeck);
      const watchRoof = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.16, 2.15), mats.hazardMat);
      watchRoof.position.set(2.75, roofY + 1.85, -1.25);
      store.add(watchRoof);
      [
        [1.75, -0.32],
        [3.75, -0.32],
        [1.75, -2.18],
        [3.75, -2.18],
      ].forEach(([px, pz]) => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.05, 0.14), mats.darkSteelMat);
        post.position.set(px, roofY + 1.38, pz);
        store.add(post);
      });

      // Rooftop Tactical Radar / Comms Mast
      const mastHeight = level >= 5 ? 2.25 : 1.55;
      const mast = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.12, mastHeight, 8),
        mats.steelMat,
      );
      mast.position.set(-2.65, roofY + mastHeight * 0.5 + 0.1, -3.75);
      store.add(mast);
      const dish = new THREE.Mesh(
        new THREE.ConeGeometry(level >= 5 ? 0.58 : 0.45, 0.32, 12),
        level >= 5 ? mats.cyanMat : mats.steelMat,
      );
      dish.position.set(-2.65, roofY + mastHeight + 0.18, -3.65);
      dish.rotation.x = Math.PI * 0.65;
      store.add(dish);
    }

    // Lv.5: Fortress Steel Battlements, Twin Solar Arrays, Catwalk & Cyan Beacon
    if (level >= 5) {
      const roofY = storeHeight + 0.55;
      const fortressTrimStripe = new THREE.Mesh(new THREE.BoxGeometry(8.3, 0.18, 5.2), mats.amberMat);
      fortressTrimStripe.position.set(0, storeHeight + 0.3, storeCenterZ);
      store.add(fortressTrimStripe);

      // 2nd-story cantilevered steel catwalk wrapping front & right side (Y: 3.45m, safely above player)
      const catwalkFront = new THREE.Mesh(new THREE.BoxGeometry(8.1, 0.18, 0.85), mats.steelMat);
      catwalkFront.position.set(0, 3.42, 0.15);
      catwalkFront.castShadow = true;
      store.add(catwalkFront);
      const catwalkRail = new THREE.Mesh(new THREE.BoxGeometry(8.1, 0.42, 0.08), mats.hazardMat);
      catwalkRail.position.set(0, 3.72, 0.55);
      store.add(catwalkRail);

      // Solar Arrays
      const solarMat = new THREE.MeshStandardMaterial({
        color: 0x1d4ed8,
        roughness: 0.18,
        metalness: 0.85,
      });
      const panel1 = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.12, 1.55), solarMat);
      panel1.position.set(-0.85, roofY + 0.42, -2.8);
      panel1.rotation.x = 0.28;
      store.add(panel1);

      const panel2 = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.12, 1.55), solarMat);
      panel2.position.set(1.05, roofY + 0.42, -3.15);
      panel2.rotation.x = 0.28;
      store.add(panel2);

      // Fortress battlements (merlons) along front parapet
      [-2.6, -1.3, 0, 1.3].forEach((bx) => {
        const merlon = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.55, 0.28), mats.darkSteelMat);
        merlon.position.set(bx, roofY + 0.45, -0.28);
        store.add(merlon);
      });

      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), mats.cyanMat);
      beacon.position.set(-2.65, roofY + 2.55, -3.75);
      store.add(beacon);
    }

    // Store Front Entrance (evolves from broken door -> repaired -> steel vestibule -> armored airlock -> citadel blast gate)
    const doorMat = level === 1 ? mats.darkWoodMat : level === 2 ? mats.woodMat : mats.darkSteelMat;
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(level >= 4 ? 1.85 : 1.5, level >= 4 ? 2.35 : 2.2, 0.24),
      doorMat,
    );
    door.position.set(0, level >= 4 ? 1.22 : 1.15, -0.35);
    if (level === 1) {
      door.rotation.z = 0.16;
      door.rotation.y = 0.14;
    }
    store.add(door);

    if (level === 2) {
      // Neat wooden porch awning over entrance
      const awning = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.16, 0.85), mats.woodMat);
      awning.position.set(0, 2.55, -0.05);
      awning.rotation.x = 0.15;
      store.add(awning);
    } else if (level >= 3) {
      // Steel Entrance Vestibule Frame
      const lintel = new THREE.Mesh(
        new THREE.BoxGeometry(level >= 4 ? 2.45 : 2.15, 0.34, level >= 4 ? 0.65 : 0.46),
        level >= 4 ? mats.hazardMat : mats.darkSteelMat,
      );
      lintel.position.set(0, 2.45, -0.22);
      store.add(lintel);

      [-1.08, 1.08].forEach((sx) => {
        const jamb = new THREE.Mesh(
          new THREE.BoxGeometry(0.28, 2.45, level >= 4 ? 0.62 : 0.42),
          mats.darkSteelMat,
        );
        jamb.position.set(sx, 1.22, -0.22);
        store.add(jamb);
      });
    }

    // Lv.2+ Entrance Sconces
    if (level >= 2) {
      [-1.12, 1.12].forEach((sx) => {
        const sconce = new THREE.Mesh(
          new THREE.BoxGeometry(0.2, 0.28, 0.18),
          level >= 5 ? mats.cyanMat : mats.emissiveWarmMat,
        );
        sconce.position.set(sx, 2.35, -0.18);
        store.add(sconce);
      });
    }

    // Front Windows (Broken Lv.1 -> Warm Intact Lv.2 -> Steel Barred Lv.3 -> Armored Slits Lv.4-5)
    const winPositions = [-2.25, 2.25];
    winPositions.forEach((wx) => {
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(1.82, 1.35, 0.22),
        level >= 2 ? mats.emissiveWarmMat : mats.glassDarkMat,
      );
      frame.position.set(wx, 1.78, -0.36);
      store.add(frame);

      if (level === 1) {
        const shard = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.15, 0.26), mats.darkWoodMat);
        shard.position.set(wx - 0.38, 1.78, -0.32);
        shard.rotation.z = 0.52;
        store.add(shard);
        const shard2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.95, 0.26), mats.darkWoodMat);
        shard2.position.set(wx + 0.42, 1.68, -0.32);
        shard2.rotation.z = -0.38;
        store.add(shard2);
      } else if (level === 2) {
        const sill = new THREE.Mesh(new THREE.BoxGeometry(1.96, 0.14, 0.3), mats.woodMat);
        sill.position.set(wx, 1.08, -0.3);
        store.add(sill);
        const header = sill.clone();
        header.position.set(wx, 2.48, -0.3);
        store.add(header);
      } else if (level === 3) {
        for (let bx = -0.65; bx <= 0.65; bx += 0.32) {
          const bar = new THREE.Mesh(new THREE.BoxGeometry(0.11, 1.42, 0.3), mats.darkSteelMat);
          bar.position.set(wx + bx, 1.78, -0.32);
          store.add(bar);
        }
        const sill = new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.16, 0.34), mats.darkSteelMat);
        sill.position.set(wx, 1.08, -0.3);
        store.add(sill);
      } else if (level >= 4) {
        const shutter = new THREE.Mesh(new THREE.BoxGeometry(1.96, 0.96, 0.28), mats.darkSteelMat);
        shutter.position.set(wx, 2.02, -0.32);
        store.add(shutter);
        for (let bx = -0.68; bx <= 0.68; bx += 0.34) {
          const bar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.42, 0.32), mats.steelMat);
          bar.position.set(wx + bx, 1.78, -0.28);
          store.add(bar);
        }
      }
    });

    // Progressive structural crack decals on store walls (excluded from occlusion fade)
    const crackConfigs: Array<{ pos: [number, number, number]; rotY: number; size: [number, number] }> = [
      { pos: [-1.8, 1.7, -0.32], rotY: 0, size: [2.8, 2.4] },
      { pos: [1.9, 1.6, -0.32], rotY: 0, size: [2.6, 2.2] },
      { pos: [storeWidth * 0.5 + 0.08, 1.6, storeCenterZ], rotY: Math.PI / 2, size: [3.2, 2.4] },
      { pos: [-(storeWidth * 0.5 + 0.08), 1.6, storeCenterZ], rotY: -Math.PI / 2, size: [3.2, 2.4] },
    ];
    crackConfigs.forEach((cfg) => {
      const cMat = new THREE.MeshBasicMaterial({
        map: crackTex,
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      });
      const cMesh = new THREE.Mesh(new THREE.PlaneGeometry(cfg.size[0], cfg.size[1]), cMat);
      cMesh.position.set(...cfg.pos);
      cMesh.rotation.y = cfg.rotY;
      cMesh.visible = false;
      cMesh.userData.noFade = true;
      store.add(cMesh);
      crackMeshes.push(cMesh);
    });

    // Fuel Canopy in front of store (evolves from weathered thin slab -> clean canopy -> steel truss -> armored canopy -> fortress superstructure)
    const canopyGroup = new THREE.Group();
    const canopyW = level === 1 ? 8.6 : level === 2 ? 9.2 : level === 3 ? 9.6 : level === 4 ? 9.8 : 10.2;
    const canopyD = level === 1 ? 4.0 : level === 2 ? 4.3 : level === 3 ? 4.6 : level === 4 ? 4.75 : 5.0;
    const canopyY = level >= 5 ? 3.85 : 3.65;

    const canopyTop = new THREE.Mesh(
      new THREE.BoxGeometry(canopyW, level >= 4 ? 0.52 : 0.42, canopyD),
      level >= 4 ? mats.darkSteelMat : level >= 3 ? mats.steelMat : mats.concreteMat,
    );
    canopyTop.position.set(0, canopyY, 2.8);
    if (level === 1) canopyTop.rotation.z = -0.02;
    canopyTop.castShadow = true;
    canopyTop.receiveShadow = true;
    canopyGroup.add(canopyTop);

    const fasciaMat =
      level >= 5
        ? mats.amberMat.clone()
        : level >= 4
          ? mats.hazardMat.clone()
          : level >= 2
            ? mats.redAccentMat.clone()
            : mats.rustMat.clone();
    const fascia = new THREE.Mesh(
      new THREE.BoxGeometry(canopyW + 0.2, level >= 4 ? 0.62 : 0.52, canopyD + 0.18),
      fasciaMat,
    );
    fascia.position.set(0, canopyY + 0.22, 2.8);
    if (level === 1) fascia.rotation.z = -0.02;
    canopyGroup.add(fascia);

    // Lv.3+: Steel connecting bridge beams between Store and Fuel Canopy
    if (level >= 3) {
      [-3.2, 3.2].forEach((bx) => {
        const beam = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.36, 1.8), mats.darkSteelMat);
        beam.position.set(bx, canopyY - 0.05, 0.25);
        canopyGroup.add(beam);
      });
    }

    // Lv.3+: Under-canopy LED Floodlight Strips
    if (level >= 3) {
      [-3.1, 0, 3.1].forEach((lx) => {
        const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.14, 0.44), mats.emissiveWarmMat);
        lamp.position.set(lx, canopyY - 0.28, 2.8);
        canopyGroup.add(lamp);
      });
    }

    // Lv.5: Twin Elevated Fortress Security Searchlight Towers on Canopy Front Corners
    if (level >= 5) {
      [-4.45, 4.45].forEach((tx) => {
        const towerPost = new THREE.Mesh(new THREE.BoxGeometry(0.34, 1.65, 0.34), mats.darkSteelMat);
        towerPost.position.set(tx, canopyY + 1.15, 4.45);
        canopyGroup.add(towerPost);
        const lampHead = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.38, 0.4), mats.emissiveWarmMat);
        lampHead.position.set(tx, canopyY + 2.02, 4.55);
        lampHead.rotation.x = 0.25;
        canopyGroup.add(lampHead);
      });
    }

    const signTex = makeGasSignTexture(level);
    const signMat = new THREE.MeshStandardMaterial({
      map: signTex,
      roughness: 0.4,
      emissive: level >= 2 ? new THREE.Color(level >= 5 ? 0xfbbf24 : 0xf59e0b) : new THREE.Color(0x000000),
      emissiveMap: level >= 2 ? signTex : null,
      emissiveIntensity: level >= 4 ? 1.0 : level >= 2 ? 0.5 : 0,
    });
    const signBoard = new THREE.Mesh(new THREE.PlaneGeometry(6.8, 1.4), signMat);
    signBoard.position.set(0, canopyY + 0.85, 2.8 + canopyD * 0.5 + 0.14);
    canopyGroup.add(signBoard);
    signBoardMesh = signBoard;

    // Canopy Pillars (all inside X: ±3.85 so non-buildable bounds stay exact)
    const pillarCoords: [number, number][] = [
      [-3.82, 1.15],
      [3.82, 1.15],
      [-3.82, 4.45],
      [3.82, 4.45],
    ];
    pillarCoords.forEach(([px, pz]) => {
      const pillarSize = level === 1 ? 0.3 : level === 2 ? 0.38 : level === 3 ? 0.48 : level === 4 ? 0.54 : 0.62;
      const pillar = new THREE.Mesh(
        new THREE.BoxGeometry(pillarSize, canopyY - 0.1, pillarSize),
        level >= 4 ? mats.hazardMat : level >= 3 ? mats.darkSteelMat : level === 2 ? mats.steelMat : mats.rustMat,
      );
      pillar.position.set(px, (canopyY - 0.1) * 0.5, pz);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      canopyGroup.add(pillar);

      if (level >= 3) {
        const baseCollar = new THREE.Mesh(
          new THREE.BoxGeometry(pillarSize + 0.24, 0.58, pillarSize + 0.24),
          level >= 5 ? mats.darkSteelMat : mats.concreteMat,
        );
        baseCollar.position.set(px, 0.29, pz);
        canopyGroup.add(baseCollar);
      }
    });

    // Fuel Pumps (rusty Lv.1 -> restored Lv.2 -> modern digital Lv.3+)
    const pumpL = buildFuelPump(mats, level);
    pumpL.position.set(-2.0, 0.08, 2.8);
    if (level === 1) pumpL.rotation.z = 0.05;
    canopyGroup.add(pumpL);

    const pumpR = buildFuelPump(mats, level);
    pumpR.position.set(2.0, 0.08, 2.8);
    if (level === 1) pumpR.rotation.z = -0.04;
    canopyGroup.add(pumpR);

    // Lv.3+: Protective Steel Bollards around fuel pump islands
    if (level >= 3) {
      const bollardOffsets: [number, number][] = [
        [-2.75, 2.2],
        [-2.75, 3.4],
        [2.75, 2.2],
        [2.75, 3.4],
      ];
      bollardOffsets.forEach(([bx, bz]) => {
        const bollard = new THREE.Mesh(
          new THREE.CylinderGeometry(0.11, 0.11, 0.88, 8),
          level >= 4 ? mats.hazardMat : mats.amberMat,
        );
        bollard.position.set(bx, 0.46, bz);
        bollard.castShadow = true;
        canopyGroup.add(bollard);
      });
    }

    // Perimeter & Functional Infrastructure by Base Level (all inside X: [-3.95, 3.95], Z: [-5.5, 5.6], keeping center path open)
    if (level === 1) {
      const tireGeo = new THREE.TorusGeometry(0.32, 0.12, 6, 12);
      tireGeo.rotateX(Math.PI / 2);
      const tireMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.95 });
      const t1 = new THREE.Mesh(tireGeo, tireMat);
      t1.position.set(-3.35, 0.14, 0.45);
      store.add(t1);
      const t2 = new THREE.Mesh(tireGeo, tireMat);
      t2.position.set(-3.1, 0.14, 4.95);
      canopyGroup.add(t2);
      const brokenBoard = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.12, 0.28), mats.darkWoodMat);
      brokenBoard.position.set(2.6, 0.12, 0.35);
      brokenBoard.rotation.y = 0.42;
      store.add(brokenBoard);
    } else if (level === 2) {
      // Wooden & sandbag defensive barricades at forecourt front corners
      [-3.2, 3.2].forEach((bx) => {
        const woodBarricade = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.85, 0.22), mats.woodMat);
        woodBarricade.position.set(bx, 0.45, 5.05);
        woodBarricade.castShadow = true;
        canopyGroup.add(woodBarricade);

        const bag = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.44, 0.45), mats.desertMat);
        bag.position.set(bx, 0.24, 4.78);
        bag.castShadow = true;
        canopyGroup.add(bag);
      });
    } else if (level === 3) {
      // Concrete Jersey barriers + steel spike rails at front corners
      [-3.15, 3.15].forEach((bx) => {
        const barrier = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.82, 0.52), mats.concreteMat);
        barrier.position.set(bx, 0.41, 5.15);
        barrier.castShadow = true;
        barrier.receiveShadow = true;
        canopyGroup.add(barrier);

        const rail = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.16, 0.16), mats.hazardMat);
        rail.position.set(bx, 0.88, 5.15);
        canopyGroup.add(rail);
      });

      // Side steel flank barricades tucked behind front canopy pillars
      [-3.82, 3.82].forEach((sx) => {
        const flank = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.95, 1.5), mats.darkSteelMat);
        flank.position.set(sx, 0.48, 0.1);
        flank.castShadow = true;
        store.add(flank);
      });
    } else if (level >= 4) {
      // Twin Reinforced Entrance Gate Pylons + Armored Rampart Barriers flanking central entry (X: -2.3..+2.3 open!)
      [-2.85, 2.85].forEach((px) => {
        const pylon = new THREE.Mesh(
          new THREE.BoxGeometry(0.68, level >= 5 ? 2.85 : 2.3, 0.68),
          mats.darkSteelMat,
        );
        pylon.position.set(px, level >= 5 ? 1.42 : 1.15, 5.25);
        pylon.castShadow = true;
        canopyGroup.add(pylon);

        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.28, 0.74), mats.hazardMat);
        stripe.position.set(px, level >= 5 ? 2.55 : 2.05, 5.25);
        canopyGroup.add(stripe);

        const lamp = new THREE.Mesh(
          new THREE.BoxGeometry(0.32, 0.22, 0.32),
          level >= 5 ? mats.cyanMat : mats.emissiveWarmMat,
        );
        lamp.position.set(px, level >= 5 ? 2.92 : 2.38, 5.25);
        canopyGroup.add(lamp);

        // Wing barrier extending outward to X: ±3.85
        const wingX = px < 0 ? px - 0.62 : px + 0.62;
        const wing = new THREE.Mesh(
          new THREE.BoxGeometry(0.95, level >= 5 ? 1.15 : 0.92, 0.56),
          level >= 5 ? mats.steelMat : mats.concreteMat,
        );
        wing.position.set(wingX, level >= 5 ? 0.58 : 0.46, 5.25);
        wing.castShadow = true;
        canopyGroup.add(wing);
      });

      // Lv.5 Fortress Overhead Entrance Gantry Span connecting the front gate pylons
      if (level >= 5) {
        const gantry = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.36, 0.46), mats.darkSteelMat);
        gantry.position.set(0, 2.78, 5.25);
        gantry.castShadow = true;
        canopyGroup.add(gantry);

        const gantryStripe = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.16, 0.5), mats.amberMat);
        gantryStripe.position.set(0, 2.82, 5.25);
        canopyGroup.add(gantryStripe);
      }

      // Lv.4+ Exterior Generator & Electrical Infrastructure on Rear/Right Roof & Flank
      const genBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.85, 1.35, 1.85),
        level >= 5 ? mats.darkSteelMat : mats.amberMat,
      );
      genBody.position.set(3.48, 0.72, -3.15);
      genBody.castShadow = true;
      store.add(genBody);

      const genVent = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 1.25), mats.steelMat);
      genVent.position.set(3.48, 1.02, -3.15);
      store.add(genVent);

      const genCoil = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.16, 0.95, 8),
        level >= 5 ? mats.cyanMat : mats.emissiveWarmMat,
      );
      genCoil.position.set(3.52, 1.65, -2.65);
      store.add(genCoil);

      // Power conduit running from generator up to rooftop
      const conduit = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, storeHeight - 0.6, 8), mats.steelMat);
      conduit.position.set(3.48, storeHeight * 0.5 + 0.3, -3.75);
      store.add(conduit);

      // Military-style organized supply containers on left flank
      const milCrate1 = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.85, 1.45), mats.greenMat);
      milCrate1.position.set(-3.55, 0.46, -2.55);
      milCrate1.castShadow = true;
      store.add(milCrate1);
      if (level >= 5) {
        const milCrate2 = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.65, 1.15), mats.darkSteelMat);
        milCrate2.position.set(-3.55, 1.2, -2.55);
        store.add(milCrate2);
      }
    }

    // Gas Station Lived-In & Organized Storage Details
    const storeVm = buildVendingMachine(mats, level >= 2);
    storeVm.position.set(3.45, 0.08, -1.65);
    storeVm.rotation.y = Math.PI / 2;
    store.add(storeVm);

    const iceBox = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 0.72, 0.65),
      level >= 4 ? mats.darkSteelMat : mats.steelMat,
    );
    iceBox.position.set(-1.35, 0.44, -0.08);
    iceBox.castShadow = true;
    store.add(iceBox);

    const storePallets = buildPalletWithCrates(mats);
    storePallets.position.set(-3.1, 0.08, -4.05);
    storePallets.scale.set(0.85, 0.85, 0.85);
    store.add(storePallets);

    if (level <= 2) {
      const trashBagMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.85 });
      const bag1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 0), trashBagMat);
      bag1.position.set(3.4, 0.25, -0.55);
      store.add(bag1);
      const bag2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22, 0), trashBagMat);
      bag2.position.set(3.15, 0.2, -0.22);
      store.add(bag2);
    } else {
      // Lv.3+ Organized Steel Supply Rack & Fuel Drums
      const locker = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.55, 0.58), mats.darkSteelMat);
      locker.position.set(3.38, 0.82, -0.25);
      locker.castShadow = true;
      store.add(locker);
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.75, 10), mats.redAccentMat);
      drum.position.set(2.75, 0.42, -0.15);
      drum.castShadow = true;
      store.add(drum);
    }

    // Parking wheel stops under canopy
    [-2.0, 2.0].forEach((px) => {
      const stop = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.14, 0.22), mats.amberMat);
      stop.position.set(px, 0.12, 4.35);
      canopyGroup.add(stop);
    });

    if (level >= 4) {
      const padBorder = new THREE.Mesh(new THREE.BoxGeometry(20, 0.08, 16), mats.concreteMat);
      padBorder.position.set(0, 0.015, 0);
      padBorder.receiveShadow = true;
      stationGroup.add(padBorder);
    }

    // Level-Appropriate Progressive Damage Groups (wood/concrete for Lv.1-2, armored steel/sparks/twisted plates for Lv.3-5)
    mediumDamageGroup = new THREE.Group();
    const debrisMat = level >= 3 ? mats.darkSteelMat : mats.concreteMat;
    const rubbleCoords: [number, number, number, number][] = [
      [-3.1, 0.18, 0.25, 0.45],
      [2.6, 0.16, 0.15, 0.38],
      [-1.4, 0.15, 3.8, 0.34],
      [3.8, 0.18, -1.2, 0.42],
      [-4.0, 0.16, -2.6, 0.36],
    ];
    rubbleCoords.forEach(([rx, ry, rz, rs], idx) => {
      const chunk =
        level >= 3
          ? new THREE.Mesh(new THREE.BoxGeometry(rs * 1.9, 0.14, rs * 1.3), idx % 2 === 0 ? mats.steelMat : mats.rustMat)
          : new THREE.Mesh(new THREE.DodecahedronGeometry(rs, 0), debrisMat);
      chunk.position.set(rx, ry, rz);
      chunk.rotation.y = idx * 0.7;
      if (level < 3) chunk.scale.set(1.2, 0.55, 0.9);
      chunk.userData.noFade = true;
      mediumDamageGroup.add(chunk);
    });
    // Damaged window shatter / bent armor shutter overlays
    [-2.25, 2.25].forEach((wx) => {
      const brokenGlass = new THREE.Mesh(
        new THREE.BoxGeometry(1.75, level >= 4 ? 0.85 : 1.25, 0.3),
        level >= 3
          ? new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.55, metalness: 0.75 })
          : new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.95 }),
      );
      brokenGlass.position.set(wx, 1.75, -0.3);
      if (level >= 3) brokenGlass.rotation.z = 0.08;
      brokenGlass.userData.noFade = true;
      mediumDamageGroup.add(brokenGlass);
    });
    stationGroup.add(mediumDamageGroup);

    lowDamageGroup = new THREE.Group();
    const sootMat = new THREE.MeshStandardMaterial({
      color: level >= 4 ? 0x0f172a : 0x1c1917,
      roughness: 0.95,
      transparent: true,
      opacity: 0.88,
    });
    const sootCoords: [number, number, number, number][] = [
      [-2.1, storeHeight + 0.25, -0.5, 1.8],
      [1.8, canopyY + 0.28, 2.4, 2.1],
      [-2.0, 1.75, 2.8, 0.95],
      [2.0, 1.75, 2.8, 0.95],
    ];
    sootCoords.forEach(([sx, sy, sz, ss]) => {
      const soot = new THREE.Mesh(new THREE.CylinderGeometry(ss * 0.5, ss * 0.7, 0.18, 10), sootMat);
      soot.position.set(sx, sy, sz);
      soot.userData.noFade = true;
      lowDamageGroup.add(soot);
    });
    // Lv.3+: Twisted metal girder & scorched armor plate on roof/canopy when heavily damaged
    if (level >= 3) {
      const bentBeam = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.18, 0.26), mats.rustMat);
      bentBeam.position.set(0.6, canopyY + 0.55, 2.2);
      bentBeam.rotation.set(0.18, 0.22, -0.25);
      bentBeam.userData.noFade = true;
      lowDamageGroup.add(bentBeam);
    }
    stationGroup.add(lowDamageGroup);

    criticalDamageGroup = new THREE.Group();
    const emberMat = new THREE.MeshBasicMaterial({
      color: level >= 4 ? 0x38bdf8 : 0xff5a1f,
      transparent: true,
      opacity: 0.9,
    });
    const emberSpots: [number, number, number][] = [
      [-2.0, 1.85, 2.8],
      [2.0, 1.75, 2.8],
      [-1.5, storeHeight + 0.3, -1.5],
      [1.8, canopyY + 0.25, 2.6],
      ...(level >= 4 ? ([[3.48, 1.55, -2.85]] as [number, number, number][]) : []),
    ];
    emberSpots.forEach(([ex, ey, ez]) => {
      const ember = new THREE.Mesh(new THREE.SphereGeometry(0.36, 8, 8), emberMat);
      ember.position.set(ex, ey, ez);
      ember.userData.noFade = true;
      criticalDamageGroup.add(ember);
    });
    criticalBeaconLight = new THREE.PointLight(0xef4444, 0, 16, 1.8);
    criticalBeaconLight.position.set(0, canopyY + 0.4, 3.2);
    criticalDamageGroup.add(criticalBeaconLight);
    stationGroup.add(criticalDamageGroup);

    // Rising smoke puffs pool for medium/low/critical HP
    const smokeGeo = new THREE.DodecahedronGeometry(0.45, 0);
    const smokeLocations: [number, number][] = [
      [-2.0, 2.8],
      [2.0, 2.8],
      [-1.5, -1.6],
      [1.6, -1.2],
      [0, 3.2],
      [level >= 4 ? 3.4 : -2.6, level >= 4 ? -3.0 : 0.2],
    ];
    smokeLocations.forEach(([sx, sz], idx) => {
      const sMat = new THREE.MeshBasicMaterial({
        color: 0x3f3f46,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      });
      const puff = new THREE.Mesh(smokeGeo, sMat);
      puff.visible = false;
      puff.userData.noFade = true;
      stationGroup.add(puff);
      smokePuffs.push({
        mesh: puff,
        phase: idx / smokeLocations.length,
        speed: 0.45 + (idx % 3) * 0.12,
        baseX: sx,
        baseZ: sz,
      });
    });

    // Warm Canopy & Entrance Point Lights (power-aware at night, stronger per tier)
    const canopyLight = new THREE.PointLight(
      level >= 5 ? 0xffe49e : 0xffcf70,
      level >= 4 ? 3.4 : level >= 3 ? 2.8 : 1.4,
      level >= 4 ? 28 : 24,
      1.5,
    );
    canopyLight.position.set(0, canopyY - 0.35, 2.8);
    stationGroup.add(canopyLight);
    nightLights.push(canopyLight);
    poweredLights.push(canopyLight);

    if (level >= 2) {
      const storeLight = new THREE.PointLight(0xffa94d, level >= 4 ? 2.6 : 2.0, 18, 1.7);
      storeLight.position.set(0, 2.6, 0.25);
      stationGroup.add(storeLight);
      nightLights.push(storeLight);
      poweredLights.push(storeLight);
    }

    stationGroup.add(store);
    stationGroup.add(canopyGroup);

    // Prepare independent fade materials for Store & Canopy so zombies behind them are always visible
    const storeFadeMats = prepareOccludableMaterials(store);
    const canopyFadeMats = prepareOccludableMaterials(canopyGroup);
    flashMats = [...storeFadeMats, ...canopyFadeMats];

    store.updateMatrixWorld(true);
    canopyGroup.updateMatrixWorld(true);

    stationOccludables.push(
      {
        id: 'station_store',
        group: store,
        box: new THREE.Box3(
          new THREE.Vector3(-4.0, 0, -5.0),
          new THREE.Vector3(4.0, storeHeight + 2.4, 0.3),
        ),
        materials: storeFadeMats,
        currentAlpha: 1,
      },
      {
        id: 'station_canopy',
        group: canopyGroup,
        box: new THREE.Box3(
          new THREE.Vector3(-5.1, 1.4, 0.3),
          new THREE.Vector3(5.1, canopyY + 2.3, 5.5),
        ),
        materials: canopyFadeMats,
        currentAlpha: 1,
      },
    );
    syncOccludablesList();
    applyDamageVisibility();
  };

  const setNightFactor = (nightFactor: number, hasBasePower = true) => {
    const mult = 0.15 + nightFactor * 1.65;
    const damageFlicker =
      currentDamageRatio <= 0.42
        ? Math.sin(flickerClock * 29) * Math.cos(flickerClock * 13) > 0.25
          ? 0.22
          : 1.0
        : 1.0;

    // Station canopy & store lights depend on power availability (or dim emergency glow)
    const powerScale = hasBasePower ? 1.0 : 0.24;
    for (const light of poweredLights) {
      light.intensity = mult * 2.5 * powerScale * damageFlicker;
    }

    // Highway streetlights & camp/outpost lanterns illuminate dark night areas
    for (const light of streetLights) {
      light.intensity = nightFactor * 3.1;
    }

    // Damaged flickering streetlight
    const brokenFlicker = Math.sin(flickerClock * 21) * Math.cos(flickerClock * 9) > 0.1 ? 1.0 : 0.12;
    for (const light of flickerLights) {
      light.intensity = nightFactor * 2.5 * brokenFlicker;
    }
  };

  const setDamageRatio = (hpRatio: number) => {
    currentDamageRatio = THREE.MathUtils.clamp(hpRatio, 0, 1);
    applyDamageVisibility();
  };

  const triggerHitFlash = () => {
    hitFlashTimer = 0.16;
    shudderTimer = 0.22;
  };

  const updateDamageFx = (
    dt: number,
    nightFactor: number,
    hasBasePower = true,
    onSpark?: (x: number, y: number, z: number) => void,
  ) => {
    flickerClock += dt;
    setNightFactor(nightFactor, hasBasePower);

    if (hitFlashTimer > 0) {
      hitFlashTimer = Math.max(0, hitFlashTimer - dt);
      const flashStrength = hitFlashTimer / 0.16;
      for (const mat of flashMats) {
        mat.emissive.setHex(0xb91c1c);
        mat.emissiveIntensity = flashStrength * 0.65;
      }
    } else if (flashMats.length > 0 && flashMats[0].emissiveIntensity > 0) {
      for (const mat of flashMats) {
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0;
      }
    }

    if (shudderTimer > 0) {
      shudderTimer = Math.max(0, shudderTimer - dt);
      const amp = (shudderTimer / 0.22) * 0.12;
      stationGroup.position.x = Math.sin(shudderTimer * 75) * amp;
      stationGroup.position.z = Math.cos(shudderTimer * 60) * amp * 0.6;
    } else if (stationGroup.position.x !== 0 || stationGroup.position.z !== 0) {
      stationGroup.position.set(0, 0, 0);
    }

    // Smoke puffs rising when medium, low, or critical damage
    const r = currentDamageRatio;
    const smokeActive = r <= 0.75;
    const activeSmokeCount = r <= 0.18 ? 6 : r <= 0.42 ? 4 : r <= 0.75 ? 2 : 0;

    smokePuffs.forEach((puff, idx) => {
      if (!smokeActive || idx >= activeSmokeCount) {
        puff.mesh.visible = false;
        return;
      }
      puff.phase = (puff.phase + dt * puff.speed) % 1;
      const t = puff.phase;
      puff.mesh.visible = true;
      puff.mesh.position.set(
        puff.baseX + Math.sin(flickerClock * 2 + idx) * 0.35,
        2.2 + t * (r <= 0.18 ? 3.8 : 2.6),
        puff.baseZ + Math.cos(flickerClock * 1.6 + idx) * 0.25,
      );
      const s = 0.65 + t * (r <= 0.18 ? 1.8 : 1.2);
      puff.mesh.scale.set(s, s * 0.85, s);
      const sMat = puff.mesh.material as THREE.MeshBasicMaterial;
      sMat.color.setHex(r <= 0.18 ? 0x1f2937 : 0x52525b);
      sMat.opacity = (1 - t) * (r <= 0.18 ? 0.75 : 0.48);
    });

    // Critical ember pulsing + periodic electrical sparks
    if (r <= 0.18 && criticalBeaconLight) {
      criticalBeaconLight.intensity = 1.6 + Math.sin(flickerClock * 14) * 1.4;
    }

    if (r <= 0.42 && onSpark) {
      sparkCooldown -= dt;
      if (sparkCooldown <= 0) {
        sparkCooldown = r <= 0.18 ? 0.45 + Math.random() * 0.4 : 1.1 + Math.random() * 0.9;
        const sx = Math.random() > 0.5 ? -2.0 : 2.0;
        const sz = Math.random() > 0.4 ? 2.8 : -0.4;
        onSpark(sx, 2.1, sz);
      }
    }
  };

  rebuildForLevel(initialLevel);

  return {
    root,
    stationGroup,
    nightLights,
    occludables,
    rebuildForLevel,
    setNightFactor,
    setDamageRatio,
    triggerHitFlash,
    updateDamageFx,
  };
}

export function createBuildingMesh(
  defId: BuildingId,
  mats: SharedMaterials,
  level = 1,
  isOpen = false,
): THREE.Group {
  const g = new THREE.Group();

  switch (defId) {
    case 'wooden_wall': {
      const post1 = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.68, 0.34), mats.darkWoodMat);
      post1.position.set(-0.84, 0.84, 0);
      post1.castShadow = true;
      g.add(post1);

      const post2 = post1.clone();
      post2.position.set(0.84, 0.84, 0);
      g.add(post2);

      for (let i = 0; i < 3; i++) {
        const plank = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.36, 0.24), mats.woodMat);
        plank.position.set(0, 0.32 + i * 0.48, 0);
        plank.castShadow = true;
        plank.receiveShadow = true;
        g.add(plank);
      }

      if (level >= 2) {
        const brace = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.22, 0.36), mats.darkWoodMat);
        brace.position.set(0, 1.48, 0);
        g.add(brace);
      }
      if (level >= 3) {
        const ironStrap = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.16, 0.38), mats.steelMat);
        ironStrap.position.set(0, 0.82, 0);
        g.add(ironStrap);
      }
      break;
    }

    case 'reinforced_wooden_wall': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(2.02, 1.75, 0.48), mats.darkWoodMat);
      base.position.y = 0.875;
      base.castShadow = true;
      base.receiveShadow = true;
      g.add(base);

      const beam = new THREE.Mesh(new THREE.BoxGeometry(2.04, 0.34, 0.54), mats.woodMat);
      beam.position.y = 1.05;
      g.add(beam);

      const steelBand = new THREE.Mesh(new THREE.BoxGeometry(2.04, 0.2, 0.56), mats.steelMat);
      steelBand.position.y = 0.42;
      g.add(steelBand);

      if (level >= 2) {
        const spikeGeo = new THREE.ConeGeometry(0.11, 0.38, 6);
        for (let sx = -0.6; sx <= 0.6; sx += 0.4) {
          const sp = new THREE.Mesh(spikeGeo, mats.steelMat);
          sp.position.set(sx, 1.92, 0);
          g.add(sp);
        }
      }
      break;
    }

    case 'stone_wall': {
      const stoneMat = new THREE.MeshStandardMaterial({
        color: 0x78716c,
        roughness: 0.9,
        metalness: 0.06,
      });
      const base = new THREE.Mesh(new THREE.BoxGeometry(2.02, 1.75, 0.72), stoneMat);
      base.position.y = 0.875;
      base.castShadow = true;
      base.receiveShadow = true;
      g.add(base);

      // Battlement blocks
      const merlonL = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.38, 0.76), mats.concreteMat);
      merlonL.position.set(-0.55, 1.9, 0);
      merlonL.castShadow = true;
      g.add(merlonL);
      const merlonR = merlonL.clone();
      merlonR.position.set(0.55, 1.9, 0);
      g.add(merlonR);

      if (level >= 2) {
        const bracket = new THREE.Mesh(new THREE.BoxGeometry(2.04, 0.22, 0.78), mats.darkSteelMat);
        bracket.position.y = 0.65;
        g.add(bracket);
      }
      if (level >= 3) {
        const topRail = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.16, 0.24), mats.steelMat);
        topRail.position.y = 2.15;
        g.add(topRail);
      }
      break;
    }

    case 'metal_wall': {
      const armor = new THREE.Mesh(new THREE.BoxGeometry(2.02, 1.85, 0.82), mats.darkSteelMat);
      armor.position.y = 0.925;
      armor.castShadow = true;
      armor.receiveShadow = true;
      g.add(armor);

      const plate = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.85, 0.88), mats.steelMat);
      plate.position.y = 1.05;
      g.add(plate);

      const hazard = new THREE.Mesh(new THREE.BoxGeometry(2.04, 0.26, 0.86), mats.hazardMat);
      hazard.position.y = 0.36;
      g.add(hazard);

      if (level >= 2) {
        const cap = new THREE.Mesh(new THREE.BoxGeometry(2.06, 0.24, 0.92), mats.steelMat);
        cap.position.y = 1.95;
        g.add(cap);
      }
      if (level >= 3) {
        const wire = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18, 0.18, 1.98, 8),
          mats.steelMat,
        );
        wire.rotation.z = Math.PI / 2;
        wire.position.y = 2.22;
        g.add(wire);
      }
      break;
    }

    case 'metal_gate': {
      const frameL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 2.0, 0.5), mats.darkSteelMat);
      frameL.position.set(-0.86, 1.0, 0);
      frameL.castShadow = true;
      g.add(frameL);

      const frameR = frameL.clone();
      frameR.position.set(0.86, 1.0, 0);
      g.add(frameR);

      const leaf = new THREE.Group();
      leaf.position.set(-0.72, 0, 0);
      const panel = new THREE.Mesh(new THREE.BoxGeometry(1.44, 1.65, 0.18), mats.steelMat);
      panel.position.set(0.72, 0.85, 0);
      panel.castShadow = true;
      leaf.add(panel);

      const hazard = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.28, 0.22), mats.hazardMat);
      hazard.position.set(0.72, 0.85, 0);
      leaf.add(hazard);

      if (isOpen) {
        leaf.rotation.y = Math.PI * 0.45;
      }
      g.userData.gateLeaf = leaf;
      g.add(leaf);
      break;
    }

    case 'auto_turret': {
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.7, 0.85, 0.45, 8),
        level >= 3 ? mats.darkSteelMat : mats.concreteMat,
      );
      base.position.y = 0.225;
      base.castShadow = true;
      base.receiveShadow = true;
      g.add(base);

      if (level >= 2) {
        const collar = new THREE.Mesh(
          new THREE.CylinderGeometry(0.76, 0.8, 0.16, 8),
          level >= 4 ? mats.hazardMat : mats.steelMat,
        );
        collar.position.y = 0.46;
        g.add(collar);
      }

      const tripod = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.52, 0.75, 8), mats.darkSteelMat);
      tripod.position.y = 0.82;
      tripod.castShadow = true;
      g.add(tripod);

      const head = new THREE.Group();
      head.position.y = 1.32;

      const housing = new THREE.Mesh(
        new THREE.BoxGeometry(level >= 3 ? 0.84 : 0.72, 0.48, 0.85),
        level >= 4 ? mats.steelMat : mats.amberMat,
      );
      housing.castShadow = true;
      head.add(housing);

      if (level >= 4) {
        const trimStripe = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.14, 0.88), mats.amberMat);
        trimStripe.position.y = 0.14;
        head.add(trimStripe);
      }

      if (level >= 2) {
        const ammoDrum = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.34, 0.44), mats.darkSteelMat);
        ammoDrum.position.set(-0.48, -0.02, 0.05);
        head.add(ammoDrum);
      }

      if (level >= 3) {
        const shield = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.36, 0.1), mats.darkSteelMat);
        shield.position.set(0, 0.06, 0.48);
        head.add(shield);

        const barrelL = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 1.0, 8), mats.darkSteelMat);
        barrelL.rotation.x = Math.PI / 2;
        barrelL.position.set(-0.14, 0.04, 0.68);
        head.add(barrelL);

        const barrelR = barrelL.clone();
        barrelR.position.set(0.14, 0.04, 0.68);
        head.add(barrelR);
      } else {
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.95, 8), mats.darkSteelMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.04, 0.65);
        head.add(barrel);
      }

      const sensor = new THREE.Mesh(
        new THREE.BoxGeometry(level >= 3 ? 0.32 : 0.24, 0.18, level >= 3 ? 0.32 : 0.24),
        level >= 4 ? mats.emissiveWarmMat : mats.cyanMat,
      );
      sensor.position.set(0, 0.32, 0.15);
      head.add(sensor);

      if (level >= 4) {
        const laserPod = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.42, 8), mats.cyanMat);
        laserPod.rotation.x = Math.PI / 2;
        laserPod.position.set(0.32, 0.28, 0.35);
        head.add(laserPod);
      }

      g.userData.turretHead = head;
      g.add(head);
      break;
    }

    case 'watchtower': {
      const legMat = level >= 4 ? mats.steelMat : mats.darkWoodMat;
      const legCoords: [number, number][] = [
        [-0.58, -0.58],
        [0.58, -0.58],
        [-0.58, 0.58],
        [0.58, 0.58],
      ];
      legCoords.forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(level >= 4 ? 0.24 : 0.2, 2.4, level >= 4 ? 0.24 : 0.2), legMat);
        leg.position.set(lx, 1.2, lz);
        leg.castShadow = true;
        g.add(leg);
      });

      if (level >= 2) {
        const midBrace = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.14, 1.36), level >= 4 ? mats.darkSteelMat : mats.woodMat);
        midBrace.position.y = 1.15;
        g.add(midBrace);
      }

      const deck = new THREE.Mesh(
        new THREE.BoxGeometry(1.68, 0.22, 1.68),
        level >= 3 ? mats.darkSteelMat : mats.woodMat,
      );
      deck.position.y = 2.35;
      deck.castShadow = true;
      g.add(deck);

      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(1.62, 0.55, 1.62),
        level >= 3 ? mats.steelMat : level >= 2 ? mats.desertMat : mats.woodMat,
      );
      rail.position.y = 2.7;
      g.add(rail);

      if (level >= 3) {
        [-0.72, 0.72].forEach((px) => {
          [-0.72, 0.72].forEach((pz) => {
            const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.1, 0.12), mats.darkSteelMat);
            post.position.set(px, 3.3, pz);
            g.add(post);
          });
        });
        const roof = new THREE.Mesh(
          new THREE.BoxGeometry(1.85, 0.16, 1.85),
          level >= 4 ? mats.hazardMat : mats.darkSteelMat,
        );
        roof.position.y = 3.88;
        roof.castShadow = true;
        g.add(roof);
      }

      if (level >= 4) {
        const beacon = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.2, 0.32), mats.emissiveWarmMat);
        beacon.position.set(0, 4.06, 0);
        g.add(beacon);
      }

      const head = new THREE.Group();
      head.position.y = 3.12;
      const gunMount = new THREE.Mesh(
        new THREE.BoxGeometry(level >= 3 ? 0.68 : 0.55, 0.36, 0.75),
        level >= 4 ? mats.darkSteelMat : mats.amberMat,
      );
      head.add(gunMount);

      const longBarrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.065, 0.085, level >= 3 ? 1.55 : 1.35, 8),
        mats.darkSteelMat,
      );
      longBarrel.rotation.x = Math.PI / 2;
      longBarrel.position.set(0, 0.05, 0.85);
      head.add(longBarrel);

      if (level >= 2) {
        const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.45, 8), mats.cyanMat);
        scope.rotation.x = Math.PI / 2;
        scope.position.set(0, 0.25, 0.28);
        head.add(scope);
      }

      if (level >= 4) {
        const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.26), mats.amberMat);
        muzzle.position.set(0, 0.05, 1.6);
        head.add(muzzle);
      }

      g.userData.turretHead = head;
      g.add(head);
      break;
    }

    case 'spike_trap': {
      const plate = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.1, 1.75), mats.darkSteelMat);
      plate.position.y = 0.05;
      plate.receiveShadow = true;
      g.add(plate);

      const spikeGeo = new THREE.ConeGeometry(0.11, 0.42, 6);
      for (let sx = -0.52; sx <= 0.52; sx += 0.52) {
        for (let sz = -0.52; sz <= 0.52; sz += 0.52) {
          const spike = new THREE.Mesh(spikeGeo, mats.redAccentMat);
          spike.position.set(sx, 0.28, sz);
          spike.castShadow = true;
          g.add(spike);
        }
      }
      break;
    }

    case 'generator': {
      const skid = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.22, 1.5), mats.darkSteelMat);
      skid.position.y = 0.11;
      skid.receiveShadow = true;
      g.add(skid);

      const engine = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.95, 1.05), mats.amberMat);
      engine.position.y = 0.7;
      engine.castShadow = true;
      g.add(engine);

      const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.75, 8), mats.steelMat);
      exhaust.position.set(0.45, 1.45, -0.25);
      g.add(exhaust);

      const core = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 1.12), mats.emissiveWarmMat);
      core.position.set(-0.25, 0.72, 0);
      g.add(core);

      const genLight = new THREE.PointLight(0xffcf70, 0, 14, 1.7);
      genLight.position.set(0, 1.75, 0);
      g.add(genLight);
      g.userData.nightPointLight = genLight;
      break;
    }

    case 'weapon_workshop': {
      const floor = new THREE.Mesh(
        new THREE.BoxGeometry(1.88, 0.2, 1.88),
        level >= 3 ? mats.darkSteelMat : mats.concreteMat,
      );
      floor.position.y = 0.1;
      floor.receiveShadow = true;
      g.add(floor);

      const bench = new THREE.Mesh(
        new THREE.BoxGeometry(1.54, 0.75, 0.8),
        level >= 3 ? mats.steelMat : mats.woodMat,
      );
      bench.position.set(0, 0.55, -0.35);
      bench.castShadow = true;
      g.add(bench);

      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.74, 1.45, 0.2), mats.darkSteelMat);
      frame.position.set(0, 0.9, -0.78);
      g.add(frame);

      const sign = new THREE.Mesh(
        new THREE.BoxGeometry(1.25, 0.32, 0.26),
        level >= 4 ? mats.amberMat : mats.cyanMat,
      );
      sign.position.set(0, 1.4, -0.74);
      g.add(sign);

      const anvil = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.42, 0.35), mats.steelMat);
      anvil.position.set(0.42, 0.42, 0.42);
      anvil.castShadow = true;
      g.add(anvil);

      if (level >= 2) {
        // Bench grinder + overhead shop lamp
        const grinder = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.32, 10), mats.amberMat);
        grinder.rotation.z = Math.PI / 2;
        grinder.position.set(-0.48, 1.04, -0.32);
        g.add(grinder);

        const lamp = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.12, 0.22), mats.emissiveWarmMat);
        lamp.position.set(0, 1.66, -0.52);
        g.add(lamp);
      }

      if (level >= 3) {
        // Steel canopy columns & roof + ammo press + diagnostic screen
        [-0.82, 0.82].forEach((cx) => {
          const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.9, 0.16), mats.darkSteelMat);
          post.position.set(cx, 1.05, 0.65);
          post.castShadow = true;
          g.add(post);
        });
        const roof = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.16, 1.85), mats.darkSteelMat);
        roof.position.set(0, 2.02, -0.05);
        roof.castShadow = true;
        g.add(roof);

        const monitor = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.34, 0.12), mats.cyanMat);
        monitor.position.set(0.35, 1.12, -0.45);
        g.add(monitor);
      }

      if (level >= 4) {
        // Armored CNC side shields & golden ordnance beacon
        const hazardTrim = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.18, 1.9), mats.hazardMat);
        hazardTrim.position.set(0, 2.12, -0.05);
        g.add(hazardTrim);

        const cncTower = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.1, 0.45), mats.amberMat);
        cncTower.position.set(-0.56, 0.72, 0.42);
        cncTower.castShadow = true;
        g.add(cncTower);

        const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.26, 8), mats.emissiveWarmMat);
        beacon.position.set(0, 2.34, -0.05);
        g.add(beacon);
      }
      break;
    }

    case 'storage': {
      const pad = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.18, 1.85), mats.concreteMat);
      pad.position.y = 0.09;
      g.add(pad);

      const container = new THREE.Mesh(new THREE.BoxGeometry(1.65, 1.35, 1.45), mats.greenMat);
      container.position.y = 0.85;
      container.castShadow = true;
      container.receiveShadow = true;
      g.add(container);

      const trim = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.2, 1.52), mats.darkSteelMat);
      trim.position.y = 1.55;
      g.add(trim);

      const goldBox = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 0.55), mats.amberMat);
      goldBox.position.set(0.4, 1.82, 0.2);
      g.add(goldBox);
      break;
    }

    case 'adv_turret': {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.92, 0.55, 10), mats.darkSteelMat);
      base.position.y = 0.275;
      base.castShadow = true;
      g.add(base);

      if (level >= 4) {
        const armorRing = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.95, 0.2, 10), mats.hazardMat);
        armorRing.position.y = 0.55;
        g.add(armorRing);
      }

      const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.58, 0.8, 10), mats.steelMat);
      ped.position.y = 0.92;
      g.add(ped);

      const head = new THREE.Group();
      head.position.y = 1.45;
      const body = new THREE.Mesh(new THREE.BoxGeometry(level >= 3 ? 1.05 : 0.95, 0.52, 0.95), mats.cyanMat);
      body.castShadow = true;
      head.add(body);

      if (level >= 2) {
        [-0.58, 0.58].forEach((hx) => {
          const hopper = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.36, 0.56), mats.darkSteelMat);
          hopper.position.set(hx, 0.02, 0);
          head.add(hopper);
        });
      }

      const barrelL = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, level >= 3 ? 1.28 : 1.15, 8), mats.darkSteelMat);
      barrelL.rotation.x = Math.PI / 2;
      barrelL.position.set(-0.22, 0.04, 0.74);
      head.add(barrelL);

      const barrelR = barrelL.clone();
      barrelR.position.set(0.22, 0.04, 0.74);
      head.add(barrelR);

      if (level >= 3) {
        const radarFin = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.2, 0.34), mats.darkSteelMat);
        radarFin.position.set(0, 0.36, -0.1);
        head.add(radarFin);
      }

      if (level >= 4) {
        const core = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.36), mats.emissiveWarmMat);
        core.position.set(0, 0.42, 0.25);
        head.add(core);
      }

      g.userData.turretHead = head;
      g.add(head);
      break;
    }

    case 'heavy_tower': {
      const bunker = new THREE.Mesh(
        new THREE.CylinderGeometry(0.85, 0.98, 1.9, 8),
        level >= 3 ? mats.darkSteelMat : mats.concreteMat,
      );
      bunker.position.y = 0.95;
      bunker.castShadow = true;
      g.add(bunker);

      if (level >= 2) {
        for (let i = 0; i < 4; i++) {
          const ang = (i * Math.PI) / 2 + Math.PI / 4;
          const rib = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.75, 0.22), mats.steelMat);
          rib.position.set(Math.cos(ang) * 0.88, 0.9, Math.sin(ang) * 0.88);
          g.add(rib);
        }
      }

      const armorRing = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.92, 0.35, 8), mats.hazardMat);
      armorRing.position.y = 1.75;
      g.add(armorRing);

      const head = new THREE.Group();
      head.position.y = 2.25;
      const dome = new THREE.Mesh(
        new THREE.BoxGeometry(level >= 3 ? 1.18 : 1.05, 0.65, 1.15),
        mats.redAccentMat,
      );
      dome.castShadow = true;
      head.add(dome);

      const cannon = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.18, level >= 3 ? 1.52 : 1.35, 10),
        mats.darkSteelMat,
      );
      cannon.rotation.x = Math.PI / 2;
      cannon.position.set(0, 0.06, 0.88);
      head.add(cannon);

      if (level >= 3) {
        const mantlet = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.5, 0.18), mats.darkSteelMat);
        mantlet.position.set(0, 0.04, 0.62);
        head.add(mantlet);

        const muzzleBrake = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.28, 0.24), mats.amberMat);
        muzzleBrake.position.set(0, 0.06, 1.6);
        head.add(muzzleBrake);
      }

      if (level >= 4) {
        [-0.68, 0.68].forEach((px) => {
          const pod = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.36, 0.55), mats.hazardMat);
          pod.position.set(px, 0.08, 0.1);
          head.add(pod);
        });
        const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.22, 8), mats.emissiveWarmMat);
        beacon.position.set(0, 0.44, -0.15);
        head.add(beacon);
      }

      g.userData.turretHead = head;
      g.add(head);
      break;
    }

    case 'med_station': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.2, 1.8), mats.concreteMat);
      base.position.y = 0.1;
      g.add(base);

      const tent = new THREE.Mesh(
        new THREE.BoxGeometry(1.55, 1.3, 1.4),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.65 }),
      );
      tent.position.y = 0.85;
      tent.castShadow = true;
      g.add(tent);

      const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.22, 0.12), mats.greenMat);
      crossH.position.set(0, 1.65, 0);
      g.add(crossH);

      const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.75, 0.12), mats.greenMat);
      crossV.position.set(0, 1.65, 0);
      g.add(crossV);
      break;
    }

    case 'adv_generator': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.26, 1.65), mats.darkSteelMat);
      base.position.y = 0.13;
      g.add(base);

      const turbine = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 1.35, 12), mats.amberMat);
      turbine.position.set(-0.2, 0.9, 0);
      turbine.castShadow = true;
      g.add(turbine);

      const coil = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 1.5, 10), mats.cyanMat);
      coil.position.set(0.5, 0.95, 0);
      g.add(coil);

      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.7, 8), mats.steelMat);
      mast.position.set(-0.55, 1.45, -0.45);
      g.add(mast);

      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.22, 0.28), mats.emissiveWarmMat);
      lamp.position.set(-0.55, 2.8, -0.45);
      g.add(lamp);

      const advGenLight = new THREE.PointLight(0xfef08a, 0, 20, 1.5);
      advGenLight.position.set(-0.55, 2.65, -0.45);
      g.add(advGenLight);
      g.userData.nightPointLight = advGenLight;
      break;
    }

    default: {
      const fallback = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 1.6), mats.steelMat);
      fallback.position.y = 0.6;
      g.add(fallback);
    }
  }

  return g;
}

export function createWallConnectorArm(
  defId: BuildingId,
  mats: SharedMaterials,
  dirX: number,
  dirZ: number,
): THREE.Group {
  const arm = new THREE.Group();
  const isHorizArm = dirX !== 0;
  const thick =
    defId === 'wooden_wall'
      ? 0.28
      : defId === 'reinforced_wooden_wall'
        ? 0.46
        : defId === 'stone_wall'
          ? 0.68
          : defId === 'metal_wall'
            ? 0.78
            : 0.34;
  const height =
    defId === 'wooden_wall'
      ? 1.5
      : defId === 'reinforced_wooden_wall'
        ? 1.72
        : defId === 'stone_wall'
          ? 1.72
          : defId === 'metal_wall'
            ? 1.82
            : 1.65;
  const mat =
    defId === 'wooden_wall'
      ? mats.woodMat
      : defId === 'reinforced_wooden_wall'
        ? mats.darkWoodMat
        : defId === 'stone_wall'
          ? mats.concreteMat
          : mats.darkSteelMat;

  const geo = isHorizArm
    ? new THREE.BoxGeometry(1.02, height, thick)
    : new THREE.BoxGeometry(thick, height, 1.02);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(dirX * 0.51, height * 0.5, dirZ * 0.51);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  arm.add(mesh);

  if (defId === 'metal_wall' || defId === 'reinforced_wooden_wall') {
    const bandGeo = isHorizArm
      ? new THREE.BoxGeometry(1.04, 0.22, thick + 0.06)
      : new THREE.BoxGeometry(thick + 0.06, 0.22, 1.04);
    const band = new THREE.Mesh(bandGeo, defId === 'metal_wall' ? mats.hazardMat : mats.steelMat);
    band.position.set(dirX * 0.51, 0.38, dirZ * 0.51);
    arm.add(band);
  }
  return arm;
}

export function createResourceNodeMesh(
  kind: ResourceNodeKind,
  mats: SharedMaterials,
  variant = 0,
): THREE.Group {
  const g = new THREE.Group();

  if (kind === 'tree_small' || kind === 'tree_large') {
    const vScale = 0.88 + (variant % 4) * 0.09;
    const scale = (kind === 'tree_large' ? 1.32 : 0.92) * vScale;
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24 * scale, 0.36 * scale, 1.8 * scale, 8),
      mats.darkWoodMat,
    );
    trunk.position.y = 0.9 * scale;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    g.add(trunk);

    const leafPaletteDark = [0x2f5e2e, 0x3b6130, 0x2a4f38, 0x4b5d2b][variant % 4];
    const leafPaletteLight = [0x437c3b, 0x527a3c, 0x386948, 0x627337][variant % 4];
    const leafDark = new THREE.MeshStandardMaterial({ color: leafPaletteDark, roughness: 0.88 });
    const leafLight = new THREE.MeshStandardMaterial({ color: leafPaletteLight, roughness: 0.86 });

    const cone1 = new THREE.Mesh(new THREE.ConeGeometry(1.35 * scale, 2.0 * scale, 7 + (variant % 2)), leafDark);
    cone1.position.y = 2.3 * scale;
    cone1.castShadow = true;
    g.add(cone1);

    const cone2 = new THREE.Mesh(new THREE.ConeGeometry(1.0 * scale, 1.7 * scale, 7 + (variant % 2)), leafLight);
    cone2.position.y = 3.3 * scale;
    cone2.castShadow = true;
    g.add(cone2);

    if (kind === 'tree_large') {
      const cone3 = new THREE.Mesh(new THREE.ConeGeometry(0.68 * scale, 1.3 * scale, 7), leafDark);
      cone3.position.y = 4.2 * scale;
      cone3.castShadow = true;
      g.add(cone3);
    }
  } else if (kind === 'rock_small' || kind === 'rock_large') {
    const vScale = 0.88 + (variant % 3) * 0.12;
    const scale = (kind === 'rock_large' ? 1.55 : 0.95) * vScale;
    const rockColors = [0x78716c, 0x6b645c, 0x57534e, 0x82796e];
    const stoneMat = new THREE.MeshStandardMaterial({ color: rockColors[variant % 4], roughness: 0.9 });
    const darkStoneMat = new THREE.MeshStandardMaterial({ color: 0x44403c, roughness: 0.92 });

    const mainRock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.95 * scale, variant % 2), stoneMat);
    mainRock.scale.set(1.15, 0.72 + (variant % 3) * 0.1, 0.95);
    mainRock.position.y = 0.62 * scale;
    mainRock.castShadow = true;
    mainRock.receiveShadow = true;
    g.add(mainRock);

    const subRock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.58 * scale, 0), darkStoneMat);
    subRock.position.set(0.65 * scale * (variant % 2 === 0 ? 1 : -0.8), 0.4 * scale, 0.4 * scale);
    subRock.castShadow = true;
    g.add(subRock);
  } else if (kind === 'mineral_vein') {
    const baseRock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1.25, 0),
      new THREE.MeshStandardMaterial({ color: 0x44403c, roughness: 0.88 }),
    );
    baseRock.scale.set(1.2, 0.85, 1.1);
    baseRock.position.y = 0.8;
    baseRock.castShadow = true;
    g.add(baseRock);

    const oreMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: new THREE.Color(0x0284c7),
      emissiveIntensity: 0.55,
      roughness: 0.25,
      metalness: 0.7,
    });
    const crystalCoords: [number, number, number, number][] = [
      [-0.45, 1.35, 0.2, 0.3],
      [0.35, 1.45, -0.15, -0.4],
      [0.1, 1.15, 0.55, 0.5],
    ];
    crystalCoords.forEach(([cx, cy, cz, rot]) => {
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), oreMat);
      crystal.position.set(cx, cy, cz);
      crystal.rotation.z = rot;
      crystal.scale.set(0.7, 1.5, 0.7);
      g.add(crystal);
    });
  } else if (kind === 'scrap_wreck') {
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.7, 1.3), mats.rustMat);
    chassis.position.y = 0.42;
    chassis.rotation.y = 0.3;
    chassis.castShadow = true;
    g.add(chassis);

    const beam = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.25, 0.28), mats.steelMat);
    beam.position.set(0.2, 0.85, -0.15);
    beam.rotation.z = 0.25;
    beam.castShadow = true;
    g.add(beam);

    const gear = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.22, 10), mats.darkSteelMat);
    gear.rotation.x = Math.PI / 2;
    gear.position.set(-0.75, 0.4, 0.65);
    g.add(gear);
  } else if (kind === 'dig_mound') {
    const dirtMat = new THREE.MeshStandardMaterial({ color: 0x6b4f35, roughness: 0.95 });
    const mound = new THREE.Mesh(new THREE.SphereGeometry(1.0, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), dirtMat);
    mound.scale.set(1.2, 0.55, 1.1);
    mound.receiveShadow = true;
    g.add(mound);

    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.45, 0.65), mats.woodMat);
    crate.position.set(0.15, 0.35, -0.1);
    crate.rotation.set(0.2, 0.4, -0.15);
    crate.castShadow = true;
    g.add(crate);
  }

  return g;
}

