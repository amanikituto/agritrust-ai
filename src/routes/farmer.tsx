import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RequireAuth } from "@/lib/require-auth";
import { DashShell } from "@/components/dashboard/DashShell";
import { FARMER_NAV } from "@/lib/dashboard-nav";

export const Route = createFileRoute("/farmer")({
  head: () => ({ meta: [{ title: "Farmer Dashboard · AgriTrust AI" }] }),
  component: () => (
    <RequireAuth role="farmer">
      <DashShell portal="Farmer" nav={FARMER_NAV}>
        <Outlet />
      </DashShell>
    </RequireAuth>
  ),
});
