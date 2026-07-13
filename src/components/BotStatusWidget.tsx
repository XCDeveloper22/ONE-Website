import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Clock, Zap, AlertCircle, Sparkles, RefreshCw, Cpu, Database } from 'lucide-react';

export default function BotStatusWidget() {
  const [latency, setLatency] = useState(19);
  const [latencyHistory, setLatencyHistory] = useState<number[]>([18, 20, 19, 21, 18, 19, 22, 20, 19, 21, 19, 18, 20, 19, 19]);
  const [uptimeSeconds, setUptimeSeconds] = useState(1067452); // Starts at ~12 days, 8 hours, 30 minutes
  const [isPinging, setIsPinging] = useState(false);
  const [pingMessage, setPingMessage] = useState('');
  const [cpuUsage, setCpuUsage] = useState(1.1);
  const [ramUsage, setRamUsage] = useState(48.2);
  const [heartbeatAck, setHeartbeatAck] = useState(true);

  // References for live interval management
  const historyRef = useRef<number[]>(latencyHistory);
  historyRef.current = latencyHistory;

  // 1. Live Uptime Ticker
  useEffect(() => {
    const ticker = setInterval(() => {
      setUptimeSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(ticker);
  }, []);

  // 2. Real-time fluctuating latency, CPU & RAM
  useEffect(() => {
    const fluctuation = setInterval(() => {
      // Don't fluctuate while a manual ping test is running
      if (isPinging) return;

      // Small natural fluctuation
      const diff = Math.random() > 0.5 ? 1 : -1;
      const newLatency = Math.max(14, Math.min(28, latency + diff));
      setLatency(newLatency);

      // Append to trendline history (keep last 15 points)
      setLatencyHistory(prev => {
        const next = [...prev.slice(1), newLatency];
        return next;
      });

      // Fluctuate CPU & RAM slightly
      setCpuUsage(prev => {
        const delta = (Math.random() - 0.5) * 0.15;
        return parseFloat(Math.max(0.6, Math.min(2.4, prev + delta)).toFixed(2));
      });

      setRamUsage(prev => {
        const delta = (Math.random() - 0.5) * 0.2;
        return parseFloat(Math.max(46.0, Math.min(50.5, prev + delta)).toFixed(1));
      });

      // Quick pulse of heartbeat indicator
      setHeartbeatAck(false);
      setTimeout(() => setHeartbeatAck(true), 150);

    }, 3000);

    return () => clearInterval(fluctuation);
  }, [latency, isPinging]);

  // Format uptime to Days, Hours, Minutes, Seconds
  const formatUptime = (totalSeconds: number) => {
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      days,
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.toString().padStart(2, '0')
    };
  };

  const formattedUptime = formatUptime(uptimeSeconds);

  // 3. Interactive Ping Test
  const runPingTest = () => {
    if (isPinging) return;
    setIsPinging(true);
    setPingMessage('Sending WebSocket Heartbeat...');

    setTimeout(() => {
      setPingMessage('Waiting for Discord API Gateway reply...');
      setTimeout(() => {
        // Generate a fast random latency for the test result
        const testResult = Math.floor(15 + Math.random() * 8);
        setLatency(testResult);
        setLatencyHistory(prev => [...prev.slice(1), testResult]);
        setPingMessage(`Acknowledged! Roundtrip: ${testResult}ms`);
        
        setTimeout(() => {
          setIsPinging(false);
          setPingMessage('');
        }, 1500);
      }, 700);
    }, 600);
  };

  // Generate SVG path for trendline
  const generateTrendlinePath = () => {
    const width = 160;
    const height = 40;
    const points = historyRef.current;
    if (points.length === 0) return '';

    const max = 30; // Max reference height
    const min = 12; // Min reference height
    const range = max - min;

    const coords = points.map((val, i) => {
      const x = (i / (points.length - 1)) * width;
      // Invert Y so higher latency is higher on screen
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    });

    return `M ${coords.join(' L ')}`;
  };

  return (
    <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/60 p-5 md:p-6 rounded-3xl relative overflow-hidden group hover:border-zinc-700/80 transition-all shadow-xl">
      {/* Background glow flares */}
      <div className="absolute -right-12 -top-12 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/10 transition-all"></div>
      <div className="absolute -left-12 -bottom-12 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-center justify-between mb-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20 shadow-inner">
            <Activity className="w-5 h-5 text-blue-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm md:text-base tracking-tight flex items-center gap-1.5">
              Bot Status
              <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                Active
              </span>
            </h3>
            <p className="text-[11px] text-zinc-500 font-medium">ONE Gateway Server Core</p>
          </div>
        </div>

        {/* Re-ping Button */}
        <button
          onClick={runPingTest}
          disabled={isPinging}
          className={`p-2 rounded-xl bg-zinc-950/60 border border-zinc-800 hover:border-blue-500/30 text-zinc-400 hover:text-blue-400 transition-all ${isPinging ? 'cursor-not-allowed opacity-50' : 'active:scale-95'}`}
          title="Run Latency Ping Test"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin text-blue-400' : ''}`} />
        </button>
      </div>

      {/* Latency & Uptime Display Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
        
        {/* Latency Display Box */}
        <div className="bg-zinc-950/40 border border-zinc-800/50 rounded-2xl p-4 flex flex-col justify-between h-[120px] relative overflow-hidden group/item hover:border-zinc-800 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              Gateway Latency
            </span>
            <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900/60 px-1.5 py-0.5 rounded border border-zinc-800/80">
              API PING
            </span>
          </div>

          <div className="flex items-baseline gap-1 mt-2">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={latency}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-3xl font-black text-white tracking-tighter"
              >
                {latency}
              </motion.span>
            </AnimatePresence>
            <span className="text-xs font-bold text-blue-400 font-mono">ms</span>
            <span className="ml-2 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              Excellent
            </span>
          </div>

          {/* Sparkline trendline visualizer */}
          <div className="h-10 mt-2 flex items-end justify-between relative">
            <svg className="w-full h-8 overflow-visible">
              <defs>
                <linearGradient id="latencyGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Glow background */}
              <path
                d={`${generateTrendlinePath()} L 160,40 L 0,40 Z`}
                fill="url(#latencyGlow)"
                className="transition-all duration-300"
              />
              {/* Stroke line */}
              <path
                d={generateTrendlinePath()}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-300 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
              />
            </svg>
          </div>
        </div>

        {/* Uptime Display Box */}
        <div className="bg-zinc-950/40 border border-zinc-800/50 rounded-2xl p-4 flex flex-col justify-between h-[120px] relative overflow-hidden group/item hover:border-zinc-800 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              Bot Uptime
            </span>
            <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900/60 px-1.5 py-0.5 rounded border border-zinc-800/80">
              STABLE
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1 text-center mt-3">
            <div>
              <div className="text-xl font-black text-white font-mono tracking-tight">{formattedUptime.days}</div>
              <div className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider">Days</div>
            </div>
            <div>
              <div className="text-xl font-black text-white font-mono tracking-tight">{formattedUptime.hours}</div>
              <div className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider">Hrs</div>
            </div>
            <div>
              <div className="text-xl font-black text-white font-mono tracking-tight">{formattedUptime.minutes}</div>
              <div className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider">Mins</div>
            </div>
            <div>
              <div className="text-xl font-black text-purple-400 font-mono tracking-tight animate-pulse">{formattedUptime.seconds}</div>
              <div className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider">Secs</div>
            </div>
          </div>

          <div className="mt-2 text-[9px] text-zinc-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0"></span>
            <span>Uptime tracked via continuous heartbeat loop</span>
          </div>
        </div>

      </div>

      {/* Sub metrics & Live Logs / Interactive Feedback banner */}
      <div className="mt-4 pt-3 border-t border-zinc-900 grid grid-cols-3 gap-2 relative z-10">
        <div className="bg-zinc-950/30 border border-zinc-900 px-3 py-2 rounded-xl flex flex-col">
          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide flex items-center gap-1">
            <Cpu className="w-3 h-3 text-zinc-400" />
            CPU Usage
          </span>
          <span className="text-xs font-bold text-zinc-300 font-mono mt-0.5">{cpuUsage}%</span>
        </div>
        <div className="bg-zinc-950/30 border border-zinc-900 px-3 py-2 rounded-xl flex flex-col">
          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide flex items-center gap-1">
            <Database className="w-3 h-3 text-zinc-400" />
            RAM Usage
          </span>
          <span className="text-xs font-bold text-zinc-300 font-mono mt-0.5">{ramUsage} MB</span>
        </div>
        <div className="bg-zinc-950/30 border border-zinc-900 px-3 py-2 rounded-xl flex flex-col justify-center">
          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide flex items-center gap-1">
            Heartbeat Ack
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`w-2 h-2 rounded-full transition-colors duration-150 ${heartbeatAck ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]' : 'bg-zinc-600'}`}></span>
            <span className="text-[10px] text-zinc-400 font-bold font-mono">1.0s</span>
          </div>
        </div>
      </div>

      {/* Ping Interactive Overlay Dialog Banner */}
      <AnimatePresence>
        {isPinging && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute inset-x-3 bottom-3 bg-zinc-950 border border-zinc-800 rounded-2xl p-3 flex items-center gap-3 z-20 shadow-2xl"
          >
            <div className="p-1.5 bg-blue-500/10 rounded-lg shrink-0">
              <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">Gateway Diagnostic</span>
              <p className="text-xs font-medium text-zinc-300 truncate mt-0.5">{pingMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
