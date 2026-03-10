import { createContext, useContext, useState } from "react";

const HCMAuthContext = createContext(null);

export function HCMAuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("hcm_user")) || null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("hcm_token") || null);

  const login = (userData, tok) => {
    localStorage.setItem("hcm_user", JSON.stringify(userData));
    localStorage.setItem("hcm_token", tok);
    setUser(userData);
    setToken(tok);
  };

  const logout = () => {
    localStorage.removeItem("hcm_user");
    localStorage.removeItem("hcm_token");
    setUser(null);
    setToken(null);
  };

  return (
    <HCMAuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token && !!user }}>
      {children}
    </HCMAuthContext.Provider>
  );
}

export function useHCMAuth() {
  return useContext(HCMAuthContext);
}
