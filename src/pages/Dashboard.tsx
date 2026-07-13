import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Settings, BarChart3, Users, Server, Shield, Activity, User, ExternalLink } from 'lucide-react';
import { DiscordGuild, DiscordConnection } from '../types';
import { motion, AnimatePresence } from 'motion/react';

type Tab = 'overview' | 'servers' | 'members';

export default function Dashboard() {
  const { user, logout } = useAuth();
  
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [guilds, setGuilds] = useState<DiscordGuild[]>([]);
  const [connections, setConnections] = useState<DiscordConnection[]>([]);
  
  const [needsReauth, setNeedsReauth] = useState(false);

  useEffect(() => {
    // Fetch guilds
    fetch('/api/guilds')
      .then(res => {
        if (res.status === 401) setNeedsReauth(true);
        return res.ok ? res.json() : [];
      })
      .then(data => setGuilds(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));

    // Fetch connections
    fetch('/api/connections')
      .then(res => {
        if (res.status === 401) setNeedsReauth(true);
        return res.ok ? res.json() : [];
      })
      .then(data => setConnections(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));
  }, []);

  const getAvatarUrl = () => {
    if (user?.avatar) {
      return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
    }
    return `https://cdn.discordapp.com/embed/avatars/${parseInt(user?.discriminator || '0') % 5}.png`;
  };

  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-300 font-sans selection:bg-blue-500/30 overflow-hidden relative">
      {/* Subtle background glow */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-[#09090b] to-[#09090b] pointer-events-none"></div>

      {/* Sidebar */}
      <div className="w-64 bg-zinc-950/50 backdrop-blur-xl flex flex-col border-r border-zinc-800/50 z-10 relative">
        <div className="h-16 flex items-center px-6 font-black tracking-tighter text-white text-2xl border-b border-zinc-800/50">
          ONE<span className="text-blue-500">.</span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6">
          <nav className="space-y-2 px-4">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${activeTab === 'overview' ? 'bg-blue-500/10 text-blue-400 font-medium' : 'hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200'}`}
            >
              <BarChart3 className={`w-5 h-5 ${activeTab === 'overview' ? 'text-blue-400' : ''}`} />
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('servers')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${activeTab === 'servers' ? 'bg-blue-500/10 text-blue-400 font-medium' : 'hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200'}`}
            >
              <Server className={`w-5 h-5 ${activeTab === 'servers' ? 'text-blue-400' : ''}`} />
              Servers
            </button>
            <button 
              onClick={() => setActiveTab('members')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${activeTab === 'members' ? 'bg-blue-500/10 text-blue-400 font-medium' : 'hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200'}`}
            >
              <Users className={`w-5 h-5 ${activeTab === 'members' ? 'text-blue-400' : ''}`} />
              Members
            </button>
            
            <div className="pt-6 pb-2 px-4">
              <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Features</div>
            </div>
            
            <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-zinc-900 text-zinc-500 transition-colors opacity-60 cursor-not-allowed">
              <Shield className="w-5 h-5" />
              Moderation
              <span className="ml-auto text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-md uppercase font-bold tracking-wider">Soon</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-zinc-900 text-zinc-500 transition-colors opacity-60 cursor-not-allowed">
              <Settings className="w-5 h-5" />
              Settings
              <span className="ml-auto text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-md uppercase font-bold tracking-wider">Soon</span>
            </button>
          </nav>
        </div>
        
        {/* User profile area */}
        <div className="p-4 border-t border-zinc-800/50 bg-zinc-950/80">
          <div className="flex items-center justify-between bg-zinc-900/80 rounded-xl p-2 pl-3 border border-zinc-800/50">
            <div className="flex items-center gap-3 overflow-hidden">
              <img 
                src={getAvatarUrl()} 
                alt="Avatar" 
                className="w-8 h-8 rounded-full border border-zinc-700"
              />
              <div className="truncate text-sm font-medium text-zinc-200">
                {user?.global_name || user?.username}
              </div>
            </div>
            <button 
              onClick={logout}
              className="text-zinc-400 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 z-10 relative">
        <header className="h-16 flex items-center justify-between px-8 border-b border-zinc-800/50 bg-zinc-950/30 backdrop-blur-md">
          <h1 className="text-xl font-bold text-white capitalize tracking-tight">{activeTab}</h1>
          <div className="flex items-center gap-3 text-sm font-medium bg-zinc-900/50 px-3 py-1.5 rounded-full border border-zinc-800">
            <span className="text-zinc-400">System:</span>
            <span className="flex items-center gap-2 text-emerald-400">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
              Online
            </span>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-5xl mx-auto">
            
            <AnimatePresence mode="wait">
              {needsReauth && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/10 border border-red-500/30 text-red-200 p-5 rounded-2xl flex items-center justify-between mb-8 shadow-lg shadow-red-500/5"
                >
                  <div>
                    <h3 className="font-bold text-red-400 text-lg mb-1">Authorization Update Required</h3>
                    <p className="text-sm text-red-300/80">We've added new features that require additional Discord permissions. Please re-authenticate to sync your latest data.</p>
                  </div>
                  <button onClick={logout} className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-red-500/20 active:scale-95">
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
                  <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/60 p-8 rounded-3xl flex flex-col md:flex-row items-center gap-8 shadow-xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <img src={getAvatarUrl()} alt="Avatar" className="w-28 h-28 rounded-full border-4 border-zinc-800 shadow-2xl relative z-10" />
                    <div className="text-center md:text-left relative z-10">
                      <h2 className="text-3xl font-black text-white mb-1 tracking-tight">{user?.global_name || user?.username}</h2>
                      <p className="text-blue-400 font-medium mb-4">@{user?.username}</p>
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm">
                        <div className="bg-zinc-950/50 border border-zinc-800 px-4 py-2 rounded-xl text-zinc-300 shadow-inner">
                          ID: <span className="font-mono text-zinc-400">{user?.id}</span>
                        </div>
                        {user?.email && (
                          <div className="bg-zinc-950/50 border border-zinc-800 px-4 py-2 rounded-xl text-zinc-300 shadow-inner flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            {user.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/60 p-6 rounded-3xl relative overflow-hidden group hover:border-zinc-700 transition-colors">
                      <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-blue-500/10 rounded-xl">
                          <Server className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="text-zinc-400 font-medium">Your Servers</div>
                      </div>
                      <div className="text-4xl font-black text-white mt-4 tracking-tighter">
                        {guilds.length.toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/60 p-6 rounded-3xl relative overflow-hidden group hover:border-zinc-700 transition-colors">
                      <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-purple-500/10 rounded-xl">
                          <Users className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="text-zinc-400 font-medium">Connected Accounts</div>
                      </div>
                      <div className="text-4xl font-black text-white mt-4 tracking-tighter">
                        {connections.length.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {connections.length > 0 && (
                    <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/60 p-8 rounded-3xl mt-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-white">Your Connections</h3>
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{connections.length} Integrations</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
                          
                          return (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.05 }}
                              key={`${conn.type}-${conn.id}`} 
                              className="bg-zinc-950/50 border border-zinc-800/80 px-4 py-3.5 rounded-2xl flex flex-col items-center gap-3 hover:bg-zinc-800 hover:border-zinc-700 transition-all group"
                            >
                              <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center shadow-inner">
                                <img src={`https://cdn.simpleicons.org/${iconId}/white`} alt={conn.type} className="w-5 h-5 opacity-80 group-hover:opacity-100 transition-opacity" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                              </div>
                              <span className="text-zinc-300 font-medium text-sm truncate w-full text-center">{conn.name}</span>
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
                  className="space-y-10"
                >
                  <section>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-white tracking-tight">Your Owned Servers</h2>
                      <span className="bg-blue-500/10 text-blue-400 font-bold px-3 py-1 rounded-full text-sm">
                        {guilds.filter(g => g.owner).length}
                      </span>
                    </div>
                    {guilds.filter(g => g.owner).length === 0 ? (
                      <div className="text-center p-12 bg-zinc-900/40 border border-zinc-800/60 rounded-3xl text-zinc-500">
                        <Server className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p className="text-lg">You don't own any servers yet.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {guilds.filter(g => g.owner).map((guild, i) => (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            key={guild.id} 
                            className="bg-zinc-900/40 border border-zinc-800/60 p-5 rounded-2xl flex items-center gap-5 hover:bg-zinc-900 hover:border-zinc-700 transition-all group cursor-pointer"
                          >
                            {guild.icon ? (
                              <img src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`} alt={guild.name} className="w-14 h-14 rounded-2xl shadow-lg" />
                            ) : (
                              <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center text-white font-black text-xl shadow-inner">
                                {guild.name.charAt(0)}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-white font-bold text-lg truncate group-hover:text-blue-400 transition-colors">{guild.name}</h3>
                              <p className="text-xs text-zinc-500 mt-1 font-medium">
                                Created: {new Date(Number((BigInt(guild.id) >> 22n)) + 1420070400000).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="bg-blue-500 text-xs px-3 py-1.5 rounded-lg text-white font-bold tracking-wider uppercase shadow-lg shadow-blue-500/20">Owner</div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-white tracking-tight">Joined Servers</h2>
                      <span className="bg-zinc-800 text-zinc-400 font-bold px-3 py-1 rounded-full text-sm">
                        {guilds.filter(g => !g.owner).length}
                      </span>
                    </div>
                    {guilds.filter(g => !g.owner).length === 0 ? (
                      <div className="text-center p-12 bg-zinc-900/40 border border-zinc-800/60 rounded-3xl text-zinc-500">
                        <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p className="text-lg">You haven't joined any other servers.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {guilds.filter(g => !g.owner).map((guild, i) => (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            key={guild.id} 
                            className="bg-zinc-900/40 border border-zinc-800/60 p-5 rounded-2xl flex items-center gap-5 hover:bg-zinc-900 hover:border-zinc-700 transition-all group cursor-pointer"
                          >
                            {guild.icon ? (
                              <img src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`} alt={guild.name} className="w-14 h-14 rounded-2xl shadow-lg" />
                            ) : (
                              <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center text-white font-black text-xl shadow-inner">
                                {guild.name.charAt(0)}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-white font-bold text-lg truncate group-hover:text-blue-400 transition-colors">{guild.name}</h3>
                              <p className="text-xs text-zinc-500 mt-1 font-medium">
                                Created: {new Date(Number((BigInt(guild.id) >> 22n)) + 1420070400000).toLocaleDateString()}
                              </p>
                            </div>
                            <ExternalLink className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
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
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Members per Server</h2>
                  </div>
                  {guilds.length === 0 ? (
                    <div className="text-center p-12 bg-zinc-900/40 border border-zinc-800/60 rounded-3xl text-zinc-500">
                      No servers found.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {guilds.map((guild, i) => {
                        const memberCount = guild.approximate_member_count || 0;

                        return (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            key={guild.id} 
                            className="bg-zinc-900/40 border border-zinc-800/60 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-900 hover:border-zinc-700 transition-all group"
                          >
                            <div className="flex items-center gap-4">
                              {guild.icon ? (
                                <img src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`} alt={guild.name} className="w-12 h-12 rounded-2xl shadow-md" />
                              ) : (
                                <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                                  {guild.name.charAt(0)}
                                </div>
                              )}
                              <h3 className="text-white font-bold text-lg">{guild.name}</h3>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2 text-zinc-300 bg-zinc-800/50 px-4 py-2 rounded-xl border border-zinc-700/50 shadow-inner">
                                <Users className="w-4 h-4 text-purple-400" />
                                <span className="font-medium">{memberCount.toLocaleString()}</span>
                                <span className="text-zinc-500 text-sm">Members</span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </main>
      </div>
    </div>
  );
}

