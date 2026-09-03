"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  RefreshCcw,
  AlertTriangle,
  FileClock,
  BarChart3,
  Settings,
  ShieldCheck,
} from "lucide-react";

const navItems = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    href: "/",
  },
  {
    name: "Recovery Queue",
    icon: RefreshCcw,
    href: "/recovery-queue",
  },
  {
    name: "Escalations",
    icon: AlertTriangle,
    href: "/escalations",
  },
  {
    name: "Audit Trail",
    icon: FileClock,
    href: "/audit-trail",
  },
  {
    name: "Evaluations",
    icon: BarChart3,
    href: "/evaluations",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col border-r border-white/10 bg-[#080b12] px-4 py-6">
      <div className="mb-10 px-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
          </div>

          <div>
            <h1 className="text-lg font-semibold text-white">
              RecoveryOS
            </h1>

            <p className="text-xs text-zinc-500">
              AI Revenue Recovery
            </p>
          </div>
        </div>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;

          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
                active
                  ? "bg-white/10 text-white"
                  : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-zinc-500 hover:bg-white/5">
          <Settings className="h-4 w-4" />
          Settings
        </button>

        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400" />

            <span className="text-xs font-medium text-emerald-400">
              Recovery Engine Online
            </span>
          </div>

          <p className="text-xs leading-5 text-zinc-600">
            Bounded recovery agent operating within policy constraints.
          </p>
        </div>
      </div>
    </aside>
  );
}