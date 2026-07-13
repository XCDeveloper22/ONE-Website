import React, { useEffect, useRef, useState } from 'react';
import { WifiOff, RotateCcw, Award, ArrowUp, Globe } from 'lucide-react';
import { motion } from 'motion/react';

export default function OfflineGame() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem('one_dino_highscore') || '0', 10);
    } catch {
      return 0;
    }
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number | null>(null);

  // Game variable references to prevent re-instantiating in render loops
  const gameVars = useRef({
    botY: 0,
    botVelocityY: 0,
    gravity: 0.6,
    jumpStrength: -10,
    obstacles: [] as Array<{ x: number; width: number; height: number; speed: number }>,
    obstacleTimer: 0,
    scoreTimer: 0,
    groundY: 120, // Relative to canvas height
    botSize: 24,
    speedFactor: 1,
  });

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Set up game controls (spacebar, up arrow, or click/tap)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        triggerJump();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  const triggerJump = () => {
    if (gameState === 'idle') {
      startGame();
    } else if (gameState === 'gameover') {
      startGame();
    } else if (gameState === 'playing') {
      const vars = gameVars.current;
      // Only jump if on the ground
      if (vars.botY === vars.groundY - vars.botSize) {
        vars.botVelocityY = vars.jumpStrength;
      }
    }
  };

  const startGame = () => {
    setScore(0);
    setGameState('playing');
    
    // Reset state variables
    const vars = gameVars.current;
    vars.botY = vars.groundY - vars.botSize;
    vars.botVelocityY = 0;
    vars.obstacles = [];
    vars.obstacleTimer = 0;
    vars.scoreTimer = 0;
    vars.speedFactor = 1;
  };

  // Main game loop
  useEffect(() => {
    if (gameState !== 'playing') {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = Math.min(window.innerWidth - 32, 480);
    canvas.height = 160;

    const loop = () => {
      const vars = gameVars.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw Ground Line
      ctx.strokeStyle = '#3f3f46'; // zinc-700
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, vars.groundY);
      ctx.lineTo(canvas.width, vars.groundY);
      ctx.stroke();

      // 2. Update Bot Position (Physics)
      vars.botVelocityY += vars.gravity;
      vars.botY += vars.botVelocityY;

      // Constrain Bot to Ground
      const groundLimit = vars.groundY - vars.botSize;
      if (vars.botY > groundLimit) {
        vars.botY = groundLimit;
        vars.botVelocityY = 0;
      }

      // 3. Draw Bot (as an elegant neon glow blue square/circle representation)
      ctx.fillStyle = '#3b82f6'; // blue-500
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#3b82f6';
      
      // Draw a rounded rectangle for ONE bot representation
      ctx.beginPath();
      const r = 6; // corner radius
      const x = 30;
      const y = vars.botY;
      const w = vars.botSize;
      const h = vars.botSize;
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.fill();
      
      // Draw screen/face on bot
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 0;
      ctx.fillRect(x + 14, y + 6, 6, 4); // single eye/visor

      // 4. Update and Draw Obstacles
      vars.obstacleTimer++;
      // Spawn interval decreases slightly as speed increases
      const spawnInterval = Math.max(60, 100 - Math.floor(vars.speedFactor * 10));
      if (vars.obstacleTimer > spawnInterval) {
        vars.obstacleTimer = 0;
        const height = 20 + Math.random() * 20;
        const width = 10 + Math.random() * 12;
        vars.obstacles.push({
          x: canvas.width,
          width,
          height,
          speed: (3.5 + Math.random() * 1.5) * vars.speedFactor,
        });
      }

      // Speed increases gradually
      vars.speedFactor += 0.0003;

      for (let i = vars.obstacles.length - 1; i >= 0; i--) {
        const obs = vars.obstacles[i];
        obs.x -= obs.speed;

        // Collision detection
        const botLeft = 30;
        const botRight = 30 + vars.botSize;
        const botTop = vars.botY;
        const botBottom = vars.botY + vars.botSize;

        const obsLeft = obs.x;
        const obsRight = obs.x + obs.width;
        const obsTop = vars.groundY - obs.height;
        const obsBottom = vars.groundY;

        // Simple AABB Box Collision
        if (
          botRight > obsLeft + 2 &&
          botLeft < obsRight - 2 &&
          botBottom > obsTop + 2 &&
          botTop < obsBottom
        ) {
          // Game Over
          setGameState('gameover');
          return;
        }

        // Draw obstacle (red neon spike)
        ctx.fillStyle = '#ef4444'; // red-500
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#ef4444';
        
        ctx.beginPath();
        ctx.moveTo(obs.x, vars.groundY);
        ctx.lineTo(obs.x + obs.width / 2, vars.groundY - obs.height);
        ctx.lineTo(obs.x + obs.width, vars.groundY);
        ctx.closePath();
        ctx.fill();

        // Remove out-of-screen obstacles
        if (obs.x + obs.width < 0) {
          vars.obstacles.splice(i, 1);
        }
      }

      // 5. Update Score
      vars.scoreTimer++;
      if (vars.scoreTimer % 5 === 0) {
        setScore(prev => {
          const next = prev + 1;
          if (next > highScore) {
            setHighScore(next);
            try {
              localStorage.setItem('one_dino_highscore', next.toString());
            } catch (e) {
              console.error(e);
            }
          }
          return next;
        });
      }

      // Continue loop
      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, highScore]);

  // If online, do not render the offline screen
  if (!isOffline) return null;

  return (
    <div className="fixed inset-0 bg-[#09090b] z-50 flex flex-col items-center justify-center p-4">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-zinc-950/60 border border-zinc-800/80 rounded-3xl p-6 backdrop-blur-2xl text-center relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>

        {/* Offline Status */}
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl animate-pulse">
            <WifiOff className="w-6 h-6 text-red-400" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-white tracking-tight mb-1">Connection Lost</h2>
        <p className="text-xs text-zinc-500 max-w-xs mx-auto mb-6 leading-relaxed">
          You are currently offline. Check your internet connection or play our mini-game while waiting!
        </p>

        {/* Interactive Canvas Game */}
        <div 
          onClick={triggerJump}
          className="relative bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-2 cursor-pointer select-none overflow-hidden h-44 flex flex-col justify-end active:border-blue-500/50 transition-colors"
        >
          <canvas ref={canvasRef} className="w-full h-40 max-w-full" />

          {/* Game Over / Idle States Overlay */}
          {gameState === 'idle' && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-2 p-4">
              <span className="text-sm font-semibold text-white">ONE Bot Runner</span>
              <p className="text-[10px] text-zinc-500">Tap or Press Spacebar to Jump & Start</p>
              <button 
                onClick={(e) => { e.stopPropagation(); startGame(); }}
                className="mt-2 px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Play Game
              </button>
            </div>
          )}

          {gameState === 'gameover' && (
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center gap-1.5 p-4">
              <span className="text-sm font-black text-red-400 uppercase tracking-widest">Game Over</span>
              <span className="text-xs text-zinc-400 font-mono">Score: {score}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); startGame(); }}
                className="mt-2 flex items-center gap-1 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-[10px] font-bold border border-zinc-700"
              >
                <RotateCcw className="w-3 h-3" />
                Retry
              </button>
            </div>
          )}

          {/* Live Game Score Board */}
          {gameState === 'playing' && (
            <div className="absolute top-3 right-3 flex items-center gap-3 font-mono text-xs select-none">
              <span className="text-zinc-500">HI: {highScore.toString().padStart(4, '0')}</span>
              <span className="text-blue-400 font-bold">{score.toString().padStart(4, '0')}</span>
            </div>
          )}
        </div>

        {/* Highscore & Instructions Footers */}
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-zinc-900 text-xs text-zinc-500">
          <div className="flex items-center gap-1.5 font-mono">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Best: {highScore}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ArrowUp className="w-3.5 h-3.5 text-blue-400" />
            <span>Tap screen to Jump</span>
          </div>
        </div>

        {/* Real-time re-ping tester */}
        <button 
          onClick={() => {
            // Forcefully test status
            setIsOffline(!navigator.onLine);
          }}
          className="mt-5 w-full flex items-center justify-center gap-2 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs text-zinc-400 hover:text-white transition-all font-medium"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Check Online Status</span>
        </button>
      </div>
    </div>
  );
}
