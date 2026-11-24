import React from 'react';
import {
  BrickWall,
  Crosshair,
  DoorOpen,
  Flame,
  Hammer,
  HeartPulse,
  Moon,
  Shield,
  Sun,
  Sunset,
  Swords,
  Warehouse,
  Wrench,
  Zap,
} from 'lucide-react';
import { BuildingId, DayPhase, ResourceCost, ToolId, WeaponId } from '../game/types';

export const GoldIcon: React.FC<{ className?: string }> = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <circle cx="12" cy="12" r="9.5" fill="#FBBF24" stroke="#92400E" strokeWidth="1.8" />
    <circle cx="12" cy="12" r="6" fill="#FDE68A" opacity="0.55" />
    <path
      d="M12 7.5V16.5M9.5 10H13.5C14.6 10 15 10.7 15 11.4C15 12.2 14.3 12.7 13.5 12.7H10.5C9.7 12.7 9 13.2 9 14C9 14.8 9.7 15.3 10.5 15.3H14.5"
      stroke="#92400E"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

export const WoodIcon: React.FC<{ className?: string }> = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <rect x="3" y="8" width="18" height="8" rx="3" fill="#B45309" stroke="#451A03" strokeWidth="1.6" />
    <circle cx="6.5" cy="12" r="2.2" fill="#FDE68A" stroke="#78350F" strokeWidth="1.2" />
    <path d="M11 10.5H17M12 13.5H18" stroke="#78350F" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

export const StoneIcon: React.FC<{ className?: string }> = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <path
      d="M4 17L7 8L13 5L19 9L20 17L12 19L4 17Z"
      fill="#9CA3AF"
      stroke="#374151"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
    <path d="M7 8L12 12L19 9M12 12V19" stroke="#4B5563" strokeWidth="1.3" />
  </svg>
);

export const ScrapIcon: React.FC<{ className?: string }> = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <path
      d="M12 3L14.2 5.4L17.4 4.8L18.2 8L21 9.6L19.6 12.6L20.8 15.6L18 17.2L17 20.2L13.8 19.6L11.8 21.5L9.5 19.3L6.2 19.8L5.4 16.6L2.8 15L4.1 12L3 9L5.8 7.4L6.8 4.4L10 5L12 3Z"
      fill="#38BDF8"
      stroke="#0F172A"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="3.4" fill="#1E293B" stroke="#BAE6FD" strokeWidth="1.4" />
  </svg>
);

export const DayPhaseIcon: React.FC<{ phase: DayPhase; className?: string }> = ({
  phase,
  className = 'h-4 w-4',
}) => {
  if (phase === 'night') return <Moon className={`${className} text-sky-300`} />;
  if (phase === 'dusk') return <Sunset className={`${className} text-orange-400`} />;
  return <Sun className={`${className} text-amber-400`} />;
};

export const CostChips: React.FC<{
  cost: ResourceCost;
  gold: number;
  wood: number;
  stone: number;
  scrap: number;
}> = ({ cost, gold, wood, stone, scrap }) => {
  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono-num font-bold">
      {cost.gold !== undefined && cost.gold > 0 && (
        <span className={`flex items-center gap-1 ${gold < cost.gold ? 'text-red-400' : 'text-amber-400'}`}>
          <GoldIcon className="h-3.5 w-3.5" />
          {cost.gold}
        </span>
      )}
      {cost.wood !== undefined && cost.wood > 0 && (
        <span className={`flex items-center gap-1 ${wood < cost.wood ? 'text-red-400' : 'text-amber-200'}`}>
          <WoodIcon className="h-3.5 w-3.5" />
          {cost.wood}
        </span>
      )}
      {cost.stone !== undefined && cost.stone > 0 && (
        <span className={`flex items-center gap-1 ${stone < cost.stone ? 'text-red-400' : 'text-stone-300'}`}>
          <StoneIcon className="h-3.5 w-3.5" />
          {cost.stone}
        </span>
      )}
      {cost.scrap !== undefined && cost.scrap > 0 && (
        <span className={`flex items-center gap-1 ${scrap < cost.scrap ? 'text-red-400' : 'text-sky-300'}`}>
          <ScrapIcon className="h-3.5 w-3.5" />
          {cost.scrap}
        </span>
      )}
    </div>
  );
};

export const BuildingPreviewIcon: React.FC<{ id: BuildingId; className?: string }> = ({
  id,
  className = 'h-6 w-6',
}) => {
  switch (id) {
    case 'wooden_wall':
      return <BrickWall className={`${className} text-amber-500`} />;
    case 'reinforced_wooden_wall':
      return <Shield className={`${className} text-orange-400`} />;
    case 'stone_wall':
      return <BrickWall className={`${className} text-stone-300`} />;
    case 'metal_wall':
      return <Shield className={`${className} text-sky-400`} />;
    case 'metal_gate':
      return <DoorOpen className={`${className} text-sky-400`} />;
    case 'auto_turret':
    case 'adv_turret':
      return <Crosshair className={`${className} text-amber-400`} />;
    case 'watchtower':
    case 'heavy_tower':
      return <Flame className={`${className} text-red-400`} />;
    case 'spike_trap':
      return <Swords className={`${className} text-red-500`} />;
    case 'generator':
    case 'adv_generator':
      return <Zap className={`${className} text-yellow-400`} />;
    case 'weapon_workshop':
      return <Wrench className={`${className} text-sky-400`} />;
    case 'storage':
      return <Warehouse className={`${className} text-emerald-400`} />;
    case 'med_station':
      return <HeartPulse className={`${className} text-emerald-400`} />;
    default:
      return <Hammer className={`${className} text-amber-400`} />;
  }
};

export const ToolPreviewIcon: React.FC<{ id: ToolId; className?: string }> = ({
  id,
  className = 'h-5 w-5',
}) => {
  switch (id) {
    case 'axe':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <path
            d="M5 19L15 9"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M12.5 5.5C15.8 5.2 19 7.2 19.6 10.6L14.8 11.4L12.5 5.5Z"
            fill="currentColor"
            opacity="0.9"
          />
          <path d="M11 7.2L15.4 11.6" stroke="#0F172A" strokeWidth="1.2" />
        </svg>
      );
    case 'pickaxe':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <path
            d="M5 19L15 9"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M8.5 5.2C13 4.8 17.4 7.8 18.8 13L15.5 11.8C14.4 9 11.8 7.5 8.5 7.7V5.2Z"
            fill="currentColor"
          />
        </svg>
      );
    case 'shovel':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <path
            d="M6 18L13.5 10.5M4.5 19.5L7.5 16.5"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M13 7.5L17.5 4.5L19.5 6.5L16.5 11L13 7.5Z"
            fill="currentColor"
          />
        </svg>
      );
    case 'jackhammer':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <path d="M7 5H17M12 5V8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          <rect x="8.5" y="8" width="7" height="7" rx="1.5" fill="currentColor" />
          <path d="M12 15V21" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
          <path d="M9.5 19.5L14.5 19.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
  }
};

export const WeaponPreviewIcon: React.FC<{ id: WeaponId; className?: string }> = ({
  id,
  className = 'h-5 w-5',
}) => {
  switch (id) {
    case 'wooden_bat':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <path
            d="M5 19L8.2 15.8M7.8 16.2L17.5 4.8C18.3 4 19.6 4.7 19.2 5.9L11.2 16.2L7.8 16.2Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'metal_pipe':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <path
            d="M4.5 19.5L16.5 7.5M14.5 5.5L18.5 9.5"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <circle cx="17.5" cy="6.5" r="1.8" fill="currentColor" />
        </svg>
      );
    case 'pistol':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <path
            d="M4 8.5H19V11.5H11.5L9.5 18H6L7.5 11.5H4V8.5Z"
            fill="currentColor"
          />
          <path d="M11 11.5L12.2 13.5H10.2" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      );
    case 'shotgun':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <path
            d="M2.5 10.5H20.5V12.5H12.5L9.5 16.5H6L8 12.5H2.5V10.5Z"
            fill="currentColor"
          />
          <rect x="11" y="12.5" width="5.5" height="2.2" rx="0.8" fill="currentColor" opacity="0.85" />
          <path d="M18 9H21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case 'assault_rifle':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <path
            d="M2 10H21V12.2H14.2L15.4 16.5H12.8L11.6 12.2H8.5L6.5 16H4L5.5 12.2H2V10Z"
            fill="currentColor"
          />
          <path d="M9 8.2H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'heavy_mg':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <rect x="2.5" y="9" width="14" height="4.2" rx="1" fill="currentColor" />
          <path d="M16.5 10.2H22M16.5 12H21" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <rect x="8.5" y="13.2" width="5" height="4.5" rx="0.8" fill="currentColor" opacity="0.85" />
          <path d="M4.5 13.2L3 17.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
  }
};
