"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from "react";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ensureUserRecord, getUserDoc } from "@/lib/services/userService";
import type { UserDoc } from "@/lib/types";

interface AuthState {
  fbUser: FirebaseUser | null;
  userDoc: UserDoc | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const AuthCtx = createContext<AuthState>({
  fbUser: null,
  userDoc: null,
  loading: true,
  refresh: async () => {}
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [fbUser, setFbUser] = useState<FirebaseUser | null>(null);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    if (!auth.currentUser) return;
    const doc = await ensureUserRecord(auth);
    setUserDoc(doc);
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setFbUser(u);
      if (u) {
        try {
          const doc = await ensureUserRecord(auth);
          setUserDoc(doc);
        } catch {
          setUserDoc(null);
        }
      } else {
        setUserDoc(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <AuthCtx.Provider value={{ fbUser, userDoc, loading, refresh }}>{children}</AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}
