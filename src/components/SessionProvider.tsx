"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/lib/client";
import type { Me } from "@/lib/types";

interface SessionState {
  user: Me | null;
  adminUnlocked: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

const Ctx = createContext<SessionState>({
  user: null,
  adminUnlocked: false,
  loading: true,
  refresh: async () => {},
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await api<{ user: Me | null; adminUnlocked: boolean }>(
        "/api/auth/me",
      );
      setUser(data.user);
      setAdminUnlocked(data.adminUnlocked);
    } catch {
      // keep previous state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <Ctx.Provider value={{ user, adminUnlocked, loading, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSession() {
  return useContext(Ctx);
}
