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
  CalendarCheck, Building2, RefreshCw,
} from "lucide-react";
import CampaignRequestManager from "@/components/admin/CampaignRequestManager";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getAccessToken, getStoredUser } from "@/lib/auth-storage";
import { motion } from "framer-motion";
import {
  fetchAdminStats, AdminStats,
  SalonOwnerDto, fetchOwners, approveOwner, suspendOwner, activateOwner,
  AdminSalonDto, fetchAdminSalons, publishSalon, suspendSalon, draftSalon,
  WebsiteHeroSlide, WebsiteSettings,
  fetchWebsiteSettings, saveHeroSlides, saveFooterSettings, saveSeoSettings,
  CampaignService,
  fetchCampaignCustomers, fetchCampaignServices, sendSmsCampaign,
} from "@/api/admin-api";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AdminPlanDto, CreatePlanPayload, UpdatePlanPayload,
  fetchAdminPlans, createPlan, updatePlan, deletePlan,
} from "@/api/plans-api";

// ─── Mock Data ───


const mockCoupons = [
  { id: 1, code: "WELCOME20", discount: "20%", type: "percentage", usage: 145, limit: 500, expires: "2026-06-30", active: true },
  { id: 2, code: "FLAT200", discount: "Rs. 200", type: "flat", usage: 78, limit: 200, expires: "2026-04-30", active: true },
  { id: 3, code: "SUMMER50", discount: "50%", type: "percentage", usage: 200, limit: 200, expires: "2026-03-15", active: false },
];

const mockPromotions = [
  { id: 1, title: "Summer Sale Banner", placement: "Homepage Hero", status: "active", startDate: "2026-03-01", endDate: "2026-04-30" },
  { id: 2, title: "New Year Offer", placement: "Salon Listing", status: "scheduled", startDate: "2026-04-01", endDate: "2026-04-15" },
  { id: 3, title: "Festival Discount", placement: "Homepage Banner", status: "expired", startDate: "2026-01-10", endDate: "2026-02-10" },
];

const mockSmsHistory = [
  { id: 1, campaign: "March Offers", recipients: 450, sent: 448, delivered: 440, date: "2026-03-15", status: "completed" },
  { id: 2, campaign: "Welcome Message", recipients: 32, sent: 32, delivered: 31, date: "2026-03-20", status: "completed" },
  { id: 3, campaign: "Easter Promo", recipients: 500, sent: 0, delivered: 0, date: "2026-04-01", status: "scheduled" },
];

// ─── Sub-Components ───

type PlanFormState = {
  name: string;
  description: string;
  priceRs: string;
  intervalMonths: string;
  features: string;
  active: boolean;
};

const emptyForm = (): PlanFormState => ({
  name: "", description: "", priceRs: "", intervalMonths: "1", features: "", active: true,
});

const planToForm = (p: AdminPlanDto): PlanFormState => ({
  name: p.name,
  description: p.description ?? "",
  priceRs: (p.priceCents / 100).toString(),
  intervalMonths: p.intervalMonths.toString(),
  features: (p.features ?? []).join("\n"),
  active: p.active,
});

const PlanForm = ({
  form, onChange,
}: {
  form: PlanFormState;
  onChange: (f: PlanFormState) => void;
}) => (
  <div className="space-y-4 pt-2">
    <div>
      <Label>Plan Name</Label>
      <Input value={form.name} onChange={e => onChange({ ...form, name: e.target.value })} placeholder="e.g. Professional" />
    </div>
    <div>
      <Label>Description</Label>
      <Input value={form.description} onChange={e => onChange({ ...form, description: e.target.value })} placeholder="Optional short description" />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <Label>Price (Rs.)</Label>
        <Input type="number" min="0" value={form.priceRs} onChange={e => onChange({ ...form, priceRs: e.target.value })} placeholder="0 for free" />
      </div>
      <div>
        <Label>Billing Interval</Label>
        <Select value={form.intervalMonths} onValueChange={v => onChange({ ...form, intervalMonths: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Monthly</SelectItem>
            <SelectItem value="3">Every 3 months</SelectItem>
            <SelectItem value="6">Every 6 months</SelectItem>
            <SelectItem value="12">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
    <div>
      <Label>Features (one per line)</Label>
      <Textarea rows={4} value={form.features} onChange={e => onChange({ ...form, features: e.target.value })} placeholder={"Unlimited bookings\nCustom branding\nPriority support"} />
    </div>
  </div>
);

const SubscriptionManager = () => {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<AdminPlanDto | null>(null);
  const [deletePlanTarget, setDeletePlanTarget] = useState<AdminPlanDto | null>(null);
  const [createForm, setCreateForm] = useState<PlanFormState>(emptyForm());
  const [editForm, setEditForm] = useState<PlanFormState>(emptyForm());

  const { data: plans = [], isLoading, isError, refetch, isFetching } = useQuery<AdminPlanDto[]>({
    queryKey: ["admin-plans"],
    queryFn: fetchAdminPlans,
    staleTime: 30_000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-plans"] });

  const createMutation = useMutation({
    mutationFn: (payload: CreatePlanPayload) => createPlan(payload),
    onSuccess: () => { toast.success("Plan created"); setCreateOpen(false); setCreateForm(emptyForm()); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePlanPayload }) => updatePlan(id, payload),
    onSuccess: () => { toast.success("Plan updated"); setEditPlan(null); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePlan(id),
    onSuccess: () => { toast.success("Plan deleted"); setDeletePlanTarget(null); invalidate(); },
    onError: (e: Error) => { toast.error(e.message); setDeletePlanTarget(null); },
  });

  const buildPayload = (form: PlanFormState): CreatePlanPayload => ({
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    priceCents: Math.round(parseFloat(form.priceRs || "0") * 100),
    intervalMonths: parseInt(form.intervalMonths, 10),
    features: form.features.split("\n").map(f => f.trim()).filter(Boolean),
  });

  const handleCreate = () => {
    if (!createForm.name.trim()) { toast.error("Plan name is required"); return; }
    createMutation.mutate(buildPayload(createForm));
  };

  const handleUpdate = () => {
    if (!editPlan || !editForm.name.trim()) { toast.error("Plan name is required"); return; }
    updateMutation.mutate({ id: editPlan.id, payload: { ...buildPayload(editForm), active: editForm.active } });
  };

  const intervalLabel = (months: number) => {
    if (months === 1) return "/month";
    if (months === 12) return "/year";
    return `/${months}mo`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Subscription Plans</h2>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-1 text-xs uppercase tracking-widest">
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Dialog open={createOpen} onOpenChange={o => { setCreateOpen(o); if (!o) setCreateForm(emptyForm()); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Add Plan</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Subscription Plan</DialogTitle></DialogHeader>
              <PlanForm form={createForm} onChange={setCreateForm} />
              <Button
                className="w-full mt-2"
                onClick={handleCreate}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Plan
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="uppercase tracking-widest text-sm">Loading plans…</span>
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <AlertTriangle className="h-10 w-10 text-destructive" />
          <p className="text-muted-foreground tracking-wide text-sm">Failed to load plans.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map(p => (
            <Card key={p.id} className={!p.active ? "opacity-60" : ""}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-display font-semibold text-lg">{p.name}</span>
                  <Badge variant={p.active ? "default" : "secondary"}>{p.active ? "Active" : "Inactive"}</Badge>
                </div>
                <div className="text-2xl font-bold font-display">
                  {p.priceCents === 0 ? "Free" : `Rs. ${(p.priceCents / 100).toLocaleString("en-LK")}`}
                  <span className="text-sm text-muted-foreground font-normal">
                    {p.priceCents > 0 ? intervalLabel(p.intervalMonths) : ""}
                  </span>
                </div>
                {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                <p className="text-sm text-muted-foreground">
                  {(p.features ?? []).length} feature{(p.features ?? []).length !== 1 ? "s" : ""} · {p.subscriberCount} subscriber{p.subscriberCount !== 1 ? "s" : ""}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline" size="sm" className="flex-1 gap-1"
                    onClick={() => { setEditPlan(p); setEditForm(planToForm(p)); }}
                  >
                    <Edit className="h-3 w-3" /> Edit
                  </Button>
                  <Button
                    variant="outline" size="sm" className="gap-1 text-destructive hover:bg-destructive/10"
                    onClick={() => setDeletePlanTarget(p)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {plans.length === 0 && (
            <div className="col-span-3 py-16 text-center text-muted-foreground text-sm tracking-wide">
              No plans yet. Click "Add Plan" to create one.
            </div>
          )}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editPlan} onOpenChange={o => { if (!o) setEditPlan(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Plan — {editPlan?.name}</DialogTitle></DialogHeader>
          <PlanForm form={editForm} onChange={setEditForm} />
          <div className="flex items-center gap-3 pt-2">
            <Switch
              id="plan-active"
              checked={editForm.active}
              onCheckedChange={v => setEditForm(f => ({ ...f, active: v }))}
            />
            <Label htmlFor="plan-active">{editForm.active ? "Active" : "Inactive"}</Label>
          </div>
          <Button
            className="w-full mt-2"
            onClick={handleUpdate}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Changes
          </Button>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deletePlanTarget} onOpenChange={o => { if (!o) setDeletePlanTarget(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Plan</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground pt-2">
            Are you sure you want to delete <strong>{deletePlanTarget?.name}</strong>?
            {(deletePlanTarget?.subscriberCount ?? 0) > 0 && (
              <span className="block mt-2 text-destructive font-medium">
                This plan has {deletePlanTarget?.subscriberCount} active subscriber{deletePlanTarget?.subscriberCount !== 1 ? "s" : ""} and cannot be deleted. Deactivate it instead.
              </span>
            )}
          </p>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setDeletePlanTarget(null)}>Cancel</Button>
            <Button
              variant="destructive" className="flex-1"
              disabled={deleteMutation.isPending || (deletePlanTarget?.subscriberCount ?? 0) > 0}
              onClick={() => deletePlanTarget && deleteMutation.mutate(deletePlanTarget.id)}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-600 hover:bg-green-700 text-white",
  suspended: "bg-red-500 hover:bg-red-600 text-white",
  pending: "bg-yellow-500 hover:bg-yellow-600 text-black",
};

const AccountManager = () => {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("all");

  const { data: owners = [], isLoading, isError, refetch, isFetching } = useQuery<SalonOwnerDto[]>({
    queryKey: ["admin-owners"],
    queryFn: fetchOwners,
    staleTime: 30_000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-owners"] });

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveOwner(id),
    onSuccess: (_d, id) => {
      toast.success(`${owners.find(o => o.id === id)?.displayName ?? "Owner"} approved`);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => suspendOwner(id),
    onSuccess: (_d, id) => {
      toast.info(`${owners.find(o => o.id === id)?.displayName ?? "Owner"} suspended`);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => activateOwner(id),
    onSuccess: (_d, id) => {
      toast.success(`${owners.find(o => o.id === id)?.displayName ?? "Owner"} activated`);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const anyPending = approveMutation.isPending || suspendMutation.isPending || activateMutation.isPending;
  const filtered = filter === "all" ? owners : owners.filter(o => o.status === filter);
  const counts = {
    all: owners.length,
    active: owners.filter(o => o.status === "active").length,
    suspended: owners.filter(o => o.status === "suspended").length,
    pending: owners.filter(o => o.status === "pending").length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-display text-lg font-semibold">Salon Owner Accounts</h2>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-1 text-xs uppercase tracking-widest">
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <div className="flex gap-2 flex-wrap">
            {(["all", "active", "pending", "suspended"] as const).map(s => (
              <Button
                key={s}
                variant={filter === s ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(s)}
                className={`capitalize gap-1.5 ${s === "pending" && counts.pending > 0 ? "border-yellow-400" : ""}`}
              >
                {s}
                {counts[s] > 0 && (
                  <span className={`text-[10px] font-bold px-1 rounded-full ${filter === s ? "bg-white/20" : s === "pending" && counts.pending > 0 ? "bg-yellow-400 text-black" : "opacity-60"}`}>
                    {counts[s]}
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="uppercase tracking-widest text-sm">Loading accounts…</span>
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <AlertTriangle className="h-10 w-10 text-destructive" />
          <p className="text-muted-foreground text-sm tracking-wide">Failed to load accounts.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
        </div>
      )}

      {!isLoading && !isError && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Owner</TableHead>
                <TableHead>Salons</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-12 text-sm tracking-wide">
                    No accounts found.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map(o => (
                <TableRow key={o.id} className={o.status === "suspended" ? "opacity-60" : ""}>
                  <TableCell>
                    <div className="font-medium">{o.displayName}</div>
                    <div className="text-xs text-muted-foreground">{o.email}</div>
                    {o.phone && <div className="text-xs text-muted-foreground">{o.phone}</div>}
                  </TableCell>
                  <TableCell>
                    {o.salons.length === 0
                      ? <span className="text-xs text-muted-foreground">No salons yet</span>
                      : o.salons.map(s => (
                        <div key={s.id} className="text-sm leading-5">
                          {s.name}
                          <span className={`ml-1.5 text-[10px] uppercase tracking-widest font-semibold ${s.status === "PUBLISHED" ? "text-green-600" : s.status === "SUSPENDED" ? "text-red-500" : "text-muted-foreground"}`}>
                            {s.status}
                          </span>
                        </div>
                      ))
                    }
                  </TableCell>
                  <TableCell>
                    {o.subscription
                      ? <Badge variant="secondary">{o.subscription.planName}</Badge>
                      : <span className="text-xs text-muted-foreground">No plan</span>
                    }
                  </TableCell>
                  <TableCell>
                    <Badge className={`${STATUS_COLORS[o.status] ?? ""} border-0 capitalize`}>
                      {o.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(o.joinedAt).toLocaleDateString("en-LK", { year: "numeric", month: "short", day: "numeric" })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {/* PENDING → Approve or Suspend */}
                      {o.status === "pending" && (
                        <>
                          <Button variant="ghost" size="sm" disabled={anyPending} onClick={() => approveMutation.mutate(o.id)} title="Approve account" className="text-green-600 hover:text-green-700 hover:bg-green-50">
                            {approveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="sm" disabled={anyPending} onClick={() => suspendMutation.mutate(o.id)} title="Reject / suspend" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            {suspendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                          </Button>
                        </>
                      )}
                      {/* ACTIVE → Suspend only */}
                      {o.status === "active" && (
                        <Button variant="ghost" size="sm" disabled={anyPending} onClick={() => suspendMutation.mutate(o.id)} title="Suspend account" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                          {suspendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                        </Button>
                      )}
                      {/* SUSPENDED → Activate only */}
                      {o.status === "suspended" && (
                        <Button variant="ghost" size="sm" disabled={anyPending} onClick={() => activateMutation.mutate(o.id)} title="Reactivate account" className="text-primary hover:text-primary hover:bg-primary/10">
                          {activateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmtLkr(cents: number) {
  return `Rs. ${(cents / 100).toLocaleString("en-LK")}`;
}

function pctChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? "+100%" : "—";
  const change = Math.round(((current - previous) / previous) * 100);
  return `${change >= 0 ? "+" : ""}${change}% vs last month`;
}

const StatCard = ({
  label, value, sub, icon: Icon, color, border,
}: {
  label: string; value: string; sub: string;
  icon: React.ElementType; color: string; border?: string;
}) => (
  <Card className={border}>
    <CardContent className="p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold">{label}</span>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <div className={`text-2xl font-bold font-display ${color}`}>{value}</div>
      <p className="text-xs text-muted-foreground mt-1 tracking-wide">{sub}</p>
    </CardContent>
  </Card>
);

const BookingStatusBadgeColor: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
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

  const totalBookingsChange = pctChange(overview.bookingsThisMonth, overview.bookingsLastMonth);
  const revenueChange = pctChange(overview.revenueThisMonthCents, overview.revenueLastMonthCents);

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
        <StatCard
          label="Total Salons"
          value={overview.totalSalons.toLocaleString()}
          sub={`+${overview.newSalonsThisMonth} this month · ${overview.publishedSalons} published`}
          icon={Store}
          color="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          label="Total Users"
          value={overview.totalUsers.toLocaleString()}
          sub={`+${overview.newUsersThisMonth} this month · ${overview.salonAdmins} owners`}
          icon={Users}
          color="text-green-600 dark:text-green-400"
        />
        <StatCard
          label="Revenue (This Month)"
          value={fmtLkr(overview.revenueThisMonthCents)}
          sub={revenueChange}
          icon={DollarSign}
          color="text-rose-500 dark:text-rose-400"
        />
        <StatCard
          label="Active Bookings"
          value={overview.activeBookings.toLocaleString()}
          sub={`${overview.bookingsThisMonth} this month · ${totalBookingsChange}`}
          icon={CalendarCheck}
          color="text-amber-600 dark:text-amber-400"
          border="border border-amber-400/60 shadow-sm"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

const SALON_STATUS_META: Record<string, { label: string; badge: string }> = {
  PUBLISHED: { label: "Published", badge: "bg-green-600 hover:bg-green-700 text-white" },
  DRAFT:     { label: "Draft",     badge: "bg-yellow-500 hover:bg-yellow-600 text-black" },
  SUSPENDED: { label: "Suspended", badge: "bg-red-500 hover:bg-red-600 text-white" },
};

const SalonModeration = () => {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("ALL");

  const { data: salons = [], isLoading, isError, refetch, isFetching } = useQuery<AdminSalonDto[]>({
    queryKey: ["admin-salons"],
    queryFn: fetchAdminSalons,
    staleTime: 30_000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-salons"] });

  const publishMutation = useMutation({
    mutationFn: (id: string) => publishSalon(id),
    onSuccess: (_d, id) => { toast.success(`"${salons.find(s => s.id === id)?.name}" published`); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => suspendSalon(id),
    onSuccess: (_d, id) => { toast.info(`"${salons.find(s => s.id === id)?.name}" suspended`); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const draftMutation = useMutation({
    mutationFn: (id: string) => draftSalon(id),
    onSuccess: (_d, id) => { toast.info(`"${salons.find(s => s.id === id)?.name}" moved to draft`); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const anyMutating = publishMutation.isPending || suspendMutation.isPending || draftMutation.isPending;

  const counts = {
    ALL: salons.length,
    DRAFT: salons.filter(s => s.status === "DRAFT").length,
    PUBLISHED: salons.filter(s => s.status === "PUBLISHED").length,
    SUSPENDED: salons.filter(s => s.status === "SUSPENDED").length,
  };

  const filtered = filter === "ALL" ? salons : salons.filter(s => s.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-display text-lg font-semibold">Salon Profile Moderation</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-1 text-xs uppercase tracking-widest">
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <div className="flex gap-2 flex-wrap">
            {(["ALL", "DRAFT", "PUBLISHED", "SUSPENDED"] as const).map(s => (
              <Button
                key={s}
                variant={filter === s ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(s)}
                className={`capitalize gap-1.5 ${s === "DRAFT" && counts.DRAFT > 0 ? "border-yellow-400" : ""}`}
              >
                {s === "ALL" ? "All" : SALON_STATUS_META[s].label}
                {counts[s] > 0 && (
                  <span className={`text-[10px] font-bold px-1 rounded-full ${filter === s ? "bg-white/20" : s === "DRAFT" && counts.DRAFT > 0 ? "bg-yellow-400 text-black" : "opacity-60"}`}>
                    {counts[s]}
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="uppercase tracking-widest text-sm">Loading salons…</span>
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <AlertTriangle className="h-10 w-10 text-destructive" />
          <p className="text-muted-foreground text-sm tracking-wide">Failed to load salons.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
        </div>
      )}

      {!isLoading && !isError && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Salon</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Bookings</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-12 text-sm tracking-wide">
                    No salons found.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map(s => {
                const meta = SALON_STATUS_META[s.status];
                return (
                  <TableRow key={s.id} className={s.status === "SUSPENDED" ? "opacity-60" : ""}>
                    <TableCell>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">/{s.slug}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{s.owner.displayName}</div>
                      <div className="text-xs text-muted-foreground">{s.owner.email}</div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {[s.city, s.country].filter(Boolean).join(", ") || "—"}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{s.bookingCount}</TableCell>
                    <TableCell>
                      <Badge className={`${meta.badge} border-0`}>{meta.label}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(s.createdAt).toLocaleDateString("en-LK", { year: "numeric", month: "short", day: "numeric" })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {/* DRAFT → Publish or Suspend */}
                        {s.status === "DRAFT" && (
                          <>
                            <Button variant="ghost" size="sm" disabled={anyMutating} onClick={() => publishMutation.mutate(s.id)} title="Publish salon" className="text-green-600 hover:text-green-700 hover:bg-green-50">
                              {publishMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="sm" disabled={anyMutating} onClick={() => suspendMutation.mutate(s.id)} title="Suspend salon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                              {suspendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                            </Button>
                          </>
                        )}
                        {/* PUBLISHED → Suspend only */}
                        {s.status === "PUBLISHED" && (
                          <Button variant="ghost" size="sm" disabled={anyMutating} onClick={() => suspendMutation.mutate(s.id)} title="Suspend salon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            {suspendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                          </Button>
                        )}
                        {/* SUSPENDED → Re-publish or move to Draft */}
                        {s.status === "SUSPENDED" && (
                          <>
                            <Button variant="ghost" size="sm" disabled={anyMutating} onClick={() => publishMutation.mutate(s.id)} title="Re-publish salon" className="text-green-600 hover:text-green-700 hover:bg-green-50">
                              {publishMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="sm" disabled={anyMutating} onClick={() => draftMutation.mutate(s.id)} title="Move to draft" className="text-muted-foreground hover:text-foreground hover:bg-secondary">
                              {draftMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};

const WebsiteManager = () => {
  const qc = useQueryClient();
  const [editingSlide, setEditingSlide] = useState<WebsiteHeroSlide | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [footerText, setFooterText] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  const { data: settings, isLoading, isError, refetch } = useQuery<WebsiteSettings>({
    queryKey: ["admin-website"],
    queryFn: fetchWebsiteSettings,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!settings) return;
    setFooterText(settings.footerText);
    setSupportEmail(settings.supportEmail);
    setMetaTitle(settings.metaTitle);
    setMetaDescription(settings.metaDescription);
  }, [settings]);

  const slides = settings?.heroSlides ?? [];
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-website"] });

  const slidesMutation = useMutation({
    mutationFn: (s: WebsiteHeroSlide[]) => saveHeroSlides(s),
    onSuccess: () => { toast.success("Hero slides saved"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const footerMutation = useMutation({
    mutationFn: () => saveFooterSettings({ footerText, supportEmail }),
    onSuccess: () => { toast.success("Footer settings saved"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const seoMutation = useMutation({
    mutationFn: () => saveSeoSettings({ metaTitle, metaDescription }),
    onSuccess: () => { toast.success("SEO settings saved"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleDelete = (id: string) => {
    slidesMutation.mutate(slides.filter(s => s.id !== id));
  };

  const handleSaveSlide = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const mediaType = fd.get("mediaType") as "image" | "video";
    let mediaUrl = editingSlide?.mediaUrl ?? "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1920&q=80";
    const file = fd.get("mediaFile") as File;
    if (file && file.size > 0) {
      mediaUrl = mediaType === "video"
        ? "https://assets.mixkit.co/videos/preview/mixkit-working-with-the-hair-of-a-woman-in-a-hair-43486-large.mp4"
        : "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=1920&q=80";
    }
    const updated: WebsiteHeroSlide = {
      id: editingSlide?.id ?? `slide-${Date.now()}`,
      mediaType,
      mediaUrl,
      title: fd.get("title") as string,
      subtitle: fd.get("subtitle") as string,
      buttonText: fd.get("buttonText") as string,
    };
    const next = editingSlide
      ? slides.map(s => s.id === editingSlide.id ? updated : s)
      : [...slides, updated];
    slidesMutation.mutate(next);
    setIsDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="uppercase tracking-widest text-sm">Loading website settings…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <p className="text-muted-foreground text-sm tracking-wide">Failed to load website settings.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Website Management</h2>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <CardTitle className="text-base font-bold uppercase tracking-widest">Homepage Hero Slides</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-gold hover:bg-gold/90 text-white rounded-none tracking-widest uppercase text-xs" onClick={() => setEditingSlide(null)}>
                <Plus className="h-4 w-4 mr-2" /> Add Slide
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleSaveSlide}>
                <DialogHeader>
                  <DialogTitle className="font-display uppercase tracking-widest">{editingSlide ? 'Edit Slide' : 'Add New Slide'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label className="uppercase tracking-widest text-xs font-bold text-black/60 mb-2 block">Media Type</Label>
                    <Select name="mediaType" defaultValue={editingSlide?.mediaType || "image"}>
                      <SelectTrigger className="rounded-none border-black/20"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="image">Image Background</SelectItem>
                        <SelectItem value="video">Video Background</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="uppercase tracking-widest text-xs font-bold text-black/60 mb-2 block">Upload Media</Label>
                    <Input type="file" name="mediaFile" accept="image/*,video/*" className="rounded-none border-black/20 file:bg-black/5 file:border-0 file:rounded-none file:px-4 file:py-1 file:mr-4 file:uppercase file:tracking-widest file:text-xs" />
                    <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">Simulated upload. Leave empty to keep existing.</p>
                  </div>
                  <div>
                    <Label className="uppercase tracking-widest text-xs font-bold text-black/60 mb-2 block">Main Title</Label>
                    <Input name="title" defaultValue={editingSlide?.title || ""} className="rounded-none border-black/20" required />
                  </div>
                  <div>
                    <Label className="uppercase tracking-widest text-xs font-bold text-black/60 mb-2 block">Subtitle / Description</Label>
                    <Textarea name="subtitle" rows={2} defaultValue={editingSlide?.subtitle || ""} className="rounded-none border-black/20" required />
                  </div>
                  <div>
                    <Label className="uppercase tracking-widest text-xs font-bold text-black/60 mb-2 block">Button Text</Label>
                    <Input name="buttonText" defaultValue={editingSlide?.buttonText || "Book Now"} className="rounded-none border-black/20" required />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-black/10">
                  <Button type="button" variant="outline" className="rounded-none tracking-widest uppercase text-xs" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-black hover:bg-black/80 text-white rounded-none tracking-widest uppercase text-xs">Save Slide</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-black/10 bg-black/[0.02]">
                <TableHead className="uppercase tracking-widest text-xs font-bold text-black py-4 px-6 w-[120px]">Media</TableHead>
                <TableHead className="uppercase tracking-widest text-xs font-bold text-black py-4">Content</TableHead>
                <TableHead className="uppercase tracking-widest text-xs font-bold text-black py-4 text-right px-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slides.map(slide => (
                <TableRow key={slide.id} className="border-b border-black/5">
                  <TableCell className="px-6 py-4">
                    <div className="w-20 h-12 bg-black/10 relative overflow-hidden group">
                      {slide.mediaType === 'video' ? (
                        <video src={slide.mediaUrl} className="w-full h-full object-cover" />
                      ) : (
                        <img src={slide.mediaUrl} className="w-full h-full object-cover" alt="slide" />
                      )}
                      <div className="absolute top-1 right-1 bg-black/80 text-white text-[8px] uppercase tracking-widest px-1 py-0.5">{slide.mediaType}</div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="font-display font-semibold text-sm mb-1">{slide.title}</div>
                    <div className="text-xs text-muted-foreground font-light line-clamp-1">{slide.subtitle}</div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-black/5 hover:text-black rounded-none" onClick={() => { setEditingSlide(slide); setIsDialogOpen(true); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-none" onClick={() => handleDelete(slide.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-black/10">
        <Card className="rounded-none border border-black/10 shadow-none">
          <CardHeader><CardTitle className="text-sm uppercase tracking-widest font-bold">Footer Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-widest text-black/60 mb-2 block">Footer Text</Label>
              <Input
                className="rounded-none border-black/20"
                value={footerText}
                onChange={e => setFooterText(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-black/60 mb-2 block">Support Email</Label>
              <Input
                className="rounded-none border-black/20"
                type="email"
                value={supportEmail}
                onChange={e => setSupportEmail(e.target.value)}
              />
            </div>
            <Button
              className="w-full bg-black hover:bg-black/90 text-white rounded-none uppercase tracking-widest text-xs"
              onClick={() => footerMutation.mutate()}
              disabled={footerMutation.isPending}
            >
              {footerMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-none border border-black/10 shadow-none">
          <CardHeader><CardTitle className="text-sm uppercase tracking-widest font-bold">SEO Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-widest text-black/60 mb-2 block">Meta Title</Label>
              <Input
                className="rounded-none border-black/20"
                value={metaTitle}
                onChange={e => setMetaTitle(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-black/60 mb-2 block">Meta Description</Label>
              <Textarea
                rows={2}
                className="rounded-none border-black/20"
                value={metaDescription}
                onChange={e => setMetaDescription(e.target.value)}
              />
            </div>
            <Button
              className="w-full bg-black hover:bg-black/90 text-white rounded-none uppercase tracking-widest text-xs"
              onClick={() => seoMutation.mutate()}
              disabled={seoMutation.isPending}
            >
              {seoMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const PromotionManager = () => {
  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [placement, setPlacement] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleCreate = () => {
    if (!title || !placement || !startDate || !endDate) {
      toast.error("Please fill in all fields");
      return;
    }
    toast.success("Promotion created");
    setTitle(""); setPlacement(""); setStartDate(""); setEndDate("");
    setAddOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Promotions</h2>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> New Promotion</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Promotion</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Title</Label><Input placeholder="e.g. Summer Sale Banner" value={title} onChange={e => setTitle(e.target.value)} /></div>
              <div><Label>Placement</Label>
                <Select value={placement} onValueChange={setPlacement}>
                  <SelectTrigger><SelectValue placeholder="Select placement" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Homepage Hero">Homepage Hero</SelectItem>
                    <SelectItem value="Homepage Banner">Homepage Banner</SelectItem>
                    <SelectItem value="Salon Listing">Salon Listing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Start Date</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
                <div><Label>End Date</Label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
              </div>
              <Button className="w-full" onClick={handleCreate}>Create Promotion</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead><TableHead>Placement</TableHead><TableHead>Status</TableHead><TableHead>Duration</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockPromotions.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.title}</TableCell>
                <TableCell>{p.placement}</TableCell>
                <TableCell><Badge variant={p.status === "active" ? "default" : p.status === "scheduled" ? "secondary" : "outline"}>{p.status}</Badge></TableCell>
                <TableCell className="text-sm text-muted-foreground">{p.startDate} → {p.endDate}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

const CouponManager = () => {
  const [addOpen, setAddOpen] = useState(false);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Coupon Management</h2>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild><Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Create Coupon</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Coupon</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Coupon Code</Label><Input placeholder="e.g. SAVE30" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Discount Type</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent><SelectItem value="percentage">Percentage</SelectItem><SelectItem value="flat">Flat Amount</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label>Discount Value</Label><Input type="number" placeholder="20" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Usage Limit</Label><Input type="number" placeholder="500" /></div>
                <div><Label>Expiry Date</Label><Input type="date" /></div>
              </div>
              <Button className="w-full" onClick={() => { toast.success("Coupon created"); setAddOpen(false); }}>Create Coupon</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead><TableHead>Discount</TableHead><TableHead>Usage</TableHead><TableHead>Expires</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockCoupons.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-mono font-semibold">{c.code}</TableCell>
                <TableCell>{c.discount}</TableCell>
                <TableCell>{c.usage}/{c.limit}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{c.expires}</TableCell>
                <TableCell><Badge variant={c.active ? "default" : "secondary"}>{c.active ? "Active" : "Expired"}</Badge></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

const SEGMENTS = [
  { value: "all", label: "All Customers" },
  { value: "regular", label: "Regular Customers (2+ bookings)" },
  { value: "last3months", label: "Booked in Last 3 Months" },
  { value: "last6months", label: "Booked in Last 6 Months" },
  { value: "last12months", label: "Booked in Last 12 Months" },
];

function buildMessage(opts: {
  discountPct: number;
  discountScope: string;
  selectedServices: CampaignService[];
  validFrom: string;
  validTo: string;
  customLink: string;
}): string {
  const { discountPct, discountScope, selectedServices, validFrom, validTo, customLink } = opts;
  if (!discountPct) return "";
  let serviceDesc = "all services";
  if (discountScope === "specific_service" && selectedServices.length === 1) {
    serviceDesc = selectedServices[0].name;
  } else if (discountScope === "multiple_services" && selectedServices.length > 0) {
    serviceDesc = selectedServices.map((s) => s.name).join(", ");
  }
  const period = validFrom && validTo ? ` Valid ${validFrom} to ${validTo}.` : "";
  const link = customLink ? ` Book: ${customLink}` : "";
  return `Hi! GlamBook Special: Get ${discountPct}% off ${serviceDesc} at our salons!${period}${link}`;
}

const SmsManager = () => {
  const queryClient = useQueryClient();
  const [composeOpen, setComposeOpen] = useState(false);

  // Form state
  const [campaignName, setCampaignName] = useState("");
  const [segment, setSegment] = useState("all");
  const [discountPct, setDiscountPct] = useState(10);
  const [discountScope, setDiscountScope] = useState<"all_services" | "specific_service" | "multiple_services">("all_services");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [customLink, setCustomLink] = useState("");
  const [message, setMessage] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  // Fetch customers whenever segment or dialog changes
  const { data: customersData, isFetching: loadingCustomers } = useQuery({
    queryKey: ["campaignCustomers", segment],
    queryFn: () => fetchCampaignCustomers(segment),
    enabled: composeOpen,
  });

  // Fetch all services once when dialog opens
  const { data: allServices = [] } = useQuery({
    queryKey: ["campaignServices"],
    queryFn: fetchCampaignServices,
    enabled: composeOpen,
  });

  const selectedServices = allServices.filter((s) => selectedServiceIds.includes(s.id));

  // Auto-generate message whenever offer fields change, but only if user hasn't typed manually
  useEffect(() => {
    const auto = buildMessage({ discountPct, discountScope, selectedServices, validFrom, validTo, customLink });
    setMessage(auto);
  }, [discountPct, discountScope, selectedServiceIds, validFrom, validTo, customLink, allServices]);

  const { mutate: doSend, isPending: sending } = useMutation({
    mutationFn: () => sendSmsCampaign({
      campaignName,
      segment,
      discountPct,
      discountScope,
      serviceIds: selectedServiceIds,
      validFrom,
      validTo,
      customLink,
      message,
      scheduledAt: scheduledAt || undefined,
      recipientCount: customersData?.count ?? 0,
    }),
    onSuccess: (res) => {
      toast.success(`Campaign scheduled for ${res.recipientCount} recipients`);
      queryClient.invalidateQueries({ queryKey: ["campaignCustomers"] });
      setComposeOpen(false);
      // reset
      setCampaignName(""); setSegment("all"); setDiscountPct(10);
      setDiscountScope("all_services"); setSelectedServiceIds([]);
      setValidFrom(""); setValidTo(""); setCustomLink(""); setMessage(""); setScheduledAt("");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to schedule campaign"),
  });

  const toggleService = (id: string) =>
    setSelectedServiceIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const recipientCount = customersData?.count ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Promotion SMS Management</h2>
        <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> New Campaign</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create SMS Campaign</DialogTitle></DialogHeader>
            <div className="space-y-5 pt-2 max-h-[75vh] overflow-y-auto pr-1">

              {/* Campaign Name */}
              <div>
                <Label>Campaign Name</Label>
                <Input placeholder="e.g. April Offers" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} />
              </div>

              {/* Target Audience */}
              <div className="space-y-1">
                <Label>Target Audience</Label>
                <Select value={segment} onValueChange={setSegment}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SEGMENTS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground flex items-center gap-1 pt-0.5">
                  {loadingCustomers
                    ? <><Loader2 className="h-3 w-3 animate-spin" /> Loading customers…</>
                    : <><Users className="h-3 w-3" /> <span className="font-semibold">{recipientCount}</span> recipient{recipientCount !== 1 ? "s" : ""} matched</>}
                </p>
              </div>

              {/* Discount */}
              <div className="space-y-3 rounded-lg border p-3">
                <p className="text-sm font-medium">Offer / Discount</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Discount %</Label>
                    <Input type="number" min={1} max={100} value={discountPct}
                      onChange={(e) => setDiscountPct(Number(e.target.value))} />
                  </div>
                  <div>
                    <Label className="text-xs">Apply To</Label>
                    <Select value={discountScope} onValueChange={(v) => { setDiscountScope(v as any); setSelectedServiceIds([]); }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_services">All Services</SelectItem>
                        <SelectItem value="specific_service">One Specific Service</SelectItem>
                        <SelectItem value="multiple_services">Multiple Services</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Service picker */}
                {discountScope !== "all_services" && (
                  <div>
                    <Label className="text-xs">Select Service{discountScope === "multiple_services" ? "s" : ""}</Label>
                    <div className="mt-1 max-h-36 overflow-y-auto rounded border divide-y">
                      {allServices.map((svc) => {
                        const checked = selectedServiceIds.includes(svc.id);
                        const isDisabled = discountScope === "specific_service" && selectedServiceIds.length === 1 && !checked;
                        return (
                          <label key={svc.id} className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-sm hover:bg-muted/50 ${isDisabled ? "opacity-40 pointer-events-none" : ""}`}>
                            <Checkbox checked={checked} onCheckedChange={() => toggleService(svc.id)} />
                            <span className="flex-1">{svc.name}</span>
                            <span className="text-xs text-muted-foreground">{svc.salonName}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Offer Valid Period */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Offer Valid From</Label>
                  <Input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Offer Valid To</Label>
                  <Input type="date" value={validTo} onChange={(e) => setValidTo(e.target.value)} />
                </div>
              </div>

              {/* Custom Link */}
              <div>
                <Label>Custom Booking Link</Label>
                <Input placeholder="https://glambook.lk/book" value={customLink} onChange={(e) => setCustomLink(e.target.value)} />
              </div>

              {/* Message */}
              <div>
                <Label>SMS Message</Label>
                <Textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message auto-fills from offer details above…" />
                <p className="text-xs text-muted-foreground mt-1">{message.length}/160 characters</p>
              </div>

              {/* Schedule */}
              <div>
                <Label>Schedule Send (optional)</Label>
                <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
                <p className="text-xs text-muted-foreground mt-1">Leave blank to send immediately</p>
              </div>

              <Button className="w-full" disabled={sending || !campaignName || !message || recipientCount === 0} onClick={() => doSend()}>
                {sending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Scheduling…</> : `Send to ${recipientCount} Recipient${recipientCount !== 1 ? "s" : ""}`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead><TableHead>Recipients</TableHead><TableHead>Sent</TableHead><TableHead>Delivered</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockSmsHistory.map(s => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.campaign}</TableCell>
                <TableCell>{s.recipients}</TableCell>
                <TableCell>{s.sent}</TableCell>
                <TableCell>{s.delivered}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{s.date}</TableCell>
                <TableCell><Badge variant={s.status === "completed" ? "default" : "secondary"}>{s.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

// ─── Main Admin Page ───

const Admin = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("stats");

  useEffect(() => {
    const token = getAccessToken();
    const user = getStoredUser();
    if (!token || !user) {
      toast.info("Sign in as super admin.");
      navigate("/login", { replace: true });
      return;
    }
    if (user.role !== "SUPER_ADMIN") {
      toast.error("Super admin access only.");
      navigate("/", { replace: true });
    }
  }, [navigate]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-background text-foreground transition-colors">
      <div className="bg-black text-white px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-xl md:text-2xl tracking-widest uppercase">GLAMBOOK</span>
            <span className="text-red-500 tracking-widest text-xs uppercase px-3 border-l border-white/20 hidden md:block">System Admin</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/dashboard">
              <span className="text-xs uppercase tracking-widest text-white/50 hover:text-white transition-colors">Salon admin</span>
            </Link>
            <Link to="/">
              <span className="text-xs uppercase tracking-widest text-white/50 hover:text-white transition-colors flex items-center gap-2">
                <LogOut className="h-4 w-4" /> Sign Out
              </span>
            </Link>
          </div>
        </div>
      </div>

      <div className="container py-12 max-w-7xl">
        <h1 className="font-display text-4xl font-bold mb-8 uppercase tracking-widest text-foreground">Admin Dashboard</h1>

        <div className="flex flex-wrap gap-3 mb-10">
          <Button onClick={() => setTab("accounts")} className="bg-blue-600 hover:bg-blue-700 text-white tracking-widest uppercase text-xs h-9">Manage Shops</Button>
          <Button onClick={() => setTab("moderation")} className="bg-yellow-500 hover:bg-yellow-600 text-white tracking-widest uppercase text-xs h-9 gap-2 shadow-sm rounded-none">
            Review Requests <Badge className="bg-black/20 text-white border-0 hover:bg-black/30 px-1.5 py-0 h-5">1</Badge>
          </Button>
          <Button onClick={() => setTab("plans")} className="bg-cyan-500 hover:bg-cyan-600 text-white tracking-widest uppercase text-xs shadow-sm h-9">Subscription Plans</Button>
          <Button onClick={() => setTab("accounts")} className="bg-slate-600 hover:bg-slate-700 text-white tracking-widest uppercase text-xs shadow-sm h-9">Manage Shop Types</Button>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex flex-wrap h-auto gap-8 bg-transparent border-b border-border rounded-none w-full justify-start p-0 mb-8 overflow-x-auto">
            <TabsTrigger value="stats" className="rounded-none border-b-2 bg-transparent px-0 pb-4 pt-2 uppercase tracking-widest text-[10px] md:text-xs font-bold transition-all data-[state=active]:bg-transparent data-[state=active]:border-gold data-[state=active]:text-foreground text-muted-foreground border-transparent hover:text-foreground/80 shadow-none whitespace-nowrap gap-2"><BarChart3 className="h-3.5 w-3.5" /> Statistics</TabsTrigger>
            <TabsTrigger value="plans" className="rounded-none border-b-2 bg-transparent px-0 pb-4 pt-2 uppercase tracking-widest text-[10px] md:text-xs font-bold transition-all data-[state=active]:bg-transparent data-[state=active]:border-gold data-[state=active]:text-foreground text-muted-foreground border-transparent hover:text-foreground/80 shadow-none whitespace-nowrap gap-2"><CreditCard className="h-3.5 w-3.5" /> Plans</TabsTrigger>
            <TabsTrigger value="accounts" className="rounded-none border-b-2 bg-transparent px-0 pb-4 pt-2 uppercase tracking-widest text-[10px] md:text-xs font-bold transition-all data-[state=active]:bg-transparent data-[state=active]:border-gold data-[state=active]:text-foreground text-muted-foreground border-transparent hover:text-foreground/80 shadow-none whitespace-nowrap gap-2"><Users className="h-3.5 w-3.5" /> Accounts</TabsTrigger>
            <TabsTrigger value="moderation" className="rounded-none border-b-2 bg-transparent px-0 pb-4 pt-2 uppercase tracking-widest text-[10px] md:text-xs font-bold transition-all data-[state=active]:bg-transparent data-[state=active]:border-gold data-[state=active]:text-foreground text-muted-foreground border-transparent hover:text-foreground/80 shadow-none whitespace-nowrap gap-2"><Shield className="h-3.5 w-3.5" /> Moderation</TabsTrigger>
            <TabsTrigger value="website" className="rounded-none border-b-2 bg-transparent px-0 pb-4 pt-2 uppercase tracking-widest text-[10px] md:text-xs font-bold transition-all data-[state=active]:bg-transparent data-[state=active]:border-gold data-[state=active]:text-foreground text-muted-foreground border-transparent hover:text-foreground/80 shadow-none whitespace-nowrap gap-2"><Globe className="h-3.5 w-3.5" /> Website</TabsTrigger>
            <TabsTrigger value="promotions" className="rounded-none border-b-2 bg-transparent px-0 pb-4 pt-2 uppercase tracking-widest text-[10px] md:text-xs font-bold transition-all data-[state=active]:bg-transparent data-[state=active]:border-gold data-[state=active]:text-foreground text-muted-foreground border-transparent hover:text-foreground/80 shadow-none whitespace-nowrap gap-2"><Megaphone className="h-3.5 w-3.5" /> Promotions</TabsTrigger>
            <TabsTrigger value="coupons" className="rounded-none border-b-2 bg-transparent px-0 pb-4 pt-2 uppercase tracking-widest text-[10px] md:text-xs font-bold transition-all data-[state=active]:bg-transparent data-[state=active]:border-gold data-[state=active]:text-foreground text-muted-foreground border-transparent hover:text-foreground/80 shadow-none whitespace-nowrap gap-2"><Ticket className="h-3.5 w-3.5" /> Coupons</TabsTrigger>
            <TabsTrigger value="campaigns" className="rounded-none border-b-2 bg-transparent px-0 pb-4 pt-2 uppercase tracking-widest text-[10px] md:text-xs font-bold transition-all data-[state=active]:bg-transparent data-[state=active]:border-gold data-[state=active]:text-foreground text-muted-foreground border-transparent hover:text-foreground/80 shadow-none whitespace-nowrap gap-2"><MessageSquare className="h-3.5 w-3.5" /> Campaigns</TabsTrigger>
          </TabsList>

          <div className="bg-card border border-border shadow-sm p-8 min-h-[500px] rounded-sm">
            <TabsContent value="stats" className="mt-0 outline-none"><SystemStats /></TabsContent>
            <TabsContent value="plans" className="mt-0 outline-none"><SubscriptionManager /></TabsContent>
            <TabsContent value="accounts" className="mt-0 outline-none"><AccountManager /></TabsContent>
            <TabsContent value="moderation" className="mt-0 outline-none"><SalonModeration /></TabsContent>
            <TabsContent value="website" className="mt-0 outline-none"><WebsiteManager /></TabsContent>
            <TabsContent value="promotions" className="mt-0 outline-none"><PromotionManager /></TabsContent>
            <TabsContent value="coupons" className="mt-0 outline-none"><CouponManager /></TabsContent>
            <TabsContent value="campaigns" className="mt-0 outline-none"><CampaignRequestManager /></TabsContent>
          </div>
        </Tabs>
      </div>
    </motion.div>
  );
};

export default Admin;
