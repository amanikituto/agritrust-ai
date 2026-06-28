import { Link } from "@tanstack/react-router";
import { Sprout, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function SiteHeader({ variant = "public" }: { variant?: "public" | "app" }) {
  const { user, isLender, signOut } = useAuth();
  return (
    <header className="border-b border-border bg-white">
      <div className="container-page flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-leaf text-white">
            <Sprout className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-base font-bold text-leaf">AgriTrust AI</div>
            <div className="text-[10px] uppercase tracking-wider text-charcoal/60">Kenya</div>
          </div>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {variant === "public" ? (
            <>
              <Link to="/farmer-intake" className="btn-ghost">Register Farmer</Link>
              <Link to="/lender" className="btn-ghost">Loan Officer</Link>
              <Link to="/ussd" className="btn-ghost">USSD Demo</Link>
              <Link to="/auth" className="btn-primary ml-2">Sign in</Link>
            </>
          ) : (
            <>
              <Link to="/lender" className="btn-ghost">Dashboard</Link>
              <Link to="/farmer-intake" className="btn-ghost">Register Farmer</Link>
              <Link to="/ussd" className="btn-ghost">USSD</Link>
              {user && isLender && (
                <button onClick={() => void signOut()} className="btn-ghost text-danger">
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
