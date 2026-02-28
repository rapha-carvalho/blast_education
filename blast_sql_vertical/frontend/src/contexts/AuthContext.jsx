import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  getCurrentUser,
  getStoredToken,
  loginUser,
  logoutUser,
  setStoredToken,
} from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    setStoredToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return null;
    }
    try {
      const data = await getCurrentUser();
      setUser(data.user);
      return data.user;
    } catch {
      clearSession();
      return null;
    } finally {
      setLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (email, password) => {
    const data = await loginUser(email, password);
    setStoredToken(data.access_token);
    setUser(data.user);
    return data.user;
  }, []);

  const replaceToken = useCallback(
    async (token) => {
      setStoredToken(token || null);
      return refreshUser();
    },
    [refreshUser]
  );

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      // Even if the backend session already expired, clear local auth state.
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      logout,
      refreshUser,
      replaceToken,
    }),
    [user, loading, login, logout, refreshUser, replaceToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
