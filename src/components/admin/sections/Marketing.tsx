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

const PromotionManager = () => (
  <div className="flex flex-col items-center justify-center py-24 gap-3 text-center text-muted-foreground">
    <Megaphone className="h-10 w-10 opacity-30" />
    <p className="text-sm">Promotions feature coming soon</p>
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

  if (isLoading) return <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /><span className="text-sm">Loading…</span></div>;
  if (isError) return <div className="flex flex-col items-center justify-center py-20 gap-3"><AlertTriangle className="h-8 w-8 text-destructive" /><Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Promo codes</h2>
        <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-2 text-xs">
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>
      {codes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2 text-muted-foreground">
          <Ticket className="h-8 w-8 opacity-30" />
          <p className="text-sm">No promo codes yet</p>
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
                  <TableCell><ToneBadge tone={c.active ? "success" : "neutral"} label={c.active ? "Active" : "Inactive"} /></TableCell>
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

export { PromotionManager, CouponManager };
