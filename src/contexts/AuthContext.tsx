import React, { createContext, useContext, useEffect, useState } from 'react';
import { DiscordUser } from '../types';

interface AuthContextType {
  user: DiscordUser | null;
  loading: boolean;
  authError: string | null;
  login: () => void;
  logout: () => Promise<void>;
  setUser: (user: DiscordUser | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DiscordUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    fetch('/api/me')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Not authenticated');
      })
      .then(data => {
        setUser(data);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
      
    // Listen for OAuth success from popup
    const handleMessage = (event: MessageEvent) => {
      // Allow localhost and *.run.app
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.user) {
        setUser(event.data.user);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const login = async () => {
    try {
      setAuthError(null);
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
      }
    } catch (error: any) {
      console.error('OAuth error:', error);
      setAuthError(error.message);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, authError, login, logout, setUser }}>
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
