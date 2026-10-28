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
import SubscriptionManager from "@/components/admin/sections/Plans";
import AccountManager from "@/components/admin/sections/Accounts";
import BillingManager from "@/components/admin/sections/Billing";
import SystemStats from "@/components/admin/sections/Overview";
import SalonModeration from "@/components/admin/sections/Salons";
import WebsiteManager from "@/components/admin/sections/Website";
import { PromotionManager, CouponManager } from "@/components/admin/sections/Marketing";

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
