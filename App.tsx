import React, { useState, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { GameState, Player, GameStats, WeaponType } from './types';
import { initAudio, playSound } from './services/audioService';

const App = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  
  // React State for UI (synced from GameCanvas)
  const [playerStats, setPlayerStats] = useState<Player>({
    id: 'player', x: 0, y: 0, radius: 0, angle: 0,
    health: 100, maxHealth: 100, armor: 0, maxArmor: 100,
    ammo: 50, weapon: WeaponType.PISTOL, weapons: [WeaponType.PISTOL],
    isMoving: false, lastFired: 0
  });
  
  const [gameStats, setGameStats] = useState<GameStats>({
    score: 0,
    wave: 1,
    highScore: parseInt(localStorage.getItem('doom-tribute-highscore') || '0')
  });

  const handleUpdateStats = (player: Player, score: number, wave: number) => {
    setPlayerStats({ ...player }); // Copy to trigger render
    setGameStats(prev => ({ ...prev, score, wave }));
  };

  const handleGameOver = (finalScore: number, waves: number) => {
    const currentHigh = parseInt(localStorage.getItem('doom-tribute-highscore') || '0');
    if (finalScore > currentHigh) {
      localStorage.setItem('doom-tribute-highscore', finalScore.toString());
      setGameStats(prev => ({ ...prev, highScore: finalScore }));
    }
    setGameState(GameState.GAME_OVER);
  };

  const startGame = () => {
    initAudio();
    setGameState(GameState.PLAYING);
  };

  return (
    <div className="w-screen h-screen bg-[#0A0A0A] flex items-center justify-center relative overflow-hidden">
      
      {/* Game Layer */}
      <div className="relative w-full h-full max-w-[1200px] max-h-[900px] aspect-[4/3] bg-black shadow-2xl shadow-red-900/20 border border-[#333]">
        <GameCanvas 
          gameState={gameState} 
          setGameState={setGameState}
          onUpdateStats={handleUpdateStats}
          onGameOver={handleGameOver}
        />
        
        {gameState === GameState.PLAYING && (
          <HUD player={playerStats} stats={gameStats} />
        )}
      </div>

      {/* Menu Overlay */}
      {gameState === GameState.MENU && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50">
          <h1 className="text-8xl font-display text-[#8B0000] tracking-tighter drop-shadow-[0_0_15px_rgba(139,0,0,0.8)] animate-pulse mb-4">
            HELL ARENA
          </h1>
          <h2 className="text-2xl font-hud text-[#FF4500] mb-12 tracking-widest">
            DOOM TRIBUTE
          </h2>
          
          <button 
            onClick={startGame}
            className="px-12 py-4 bg-[#8B0000] hover:bg-[#FF0000] text-black font-display text-4xl tracking-wide transition-colors duration-100 hover:scale-105 transform clip-path-polygon"
            style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0% 100%)' }}
          >
            START KILLING
          </button>
          
          <div className="mt-12 text-[#555] font-hud text-center text-sm space-y-1">
            <p>WASD to Move • MOUSE to Aim • CLICK to Fire</p>
            <p>1-3 Switch Weapons</p>
          </div>
        </div>
      )}

      {/* Game Over Overlay */}
      {gameState === GameState.GAME_OVER && (
        <div className="absolute inset-0 bg-red-900/40 backdrop-blur-sm flex flex-col items-center justify-center z-50">
          <h1 className="text-9xl font-display text-white mb-2 drop-shadow-lg">YOU DIED</h1>
          
          <div className="bg-black/80 p-8 border-2 border-[#8B0000] min-w-[300px] text-center mb-8">
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xl font-hud mb-6">
              <span className="text-gray-400 text-right">SCORE:</span>
              <span className="text-[#FFD700] text-left">{gameStats.score}</span>
              
              <span className="text-gray-400 text-right">WAVE:</span>
              <span className="text-[#FFD700] text-left">{gameStats.wave}</span>
            </div>
            
            <button 
              onClick={startGame}
              className="w-full px-8 py-2 bg-[#8B0000] hover:bg-[#FF0000] text-black font-display text-2xl"
            >
              RESPAWN
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;