"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Sparkles,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronRight,
} from "lucide-react";
import AppLogo, { ProjectLogoIcon } from "@/components/AppLogo";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { subjectService } from "@/lib/services/subjectService";
import { GlobalChatWidget } from "@/components/ai/GlobalChatWidget";
import { Folder } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/subjects", label: "Subjects", icon: BookOpen },
  { href: "/dashboard/workspace", label: "AI Workspace", icon: Sparkles },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

// ── Reusable Avatar component ──
function UserAvatar({
  user,
  size = "sm",
  className = "",
}: {
  user: { fullName?: string; profilePicture?: string | null } | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-16 h-16 text-xl",
  };
  const initial = user?.fullName?.[0]?.toUpperCase() || "A";
  const picUrl = user?.profilePicture
    ? user.profilePicture.startsWith("http")
      ? user.profilePicture
      : `${API_URL}/uploads/${user.profilePicture}`
    : null;

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold ring-2 ring-blue-500/20 shadow-sm overflow-hidden ${className}`}
    >
      {picUrl ? (
        <img
          src={picUrl}
          alt="Avatar"
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to initials on image load error
            (e.target as HTMLImageElement).style.display = "none";
            (e.target as HTMLImageElement).parentElement!.setAttribute("data-fallback", "true");
          }}
        />
      ) : (
        initial
      )}
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [subjectNameMap, setSubjectNameMap] = useState<Record<string, string>>({});
  const [sidebarSubjects, setSidebarSubjects] = useState<any[]>([]);
  const fetchedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      subjectService
        .getAll()
        .then((data) => {
          if (Array.isArray(data)) {
            setSidebarSubjects(data);
            const map: Record<string, string> = {};
            data.forEach((s) => {
              if (s.id && s.name) map[s.id] = s.name;
            });
            setSubjectNameMap((prev) => ({ ...map, ...prev }));
          }
        })
        .catch(() => {});
    }
  }, [user, pathname]);

  // ── Profile dropdown state ──
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  // Resolve subject name from API for breadcrumb when on /dashboard/subjects/[id]
  useEffect(() => {
    const match = pathname.match(/^\/dashboard\/subjects\/([a-f0-9]{24})$/);
    if (!match) return;
    const subjectId = match[1];
    if (fetchedIds.current.has(subjectId)) return;
    fetchedIds.current.add(subjectId);
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) return;
    fetch(`${API_URL}/subjects/${subjectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.name) {
          setSubjectNameMap((prev) => ({ ...prev, [subjectId]: data.name }));
        }
      })
      .catch(() => { });
  }, [pathname]);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    router.push("/login");
  };

  // While checking auth state or redirecting
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center animate-bounce shadow-md shadow-blue-500/20">
            <ProjectLogoIcon size={26} variant="white" />
          </div>
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading StudyAI Workspace…</p>
        </div>
      </div>
    );
  }

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  // Dynamic breadcrumb labels — resolves MongoDB subject IDs to readable names
  const getBreadcrumbs = () => {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length <= 1) return [{ label: "Dashboard", href: "/dashboard" }];
    return parts.map((part, i) => {
      const href = "/" + parts.slice(0, i + 1).join("/");
      // If this segment looks like a MongoDB ObjectId, resolve to subject name
      const isObjectId = /^[a-f0-9]{24}$/.test(part);
      const label = isObjectId
        ? (subjectNameMap[part] || "Subject")
        : part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " ");
      return { label, href };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  const SidebarContent = (
    <div className="flex flex-col h-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
      {/* Brand Header */}
      <div className="px-5 py-5 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
        <AppLogo linkTo="/dashboard" />
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        <div>
          <p className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
            Workspace
          </p>
          <div className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${active
                    ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold shadow-sm border-l-4 border-blue-600 dark:border-blue-400"
                    : "text-gray-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
                    }`}
                >
                  <Icon size={18} className={active ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"} />
                  <span>{item.label}</span>
                  {active && <ChevronRight size={14} className="ml-auto text-blue-500 dark:text-blue-400" />}
                </Link>
              );
            })}
          </div>
        </div>

        {sidebarSubjects.length > 0 && (
          <div>
            <p className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
              My Subjects
            </p>
            <div className="space-y-1">
              {sidebarSubjects.map((sub) => {
                const subHref = `/dashboard/subjects/${sub.id}`;
                const active = pathname === subHref;
                return (
                  <Link
                    key={sub.id}
                    href={subHref}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                      active
                        ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold shadow-xs border-l-4 border-blue-600 dark:border-blue-400"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
                    }`}
                  >
                    <Folder
                      size={15}
                      className={
                        active
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-slate-400 dark:text-slate-500"
                      }
                    />
                    <span className="truncate">{sub.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/40">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-sm">
          <UserAvatar user={user} size="sm" className="rounded-lg" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-gray-900 dark:text-slate-100 truncate">{user?.fullName || "Alex Johnson"}</p>
            <p className="text-[11px] text-gray-400 dark:text-slate-400 truncate">{user?.email || "alex@example.com"}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex text-foreground">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 border-r border-slate-200/80 dark:border-slate-800/80 flex-col fixed inset-y-0 left-0 z-30">
        {SidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
            >
              <X size={20} />
            </button>
            {SidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-20 glass-panel border-b border-slate-200/60 dark:border-slate-800/60 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100"
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumbs Navigation */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              {breadcrumbs.map((bc, idx) => (
                <div key={bc.href} className="flex items-center gap-1.5">
                  {idx > 0 && <ChevronRight size={12} className="text-slate-300 dark:text-slate-600" />}
                  <Link
                    href={bc.href}
                    className={`transition-colors hover:text-blue-600 dark:hover:text-blue-400 ${idx === breadcrumbs.length - 1 ? "font-bold text-slate-900 dark:text-slate-100" : ""
                      }`}
                  >
                    {bc.label}
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1" />

          {/* Right Header Actions — Profile Avatar with Dropdown */}
          <div className="flex items-center gap-2">
            <div ref={dropdownRef} className="relative">
              {/* Clickable Avatar */}
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="cursor-pointer hover:scale-105 transition-transform focus:outline-none"
                aria-label="Open profile menu"
              >
                <UserAvatar user={user} size="sm" />
              </button>

              {/* Dropdown Popup */}
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-150 z-50">
                  {/* User info section */}
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <UserAvatar user={user} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                        {user?.fullName || "User"}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                        {user?.email || ""}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 space-y-1">
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Settings size={16} className="text-slate-400" />
                      <span>Profile Settings</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <LogOut size={16} />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Floating General AI Chatbot Widget */}
      <GlobalChatWidget />
    </div>
  );
}
