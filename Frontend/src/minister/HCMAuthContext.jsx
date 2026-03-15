import { createContext, useContext, useEffect, useState } from "react";

const HCMAuthContext = createContext(null);
const SESSION_KEY = "hcm_session_expires_at";

export function HCMAuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("hcm_user")) || null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("hcm_token") || null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState(() => localStorage.getItem(SESSION_KEY) || "");

  useEffect(() => {
    if (!sessionExpiresAt) return undefined;
    const expiresAt = new Date(sessionExpiresAt).getTime();
    if (Number.isNaN(expiresAt)) return undefined;

    const clearExpiredSession = () => {
      if (Date.now() >= expiresAt) {
        localStorage.removeItem("hcm_user");
        localStorage.removeItem("hcm_token");
        localStorage.removeItem(SESSION_KEY);
        setUser(null);
        setToken(null);
        setSessionExpiresAt("");
      }
    };

    clearExpiredSession();
    const timeout = window.setTimeout(clearExpiredSession, Math.max(0, expiresAt - Date.now()));
    return () => window.clearTimeout(timeout);
  }, [sessionExpiresAt]);

  const login = (userData, tok, expiresAt = "") => {
    localStorage.setItem("hcm_user", JSON.stringify(userData));
    localStorage.setItem("hcm_token", tok);
    localStorage.setItem(SESSION_KEY, expiresAt || "");
    setUser(userData);
    setToken(tok);
    setSessionExpiresAt(expiresAt || "");
  };

  const logout = () => {
    localStorage.removeItem("hcm_user");
    localStorage.removeItem("hcm_token");
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    setToken(null);
    setSessionExpiresAt("");
  };

  const updateUser = (nextUserData) => {
    localStorage.setItem("hcm_user", JSON.stringify(nextUserData));
    setUser(nextUserData);
  };

  return (
    <HCMAuthContext.Provider value={{ user, token, sessionExpiresAt, login, logout, updateUser, isAuthenticated: !!token && !!user }}>
      {children}
    </HCMAuthContext.Provider>
  );
}

export function useHCMAuth() {
  return useContext(HCMAuthContext);
}
