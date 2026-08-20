"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  BookOpen,
  GraduationCap,
  Home,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { memo, useEffect, useState } from "react";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  userEmail?: string | null;
}

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Notebooks", href: "/notebooks", icon: BookOpen },
  { label: "Review", href: "/review", icon: GraduationCap },
];

interface SidebarContentProps {
  pathname: string;
  userEmail?: string | null;
  onNavigate: () => void;
  onLogout: () => void;
  loggingOut: boolean;
  logoutError: string | null;
}

const SidebarContent = memo(function SidebarContent({
  pathname,
  userEmail,
  onNavigate,
  onLogout,
  loggingOut,
  logoutError,
}: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-brand-cream text-lg font-black text-brand-forest">
          L
        </div>
        <div>
          <p className="landing-display text-lg font-black tracking-tight text-brand-forest">LAIO</p>
          <p className="text-xs font-medium text-brand-faint">Study OS</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3" aria-label="Main navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/notebooks"
              ? pathname === "/notebooks" || pathname.startsWith("/notebooks/")
              : pathname === item.href;

          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition-colors active:scale-[0.99] ${
                isActive
                  ? "bg-brand-sand text-brand-forest shadow-sm"
                  : "text-brand-subtle hover:bg-brand-sand hover:text-brand-forest"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-brand-forest/15 p-4">
        <div className="mb-3 rounded-2xl bg-brand-sand p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-faint">Signed in</p>
          <p className="mt-1 truncate text-sm font-semibold text-brand-forest">
            {userEmail || "LAIO learner"}
          </p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          disabled={loggingOut}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-brand-forest/20 bg-white px-4 py-3 text-sm font-semibold text-brand-subtle transition-colors hover:border-brand-accent-soft hover:bg-brand-error-bg hover:text-brand-accent-deep active:scale-[0.99]"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
        </button>
        {logoutError && (
          <p className="mt-2 text-xs font-semibold text-brand-accent-dark" role="alert">
            {logoutError}
          </p>
        )}
      </div>
    </div>
  );
});

export default function AppShell({ children, title = "LAIO", userEmail }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setLogoutError(null);
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.signOut({ scope: "local" });
        if (error) throw error;
      }
      router.replace("/");
      router.refresh();
    } catch (error) {
      setLogoutError(
        error instanceof Error ? error.message : "Không thể đăng xuất. Vui lòng thử lại.",
      );
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-brand-paper text-brand-ink">
      <aside className="fixed left-0 top-0 z-30 hidden h-[100dvh] w-72 border-r border-[#173f3420] bg-white lg:block">
        <SidebarContent
          pathname={pathname}
          userEmail={userEmail}
          onNavigate={() => undefined}
          onLogout={() => void handleLogout()}
          loggingOut={loggingOut}
          logoutError={logoutError}
        />
      </aside>

      <header className="sticky top-0 z-20 border-b border-[#173f3420] bg-brand-paper/95 px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-2xl border border-[#173f3430] bg-white p-2 text-brand-forest shadow-sm active:scale-[0.98]"
            aria-label="Open navigation"
            aria-expanded={mobileOpen}
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <p className="landing-display max-w-[60vw] truncate text-sm font-black text-brand-forest">{title}</p>
          <div className="h-10 w-10" aria-hidden="true" />
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
            <motion.button
              type="button"
              className="absolute inset-0 bg-[#0d2b24]/60"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            />
            <motion.aside
              className="absolute left-0 top-0 h-full w-80 max-w-[86vw] border-r border-[#173f3420] bg-white shadow-sm"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            >
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="absolute right-4 top-4 rounded-xl border-2 border-transparent p-2 text-brand-subtle transition-colors hover:border-brand-forest hover:bg-brand-sand hover:text-brand-forest"
                aria-label="Close navigation"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
              <SidebarContent
                pathname={pathname}
                userEmail={userEmail}
                onNavigate={() => setMobileOpen(false)}
                onLogout={() => void handleLogout()}
                loggingOut={loggingOut}
                logoutError={logoutError}
              />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <main className="lg:pl-72">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
