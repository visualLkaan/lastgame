import { AudioSettings, WeaponId, ZombieType } from './types';

const AUDIO_STORAGE_KEY = 'last_stop_audio_v1';

export type AudioBus = 'sfx' | 'ambient' | 'music';

export interface ExternalAudioSlot {
  key: string;
  bus: AudioBus;
  category: 'weapons' | 'zombies' | 'building' | 'gathering' | 'ambience';
  description: string;
}

/**
 * Asset integration manifest for optional studio Foley packs (.ogg / .wav).
 * When external audio files are provided via `loadExternalAudioPack(urlMap)`,
 * playback automatically routes through the cached AudioBuffers with 3D panning & reverb.
 */
export const AUDIO_ASSET_SLOTS: ExternalAudioSlot[] = [
  { key: 'weapon.bat.swing', bus: 'sfx', category: 'weapons', description: 'Ahşap sopa savurma sesi' },
  { key: 'weapon.bat.hit_flesh', bus: 'sfx', category: 'weapons', description: 'Ahşap sopa zombi darbesi' },
  { key: 'weapon.bat.hit_object', bus: 'sfx', category: 'weapons', description: 'Ahşap sopa sert yüzey darbesi' },
  { key: 'weapon.pipe.hit_flesh', bus: 'sfx', category: 'weapons', description: 'Metal boru zombi darbesi' },
  { key: 'weapon.pipe.hit_metal', bus: 'sfx', category: 'weapons', description: 'Metal boru metalik çınlama' },
  { key: 'weapon.pistol.fire', bus: 'sfx', category: 'weapons', description: '9mm tabanca atış ve yankı' },
  { key: 'weapon.pistol.reload', bus: 'sfx', category: 'weapons', description: 'Tabanca şarjör değişimi' },
  { key: 'weapon.shotgun.fire', bus: 'sfx', category: 'weapons', description: 'Pompalı tüfek ağır patlama' },
  { key: 'weapon.shotgun.reload', bus: 'sfx', category: 'weapons', description: 'Pompalı fişek ve kurma sesi' },
  { key: 'weapon.rifle.fire', bus: 'sfx', category: 'weapons', description: 'Taarruz tüfeği atış sesi' },
  { key: 'weapon.rifle.reload', bus: 'sfx', category: 'weapons', description: 'Taarruz tüfeği şarjör kilidi' },
  { key: 'zombie.normal.groan', bus: 'sfx', category: 'zombies', description: 'Normal zombi hırıltısı' },
  { key: 'zombie.runner.screech', bus: 'sfx', category: 'zombies', description: 'Koşucu zombi çığlığı' },
  { key: 'zombie.heavy.roar', bus: 'sfx', category: 'zombies', description: 'Ağır zombi derin kükremesi' },
  { key: 'zombie.boss.bellow', bus: 'sfx', category: 'zombies', description: 'Alfa Boss kükreme ve darbe' },
  { key: 'gather.tree.fall', bus: 'sfx', category: 'gathering', description: 'Ağaç devrilme sesi' },
  { key: 'ambience.day.wind', bus: 'ambient', category: 'ambience', description: 'Gündüz rüzgar ve yaprak hışırtısı' },
  { key: 'ambience.night.wind', bus: 'ambient', category: 'ambience', description: 'Gece rüzgar ve böcek ortamı' },
];

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function loadAudioSettings(): AudioSettings {
  const defaults: AudioSettings = {
    masterVolume: 0.85,
    musicVolume: 0.45,
    sfxVolume: 0.9,
    ambientVolume: 0.65,
    muted: false,
  };
  try {
    const raw = localStorage.getItem(AUDIO_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<AudioSettings>;
    return {
      masterVolume: typeof parsed.masterVolume === 'number' ? clamp01(parsed.masterVolume) : defaults.masterVolume,
      musicVolume: typeof parsed.musicVolume === 'number' ? clamp01(parsed.musicVolume) : defaults.musicVolume,
      sfxVolume: typeof parsed.sfxVolume === 'number' ? clamp01(parsed.sfxVolume) : defaults.sfxVolume,
      ambientVolume: typeof parsed.ambientVolume === 'number' ? clamp01(parsed.ambientVolume) : defaults.ambientVolume,
      muted: Boolean(parsed.muted),
    };
  } catch {
    return defaults;
  }
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private reverbReturnGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private externalBuffers = new Map<string, AudioBuffer>();
  private cooldownMap = new Map<string, number>();
  private lastVariantMap = new Map<string, number>();

  private listenerX = 0;
  private listenerZ = 7.5;
  private nearStationFactor = 1;

  // Ambient & music continuous nodes
  private ambienceStarted = false;
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private buzzGain: GainNode | null = null;
  private musicPadGain: GainNode | null = null;
  private musicFilter: BiquadFilterNode | null = null;
  private ambientEventTimer = 2.5;

  private settings: AudioSettings =
    typeof window !== 'undefined'
      ? loadAudioSettings()
      : {
          masterVolume: 0.85,
          musicVolume: 0.45,
          sfxVolume: 0.9,
          ambientVolume: 0.65,
          muted: false,
        };

  public get muted(): boolean {
    return this.settings.muted;
  }

  public set muted(val: boolean) {
    this.setSettings({ muted: val });
  }

  public getSettings(): AudioSettings {
    return { ...this.settings };
  }

  public setSettings(patch: Partial<AudioSettings>) {
    this.settings = {
      masterVolume:
        patch.masterVolume !== undefined ? clamp01(patch.masterVolume) : this.settings.masterVolume,
      musicVolume:
        patch.musicVolume !== undefined ? clamp01(patch.musicVolume) : this.settings.musicVolume,
      sfxVolume:
        patch.sfxVolume !== undefined ? clamp01(patch.sfxVolume) : this.settings.sfxVolume,
      ambientVolume:
        patch.ambientVolume !== undefined ? clamp01(patch.ambientVolume) : this.settings.ambientVolume,
      muted: patch.muted !== undefined ? patch.muted : this.settings.muted,
    };

    try {
      localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(this.settings));
    } catch {
      // Ignore storage errors
    }
    this.applyGainLevels();
  }

  private applyGainLevels() {
    if (!this.ctx || !this.masterGain || !this.sfxGain || !this.ambientGain || !this.musicGain) {
      return;
    }
    const now = this.ctx.currentTime;
    const master = this.settings.muted ? 0 : this.settings.masterVolume;
    this.masterGain.gain.setTargetAtTime(master, now, 0.03);
    this.sfxGain.gain.setTargetAtTime(this.settings.sfxVolume, now, 0.03);
    this.ambientGain.gain.setTargetAtTime(this.settings.ambientVolume, now, 0.05);
    this.musicGain.gain.setTargetAtTime(this.settings.musicVolume, now, 0.08);
  }

  private createNoiseBuffer(ctx: AudioContext, seconds = 2.0): AudioBuffer {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.997 * b0 + white * 0.029;
      b1 = 0.985 * b1 + white * 0.032;
      b2 = 0.95 * b2 + white * 0.048;
      data[i] = (b0 + b1 + b2 + white * 0.12) * 0.6;
    }
    return buf;
  }

  private createReverbImpulse(ctx: AudioContext): AudioBuffer {
    const duration = 1.1;
    const len = Math.floor(ctx.sampleRate * duration);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        const t = i / len;
        const env = Math.pow(1 - t, 2.8);
        data[i] = (Math.random() * 2 - 1) * env * 0.5;
      }
    }
    return buf;
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      const ctx = new AudioCtx();
      this.ctx = ctx;

      this.masterGain = ctx.createGain();
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -16;
      compressor.knee.value = 18;
      compressor.ratio.value = 5;
      compressor.attack.value = 0.004;
      compressor.release.value = 0.16;

      this.sfxGain = ctx.createGain();
      this.ambientGain = ctx.createGain();
      this.musicGain = ctx.createGain();

      this.reverbNode = ctx.createConvolver();
      this.reverbNode.buffer = this.createReverbImpulse(ctx);
      this.reverbReturnGain = ctx.createGain();
      this.reverbReturnGain.gain.value = 0.24;

      this.sfxGain.connect(compressor);
      this.reverbNode.connect(this.reverbReturnGain);
      this.reverbReturnGain.connect(compressor);

      compressor.connect(this.masterGain);
      this.ambientGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);
      this.masterGain.connect(ctx.destination);

      this.noiseBuffer = this.createNoiseBuffer(ctx, 2.5);
      this.applyGainLevels();
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public registerExternalBuffer(key: string, buffer: AudioBuffer) {
    this.externalBuffers.set(key, buffer);
  }

  public async loadExternalAudioPack(urlMap: Record<string, string>): Promise<number> {
    const ctx = this.ensureContext();
    if (!ctx) return 0;
    let loaded = 0;
    await Promise.all(
      Object.entries(urlMap).map(async ([key, url]) => {
        try {
          const res = await fetch(url);
          if (!res.ok) return;
          const arr = await res.arrayBuffer();
          const decoded = await ctx.decodeAudioData(arr);
          this.externalBuffers.set(key, decoded);
          loaded += 1;
        } catch {
          // Graceful fallback to procedural acoustic engine
        }
      }),
    );
    return loaded;
  }

  private tryPlayExternalBuffer(
    key: string,
    worldX?: number,
    worldZ?: number,
    baseGain = 0.85,
    rateSpread = 0.06,
  ): boolean {
    const buf = this.externalBuffers.get(key);
    const ctx = this.ensureContext();
    if (!buf || !ctx || !this.sfxGain) return false;
    const spatial = this.computeSpatial(worldX, worldZ);
    if (spatial.gain <= 0.02) return true;

    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = 1 + (Math.random() * 2 - 1) * rateSpread;

    const g = ctx.createGain();
    g.gain.value = baseGain * spatial.gain;

    const panner = this.createPanner(ctx, spatial.pan);
    src.connect(g);
    g.connect(panner);
    panner.connect(this.sfxGain);
    if (this.reverbNode && spatial.reverb > 0.04) {
      const revSend = ctx.createGain();
      revSend.gain.value = spatial.reverb * 0.45;
      panner.connect(revSend);
      revSend.connect(this.reverbNode);
    }
    src.start(ctx.currentTime);
    return true;
  }

  private canPlay(key: string, minGapMs: number): boolean {
    const now = performance.now();
    const prev = this.cooldownMap.get(key) || 0;
    if (now - prev < minGapMs) return false;
    this.cooldownMap.set(key, now);
    return true;
  }

  private pickVariant(key: string, count: number): number {
    if (count <= 1) return 0;
    const prev = this.lastVariantMap.get(key);
    let idx = Math.floor(Math.random() * count);
    if (idx === prev) {
      idx = (idx + 1 + Math.floor(Math.random() * (count - 1))) % count;
    }
    this.lastVariantMap.set(key, idx);
    return idx;
  }

  public updateListener(x: number, z: number) {
    this.listenerX = x;
    this.listenerZ = z;
    const stationDist = Math.hypot(x, z - 0.5);
    this.nearStationFactor = Math.max(0, Math.min(1, 1 - (stationDist - 4) / 14));
  }

  private computeSpatial(worldX?: number, worldZ?: number): {
    gain: number;
    pan: number;
    reverb: number;
  } {
    if (worldX === undefined || worldZ === undefined) {
      return {
        gain: 1,
        pan: 0,
        reverb: 0.22 + this.nearStationFactor * 0.16,
      };
    }
    const dx = worldX - this.listenerX;
    const dz = worldZ - this.listenerZ;
    const dist = Math.hypot(dx, dz);
    if (dist > 44) return { gain: 0, pan: 0, reverb: 0 };
    const atten = 1 / (1 + dist * 0.105);
    const pan = Math.max(-0.88, Math.min(0.88, dx / 18));
    const reverb = Math.min(0.65, 0.16 + dist * 0.014 + this.nearStationFactor * 0.14);
    return { gain: atten, pan, reverb };
  }

  private createPanner(ctx: AudioContext, pan: number): AudioNode {
    if (typeof ctx.createStereoPanner === 'function') {
      const p = ctx.createStereoPanner();
      p.pan.value = pan;
      return p;
    }
    const g = ctx.createGain();
    return g;
  }

  private routeNode(
    ctx: AudioContext,
    sourceOut: AudioNode,
    worldX?: number,
    worldZ?: number,
    reverbMult = 1,
  ) {
    if (!this.sfxGain) return;
    const spatial = this.computeSpatial(worldX, worldZ);
    const attenGain = ctx.createGain();
    attenGain.gain.value = spatial.gain;
    const panner = this.createPanner(ctx, spatial.pan);

    sourceOut.connect(attenGain);
    attenGain.connect(panner);
    panner.connect(this.sfxGain);

    if (this.reverbNode && spatial.reverb * reverbMult > 0.03) {
      const revSend = ctx.createGain();
      revSend.gain.value = spatial.reverb * reverbMult;
      panner.connect(revSend);
      revSend.connect(this.reverbNode);
    }
  }

  private spawnFilteredNoise(
    ctx: AudioContext,
    duration: number,
    filterType: BiquadFilterType,
    freqStart: number,
    freqEnd: number,
    q: number,
    gainPeak: number,
    worldX?: number,
    worldZ?: number,
    reverbMult = 0.7,
    delayOffset = 0,
  ) {
    if (!this.noiseBuffer) return;
    const now = ctx.currentTime + delayOffset;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.Q.value = q;
    filter.frequency.setValueAtTime(Math.max(40, freqStart), now);
    filter.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), now + duration);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(gainPeak, now + Math.min(0.015, duration * 0.2));
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    src.connect(filter);
    filter.connect(g);
    this.routeNode(ctx, g, worldX, worldZ, reverbMult);

    src.start(now, Math.random() * 1.2);
    src.stop(now + duration + 0.02);
  }

  // ==================== WEAPON AUDIO ====================

  public playSwing(heavy = false, weaponId?: WeaponId) {
    if (this.settings.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const extKey = weaponId === 'wooden_bat' ? 'weapon.bat.swing' : 'weapon.pipe.swing';
    if (this.tryPlayExternalBuffer(extKey)) return;
    if (!this.canPlay('swing', 90)) return;

    const v = this.pickVariant('swing', 3);
    const pitch = (heavy ? 0.82 : 1.0) * (0.94 + v * 0.06 + (Math.random() - 0.5) * 0.05);
    this.spawnFilteredNoise(
      ctx,
      heavy ? 0.19 : 0.14,
      'bandpass',
      (heavy ? 480 : 720) * pitch,
      (heavy ? 180 : 290) * pitch,
      1.6,
      heavy ? 0.24 : 0.18,
      undefined,
      undefined,
      0.2,
    );
  }

  public playMeleeHit(
    weaponId: WeaponId | 'tool',
    surface: 'flesh' | 'wood' | 'stone' | 'metal',
    worldX?: number,
    worldZ?: number,
  ) {
    if (this.settings.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (!this.canPlay(`melee_hit_${surface}`, 45)) return;

    if (weaponId === 'wooden_bat') {
      const key = surface === 'flesh' ? 'weapon.bat.hit_flesh' : 'weapon.bat.hit_object';
      if (this.tryPlayExternalBuffer(key, worldX, worldZ)) return;
    } else if (weaponId === 'metal_pipe') {
      const key = surface === 'flesh' ? 'weapon.pipe.hit_flesh' : 'weapon.pipe.hit_metal';
      if (this.tryPlayExternalBuffer(key, worldX, worldZ)) return;
    }

    const now = ctx.currentTime;
    const v = this.pickVariant(`mh_${weaponId}_${surface}`, 4);
    const jitter = 0.93 + (v * 0.04) + Math.random() * 0.04;

    if (weaponId === 'metal_pipe' || surface === 'metal') {
      // Metallic pipe ring + low impact punch
      const partials = [410, 885, 1490];
      partials.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = idx === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(f * jitter, now);
        osc.frequency.exponentialRampToValueAtTime(f * jitter * 0.96, now + 0.24);
        const amp = (idx === 0 ? 0.16 : 0.08) * (surface === 'metal' ? 1.25 : 0.85);
        g.gain.setValueAtTime(amp, now);
        g.gain.exponentialRampToValueAtTime(0.0005, now + (idx === 0 ? 0.22 : 0.3));
        osc.connect(g);
        this.routeNode(ctx, g, worldX, worldZ, 0.55);
        osc.start(now);
        osc.stop(now + 0.32);
      });
      this.spawnFilteredNoise(ctx, 0.08, 'bandpass', 1600 * jitter, 520, 1.4, 0.22, worldX, worldZ, 0.4);
    } else if (weaponId === 'wooden_bat') {
      // Natural hollow wood bat knock/thud
      const baseFreq = surface === 'flesh' ? 155 : 295;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq * jitter, now);
      osc.frequency.exponentialRampToValueAtTime((surface === 'flesh' ? 58 : 115) * jitter, now + 0.1);
      g.gain.setValueAtTime(0.28, now);
      g.gain.exponentialRampToValueAtTime(0.0005, now + 0.11);
      osc.connect(g);
      this.routeNode(ctx, g, worldX, worldZ, 0.3);
      osc.start(now);
      osc.stop(now + 0.12);

      this.spawnFilteredNoise(
        ctx,
        0.075,
        'bandpass',
        (surface === 'flesh' ? 680 : 1150) * jitter,
        320,
        1.8,
        0.2,
        worldX,
        worldZ,
        0.25,
      );
    } else {
      this.playHit(false, worldX, worldZ);
    }
  }

  public playGunshot(
    kind: 'pistol' | 'shotgun' | 'rifle' | 'heavy' | 'turret',
    worldX?: number,
    worldZ?: number,
  ) {
    if (this.settings.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const minGap = kind === 'turret' ? 68 : kind === 'rifle' || kind === 'heavy' ? 52 : 70;
    if (!this.canPlay(`gun_${kind}`, minGap)) return;

    const extKey =
      kind === 'pistol'
        ? 'weapon.pistol.fire'
        : kind === 'shotgun'
          ? 'weapon.shotgun.fire'
          : 'weapon.rifle.fire';
    if (this.tryPlayExternalBuffer(extKey, worldX, worldZ)) return;

    const now = ctx.currentTime;
    const v = this.pickVariant(`gun_${kind}`, 4);
    const pitch = 0.94 + v * 0.035 + (Math.random() - 0.5) * 0.04;

    if (kind === 'pistol') {
      // Crisp 9mm snap + mechanical slide + outdoor tail
      const punch = ctx.createOscillator();
      const pGain = ctx.createGain();
      punch.type = 'triangle';
      punch.frequency.setValueAtTime(260 * pitch, now);
      punch.frequency.exponentialRampToValueAtTime(62, now + 0.06);
      pGain.gain.setValueAtTime(0.26, now);
      pGain.gain.exponentialRampToValueAtTime(0.0005, now + 0.07);
      punch.connect(pGain);
      this.routeNode(ctx, pGain, worldX, worldZ, 0.6);
      punch.start(now);
      punch.stop(now + 0.075);

      this.spawnFilteredNoise(ctx, 0.13, 'bandpass', 2400 * pitch, 620, 0.85, 0.34, worldX, worldZ, 0.85);
    } else if (kind === 'shotgun') {
      // Heavy low-frequency chest thump + wide blast
      const sub = ctx.createOscillator();
      const sGain = ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(125 * pitch, now);
      sub.frequency.exponentialRampToValueAtTime(34, now + 0.18);
      sGain.gain.setValueAtTime(0.42, now);
      sGain.gain.exponentialRampToValueAtTime(0.0005, now + 0.2);
      sub.connect(sGain);
      this.routeNode(ctx, sGain, worldX, worldZ, 0.85);
      sub.start(now);
      sub.stop(now + 0.21);

      this.spawnFilteredNoise(ctx, 0.25, 'lowpass', 2600 * pitch, 340, 0.7, 0.45, worldX, worldZ, 1.1);
    } else if (kind === 'rifle') {
      // Tight automatic rifle crack
      const snap = ctx.createOscillator();
      const snGain = ctx.createGain();
      snap.type = 'sawtooth';
      snap.frequency.setValueAtTime(310 * pitch, now);
      snap.frequency.exponentialRampToValueAtTime(75, now + 0.048);
      snGain.gain.setValueAtTime(0.18, now);
      snGain.gain.exponentialRampToValueAtTime(0.0005, now + 0.055);
      snap.connect(snGain);
      this.routeNode(ctx, snGain, worldX, worldZ, 0.55);
      snap.start(now);
      snap.stop(now + 0.06);

      this.spawnFilteredNoise(ctx, 0.095, 'bandpass', 2900 * pitch, 820, 1.0, 0.28, worldX, worldZ, 0.75);
    } else if (kind === 'heavy') {
      // Heavy caliber machine gun thump
      const thump = ctx.createOscillator();
      const tGain = ctx.createGain();
      thump.type = 'triangle';
      thump.frequency.setValueAtTime(175 * pitch, now);
      thump.frequency.exponentialRampToValueAtTime(42, now + 0.085);
      tGain.gain.setValueAtTime(0.28, now);
      tGain.gain.exponentialRampToValueAtTime(0.0005, now + 0.095);
      thump.connect(tGain);
      this.routeNode(ctx, tGain, worldX, worldZ, 0.7);
      thump.start(now);
      thump.stop(now + 0.1);

      this.spawnFilteredNoise(ctx, 0.14, 'lowpass', 2100 * pitch, 480, 0.85, 0.3, worldX, worldZ, 0.85);
    } else {
      // Automated turret crisp pulse-shot
      this.spawnFilteredNoise(ctx, 0.065, 'bandpass', 2600 * pitch, 950, 1.3, 0.16, worldX, worldZ, 0.45);
    }
  }

  public playReload(weaponId: WeaponId) {
    if (this.settings.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const extKey =
      weaponId === 'shotgun'
        ? 'weapon.shotgun.reload'
        : weaponId === 'pistol'
          ? 'weapon.pistol.reload'
          : 'weapon.rifle.reload';
    if (this.tryPlayExternalBuffer(extKey)) return;
    if (!this.canPlay('reload', 200)) return;

    // 2-stage mechanical click-clack (mag out + bolt latch / pump rack)
    const isShotgun = weaponId === 'shotgun';
    this.spawnFilteredNoise(ctx, 0.045, 'highpass', isShotgun ? 1400 : 2100, 900, 1.8, 0.16, undefined, undefined, 0.15, 0.02);
    this.spawnFilteredNoise(ctx, 0.06, 'bandpass', isShotgun ? 1100 : 2600, 1600, 2.2, 0.2, undefined, undefined, 0.2, isShotgun ? 0.24 : 0.34);
  }

  public playDryFire() {
    if (this.settings.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (!this.canPlay('dryfire', 140)) return;
    this.spawnFilteredNoise(ctx, 0.025, 'highpass', 3100, 1800, 2.5, 0.16, undefined, undefined, 0.1);
  }

  public playHit(heavyImpact = false, worldX?: number, worldZ?: number) {
    if (this.settings.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (!this.canPlay('hit_generic', 45)) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const jitter = 0.92 + Math.random() * 0.16;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime((heavyImpact ? 145 : 115) * jitter, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.085);
    g.gain.setValueAtTime(heavyImpact ? 0.22 : 0.15, now);
    g.gain.exponentialRampToValueAtTime(0.0005, now + 0.095);
    osc.connect(g);
    this.routeNode(ctx, g, worldX, worldZ, 0.3);
    osc.start(now);
    osc.stop(now + 0.1);

    this.spawnFilteredNoise(ctx, 0.06, 'lowpass', 950, 260, 1.0, 0.14, worldX, worldZ, 0.25);
  }

  // ==================== ZOMBIE AUDIO ====================

  public playZombieSound(
    action: 'idle' | 'detect' | 'attack' | 'hurt' | 'death' | 'distant_scream' | 'boss_slam',
    type: ZombieType,
    worldX?: number,
    worldZ?: number,
  ) {
    if (this.settings.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const minGap =
      action === 'idle'
        ? 1600
        : action === 'distant_scream'
          ? 4500
          : action === 'hurt'
            ? 90
            : action === 'attack'
              ? 180
              : 140;
    if (!this.canPlay(`z_${action}_${type}`, minGap)) return;

    if (action === 'boss_slam') {
      const now = ctx.currentTime;
      const boom = ctx.createOscillator();
      const bGain = ctx.createGain();
      boom.type = 'sine';
      boom.frequency.setValueAtTime(95, now);
      boom.frequency.exponentialRampToValueAtTime(28, now + 0.42);
      bGain.gain.setValueAtTime(0.45, now);
      bGain.gain.exponentialRampToValueAtTime(0.0005, now + 0.45);
      boom.connect(bGain);
      this.routeNode(ctx, bGain, worldX, worldZ, 1.1);
      boom.start(now);
      boom.stop(now + 0.46);
      this.spawnFilteredNoise(ctx, 0.32, 'lowpass', 700, 120, 0.9, 0.35, worldX, worldZ, 1.0);
      return;
    }

    const now = ctx.currentTime;
    const v = this.pickVariant(`z_${action}_${type}`, 4);
    const jitter = 0.9 + v * 0.05 + Math.random() * 0.05;

    const basePitch =
      type === 'boss' ? 56 : type === 'heavy' ? 78 : type === 'runner' ? 285 : 138;
    const dur =
      action === 'death'
        ? 0.42
        : action === 'detect' || action === 'distant_scream'
          ? 0.48
          : action === 'idle'
            ? 0.38
            : action === 'attack'
              ? 0.22
              : 0.14;

    const osc = ctx.createOscillator();
    osc.type = type === 'runner' ? 'sawtooth' : 'sawtooth';
    const startFreq =
      basePitch *
      jitter *
      (action === 'hurt' ? 1.25 : action === 'detect' || action === 'distant_scream' ? 1.18 : 1.0);
    const endFreq =
      action === 'death'
        ? startFreq * 0.46
        : action === 'detect'
          ? startFreq * 1.15
          : startFreq * 0.72;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(32, endFreq), now + dur);

    // Growl rasp modulation
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = type === 'runner' ? 38 : type === 'boss' ? 18 : 26;
    lfoGain.gain.value = type === 'runner' ? 22 : 12;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    const formant = ctx.createBiquadFilter();
    formant.type = 'bandpass';
    formant.frequency.value = type === 'boss' ? 290 : type === 'heavy' ? 380 : type === 'runner' ? 1150 : 620;
    formant.Q.value = 2.4;

    const g = ctx.createGain();
    const vol =
      action === 'distant_scream'
        ? 0.11
        : action === 'idle'
          ? 0.09
          : type === 'boss'
            ? 0.26
            : 0.16;
    g.gain.setValueAtTime(0.0005, now);
    g.gain.linearRampToValueAtTime(vol, now + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0005, now + dur);

    osc.connect(formant);
    formant.connect(g);
    this.routeNode(ctx, g, worldX, worldZ, action === 'distant_scream' ? 1.3 : 0.65);

    // Breathy throat rasp layer
    this.spawnFilteredNoise(
      ctx,
      dur * 0.85,
      'bandpass',
      formant.frequency.value * 1.4,
      formant.frequency.value * 0.8,
      1.6,
      vol * 0.65,
      worldX,
      worldZ,
      0.55,
    );

    osc.start(now);
    lfo.start(now);
    osc.stop(now + dur + 0.02);
    lfo.stop(now + dur + 0.02);
  }

  // ==================== GATHERING & BUILDING AUDIO ====================

  public playGather(
    kind: 'chop' | 'mine' | 'dig' | 'drill' | 'scrap',
    worldX?: number,
    worldZ?: number,
  ) {
    if (this.settings.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (!this.canPlay(`gather_${kind}`, 80)) return;

    const now = ctx.currentTime;
    const v = this.pickVariant(`g_${kind}`, 4);
    const jitter = 0.92 + v * 0.04 + Math.random() * 0.04;

    if (kind === 'chop') {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240 * jitter, now);
      osc.frequency.exponentialRampToValueAtTime(72, now + 0.09);
      g.gain.setValueAtTime(0.25, now);
      g.gain.exponentialRampToValueAtTime(0.0005, now + 0.1);
      osc.connect(g);
      this.routeNode(ctx, g, worldX, worldZ, 0.35);
      osc.start(now);
      osc.stop(now + 0.11);
      this.spawnFilteredNoise(ctx, 0.07, 'bandpass', 1200 * jitter, 420, 1.5, 0.18, worldX, worldZ, 0.3);
    } else if (kind === 'mine') {
      // Sharp pickaxe metallic ring against stone
      [1150, 2140].forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f * jitter, now);
        osc.frequency.exponentialRampToValueAtTime(f * jitter * 0.9, now + 0.12);
        g.gain.setValueAtTime(idx === 0 ? 0.16 : 0.09, now);
        g.gain.exponentialRampToValueAtTime(0.0005, now + 0.14);
        osc.connect(g);
        this.routeNode(ctx, g, worldX, worldZ, 0.5);
        osc.start(now);
        osc.stop(now + 0.15);
      });
      this.spawnFilteredNoise(ctx, 0.09, 'bandpass', 1700, 480, 1.0, 0.16, worldX, worldZ, 0.4);
    } else if (kind === 'scrap') {
      this.playMeleeHit('metal_pipe', 'metal', worldX, worldZ);
    } else if (kind === 'dig') {
      this.spawnFilteredNoise(ctx, 0.14, 'bandpass', 620 * jitter, 240, 1.2, 0.24, worldX, worldZ, 0.25);
    } else {
      // Jackhammer rapid burst
      for (let b = 0; b < 3; b++) {
        this.spawnFilteredNoise(
          ctx,
          0.035,
          'bandpass',
          950 * jitter,
          280,
          1.4,
          0.18,
          worldX,
          worldZ,
          0.4,
          b * 0.042,
        );
      }
    }
  }

  public playTreeFall(worldX?: number, worldZ?: number) {
    if (this.settings.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (this.tryPlayExternalBuffer('gather.tree.fall', worldX, worldZ)) return;

    // Creak + leafy crash
    const now = ctx.currentTime;
    const creak = ctx.createOscillator();
    const cg = ctx.createGain();
    creak.type = 'sawtooth';
    creak.frequency.setValueAtTime(160, now);
    creak.frequency.linearRampToValueAtTime(95, now + 0.25);
    cg.gain.setValueAtTime(0.08, now);
    cg.gain.exponentialRampToValueAtTime(0.0005, now + 0.26);
    creak.connect(cg);
    this.routeNode(ctx, cg, worldX, worldZ, 0.45);
    creak.start(now);
    creak.stop(now + 0.28);

    this.spawnFilteredNoise(ctx, 0.34, 'lowpass', 950, 160, 0.9, 0.28, worldX, worldZ, 0.55, 0.18);
  }

  public playPlaceStructure(material: 'wood' | 'stone' | 'metal', worldX?: number, worldZ?: number) {
    if (this.settings.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (!this.canPlay('place_struct', 60)) return;
    const now = ctx.currentTime;
    const jitter = 0.93 + Math.random() * 0.14;

    if (material === 'wood') {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220 * jitter, now);
      osc.frequency.exponentialRampToValueAtTime(85, now + 0.12);
      g.gain.setValueAtTime(0.24, now);
      g.gain.exponentialRampToValueAtTime(0.0005, now + 0.13);
      osc.connect(g);
      this.routeNode(ctx, g, worldX, worldZ, 0.3);
      osc.start(now);
      osc.stop(now + 0.14);
    } else if (material === 'stone') {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(125 * jitter, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + 0.16);
      g.gain.setValueAtTime(0.3, now);
      g.gain.exponentialRampToValueAtTime(0.0005, now + 0.17);
      osc.connect(g);
      this.routeNode(ctx, g, worldX, worldZ, 0.4);
      osc.start(now);
      osc.stop(now + 0.18);
      this.spawnFilteredNoise(ctx, 0.1, 'lowpass', 750, 220, 1.0, 0.18, worldX, worldZ, 0.3);
    } else {
      this.playMeleeHit('metal_pipe', 'metal', worldX, worldZ);
    }
  }

  public playBuildingDestroy(material: 'wood' | 'stone' | 'metal', worldX?: number, worldZ?: number) {
    if (this.settings.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    this.spawnFilteredNoise(
      ctx,
      0.38,
      'lowpass',
      material === 'metal' ? 1800 : 1050,
      160,
      0.8,
      0.32,
      worldX,
      worldZ,
      0.7,
    );
    if (material === 'metal') {
      this.playMeleeHit('metal_pipe', 'metal', worldX, worldZ);
    }
  }

  public playGateMove(worldX?: number, worldZ?: number) {
    if (this.settings.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    this.spawnFilteredNoise(ctx, 0.24, 'bandpass', 650, 1180, 3.0, 0.16, worldX, worldZ, 0.4);
  }

  public playTrapSnap(worldX?: number, worldZ?: number) {
    if (this.settings.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (!this.canPlay('trap', 120)) return;
    this.spawnFilteredNoise(ctx, 0.08, 'highpass', 1800, 750, 1.5, 0.22, worldX, worldZ, 0.4);
  }

  public playExplosion(worldX?: number, worldZ?: number) {
    if (this.settings.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (!this.canPlay('explosion', 100)) return;
    const now = ctx.currentTime;
    const sub = ctx.createOscillator();
    const sg = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(98, now);
    sub.frequency.exponentialRampToValueAtTime(24, now + 0.36);
    sg.gain.setValueAtTime(0.4, now);
    sg.gain.exponentialRampToValueAtTime(0.0005, now + 0.38);
    sub.connect(sg);
    this.routeNode(ctx, sg, worldX, worldZ, 1.0);
    sub.start(now);
    sub.stop(now + 0.4);

    this.spawnFilteredNoise(ctx, 0.38, 'lowpass', 1400, 140, 0.7, 0.36, worldX, worldZ, 1.1);
  }

  public playTurretRotate(worldX?: number, worldZ?: number) {
    if (this.settings.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (!this.canPlay('turret_rot', 650)) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.linearRampToValueAtTime(420, now + 0.07);
    g.gain.setValueAtTime(0.025, now);
    g.gain.exponentialRampToValueAtTime(0.0005, now + 0.08);
    osc.connect(g);
    this.routeNode(ctx, g, worldX, worldZ, 0.15);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  public playCoin() {
    if (this.settings.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (!this.canPlay('coin', 50)) return;
    const now = ctx.currentTime;
    const jitter = 0.97 + Math.random() * 0.06;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(920 * jitter, now);
    osc.frequency.setValueAtTime(1380 * jitter, now + 0.045);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.16);
    osc.connect(gain);
    this.routeNode(ctx, gain, undefined, undefined, 0.25);
    osc.start(now);
    osc.stop(now + 0.17);
  }

  public playBuild() {
    this.playPlaceStructure('wood');
  }

  public playEquip() {
    if (this.settings.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (!this.canPlay('equip', 40)) return;
    this.spawnFilteredNoise(ctx, 0.045, 'bandpass', 2200, 1200, 2.0, 0.12, undefined, undefined, 0.1);
  }

  public playStationHit() {
    if (this.settings.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (!this.canPlay('station_hit', 140)) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(34, now + 0.18);
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.2);
    osc.connect(gain);
    this.routeNode(ctx, gain, 0, 0, 0.6);
    osc.start(now);
    osc.stop(now + 0.21);
    this.spawnFilteredNoise(ctx, 0.14, 'lowpass', 900, 190, 0.9, 0.22, 0, 0, 0.5);
  }

  public playWaveStart() {
    if (this.settings.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(165, now);
    osc.frequency.linearRampToValueAtTime(246, now + 0.24);
    osc.frequency.linearRampToValueAtTime(196, now + 0.55);

    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 850;

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.6);
    osc.connect(filt);
    filt.connect(gain);
    this.routeNode(ctx, gain, undefined, undefined, 0.8);
    osc.start(now);
    osc.stop(now + 0.62);
  }

  // ==================== AMBIENCE & MUSIC BED ====================

  private ensureAmbienceStarted() {
    if (this.ambienceStarted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.ambientGain || !this.musicGain || !this.noiseBuffer) return;
    this.ambienceStarted = true;

    // 1. Continuous wind bed
    const windSrc = ctx.createBufferSource();
    windSrc.buffer = this.noiseBuffer;
    windSrc.loop = true;
    this.windFilter = ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.value = 340;
    this.windFilter.Q.value = 0.9;
    this.windGain = ctx.createGain();
    this.windGain.gain.value = 0.08;
    windSrc.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.ambientGain);
    windSrc.start(ctx.currentTime);

    // 2. Electrical buzz (damaged lights / night station hum)
    const buzzOsc = ctx.createOscillator();
    buzzOsc.type = 'sawtooth';
    buzzOsc.frequency.value = 100;
    const buzzFilter = ctx.createBiquadFilter();
    buzzFilter.type = 'bandpass';
    buzzFilter.frequency.value = 240;
    buzzFilter.Q.value = 3.5;
    this.buzzGain = ctx.createGain();
    this.buzzGain.gain.value = 0;
    buzzOsc.connect(buzzFilter);
    buzzFilter.connect(this.buzzGain);
    this.buzzGain.connect(this.ambientGain);
    buzzOsc.start(ctx.currentTime);

    // 3. Subtle dark survival drone music bed
    const padA = ctx.createOscillator();
    const padB = ctx.createOscillator();
    padA.type = 'triangle';
    padB.type = 'sine';
    padA.frequency.value = 55; // A1
    padB.frequency.value = 82.41; // E2
    this.musicFilter = ctx.createBiquadFilter();
    this.musicFilter.type = 'lowpass';
    this.musicFilter.frequency.value = 190;
    this.musicPadGain = ctx.createGain();
    this.musicPadGain.gain.value = 0.04;
    padA.connect(this.musicFilter);
    padB.connect(this.musicFilter);
    this.musicFilter.connect(this.musicPadGain);
    this.musicPadGain.connect(this.musicGain);
    padA.start(ctx.currentTime);
    padB.start(ctx.currentTime);
  }

  public updateAmbience(
    dt: number,
    nightFactor: number,
    inCombat: boolean,
    stationDamaged: boolean,
  ) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    this.ensureAmbienceStarted();
    if (!this.windGain || !this.windFilter || !this.buzzGain || !this.musicPadGain || !this.musicFilter) {
      return;
    }

    const now = this.ctx.currentTime;
    const targetWindGain = 0.065 + nightFactor * 0.085;
    const targetWindFreq = 320 + nightFactor * 160 + Math.sin(now * 0.4) * 55;
    this.windGain.gain.setTargetAtTime(targetWindGain, now, 0.3);
    this.windFilter.frequency.setTargetAtTime(targetWindFreq, now, 0.3);

    const targetBuzz = stationDamaged ? 0.024 * (0.4 + nightFactor * 0.6) : 0;
    this.buzzGain.gain.setTargetAtTime(targetBuzz, now, 0.25);

    const targetMusicGain = inCombat ? 0.085 : 0.035 + nightFactor * 0.03;
    const targetMusicCutoff = inCombat ? 290 : 170 + nightFactor * 50;
    this.musicPadGain.gain.setTargetAtTime(targetMusicGain, now, 0.5);
    this.musicFilter.frequency.setTargetAtTime(targetMusicCutoff, now, 0.5);

    // Periodic layered world soundscape events
    this.ambientEventTimer -= dt;
    if (this.ambientEventTimer <= 0) {
      this.ambientEventTimer = (nightFactor > 0.5 ? 4.5 : 6.0) + Math.random() * 5.5;
      const sideX = this.listenerX + (Math.random() > 0.5 ? 1 : -1) * (14 + Math.random() * 14);
      const sideZ = this.listenerZ + (Math.random() - 0.5) * 20;

      if (nightFactor > 0.5) {
        const roll = Math.random();
        if (roll < 0.38) {
          this.playCricketChirp(sideX, sideZ);
        } else if (roll < 0.72) {
          this.playZombieSound('distant_scream', Math.random() > 0.5 ? 'normal' : 'heavy', sideX, sideZ);
        } else {
          // Subtle metallic creak
          this.spawnFilteredNoise(this.ctx, 0.35, 'bandpass', 580, 390, 6.0, 0.05, sideX, sideZ, 0.7);
        }
      } else {
        const roll = Math.random();
        if (roll < 0.45) {
          this.playDistantBird(sideX, sideZ);
        } else {
          // Rustling leaves gust
          this.spawnFilteredNoise(this.ctx, 0.65, 'bandpass', 1400, 820, 1.2, 0.055, sideX, sideZ, 0.4);
        }
      }
    }
  }

  private playDistantBird(worldX: number, worldZ: number) {
    if (!this.ctx || !this.ambientGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    const base = 1850 + Math.random() * 500;
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.exponentialRampToValueAtTime(base * 1.28, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(base * 0.92, now + 0.17);
    g.gain.setValueAtTime(0.0005, now);
    g.gain.linearRampToValueAtTime(0.04, now + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0005, now + 0.22);

    const pan = this.createPanner(this.ctx, Math.max(-0.85, Math.min(0.85, (worldX - this.listenerX) / 20)));
    osc.connect(g);
    g.connect(pan);
    pan.connect(this.ambientGain);
    osc.start(now);
    osc.stop(now + 0.24);
  }

  private playCricketChirp(worldX: number, worldZ: number) {
    if (!this.ctx || !this.ambientGain) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const t = now + i * 0.075;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 3950 + Math.random() * 240;
      g.gain.setValueAtTime(0.0005, t);
      g.gain.linearRampToValueAtTime(0.025, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0005, t + 0.048);
      const pan = this.createPanner(this.ctx, Math.max(-0.85, Math.min(0.85, (worldX - this.listenerX) / 20)));
      osc.connect(g);
      g.connect(pan);
      pan.connect(this.ambientGain);
      osc.start(t);
      osc.stop(t + 0.055);
    }
  }
}

export const soundEngine = new SoundEngine();
