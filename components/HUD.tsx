import React from 'react';
import { Player, GameStats, WeaponType, PickupType } from '../types';
import { COLORS } from '../constants';

interface HUDProps {
  player: Player;
  stats: GameStats;
}

const ProgressBar = ({ value, max, color, label }: { value: number, max: number, color: string, label: string }) => {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));
  
  return (
    <div className="flex flex-col w-full">
      <div className="flex justify-between text-xs mb-1 tracking-widest text-white/70 font-hud">
        <span>{label}</span>
        <span>{Math.ceil(value)}%</span>
      </div>
      <div className="h-4 w-full bg-[#1a1a1a] border border-[#333]">
        <div 
          className="h-full transition-all duration-100 ease-out"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
};

export const HUD: React.FC<HUDProps> = ({ player, stats }) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-10">
      {/* Top Bar: Score & Wave */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <span className="text-4xl font-display tracking-wider text-red-600 drop-shadow-md">
            HELL ARENA
          </span>
          <span className="font-hud text-xl text-[#FFD700]">
            SCORE: {stats.score.toString().padStart(6, '0')}
          </span>
        </div>
        
        <div className="flex flex-col items-end">
           <span className="text-4xl font-display text-white drop-shadow-md tracking-wider">
             WAVE {stats.wave}
           </span>
           <span className="font-hud text-xs text-white/50">
             HI-SCORE: {stats.highScore.toString().padStart(6, '0')}
           </span>
        </div>
      </div>

      {/* Bottom Bar: Status */}
      <div className="flex items-end gap-4 bg-[#0A0A0A]/80 backdrop-blur-sm p-4 border-t-2 border-[#2F2F2F]">
        
        {/* Health */}
        <div className="flex-1 max-w-[200px]">
          <ProgressBar 
            value={player.health} 
            max={player.maxHealth} 
            color={player.health < 25 ? COLORS.BLOOD_RED : COLORS.HEALTH_GREEN} 
            label="HEALTH" 
          />
        </div>

        {/* Armor */}
        <div className="flex-1 max-w-[200px]">
          <ProgressBar 
            value={player.armor} 
            max={player.maxArmor} 
            color="#3b82f6" // Blue for armor
            label="ARMOR" 
          />
        </div>

        {/* Ammo */}
        <div className="flex-1 flex flex-col justify-end">
          <div className="text-right mb-1">
             <span className="font-hud text-2xl text-[#FFD700]">
               {player.weapon === WeaponType.PISTOL ? '∞' : player.ammo}
             </span>
             <span className="font-hud text-xs text-white/50 ml-2">AMMO</span>
          </div>
          <div className="h-4 bg-[#1a1a1a] border border-[#333] relative overflow-hidden">
             {/* Simple visual representation of ammo count */}
             <div 
                className="absolute inset-0 bg-[#FFD700] opacity-50" 
                style={{ width: player.weapon === WeaponType.PISTOL ? '100%' : `${Math.min(100, player.ammo)}%` }}
             />
          </div>
        </div>

        {/* Weapons */}
        <div className="flex gap-2">
            {[WeaponType.PISTOL, WeaponType.SHOTGUN, WeaponType.CHAINGUN].map((w, idx) => {
              const hasWeapon = player.weapons.includes(w);
              const isSelected = player.weapon === w;
              return (
                <div 
                  key={w}
                  className={`
                    w-12 h-12 flex items-center justify-center border-2 font-hud text-xl
                    ${isSelected ? 'border-[#FFD700] bg-[#FFD700]/20 text-[#FFD700]' : 'border-[#333] text-[#555]'}
                    ${!hasWeapon ? 'opacity-30' : 'opacity-100'}
                  `}
                >
                  {idx + 1}
                </div>
              );
            })}
        </div>
      </div>

      {/* Low Health Vignette Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          background: 'radial-gradient(circle, transparent 60%, #8B0000 100%)',
          opacity: player.health < 30 ? (1 - player.health / 30) : 0
        }}
      />
      
      {/* Damage Flash Overlay */}
       <div 
        id="damage-flash"
        className="absolute inset-0 pointer-events-none bg-red-600 mix-blend-overlay opacity-0 transition-opacity duration-75"
      />
    </div>
  );
};