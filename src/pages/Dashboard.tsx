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
import WorldChatTab from '../components/WorldChatTab';
import { io } from 'socket.io-client';

type Tab = 'overview' | 'servers' | 'members' | 'commands' | 'world_chat' | 'moderation' | 'settings' | 'donate';

export default function Dashboard() {
  const { user, logout } = useAuth();
  
  const [activeTab, setActiveTab] = useState<Tab>('overview');

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

  // 12. Central Config State Management
  const isOwner = user?.id === "836128654983168002" || user?.email === "xandercamarin@gmail.com" || user?.username?.toLowerCase() === "kenzu.xc" || user?.username?.toLowerCase() === "@kenzu.xc";
  const [isPremium, setIsPremium] = useState(() => {
    try {
      const cached = localStorage.getItem('one_premium_test');
      return cached === 'true' || isOwner;
    } catch {
      return isOwner;
    }
  });

  const [selectedGuildId, setSelectedGuildId] = useState<string>(() => {
    try {
      const cachedGuilds = localStorage.getItem('one_guilds');
      if (cachedGuilds) {
        const parsed = JSON.parse(cachedGuilds);
        if (parsed && parsed.length > 0) return parsed[0].id;
      }
    } catch {}
    return 'sandbox_guild_101'; // Fallback developer sandbox server ID
  });

  const [activeConfig, setActiveConfig] = useState<any>(null);
  const [configLogs, setConfigLogs] = useState<any[]>([]);
  const [isConfigLoading, setIsConfigLoading] = useState(false);
  const [isConfigSaving, setIsConfigSaving] = useState(false);
  const [isRefreshingBot, setIsRefreshingBot] = useState(false);
  const [activeConfigSection, setActiveConfigSection] = useState<'moderation' | 'welcome' | 'embed' | 'scheduled' | 'integrations'>('moderation');

  // Sync isPremium localStorage
  const togglePremium = () => {
    if (isOwner) return; // Always enabled for developer!
    setIsPremium(prev => {
      const next = !prev;
      try {
        localStorage.setItem('one_premium_test', String(next));
      } catch (e) {}
      return next;
    });
  };

  // Fetch configuration whenever server selection changes
  useEffect(() => {
    setIsConfigLoading(true);
    fetch(`/api/config/${selectedGuildId}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to load config");
        return res.json();
      })
      .then(data => {
        setActiveConfig(data);
      })
      .catch(err => console.error("Config load error:", err))
      .finally(() => setIsConfigLoading(false));

    fetch(`/api/config/${selectedGuildId}/logs`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setConfigLogs(data))
      .catch(err => console.error(err));
  }, [selectedGuildId]);

  // Handle saving configurations to server
  const handleSaveConfig = (updatedFields: any) => {
    if (!activeConfig) return;
    setIsConfigSaving(true);
    
    const payload = {
      ...activeConfig,
      ...updatedFields,
      premium: isPremium || isOwner
    };

    fetch(`/api/config/${selectedGuildId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to save config");
        return res.json();
      })
      .then(data => {
        if (data.success) {
          setActiveConfig(data.config);
          if (data.logs && data.logs.length > 0) {
            setConfigLogs(prev => [...data.logs, ...prev]);
          }
          setIsSaved(true);
          setTimeout(() => setIsSaved(false), 2500);
        }
      })
      .catch(err => console.error("Save error:", err))
      .finally(() => setIsConfigSaving(false));
  };

  // Reset current config
  const handleResetConfig = () => {
    if (!confirm("Are you sure you want to restore default settings for this server?")) return;
    setIsConfigLoading(true);
    fetch(`/api/config/${selectedGuildId}/reset`, { method: 'POST' })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.success) {
          setActiveConfig(data.config);
          if (data.logs && data.logs.length > 0) {
            setConfigLogs(prev => [...data.logs, ...prev]);
          }
          alert("Server settings have been reset to default!");
        }
      })
      .catch(err => console.error(err))
      .finally(() => setIsConfigLoading(false));
  };

  // Trigger bot cache reload
  const handleReloadBot = () => {
    setIsRefreshingBot(true);
    fetch(`/api/config/${selectedGuildId}/reload`, { method: 'POST' })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.success) {
          setActiveConfig(data.config);
          setTimeout(() => {
            setIsRefreshingBot(false);
            alert("Discord Bot cached configuration has been refreshed instantly!");
          }, 800);
        }
      })
      .catch(err => {
        console.error(err);
        setIsRefreshingBot(false);
      });
  };

  // Live WebSocket config sync listener
  useEffect(() => {
    const socket = io();
    socket.on("config:sync", (data: any) => {
      if (data.guildId === selectedGuildId) {
        setActiveConfig(data.config);
        const now = new Date();
        const timeStr = now.toTimeString().split(' ')[0];
        const syncLog = {
          id: `sync-${Date.now()}`,
          time: timeStr,
          type: 'Gateway Sync',
          user: 'ONE. Bot',
          details: 'Cached server configuration instantly synchronized with bot core.',
          status: 'info' as const
        };
        setAuditLogs(prev => [syncLog, ...prev.slice(0, 7)]);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedGuildId]);

  // Moderation rules fallback
  const moderationRules = activeConfig?.moderationRules || {
    antiSpam: true,
    linkFilter: false,
    profanityFilter: true,
    inviteBlock: true,
    massMentions: false,
  };

  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<Array<{ id: string; time: string; type: string; user: string; details: string; status: 'blocked' | 'warning' | 'info' | 'critical' }>>([
    { id: '1', time: '11:15:30', type: 'Anti-Spam', user: 'SpammyJoe#1234', details: 'Blocked 5 duplicate messages in #general', status: 'blocked' },
    { id: '2', time: '11:14:02', type: 'Link Filter', user: 'Advertiser#9999', details: 'Blocked invite link in #welcome', status: 'blocked' },
    { id: '3', time: '11:08:44', type: 'Auto-Mod', user: 'AggressiveUser#4567', details: 'Flagged profanity in #gaming', status: 'warning' },
    { id: '4', time: '11:01:15', type: 'System', user: 'ONE. Bot', details: 'Bot successfully synced with 12 servers', status: 'info' },
    { id: '5', time: '10:55:00', type: 'Auth', user: 'Kenzu#0001', details: 'Successfully logged into ONE. Dashboard', status: 'info' }
  ]);

  // Settings states synced with activeConfig
  const botPrefix = activeConfig?.prefix || "!";
  const welcomeChannel = activeConfig?.welcomeChannel || "#welcome";
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
    { id: 'commands' as const, label: 'Commands', icon: Code2 },
    { id: 'world_chat' as const, label: 'World Chat', icon: Globe },
    { id: 'moderation' as const, label: 'Moderation', icon: Shield, locked: true },
    { id: 'settings' as const, label: 'Settings', icon: Settings, locked: true },
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
            {activeTab === 'world_chat' ? 'World Chat' : `${activeTab} Dashboard`}
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
        
        <main className={`flex-1 overflow-y-auto ${activeTab === 'world_chat' ? 'p-0 md:p-8' : 'p-4 md:p-8'} custom-scrollbar`}>
          <div className={activeTab === 'world_chat' ? 'w-full max-w-full md:max-w-5xl md:mx-auto' : 'max-w-5xl mx-auto'}>
            
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

              {activeTab === 'world_chat' && (
                <motion.div
                  key="world_chat"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <WorldChatTab />
                </motion.div>
              )}

              {activeTab === 'moderation' && (
                <motion.div
                  key="moderation"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6 relative rounded-3xl min-h-[500px]"
                >
                  {/* Real-time Bot Gateway Status Header */}
                  <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 p-6 rounded-3xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-[10px] uppercase tracking-widest font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-full flex items-center gap-1.5 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          Bot Core Online
                        </span>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-500">Active Guild:</span>
                          <select
                            value={selectedGuildId}
                            onChange={(e) => setSelectedGuildId(e.target.value)}
                            className="bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 text-zinc-200 rounded-xl px-3 py-1.5 font-bold text-xs outline-none focus:ring-1 focus:ring-emerald-500/40 transition-all cursor-pointer"
                          >
                            <option value="sandbox_guild_101">🎮 Developer Sandbox Server</option>
                            {guilds.map((g: any) => (
                              <option key={g.id} value={g.id}>🛡️ {g.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                        Bot Configuration System
                        {isPremium && (
                          <span className="text-[10px] uppercase tracking-wider font-extrabold bg-gradient-to-r from-yellow-500 to-amber-500 text-zinc-950 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-md">
                            <Crown className="w-3 h-3 fill-zinc-950" />
                            Premium Enabled
                          </span>
                        )}
                      </h2>
                      <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">
                        Design card layouts, automated safety shields, embed templates, and integrations. All changes are instantly synced over our real-time websocket cluster.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                      {/* Premium Sandbox Toggle */}
                      {!isOwner && (
                        <button
                          onClick={togglePremium}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                            isPremium 
                              ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/25" 
                              : "bg-zinc-950 hover:bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                          }`}
                        >
                          <Sparkles className={`w-3.5 h-3.5 ${isPremium ? "text-amber-400 fill-amber-400 animate-pulse" : ""}`} />
                          {isPremium ? "Premium Sandbox Active" : "Unlock Premium Sandbox"}
                        </button>
                      )}
                      
                      {isOwner && (
                        <div className="px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold flex items-center gap-1.5 select-none">
                          <Crown className="w-3.5 h-3.5 fill-purple-400" />
                          Owner Bypass Active
                        </div>
                      )}

                      <button
                        onClick={handleReloadBot}
                        disabled={isRefreshingBot}
                        className="px-3.5 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-bold text-xs transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingBot ? "animate-spin text-emerald-400" : "text-zinc-400"}`} />
                        {isRefreshingBot ? "Refreshing Core..." : "Reload Bot Config"}
                      </button>
                    </div>
                  </div>

                  {/* Sub-Navigation */}
                  <div className="flex overflow-x-auto pb-1 gap-2 scrollbar-none border-b border-zinc-800/60">
                    {[
                      { id: 'moderation' as const, label: '🛡️ Auto-Mod Shields' },
                      { id: 'welcome' as const, label: '👋 Welcome & Leave' },
                      { id: 'embed' as const, label: '🎨 Embed Builder' },
                      { id: 'scheduled' as const, label: '⏰ Announcements' },
                      { id: 'integrations' as const, label: '🔌 Integrations' },
                    ].map((sec) => (
                      <button
                        key={sec.id}
                        onClick={() => setActiveConfigSection(sec.id)}
                        className={`px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                          activeConfigSection === sec.id
                            ? "bg-zinc-900 border-zinc-700 text-white shadow-lg"
                            : "bg-transparent border-transparent text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        {sec.label}
                        {!isPremium && sec.id !== 'moderation' && (
                          <Lock className="w-3 h-3 text-zinc-500" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Active Panel View */}
                  {isConfigLoading ? (
                    <div className="bg-zinc-900/20 border border-zinc-800/40 p-20 rounded-3xl flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                      <p className="text-sm font-semibold text-zinc-400">Loading server config cache...</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      
                      {/* Section 1: Moderation / Auto-Mod Shields */}
                      {activeConfigSection === 'moderation' && (
                        <div className="space-y-6">
                          <div className="bg-zinc-900/40 border border-zinc-800/60 p-6 md:p-8 rounded-3xl space-y-6">
                            <div>
                              <h3 className="text-lg md:text-xl font-black text-white tracking-tight">Automated Protection Shields</h3>
                              <p className="text-xs md:text-sm text-zinc-400 leading-relaxed">
                                Prevent server raids, advertisement, toxic language, and spam automatically. Click to toggle.
                              </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {[
                                { key: 'antiSpam', label: 'Slow Message Shield', desc: 'Blocks users from posting multiple rapid messages to disrupt rooms.' },
                                { key: 'linkFilter', label: 'Website Link Filter', desc: 'Prevents external hyperlinks in server channels automatically.' },
                                { key: 'profanityFilter', label: 'Toxic Word Blocker', desc: 'Removes swear words and filters offensive slang instantly.' },
                                { key: 'inviteBlock', label: 'Server Invite Protector', desc: 'Flags and blocks server invites leading to competitor guilds.' },
                                { key: 'massMentions', label: 'Ping Spam Prevention', desc: 'Protects admins and players from massive tags over 5 users.' },
                              ].map((rule) => {
                                const isEnabled = moderationRules[rule.key as keyof typeof moderationRules];
                                return (
                                  <div
                                    key={rule.key}
                                    onClick={() => {
                                      const nextRules = { ...moderationRules, [rule.key]: !isEnabled };
                                      handleSaveConfig({ moderationRules: nextRules });
                                    }}
                                    className={`p-4 rounded-2xl border flex items-start justify-between gap-4 cursor-pointer transition-all group ${
                                      isEnabled
                                        ? "bg-emerald-500/[0.02] border-emerald-500/30 hover:border-emerald-500/50"
                                        : "bg-zinc-950/40 border-zinc-800/80 hover:border-zinc-700/80"
                                    }`}
                                  >
                                    <div className="min-w-0 flex-1">
                                      <h4 className={`font-black text-sm md:text-base transition-colors ${isEnabled ? "text-emerald-400" : "text-zinc-200 group-hover:text-white"}`}>
                                        {rule.label}
                                      </h4>
                                      <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{rule.desc}</p>
                                    </div>
                                    <button className="pt-1 focus:outline-none shrink-0">
                                      {isEnabled ? (
                                        <div className="w-10 h-6 rounded-full bg-emerald-500 p-0.5 flex justify-end items-center transition-all shadow-md shadow-emerald-500/10">
                                          <div className="w-5 h-5 rounded-full bg-white" />
                                        </div>
                                      ) : (
                                        <div className="w-10 h-6 rounded-full bg-zinc-800 p-0.5 flex justify-start items-center transition-all">
                                          <div className="w-5 h-5 rounded-full bg-zinc-600" />
                                        </div>
                                      )}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Quick Commands List */}
                          <div className="bg-zinc-900/40 border border-zinc-800/60 p-6 md:p-8 rounded-3xl space-y-4">
                            <div>
                              <h4 className="text-sm font-black tracking-wider text-zinc-400 uppercase">Live Moderator Commands</h4>
                              <p className="text-xs text-zinc-500">Copy these ready-to-run moderation commands directly.</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                              {[
                                { cmd: '!present @user', label: 'Mark Present', desc: 'Force attendance present' },
                                { cmd: '!absent @user', label: 'Mark Absent', desc: 'Force attendance absent' },
                                { cmd: '!settime 30', label: 'Set Attendance Timer', desc: 'Set limit to 30 mins' },
                                { cmd: '!assignchannel #logs', label: 'Assign Logs Channel', desc: 'Sync bot logs' },
                              ].map((item) => (
                                <div key={item.cmd} className="bg-zinc-950/50 border border-zinc-800 p-3 rounded-xl flex flex-col justify-between gap-3 group hover:border-zinc-700 transition-all">
                                  <div className="space-y-1 min-w-0">
                                    <span className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase block">{item.label}</span>
                                    <div className="font-mono text-xs text-zinc-300 bg-zinc-900/80 p-2 rounded-lg truncate border border-zinc-800">
                                      {item.cmd}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleCopyCommand(item.cmd)}
                                    className="w-full py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-all text-xs font-bold flex items-center justify-center gap-1 shrink-0"
                                  >
                                    {copiedCommand === item.cmd ? (
                                      <>
                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                        Copied
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3.5 h-3.5" />
                                        Copy Command
                                      </>
                                    )}
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Section 2: Welcome & Leave Designers (Premium Only) */}
                      {activeConfigSection === 'welcome' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
                          {/* Premium Block Overlay */}
                          {!isPremium && (
                            <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-[6px] z-20 flex flex-col items-center justify-center text-center p-6 border border-zinc-800/80 rounded-3xl">
                              <div className="max-w-md bg-zinc-900/90 border border-zinc-800/80 p-8 rounded-2xl shadow-2xl space-y-4">
                                <div className="p-3.5 bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded-xl w-fit mx-auto">
                                  <Crown className="w-8 h-8 fill-amber-400 animate-pulse" />
                                </div>
                                <h4 className="text-lg font-extrabold text-white">🔒 Premium Card Designers Locked</h4>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                  Unlock our Custom Welcome Card Designer & Leave Card Designer to customize styles, accents, background images, and automatic notifications.
                                </p>
                                <button
                                  onClick={togglePremium}
                                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5"
                                >
                                  <Sparkles className="w-4 h-4 fill-zinc-950" />
                                  Enable Premium Sandbox
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="lg:col-span-5 space-y-4">
                            <div className="bg-zinc-900/40 border border-zinc-800/60 p-5 rounded-2xl space-y-4">
                              <h3 className="text-md font-bold text-white flex items-center gap-2">
                                <Sliders className="w-4 h-4 text-emerald-400" />
                                Welcome Configuration
                              </h3>
                              
                              <div className="space-y-3">
                                <div>
                                  <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Channel Target</label>
                                  <input
                                    type="text"
                                    value={activeConfig?.welcomeChannel || "#welcome"}
                                    onChange={(e) => handleSaveConfig({ welcomeChannel: e.target.value })}
                                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-700 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-200 outline-none mt-1"
                                    placeholder="#welcome"
                                  />
                                </div>

                                <div>
                                  <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Accent Theme Card Style</label>
                                  <div className="grid grid-cols-2 gap-2 mt-1">
                                    {[
                                      { id: 'slate', name: 'Classic Slate', color: 'from-zinc-800 to-zinc-900 border-zinc-700' },
                                      { id: 'sunset', name: 'Sunset Orange', color: 'from-orange-500 to-amber-600 border-orange-500/20' },
                                      { id: 'cyber', name: 'Cyber Purple', color: 'from-purple-600 to-fuchsia-700 border-purple-500/20' },
                                      { id: 'emerald', name: 'Neon Emerald', color: 'from-emerald-500 to-teal-600 border-emerald-500/20' },
                                    ].map((style) => (
                                      <button
                                        key={style.id}
                                        onClick={() => handleSaveConfig({ welcomeTheme: style.id })}
                                        className={`p-2 rounded-xl border text-[10px] font-black text-left bg-gradient-to-br ${style.color} text-white flex flex-col justify-end h-12 transition-all ${
                                          (activeConfig?.welcomeTheme || 'slate') === style.id ? 'ring-2 ring-emerald-500 border-transparent scale-[1.02]' : 'opacity-80 hover:opacity-100'
                                        }`}
                                      >
                                        {style.name}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Welcome Message Text</label>
                                  <textarea
                                    value={activeConfig?.welcomeMessage || "Welcome to the server! Read #rules and have fun."}
                                    onChange={(e) => handleSaveConfig({ welcomeMessage: e.target.value })}
                                    rows={3}
                                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-700 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-200 outline-none mt-1 resize-none"
                                    placeholder="Enter greeting..."
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="lg:col-span-7 space-y-4">
                            <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl space-y-4 flex flex-col justify-between min-h-[300px]">
                              <div>
                                <span className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase block">Interactive Live Preview</span>
                                <h4 className="text-xs text-zinc-400 mt-1">Simulated Card rendering in Discord Chat Client</h4>
                              </div>

                              {/* Simulated Discord Message */}
                              <div className="bg-[#313338] rounded-xl p-4 border border-[#232428] font-sans text-sm text-[#dbdee1] flex gap-3 shadow-lg max-w-full">
                                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                                  <img 
                                    src="https://cdn.discordapp.com/embed/avatars/0.png" 
                                    alt="ONE. Bot Avatar" 
                                    className="w-full h-full object-cover" 
                                  />
                                </div>
                                
                                <div className="space-y-2 min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-white hover:underline cursor-pointer">ONE. Bot</span>
                                    <span className="bg-[#5865f2] text-white text-[9px] font-bold px-1 py-0.5 rounded uppercase">Bot</span>
                                    <span className="text-xs text-[#949ba4]">Today at 4:20 PM</span>
                                  </div>

                                  <div className="text-zinc-200 text-xs">
                                    {activeConfig?.welcomeMessage || "Welcome to the server! Read #rules and have fun."}
                                  </div>

                                  {/* Render welcome card mockup */}
                                  <div className={`mt-2 rounded-xl p-6 bg-gradient-to-r relative overflow-hidden flex flex-col items-center justify-center text-center gap-2 border shadow-lg max-w-sm ${
                                    (activeConfig?.welcomeTheme || 'slate') === 'slate' ? 'from-zinc-800 to-zinc-900 border-zinc-700' :
                                    (activeConfig?.welcomeTheme || 'slate') === 'sunset' ? 'from-orange-500 to-amber-600 border-orange-400/30' :
                                    (activeConfig?.welcomeTheme || 'slate') === 'cyber' ? 'from-purple-600 to-fuchsia-700 border-purple-400/30' :
                                    'from-emerald-500 to-teal-600 border-emerald-400/30'
                                  }`}>
                                    <div className="w-14 h-14 rounded-full border-2 border-white/40 overflow-hidden shadow-md">
                                      <img 
                                        src={getAvatarUrl()} 
                                        alt="Joining User Avatar" 
                                        className="w-full h-full object-cover" 
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <h5 className="font-extrabold text-white text-md tracking-tight">WELCOME</h5>
                                      <p className="font-bold text-xs text-white/90">@{user?.username || "GuestPlayer"}</p>
                                      <p className="text-[9px] text-white/70">Member #{activeConfig?.welcomeMessage ? "1,042" : "1,041"}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="text-[10px] text-zinc-500 text-center">
                                Card elements adapt based on server statistics & theme accent.
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Section 3: Embed Builder (Premium Only) */}
                      {activeConfigSection === 'embed' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
                          {/* Premium Block Overlay */}
                          {!isPremium && (
                            <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-[6px] z-20 flex flex-col items-center justify-center text-center p-6 border border-zinc-800/80 rounded-3xl">
                              <div className="max-w-md bg-zinc-900/90 border border-zinc-800/80 p-8 rounded-2xl shadow-2xl space-y-4">
                                <div className="p-3.5 bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded-xl w-fit mx-auto">
                                  <Crown className="w-8 h-8 fill-amber-400 animate-pulse" />
                                </div>
                                <h4 className="text-lg font-extrabold text-white">🔒 Premium Embed Builder Locked</h4>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                  Construct rich Discord client-side Embeds with custom titles, descriptions, custom color-stripes, images, and live previews.
                                </p>
                                <button
                                  onClick={togglePremium}
                                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5"
                                >
                                  <Sparkles className="w-4 h-4 fill-zinc-950" />
                                  Enable Premium Sandbox
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="lg:col-span-5 space-y-4">
                            <div className="bg-zinc-900/40 border border-zinc-800/60 p-5 rounded-2xl space-y-3">
                              <h3 className="text-md font-bold text-white flex items-center gap-2">
                                <Code2 className="w-4 h-4 text-emerald-400" />
                                Embed Layout Creator
                              </h3>
                              
                              <div className="space-y-3">
                                <div>
                                  <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Embed Title</label>
                                  <input
                                    type="text"
                                    value={activeConfig?.embedTitle || "Server Announcement"}
                                    onChange={(e) => handleSaveConfig({ embedTitle: e.target.value })}
                                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-700 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-200 outline-none mt-1"
                                    placeholder="Enter title"
                                  />
                                </div>

                                <div>
                                  <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Border Color Hex</label>
                                  <div className="flex gap-2 mt-1">
                                    <input
                                      type="color"
                                      value={activeConfig?.embedColor || "#3B82F6"}
                                      onChange={(e) => handleSaveConfig({ embedColor: e.target.value })}
                                      className="w-8 h-8 rounded-lg overflow-hidden border-none outline-none cursor-pointer"
                                    />
                                    <input
                                      type="text"
                                      value={activeConfig?.embedColor || "#3B82F6"}
                                      onChange={(e) => handleSaveConfig({ embedColor: e.target.value })}
                                      className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-zinc-700 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-200 outline-none uppercase font-mono"
                                      placeholder="#3B82F6"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Embed Description Body</label>
                                  <textarea
                                    value={activeConfig?.embedDescription || "Our server has been successfully integrated with ONE. dashboard. Administrators can change and update these features in real-time."}
                                    onChange={(e) => handleSaveConfig({ embedDescription: e.target.value })}
                                    rows={4}
                                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-700 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-200 outline-none mt-1 resize-none"
                                    placeholder="Enter description..."
                                  />
                                </div>

                                <div>
                                  <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Thumbnail / Image URL</label>
                                  <input
                                    type="text"
                                    value={activeConfig?.embedImageUrl || ""}
                                    onChange={(e) => handleSaveConfig({ embedImageUrl: e.target.value })}
                                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-700 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-200 outline-none mt-1"
                                    placeholder="https://example.com/logo.png"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="lg:col-span-7 space-y-4">
                            <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl space-y-4 flex flex-col justify-between min-h-[350px]">
                              <div>
                                <span className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase block">Discord Embed Visualizer</span>
                                <h4 className="text-xs text-zinc-400 mt-1">Live previewing exactly how users see the message</h4>
                              </div>

                              {/* Simulated Discord Message with Rich Embed */}
                              <div className="bg-[#313338] rounded-xl p-4 border border-[#232428] font-sans text-sm text-[#dbdee1] flex gap-3 shadow-lg max-w-full">
                                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                                  <img 
                                    src="https://cdn.discordapp.com/embed/avatars/0.png" 
                                    alt="ONE. Bot Avatar" 
                                    className="w-full h-full object-cover" 
                                  />
                                </div>
                                
                                <div className="space-y-1 min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-white hover:underline cursor-pointer">ONE. Bot</span>
                                    <span className="bg-[#5865f2] text-white text-[9px] font-bold px-1 py-0.5 rounded uppercase">Bot</span>
                                    <span className="text-xs text-[#949ba4]">Today at 4:21 PM</span>
                                  </div>

                                  {/* The Rich Embed */}
                                  <div className="mt-1 bg-[#2b2d31] rounded-r border-l-[4px] px-4 py-3 flex gap-4 max-w-md transition-all shadow-md" style={{ borderLeftColor: activeConfig?.embedColor || "#3B82F6" }}>
                                    <div className="flex-1 min-w-0 space-y-1">
                                      <h5 className="font-bold text-white text-md hover:underline cursor-pointer leading-tight">
                                        {activeConfig?.embedTitle || "Server Announcement"}
                                      </h5>
                                      <p className="text-[#dbdee1] text-xs leading-relaxed whitespace-pre-wrap">
                                        {activeConfig?.embedDescription || "Our server has been successfully integrated with ONE. dashboard. Administrators can change and update these features in real-time."}
                                      </p>
                                      
                                      <div className="flex items-center gap-2 pt-1 text-[10px] text-[#949ba4] font-semibold">
                                        <span>ONE. Sync Services</span>
                                        <span>•</span>
                                        <span>Today at 4:21 PM</span>
                                      </div>
                                    </div>

                                    {activeConfig?.embedImageUrl && (
                                      <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-zinc-950/40 border border-[#232428] mt-1">
                                        <img 
                                          src={activeConfig.embedImageUrl} 
                                          alt="Embed Thumbnail" 
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                          }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="text-[10px] text-zinc-500 text-center">
                                Custom Embeds are perfect for rules, guides, and tournament matches.
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Section 4: Scheduled Messages / Announcements */}
                      {activeConfigSection === 'scheduled' && (
                        <div className="bg-zinc-900/40 border border-zinc-800/60 p-6 md:p-8 rounded-3xl space-y-6 relative">
                          {/* Premium Block Overlay */}
                          {!isPremium && (
                            <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-[6px] z-20 flex flex-col items-center justify-center text-center p-6 border border-zinc-800/80 rounded-3xl">
                              <div className="max-w-md bg-zinc-900/90 border border-zinc-800/80 p-8 rounded-2xl shadow-2xl space-y-4">
                                <div className="p-3.5 bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded-xl w-fit mx-auto">
                                  <Crown className="w-8 h-8 fill-amber-400 animate-pulse" />
                                </div>
                                <h4 className="text-lg font-extrabold text-white">🔒 Premium Scheduled Messages Locked</h4>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                  Broadcast repeating alerts, welcome links, voting guides, and reminders automatically to specific rooms at designated intervals.
                                </p>
                                <button
                                  onClick={togglePremium}
                                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5"
                                >
                                  <Sparkles className="w-4 h-4 fill-zinc-950" />
                                  Enable Premium Sandbox
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/60 pb-5">
                            <div>
                              <h3 className="text-lg font-black text-white">Scheduled Repeating Messages</h3>
                              <p className="text-xs text-zinc-400 mt-1">Automated announcements broadcasted on a clean recurring schedule.</p>
                            </div>
                            <button
                              onClick={() => {
                                const currentScheduled = activeConfig?.scheduledMessages || [];
                                const newSchedule = [
                                  ...currentScheduled,
                                  { id: `sch-${Date.now()}`, message: "New automated announcement template.", interval: 60, enabled: true, channel: "#general" }
                                ];
                                handleSaveConfig({ scheduledMessages: newSchedule });
                              }}
                              className="px-4 py-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 self-start"
                            >
                              <Plus className="w-4 h-4" />
                              Add Announcement
                            </button>
                          </div>

                          {/* List of schedules */}
                          <div className="space-y-3">
                            {(!activeConfig?.scheduledMessages || activeConfig.scheduledMessages.length === 0) ? (
                              <div className="p-10 border border-dashed border-zinc-800 rounded-2xl text-center space-y-2">
                                <Calendar className="w-8 h-8 text-zinc-600 mx-auto" />
                                <h5 className="text-xs font-bold text-zinc-400">No scheduled announcements</h5>
                                <p className="text-[10px] text-zinc-500">Create an announcement script to loop repeating guidelines.</p>
                              </div>
                            ) : (
                              activeConfig.scheduledMessages.map((sch: any, index: number) => (
                                <div key={sch.id} className="bg-zinc-950/60 border border-zinc-800 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-zinc-700 transition-all">
                                  <div className="flex-1 space-y-2 min-w-0 w-full">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase">Announcer #{index + 1}</span>
                                      <input
                                        type="text"
                                        value={sch.channel}
                                        onChange={(e) => {
                                          const nextList = [...activeConfig.scheduledMessages];
                                          nextList[index].channel = e.target.value;
                                          handleSaveConfig({ scheduledMessages: nextList });
                                        }}
                                        className="bg-transparent text-xs font-bold text-zinc-400 hover:text-white focus:text-white outline-none w-24 border-b border-transparent focus:border-zinc-700"
                                        placeholder="#general"
                                      />
                                    </div>
                                    <input
                                      type="text"
                                      value={sch.message}
                                      onChange={(e) => {
                                        const nextList = [...activeConfig.scheduledMessages];
                                        nextList[index].message = e.target.value;
                                        handleSaveConfig({ scheduledMessages: nextList });
                                      }}
                                      className="bg-transparent text-sm font-semibold text-zinc-200 hover:text-white focus:text-white outline-none w-full border-b border-transparent focus:border-zinc-700 truncate"
                                      placeholder="Message body"
                                    />
                                  </div>

                                  <div className="flex items-center gap-4 shrink-0 w-full md:w-auto justify-between md:justify-end border-t border-zinc-800/50 md:border-t-0 pt-3 md:pt-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-zinc-500 font-bold">Repeat:</span>
                                      <select
                                        value={sch.interval}
                                        onChange={(e) => {
                                          const nextList = [...activeConfig.scheduledMessages];
                                          nextList[index].interval = parseInt(e.target.value);
                                          handleSaveConfig({ scheduledMessages: nextList });
                                        }}
                                        className="bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold text-[11px] rounded-lg px-2 py-1 outline-none cursor-pointer"
                                      >
                                        <option value="15">Every 15 minutes</option>
                                        <option value="30">Every 30 minutes</option>
                                        <option value="60">Every 60 minutes</option>
                                        <option value="120">Every 2 hours</option>
                                        <option value="360">Every 6 hours</option>
                                        <option value="1440">Every 24 hours</option>
                                      </select>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => {
                                          const nextList = [...activeConfig.scheduledMessages];
                                          nextList[index].enabled = !sch.enabled;
                                          handleSaveConfig({ scheduledMessages: nextList });
                                        }}
                                        className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-md border transition-all ${
                                          sch.enabled 
                                            ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400" 
                                            : "bg-zinc-900 border-zinc-800 text-zinc-500"
                                        }`}
                                      >
                                        {sch.enabled ? "Active" : "Paused"}
                                      </button>

                                      <button
                                        onClick={() => {
                                          const nextList = activeConfig.scheduledMessages.filter((s: any) => s.id !== sch.id);
                                          handleSaveConfig({ scheduledMessages: nextList });
                                        }}
                                        className="p-1.5 bg-zinc-900 hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/25 text-zinc-500 hover:text-red-400 rounded-lg transition-all"
                                      >
                                        <Trash className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}

                      {/* Section 5: Integrations Hub (New, Premium Only) */}
                      {activeConfigSection === 'integrations' && (
                        <div className="bg-zinc-900/40 border border-zinc-800/60 p-6 md:p-8 rounded-3xl space-y-6 relative">
                          {/* Premium Block Overlay */}
                          {!isPremium && (
                            <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-[6px] z-20 flex flex-col items-center justify-center text-center p-6 border border-zinc-800/80 rounded-3xl">
                              <div className="max-w-md bg-zinc-900/90 border border-zinc-800/80 p-8 rounded-2xl shadow-2xl space-y-4">
                                <div className="p-3.5 bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded-xl w-fit mx-auto">
                                  <Crown className="w-8 h-8 fill-amber-400 animate-pulse" />
                                </div>
                                <h4 className="text-lg font-extrabold text-white">🔒 Premium Third-Party Integrations</h4>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                  Connect external channels like GitHub, Twitch, YouTube, Spotify, Steam, Patreon, and Trello directly to broadcast events to your community.
                                </p>
                                <button
                                  onClick={togglePremium}
                                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5"
                                >
                                  <Sparkles className="w-4 h-4 fill-zinc-950" />
                                  Enable Premium Sandbox
                                </button>
                              </div>
                            </div>
                          )}

                          <div>
                            <h3 className="text-lg font-black text-white">Integrations Portal</h3>
                            <p className="text-xs text-zinc-400 mt-1">Deploy bot alerts tied directly to activity on third-party gaming and creator channels.</p>
                          </div>

                          {/* Integrations Bento Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                            {[
                              { id: 'github', name: 'GitHub', desc: 'Sync repository commits', color: 'bg-zinc-900 text-zinc-100 hover:border-zinc-600' },
                              { id: 'twitch', name: 'Twitch', desc: 'Live alerts automatically', color: 'bg-[#9146FF]/10 text-[#a970ff] hover:border-[#9146FF]/30' },
                              { id: 'youtube', name: 'YouTube', desc: 'Video upload reminders', color: 'bg-red-500/10 text-red-400 hover:border-red-500/30' },
                              { id: 'spotify', name: 'Spotify', desc: 'Sync active player log', color: 'bg-emerald-500/10 text-emerald-400 hover:border-emerald-500/30' },
                              { id: 'roblox', name: 'Roblox', desc: 'Verify player group roles', color: 'bg-zinc-900 text-zinc-300 hover:border-zinc-700' },
                              { id: 'steam', name: 'Steam', desc: 'Steam game alerts', color: 'bg-blue-500/10 text-blue-400 hover:border-blue-500/30' },
                              { id: 'fivem', name: 'FiveM', desc: 'Live RP server alerts', color: 'bg-orange-500/10 text-orange-400 hover:border-orange-500/30' },
                              { id: 'minecraft', name: 'Minecraft', desc: 'Sync whitelist servers', color: 'bg-green-500/10 text-green-400 hover:border-green-500/30' },
                              { id: 'patreon', name: 'Patreon', desc: 'Sync supporter ranks', color: 'bg-rose-500/10 text-rose-400 hover:border-rose-500/30' },
                              { id: 'kofi', name: 'Ko-fi', desc: 'Donation alerts live', color: 'bg-cyan-500/10 text-cyan-400 hover:border-cyan-500/30' },
                              { id: 'paypal', name: 'PayPal', desc: 'Instant checkout logs', color: 'bg-blue-600/10 text-blue-300 hover:border-blue-600/30' },
                              { id: 'stripe', name: 'Stripe', desc: 'SaaS membership alerts', color: 'bg-indigo-500/10 text-indigo-400 hover:border-indigo-500/30' },
                              { id: 'rss', name: 'RSS Feed', desc: 'Broadcast internet articles', color: 'bg-amber-500/10 text-amber-400 hover:border-amber-500/30' },
                              { id: 'gcal', name: 'Google Calendar', desc: 'Reminder for operations', color: 'bg-sky-500/10 text-sky-400 hover:border-sky-500/30' },
                              { id: 'trello', name: 'Trello', desc: 'Board card synchronization', color: 'bg-[#0079BF]/10 text-[#00c2ff] hover:border-[#0079BF]/30' },
                              { id: 'notion', name: 'Notion', desc: 'Wiki documentation logs', color: 'bg-zinc-900 text-zinc-200 hover:border-zinc-700' },
                              { id: 'zapier', name: 'Zapier', desc: 'Sync automated workflows', color: 'bg-[#FF4F00]/10 text-[#ff8044] hover:border-[#FF4F00]/30' },
                              { id: 'webhook', name: 'Webhooks', desc: 'Custom developer gateways', color: 'bg-teal-500/10 text-teal-400 hover:border-teal-500/30' },
                            ].map((integ) => {
                              const integrationsState = activeConfig?.integrations || {};
                              const isEnabled = !!integrationsState[integ.id];
                              return (
                                <div
                                  key={integ.id}
                                  onClick={() => {
                                    const nextInteg = { ...integrationsState, [integ.id]: !isEnabled };
                                    handleSaveConfig({ integrations: nextInteg });
                                  }}
                                  className={`p-3.5 rounded-xl border flex flex-col justify-between text-left h-28 cursor-pointer transition-all ${integ.color} ${
                                    isEnabled ? "ring-1 ring-emerald-400 scale-[1.01]" : "opacity-75 hover:opacity-100"
                                  }`}
                                >
                                  <div>
                                    <h5 className="font-extrabold text-xs tracking-tight">{integ.name}</h5>
                                    <p className="text-[10px] text-zinc-500 mt-0.5 leading-tight">{integ.desc}</p>
                                  </div>
                                  <span className={`text-[9px] uppercase font-bold tracking-widest block w-fit px-1.5 py-0.5 rounded ${isEnabled ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-950/60 text-zinc-500"}`}>
                                    {isEnabled ? "Connected" : "Inactive"}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                  {/* Synchronizer Master Settings Action Bar */}
                  <div className="bg-zinc-900/40 border border-zinc-800/60 p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-center sm:text-left">
                      <h4 className="text-xs font-bold text-zinc-300">Synchronized State Manager</h4>
                      <p className="text-[11px] text-zinc-500">Restore parameters back to default cache values or force-refresh gateways.</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleResetConfig}
                        className="px-3.5 py-2 rounded-xl bg-zinc-950 hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/30 text-zinc-400 hover:text-red-400 font-bold text-xs transition-all"
                      >
                        Reset Defaults
                      </button>

                      <button
                        onClick={() => handleSaveConfig({})}
                        disabled={isConfigSaving}
                        className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-1 shadow-lg shadow-emerald-500/10"
                      >
                        {isConfigSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        {isSaved ? "Saved & Synced!" : "Save Configuration"}
                      </button>
                    </div>
                  </div>

                  {/* Master Configuration Audit Logs */}
                  <div className="bg-zinc-900/40 border border-zinc-800/60 p-6 md:p-8 rounded-3xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-md md:text-lg font-black text-white">Live Central Synchronizer Logs</h3>
                        <p className="text-xs text-zinc-500 mt-1">Telemetry log trace tracking administrator adjustments applied to bot instances.</p>
                      </div>
                      <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-black bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Listening
                      </span>
                    </div>

                    <div className="border border-zinc-800/80 rounded-2xl overflow-hidden bg-zinc-950/40">
                      <div className="divide-y divide-zinc-800/60 font-mono text-xs max-h-56 overflow-y-auto">
                        {configLogs.length === 0 ? (
                          <div className="p-4 text-zinc-600 text-center select-none text-[11px]">
                            No administrative events recorded yet for this guild.
                          </div>
                        ) : (
                          configLogs.map((log) => {
                            const dateStr = new Date(log.timestamp).toLocaleTimeString();
                            return (
                              <div key={log.id} className="p-3 flex items-start sm:items-center justify-between gap-3 hover:bg-zinc-900/20 transition-all">
                                <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
                                  <span className="text-zinc-600 select-none text-[10px] pt-0.5 sm:pt-0 shrink-0">{dateStr}</span>
                                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/50 text-[9px] font-bold tracking-wider uppercase shrink-0">
                                    Config Update
                                  </span>
                                  <span className="text-zinc-400 font-extrabold truncate shrink-0 max-w-[120px]">@{log.userName}</span>
                                  <span className="text-zinc-500 select-none truncate hidden md:inline">—</span>
                                  <span className="text-zinc-300 truncate flex-1 leading-normal">{log.details}</span>
                                </div>
                              </div>
                            );
                          })
                        )}
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
                            handleSaveConfig({ prefix: e.target.value });
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
                            handleSaveConfig({ welcomeChannel: e.target.value });
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
    </div>
  );
}
