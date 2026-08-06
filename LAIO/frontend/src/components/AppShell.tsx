"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  Gamepad2,
  GraduationCap,
  Home,
  LogOut,
  Menu,
  Settings,
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
  { label: "Games", href: "/games", icon: Gamepad2 },
  { label: "Settings", href: "/debug", icon: Settings },
];

interface SidebarContentProps {
  pathname: string;
  userEmail?: string | null;
  onNavigate: () => void;
  onLogout: () => void;
}

const SidebarContent = memo(function SidebarContent({
  pathname,
  userEmail,
  onNavigate,
  onLogout,
}: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-lg font-black text-white shadow-lg shadow-indigo-600/25">
          L
        </div>
        <div>
          <p className="text-lg font-black tracking-tight text-slate-950">LAIO</p>
          <p className="text-xs font-medium text-slate-400">Study OS</p>
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
                  ? "bg-indigo-50 text-indigo-700 shadow-sm"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <div className="mb-3 rounded-2xl bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Signed in</p>
          <p className="mt-1 truncate text-sm font-semibold text-slate-700">
            {userEmail || "LAIO learner"}
          </p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-[0.99]"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Đăng xuất
        </button>
      </div>
    </div>
  );
});

export default function AppShell({ children, title = "LAIO", userEmail }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

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
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    router.replace("/");
  };

  return (
    <div className="min-h-[100dvh] bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.1),_transparent_34%),linear-gradient(180deg,#f8fafc,#eef2ff)] text-slate-950">
      <aside className="fixed left-0 top-0 z-30 hidden h-[100dvh] w-72 border-r border-slate-200/80 bg-white lg:block">
        <SidebarContent
          pathname={pathname}
          userEmail={userEmail}
          onNavigate={() => undefined}
          onLogout={() => void handleLogout()}
        />
      </aside>

      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-700 shadow-sm active:scale-[0.98]"
            aria-label="Open navigation"
            aria-expanded={mobileOpen}
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <p className="max-w-[60vw] truncate text-sm font-black text-slate-950">{title}</p>
          <div className="h-10 w-10" aria-hidden="true" />
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/40"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation backdrop"
          />
          <aside className="absolute left-0 top-0 h-full w-80 max-w-[86vw] border-r border-slate-200 bg-white shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-4 top-4 rounded-xl bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
            <SidebarContent
              pathname={pathname}
              userEmail={userEmail}
              onNavigate={() => setMobileOpen(false)}
              onLogout={() => void handleLogout()}
            />
          </aside>
        </div>
      )}

      <main className="lg:pl-72">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
