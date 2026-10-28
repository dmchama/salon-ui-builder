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

export default SalonModeration;
