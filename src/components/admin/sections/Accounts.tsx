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

/* Moved unchanged from pages/Admin.tsx (feature 004 T015). */

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
                      {/* PENDING → Approve or Suspend */}
                      {o.status === "pending" && (
                        <>
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
      <RegistrationPaymentDialog ownerId={reviewOwnerId} onClose={() => setReviewOwnerId(null)} />
    </div>
  );
};

export default AccountManager;
