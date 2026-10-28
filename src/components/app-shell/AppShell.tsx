import { useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { LogOut, type LucideIcon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { sectionPath, type SectionDef } from "@/lib/app-sections";
import BrandMark from "./BrandMark";

const GROUP_LABELS: Record<SectionDef["group"], string | null> = {
  main: null,
  manage: "Manage",
  grow: "Grow",
  account: "Settings",
};

type Props = {
  area: "dashboard" | "admin";
  caption: string;
  sections: SectionDef[];
  icons: Record<string, LucideIcon>;
  activeId: string;
  /** Small counts shown next to a section, e.g. pending bookings. */
  badges?: Record<string, number | undefined>;
  user: { name: string; email: string };
  onSignOut: () => void;
  /** Right side of the top bar (e.g. branch switcher). */
  headerRight?: ReactNode;
  children: ReactNode;
};

function NavGroups({ area, sections, icons, activeId, badges }: Pick<Props, "area" | "sections" | "icons" | "activeId" | "badges">) {
  const { setOpenMobile } = useSidebar();
  const groups = (Object.keys(GROUP_LABELS) as SectionDef["group"][])
    .map((g) => ({ group: g, items: sections.filter((s) => s.group === g) }))
    .filter((g) => g.items.length > 0);

  return (
    <>
      {groups.map(({ group, items }) => (
        <SidebarGroup key={group}>
          {GROUP_LABELS[group] && (
            <SidebarGroupLabel className="text-white/40">{GROUP_LABELS[group]}</SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((s) => {
                const Icon = icons[s.id];
                const active = s.id === activeId;
                const badge = badges?.[s.id];
                return (
                  <SidebarMenuItem key={s.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className="h-10 rounded-lg text-[0.9rem] data-[active=true]:bg-white/[0.08] data-[active=true]:font-semibold data-[active=true]:text-white hover:bg-white/[0.06] hover:text-white"
                    >
                      <Link
                        to={sectionPath(area, s.id)}
                        onClick={() => setOpenMobile(false)}
                        aria-current={active ? "page" : undefined}
                      >
                        {active && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-gold" aria-hidden="true" />}
                        {Icon && <Icon className={active ? "text-gold" : "text-white/55"} />}
                        <span>{s.label}</span>
                      </Link>
                    </SidebarMenuButton>
                    {badge ? (
                      <SidebarMenuBadge className="rounded-full bg-gold px-1.5 text-[11px] font-semibold text-black">
                        {badge}
                      </SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}

/** Layout of the logged-in areas: dark brand sidebar + light content (spec 004 AC6–AC8). */
const AppShell = ({ area, caption, sections, icons, activeId, badges, user, onSignOut, headerRight, children }: Props) => {
  const active = sections.find((s) => s.id === activeId);

  // Darker brand gold for primary buttons in the logged-in areas, including dialogs in portals.
  useEffect(() => {
    document.documentElement.classList.add("app-area");
    return () => document.documentElement.classList.remove("app-area");
  }, []);
  const initials = (user.name || user.email).trim().slice(0, 1).toUpperCase();

  return (
    <SidebarProvider>
      <Sidebar className="border-r-0">
        <SidebarHeader className="px-4 py-5">
          <BrandMark caption={caption} />
        </SidebarHeader>
        <SidebarContent className="px-1">
          <NavGroups area={area} sections={sections} icons={icons} activeId={activeId} badges={badges} />
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user.name || user.email}</p>
              <p className="truncate text-xs text-white/50">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              className="rounded-md p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="min-w-0 bg-background">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur md:px-8">
          <SidebarTrigger className="-ml-1 md:hidden" aria-label="Open menu" />
          <p className="truncate text-sm font-medium text-muted-foreground">
            <span className="hidden sm:inline">{caption} / </span>
            <span className="text-foreground">{active?.label}</span>
          </p>
          <div className="ml-auto flex items-center gap-2">{headerRight}</div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AppShell;
