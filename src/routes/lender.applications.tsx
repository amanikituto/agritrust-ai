import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/lender/applications")({
  component: () => <Outlet />,
});
