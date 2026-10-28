import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BarChart3, CalendarCheck, Loader2, Plus, Scissors, Star, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Panel, StatCard, StatusBadge } from "@/components/app-shell/parts";
import { setDefaultBranch } from "@/api/salon-api";
import type { OwnerDashboard, OwnerDashboardInsights, OwnerDashboardSalon } from "@/api/salon-owner-api";
import { sectionPath } from "@/lib/app-sections";

function formatRs(cents: number) {
  return `Rs. ${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function SalonStatistics({ insights }: { insights: OwnerDashboardInsights }) {
  const maxRev = Math.max(...insights.revenueByService.map((r) => r.totalCents), 1);
  const maxDay = Math.max(...insights.bookingsLast7Days.map((d) => d.count), 1);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Panel title="Revenue by service" description="From completed bookings.">
        {insights.revenueByService.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No completed bookings yet. Revenue appears here once you mark bookings as completed.
          </p>
        ) : (
          <div className="space-y-4">
            {insights.revenueByService.map((r) => (
              <div key={r.serviceId} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{r.name}</span>
                  <span className="text-muted-foreground">{formatRs(r.totalCents)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full gradient-gold"
                    style={{ width: `${Math.round((r.totalCents / maxRev) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Last 7 days" description="Bookings by day.">
        <div className="flex h-40 items-end gap-2">
          {insights.bookingsLast7Days.map((d) => (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="text-xs font-medium">{d.count}</span>
              <div
                className="w-full rounded-t-md bg-gold/80"
                style={{ height: `${Math.max(4, Math.round((d.count / maxDay) * 100))}px` }}
                aria-hidden="true"
              />
              <span className="text-[11px] text-muted-foreground">{d.date.slice(5)}</span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Weekly bookings" description="By appointment start time, oldest to newest." className="lg:col-span-2">
        <ul className="divide-y divide-border/70">
          {insights.bookingsByWeek.map((m) => (
            <li key={m.weekLabel} className="flex justify-between py-2.5 text-sm">
              <span>{m.weekLabel}</span>
              <span className="font-medium">
                {m.count} {m.count === 1 ? "booking" : "bookings"}
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

type Props = {
  data: OwnerDashboard;
  salon: OwnerDashboardSalon;
  insights: OwnerDashboardInsights | undefined;
  pendingBookings: number;
};

/** Owner overview: stat cards, quick actions, current branch, statistics (spec 004 §6). */
const OwnerOverview = ({ data, salon, insights, pendingBookings }: Props) => {
  const qc = useQueryClient();
  const maxSalons = data.planLimits.maxSalons;

  const defaultMut = useMutation({
    mutationFn: (id: string) => setDefaultBranch(id),
    onSuccess: (s) => {
      qc.invalidateQueries({ queryKey: ["owner-dashboard"] });
      toast.success(`"${s.name}" is now the default branch.`);
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Failed to set default"),
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Bookings" value={salon._count.bookings} hint={`${pendingBookings} pending review`} icon={CalendarCheck} />
        <StatCard
          label="Guest contacts"
          value={insights?.totals.uniqueGuestContacts ?? "—"}
          hint="Unique emails and customers"
          icon={Users}
        />
        <StatCard label="Active services" value={salon._count.services} hint="Listed for this branch" icon={Scissors} />
        <StatCard
          label="Revenue"
          value={insights ? formatRs(insights.totals.completedRevenueCents) : "—"}
          hint="All branches · completed visits"
          icon={BarChart3}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="Quick actions" className="lg:col-span-2">
          <div className="flex flex-wrap gap-2">
            <Button asChild className="gap-2">
              <Link to={sectionPath("dashboard", "services")}>
                <Plus className="h-4 w-4" /> New service
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <Link to={sectionPath("dashboard", "bookings")}>
                Review bookings
                {pendingBookings > 0 && (
                  <span className="rounded-full bg-gold px-1.5 text-xs font-semibold text-black">{pendingBookings}</span>
                )}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={`${sectionPath("dashboard", "marketing")}?tab=sms`}>New SMS campaign</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={sectionPath("dashboard", "profile")}>Edit salon profile</Link>
            </Button>
          </div>
        </Panel>

        <Panel title="This branch">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-medium">{salon.name}</span>
              <StatusBadge kind="salon" status={salon.status} />
            </div>
            <div className="flex items-center justify-between gap-2 text-muted-foreground">
              <span>
                {data.salons.length} / {maxSalons === -1 ? "∞" : maxSalons} branches
                {data.subscription ? ` · ${data.subscription.plan.name}` : ""}
              </span>
            </div>
            {salon.isDefault ? (
              <p className="inline-flex items-center gap-1.5 text-gold-strong">
                <Star className="h-4 w-4 fill-gold text-gold" /> Default branch shown to customers
              </p>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={defaultMut.isPending}
                onClick={() => defaultMut.mutate(salon.id)}
              >
                {defaultMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Star className="h-3.5 w-3.5" />}
                Set as default branch
              </Button>
            )}
          </div>
        </Panel>
      </div>

      {insights && <SalonStatistics insights={insights} />}
    </div>
  );
};

export default OwnerOverview;
