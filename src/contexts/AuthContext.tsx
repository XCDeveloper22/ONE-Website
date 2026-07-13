import React, { createContext, useContext, useEffect, useState } from 'react';
import { DiscordUser } from '../types';

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
        setUser(loggedInUser);
        try {
          localStorage.setItem('one_user', JSON.stringify(loggedInUser));
        } catch (e) {
          console.error('Failed to cache user', e);
        }
        setAuthError(null);
        setIsLoggingIn(false);
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
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      try {
        localStorage.removeItem('one_user');
        localStorage.removeItem('one_guilds');
        localStorage.removeItem('one_connections');
      } catch (e) {
        console.error('Failed to clear localStorage keys', e);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isLoggingIn, authError, login, logout, setUser }}>
      {children}
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
