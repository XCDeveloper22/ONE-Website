/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import OfflineGame from './components/OfflineGame';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#313338] text-white">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

export default function App() {
  useEffect(() => {
    // 1. Detect if this session was loaded via page refresh/reload
    try {
      const navigationEntries = performance.getEntriesByType('navigation');
      if (navigationEntries.length > 0) {
        const navigationTiming = navigationEntries[0] as PerformanceNavigationTiming;
        if (navigationTiming.type === 'reload') {
          window.location.href = 'https://onewebsite.vercel.app/';
          return;
        }
      } else if (performance.navigation && performance.navigation.type === 1) {
        // Fallback for older browsers
        window.location.href = 'https://onewebsite.vercel.app/';
        return;
      }
    } catch (err) {
      console.warn('Performance navigation API error:', err);
    }

    // 2. Intercept keyboard refresh shortcuts (F5, Ctrl+R, Cmd+R)
    const handleKeyDown = (e: KeyboardEvent) => {
      const isF5 = e.key === 'F5' || e.keyCode === 116;
      const isR = (e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'R' || e.keyCode === 82);
      
      if (isF5 || isR) {
        e.preventDefault();
        window.location.href = 'https://onewebsite.vercel.app/';
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <OfflineGame />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
