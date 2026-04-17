"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { logout } from "@/actions/auth/logout";
import { useLanguage } from "@/lib/i18n/LanguageContext";

import { hasPermission } from "@/lib/auth/permissions";

const navLinks = [
  { href: "/dashboard", key: "nav.dashboard" },
  { href: "/dashboard/map", key: "nav.map" },
  { href: "/dashboard/products", key: "nav.products" },
  { href: "/dashboard/locations", key: "nav.locations" },
  { href: "/dashboard/scanner", key: "nav.transactions" },
  { href: "/dashboard/movements", key: "nav.auditLog" },
  { href: "/dashboard/reports", key: "nav.reports", perm: "report:view" },
  { href: "/dashboard/users", key: "nav.users", roles: ["ADMIN", "DIRECTOR", "DEPUTY_DIRECTOR", "WAREHOUSE_MANAGER", "CHIEF_ACCOUNTANT", "DEPUTY_ACCOUNTANT"] },
];

export function Sidebar({ session }: { session?: any }) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const { t, language, toggleLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  function handleLogout() {
    startTransition(async () => {
      await logout();
    });
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
      {/* Brand */}
      <div className="flex h-14 items-center border-b border-gray-200 px-4">
        <span className="text-base font-bold tracking-tight text-blue-600">
          {t("sidebar.brand")}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-3">
        {navLinks.map((link) => {
          if (link.perm && !hasPermission(session, link.perm)) return null;
          if (link.roles && !link.roles.includes(session?.role)) return null;

          const active =
            link.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={[
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white",
              ].join(" ")}
            >
              {t(link.key)}
            </Link>
          );
        })}
      </nav>

      {/* Footer Controls */}
      <div className="border-t border-gray-200 dark:border-slate-800 px-2 py-3 flex flex-col gap-1">
        
        {/* Profile Link */}
        <Link
          href="/dashboard/profile"
          className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white"
        >
          <span>👤 {t("sidebar.profile") || "My Profile"}</span>
        </Link>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white"
        >
          <span>{theme === "dark" ? "🌙 Dark Mode" : "☀️ Light Mode"}</span>
        </button>

        {/* Language Toggle */}
        <button
          onClick={toggleLanguage}
          className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white"
        >
          <span>🌐 {t("sidebar.language")}</span>
          <span className="text-xs font-semibold rounded bg-gray-200 dark:bg-slate-700 px-1.5 py-0.5 text-gray-700 dark:text-gray-300">
            {language === "en" ? "EN" : "VI"}
          </span>
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={isPending}
          className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-400 disabled:opacity-50 mt-1 flex items-center gap-2"
        >
          <span>🚪 {isPending ? t("sidebar.loggingOut") : t("sidebar.logout")}</span>
        </button>
      </div>
    </aside>
  );
}
