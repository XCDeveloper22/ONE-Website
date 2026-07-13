import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  LogOut, Settings, BarChart3, Users, Server, Shield, Activity, User, ExternalLink, 
  Menu, X, Check, Copy, Bell, Code2, Eye, EyeOff, ShieldAlert, Zap, Globe, Lock
} from 'lucide-react';
import { DiscordGuild, DiscordConnection } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import BotStatusWidget from '../components/BotStatusWidget';

type Tab = 'overview' | 'servers' | 'members' | 'moderation' | 'settings';

export default function Dashboard() {
  const { user, logout } = useAuth();
  
  const [activeTab, setActiveTab] = useState<Tab>('overview');
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

  // Moderation state
  const [moderationRules, setModerationRules] = useState({
    antiSpam: true,
    linkFilter: false,
    profanityFilter: true,
    inviteBlock: true,
    massMentions: false,
  });
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<Array<{ id: string; time: string; type: string; user: string; details: string; status: 'blocked' | 'warning' | 'info' | 'critical' }>>([
    { id: '1', time: '11:15:30', type: 'Anti-Spam', user: 'SpammyJoe#1234', details: 'Blocked 5 duplicate messages in #general', status: 'blocked' },
    { id: '2', time: '11:14:02', type: 'Link Filter', user: 'Advertiser#9999', details: 'Blocked invite link in #welcome', status: 'blocked' },
    { id: '3', time: '11:08:44', type: 'Auto-Mod', user: 'AggressiveUser#4567', details: 'Flagged profanity in #gaming', status: 'warning' },
    { id: '4', time: '11:01:15', type: 'System', user: 'ONE. Bot', details: 'Bot successfully synced with 12 servers', status: 'info' },
    { id: '5', time: '10:55:00', type: 'Auth', user: 'Xander#0001', details: 'Successfully logged into ONE. Dashboard', status: 'info' }
  ]);

  // Settings state
  const [botPrefix, setBotPrefix] = useState('!');
  const [welcomeChannel, setWelcomeChannel] = useState('#welcome');
  const [notifications, setNotifications] = useState({
    directMessages: true,
    serverAnnouncements: true,
    levelUp: false,
    weeklyDigest: false,
  });
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

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

  // Simulating live audit logs on the Moderation dashboard
  useEffect(() => {
    if (activeTab !== 'moderation') return;

    const interval = setInterval(() => {
      const users = ['ProGamer#1337', 'CasualDino#4321', 'MemeLord#8888', 'SilentNinja#2468', 'WebDeveloper#2026'];
      const actions = [
        { type: 'Link Filter', details: 'Blocked suspicious link in #trading', status: 'blocked' as const },
        { type: 'Anti-Spam', details: 'Flagged rapid typing patterns in #general', status: 'warning' as const },
        { type: 'Word Filter', details: 'Removed toxic remark in #help', status: 'blocked' as const },
        { type: 'System', details: 'Performance stats refreshed (Latency: 24ms)', status: 'info' as const },
        { type: 'Member Join', details: 'New member joined server: ONE. Community', status: 'info' as const }
      ];

      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];

      setAuditLogs(prev => [
        {
          id: Date.now().toString(),
          time: timeStr,
          type: randomAction.type,
          user: randomUser,
          details: randomAction.details,
          status: randomAction.status,
        },
        ...prev.slice(0, 7) // keep last 8 entries
      ]);
    }, 6000);

    return () => clearInterval(interval);
  }, [activeTab]);

  const handleCopyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCommand(cmd);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

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
    { id: 'moderation' as const, label: 'Moderation', icon: Shield, locked: true },
    { id: 'settings' as const, label: 'Settings', icon: Settings, locked: true },
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
          <h1 className="text-lg md:text-xl font-bold text-white capitalize tracking-tight">{activeTab} Dashboard</h1>
          <div className="flex items-center gap-3 text-xs md:text-sm font-medium bg-zinc-900/50 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full border border-zinc-800">
            <span className="text-zinc-500 hidden sm:inline">System:</span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
              Online
            </span>
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

              {activeTab === 'moderation' && (
                <motion.div
                  key="moderation"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6 relative overflow-hidden rounded-3xl min-h-[450px]"
                >
                  {/* Lock Overlay */}
                  <div className="absolute inset-0 bg-[#09090b]/80 backdrop-blur-[6px] z-20 flex flex-col items-center justify-center p-6 text-center border border-zinc-800/50 rounded-3xl">
                    <motion.div 
                      initial={{ scale: 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', delay: 0.1 }}
                      className="max-w-md flex flex-col items-center p-8 bg-zinc-950/60 border border-zinc-800/80 rounded-3xl shadow-2xl relative"
                    >
                      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
                      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl mb-4 relative">
                        <div className="absolute inset-0 bg-blue-500/10 rounded-2xl blur-lg animate-pulse"></div>
                        <Lock className="w-8 h-8 text-blue-400 relative z-10 animate-bounce" style={{ animationDuration: '3s' }} />
                      </div>
                      <span className="text-[10px] tracking-widest font-black text-blue-400 bg-blue-500/10 border border-blue-500/25 px-3 py-1 rounded-full uppercase mb-2">
                        Coming Soon
                      </span>
                      <h3 className="text-xl font-bold text-white tracking-tight">Automated Moderation</h3>
                      <p className="text-xs text-zinc-400 mt-2 max-w-xs leading-relaxed">
                        ONE. Bot automated security shields, toxic message filters, invite blockers, and real-time security events are currently in active development.
                      </p>
                    </motion.div>
                  </div>
                  <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/60 p-6 md:p-8 rounded-3xl">
                    <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-2">Automated Moderation</h2>
                    <p className="text-sm text-zinc-400 mb-6">Manage ONE. bot's real-time safety rules. Toggles simulate instant sync with your Discord servers.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { key: 'antiSpam', label: 'Anti-Spam Filter', desc: 'Blocks fast repetitive messages and triggers automatic timeouts.' },
                        { key: 'linkFilter', label: 'External Link Filter', desc: 'Restricts sending URLs in general or announcement channels.' },
                        { key: 'profanityFilter', label: 'Toxic Language Guard', desc: 'Automatically hides highly toxic words and warns members.' },
                        { key: 'inviteBlock', label: 'Block Server Invites', desc: 'Blocks Discord server invites to protect from advertiser bot raids.' },
                        { key: 'massMentions', label: 'Mass Mention Shield', desc: 'Alerts and blocks messages containing more than 5 mentions.' },
                      ].map((rule) => {
                        const isEnabled = moderationRules[rule.key as keyof typeof moderationRules];
                        return (
                          <div 
                            key={rule.key}
                            onClick={() => setModerationRules(prev => ({ ...prev, [rule.key]: !isEnabled }))}
                            className="bg-zinc-950/50 border border-zinc-800/60 p-4 rounded-2xl flex items-start justify-between gap-4 cursor-pointer hover:bg-zinc-900 hover:border-zinc-700 transition-all group"
                          >
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-zinc-200 group-hover:text-blue-400 transition-colors text-sm md:text-base">{rule.label}</h4>
                              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{rule.desc}</p>
                            </div>
                            <button className="text-zinc-400 focus:outline-none pt-1 shrink-0">
                              {isEnabled ? (
                                <div className="w-10 h-6 rounded-full bg-blue-500 p-0.5 flex justify-end items-center transition-all">
                                  <motion.div layout className="w-5 h-5 rounded-full bg-white shadow-md" />
                                </div>
                              ) : (
                                <div className="w-10 h-6 rounded-full bg-zinc-800 p-0.5 flex justify-start items-center transition-all">
                                  <motion.div layout className="w-5 h-5 rounded-full bg-zinc-500 shadow-md" />
                                </div>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Command builder */}
                  <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/60 p-6 md:p-8 rounded-3xl">
                    <h3 className="text-lg md:text-xl font-bold text-white mb-2">Moderator Cheat Sheet</h3>
                    <p className="text-sm text-zinc-400 mb-6">Quick-copy standard slash commands directly syncable with ONE. Bot.</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { cmd: '/ban @user_id reason:spam', label: 'Ban User', desc: 'Permanently bans a raiding user.' },
                        { cmd: '/kick @user_id reason:rules', label: 'Kick User', desc: 'Kicks user out with re-invite allowed.' },
                        { cmd: '/timeout @user_id 1h reason:spam', label: 'Timeout User', desc: 'Mutes user voice & text for 1 hour.' },
                        { cmd: '/warn @user_id rules_infraction', label: 'Warn User', desc: 'Sends an official warning DM.' },
                      ].map((item) => (
                        <div key={item.cmd} className="bg-zinc-950/60 border border-zinc-800/80 p-4 rounded-xl flex items-center justify-between gap-3 group hover:border-zinc-700 transition-colors">
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold text-blue-400 tracking-wider uppercase">{item.label}</span>
                            <div className="font-mono text-xs text-zinc-300 mt-1 bg-zinc-900/80 p-2 rounded-lg truncate border border-zinc-800">
                              {item.cmd}
                            </div>
                          </div>
                          <button 
                            onClick={() => handleCopyCommand(item.cmd)}
                            className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-all shrink-0"
                          >
                            {copiedCommand === item.cmd ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Audit Logs */}
                  <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/60 p-6 md:p-8 rounded-3xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg md:text-xl font-bold text-white">Live Security Logs</h3>
                        <p className="text-xs text-zinc-500 mt-1">Real-time incident responses across your synchronized guilds.</p>
                      </div>
                      <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full border border-blue-500/20 shrink-0 ml-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                        Live
                      </span>
                    </div>
                    
                    <div className="border border-zinc-800/80 rounded-2xl overflow-hidden bg-zinc-950/40">
                      <div className="divide-y divide-zinc-800/60 font-mono text-xs">
                        <AnimatePresence initial={false}>
                          {auditLogs.map((log) => {
                            const statusStyles = {
                              blocked: 'bg-red-500/10 text-red-400 border-red-500/20',
                              warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                              info: 'bg-zinc-800/80 text-zinc-400 border-zinc-700/30',
                              critical: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                            };
                            return (
                              <motion.div 
                                key={log.id}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="p-3 md:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 hover:bg-zinc-900/30 transition-colors"
                              >
                                <div className="flex items-start md:items-center gap-2.5 min-w-0 flex-1">
                                  <span className="text-zinc-600 select-none text-[10px] pt-0.5 sm:pt-0 shrink-0">{log.time}</span>
                                  <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold tracking-wider uppercase shrink-0 ${statusStyles[log.status]}`}>
                                    {log.type}
                                  </span>
                                  <span className="text-zinc-400 font-semibold truncate shrink-0 max-w-[150px]">{log.user}</span>
                                  <span className="text-zinc-500 truncate hidden md:inline">—</span>
                                  <span className="text-zinc-300 truncate flex-1">{log.details}</span>
                                </div>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6 relative overflow-hidden rounded-3xl min-h-[450px]"
                >
                  {/* Lock Overlay */}
                  <div className="absolute inset-0 bg-[#09090b]/80 backdrop-blur-[6px] z-20 flex flex-col items-center justify-center p-6 text-center border border-zinc-800/50 rounded-3xl">
                    <motion.div 
                      initial={{ scale: 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', delay: 0.1 }}
                      className="max-w-md flex flex-col items-center p-8 bg-zinc-950/60 border border-zinc-800/80 rounded-3xl shadow-2xl relative"
                    >
                      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
                      <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl mb-4 relative">
                        <div className="absolute inset-0 bg-purple-500/10 rounded-2xl blur-lg animate-pulse"></div>
                        <Lock className="w-8 h-8 text-purple-400 relative z-10 animate-bounce" style={{ animationDuration: '3s' }} />
                      </div>
                      <span className="text-[10px] tracking-widest font-black text-purple-400 bg-purple-500/10 border border-purple-500/25 px-3 py-1 rounded-full uppercase mb-2">
                        Coming Soon
                      </span>
                      <h3 className="text-xl font-bold text-white tracking-tight">Bot Configurations</h3>
                      <p className="text-xs text-zinc-400 mt-2 max-w-xs leading-relaxed">
                        Custom prefix configurations, system welcome channel overrides, direct message settings, and secure developer portal credential keys will be editable in our next update.
                      </p>
                    </motion.div>
                  </div>
                  <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/60 p-6 md:p-8 rounded-3xl">
                    <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-2">Bot Settings</h2>
                    <p className="text-sm text-zinc-400 mb-6">Configure general configurations and integration tokens securely synced to your cloud database.</p>
                    
                    <div className="space-y-5">
                      {/* Form Row: Prefix */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-800/40">
                        <div className="max-w-md">
                          <h4 className="font-semibold text-zinc-200 text-sm md:text-base">Command Prefix</h4>
                          <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">The characters placed before commands to trigger ONE. bot. Default is `!`.</p>
                        </div>
                        <input 
                          type="text" 
                          maxLength={3}
                          value={botPrefix}
                          onChange={(e) => {
                            setBotPrefix(e.target.value);
                            setIsSaved(false);
                          }}
                          className="w-full sm:w-24 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-center text-white font-mono text-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shrink-0"
                        />
                      </div>

                      {/* Form Row: Welcome Channel */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-800/40">
                        <div className="max-w-md">
                          <h4 className="font-semibold text-zinc-200 text-sm md:text-base">System Welcome Channel</h4>
                          <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">Where ONE. Bot posts joining server cards and greeting animations.</p>
                        </div>
                        <select 
                          value={welcomeChannel}
                          onChange={(e) => {
                            setWelcomeChannel(e.target.value);
                            setIsSaved(false);
                          }}
                          className="w-full sm:w-48 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-blue-500 transition-all shrink-0"
                        >
                          <option value="#welcome">#welcome</option>
                          <option value="#general">#general</option>
                          <option value="#lobby">#lobby</option>
                          <option value="#announcements">#announcements</option>
                        </select>
                      </div>

                      {/* Notifications Nested Controls */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-zinc-200 text-sm md:text-base">System Notifications</h4>
                          <p className="text-xs text-zinc-500 mt-0.5">Choose which notifications you want the bot to broadcast.</p>
                        </div>
                        
                        <div className="bg-zinc-950/40 border border-zinc-800/60 rounded-2xl p-4 space-y-3.5">
                          {[
                            { key: 'directMessages', label: 'Direct Messages', desc: 'Allow bot to DM you for vital configuration updates and token expirations.' },
                            { key: 'serverAnnouncements', label: 'Server Announcements', desc: 'Broadcast bot upgrade newsletters to server log channels.' },
                            { key: 'levelUp', label: 'User Level Ups', desc: 'Trigger leveling cards and alerts inside general channels.' },
                          ].map((item) => {
                            const isNotifEnabled = notifications[item.key as keyof typeof notifications];
                            return (
                              <div key={item.key} className="flex items-center justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-semibold text-zinc-300">{item.label}</div>
                                  <div className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed truncate max-w-[200px] sm:max-w-md">{item.desc}</div>
                                </div>
                                <button 
                                  onClick={() => {
                                    setNotifications(prev => ({ ...prev, [item.key]: !isNotifEnabled }));
                                    setIsSaved(false);
                                  }}
                                  className="text-zinc-500 hover:text-white shrink-0 focus:outline-none"
                                >
                                  {isNotifEnabled ? (
                                    <div className="w-8 h-5 rounded-full bg-blue-500 p-0.5 flex justify-end items-center transition-all">
                                      <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                                    </div>
                                  ) : (
                                    <div className="w-8 h-5 rounded-full bg-zinc-800 p-0.5 flex justify-start items-center transition-all">
                                      <div className="w-4 h-4 rounded-full bg-zinc-500 shadow-md" />
                                    </div>
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Developer Secrets masking (secure design) */}
                      <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 mt-4 space-y-3">
                        <div className="flex items-center gap-2.5 text-blue-400">
                          <Code2 className="w-4 h-4" />
                          <h4 className="font-semibold text-xs md:text-sm uppercase tracking-wider">Developer Portal Credentials</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="min-w-0">
                            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">Client ID</div>
                            <div className="font-mono text-xs text-zinc-300 bg-zinc-950 p-2 rounded-lg border border-zinc-800 mt-1 select-all truncate">
                              1495690757707923608
                            </div>
                          </div>
                          <div className="min-w-0">
                            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">Client Secret</div>
                            <div className="font-mono text-xs text-zinc-300 bg-zinc-950 p-2 rounded-lg border border-zinc-800 mt-1 flex items-center justify-between gap-2 min-w-0">
                              <span className="truncate select-all flex-1">
                                {showClientSecret ? 'd9a4b8c731e0f5a2e9b0c8d7e6f5a4b3' : '••••••••••••••••••••••••••••••••'}
                              </span>
                              <button 
                                onClick={() => setShowClientSecret(!showClientSecret)}
                                className="text-zinc-500 hover:text-zinc-300 p-0.5 shrink-0"
                              >
                                {showClientSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Save Status button */}
                      <div className="flex justify-end pt-2">
                        <button 
                          onClick={() => {
                            setIsSaved(true);
                            setTimeout(() => setIsSaved(false), 3000);
                          }}
                          className={`px-6 py-2.5 rounded-xl font-medium transition-all text-sm shadow-md flex items-center gap-2 ${isSaved ? 'bg-emerald-500 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                        >
                          {isSaved ? (
                            <>
                              <Check className="w-4 h-4" />
                              Saved Successfully
                            </>
                          ) : (
                            'Save Changes'
                          )}
                        </button>
                      </div>

                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </main>
      </div>
    </div>
  );
}
