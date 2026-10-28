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



// â”€â”€â”€ Sub-Components â”€â”€â”€

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
          <span className="uppercase tracking-widest text-sm">Loading plansâ€¦</span>
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
                  {(p.features ?? []).length} feature{(p.features ?? []).length !== 1 ? "s" : ""} Â· {p.subscriberCount} subscriber{p.subscriberCount !== 1 ? "s" : ""}
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
          <DialogHeader><DialogTitle>Edit Plan â€” {editPlan?.name}</DialogTitle></DialogHeader>
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

const PAYMENT_BADGE: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-yellow-500 text-black" },
  APPROVED: { label: "Approved", className: "bg-green-600 text-white" },
  REJECTED: { label: "Rejected", className: "bg-red-500 text-white" },
};

const AccountManager = () => {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [reviewOwnerId, setReviewOwnerId] = useState<string | null>(null);

  const { data: owners = [], isLoading, isError, refetch, isFetching } = useQuery<SalonOwnerDto[]>({
    queryKey: ["admin-owners"],
    queryFn: fetchOwners,
    staleTime: 30_000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-owners"] });

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

  const anyPending = suspendMutation.isPending || activateMutation.isPending;
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
          <span className="uppercase tracking-widest text-sm">Loading accountsâ€¦</span>
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
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-12 text-sm tracking-wide">
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
                    {o.registrationPayment
                      ? <Badge className={`${PAYMENT_BADGE[o.registrationPayment.status]?.className ?? ""} border-0`}>
                          {PAYMENT_BADGE[o.registrationPayment.status]?.label ?? o.registrationPayment.status}
                        </Badge>
                      : <span className="text-xs text-muted-foreground">No receipt</span>
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
                      {/* Receipt review — approval of PENDING owners happens in the dialog (spec 002 AC17) */}
                      {o.registrationPayment && (
                        <Button variant="ghost" size="sm" onClick={() => setReviewOwnerId(o.id)} title="Review payment" className="gap-1 text-xs">
                          <Receipt className="h-4 w-4" /> {o.status === "pending" && o.registrationPayment.status === "PENDING" ? "Review payment" : "Receipt"}
                        </Button>
                      )}
                      {/* PENDING â†’ Approve or Suspend */}
                      {o.status === "pending" && (
                        <>
                          <Button variant="ghost" size="sm" disabled={anyPending} onClick={() => suspendMutation.mutate(o.id)} title="Reject / suspend" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            {suspendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                          </Button>
                        </>
                      )}
                      {/* ACTIVE â†’ Suspend only */}
                      {o.status === "active" && (
                        <Button variant="ghost" size="sm" disabled={anyPending} onClick={() => suspendMutation.mutate(o.id)} title="Suspend account" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                          {suspendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                        </Button>
                      )}
                      {/* SUSPENDED â†’ Activate only */}
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
      <RegistrationPaymentDialog ownerId={reviewOwnerId} onClose={() => setReviewOwnerId(null)} />
    </div>
  );
};

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmtLkr(cents: number) {
  return `Rs. ${(cents / 100).toLocaleString("en-LK")}`;
}



// ── BillingManager ────────────────────────────────────────────────────────

const invoiceStatusColors: Record<OverageInvoiceStatus, string> = {
  DRAFT:     "bg-secondary text-muted-foreground",
  SENT:      "bg-blue-100 text-blue-800",
  PAID:      "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-700",
};

const BillingManager = () => {
  const qc = useQueryClient();
  const now = new Date();
  const [genYear, setGenYear]   = useState(now.getFullYear());
  const [genMonth, setGenMonth] = useState(now.getMonth() + 1);
  const [filterStatus, setFilterStatus] = useState<OverageInvoiceStatus | "ALL">("ALL");
  const [priceInput, setPriceInput]     = useState("");

  const { data: priceData, isLoading: priceLoading } = useQuery<{ priceCents: number }>({
    queryKey: ["overage-price"],
    queryFn: fetchOveragePrice,
  });

  const { data: invoices = [], isLoading: invLoading, refetch: refetchInvoices } = useQuery<OverageInvoiceDto[]>({
    queryKey: ["overage-invoices", filterStatus],
    queryFn: () => fetchOverageInvoices(filterStatus === "ALL" ? undefined : filterStatus),
  });

  const savePriceMut = useMutation({
    mutationFn: () => saveOveragePrice(Math.round(parseFloat(priceInput) * 100)),
    onSuccess: () => { toast.success("Overage price updated"); qc.invalidateQueries({ queryKey: ["overage-price"] }); },
    onError: () => toast.error("Failed to update price"),
  });

  const generateMut = useMutation({
    mutationFn: () => generateOverageInvoices(genYear, genMonth),
    onSuccess: (res) => { toast.success(`Generated ${res.generated} invoice(s)`); refetchInvoices(); },
    onError: () => toast.error("Failed to generate invoices"),
  });

  const sendMut     = useMutation({ mutationFn: sendOverageInvoice,      onSuccess: () => { toast.success("Invoice sent"); refetchInvoices(); }, onError: () => toast.error("Failed to send") });
  const paidMut     = useMutation({ mutationFn: markOverageInvoicePaid,  onSuccess: () => { toast.success("Marked as paid"); refetchInvoices(); }, onError: () => toast.error("Failed to update") });
  const cancelMut   = useMutation({ mutationFn: cancelOverageInvoice,    onSuccess: () => { toast.success("Invoice cancelled"); refetchInvoices(); }, onError: () => toast.error("Failed to cancel") });

  const fmtRs = (cents: number) => `Rs. ${(cents / 100).toLocaleString("en-LK", { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-8">
      {/* Overage price setting */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-4 w-4 text-rose-500" /> Overage Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Charged per booking that exceeds a salon owner's monthly plan quota.
            {!priceLoading && priceData && (
              <span className="ml-2 font-semibold text-foreground">Current: {fmtRs(priceData.priceCents)} / booking</span>
            )}
          </p>
          <div className="flex gap-3 max-w-xs">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rs.</span>
              <Input
                className="pl-9"
                type="number"
                min="0"
                step="0.01"
                placeholder={priceData ? (priceData.priceCents / 100).toString() : "0.00"}
                value={priceInput}
                onChange={e => setPriceInput(e.target.value)}
              />
            </div>
            <Button onClick={() => savePriceMut.mutate()} disabled={!priceInput || savePriceMut.isPending}>
              {savePriceMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generate invoices */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><RefreshCw className="h-4 w-4 text-blue-500" /> Generate Overage Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">Scan all owners for the selected month and create invoices for any who exceeded their booking quota.</p>
          <div className="flex gap-3 items-center flex-wrap">
            <Select value={genMonth.toString()} onValueChange={v => setGenMonth(Number(v))}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MONTH_NAMES.map((m, i) => <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="number" className="w-28" value={genYear} onChange={e => setGenYear(Number(e.target.value))} />
            <Button onClick={() => generateMut.mutate()} disabled={generateMut.isPending}>
              {generateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Generate
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoice list */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Overage Invoices</CardTitle>
          <Select value={filterStatus} onValueChange={v => setFilterStatus(v as any)}>
            <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="SENT">Sent</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {invLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No invoices found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Owner</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Quota</TableHead>
                  <TableHead className="text-right">Total Bookings</TableHead>
                  <TableHead className="text-right">Overage</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map(inv => {
                  const ownerName = [inv.owner.firstName, inv.owner.lastName].filter(Boolean).join(" ") || inv.owner.email;
                  const period = `${MONTH_NAMES[inv.month - 1]} ${inv.year}`;
                  return (
                    <TableRow key={inv.id}>
                      <TableCell>
                        <div className="font-medium text-sm">{ownerName}</div>
                        <div className="text-xs text-muted-foreground">{inv.owner.email}</div>
                      </TableCell>
                      <TableCell className="text-sm">{period}</TableCell>
                      <TableCell className="text-right text-sm">{inv.bookingLimit}</TableCell>
                      <TableCell className="text-right text-sm">{inv.totalBookings}</TableCell>
                      <TableCell className="text-right text-sm font-semibold text-rose-600">+{inv.overageCount}</TableCell>
                      <TableCell className="text-right text-sm font-bold">{fmtRs(inv.totalCents)}</TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] uppercase tracking-wider ${invoiceStatusColors[inv.status]}`}>{inv.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          {(inv.status === "DRAFT" || inv.status === "SENT") && (
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => sendMut.mutate(inv.id)} disabled={sendMut.isPending}>
                              Send
                            </Button>
                          )}
                          {inv.status === "SENT" && (
                            <Button size="sm" variant="outline" className="h-7 text-xs text-green-700 border-green-300" onClick={() => paidMut.mutate(inv.id)} disabled={paidMut.isPending}>
                              Paid
                            </Button>
                          )}
                          {(inv.status === "DRAFT" || inv.status === "SENT") && (
                            <Button size="sm" variant="outline" className="h-7 text-xs text-destructive border-destructive/30" onClick={() => cancelMut.mutate(inv.id)} disabled={cancelMut.isPending}>
                              Cancel
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

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
        <span className="uppercase tracking-widest text-sm">Loading statisticsâ€¦</span>
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
                    {m.revenueCents > 0 ? fmtLkr(m.revenueCents) : <span className="text-muted-foreground">â€”</span>}
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
                    {m.count > 0 ? m.count : <span className="text-muted-foreground">â€”</span>}
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
          <span className="uppercase tracking-widest text-sm">Loading salonsâ€¦</span>
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
                      {[s.city, s.country].filter(Boolean).join(", ") || "â€”"}
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
                        {/* DRAFT â†’ Publish or Suspend */}
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
                        {/* PUBLISHED â†’ Suspend only */}
                        {s.status === "PUBLISHED" && (
                          <Button variant="ghost" size="sm" disabled={anyMutating} onClick={() => suspendMutation.mutate(s.id)} title="Suspend salon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            {suspendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                          </Button>
                        )}
                        {/* SUSPENDED â†’ Re-publish or move to Draft */}
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
        <span className="uppercase tracking-widest text-sm">Loading website settingsâ€¦</span>
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

      {settings && <PaymentDetailsForm current={settings.paymentDetails} />}

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

const PromotionManager = () => (
  <div className="flex flex-col items-center justify-center py-24 gap-3 text-center text-muted-foreground">
    <Megaphone className="h-10 w-10 opacity-30" />
    <p className="text-sm uppercase tracking-widest">Promotions feature coming soon</p>
    <p className="text-xs max-w-xs">Banner and placement promotions are not yet supported in the backend.</p>
  </div>
);

const CouponManager = () => {
  const { data: codes = [], isLoading, isError, refetch, isFetching } = useQuery<AdminPromoCodeDto[]>({
    queryKey: ["admin-promo-codes"],
    queryFn: fetchAdminPromoCodes,
    staleTime: 30_000,
  });

  const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString() : "—";

  if (isLoading) return <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /><span className="text-sm uppercase tracking-widest">Loading…</span></div>;
  if (isError)  return <div className="flex flex-col items-center justify-center py-20 gap-3"><AlertTriangle className="h-8 w-8 text-destructive" /><Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Promo Codes</h2>
        <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-2 text-xs uppercase tracking-widest">
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>
      {codes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2 text-muted-foreground">
          <Ticket className="h-8 w-8 opacity-30" />
          <p className="text-sm uppercase tracking-widest">No promo codes yet</p>
          <p className="text-xs">Codes are generated automatically when SMS campaigns are approved.</p>
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Salon</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Valid To</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {codes.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-semibold">{c.code}</TableCell>
                  <TableCell className="text-sm">{c.salonName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.campaignName ?? "—"}</TableCell>
                  <TableCell>{c.discountPct}%</TableCell>
                  <TableCell>{c.usageCount}{c.usageLimit ? `/${c.usageLimit}` : ""}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{fmt(c.validTo)}</TableCell>
                  <TableCell><Badge variant={c.active ? "default" : "secondary"}>{c.active ? "Active" : "Inactive"}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
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
      <Seo title="System Admin" description="SaloonBooking system administration." path="/admin" noindex />
      <div className="bg-black text-white px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-xl md:text-2xl tracking-widest uppercase">SaloonBooking</span>
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
          <Button onClick={() => setTab("moderation")} className="bg-yellow-500 hover:bg-yellow-600 text-white tracking-widest uppercase text-xs h-9 gap-2 shadow-sm">
            Review Requests <Badge className="bg-black/20 text-white border-0 hover:bg-black/30 px-1.5 py-0 h-5">1</Badge>
          </Button>
          <Button onClick={() => setTab("plans")} className="bg-cyan-500 hover:bg-cyan-600 text-white tracking-widest uppercase text-xs shadow-sm h-9">Subscription Plans</Button>
          <Button onClick={() => setTab("accounts")} className="bg-slate-600 hover:bg-slate-700 text-white tracking-widest uppercase text-xs shadow-sm h-9">Manage Salon Accounts</Button>
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
            <TabsTrigger value="billing" className="rounded-none border-b-2 bg-transparent px-0 pb-4 pt-2 uppercase tracking-widest text-[10px] md:text-xs font-bold transition-all data-[state=active]:bg-transparent data-[state=active]:border-gold data-[state=active]:text-foreground text-muted-foreground border-transparent hover:text-foreground/80 shadow-none whitespace-nowrap gap-2"><DollarSign className="h-3.5 w-3.5" /> Billing</TabsTrigger>
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
            <TabsContent value="billing" className="mt-0 outline-none"><BillingManager /></TabsContent>
          </div>
        </Tabs>
      </div>
    </motion.div>
  );
};

export default Admin;
