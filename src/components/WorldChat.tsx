import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Send, Image, Mic, Video, X, Smile, Users, Lock, Unlock, Volume2, Play, Pause, 
  Loader2, Paperclip, Trash2, Globe, Sparkles, Plus, FileText, Check, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { io, Socket } from 'socket.io-client';

export interface ChatMessage {
  id: string;
  text: string;
  user: {
    id: string;
    username: string;
    global_name: string | null;
    avatar: string | null;
    isGuest?: boolean;
    color?: string;
  };
  timestamp: number;
  photoUrl?: string;
  voicemailUrl?: string;
  videoUrl?: string;
}

export interface ActiveUser {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
  isGuest?: boolean;
  color?: string;
}

export default function WorldChat() {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  
  // Media uploads & recordings
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Guest configuration
  const [guestUser, setGuestUser] = useState<any>(null);

  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<any>(null);

  // Initialize/retrieve guest session if not logged in to Discord
  useEffect(() => {
    if (!user) {
      let savedGuest = null;
      try {
        const cached = localStorage.getItem('one_guest_user');
        if (cached) savedGuest = JSON.parse(cached);
      } catch (e) {}

      if (!savedGuest) {
        const randomId = Math.random().toString(36).substring(2, 9);
        const guestNames = ['Echo', 'Frost', 'Volt', 'Nova', 'Blaze', 'Cipher', 'Vortex', 'Saber', 'Zenith', 'Specter'];
        const randomName = guestNames[Math.floor(Math.random() * guestNames.length)] + '#' + Math.floor(1000 + Math.random() * 9000);
        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        savedGuest = {
          id: `guest-${randomId}`,
          username: randomName,
          global_name: `Guest (${randomName.split('#')[0]})`,
          avatar: null,
          isGuest: true,
          color: randomColor
        };
        try {
          localStorage.setItem('one_guest_user', JSON.stringify(savedGuest));
        } catch (e) {}
      }
      setGuestUser(savedGuest);
    } else {
      setGuestUser(null);
    }
  }, [user]);

  const activeChatUser = React.useMemo(() => {
    return user ? {
      id: user.id,
      username: user.username,
      global_name: user.global_name,
      avatar: user.avatar,
      isGuest: false,
      color: '#3B82F6'
    } : guestUser;
  }, [user, guestUser]);

  // Setup WebSocket connection
  useEffect(() => {
    if (!activeChatUser) return;

    // Connect to backend server served on the current window origin
    const socketUrl = window.location.origin;
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling']
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      // Join the chat room
      newSocket.emit('chat:join', activeChatUser);
    });

    newSocket.on('chat:history', (history: ChatMessage[]) => {
      setMessages(history);
    });

    newSocket.on('chat:lock', (locked: boolean) => {
      setIsLocked(locked);
    });

    newSocket.on('chat:message', (message: ChatMessage) => {
      setMessages(prev => {
        // Prevent duplicate messages
        if (prev.some(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    newSocket.on('chat:users', (usersList: ActiveUser[]) => {
      setActiveUsers(usersList);
    });

    newSocket.on('chat:typing', (data: { user: ActiveUser; isTyping: boolean }) => {
      setTypingUsers(prev => {
        const username = data.user.global_name || data.user.username;
        if (data.isTyping) {
          if (prev.includes(username)) return prev;
          return [...prev, username];
        } else {
          return prev.filter(name => name !== username);
        }
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [activeChatUser]);

  // Scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle send message
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!socket || isLocked) return;

    const hasContent = inputText.trim() || photoPreview || audioPreview || videoPreview;
    if (!hasContent) return;

    const messageData = {
      text: inputText,
      user: activeChatUser,
      photoUrl: photoPreview || undefined,
      voicemailUrl: audioPreview || undefined,
      videoUrl: videoPreview || undefined
    };

    socket.emit('chat:message', messageData);

    // Reset inputs
    setInputText('');
    setPhotoPreview(null);
    setAudioPreview(null);
    setVideoPreview(null);

    // Notify typing stopped
    socket.emit('chat:typing', { user: activeChatUser, isTyping: false });
  };

  // Typing indicator trigger
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!socket) return;

    socket.emit('chat:typing', { user: activeChatUser, isTyping: true });

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socket.emit('chat:typing', { user: activeChatUser, isTyping: false });
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Convert File to Base64 helper
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Photo Upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const base64 = await fileToBase64(file);
      setPhotoPreview(base64);
    } catch (err) {
      console.error('Error uploading photo:', err);
    } finally {
      setIsUploading(false);
    }
  };

  // Video Upload
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const base64 = await fileToBase64(file);
      setVideoPreview(base64);
    } catch (err) {
      console.error('Error uploading video:', err);
    } finally {
      setIsUploading(false);
    }
  };

  // Recording audio / Voicemail feature
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: 'audio/webm' };
      let mediaRecorder;
      
      try {
        mediaRecorder = new MediaRecorder(stream, options);
      } catch (e) {
        mediaRecorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsUploading(true);
        try {
          // Convert audio blob to base64
          const base64Audio = await fileToBase64(new File([audioBlob], "voicemail.webm", { type: 'audio/webm' }));
          setAudioPreview(base64Audio);
        } catch (err) {
          console.error('Error parsing voicemail:', err);
        } finally {
          setIsUploading(false);
        }

        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Failed to start microphone recording:', err);
      alert('Could not access microphone. Please check your browser permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      setTimeout(() => {
        setAudioPreview(null);
      }, 100);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const toggleLockChat = () => {
    if (!socket) return;
    socket.emit('chat:lock', !isLocked);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] rounded-2xl border border-zinc-800/80 bg-zinc-950/40 backdrop-blur-xl overflow-hidden relative" id="world-chat-container">
      {/* Sidebar - Online Users (Desktop) */}
      <div className="w-64 border-r border-zinc-900 bg-zinc-950/60 p-4 flex flex-col hidden lg:flex">
        <div className="flex items-center gap-2 mb-4 px-2">
          <Users className="w-4 h-4 text-blue-400" />
          <h3 className="font-bold text-sm text-zinc-100 tracking-wide uppercase">Active Users</h3>
          <span className="ml-auto bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full text-[10px] font-bold text-blue-400">
            {activeUsers.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {activeUsers.map(u => (
            <div key={u.id} className="flex items-center gap-3 p-2 rounded-xl bg-zinc-900/30 border border-transparent hover:border-zinc-800 hover:bg-zinc-900/50 transition-all duration-200">
              <div className="relative">
                {u.avatar ? (
                  <img 
                    src={`https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png`} 
                    alt={u.username}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full bg-zinc-800 object-cover border border-zinc-700/50"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs" style={{ color: u.color || '#3B82F6' }}>
                    {u.username[0].toUpperCase()}
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-zinc-950 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-zinc-200 truncate leading-none">
                  {u.global_name || u.username}
                </div>
                <div className="text-[10px] font-mono text-zinc-500 mt-1 uppercase">
                  {u.isGuest ? 'Guest User' : 'Discord User'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Thread Area */}
      <div className="flex-1 flex flex-col bg-zinc-950/20">
        {/* Chat header info bar */}
        <div className="h-14 border-b border-zinc-900 px-6 flex items-center justify-between bg-zinc-950/30">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">ONE. World Gateway</h2>
              <p className="text-[10px] text-zinc-500 font-mono">Live synchronization across all nodes</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Show user guest label if guest */}
            {activeChatUser?.isGuest && (
              <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                Posting as {activeChatUser.username.split('#')[0]} (Guest)
              </span>
            )}

            {/* Lock/Unlock Room (Moderation control simulator - owner can toggle) */}
            {(user?.email === 'calv.dc21@gmail.com' || user?.username === 'kenzu.xc') && (
              <button 
                onClick={toggleLockChat}
                className={`p-2 rounded-lg border transition-all duration-200 flex items-center gap-1.5 text-xs font-bold ${
                  isLocked 
                    ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {isLocked ? <Lock className="w-3.5 h-3.5 text-red-400" /> : <Unlock className="w-3.5 h-3.5" />}
                <span>{isLocked ? 'Locked' : 'Lock Room'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Message scroll viewport */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isSystem = msg.user.id === 'system';
              const isMe = msg.user.id === activeChatUser?.id;

              if (isSystem) {
                return (
                  <motion.div 
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-center my-3"
                  >
                    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-full px-4 py-1.5 text-xs text-zinc-400 flex items-center gap-2 font-medium shadow-inner">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      <span>{msg.text}</span>
                    </div>
                  </motion.div>
                );
              }

              return (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`flex gap-3 max-w-[85%] md:max-w-[70%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div className="shrink-0">
                    {msg.user.avatar ? (
                      <img 
                        src={`https://cdn.discordapp.com/avatars/${msg.user.id}/${msg.user.avatar}.png`} 
                        alt={msg.user.username}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full bg-zinc-800 object-cover border border-zinc-800"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-zinc-900/80 border border-zinc-800 flex items-center justify-center font-bold text-sm" style={{ color: msg.user.color || '#3B82F6' }}>
                        {msg.user.username[0].toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="space-y-1">
                    <div className={`flex items-center gap-2 text-xs ${isMe ? 'justify-end' : ''}`}>
                      <span 
                        className="font-bold text-zinc-200" 
                        style={msg.user.isGuest ? { color: msg.user.color } : undefined}
                      >
                        {msg.user.global_name || msg.user.username}
                      </span>
                      {msg.user.isGuest && (
                        <span className="text-[9px] bg-zinc-900 border border-zinc-800 text-zinc-500 font-bold px-1 rounded uppercase">Guest</span>
                      )}
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Message Bubble */}
                    <div className={`rounded-2xl px-4 py-3 border text-sm leading-relaxed whitespace-pre-wrap break-words ${
                      isMe 
                        ? 'bg-blue-600/10 border-blue-500/20 text-zinc-100 rounded-tr-none shadow-[0_0_15px_rgba(59,130,246,0.05)]' 
                        : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-200 rounded-tl-none'
                    }`}>
                      {msg.text && <p className="mb-2 last:mb-0">{msg.text}</p>}

                      {/* Display Media if attached */}
                      {msg.photoUrl && (
                        <div className="mt-2 rounded-lg overflow-hidden border border-zinc-800/60 max-h-72 bg-zinc-950 flex items-center justify-center">
                          <img 
                            src={msg.photoUrl} 
                            alt="Shared photo" 
                            className="max-h-72 object-contain hover:scale-[1.02] transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      {msg.videoUrl && (
                        <div className="mt-2 rounded-lg overflow-hidden border border-zinc-800/60 max-h-72 bg-zinc-950">
                          <video 
                            src={msg.videoUrl} 
                            controls 
                            className="w-full max-h-72 object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      {msg.voicemailUrl && (
                        <div className="mt-2 flex items-center gap-3 bg-zinc-950/80 border border-zinc-800/50 p-3 rounded-xl max-w-sm">
                          <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <Volume2 className="w-4 h-4 text-blue-400 animate-pulse" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">Voice Message</div>
                            <audio 
                              src={msg.voicemailUrl} 
                              controls 
                              className="w-full h-8 mt-1 accent-blue-500 bg-zinc-950 rounded-lg custom-audio" 
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={chatEndRef} />
        </div>

        {/* Live Typing & Active Users Mobile status line */}
        <div className="h-6 px-6 text-xs text-zinc-500 flex items-center justify-between font-mono border-t border-zinc-950 bg-zinc-950/20 select-none">
          <div className="h-4 flex items-center">
            {typingUsers.length > 0 && (
              <span className="flex items-center gap-1 text-zinc-400">
                <span className="animate-pulse">●</span> 
                {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
              </span>
            )}
          </div>
          <div className="lg:hidden flex items-center gap-1 text-[10px] text-zinc-600 font-bold uppercase tracking-wider">
            <Users className="w-3 h-3 text-zinc-600" />
            <span>{activeUsers.length} Online</span>
          </div>
        </div>

        {/* Media Upload Previews */}
        <AnimatePresence>
          {(photoPreview || videoPreview || audioPreview) && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 py-4 bg-zinc-950/80 border-t border-zinc-900/80 flex flex-wrap gap-4 items-center relative"
            >
              <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider w-full">Attachments Preview</h4>

              {photoPreview && (
                <div className="relative w-28 h-28 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 group">
                  <img src={photoPreview} alt="Upload preview" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setPhotoPreview(null)}
                    className="absolute top-1.5 right-1.5 p-1 bg-black/70 rounded-full border border-zinc-800 hover:bg-red-500/20 hover:border-red-500/30 text-zinc-400 hover:text-red-400 transition-all duration-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {videoPreview && (
                <div className="relative w-44 h-28 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 group">
                  <video src={videoPreview} className="w-full h-full object-cover" muted />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Video className="w-6 h-6 text-white/70" />
                  </div>
                  <button 
                    onClick={() => setVideoPreview(null)}
                    className="absolute top-1.5 right-1.5 p-1 bg-black/70 rounded-full border border-zinc-800 hover:bg-red-500/20 hover:border-red-500/30 text-zinc-400 hover:text-red-400 transition-all duration-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {audioPreview && (
                <div className="relative bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-3 flex items-center gap-3 w-64">
                  <Volume2 className="w-5 h-5 text-blue-400 animate-pulse" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-mono font-bold text-zinc-500">VOICEMAIL_RECORDED.webm</div>
                    <audio src={audioPreview} controls className="w-full h-6 mt-1 accent-blue-500" />
                  </div>
                  <button 
                    onClick={() => setAudioPreview(null)}
                    className="p-1 bg-black/50 rounded-full border border-zinc-800 hover:bg-red-500/20 hover:border-red-500/30 text-zinc-400 hover:text-red-400 transition-all duration-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Controls Bar */}
        <div className="p-4 md:p-6 border-t border-zinc-900 bg-zinc-950/40">
          {isLocked ? (
            <div className="flex items-center justify-center gap-2 text-zinc-500 text-xs py-2 bg-zinc-900/40 border border-zinc-800/50 rounded-xl select-none font-mono">
              <Lock className="w-3.5 h-3.5 text-red-500" />
              <span>THE CHAT ROOM IS CURRENTLY LOCKED BY MODERATORS.</span>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="flex gap-2 relative">
              
              {/* Media Upload Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                
                {/* Photo Upload Trigger */}
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isRecording || isUploading}
                  className="p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/80 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all duration-200 disabled:opacity-50"
                  title="Upload Photo"
                >
                  <Image className="w-4.5 h-4.5" />
                </button>

                {/* Video Upload Trigger */}
                <input 
                  type="file" 
                  ref={videoInputRef}
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                />
                <button 
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={isRecording || isUploading}
                  className="p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/80 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all duration-200 disabled:opacity-50"
                  title="Upload Video"
                >
                  <Video className="w-4.5 h-4.5" />
                </button>

                {/* Voicemail Recording Trigger */}
                {isRecording ? (
                  <div className="flex items-center gap-1 bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-xl shrink-0">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping mr-1"></span>
                    <span className="text-xs font-mono font-bold text-red-400">{formatDuration(recordingDuration)}</span>
                    <div className="h-4 border-l border-red-500/20 mx-2"></div>
                    <button 
                      type="button"
                      onClick={stopRecording}
                      className="p-1 rounded-lg text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                      title="Finish Voicemail"
                    >
                      <Check className="w-4.5 h-4.5" />
                    </button>
                    <button 
                      type="button"
                      onClick={cancelRecording}
                      className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/20 transition-colors"
                      title="Cancel Recording"
                    >
                      <X className="w-4.5 h-4.5" />
                    </button>
                  </div>
                ) : (
                  <button 
                    type="button"
                    onClick={startRecording}
                    disabled={isUploading}
                    className="p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/80 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all duration-200 disabled:opacity-50"
                    title="Record Voicemail"
                  >
                    <Mic className="w-4.5 h-4.5" />
                  </button>
                )}

              </div>

              {/* Text Input */}
              <div className="flex-1 relative min-w-0">
                <input 
                  type="text"
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  disabled={isRecording || isUploading}
                  placeholder={isRecording ? "Microphone active..." : "Say something to the world..."}
                  className="w-full bg-zinc-900/60 hover:bg-zinc-900/80 focus:bg-zinc-900/90 border border-zinc-800/80 focus:border-blue-500/50 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all duration-200 disabled:opacity-50"
                />
              </div>

              {/* Send Button */}
              <button 
                type="submit"
                disabled={isRecording || isUploading || (!inputText.trim() && !photoPreview && !audioPreview && !videoPreview)}
                className="px-5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm transition-all duration-200 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:scale-[1.02] active:scale-98 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center shrink-0"
              >
                {isUploading ? (
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                ) : (
                  <Send className="w-4.5 h-4.5" />
                )}
              </button>

            </form>
          )}
        </div>
      </div>
    </div>
  );
}
