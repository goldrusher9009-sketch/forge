import { createContext, useContext, useState } from "react";
import { api } from "../api.js";

const Ctx = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [offline, setOffline] = useState(false);

  async function signIn(email = "operator@minera.ai") {
    try {
      const ref = new URLSearchParams(location.search).get("ref");
      const u = await api.login(email, ref);     // persists in DB
      setUser(u); setOffline(false);
    } catch {
      // backend not running -> demo/offline fallback
      setUser({ address: "0x7f3a...(offline)", email, balance: 1234.56 });
      setOffline(true);
    }
  }
  function signOut() { setUser(null); }
  function setBalance(b) { setUser((u) => (u ? { ...u, balance: b } : u)); }

  return <Ctx.Provider value={{ user, offline, signIn, signOut, setBalance }}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx);
