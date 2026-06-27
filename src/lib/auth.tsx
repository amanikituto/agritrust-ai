import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole =
  | "farmer"
  | "loan_officer"
  | "credit_manager"
  | "institution_admin"
  | "system_admin";

type AuthState = {
  session: Session | null;
  user: User | null;
  roles: AppRole[];
  loading: boolean;
  isFarmer: boolean;
  isLender: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const activeRef = useRef(true);

  const loadRoles = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (!activeRef.current) return;
    setRoles((data ?? []).map((r) => r.role as AppRole));
  }, []);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      await loadRoles(data.user.id);
    } else {
      setRoles([]);
    }
  }, [loadRoles]);

  useEffect(() => {
    activeRef.current = true;

    async function syncSession(s: Session | null) {
      if (!activeRef.current) return;
      setSession(s);
      if (!s?.user) {
        setRoles([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        await loadRoles(s.user.id);
      } finally {
        if (activeRef.current) setLoading(false);
      }
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (!activeRef.current) return;
      if (event === "SIGNED_OUT") setRoles([]);
      setTimeout(() => void syncSession(s), 0);
    });

    supabase.auth.getSession().then(({ data }) => {
      void syncSession(data.session);
    });

    return () => {
      activeRef.current = false;
      sub.subscription.unsubscribe();
    };
  }, [loadRoles]);

  const isFarmer = roles.includes("farmer");
  const isLender = roles.some((r) =>
    ["loan_officer", "credit_manager", "institution_admin", "system_admin"].includes(r),
  );

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setSession(null);
    setRoles([]);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        roles,
        loading,
        isFarmer,
        isLender,
        signOut,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
