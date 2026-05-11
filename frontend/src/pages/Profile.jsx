import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Package, User } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import SectionContainer from "../components/SectionContainer";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/login" });
    }
  }, [user, authLoading, navigate]);

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  if (authLoading || !user) return null;

  return (
    <div className="pt-20 lg:pt-28 min-h-screen bg-background pb-16">
      <SectionContainer>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <User className="text-primary w-8 h-8" />
            <h1 className="font-display text-3xl font-semibold text-foreground">
              My Profile
            </h1>
          </div>

          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-card p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-8 items-start md:items-center border-b border-border pb-8 mb-8">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary shrink-0">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">{user.name}</h2>
                <p className="text-muted-foreground">{user.email}</p>
                {user.role === "admin" && (
                  <span className="inline-block mt-3 px-3 py-1 bg-primary/20 text-primary text-xs font-semibold rounded-full uppercase tracking-wider">
                    Administrator
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                to="/my-orders"
                className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/30 transition-smooth group"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Package size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">My Orders</h3>
                  <p className="text-xs text-muted-foreground">Track and review your purchases</p>
                </div>
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-red-500/30 hover:bg-red-500/5 transition-smooth group text-left"
              >
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                  <LogOut size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-red-600">Logout</h3>
                  <p className="text-xs text-muted-foreground">Sign out of your account</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </SectionContainer>
    </div>
  );
}
