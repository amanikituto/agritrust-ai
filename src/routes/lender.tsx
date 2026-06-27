import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RequireAuth } from "@/lib/require-auth";
import { DashShell } from "@/components/dashboard/DashShell";
import { LENDER_NAV } from "@/lib/dashboard-nav";

export const Route = createFileRoute("/lender")({
  head: () => ({ meta: [{ title: "Lender Dashboard · AgriTrust AI" }] }),
  component: () => (
    <RequireAuth role="lender">
      <DashShell portal="Lender" nav={LENDER_NAV}>
        <Outlet />
      </DashShell>
    </RequireAuth>
  ),
});
