"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { cn, Button } from "@/components/ui/ui";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: "▦" },
  { href: "/dashboard/social", label: "Social Analytics", icon: "📣" },
  { href: "/dashboard/product", label: "Product Usage", icon: "📈" },
  { href: "/dashboard/connections", label: "Connections", icon: "🔗" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-white/10 bg-black/20 px-4 py-6">
      <div className="px-2">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-violet-600 text-sm font-bold text-white">
            cX
          </span>
          <span className="text-lg font-semibold tracking-tight text-zinc-50">
            ConteX
          </span>
        </Link>
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {NAV.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-violet-600/15 text-violet-200"
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200",
              )}
            >
              <span className="text-base" aria-hidden>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 border-t border-white/10 pt-4">
        <div className="px-2">
          <p className="truncate text-sm font-medium text-zinc-200">
            {user?.organization?.name ?? "Your organization"}
          </p>
          <p className="truncate text-xs text-zinc-500">{user?.email}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-3 w-full justify-start"
          onClick={() => logout()}
        >
          Sign out
        </Button>
      </div>
    </aside>
  );
}
