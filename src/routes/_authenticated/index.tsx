import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/")({
  component: AuthedHome,
});

function AuthedHome() {
  const { loading, isLender, isFarmer } = useAuth();
  if (loading) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }
  if (isLender) return <Navigate to="/lender" />;
  // Default for farmers and unknown
  return <Navigate to="/farmer" />;
  // Suppress unused warning
  void isFarmer;
}
