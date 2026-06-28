import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyRecentUssdSessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("phone")
      .eq("id", context.userId)
      .maybeSingle();

    const phone = profile?.phone;
    if (!phone) return { phone: null, sessions: [] as Array<{ id: string; created_at: string; last_input: string; menu: string }> };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("ussd_sessions")
      .select("session_id, created_at, step, payload, phone")
      .eq("phone", phone)
      .order("created_at", { ascending: false })
      .limit(5);
    if (error) throw error;

    const sessions = (data ?? []).map((row) => {
      const text = ((row.payload as { text?: string } | null)?.text ?? "") as string;
      const last_input = text ? text.split("*").pop() ?? "" : "(menu)";
      const menu = menuLabel(text);
      return {
        id: row.session_id as string,
        created_at: row.created_at as string,
        last_input,
        menu,
      };
    });
    return { phone, sessions };
  });

function menuLabel(text: string): string {
  if (!text) return "Root menu";
  const first = text.split("*")[0];
  switch (first) {
    case "1":
      return "Apply for loan";
    case "2":
      return "Check trust score";
    case "3":
      return "Loan status";
    case "4":
      return "Update records";
    case "5":
      return "Climate alerts";
    case "6":
      return "Exit";
    default:
      return `Menu ${first}`;
  }
}
