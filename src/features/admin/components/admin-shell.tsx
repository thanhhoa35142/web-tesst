"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import {
  CalendarClock,
  ChevronDown,
  Flag,
  LayoutDashboard,
  ListChecks,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  SlidersHorizontal,
  ZoomIn,
} from "lucide-react";
import { clearToken } from "../api";
import { usePersistentState } from "../use-persistent-state";
import { cn } from "cn";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/jobs", label: "Jobs", icon: ListChecks },
  { href: "/reports", label: "Reports", icon: Flag },
  { href: "/scoring", label: "Scoring", icon: SlidersHorizontal },
  { href: "/events", label: "Events", icon: CalendarClock },
];

const COLLAPSED_KEY = "ph-sidebar-collapsed";
// UI scale via root font-size — every rem-based size (Tailwind spacing,
// typography, icons) scales proportionally. Light-only product, so
// "appearance" controls density instead of theme.
const SCALES = ["16px", "14px", "18px"] as const;
const SCALE_KEY = "ph-ui-scale";

function applyScale(px: string) {
  document.documentElement.style.fontSize = px;
}

function scalePercent(px: string): number {
  return Math.round((parseInt(px, 10) / 16) * 100);
}

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = usePersistentState(
    COLLAPSED_KEY,
    false,
    (raw) => raw === "1",
    String,
  );
  const [scaleIdx, setScaleIdx] = usePersistentState(
    SCALE_KEY,
    0,
    (raw) => {
      const i = SCALES.indexOf(raw as (typeof SCALES)[number]);
      return i >= 0 ? i : 0;
    },
    (i) => SCALES[i],
  );

  // Apply the persisted UI scale to the root element (rem-based sizing).
  useEffect(() => {
    applyScale(SCALES[scaleIdx]);
  }, [scaleIdx]);

  const toggleCollapsed = () => setCollapsed((c) => !c);
  const cycleScale = () => setScaleIdx((i) => (i + 1) % SCALES.length);

  return (
    <div className="flex min-h-screen">
      <aside
        className={cn(
          "flex shrink-0 flex-col border-r border-sidebar-border bg-sidebar",
          "transition-[width] duration-200 ease-in-out motion-reduce:transition-none",
          collapsed ? "w-[4.5rem]" : "w-56",
        )}
      >
        <div
          className={cn(
            "flex items-center border-b border-sidebar-border px-3 py-4",
            collapsed ? "justify-center" : "justify-between",
          )}
        >
          {!collapsed && (
            <span className="truncate text-sm font-semibold tracking-tight">
              Pickhour Admin
            </span>
          )}
          <button
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand" : "Collapse"}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                title={collapsed ? label : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                  collapsed && "justify-center px-0",
                  active
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                {!collapsed && <span className="truncate">{label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-sidebar-border p-3">
          <button
            onClick={cycleScale}
            aria-label={`UI scale ${scalePercent(SCALES[scaleIdx])}%`}
            title={`UI scale: ${scalePercent(SCALES[scaleIdx])}%`}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
              collapsed && "justify-center px-0",
            )}
          >
            <ZoomIn className="size-4 shrink-0" />
            {!collapsed && <span>{scalePercent(SCALES[scaleIdx])}%</span>}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground outline-none",
                collapsed && "justify-center px-0",
              )}
            >
              <Avatar className="size-6">
                <AvatarFallback className="text-[10px]">A</AvatarFallback>
              </Avatar>
              {!collapsed && (
                <>
                  <span className="flex-1 truncate text-left">Admin</span>
                  <ChevronDown className="size-3.5 text-muted-foreground/60" />
                </>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" className="w-48">
              <DropdownMenuLabel>
                <div className="text-sm font-medium">Admin</div>
                <div className="text-xs font-normal text-muted-foreground">
                  admin@pickhour
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  clearToken();
                  router.push("/login");
                }}
              >
                <LogOut className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
      <main className="min-w-0 flex-1 bg-background">{children}</main>
    </div>
  );
}
