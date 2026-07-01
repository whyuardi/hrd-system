"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
/* ── Inline SVG Icons (no library) ── */

const IconDashboard = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const IconKaryawan = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconDepartemen = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18" />
    <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
    <path d="M9 7h2" />
    <path d="M9 11h2" />
    <path d="M9 15h2" />
    <path d="M13 7h2" />
    <path d="M13 11h2" />
    <path d="M13 15h2" />
  </svg>
);

const IconJabatan = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
  </svg>
);

const IconAbsensi = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconCuti = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IconPayroll = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const IconLaporan = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const IconChevronLeft = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const IconMenu = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const IconX = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/* ── Menu Definition ── */

interface MenuItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const menuItems: MenuItem[] = [
  { label: "Dashboard",   href: "/dashboard",   icon: IconDashboard },
  { label: "Karyawan",    href: "/karyawan",    icon: IconKaryawan,    roles: ["admin", "hrd"] },
  { label: "Departemen",  href: "/departemen",  icon: IconDepartemen,  roles: ["admin", "hrd"] },
  { label: "Jabatan",     href: "/jabatan",     icon: IconJabatan,     roles: ["admin", "hrd"] },
  { label: "Absensi",     href: "/absensi",     icon: IconAbsensi },
  { label: "Cuti",        href: "/cuti",        icon: IconCuti },
  { label: "Payroll",     href: "/payroll",     icon: IconPayroll,     roles: ["admin", "hrd", "manajer"] },
  { label: "Laporan",     href: "/laporan",     icon: IconLaporan,     roles: ["admin", "hrd", "manajer"] },
];

/* ── Props ── */

interface DashboardShellProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
  children: React.ReactNode;
}

/* ── Component ── */

export function DashboardShell({ user, children }: DashboardShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Prevent body scroll when sidebar overlay is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  // Close sidebar on Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setSidebarOpen(false);
  }, []);
  useEffect(() => {
    if (sidebarOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [sidebarOpen, handleKeyDown]);

  const userRole = user?.role?.toLowerCase() ?? "";

  const filteredItems = menuItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  });

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === href;
    return pathname.startsWith(href);
  };

  const userInitial = user?.name?.charAt(0)?.toUpperCase() ?? "U";

  return (
    <div className="flex h-screen overflow-hidden bg-[#09090b] text-[#e4e4e7]">
      {/* ── Mobile overlay backdrop ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-[#1e1e1e] bg-[#0c0c0e] transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo / Brand */}
        <div className="flex h-16 items-center gap-3 border-b border-[#1e1e1e] px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white shadow-sm">
            H
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-[#e4e4e7] tracking-tight">HRD System</span>
            <span className="text-[10px] font-medium text-[#71717a] tracking-wider uppercase">Manajemen</span>
          </div>
          {/* Close button (mobile only) */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-[#71717a] hover:bg-[#1e1e1e] hover:text-[#e4e4e7] md:hidden"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
          <ul className="space-y-1">
            {filteredItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150
                      ${
                        active
                          ? "bg-[#1e1e1e] text-[#e4e4e7] shadow-sm"
                          : "text-[#71717a] hover:bg-[#141416] hover:text-[#a1a1aa]"
                      }
                    `}
                  >
                    {/* Active indicator bar */}
                    {active && (
                      <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-indigo-500" />
                    )}
                    <Icon
                      className={`h-5 w-5 shrink-0 transition-colors ${
                        active ? "text-indigo-400" : "text-[#71717a] group-hover:text-[#a1a1aa]"
                      }`}
                    />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar footer */}
        <div className="border-t border-[#1e1e1e] px-3 py-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs text-[#52525b]">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Sistem v1.0</span>
          </div>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* ── Top Navbar ── */}
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-[#1e1e1e] bg-[#0c0c0e] px-4 md:px-6">
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#71717a] hover:bg-[#1e1e1e] hover:text-[#e4e4e7] md:hidden"
          >
            <IconMenu className="h-5 w-5" />
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* User section */}
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight text-[#e4e4e7]">
                {user?.name ?? "User"}
              </p>
              <p className="text-[11px] font-medium uppercase tracking-wider text-[#71717a]">
                {user?.role ?? ""}
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white shadow-sm">
              {userInitial}
            </div>
          </div>
        </header>

        {/* ── Page Content ── */}
        <main className="flex-1 overflow-auto bg-[#09090b]">
          {children}
        </main>
      </div>
    </div>
  );
}
