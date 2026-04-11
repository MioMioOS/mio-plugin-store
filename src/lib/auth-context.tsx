"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { setAccessToken } from "./api";

export interface User {
  id: string;
  github_id: number;
  github_login: string;
  avatar_url: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "=([^;]*)"),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for one-time auth data cookie (set after OAuth callback)
    const authDataRaw = getCookie("mio_auth_data");
    if (authDataRaw) {
      try {
        const data = JSON.parse(authDataRaw);
        if (data.user && data.accessToken) {
          setUser(data.user);
          setAccessToken(data.accessToken);
          setLoading(false);
          deleteCookie("mio_auth_data");
          return;
        }
      } catch {
        // invalid cookie, ignore
      }
      deleteCookie("mio_auth_data");
    }

    // No cookie -- try silent refresh
    fetch("/api/auth/refresh", { method: "POST" })
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        if (data.accessToken && data.user) {
          setUser(data.user);
          setAccessToken(data.accessToken);
        }
      })
      .catch(() => {
        // not logged in, that's fine
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = useCallback(() => {
    window.location.href = "/api/auth/login";
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    setUser(null);
    setAccessToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
