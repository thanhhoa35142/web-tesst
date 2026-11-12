"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AppWindow,
  CalendarClock,
  ChevronDown,
  Flag,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  LogOut,
  PanelLeft,
  PictureInPicture,
  SlidersHorizontal,
  ZoomIn,
} from "lucide-react";
import type { ReactNode } from "react";
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
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/jobs", label: "Jobs", icon: ListChecks },
  { href: "/reports", label: "Reports", icon: Flag },
  { href: "/scoring", label: "Scoring", icon: SlidersHorizontal },
  { href: "/events", label: "Events", icon: CalendarClock },
  { href: "/api-keys", label: "API Keys", icon: KeyRound },
];

// Sidebar layout variants — persisted so the choice survives reloads.
const VARIANTS = [
  { value: "sidebar", label: "Sidebar", icon: PanelLeft },
  { value: "floating", label: "Floating", icon: PictureInPicture },
  { value: "inset", label: "Inset", icon: AppWindow },
] as const;
type Variant = (typeof VARIANTS)[number]["value"];
const VARIANT_KEY = "ph-sidebar-variant";

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

function parseVariant(raw: string | null): Variant {
  return VARIANTS.some((v) => v.value === raw) ? (raw as Variant) : "inset";
}

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [variant, setVariant] = usePersistentState<Variant>(
    VARIANT_KEY,
    "inset",
    parseVariant,
    (v) => v,
  );
  const [scaleIdx, setScaleIdx] = usePersistentState(
    SCALE_KEY,
    0,
    (raw) => {
      const i = parseInt(raw ?? "", 10);
      return Number.isInteger(i) && i >= 0 && i < SCALES.length ? i : 0;
    },
    (i) => String(i),
  );

  const currentVariant = VARIANTS.find((v) => v.value === variant) ?? VARIANTS[2];
  const VariantIcon = currentVariant.icon;

  function cycleVariant() {
    const idx = VARIANTS.findIndex((v) => v.value === variant);
    setVariant(VARIANTS[(idx + 1) % VARIANTS.length].value);
  }

  function cycleScale() {
    const next = (scaleIdx + 1) % SCALES.length;
    setScaleIdx(next);
    applyScale(SCALES[next]);
  }

  function signOut() {
    clearToken();
    router.push("/login");
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar variant={variant} collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-foreground font-bold text-background">
              P
            </div>
            <span className="truncate font-semibold group-data-[collapsible=icon]:hidden">
              Pickhour Admin
            </span>
            <SidebarTrigger className="ml-auto group-data-[collapsible=icon]:hidden" />
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV.map(({ href, label, icon: Icon }) => {
                  const active = pathname.startsWith(href);
                  return (
                    <SidebarMenuItem key={href}>
                      <SidebarMenuButton
                        render={<Link href={href} />}
                        isActive={active}
                        tooltip={label}
                      >
                        <Icon />
                        <span>{label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <div className="flex items-center gap-1 px-1 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={cycleVariant}
                    aria-label={`Layout: ${currentVariant.label}`}
                  />
                }
              >
                <VariantIcon className="size-4" />
              </TooltipTrigger>
              <TooltipContent side="right">
                Layout: {currentVariant.label}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={cycleScale}
                    aria-label={`UI scale ${scalePercent(SCALES[scaleIdx])}%`}
                  />
                }
              >
                <ZoomIn className="size-4" />
                <span className="text-[10px] font-medium group-data-[collapsible=icon]:hidden">
                  {scalePercent(SCALES[scaleIdx])}%
                </span>
              </TooltipTrigger>
              <TooltipContent side="right">
                UI scale {scalePercent(SCALES[scaleIdx])}%
              </TooltipContent>
            </Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 gap-2 px-2 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0",
                    )}
                    aria-label="Account menu"
                  />
                }
              >
                <Avatar className="size-6">
                  <AvatarFallback className="bg-foreground text-[10px] font-semibold text-background">
                    A
                  </AvatarFallback>
                </Avatar>
                <span className="truncate text-xs group-data-[collapsible=icon]:hidden">
                  Admin
                </span>
                <ChevronDown className="size-3 opacity-60 group-data-[collapsible=icon]:hidden" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="right" className="w-48">
                <DropdownMenuLabel>
                  <div className="text-sm font-medium">Admin</div>
                  <div className="text-xs font-normal text-muted-foreground">
                    admin@pickhour
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="size-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
