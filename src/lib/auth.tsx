import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
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
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    // Auth state listener first (synchronous, never async inside)
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (!active) return;
      setSession(s);
      if (s?.user) {
        // Defer DB call to avoid deadlocks
        setTimeout(() => loadRoles(s.user.id), 0);
      } else {
        setRoles([]);
      }
      if (event === "SIGNED_OUT") setRoles([]);
    });

    // Then hydrate the initial session
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session?.user) {
        loadRoles(data.session.user.id).finally(() => active && setLoading(false));
      } else {
        setLoading(false);
      }
    });

    async function loadRoles(userId: string) {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      if (!active) return;
      setRoles((data ?? []).map((r) => r.role as AppRole));
    }

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const isFarmer = roles.includes("farmer");
  const isLender = roles.some((r) =>
    ["loan_officer", "credit_manager", "institution_admin", "system_admin"].includes(r),
  );

  const signOut = async () => {
    await supabase.auth.signOut();
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
