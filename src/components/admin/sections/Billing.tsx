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

import { StatusBadge } from "@/components/app-shell/parts";

import { MONTH_NAMES, fmtLkr } from "@/lib/admin-format";

/* Moved unchanged from pages/Admin.tsx (feature 004 T015). */

// ── BillingManager ────────────────────────────────────────────────────────


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

  const sendMut     = useMutation({ mutationFn: sendOverageInvoice, onSuccess: () => { toast.success("Invoice sent"); refetchInvoices(); }, onError: () => toast.error("Failed to send") });
  const paidMut     = useMutation({ mutationFn: markOverageInvoicePaid, onSuccess: () => { toast.success("Marked as paid"); refetchInvoices(); }, onError: () => toast.error("Failed to update") });
  const cancelMut   = useMutation({ mutationFn: cancelOverageInvoice, onSuccess: () => { toast.success("Invoice cancelled"); refetchInvoices(); }, onError: () => toast.error("Failed to cancel") });

  const fmtRs = (cents: number) => `Rs. ${(cents / 100).toLocaleString("en-LK", { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-8">
      {/* Overage price setting */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-4 w-4 text-gold-strong" /> Overage Rate</CardTitle>
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
          <CardTitle className="text-base flex items-center gap-2"><RefreshCw className="h-4 w-4 text-gold-strong" /> Generate Overage Invoices</CardTitle>
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
                      <TableCell className="text-right text-sm font-semibold text-amber-700">+{inv.overageCount}</TableCell>
                      <TableCell className="text-right text-sm font-semibold">{fmtRs(inv.totalCents)}</TableCell>
                      <TableCell>
                        <StatusBadge kind="invoice" status={inv.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          {(inv.status === "DRAFT" || inv.status === "SENT") && (
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => sendMut.mutate(inv.id)} disabled={sendMut.isPending}>
                              Send
                            </Button>
                          )}
                          {inv.status === "SENT" && (
                            <Button size="sm" variant="outline" className="h-7 text-xs text-emerald-700 border-emerald-300" onClick={() => paidMut.mutate(inv.id)} disabled={paidMut.isPending}>
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

export default BillingManager;
