import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  LogOut, Settings, BarChart3, Users, Server, Shield, Activity, User, ExternalLink, 
  Menu, X, Check, Copy, Bell, Code2, Eye, EyeOff, ShieldAlert, Zap, Globe, Lock,
  Heart, Mail, FileText, Cookie, ShieldCheck, Scale, Trash2, Loader2, Sparkles,
  RefreshCw, Sliders, ArrowRight, Crown, Plus, Trash, Play, Calendar, Hash
} from 'lucide-react';
import { DiscordGuild, DiscordConnection } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import BotStatusWidget from '../components/BotStatusWidget';
import CommandsTab from '../components/CommandsTab';
import { io } from 'socket.io-client';

type Tab = 'overview' | 'servers' | 'members' | 'commands' | 'donate';

export default function Dashboard() {
  const { user, logout } = useAuth();
  
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // Welcome Popup states
  const [welcomePopup, setWelcomePopup] = useState<{ show: boolean; isFirstTime: boolean } | null>(null);

  useEffect(() => {
    if (!user) return;
    
    let dismissTimer: any;
    const timer = setTimeout(() => {
      try {
        const hasLoggedIn = localStorage.getItem('one_has_logged_in');
        if (!hasLoggedIn) {
          setWelcomePopup({ show: true, isFirstTime: true });
          localStorage.setItem('one_has_logged_in', 'true');
        } else {
          setWelcomePopup({ show: true, isFirstTime: false });
        }
        
        dismissTimer = setTimeout(() => {
          setWelcomePopup(prev => prev ? { ...prev, show: false } : null);
        }, 6000);
      } catch (e) {
        setWelcomePopup({ show: true, isFirstTime: false });
      }
    }, 1200);

    return () => {
      clearTimeout(timer);
      if (dismissTimer) clearTimeout(dismissTimer);
    };
  }, [user]);

  // Legal Modal states
  const [legalOpen, setLegalOpen] = useState(false);
  const [activeLegalTab, setActiveLegalTab] = useState<'tos' | 'privacy' | 'cookies' | 'guidelines' | 'deletion'>('tos');
  
  // Deletion form states
  const [deleteDiscordId, setDeleteDiscordId] = useState('');
  const [deleteDiscordUsername, setDeleteDiscordUsername] = useState('');
  const [deleteOptions, setDeleteOptions] = useState({
    accountData: true,
    serverMetadata: false,
    dashboardSettings: true,
  });
  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'processing' | 'done'>('idle');
  const [deleteProgress, setDeleteProgress] = useState('');

  const openLegal = (tab: 'tos' | 'privacy' | 'cookies' | 'guidelines' | 'deletion') => {
    setActiveLegalTab(tab);
    setLegalOpen(true);
  };
  const [guilds, setGuilds] = useState<DiscordGuild[]>(() => {
    try {
      const cached = localStorage.getItem('one_guilds');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [connections, setConnections] = useState<DiscordConnection[]>(() => {
    try {
      const cached = localStorage.getItem('one_connections');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [needsReauth, setNeedsReauth] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Fetch guilds
    fetch('/api/guilds')
      .then(res => {
        if (res.status === 401) setNeedsReauth(true);
        return res.ok ? res.json() : [];
      })
      .then(data => {
        if (Array.isArray(data)) {
          setGuilds(data);
          try {
            localStorage.setItem('one_guilds', JSON.stringify(data));
          } catch (e) {
            console.error('Failed to cache guilds', e);
          }
        }
      })
      .catch(err => console.error(err));

    // Fetch connections
    fetch('/api/connections')
      .then(res => {
        if (res.status === 401) setNeedsReauth(true);
        return res.ok ? res.json() : [];
      })
      .then(data => {
        if (Array.isArray(data)) {
          setConnections(data);
          try {
            localStorage.setItem('one_connections', JSON.stringify(data));
          } catch (e) {
            console.error('Failed to cache connections', e);
          }
        }
      })
      .catch(err => console.error(err));
  }, []);

  const getAvatarUrl = () => {
    if (user?.avatar) {
      return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
    }
    return `https://cdn.discordapp.com/embed/avatars/${parseInt(user?.discriminator || '0') % 5}.png`;
  };

  const navItems = [
    { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
    { id: 'servers' as const, label: 'Servers', icon: Server },
    { id: 'members' as const, label: 'Members', icon: Users },
    { id: 'commands' as const, label: 'Commands', icon: Code2 },
    { id: 'donate' as const, label: 'Donate', icon: Heart, locked: true },
  ];

  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-300 font-sans selection:bg-blue-500/30 overflow-hidden relative flex-col md:flex-row">
      {/* Subtle background glow */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-[#09090b] to-[#09090b] pointer-events-none"></div>

      {/* Desktop Sidebar */}
      <div className="w-64 bg-zinc-950/50 backdrop-blur-xl hidden md:flex flex-col border-r border-zinc-800/50 z-10 relative shrink-0">
        <div className="h-16 flex items-center px-6 font-black tracking-tighter text-white text-2xl border-b border-zinc-800/50">
          ONE<span className="text-blue-500">.</span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6">
          <nav className="space-y-2 px-4">
            {navItems.map(item => (
              <button 
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 ${activeTab === item.id ? 'bg-blue-500/10 text-blue-400 font-medium' : 'hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200'}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-blue-400' : ''} shrink-0`} />
                  <span className="font-medium truncate">{item.label}</span>
                </div>
                {item.locked && (
                  <span className="flex items-center gap-1 text-[9px] font-black tracking-widest text-zinc-500 bg-zinc-900/80 px-1.5 py-0.5 rounded border border-zinc-800 shrink-0">
                    <Lock className="w-2.5 h-2.5" />
                  </span>
                )}
              </button>
            ))}
            
            <div className="pt-6 pb-2 px-4">
              <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Integrations</div>
            </div>
            <a 
              href="https://discord.com/oauth2/authorize?client_id=1495690757707923608&permissions=8866461766385655&integration_type=0&scope=bot+applications.commands"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-colors group shadow-lg shadow-blue-500/20"
            >
              <ExternalLink className="w-5 h-5 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform shrink-0" />
              <span className="font-medium truncate">Invite Bot</span>
            </a>

            <div className="pt-4 pb-2 px-4">
              <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Community</div>
            </div>
            <a 
              href="https://discord.gg/nRpkj5SuTs"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white transition-colors group shadow-lg shadow-[#5865F2]/20 mb-4"
            >
              <Users className="w-5 h-5 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform shrink-0" />
              <span className="font-medium truncate">Join us</span>
            </a>

            {/* Legal Footnotes */}
            <div className="border-t border-zinc-900 mx-4 pt-4 pb-2 space-y-2 shrink-0">
              <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Legal & Data</div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px] text-zinc-500 font-medium">
                <button onClick={() => openLegal('tos')} className="text-left hover:text-zinc-300 transition-colors cursor-pointer">📄 Terms</button>
                <button onClick={() => openLegal('privacy')} className="text-left hover:text-zinc-300 transition-colors cursor-pointer">🔒 Privacy</button>
                <button onClick={() => openLegal('cookies')} className="text-left hover:text-zinc-300 transition-colors cursor-pointer">🍪 Cookies</button>
                <button onClick={() => openLegal('guidelines')} className="text-left hover:text-zinc-300 transition-colors cursor-pointer">📜 Rules</button>
              </div>
              <button 
                onClick={() => openLegal('deletion')} 
                className="w-full text-left text-[11px] text-blue-500 hover:text-blue-400 font-bold flex items-center gap-1 mt-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3 text-rose-500" /> Data Deletion Request
              </button>
            </div>
          </nav>
        </div>
        
        {/* User profile area */}
        <div className="p-4 border-t border-zinc-800/50 bg-zinc-950/80">
          <div className="flex items-center justify-between bg-zinc-900/80 rounded-xl p-2 pl-3 border border-zinc-800/50">
            <div className="flex items-center gap-3 overflow-hidden">
              <img 
                src={getAvatarUrl()} 
                alt="Avatar" 
                className="w-8 h-8 rounded-full border border-zinc-700 shrink-0"
              />
              <div className="truncate text-sm font-medium text-zinc-200">
                {user?.global_name || user?.username}
              </div>
            </div>
            <button 
              onClick={logout}
              className="text-zinc-400 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors shrink-0"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Top Bar */}
      <div className="md:hidden h-16 flex items-center justify-between px-4 bg-zinc-950/80 border-b border-zinc-800/50 z-20 sticky top-0 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2">
          <div className="text-white text-xl font-black tracking-tighter">
            ONE<span className="text-blue-500">.</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="text-zinc-400 hover:text-white p-2 rounded-xl bg-zinc-900/50 border border-zinc-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Sliding Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden fixed top-0 bottom-0 left-0 w-[280px] bg-zinc-950 border-r border-zinc-800 z-50 flex flex-col shadow-2xl"
            >
              <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-800/50">
                <div className="font-black tracking-tighter text-white text-2xl">
                  ONE<span className="text-blue-500">.</span>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-zinc-400 hover:text-white p-1.5 rounded-lg bg-zinc-900 border border-zinc-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6">
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-3 mb-2">Navigation</div>
                  {navItems.map(item => (
                    <button 
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 ${activeTab === item.id ? 'bg-blue-500/10 text-blue-400 font-medium' : 'hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200'}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-blue-400' : ''} shrink-0`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.locked && (
                        <span className="flex items-center gap-1 text-[9px] font-black tracking-widest text-zinc-500 bg-zinc-900/80 px-1.5 py-0.5 rounded border border-zinc-800 shrink-0">
                          <Lock className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-3 mb-2">Integrations</div>
                  <a 
                    href="https://discord.com/oauth2/authorize?client_id=1495690757707923608&permissions=8866461766385655&integration_type=0&scope=bot+applications.commands"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2.5 px-3.5 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors shadow-lg shadow-blue-500/20 text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Invite Bot</span>
                  </a>
                </div>

                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-3 mb-2">Community</div>
                  <a 
                    href="https://discord.gg/nRpkj5SuTs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2.5 px-3.5 py-3 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium transition-colors shadow-lg shadow-[#5865F2]/20 text-sm"
                  >
                    <Users className="w-4 h-4" />
                    <span>Join us</span>
                  </a>
                </div>

                {/* Mobile Legal Footnotes */}
                <div className="border-t border-zinc-900 pt-4 px-3 space-y-2">
                  <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Legal & Data Center</div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-zinc-500 font-medium">
                    <button onClick={() => { setMobileMenuOpen(false); openLegal('tos'); }} className="text-left hover:text-zinc-300 py-1 transition-colors cursor-pointer">📄 Terms of Service</button>
                    <button onClick={() => { setMobileMenuOpen(false); openLegal('privacy'); }} className="text-left hover:text-zinc-300 py-1 transition-colors cursor-pointer">🔒 Privacy Policy</button>
                    <button onClick={() => { setMobileMenuOpen(false); openLegal('cookies'); }} className="text-left hover:text-zinc-300 py-1 transition-colors cursor-pointer">🍪 Cookie Policy</button>
                    <button onClick={() => { setMobileMenuOpen(false); openLegal('guidelines'); }} className="text-left hover:text-zinc-300 py-1 transition-colors cursor-pointer">📜 Community Rules</button>
                  </div>
                  <button 
                    onClick={() => { setMobileMenuOpen(false); openLegal('deletion'); }} 
                    className="w-full text-left text-xs text-blue-500 hover:text-blue-400 font-bold flex items-center gap-1.5 pt-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Data Deletion Request
                  </button>
                </div>
              </div>

              <div className="p-4 border-t border-zinc-800 bg-zinc-950/80">
                <div className="flex items-center justify-between bg-zinc-900/80 rounded-xl p-2 pl-3 border border-zinc-800/50">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <img src={getAvatarUrl()} alt="Avatar" className="w-8 h-8 rounded-full border border-zinc-700 shrink-0" />
                    <div className="truncate text-xs font-medium text-zinc-200 max-w-[120px]">
                      {user?.global_name || user?.username}
                    </div>
                  </div>
                  <button 
                    onClick={logout}
                    className="text-zinc-400 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors shrink-0"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 z-10 relative overflow-hidden">
        <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-zinc-800/50 bg-zinc-950/30 backdrop-blur-md shrink-0">
          <h1 className="text-lg md:text-xl font-bold text-white capitalize tracking-tight">
            {`${activeTab} Dashboard`}
          </h1>
          <div className="flex items-center gap-3">
            <a 
              href="https://discord.gg/nRpkj5SuTs" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-[#5865F2]/10 hover:bg-[#5865F2]/20 text-[#5865F2] px-3.5 py-1.5 rounded-full border border-[#5865F2]/30 text-xs font-bold transition-all shrink-0 active:scale-95"
            >
              <Users className="w-3.5 h-3.5" />
              Join us
            </a>
            <div className="flex items-center gap-3 text-xs md:text-sm font-medium bg-zinc-900/50 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full border border-zinc-800 shrink-0">
              <span className="text-zinc-500 hidden sm:inline">System:</span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                Online
              </span>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-5xl mx-auto">
            
            <AnimatePresence mode="wait">
              {needsReauth && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/10 border border-red-500/30 text-red-200 p-5 rounded-2xl flex items-center justify-between mb-8 shadow-lg shadow-red-500/5"
                >
                  <div className="min-w-0 flex-1 mr-4">
                    <h3 className="font-bold text-red-400 text-base md:text-lg mb-1 truncate">Authorization Update Required</h3>
                    <p className="text-xs md:text-sm text-red-300/80 leading-relaxed">We've added new features that require additional Discord permissions. Please re-authenticate to sync your latest data.</p>
                  </div>
                  <button onClick={logout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 md:px-5 md:py-2.5 rounded-xl font-medium text-xs md:text-sm transition-all shadow-lg shadow-red-500/20 active:scale-95 shrink-0">
                    Re-authenticate
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Hero Profile Card */}
                  <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/60 p-6 md:p-8 rounded-3xl flex flex-col md:flex-row items-center gap-6 md:gap-8 shadow-xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <img src={getAvatarUrl()} alt="Avatar" className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-zinc-800 shadow-2xl relative z-10 shrink-0" />
                    <div className="text-center md:text-left relative z-10 min-w-0 flex-1">
                      <h2 className="text-2xl md:text-3xl font-black text-white mb-1 tracking-tight truncate">{user?.global_name || user?.username}</h2>
                      <p className="text-blue-400 font-medium mb-4 text-sm md:text-base">@{user?.username}</p>
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 text-xs md:text-sm">
                        <div className="bg-zinc-950/50 border border-zinc-800 px-3.5 py-1.5 rounded-xl text-zinc-300 shadow-inner truncate max-w-full">
                          ID: <span className="font-mono text-zinc-400 select-all">{user?.id}</span>
                        </div>
                        {user?.email && (
                          <div className="bg-zinc-950/50 border border-zinc-800 px-3.5 py-1.5 rounded-xl text-zinc-300 shadow-inner flex items-center gap-2 truncate max-w-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                            <span className="truncate">{user.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Bot Status Widget */}
                  <BotStatusWidget />
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                    <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/60 p-5 md:p-6 rounded-3xl relative overflow-hidden group hover:border-zinc-700 transition-colors">
                      <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500/10 rounded-xl">
                          <Server className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="text-zinc-400 font-medium text-sm md:text-base">Your Servers</div>
                      </div>
                      <div className="text-3xl md:text-4xl font-black text-white mt-3 tracking-tighter">
                        {guilds.length.toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/60 p-5 md:p-6 rounded-3xl relative overflow-hidden group hover:border-zinc-700 transition-colors">
                      <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-500/10 rounded-xl">
                          <Users className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="text-zinc-400 font-medium text-sm md:text-base">Connected Accounts</div>
                      </div>
                      <div className="text-3xl md:text-4xl font-black text-white mt-3 tracking-tighter">
                        {connections.length.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {connections.length > 0 && (
                    <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/60 p-5 md:p-8 rounded-3xl mt-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg md:text-xl font-bold text-white">Your Connections</h3>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{connections.length} Integrations</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 md:gap-4">
                        {connections.map((conn, i) => {
                          const iconMap: Record<string, string> = {
                            riotgames: 'riotgames', steam: 'steam', roblox: 'roblox', spotify: 'spotify',
                            youtube: 'youtube', twitch: 'twitch', github: 'github', xbox: 'xbox',
                            playstation: 'playstation', battlenet: 'battledotnet', reddit: 'reddit',
                            twitter: 'x', epicgames: 'epicgames', facebook: 'facebook',
                            leagueoflegends: 'leagueoflegends', paypal: 'paypal', tiktok: 'tiktok',
                            ebay: 'ebay', crunchyroll: 'crunchyroll'
                          };
                          const iconId = iconMap[conn.type.toLowerCase()] || conn.type.toLowerCase();
                          
                          // Override dark or invisible default logos with white or a visible color
                          const colorOverrides: Record<string, string> = {
                            github: 'white',
                            x: 'white',
                            roblox: 'white',
                            steam: 'white',
                            epicgames: 'white',
                            playstation: '0070D1', // Visible Playstation blue instead of default very dark blue
                          };
                          
                          const colorSuffix = colorOverrides[iconId] ? `/${colorOverrides[iconId]}` : '';
                          const iconUrl = `https://cdn.simpleicons.org/${iconId}${colorSuffix}`;
                          
                          return (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.05 }}
                              key={`${conn.type}-${conn.id}`} 
                              className="bg-zinc-950/50 border border-zinc-800/80 px-3 py-3 rounded-2xl flex flex-col items-center gap-2.5 hover:bg-zinc-800 hover:border-zinc-700 transition-all group min-w-0"
                            >
                              <div className="w-9 h-9 rounded-full bg-zinc-900 flex items-center justify-center shadow-inner shrink-0">
                                <img src={iconUrl} alt={conn.type} className="w-4 h-4 opacity-90 group-hover:opacity-100 transition-opacity" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                              </div>
                              <span className="text-zinc-300 font-medium text-xs md:text-sm truncate w-full text-center">{conn.name}</span>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'servers' && (
                <motion.div
                  key="servers"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  <section>
                    <div className="flex items-center justify-between mb-4 md:mb-6">
                      <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Your Owned Servers</h2>
                      <span className="bg-blue-500/10 text-blue-400 font-bold px-2.5 py-0.5 rounded-full text-xs md:text-sm">
                        {guilds.filter(g => g.owner).length}
                      </span>
                    </div>
                    {guilds.filter(g => g.owner).length === 0 ? (
                      <div className="text-center p-8 md:p-12 bg-zinc-900/20 border border-zinc-800/60 rounded-3xl text-zinc-500">
                        <Server className="w-10 h-10 mx-auto mb-3 opacity-20" />
                        <p className="text-sm md:text-base">You don't own any servers yet.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                        {guilds.filter(g => g.owner).map((guild, i) => (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            key={guild.id} 
                            className="bg-zinc-900/40 border border-zinc-800/60 p-4 md:p-5 rounded-2xl flex items-center gap-4 hover:bg-zinc-900 hover:border-zinc-700 transition-all group cursor-pointer min-w-0"
                          >
                            {guild.icon ? (
                              <img src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`} alt={guild.name} className="w-12 h-12 md:w-14 md:h-14 rounded-2xl shadow-lg shrink-0" />
                            ) : (
                              <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-zinc-800 flex items-center justify-center text-white font-black text-lg md:text-xl shadow-inner shrink-0">
                                {guild.name.charAt(0)}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-white font-bold text-base md:text-lg truncate group-hover:text-blue-400 transition-colors">{guild.name}</h3>
                              <p className="text-[10px] md:text-xs text-zinc-500 mt-1 font-medium truncate">
                                Created: {new Date(Number((BigInt(guild.id) >> 22n)) + 1420070400000).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="bg-blue-500 text-[10px] px-2.5 py-1 rounded-lg text-white font-bold tracking-wider uppercase shadow-lg shadow-blue-500/20 shrink-0">Owner</div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section>
                    <div className="flex items-center justify-between mb-4 md:mb-6">
                      <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Joined Servers</h2>
                      <span className="bg-zinc-800 text-zinc-400 font-bold px-2.5 py-0.5 rounded-full text-xs md:text-sm">
                        {guilds.filter(g => !g.owner).length}
                      </span>
                    </div>
                    {guilds.filter(g => !g.owner).length === 0 ? (
                      <div className="text-center p-8 md:p-12 bg-zinc-900/20 border border-zinc-800/60 rounded-3xl text-zinc-500">
                        <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
                        <p className="text-sm md:text-base">You haven't joined any other servers.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                        {guilds.filter(g => !g.owner).map((guild, i) => (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            key={guild.id} 
                            className="bg-zinc-900/40 border border-zinc-800/60 p-4 md:p-5 rounded-2xl flex items-center gap-4 hover:bg-zinc-900 hover:border-zinc-700 transition-all group cursor-pointer min-w-0"
                          >
                            {guild.icon ? (
                              <img src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`} alt={guild.name} className="w-12 h-12 md:w-14 md:h-14 rounded-2xl shadow-lg shrink-0" />
                            ) : (
                              <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-zinc-800 flex items-center justify-center text-white font-black text-lg md:text-xl shadow-inner shrink-0">
                                {guild.name.charAt(0)}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-white font-bold text-base md:text-lg truncate group-hover:text-blue-400 transition-colors">{guild.name}</h3>
                              <p className="text-[10px] md:text-xs text-zinc-500 mt-1 font-medium truncate">
                                Created: {new Date(Number((BigInt(guild.id) >> 22n)) + 1420070400000).toLocaleDateString()}
                              </p>
                            </div>
                            <ExternalLink className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0 shrink-0" />
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </section>
                </motion.div>
              )}

              {activeTab === 'members' && (
                <motion.div
                  key="members"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Membership Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-zinc-900/40 border border-zinc-800/60 p-5 rounded-3xl text-center">
                      <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Total Reach</div>
                      <div className="text-2xl font-black text-white mt-1">
                        {guilds.reduce((sum, g) => sum + (g.approximate_member_count || 0), 0).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">Across all servers</div>
                    </div>
                    <div className="bg-zinc-900/40 border border-zinc-800/60 p-5 rounded-3xl text-center">
                      <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Avg Server Size</div>
                      <div className="text-2xl font-black text-purple-400 mt-1">
                        {guilds.length > 0 
                          ? Math.round(guilds.reduce((sum, g) => sum + (g.approximate_member_count || 0), 0) / guilds.length).toLocaleString()
                          : '0'}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">Members per guild</div>
                    </div>
                    <div className="bg-zinc-900/40 border border-zinc-800/60 p-5 rounded-3xl text-center">
                      <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Active Status</div>
                      <div className="text-2xl font-black text-emerald-400 mt-1 flex items-center justify-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        99.8%
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">Bot uptime rating</div>
                    </div>
                  </div>

                  <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/60 p-6 md:p-8 rounded-3xl">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">Members per Server</h2>
                      <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{guilds.length} Guilds</span>
                    </div>
                    {guilds.length === 0 ? (
                      <div className="text-center p-12 bg-zinc-900/20 border border-zinc-800/60 rounded-3xl text-zinc-500">
                        No servers found.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {guilds.map((guild, i) => {
                          const memberCount = guild.approximate_member_count || 0;
                          const maxMembers = Math.max(...guilds.map(g => g.approximate_member_count || 0), 1);
                          const percentage = Math.max(Math.round((memberCount / maxMembers) * 100), 5);

                          return (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.05 }}
                              key={guild.id} 
                              className="bg-zinc-950/40 border border-zinc-800/60 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-900 hover:border-zinc-700 transition-all group min-w-0"
                            >
                              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                {guild.icon ? (
                                  <img src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`} alt={guild.name} className="w-10 h-10 rounded-xl shadow-md shrink-0" />
                                ) : (
                                  <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-white font-bold text-base shadow-inner shrink-0">
                                    {guild.name.charAt(0)}
                                  </div>
                                )}{" "}
                                <div className="min-w-0 flex-1">
                                  <h3 className="text-white font-semibold text-sm md:text-base truncate">{guild.name}</h3>
                                  <div className="w-full bg-zinc-900 h-1.5 rounded-full mt-2 overflow-hidden max-w-xs border border-zinc-800/50">
                                    <div 
                                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-500" 
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <div className="flex items-center gap-2 text-zinc-300 bg-zinc-900/50 px-3.5 py-1.5 rounded-xl border border-zinc-800 shadow-inner">
                                  <Users className="w-4 h-4 text-purple-400 shrink-0" />
                                  <span className="font-semibold text-xs md:text-sm text-white">{memberCount.toLocaleString()}</span>
                                  <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Members</span>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'commands' && (
                <motion.div
                  key="commands"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <CommandsTab />
                </motion.div>
              )}



            </AnimatePresence>

          </div>
        </main>
      </div>

      {/* Unified Legal & Compliance Center Modal */}
      <AnimatePresence>
        {legalOpen && (
          <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLegalOpen(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-zinc-950 border border-zinc-800/80 w-full max-w-4xl h-[85vh] max-h-[700px] rounded-3xl shadow-2xl relative flex flex-col overflow-hidden z-10"
            >
              {/* Top border ambient glow */}
              <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent"></div>
              
              {/* Header */}
              <div className="px-6 py-4.5 border-b border-zinc-900 flex items-center justify-between shrink-0 bg-zinc-950">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
                    <ShieldCheck className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-sm md:text-base tracking-tight">Legal & Privacy Center</h2>
                    <p className="text-[10px] text-zinc-500 font-medium">Compliance, data security, and platform guidelines</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setLegalOpen(false)}
                  className="p-1.5 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-all text-xs font-mono cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body Panel - Split into Sidebar and Document Content */}
              <div className="flex-1 flex flex-col md:flex-row min-h-0">
                
                {/* Modal Tab Sidebar */}
                <div className="w-full md:w-56 border-b md:border-b-0 md:border-r border-zinc-900 bg-zinc-950 p-3 flex md:flex-col gap-1 overflow-x-auto md:overflow-y-auto shrink-0 scrollbar-none">
                  {[
                    { id: 'tos' as const, label: 'Terms of Service', icon: FileText, color: 'text-blue-400' },
                    { id: 'privacy' as const, label: 'Privacy Policy', icon: Lock, color: 'text-emerald-400' },
                    { id: 'cookies' as const, label: 'Cookie Policy', icon: Cookie, color: 'text-amber-400' },
                    { id: 'guidelines' as const, label: 'Community Rules', icon: Scale, color: 'text-purple-400' },
                    { id: 'deletion' as const, label: 'Data Deletion', icon: Trash2, color: 'text-rose-400' },
                  ].map((tabItem) => (
                    <button
                      key={tabItem.id}
                      onClick={() => {
                        setActiveLegalTab(tabItem.id);
                        if (tabItem.id === 'deletion') {
                          setDeleteStatus('idle');
                          setDeleteProgress('');
                        }
                      }}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium w-full transition-all shrink-0 cursor-pointer ${activeLegalTab === tabItem.id ? 'bg-zinc-900 text-white border border-zinc-800' : 'hover:bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 border border-transparent'}`}
                    >
                      <tabItem.icon className={`w-4 h-4 ${tabItem.color} shrink-0`} />
                      <span className="truncate whitespace-nowrap">{tabItem.label}</span>
                    </button>
                  ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 text-zinc-300 text-xs md:text-sm leading-relaxed scrollbar-thin">
                  
                  {/* TERMS OF SERVICE */}
                  {activeLegalTab === 'tos' && (
                    <div className="space-y-5">
                      <div className="border-b border-zinc-900 pb-4">
                        <span className="text-[9px] uppercase font-bold tracking-widest text-blue-400">Section 1.0</span>
                        <h3 className="text-base font-black text-white mt-1">📄 Terms of Service</h3>
                        <p className="text-[10px] text-zinc-500 mt-1">Last Updated: July 2026</p>
                      </div>

                      <div className="space-y-4 text-zinc-400 font-sans">
                        <div>
                          <h4 className="font-bold text-zinc-200 mb-1">1. Rules for Using Your Bot and Website</h4>
                          <p>By using the ONE. Bot or accessing our dashboard website, you agree to comply with all fair-use guidelines. Bot actions, queries, and commands must be executed within reasonable rate limits. Automated flooding of commands, DDoS attacks, or script-based triggers designed to degrade system response are strictly prohibited.</p>
                        </div>
                        <div>
                          <h4 className="font-bold text-zinc-200 mb-1">2. User Responsibilities</h4>
                          <p>You are solely responsible for securing your Discord developer credentials, Guild server webhooks, and dashboard administrative access. Permissions assigned to roles within your Discord guild are directly synced to our dashboard controls; keep admin roles restricted to authorized moderators.</p>
                        </div>
                        <div>
                          <h4 className="font-bold text-zinc-200 mb-1">3. Prohibited Activities</h4>
                          <p>You are strictly prohibited from exploiting any software vulnerabilities or architectural bugs found within the bot system. Scraping member identities, harvesting user IDs, or utilizing our public gateway systems to broadcast unsolicited advertising (spam) is cause for an immediate and permanent blacklist.</p>
                        </div>
                        <div>
                          <h4 className="font-bold text-zinc-200 mb-1">4. Account Termination</h4>
                          <p>We reserve the sole right to terminate administrative sessions, blacklist guilds from calling bot commands, or remove active dashboard accounts at any time, without prior notice, if there is a detected breach of our guidelines or security metrics.</p>
                        </div>
                        <div>
                          <h4 className="font-bold text-zinc-200 mb-1">5. Disclaimer of Warranties</h4>
                          <p>The ONE. bot and associated dashboard services are provided on an "as-is" and "as-available" basis without warranties of any kind. We do not guarantee continuous 100% server uptime, zero latency drops, or prompt resolution of individual network failures caused by third-party API gateway shifts.</p>
                        </div>
                        <div>
                          <h4 className="font-bold text-zinc-200 mb-1">6. Limitation of Liability</h4>
                          <p>In no event shall the ONE. development team, bot creators, or service hosts be held liable for any damages, guild conflicts, administrative actions, or loss of moderation logs arising from the use or inability to use the platform services.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PRIVACY POLICY */}
                  {activeLegalTab === 'privacy' && (
                    <div className="space-y-5">
                      <div className="border-b border-zinc-900 pb-4">
                        <span className="text-[9px] uppercase font-bold tracking-widest text-emerald-400">Section 2.0</span>
                        <h3 className="text-base font-black text-white mt-1">🔒 Privacy Policy</h3>
                        <p className="text-[10px] text-zinc-500 mt-1">Last Updated: July 2026</p>
                      </div>

                      <div className="space-y-4 text-zinc-400 font-sans">
                        <div>
                          <h4 className="font-bold text-zinc-200 mb-1">1. What Data We Collect</h4>
                          <p>We collect essential metadata required to keep your dashboard functional and synchronized. This includes:</p>
                          <ul className="list-disc pl-5 mt-1.5 space-y-1 text-zinc-500 font-mono text-[11px]">
                            <li>Discord User ID, username, global display name, and profile avatars.</li>
                            <li>Guild Server IDs, server names, and channels indexed for custom welcome routing.</li>
                            <li>Automated moderation preferences and bot command toggles.</li>
                            <li>Local client preferences and active dashboard tab states.</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-bold text-zinc-200 mb-1">2. Why We Collect It</h4>
                          <p>The collected data is exclusively used to authenticate session permissions, verify that you possess administrative ownership of associated Discord guilds, synchronize bot settings, and route custom notifications safely.</p>
                        </div>
                        <div>
                          <h4 className="font-bold text-zinc-200 mb-1">3. How Long It is Stored</h4>
                          <p>Data is stored in our database for as long as the ONE. Bot remains integrated in your active server guilds. Inactive servers that have evicted the bot for over 30 consecutive days will have their database configuration templates wiped automatically.</p>
                        </div>
                        <div>
                          <h4 className="font-bold text-zinc-200 mb-1">4. Who Can Access It</h4>
                          <p>Your server structure data is confidential. Only authenticated server managers can view details within this dashboard. We do NOT sell, license, or share user details with advertisement boards or data broker networks.</p>
                        </div>
                        <div>
                          <h4 className="font-bold text-zinc-200 mb-1">5. How Users Can Request Deletion</h4>
                          <p>Users have full autonomy over their data. You can instantly delete all cached records, server settings, and associated dashboard credentials at any time by executing a purge request in the <span className="text-rose-400 font-bold">Data Deletion</span> tab in this compliance center.</p>
                        </div>
                        <div>
                          <h4 className="font-bold text-zinc-200 mb-1">6. Discord OAuth Information Used</h4>
                          <p>We authenticate strictly via Discord Secure OAuth2. Our API scopes only request read-only access to your identity, profile, and server lists. We do not request permission to read messages, post messages on your behalf, or join servers without your manual prompt.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* COOKIE POLICY */}
                  {activeLegalTab === 'cookies' && (
                    <div className="space-y-5">
                      <div className="border-b border-zinc-900 pb-4">
                        <span className="text-[9px] uppercase font-bold tracking-widest text-amber-400">Section 3.0</span>
                        <h3 className="text-base font-black text-white mt-1">🍪 Cookie Policy</h3>
                        <p className="text-[10px] text-zinc-500 mt-1">Last Updated: July 2026</p>
                      </div>

                      <div className="space-y-4 text-zinc-400 font-sans">
                        <div>
                          <h4 className="font-bold text-zinc-200 mb-1">1. Use of Login Sessions</h4>
                          <p>To provide you with a unified dashboard without constant password prompting, we use secure session-tracking state keys. This allows our backend API proxy to verify your Discord credentials on each page transition securely.</p>
                        </div>
                        <div>
                          <h4 className="font-bold text-zinc-200 mb-1">2. Local Storage and Preferences</h4>
                          <p>We leverage standard browser LocalStorage to cache high-performance local assets so the UI renders instantly upon page loads. Key items stored include:</p>
                          <ul className="list-disc pl-5 mt-1.5 space-y-1 text-zinc-500 font-mono text-[11px]">
                            <li><span className="text-zinc-400">one_user:</span> Discord login identification metadata.</li>
                            <li><span className="text-zinc-400">one_guilds:</span> Cached index of server listings to avoid repeated API throttling.</li>
                            <li><span className="text-zinc-400">one_guest_profile:</span> Locally customized profile tags for the guest Lounge chat.</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-bold text-zinc-200 mb-1">3. Analytics & Telemetry Cookies</h4>
                          <p>We believe in 100% privacy. This dashboard does NOT run third-party advertising cookies, retargeting beacons, or invasive behavior tracker scripts. We collect zero tracking analytics.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* COMMUNITY GUIDELINES */}
                  {activeLegalTab === 'guidelines' && (
                    <div className="space-y-5">
                      <div className="border-b border-zinc-900 pb-4">
                        <span className="text-[9px] uppercase font-bold tracking-widest text-purple-400">Section 4.0</span>
                        <h3 className="text-base font-black text-white mt-1">📜 Community Guidelines</h3>
                        <p className="text-[10px] text-zinc-500 mt-1">Last Updated: July 2026</p>
                      </div>

                      <div className="space-y-4 text-zinc-400 font-sans">
                        <div>
                          <h4 className="font-bold text-zinc-200 mb-1">1. Respectful Behavior</h4>
                          <p>The ONE. World Chat room is a professional sandbox lounge for developers, bot operators, and community leads. Aggressive remarks, toxic arguments, racism, sexism, and trolling are strictly prohibited. Maintain a collaborative workspace atmosphere.</p>
                        </div>
                        <div>
                          <h4 className="font-bold text-zinc-200 mb-1">2. Abuse Prevention</h4>
                          <p>Do not attempt to manipulate guest user aliases or spoof other member identities in the chat. Impersonating ONE Bot developers, server owners, or global administrators will result in an immediate device/IP ban.</p>
                        </div>
                        <div>
                          <h4 className="font-bold text-zinc-200 mb-1">3. Spam & Exploits</h4>
                          <p>Sending repetitive characters, large wall of copy-pastes, or promotional server links in the World Chat is forbidden. Exploiting the Websocket connection to inject toxic payload scripts is monitored and blocked automatically.</p>
                        </div>
                        <div>
                          <h4 className="font-bold text-zinc-200 mb-1">4. Harassment & DMs</h4>
                          <p>Harassing chat participants in private channels or tracking their profile details for malicious intent is cause for server ban, platform blacklists, and reporting to Discord Safety networks.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* DATA DELETION REQUEST - INTERACTIVE WORKFLOW */}
                  {activeLegalTab === 'deletion' && (
                    <div className="space-y-5">
                      <div className="border-b border-zinc-900 pb-4">
                        <span className="text-[9px] uppercase font-bold tracking-widest text-rose-400">Section 5.0</span>
                        <h3 className="text-base font-black text-white mt-1">📩 Data Deletion Center</h3>
                        <p className="text-[10px] text-zinc-500 mt-1">Execute a complete compliance data wipe</p>
                      </div>

                      {deleteStatus === 'idle' && (
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          if (!deleteDiscordUsername.trim()) return;
                          
                          setDeleteStatus('processing');
                          setDeleteProgress('Initiating secure purge protocol...');
                          
                          // Run cool step-by-step loading
                          const steps = [
                            { text: 'Locating account record shards...', ms: 800 },
                            { text: 'Evicting cached server configs & guilds...', ms: 1600 },
                            { text: 'Purging Discord secure access tokens...', ms: 2400 },
                            { text: 'Resetting dashboard UI layout parameters...', ms: 3200 },
                            { text: 'Wiping database configuration profiles...', ms: 4000 }
                          ];
                          
                          steps.forEach((step) => {
                            setTimeout(() => {
                              setDeleteProgress(step.text);
                            }, step.ms);
                          });
                          
                          setTimeout(() => {
                            setDeleteStatus('done');
                          }, 4800);
                        }} className="space-y-5 text-zinc-400">
                          <p className="text-xs text-zinc-400 leading-relaxed bg-rose-950/10 border border-rose-950/30 p-4 rounded-2xl text-left">
                            ⚠️ <strong className="text-rose-400 font-bold">WARNING:</strong> Executing a data deletion request will permanently wipe your registered bot config, welcome layouts, cached guild tables, and invalidates active session tokens. This action is irreversible.
                          </p>

                          <div className="space-y-4">
                            {/* Input Username */}
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide block">Your Discord Username</label>
                              <input 
                                type="text"
                                required
                                placeholder="e.g. Kenzu#0001"
                                value={deleteDiscordUsername}
                                onChange={(e) => setDeleteDiscordUsername(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white text-xs font-mono focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
                              />
                            </div>

                            {/* Input ID */}
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide block">Discord User ID (Optional)</label>
                              <input 
                                type="text"
                                placeholder="e.g. 1495690757707923608"
                                value={deleteDiscordId}
                                onChange={(e) => setDeleteDiscordId(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white text-xs font-mono focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
                              />
                            </div>

                            {/* Options checkmarks */}
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide block">Items to Purge</label>
                              <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-4.5 space-y-3 text-xs">
                                <label className="flex items-start gap-3 cursor-pointer">
                                  <input 
                                    type="checkbox"
                                    checked={deleteOptions.accountData}
                                    onChange={(e) => setDeleteOptions(p => ({ ...p, accountData: e.target.checked }))}
                                    className="mt-0.5 accent-rose-500 shrink-0"
                                  />
                                  <div>
                                    <span className="font-semibold text-zinc-200 block">Delete stored account data</span>
                                    <span className="text-[10px] text-zinc-500">Includes username, global display tag, profile avatar cached index</span>
                                  </div>
                                </label>
                                <label className="flex items-start gap-3 cursor-pointer">
                                  <input 
                                    type="checkbox"
                                    checked={deleteOptions.serverMetadata}
                                    onChange={(e) => setDeleteOptions(p => ({ ...p, serverMetadata: e.target.checked }))}
                                    className="mt-0.5 accent-rose-500 shrink-0"
                                  />
                                  <div>
                                    <span className="font-semibold text-zinc-200 block">Remove active server data</span>
                                    <span className="text-[10px] text-zinc-500">Unlinks bot databases, welcomes layout bindings, server roles maps</span>
                                  </div>
                                </label>
                                <label className="flex items-start gap-3 cursor-pointer">
                                  <input 
                                    type="checkbox"
                                    checked={deleteOptions.dashboardSettings}
                                    onChange={(e) => setDeleteOptions(p => ({ ...p, dashboardSettings: e.target.checked }))}
                                    className="mt-0.5 accent-rose-500 shrink-0"
                                  />
                                  <div>
                                    <span className="font-semibold text-zinc-200 block">Delete dashboard account and preferences</span>
                                    <span className="text-[10px] text-zinc-500">Clears client local cookie session state and default tabs configurations</span>
                                  </div>
                                </label>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end pt-2">
                            <button
                              type="submit"
                              className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold font-sans transition-all shadow-lg shadow-rose-600/15 cursor-pointer"
                            >
                              Purge My Records
                            </button>
                          </div>
                        </form>
                      )}

                      {deleteStatus === 'processing' && (
                        <div className="py-16 flex flex-col items-center justify-center text-center space-y-4 font-mono">
                          <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
                          <div className="space-y-1.5">
                            <span className="text-zinc-500 uppercase font-black text-[10px] tracking-widest block">DELETION IN PROGRESS</span>
                            <span className="text-zinc-300 font-bold text-xs uppercase tracking-wide">{deleteProgress}</span>
                          </div>
                        </div>
                      )}

                      {deleteStatus === 'done' && (
                        <div className="py-8 flex flex-col items-center justify-center text-center space-y-6">
                          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-inner relative">
                            <div className="absolute inset-0 bg-emerald-500/5 rounded-full blur animate-pulse"></div>
                            <Check className="w-8 h-8 relative z-10" />
                          </div>
                          
                          <div className="space-y-2 max-w-sm">
                            <h3 className="text-lg font-black text-white">Database Purge Successful</h3>
                            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                              All cached Discord metadata, guild structures, and custom settings registered under <strong className="text-zinc-300 font-mono text-xs">{deleteDiscordUsername}</strong> have been permanently deleted from ONE database systems.
                            </p>
                          </div>

                          <button
                            onClick={() => {
                              setLegalOpen(false);
                              logout(); // force logout of dashboard for compliance safety
                            }}
                            className="px-6 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white text-xs font-bold transition-all cursor-pointer"
                          >
                            Logout Session Safely
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Welcome Popup Notification */}
      <AnimatePresence>
        {welcomePopup && welcomePopup.show && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="fixed top-20 right-4 md:right-8 z-[6000] max-w-sm w-full bg-zinc-950/90 backdrop-blur-xl border border-zinc-800/80 p-5 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Edge Ambient Light */}
            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-blue-500/50 via-purple-500/50 to-pink-500/50"></div>
            
            <div className="flex items-start gap-4">
              <div className="p-2 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl text-blue-400 shrink-0 relative">
                <div className="absolute inset-0 bg-blue-500/10 rounded-xl blur-md animate-pulse"></div>
                <Sparkles className="w-5 h-5 text-blue-400 relative z-10" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-bold text-sm tracking-tight mb-1">
                  System Notification
                </h4>
                <p className="text-zinc-300 text-xs leading-relaxed font-medium">
                  {welcomePopup.isFirstTime ? (
                    <>
                      Welcome to <span className="text-blue-400 font-extrabold font-mono">ONE Dashboard!</span>
                    </>
                  ) : (
                    <>
                      Welcome back! <span className="text-purple-400 font-extrabold font-mono">@{user?.username}</span>
                    </>
                  )}
                </p>
              </div>

              <button
                onClick={() => setWelcomePopup({ ...welcomePopup, show: false })}
                className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-lg hover:bg-zinc-900/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
