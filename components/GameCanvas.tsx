import React, { useRef, useEffect, useState } from 'react';
import { 
  Player, Enemy, Projectile, Particle, Pickup, 
  WeaponType, EnemyType, PickupType, GameState, Position 
} from '../types';
import { COLORS, GAME_CONFIG, WEAPON_STATS, ENEMY_STATS } from '../constants';
import { playSound, initAudio } from '../services/audioService';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  onUpdateStats: (player: Player, score: number, wave: number) => void;
  onGameOver: (finalScore: number, wavesSurvived: number) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ 
  gameState, setGameState, onUpdateStats, onGameOver 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game State Refs (Mutable for Performance)
  const playerRef = useRef<Player>({
    id: 'player', x: 0, y: 0, radius: GAME_CONFIG.PLAYER_RADIUS,
    angle: 0, health: 100, maxHealth: 100, armor: 0, maxArmor: 100,
    ammo: 50, weapon: WeaponType.PISTOL, weapons: [WeaponType.PISTOL],
    isMoving: false, lastFired: 0
  });
  
  const enemiesRef = useRef<Enemy[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const pickupsRef = useRef<Pickup[]>([]);
  
  const keysRef = useRef<{[key: string]: boolean}>({});
  const mouseRef = useRef<Position>({ x: 0, y: 0 });
  const mouseDownRef = useRef<boolean>(false);
  
  const gameLoopRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  const waveRef = useRef<number>(1);
  const lastWaveTimeRef = useRef<number>(0);
  const isWaveSpawningRef = useRef<boolean>(false);
  
  // Screen shake
  const shakeRef = useRef<number>(0);

  // Initialize Game
  const initGame = () => {
    const canvas = canvasRef.current;
    if(!canvas) return;

    playerRef.current = {
      id: 'player', 
      x: canvas.width / 2, 
      y: canvas.height / 2, 
      radius: GAME_CONFIG.PLAYER_RADIUS,
      angle: 0, 
      health: 100, 
      maxHealth: 100, 
      armor: 0, 
      maxArmor: 100,
      ammo: 50, 
      weapon: WeaponType.PISTOL, 
      weapons: [WeaponType.PISTOL],
      isMoving: false, 
      lastFired: 0
    };
    
    enemiesRef.current = [];
    projectilesRef.current = [];
    particlesRef.current = [];
    pickupsRef.current = [];
    scoreRef.current = 0;
    waveRef.current = 1;
    lastWaveTimeRef.current = Date.now();
    isWaveSpawningRef.current = true;
    startWave(1);
    
    // Initial sync
    onUpdateStats(playerRef.current, 0, 1);
  };

  // Wave Logic
  const startWave = (waveNum: number) => {
    const canvas = canvasRef.current;
    if(!canvas) return;

    // Simple difficulty scaling
    const enemyCount = 4 + (waveNum * 2);
    const availableTypes = [EnemyType.IMP];
    if (waveNum >= 2) availableTypes.push(EnemyType.DEMON);
    if (waveNum >= 4) availableTypes.push(EnemyType.CACODEMON);
    if (waveNum >= 6) availableTypes.push(EnemyType.BARON);

    let spawned = 0;
    const spawnInterval = setInterval(() => {
        if (gameState !== GameState.PLAYING) {
             clearInterval(spawnInterval);
             return;
        }
        if (spawned >= enemyCount) {
            clearInterval(spawnInterval);
            isWaveSpawningRef.current = false;
            return;
        }

        const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        spawnEnemy(canvas, type);
        spawned++;
    }, 800 - Math.min(600, waveNum * 50)); // Spawn faster each wave
  };

  const spawnEnemy = (canvas: HTMLCanvasElement, type: EnemyType) => {
    const stats = ENEMY_STATS[type];
    
    // Spawn at edges
    let x, y;
    if (Math.random() < 0.5) {
      x = Math.random() < 0.5 ? -50 : canvas.width + 50;
      y = Math.random() * canvas.height;
    } else {
      x = Math.random() * canvas.width;
      y = Math.random() < 0.5 ? -50 : canvas.height + 50;
    }

    enemiesRef.current.push({
      id: Math.random().toString(36).substr(2, 9),
      x, y,
      type,
      ...stats,
      maxHealth: stats.health
    });
  };

  const spawnPickup = (x: number, y: number) => {
    const r = Math.random();
    let type: PickupType | null = null;
    let value = 0;

    if (r < 0.15) { type = PickupType.HEALTH; value = 25; }
    else if (r < 0.25) { type = PickupType.AMMO; value = 20; }
    else if (r < 0.30) { type = PickupType.ARMOR; value = 25; }
    else if (r < 0.32 && !playerRef.current.weapons.includes(WeaponType.SHOTGUN)) {
        type = PickupType.SHOTGUN; value = 10; // Gives weapon + ammo
    }
    else if (r < 0.33 && waveRef.current > 3 && !playerRef.current.weapons.includes(WeaponType.CHAINGUN)) {
        type = PickupType.CHAINGUN; value = 50;
    }

    if (type) {
      pickupsRef.current.push({
        id: Math.random().toString(),
        x, y,
        radius: 10,
        type,
        value,
        spawnTime: Date.now()
      });
    }
  };

  const createParticles = (x: number, y: number, color: string, count: number, speed: number) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const v = Math.random() * speed;
      particlesRef.current.push({
        id: Math.random().toString(),
        x, y,
        radius: Math.random() * 3 + 1,
        vx: Math.cos(angle) * v,
        vy: Math.sin(angle) * v,
        color,
        life: 1.0,
        maxLife: 1.0,
        size: Math.random() * 3 + 1,
        decay: Math.random() * 0.02 + 0.01
      });
    }
    // Trim particles
    if (particlesRef.current.length > GAME_CONFIG.MAX_PARTICLES) {
      particlesRef.current = particlesRef.current.slice(-GAME_CONFIG.MAX_PARTICLES);
    }
  };

  // Helper: Trigger damage flash
  const triggerDamageFlash = () => {
    const flash = document.getElementById('damage-flash');
    if (flash) {
      flash.style.opacity = '0.4';
      setTimeout(() => { flash.style.opacity = '0'; }, 100);
    }
    shakeRef.current = 10;
    playSound('hurt');
  };

  // Update Logic
  const update = (dt: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Player Movement
    let dx = 0;
    let dy = 0;
    if (keysRef.current['w']) dy -= 1;
    if (keysRef.current['s']) dy += 1;
    if (keysRef.current['a']) dx -= 1;
    if (keysRef.current['d']) dx += 1;

    if (dx !== 0 || dy !== 0) {
      const length = Math.sqrt(dx*dx + dy*dy);
      dx = (dx / length) * GAME_CONFIG.PLAYER_SPEED;
      dy = (dy / length) * GAME_CONFIG.PLAYER_SPEED;
      playerRef.current.x = Math.max(GAME_CONFIG.PLAYER_RADIUS, Math.min(canvas.width - GAME_CONFIG.PLAYER_RADIUS, playerRef.current.x + dx));
      playerRef.current.y = Math.max(GAME_CONFIG.PLAYER_RADIUS, Math.min(canvas.height - GAME_CONFIG.PLAYER_RADIUS, playerRef.current.y + dy));
      playerRef.current.isMoving = true;
    } else {
      playerRef.current.isMoving = false;
    }

    // Player Aim
    playerRef.current.angle = Math.atan2(
      mouseRef.current.y - playerRef.current.y,
      mouseRef.current.x - playerRef.current.x
    );

    // Shooting
    if (mouseDownRef.current) {
        const now = Date.now();
        const weapon = playerRef.current.weapon;
        const stats = WEAPON_STATS[weapon];
        
        // Check ammo (except pistol)
        const hasAmmo = weapon === WeaponType.PISTOL || playerRef.current.ammo >= stats.ammoCost;

        if (hasAmmo && now - playerRef.current.lastFired > stats.cooldown) {
            playerRef.current.lastFired = now;
            
            // Consume ammo
            if (weapon !== WeaponType.PISTOL) {
                playerRef.current.ammo -= stats.ammoCost;
            }

            // Fire Effect
            playSound(weapon === WeaponType.PISTOL ? 'shoot_pistol' : weapon === WeaponType.SHOTGUN ? 'shoot_shotgun' : 'shoot_chaingun');
            
            // Create Projectiles
            const count = weapon === WeaponType.SHOTGUN ? stats.pellets : 1;
            
            for(let i=0; i<count; i++) {
                const spread = (Math.random() - 0.5) * stats.spread;
                const angle = playerRef.current.angle + spread;
                
                projectilesRef.current.push({
                    id: Math.random().toString(),
                    x: playerRef.current.x + Math.cos(angle) * 20,
                    y: playerRef.current.y + Math.sin(angle) * 20,
                    radius: 3,
                    vx: Math.cos(angle) * GAME_CONFIG.BULLET_SPEED,
                    vy: Math.sin(angle) * GAME_CONFIG.BULLET_SPEED,
                    damage: stats.damage,
                    color: stats.color,
                    lifetime: 100 // frames
                });
            }
        }
    }

    // Update Projectiles
    projectilesRef.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.lifetime--;
    });
    projectilesRef.current = projectilesRef.current.filter(p => 
        p.lifetime > 0 && 
        p.x > 0 && p.x < canvas.width && 
        p.y > 0 && p.y < canvas.height
    );

    // Update Enemies
    enemiesRef.current.forEach(enemy => {
        const dx = playerRef.current.x - enemy.x;
        const dy = playerRef.current.y - enemy.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist > 0) {
            enemy.x += (dx / dist) * enemy.speed;
            enemy.y += (dy / dist) * enemy.speed;
        }

        // Collision with Player
        if (dist < playerRef.current.radius + enemy.radius) {
            // Damage Logic
            // Simple debounce or continuous damage? Let's do a hit check chance or push back
            // For simplicity, we damage and push enemy back
            const pushBack = 50;
            enemy.x -= (dx / dist) * pushBack;
            enemy.y -= (dy / dist) * pushBack;

            // Apply Damage to Player
            const dmg = enemy.damage;
            let actualDmg = dmg;
            
            if (playerRef.current.armor > 0) {
                const absorb = Math.min(playerRef.current.armor, Math.ceil(dmg * 0.6));
                playerRef.current.armor -= absorb;
                actualDmg -= absorb;
            }
            playerRef.current.health -= actualDmg;
            triggerDamageFlash();

            if (playerRef.current.health <= 0) {
                setGameState(GameState.GAME_OVER);
                playSound('die');
                onGameOver(scoreRef.current, waveRef.current);
            }
        }
    });

    // Projectile vs Enemy Collision
    projectilesRef.current.forEach(p => {
        enemiesRef.current.forEach(e => {
            const dx = p.x - e.x;
            const dy = p.y - e.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < e.radius + p.radius) {
                // Hit
                e.health -= p.damage;
                p.lifetime = 0; // Destroy projectile
                
                // Blood
                createParticles(e.x, e.y, COLORS.BLOOD_RED, 3, 2);
                playSound('hit');

                if (e.health <= 0) {
                    // Enemy Dead
                    scoreRef.current += e.scoreValue;
                    createParticles(e.x, e.y, COLORS.BLOOD_RED, 15, 4);
                    spawnPickup(e.x, e.y);
                    playSound('die');
                }
            }
        });
    });

    // Clean Dead Enemies
    enemiesRef.current = enemiesRef.current.filter(e => e.health > 0);

    // Pickups
    pickupsRef.current.forEach(pickup => {
        const dx = playerRef.current.x - pickup.x;
        const dy = playerRef.current.y - pickup.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < playerRef.current.radius + pickup.radius) {
            // Collect
            playSound('pickup');
            
            switch(pickup.type) {
                case PickupType.HEALTH:
                    playerRef.current.health = Math.min(playerRef.current.maxHealth, playerRef.current.health + pickup.value);
                    break;
                case PickupType.ARMOR:
                    playerRef.current.armor = Math.min(playerRef.current.maxArmor, playerRef.current.armor + pickup.value);
                    break;
                case PickupType.AMMO:
                    playerRef.current.ammo += pickup.value;
                    break;
                case PickupType.SHOTGUN:
                    if (!playerRef.current.weapons.includes(WeaponType.SHOTGUN)) {
                        playerRef.current.weapons.push(WeaponType.SHOTGUN);
                    }
                    playerRef.current.ammo += pickup.value;
                    break;
                case PickupType.CHAINGUN:
                    if (!playerRef.current.weapons.includes(WeaponType.CHAINGUN)) {
                        playerRef.current.weapons.push(WeaponType.CHAINGUN);
                    }
                    playerRef.current.ammo += pickup.value;
                    break;
            }
            
            // Mark for deletion
            pickup.value = 0; // Hack to filter out
        }
    });
    pickupsRef.current = pickupsRef.current.filter(p => p.value > 0);

    // Wave Management
    if (enemiesRef.current.length === 0 && !isWaveSpawningRef.current) {
        waveRef.current++;
        playSound('pickup'); // Positive sound for wave clear
        isWaveSpawningRef.current = true;
        // Brief pause before next wave starts handled by startWave delay or external logic?
        // Let's just start it immediately for chaos
        setTimeout(() => startWave(waveRef.current), 2000);
    }

    // Particles Update
    particlesRef.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
    });
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);

    // Shake decay
    if (shakeRef.current > 0) shakeRef.current *= 0.9;
    if (shakeRef.current < 0.5) shakeRef.current = 0;

    // Sync Stats for HUD (Throttled ideally, but every frame is fine for simple React app)
    onUpdateStats({ ...playerRef.current }, scoreRef.current, waveRef.current);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Clear with shake
    ctx.save();
    ctx.fillStyle = COLORS.VOID_BLACK;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const shakeX = (Math.random() - 0.5) * shakeRef.current;
    const shakeY = (Math.random() - 0.5) * shakeRef.current;
    ctx.translate(shakeX, shakeY);

    // Draw Floor Grid
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    const gridSize = 50;
    ctx.beginPath();
    for(let x=0; x<=canvas.width; x+=gridSize) {
        ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height);
    }
    for(let y=0; y<=canvas.height; y+=gridSize) {
        ctx.moveTo(0, y); ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();

    // Draw Pickups
    pickupsRef.current.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.fillStyle = p.type === PickupType.HEALTH ? COLORS.HEALTH_GREEN : 
                        p.type === PickupType.ARMOR ? '#3b82f6' : COLORS.AMMO_GOLD;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.fillStyle;
        ctx.fill(); // Glow
        ctx.restore();
    });

    // Draw Particles (Blood/Explosions)
    particlesRef.current.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    });

    // Draw Enemies
    enemiesRef.current.forEach(e => {
        ctx.save();
        ctx.translate(e.x, e.y);
        
        // Body
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
        ctx.fill();

        // Eyes (Glowing)
        ctx.fillStyle = COLORS.HELLFIRE_ORANGE;
        const eyeOffset = e.radius * 0.4;
        const angleToPlayer = Math.atan2(playerRef.current.y - e.y, playerRef.current.x - e.x);
        
        ctx.rotate(angleToPlayer);
        ctx.beginPath();
        ctx.arc(eyeOffset, -eyeOffset/2, 3, 0, Math.PI*2);
        ctx.arc(eyeOffset, eyeOffset/2, 3, 0, Math.PI*2);
        ctx.fill();

        ctx.restore();
    });

    // Draw Projectiles
    projectilesRef.current.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Trail
        ctx.shadowBlur = 5;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.restore();
    });

    // Draw Player
    const p = playerRef.current;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    
    // Player Body (Square-ish marine)
    ctx.fillStyle = COLORS.HEALTH_GREEN; // Marine armor green
    ctx.fillRect(-p.radius, -p.radius, p.radius*2, p.radius*2);
    
    // Weapon
    ctx.fillStyle = '#555'; // Gun metal
    ctx.fillRect(0, -4, p.radius + 10, 8); // Gun barrel
    
    // Muzzle Flash
    if (Date.now() - p.lastFired < 50) {
        ctx.fillStyle = COLORS.HELLFIRE_ORANGE;
        ctx.beginPath();
        ctx.arc(p.radius + 15, 0, 8 + Math.random() * 5, 0, Math.PI*2);
        ctx.fill();
    }

    ctx.restore();

    // Vignette
    const gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, canvas.height/3, canvas.width/2, canvas.height/2, canvas.height);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(1, 'rgba(0,0,0,0.8)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.restore();
  };

  // Main Loop
  useEffect(() => {
    if (gameState !== GameState.PLAYING) return;
    
    if (enemiesRef.current.length === 0 && waveRef.current === 1 && !isWaveSpawningRef.current) {
         initGame();
    }

    let animationFrameId: number;

    const loop = (time: number) => {
        update(time);
        draw();
        animationFrameId = requestAnimationFrame(loop);
    };
    
    animationFrameId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState]);

  // Input Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
      
      // Weapon Switch
      if (e.key === '1') playerRef.current.weapon = WeaponType.PISTOL;
      if (e.key === '2' && playerRef.current.weapons.includes(WeaponType.SHOTGUN)) playerRef.current.weapon = WeaponType.SHOTGUN;
      if (e.key === '3' && playerRef.current.weapons.includes(WeaponType.CHAINGUN)) playerRef.current.weapon = WeaponType.CHAINGUN;
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
       const canvas = canvasRef.current;
       if(!canvas) return;
       const rect = canvas.getBoundingClientRect();
       mouseRef.current = {
           x: (e.clientX - rect.left) * (canvas.width / rect.width),
           y: (e.clientY - rect.top) * (canvas.height / rect.height)
       };
    };

    const handleMouseDown = () => { mouseDownRef.current = true; };
    const handleMouseUp = () => { mouseDownRef.current = false; };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    // Bind mouse events to window for better tracking if cursor leaves canvas (but game is fullscreen-ish)
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Initialization when PLAYING starts
  useEffect(() => {
    if (gameState === GameState.PLAYING) {
        initGame();
    }
  }, [gameState]);

  return (
    <canvas 
      ref={canvasRef} 
      width={GAME_CONFIG.ARENA_WIDTH} 
      height={GAME_CONFIG.ARENA_HEIGHT}
      className="w-full h-full object-contain bg-[#0A0A0A] cursor-crosshair"
    />
  );
};