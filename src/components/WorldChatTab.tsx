import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Users, Globe, Smile, User, Sparkles, AlertCircle, Wifi, WifiOff, Edit3, Check
} from 'lucide-react';
import { ChatMessage } from '../../api/socket';

interface GuestProfile {
  id: string;
  username: string;
  global_name: string;
  avatar: string | null;
  isGuest: boolean;
  color: string;
}

const GUEST_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
];

export default function WorldChatTab() {
  const { user } = useAuth();
  
  // Guest Profile States
  const [guestProfile, setGuestProfile] = useState<GuestProfile>(() => {
    try {
      const cached = localStorage.getItem('one_guest_profile');
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.error(e);
    }
    
    // Generate new random guest profile
    const randomId = 'guest_' + Math.random().toString(36).substring(2, 9);
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const randomName = `Chatter_${randomNum}`;
    const randomColor = GUEST_COLORS[Math.floor(Math.random() * GUEST_COLORS.length)];
    
    const profile: GuestProfile = {
      id: randomId,
      username: randomName,
      global_name: `Guest Member #${randomNum}`,
      avatar: null,
      isGuest: true,
      color: randomColor
    };
    
    try {
      localStorage.setItem('one_guest_profile', JSON.stringify(profile));
    } catch (e) {
      console.error(e);
    }
    return profile;
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isMobileOnlineListOpen, setIsMobileOnlineListOpen] = useState(false);
  const [tempUsername, setTempUsername] = useState(guestProfile.global_name);
  const [tempColor, setTempColor] = useState(guestProfile.color);

  // Chat/Socket States
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, { name: string; timestamp: number }>>({});
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get active identity (either real Discord User or Guest Profile)
  const getIdentity = () => {
    if (user) {
      return {
        id: user.id,
        username: user.username,
        global_name: user.global_name || user.username,
        avatar: user.avatar,
        isGuest: false,
        color: '#3B82F6' // default accent
      };
    }
    return guestProfile;
  };

  // Setup Socket Connection
  useEffect(() => {
    const currentIdentity = getIdentity();
    
    // Establish socket connection using direct websocket transport for 100% stable connection on Cloud Run
    const socket = io({
      transports: ['websocket'],
      reconnectionAttempts: 15,
      reconnectionDelay: 1500,
    });
    
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      // Join the chat with user profile
      socket.emit('chat:join', currentIdentity);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Receive chat history
    socket.on('chat:history', (history: ChatMessage[]) => {
      setMessages(history);
    });

    // Receive single new message
    socket.on('chat:message', (msg: ChatMessage) => {
      setMessages((prev) => {
        // Idempotency check: don't append duplicates
        if (prev.some((p) => p.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    // Receive updated online users
    socket.on('chat:users', (usersList: any[]) => {
      setActiveUsers(usersList);
    });

    // Receive typing notification
    socket.on('chat:typing', (data: { user: any; isTyping: boolean }) => {
      if (data.user.id === currentIdentity.id) return; // ignore self
      
      setTypingUsers((prev) => {
        const next = { ...prev };
        if (data.isTyping) {
          next[data.user.id] = {
            name: data.user.global_name || data.user.username,
            timestamp: Date.now()
          };
        } else {
          delete next[data.user.id];
        }
        return next;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [user, guestProfile]); // re-connect/re-join when active user or guest profile changes

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // Clean stale typing indicators (older than 4 seconds)
  useEffect(() => {
    const cleanupTyping = setInterval(() => {
      const now = Date.now();
      let hasChanges = false;
      const next = { ...typingUsers };
      
      Object.entries(next).forEach(([id, info]) => {
        const typingInfo = info as { name: string; timestamp: number };
        if (now - typingInfo.timestamp > 4000) {
          delete next[id];
          hasChanges = true;
        }
      });
      
      if (hasChanges) {
        setTypingUsers(next);
      }
    }, 2000);

    return () => clearInterval(cleanupTyping);
  }, [typingUsers]);

  // Send Message function
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !socketRef.current || !isConnected) return;

    const identity = getIdentity();
    socketRef.current.emit('chat:message', {
      text: inputText.trim(),
      user: identity
    });

    // Stop typing indicator instantly on send
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socketRef.current.emit('chat:typing', {
      user: identity,
      isTyping: false
    });

    setInputText('');
  };

  // Typing indicator trigger with debounce
  const handleInputKeyPress = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    
    if (!socketRef.current || !isConnected) return;
    const identity = getIdentity();

    // Notify server we are typing
    socketRef.current.emit('chat:typing', {
      user: identity,
      isTyping: true
    });

    // Clear previous timeout and set new one to turn typing off
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (socketRef.current) {
        socketRef.current.emit('chat:typing', {
          user: identity,
          isTyping: false
        });
      }
    }, 2500);
  };

  // Update Guest Profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempUsername.trim()) return;

    const updatedProfile: GuestProfile = {
      ...guestProfile,
      global_name: tempUsername.trim(),
      username: tempUsername.trim().toLowerCase().replace(/\s+/g, '_'),
      color: tempColor
    };

    setGuestProfile(updatedProfile);
    localStorage.setItem('one_guest_profile', JSON.stringify(updatedProfile));
    setIsEditingProfile(false);
  };

  // Helper to format timestamps
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const currentIdentity = getIdentity();

  return (
    <div className="space-y-0 md:space-y-6 flex flex-col h-full md:h-auto overflow-hidden">
      {/* Header Panel */}
      <div className="hidden md:flex bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/60 p-5 rounded-3xl flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <Globe className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg md:text-xl tracking-tight flex items-center gap-2">
                World Chat Room
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${isConnected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                  {isConnected ? (
                    <>
                      <Wifi className="w-3 h-3 text-emerald-400" />
                      Live Connected
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3 text-rose-400 animate-bounce" />
                      Disconnected
                    </>
                  )}
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                A globally synchronized real-time lounge for everyone and all community members using ONE. Platform.
              </p>
            </div>
          </div>
        </div>

        {/* User Identity Banner / Guest Settings button */}
        <div className="bg-zinc-950/80 border border-zinc-850 p-3 rounded-2xl flex items-center gap-3.5 shadow-inner">
          {/* Avatar rendering */}
          {currentIdentity.avatar ? (
            <img 
              src={user ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : ''} 
              alt={currentIdentity.username}
              className="w-10 h-10 rounded-full border border-zinc-800 shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-lg"
              style={{ backgroundColor: currentIdentity.color }}
            >
              {currentIdentity.global_name.substring(0, 2).toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-white truncate max-w-[120px] block">
                {currentIdentity.global_name}
              </span>
              <span className={`text-[9px] font-black tracking-widest uppercase px-1.5 py-0.2 rounded border shrink-0 ${currentIdentity.isGuest ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                {currentIdentity.isGuest ? 'Guest' : 'Discord'}
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 mt-0.5 truncate max-w-[140px]">
              {user ? `@${user.username}` : 'Temporary identity'}
            </p>
          </div>

          {currentIdentity.isGuest && (
            <button
              onClick={() => {
                setTempUsername(guestProfile.global_name);
                setTempColor(guestProfile.color);
                setIsEditingProfile(true);
              }}
              className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all ml-1.5"
              title="Edit Guest Profile"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Guest Profile Edit Dialog Modal */}
      <AnimatePresence>
        {isEditingProfile && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800/80 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative"
            >
              <h3 className="text-white font-bold text-base tracking-tight mb-4 flex items-center gap-2">
                <Smile className="w-5 h-5 text-amber-400" />
                Customize Guest Profile
              </h3>
              
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-2">
                    Nickname
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={20}
                    value={tempUsername}
                    onChange={(e) => setTempUsername(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-all shadow-inner"
                    placeholder="Enter nickname..."
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-2">
                    Avatar Theme Color
                  </label>
                  <div className="flex gap-2">
                    {GUEST_COLORS.map((color) => (
                      <button
                        type="button"
                        key={color}
                        onClick={() => setTempColor(color)}
                        className="w-8 h-8 rounded-full border border-zinc-950 transition-all relative flex items-center justify-center shrink-0"
                        style={{ backgroundColor: color }}
                      >
                        {tempColor === color && (
                          <Check className="w-4 h-4 text-white drop-shadow-md" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="flex-1 px-4 py-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 rounded-xl text-xs text-zinc-400 font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-xl text-xs text-white font-bold transition-all shadow-lg shadow-blue-500/20"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Online Users Drawer Sheet */}
      <AnimatePresence>
        {isMobileOnlineListOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center lg:hidden">
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="bg-zinc-950 border-t border-zinc-800 rounded-t-3xl p-5 w-full max-h-[80vh] flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-zinc-900 mb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-white font-bold text-sm tracking-tight uppercase">
                    Online Now ({activeUsers.length})
                  </h3>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsMobileOnlineListOpen(false)}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-850 rounded-xl text-xs text-zinc-400 font-bold transition-all"
                >
                  Close
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3.5 pr-1 pb-4">
                {activeUsers.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">No users online</p>
                ) : (
                  <div className="space-y-3.5">
                    {activeUsers.map((active) => (
                      <div key={active.id} className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          {active.avatar ? (
                            <img
                              src={`https://cdn.discordapp.com/avatars/${active.id}/${active.avatar}.png`}
                              alt={active.username}
                              className="w-8.5 h-8.5 rounded-full border border-zinc-800"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div 
                              className="w-8.5 h-8.5 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-md"
                              style={{ backgroundColor: active.color || '#3B82F6' }}
                            >
                              {active.username.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className="absolute bottom-0 right-0 bg-emerald-500 w-2.5 h-2.5 rounded-full border-2 border-zinc-950"></span>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-zinc-200 truncate block max-w-[150px]">
                              {active.global_name || active.username}
                            </span>
                          </div>
                          <span className="text-[9px] text-zinc-500 font-medium block truncate">
                            {active.isGuest ? 'Guest user' : `@${active.username}`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Grid: Chat Stream and Active User list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 md:gap-6 items-start">
        
        {/* Left/Main Column: Chat Box */}
        <div className="lg:col-span-9 bg-zinc-900/30 border-t border-zinc-850/60 md:border border-zinc-800/60 rounded-none md:rounded-3xl overflow-hidden flex flex-col h-[calc(100vh-128px)] md:h-[520px] shadow-xl">
          
          {/* Mobile Chat Header (Only visible on mobile) */}
          <div className="md:hidden flex items-center justify-between px-4 py-3 bg-zinc-950/40 border-b border-zinc-850/60 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <h2 className="text-white font-bold text-sm tracking-tight">World Chat Room</h2>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={() => setIsMobileOnlineListOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-xl text-[10px] font-black tracking-wider uppercase text-zinc-300 transition-all"
              >
                <Users className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>{activeUsers.length}</span>
              </button>

              {currentIdentity.isGuest && (
                <button
                  type="button"
                  onClick={() => {
                    setTempUsername(guestProfile.global_name);
                    setTempColor(guestProfile.color);
                    setIsEditingProfile(true);
                  }}
                  className="p-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all"
                  title="Edit Guest Profile"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Chat room messages view port */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4.5 custom-scrollbar min-h-0 bg-zinc-950/20">
            {!isConnected ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-850 flex items-center justify-center text-zinc-400 mb-3 animate-pulse">
                  <Globe className="w-6 h-6 animate-spin" style={{ animationDuration: '4s' }} />
                </div>
                <p className="text-sm font-medium">Connecting to World Chat room...</p>
                <p className="text-xs text-zinc-600 mt-1">Establishing real-time synchronization with the server.</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-850 flex items-center justify-center text-zinc-400 mb-3">
                  <Globe className="w-6 h-6 text-zinc-500" />
                </div>
                <p className="text-sm font-medium">World Chat is Active</p>
                <p className="text-xs text-zinc-600 mt-1">No messages in this room yet. Be the first to start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isSystem = msg.user.id === 'system';
                
                if (isSystem) {
                  return (
                    <div key={msg.id} className="flex justify-center">
                      <div className="bg-zinc-900/50 border border-zinc-800/40 px-4 py-2 rounded-full max-w-md text-center">
                        <span className="text-[11px] text-zinc-400 leading-relaxed font-medium">
                          {msg.text}
                        </span>
                      </div>
                    </div>
                  );
                }

                const isSelf = msg.user.id === currentIdentity.id;

                return (
                  <div 
                    key={msg.id} 
                    className={`flex gap-3.5 items-start max-w-3xl ${isSelf ? 'ml-auto flex-row-reverse' : ''}`}
                  >
                    {/* Message Avatar */}
                    {msg.user.avatar ? (
                      <img
                        src={`https://cdn.discordapp.com/avatars/${msg.user.id}/${msg.user.avatar}.png`}
                        alt={msg.user.username}
                        className="w-9 h-9 rounded-full border border-zinc-800 shrink-0 mt-0.5 shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div 
                        className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 mt-0.5 shadow-sm"
                        style={{ backgroundColor: msg.user.color || '#3B82F6' }}
                      >
                        {msg.user.username.substring(0, 2).toUpperCase()}
                      </div>
                    )}

                    {/* Message Bubble Column */}
                    <div className={`min-w-0 space-y-1.5 ${isSelf ? 'items-end flex flex-col' : ''}`}>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold text-zinc-200 hover:underline cursor-pointer ${isSelf ? 'text-blue-400' : ''}`}>
                          {msg.user.global_name || msg.user.username}
                        </span>
                        
                        <span className={`text-[8px] font-black tracking-widest uppercase px-1 rounded ${msg.user.isGuest ? 'bg-amber-500/10 text-amber-500 border border-amber-500/15' : 'bg-blue-500/10 text-blue-500 border border-blue-500/15'}`}>
                          {msg.user.isGuest ? 'Guest' : 'Member'}
                        </span>

                        <span className="text-[10px] text-zinc-500 font-medium">
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>

                      {/* Text Bubble */}
                      <div 
                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-all ${
                          isSelf 
                            ? 'bg-blue-600 text-white rounded-tr-none' 
                            : 'bg-zinc-900 border border-zinc-850 text-zinc-300 rounded-tl-none'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Typing Indicator Rail */}
          <div className="px-5 py-1.5 bg-zinc-950/40 border-t border-zinc-850 h-7 flex items-center shrink-0">
            {Object.keys(typingUsers).length > 0 && (
              <p className="text-[10px] text-zinc-400 flex items-center gap-1.5 font-medium animate-pulse">
                <span className="flex gap-0.5 items-center">
                  <span className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </span>
                <span>
                  {Object.values(typingUsers).map((u) => (u as { name: string; timestamp: number }).name).join(', ')}
                  {Object.keys(typingUsers).length === 1 ? ' is typing...' : ' are typing...'}
                </span>
              </p>
            )}
          </div>

          {/* Text Input area bar */}
          <div className="bg-zinc-950/60 p-4 border-t border-zinc-850 flex items-center shrink-0">
            <form onSubmit={handleSendMessage} className="w-full flex gap-2.5 items-center">
              <input
                type="text"
                disabled={!isConnected}
                maxLength={500}
                value={inputText}
                onChange={handleInputKeyPress}
                placeholder={isConnected ? "Message #global-chat-room..." : "Connecting to real-time chat service..."}
                className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500 disabled:opacity-50 transition-all shadow-inner"
              />
              
              <button
                type="submit"
                disabled={!inputText.trim() || !isConnected}
                className="p-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-2xl text-white transition-all active:scale-95 shadow-lg shadow-blue-500/15 shrink-0"
                title="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>

        {/* Right Column: Online Presence sidebar list */}
        <div className="hidden lg:block lg:col-span-3 space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <h3 className="text-white font-bold text-sm tracking-tight uppercase">
              Online Now ({activeUsers.length})
            </h3>
          </div>

          <div className="bg-zinc-900/20 border border-zinc-800/60 rounded-3xl p-4.5 h-[465px] overflow-y-auto custom-scrollbar">
            {activeUsers.length === 0 ? (
              <p className="text-xs text-zinc-500 italic">No users online</p>
            ) : (
              <div className="space-y-3.5">
                {activeUsers.map((active) => (
                  <div key={active.id} className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      {active.avatar ? (
                        <img
                          src={`https://cdn.discordapp.com/avatars/${active.id}/${active.avatar}.png`}
                          alt={active.username}
                          className="w-8.5 h-8.5 rounded-full border border-zinc-800"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div 
                          className="w-8.5 h-8.5 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-md"
                          style={{ backgroundColor: active.color || '#3B82F6' }}
                        >
                          {active.username.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      {/* Active green status dot indicator */}
                      <span className="absolute bottom-0 right-0 bg-emerald-500 w-2.5 h-2.5 rounded-full border-2 border-zinc-950"></span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-zinc-200 truncate block max-w-[120px]">
                          {active.global_name || active.username}
                        </span>
                      </div>
                      <span className="text-[9px] text-zinc-500 font-medium block truncate">
                        {active.isGuest ? 'Guest user' : `@${active.username}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
