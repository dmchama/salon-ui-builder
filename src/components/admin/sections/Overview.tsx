import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  LogOut, CreditCard, Users, BarChart3, Shield, Globe, Megaphone, Ticket, MessageSquare,
  Plus, Edit, Trash2, Eye, Ban, CheckCircle, TrendingUp, DollarSign, Store, AlertTriangle, Loader2,
  CalendarCheck, Building2, RefreshCw, Receipt,
} from "lucide-react";
import CampaignRequestManager from "@/components/admin/CampaignRequestManager";
import PaymentDetailsForm from "@/components/admin/PaymentDetailsForm";
import RegistrationPaymentDialog from "@/components/admin/RegistrationPaymentDialog";
import Seo from "@/components/Seo";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getAccessToken, getStoredUser } from "@/lib/auth-storage";
import { motion } from "framer-motion";
import {
  fetchAdminStats, AdminStats,
  SalonOwnerDto, fetchOwners, suspendOwner, activateOwner,
  AdminSalonDto, fetchAdminSalons, publishSalon, suspendSalon, draftSalon,
  WebsiteHeroSlide, WebsiteSettings,
  fetchWebsiteSettings, saveHeroSlides, saveFooterSettings, saveSeoSettings,
  AdminPromoCodeDto, fetchAdminPromoCodes,
  OverageInvoiceDto, OverageInvoiceStatus,
  fetchOveragePrice, saveOveragePrice,
  fetchOverageInvoices, generateOverageInvoices,
  sendOverageInvoice, markOverageInvoicePaid, cancelOverageInvoice,
} from "@/api/admin-api";
import {
  AdminPlanDto, CreatePlanPayload, UpdatePlanPayload,
  fetchAdminPlans, createPlan, updatePlan, deletePlan,
} from "@/api/plans-api";

import { MONTH_NAMES, fmtLkr } from "./Billing";

/* Moved unchanged from pages/Admin.tsx (feature 004 T015). */

const BookingStatusBadgeColor: Record<string, string> = {
  CONFIRMED: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-700",
  NO_SHOW: "bg-red-100 text-red-700",
};

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="uppercase tracking-widest text-sm">Loading statistics…</span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <p className="text-muted-foreground tracking-wide text-sm">Failed to load statistics.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  const { overview, bookingsByStatus, planDistribution, monthlyRevenue, monthlyBookings } = data;
  const confirmedBookings = bookingsByStatus.find(b => b.status === "CONFIRMED")?.count ?? 0;
  const completedBookings = bookingsByStatus.find(b => b.status === "COMPLETED")?.count  ?? 0;
  const cancelledBookings = bookingsByStatus.find(b => b.status === "CANCELLED")?.count  ?? 0;
  const noShowBookings    = bookingsByStatus.find(b => b.status === "NO_SHOW")?.count    ?? 0;


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">System Statistics</h2>
        <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-2 text-xs uppercase tracking-widest">
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Total Salons</span>
              <Store className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="grid grid-cols-4 gap-1">
              <div className="flex flex-col items-center rounded-lg bg-blue-50 dark:bg-blue-950/30 py-2">
                <span className="text-xl font-bold font-display text-blue-600 dark:text-blue-400">{overview.totalSalons}</span>
                <span className="text-[9px] uppercase tracking-widest text-blue-500/70 mt-0.5 font-semibold">Total</span>
              </div>
              <div className="flex flex-col items-center rounded-lg bg-green-50 dark:bg-green-950/30 py-2">
                <span className="text-xl font-bold font-display text-green-600">{overview.publishedSalons}</span>
                <span className="text-[9px] uppercase tracking-widest text-green-500/70 mt-0.5 font-semibold">Live</span>
              </div>
              <div className="flex flex-col items-center rounded-lg bg-secondary py-2">
                <span className="text-xl font-bold font-display text-muted-foreground">{overview.draftSalons}</span>
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground/60 mt-0.5 font-semibold">Draft</span>
              </div>
              <div className="flex flex-col items-center rounded-lg bg-red-50 dark:bg-red-950/30 py-2">
                <span className="text-xl font-bold font-display text-destructive">{overview.suspendedSalons}</span>
                <span className="text-[9px] uppercase tracking-widest text-destructive/60 mt-0.5 font-semibold">Susp.</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Total Users</span>
              <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col items-center rounded-lg bg-green-50 dark:bg-green-950/30 py-2">
                <span className="text-xl font-bold font-display text-green-600 dark:text-green-400">{overview.totalUsers}</span>
                <span className="text-[9px] uppercase tracking-widest text-green-500/70 mt-0.5 font-semibold">Total</span>
              </div>
              <div className="flex flex-col items-center rounded-lg bg-secondary py-2">
                <span className="text-xl font-bold font-display text-muted-foreground">{overview.salonAdmins}</span>
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground/60 mt-0.5 font-semibold">Salon Owners</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 tracking-wide">+{overview.newUsersThisMonth} this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Revenue</span>
              <DollarSign className="h-4 w-4 text-rose-500 dark:text-rose-400" />
            </div>
            <div className="mt-1">
              <div className={`text-2xl font-bold font-display text-rose-500 dark:text-rose-400`}>{fmtLkr(overview.revenueTotalCents)}</div>
              <p className="text-xs text-muted-foreground mt-1 tracking-wide">All-time subscription revenue</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Bookings</span>
              <CalendarCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col items-center rounded-lg bg-green-50 dark:bg-green-950/30 py-2">
                <span className="text-xl font-bold font-display text-green-600">{confirmedBookings}</span>
                <span className="text-[9px] uppercase tracking-widest text-green-500/70 mt-0.5 font-semibold">Confirmed</span>
              </div>
              <div className="flex flex-col items-center rounded-lg bg-slate-100 dark:bg-slate-800/50 py-2">
                <span className="text-xl font-bold font-display text-slate-600 dark:text-slate-300">{completedBookings}</span>
                <span className="text-[9px] uppercase tracking-widest text-slate-400 mt-0.5 font-semibold">Completed</span>
              </div>
              <div className="flex flex-col items-center rounded-lg bg-red-50 dark:bg-red-950/30 py-2">
                <span className="text-xl font-bold font-display text-destructive">{cancelledBookings}</span>
                <span className="text-[9px] uppercase tracking-widest text-destructive/60 mt-0.5 font-semibold">Cancelled</span>
              </div>
              <div className="flex flex-col items-center rounded-lg bg-orange-50 dark:bg-orange-950/30 py-2">
                <span className="text-xl font-bold font-display text-orange-500">{noShowBookings}</span>
                <span className="text-[9px] uppercase tracking-widest text-orange-400/70 mt-0.5 font-semibold">No Show</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <Building2 className="h-8 w-8 text-blue-400/70 shrink-0" />
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-1">Salon Status</div>
              <div className="flex gap-3 text-sm">
                <span className="text-green-600 font-semibold">{overview.publishedSalons} live</span>
                <span className="text-muted-foreground">{overview.draftSalons} draft</span>
                {overview.suspendedSalons > 0 && <span className="text-destructive">{overview.suspendedSalons} suspended</span>}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <CreditCard className="h-8 w-8 text-green-400/70 shrink-0" />
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-1">Active Subscriptions</div>
              <div className="text-2xl font-bold font-display">{overview.activeSubscriptions}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <TrendingUp className="h-8 w-8 text-amber-400/70 shrink-0" />
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-1">Total Bookings</div>
              <div className="text-2xl font-bold font-display">{overview.totalBookings.toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>

        {/* Plan Revenue Distribution card */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Revenue by Plan</span>
              <CreditCard className="h-4 w-4 text-violet-500 dark:text-violet-400" />
            </div>
            {planDistribution.length === 0 ? (
              <p className="text-xs text-muted-foreground">No active subscriptions yet.</p>
            ) : (() => {
              const rows = planDistribution.map(p => {
                const plan = plans.find(pl => pl.name === p.name);
                const revCents = plan ? p.count * plan.priceCents : 0;
                return { ...p, revCents, plan };
              });
              const totalRevCents = rows.reduce((s, r) => s + r.revCents, 0) || 1;
              const pillColors = [
                "bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300",
                "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300",
                "bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300",
                "bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300",
              ];
              return (
                <div className="space-y-2">
                  {rows.map((r, idx) => {
                    const revPct = Math.round((r.revCents / totalRevCents) * 100);
                    return (
                      <div key={r.name} className={`rounded-lg px-3 py-2 ${pillColors[idx % pillColors.length]}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider">{r.name}</span>
                          <span className="text-sm font-bold font-display">Rs. {(r.revCents / 100).toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-current rounded-full transition-all duration-500 opacity-50" style={{ width: `${revPct}%` }} />
                        </div>
                        <div className="flex justify-between mt-0.5">
                          <span className="text-[10px] opacity-60">{r.count} subscriber{r.count !== 1 ? "s" : ""}</span>
                          <span className="text-[10px] opacity-60">{revPct}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Plan distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {planDistribution.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active subscriptions yet.</p>
            ) : (
              planDistribution.map((p) => (
                <div key={p.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-muted-foreground">{p.count} subscriber{p.count !== 1 ? "s" : ""} ({p.pct}%)</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${p.pct}%` }} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Booking status breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Booking Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {bookingsByStatus.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bookings yet.</p>
            ) : (
              bookingsByStatus
                .sort((a, b) => b.count - a.count)
                .map((s) => (
                  <div key={s.status} className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <span className={`text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded ${BookingStatusBadgeColor[s.status] ?? "bg-secondary"}`}>
                      {s.status}
                    </span>
                    <span className="font-semibold text-sm">{s.count}</span>
                  </div>
                ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Monthly revenue trend */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Monthly Revenue (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {monthlyRevenue.map((m) => {
              const maxRev = Math.max(...monthlyRevenue.map((x) => x.revenueCents), 1);
              const pct = Math.round((m.revenueCents / maxRev) * 100);
              return (
                <div key={`${m.year}-${m.month}`} className="flex items-center gap-3 py-1.5 border-b last:border-0">
                  <span className="text-xs text-muted-foreground w-16 shrink-0">
                    {MONTH_NAMES[m.month - 1]} {m.year}
                  </span>
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-rose-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-semibold w-28 text-right shrink-0">
                    {m.revenueCents > 0 ? fmtLkr(m.revenueCents) : <span className="text-muted-foreground">—</span>}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Monthly booking trend */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Monthly Bookings (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {monthlyBookings.map((m) => {
              const maxCount = Math.max(...monthlyBookings.map((x) => x.count), 1);
              const pct = Math.round((m.count / maxCount) * 100);
              return (
                <div key={`${m.year}-${m.month}`} className="flex items-center gap-3 py-1.5 border-b last:border-0">
                  <span className="text-xs text-muted-foreground w-16 shrink-0">
                    {MONTH_NAMES[m.month - 1]} {m.year}
                  </span>
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-semibold w-12 text-right shrink-0">
                    {m.count > 0 ? m.count : <span className="text-muted-foreground">—</span>}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemStats;
