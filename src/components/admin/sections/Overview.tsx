import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, CreditCard, DollarSign, RefreshCw, Store, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState, Panel, SectionSkeleton, StatCard, StatusBadge } from "@/components/app-shell/parts";
import { fetchAdminStats, type AdminStats } from "@/api/admin-api";
import { fetchAdminPlans, type AdminPlanDto } from "@/api/plans-api";
import { MONTH_NAMES, fmtLkr } from "@/lib/admin-format";

/** Admin overview: platform KPIs and trends (spec 004, restyled from the old Statistics tab). */

function Bar({ pct, className = "gradient-gold" }: { pct: number; className?: string }) {
  return (
    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
      <div className={`h-full rounded-full transition-all duration-500 ${className}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

const SystemStats = () => {
  const { data, isLoading, isError, refetch, isFetching } = useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: fetchAdminStats,
    staleTime: 30_000,
  });

  const { data: plans = [] } = useQuery<AdminPlanDto[]>({
    queryKey: ["admin-plans"],
    queryFn: fetchAdminPlans,
    staleTime: 60_000,
  });

  if (isLoading) return <SectionSkeleton />;
  if (isError || !data) {
    return (
      <Panel>
        <ErrorState message="Failed to load statistics." onRetry={() => refetch()} />
      </Panel>
    );
  }

  const { overview, bookingsByStatus, planDistribution, monthlyRevenue, monthlyBookings } = data;
  const count = (s: string) => bookingsByStatus.find((b) => b.status === s)?.count ?? 0;

  const planRows = planDistribution.map((p) => {
    const plan = plans.find((pl) => pl.name === p.name);
    return { ...p, revCents: plan ? p.count * plan.priceCents : 0 };
  });
  const totalPlanRev = planRows.reduce((s, r) => s + r.revCents, 0) || 1;
  const maxRev = Math.max(...monthlyRevenue.map((x) => x.revenueCents), 1);
  const maxBookings = Math.max(...monthlyBookings.map((x) => x.count), 1);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-2">
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Salons"
          value={overview.totalSalons}
          hint={`${overview.publishedSalons} live · ${overview.draftSalons} draft`}
          icon={Store}
        />
        <StatCard
          label="Salon owners"
          value={overview.salonAdmins}
          hint={`${overview.totalUsers} users · +${overview.newUsersThisMonth} this month`}
          icon={Users}
        />
        <StatCard label="Revenue" value={fmtLkr(overview.revenueTotalCents)} hint="All-time subscription revenue" icon={DollarSign} />
        <StatCard
          label="Bookings"
          value={overview.totalBookings.toLocaleString()}
          hint={`${overview.activeSubscriptions} active subscriptions`}
          icon={CalendarCheck}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="Salon status">
          <div className="space-y-3 text-sm">
            {[
              { status: "PUBLISHED", value: overview.publishedSalons },
              { status: "DRAFT", value: overview.draftSalons },
              { status: "SUSPENDED", value: overview.suspendedSalons },
            ].map((r) => (
              <div key={r.status} className="flex items-center justify-between">
                <StatusBadge kind="salon" status={r.status} />
                <span className="font-semibold">{r.value}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Bookings by status">
          {bookingsByStatus.length === 0 ? (
            <p className="text-sm text-muted-foreground">No bookings yet.</p>
          ) : (
            <div className="space-y-3 text-sm">
              {["CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"].map((s) => (
                <div key={s} className="flex items-center justify-between">
                  <StatusBadge kind="booking" status={s} />
                  <span className="font-semibold">{count(s)}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Revenue by plan" actions={<CreditCard className="h-4 w-4 text-gold-strong" aria-hidden="true" />}>
          {planRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active subscriptions yet.</p>
          ) : (
            <div className="space-y-4">
              {planRows.map((r) => {
                const pct = Math.round((r.revCents / totalPlanRev) * 100);
                return (
                  <div key={r.name} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{r.name}</span>
                      <span className="text-muted-foreground">Rs. {(r.revCents / 100).toLocaleString()}</span>
                    </div>
                    <Bar pct={pct} />
                    <p className="text-xs text-muted-foreground">
                      {r.count} subscriber{r.count !== 1 ? "s" : ""} · {r.pct}% of subscribers
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Monthly revenue" description="Last 6 months." actions={<TrendingUp className="h-4 w-4 text-gold-strong" aria-hidden="true" />}>
          <ul className="space-y-3">
            {monthlyRevenue.map((m) => (
              <li key={`${m.year}-${m.month}`} className="flex items-center gap-3 text-sm">
                <span className="w-16 shrink-0 text-xs text-muted-foreground">
                  {MONTH_NAMES[m.month - 1]} {m.year}
                </span>
                <Bar pct={Math.round((m.revenueCents / maxRev) * 100)} />
                <span className="w-28 shrink-0 text-right text-xs font-semibold">
                  {m.revenueCents > 0 ? fmtLkr(m.revenueCents) : <span className="text-muted-foreground">—</span>}
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Monthly bookings" description="Last 6 months." actions={<CalendarCheck className="h-4 w-4 text-gold-strong" aria-hidden="true" />}>
          <ul className="space-y-3">
            {monthlyBookings.map((m) => (
              <li key={`${m.year}-${m.month}`} className="flex items-center gap-3 text-sm">
                <span className="w-16 shrink-0 text-xs text-muted-foreground">
                  {MONTH_NAMES[m.month - 1]} {m.year}
                </span>
                <Bar pct={Math.round((m.count / maxBookings) * 100)} className="bg-foreground/70" />
                <span className="w-12 shrink-0 text-right text-xs font-semibold">
                  {m.count > 0 ? m.count : <span className="text-muted-foreground">—</span>}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
};

export default SystemStats;
