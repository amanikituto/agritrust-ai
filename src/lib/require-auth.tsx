import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function RequireAuth({
  role,
  children,
}: {
  role?: "farmer" | "lender";
  children: React.ReactNode;
}) {
  const { loading, user, isFarmer, isLender } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" search={{ role }} />;
  if (role === "lender" && !isLender && isFarmer) return <Navigate to="/farmer" />;
  if (role === "farmer" && !isFarmer && isLender) return <Navigate to="/lender" />;
  return <>{children}</>;
}

// re-export to keep one import path tidy
export { createFileRoute };
