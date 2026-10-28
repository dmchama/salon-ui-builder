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

import { ToneBadge } from "@/components/app-shell/parts";

/* Moved unchanged from pages/Admin.tsx (feature 004 T015). */

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
        <h2 className="sr-only">Subscription plans</h2>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-1 text-xs">
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
          <span className="text-sm">Loading plans…</span>
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <AlertTriangle className="h-10 w-10 text-destructive" />
          <p className="text-muted-foreground text-sm">Failed to load plans.</p>
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
                  <ToneBadge tone={p.active ? "success" : "neutral"} label={p.active ? "Active" : "Inactive"} />
                </div>
                <div className="text-2xl font-semibold font-display">
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
            <div className="col-span-3 py-16 text-center text-muted-foreground text-sm">
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

export default SubscriptionManager;
