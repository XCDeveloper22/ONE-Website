import React, { createContext, useContext, useEffect, useState } from 'react';
import { DiscordUser } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ShieldCheck, LogOut, Loader2 } from 'lucide-react';

interface AuthContextType {
  user: DiscordUser | null;
  loading: boolean;
  isLoggingIn: boolean;
  authError: string | null;
  login: () => void;
  logout: () => Promise<void>;
  setUser: (user: DiscordUser | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DiscordUser | null>(() => {
    try {
      const cached = localStorage.getItem('one_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      // If we already have a cached user, we can skip the blocking loading screen
      return !localStorage.getItem('one_user');
    } catch {
      return true;
    }
  });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [transitionState, setTransitionState] = useState<'login' | 'logout' | null>(null);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [transitionStatus, setTransitionStatus] = useState('');

  useEffect(() => {
    // Check if user is already logged in & revalidate
    fetch('/api/me')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Not authenticated');
      })
      .then(data => {
        setUser(data);
        try {
          localStorage.setItem('one_user', JSON.stringify(data));
        } catch (e) {
          console.error('Failed to cache user', e);
        }
      })
      .catch(() => {
        setUser(null);
        try {
          localStorage.removeItem('one_user');
          localStorage.removeItem('one_guilds');
          localStorage.removeItem('one_connections');
        } catch (e) {
          console.error('Failed to clear cache', e);
        }
      })
      .finally(() => {
        setLoading(false);
      });
      
    // Listen for OAuth success from popup
    const handleMessage = (event: MessageEvent) => {
      // Verify origin matches our window location
      if (event.origin !== window.location.origin) {
        return;
      }
      
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.user) {
        const loggedInUser = event.data.user;
        setAuthError(null);
        setIsLoggingIn(false);

        // Start beautiful login transition animation
        setTransitionState('login');
        setTransitionProgress(0);
        setTransitionStatus('Authenticating secure session with Discord...');

        let progress = 0;
        const interval = setInterval(() => {
          progress += 5;
          if (progress <= 25) {
            setTransitionStatus('Connecting to Discord Secure Gateway...');
          } else if (progress <= 50) {
            setTransitionStatus('Synchronizing servers, profile & active roles...');
          } else if (progress <= 75) {
            setTransitionStatus('Initializing ONE real-time Gateway Websocket...');
          } else if (progress <= 95) {
            setTransitionStatus('Preparing dashboard layouts & preferences...');
          } else {
            setTransitionStatus('Welcome back, Operator!');
          }
          setTransitionProgress(Math.min(progress, 100));

          if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setUser(loggedInUser);
              try {
                localStorage.setItem('one_user', JSON.stringify(loggedInUser));
              } catch (e) {
                console.error('Failed to cache user', e);
              }
              setTransitionState(null);
            }, 300);
          }
        }, 80);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const login = async () => {
    try {
      setAuthError(null);
      setIsLoggingIn(true);
      const response = await fetch('/api/auth/url');
      if (!response.ok) {
        throw new Error('Please configure DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET in the AI Studio Settings (Secrets menu) to enable the real Discord login.');
      }
      const { url } = await response.json();
      
      const authWindow = window.open(
        url,
        'oauth_popup',
        'width=600,height=700'
      );
      
      if (!authWindow) {
        setAuthError('Please allow popups for this site to connect your Discord account.');
        setIsLoggingIn(false);
        return;
      }

      // Check if popup is closed to stop loading spinner
      const checkWindowInterval = setInterval(() => {
        if (authWindow.closed) {
          clearInterval(checkWindowInterval);
          setIsLoggingIn(false);
        }
      }, 500);

    } catch (error: any) {
      console.error('OAuth error:', error);
      setAuthError(error.message);
      setIsLoggingIn(false);
    }
  };

  const logout = async () => {
    setTransitionState('logout');
    setTransitionProgress(0);
    setTransitionStatus('Initiating secure session termination...');

    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    }

    let progress = 0;
    const interval = setInterval(() => {
      progress += 8;
      if (progress <= 30) {
        setTransitionStatus('Revoking Discord active session tokens...');
      } else if (progress <= 60) {
        setTransitionStatus('Clearing local session caches & credentials...');
      } else if (progress <= 85) {
        setTransitionStatus('Terminating real-time server connections...');
      } else {
        setTransitionStatus('Session terminated safely.');
      }
      setTransitionProgress(Math.min(progress, 100));

      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setUser(null);
          try {
            localStorage.removeItem('one_user');
            localStorage.removeItem('one_guilds');
            localStorage.removeItem('one_connections');
          } catch (e) {
            console.error('Failed to clear localStorage keys', e);
          }
          setTransitionState(null);
        }, 350);
      }
    }, 80);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isLoggingIn, authError, login, logout, setUser }}>
      {children}

      {/* Global Transition Loading Screen Overlay */}
      <AnimatePresence>
        {transitionState && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#09090b]/98 backdrop-blur-3xl z-[9999] flex flex-col items-center justify-center p-6 select-none"
          >
            {/* Ambient Background Flares */}
            <div className={`absolute w-72 h-72 rounded-full blur-[120px] opacity-10 pointer-events-none transition-colors duration-500 ${transitionState === 'login' ? 'bg-blue-500 -top-12 -left-12' : 'bg-rose-500 -top-12 -left-12'}`}></div>
            <div className={`absolute w-72 h-72 rounded-full blur-[120px] opacity-10 pointer-events-none transition-colors duration-500 ${transitionState === 'login' ? 'bg-violet-500 -bottom-12 -right-12' : 'bg-red-500 -bottom-12 -right-12'}`}></div>

            <div className="max-w-md w-full text-center space-y-8 relative z-10">
              {/* Spinner/Icon Holder */}
              <div className="flex justify-center">
                <div className="relative">
                  {/* Glowing Ring */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className={`w-20 h-20 rounded-full border-2 border-t-transparent ${transitionState === 'login' ? 'border-blue-500/80 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'border-rose-500/80 shadow-[0_0_20px_rgba(239,68,68,0.3)]'}`}
                  ></motion.div>

                  {/* Centered Icon with Pulse */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [0.95, 1.05, 0.95] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                    >
                      {transitionState === 'login' ? (
                        <ShieldCheck className="w-8 h-8 text-blue-400" />
                      ) : (
                        <LogOut className="w-8 h-8 text-rose-400" />
                      )}
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Text Information */}
              <div className="space-y-2">
                <h3 className="text-xl font-black text-white tracking-tight">
                  {transitionState === 'login' ? 'Synchronizing Dashboard' : 'Logging Out'}
                </h3>
                <p className="text-xs font-mono text-zinc-500 tracking-wider h-4 uppercase">
                  {transitionStatus}
                </p>
              </div>

              {/* Progress Bar Container */}
              <div className="space-y-2">
                <div className="w-full bg-zinc-900/60 border border-zinc-800/80 h-2 rounded-full overflow-hidden p-0.5 shadow-inner">
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: `${transitionProgress}%` }}
                    transition={{ ease: "easeOut", duration: 0.1 }}
                    className={`h-full rounded-full ${transitionState === 'login' ? 'bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}
                  ></motion.div>
                </div>
                <div className="flex justify-between items-center text-[10px] text-zinc-600 font-mono font-bold">
                  <span>STATUS: {transitionProgress >= 100 ? 'COMPLETE' : 'PROCESSING'}</span>
                  <span>{transitionProgress}%</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
