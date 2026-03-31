"use client";
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api/v1";

  useEffect(() => {
    const savedToken = localStorage.getItem("pm_token");
    if (savedToken) {
      setToken(savedToken);
      // Verify token
      fetch(`${apiUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${savedToken}` }
      })
        .then(r => r.json())
        .then(data => {
          if (data.data?.user) setUser(data.data.user);
          else { localStorage.removeItem("pm_token"); setToken(null); }
        })
        .catch(() => { localStorage.removeItem("pm_token"); setToken(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [apiUrl]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${apiUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Login failed");
    setToken(data.data.token);
    setUser(data.data.user);
    localStorage.setItem("pm_token", data.data.token);
  }, [apiUrl]);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("pm_token");
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
