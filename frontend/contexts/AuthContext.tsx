"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  id: number;
  username: string;
  phone?: string;
  display_name: string;
  avatar_url?: string;
  is_online: boolean;
  last_seen: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Load the current user's profile if a token exists in local storage
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      fetchUser(storedToken);
    } else {
      setLoading(false);
      if (pathname !== '/login' && pathname !== '/register') {
        router.push('/login');
      }
    }
  }, []);

  useEffect(() => {
    if (!loading && !user && pathname !== '/login' && pathname !== '/register') {
      router.push('/login');
    }
  }, [user, loading, pathname, router]);

  const fetchUser = async (authToken: string) => {
    try {
      const res = await fetch('http://localhost:8000/auth/me', {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        // Token might be invalid or expired
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        if (pathname !== '/login' && pathname !== '/register') {
          router.push('/login');
        }
      }
    } catch (err) {
      console.error("Failed to fetch user", err);
    } finally {
      setLoading(false);
    }
  };

  const login = (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setLoading(true);
    fetchUser(newToken).then(() => {
      router.push('/');
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
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
