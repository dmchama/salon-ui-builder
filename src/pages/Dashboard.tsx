import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarCheck, Users, Scissors, BarChart3, LogOut, Loader2, Plus, GitBranch, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createSalon, setDefaultBranch } from "@/api/salon-api";
import Seo from "@/components/Seo";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SalonProfileEditor from "@/components/dashboard/SalonProfileEditor";
import ServiceManager from "@/components/dashboard/ServiceManager";
import BookingManager from "@/components/dashboard/BookingManager";
import SettingsPanel from "@/components/dashboard/SettingsPanel";
import TechnicianManager from "@/components/dashboard/TechnicianManager";
import PromotionSMS from "@/components/dashboard/PromotionSMS";
import CouponManager from "@/components/dashboard/CouponManager";
import { clearAuth, getAccessToken, getStoredUser } from "@/lib/auth-storage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchOwnerDashboard,
  fetchOwnerInsights,
  type OwnerDashboardInsights,
} from "@/api/salon-owner-api";

const COLORS = ["bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-red-500", "bg-purple-500", "bg-cyan-500"];

// ── Branch Selector + Add Branch ────────────────────────────────────────────

type BranchSelectorProps = {
  salons: { id: string; name: string; status: string; isDefault: boolean; _count: { bookings: number } }[];
  selectedSalonId: string | null;
  onSelect: (id: string) => void;
  onCreated: (salonId: string) => void;
  maxSalons: number;
  planName: string | null;
};

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function BranchSelector({ salons, selectedSalonId, onSelect, onCreated, maxSalons, planName }: BranchSelectorProps) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");

  const defaultMut = useMutation({
    mutationFn: (id: string) => setDefaultBranch(id),
    onSuccess: (salon) => {
      qc.invalidateQueries({ queryKey: ["owner-dashboard"] });
      toast.success(`"${salon.name}" is now the default branch.`);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to set default"),
  });

  const selectedSalon = salons.find((s) => s.id === selectedSalonId);
  const isSelectedDefault = selectedSalon?.isDefault ?? false;

  const canAddBranch = maxSalons === -1 || salons.length < maxSalons;

  const createMut = useMutation({
    mutationFn: () => createSalon({ name: name.trim(), slug: slug.trim(), city: city.trim() || undefined, country: country.trim() || undefined }),
    onSuccess: async (salon) => {
      await qc.invalidateQueries({ queryKey: ["owner-dashboard"] });
      qc.invalidateQueries({ queryKey: ["salons", "mine"] });
      setOpen(false);
      setName(""); setSlug(""); setCity(""); setCountry("");
      onCreated(salon.id);
      toast.success(`Branch "${salon.name}" created — now fill in the profile and publish it.`);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to create branch"),
  });

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
      <div className="space-y-2 flex-1">
        <div className="flex items-center gap-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Active Branch</p>
          <span className="text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded bg-secondary text-muted-foreground">
            {salons.length} / {maxSalons === -1 ? "∞" : maxSalons} branches
            {planName && ` · ${planName}`}
          </span>
        </div>
        {salons.length === 0 ? (
          <p className="text-sm text-muted-foreground">Create your first branch to get started.</p>
        ) : (
          <div className="flex items-center gap-2">
            <Select value={selectedSalonId ?? ""} onValueChange={onSelect}>
              <SelectTrigger className="w-[300px] rounded-none">
                <SelectValue placeholder="Choose branch" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                {salons.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="flex items-center gap-2">
                      <GitBranch className="h-3 w-3 opacity-50" />
                      {s.name}
                      {s.isDefault && (
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      )}
                      <span className={`text-[10px] uppercase font-bold ml-1 ${s.status === "PUBLISHED" ? "text-green-600" : s.status === "SUSPENDED" ? "text-red-500" : "text-muted-foreground"}`}>
                        {s.status}
                      </span>
                      <span className="text-muted-foreground text-xs">· {s._count.bookings} bookings</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSalonId && !isSelectedDefault && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-none text-xs gap-1.5 h-9 border-amber-300 text-amber-700 hover:bg-amber-50"
                disabled={defaultMut.isPending}
                onClick={() => defaultMut.mutate(selectedSalonId)}
                title="Make this the default branch shown to customers"
              >
                {defaultMut.isPending
                  ? <Loader2 className="h-3 w-3 animate-spin" />
                  : <Star className="h-3 w-3" />}
                Set as Default
              </Button>
            )}
            {isSelectedDefault && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium px-2">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> Default
              </span>
            )}
          </div>
        )}
      </div>

      {canAddBranch ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2 rounded-none text-xs uppercase tracking-widest h-9 self-end">
              <Plus className="h-3.5 w-3.5" /> Add Branch
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-none max-w-md">
            <DialogHeader>
              <DialogTitle className="uppercase tracking-widest text-sm">New Branch</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Branch Name</Label>
                <Input
                  placeholder="e.g. Glamour Studio Colombo"
                  value={name}
                  onChange={e => { setName(e.target.value); setSlug(slugify(e.target.value)); }}
                />
              </div>
              <div>
                <Label>URL Slug</Label>
                <Input
                  placeholder="glamour-studio-colombo"
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">Public URL: /salons/{slug || "your-slug"}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>City</Label>
                  <Input placeholder="Colombo" value={city} onChange={e => setCity(e.target.value)} />
                </div>
                <div>
                  <Label>Country</Label>
                  <Input placeholder="Sri Lanka" value={country} onChange={e => setCountry(e.target.value)} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">The branch starts in <strong>Draft</strong> status. An admin must publish it before customers can book.</p>
              <Button
                className="w-full rounded-none uppercase tracking-widest text-xs"
                disabled={!name.trim() || !slug.trim() || createMut.isPending}
                onClick={() => createMut.mutate()}
              >
                {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Branch
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        <div className="text-xs text-muted-foreground self-end pb-1">
          Branch limit reached · upgrade plan to add more
        </div>
      )}
    </div>
  );
}

function formatRs(cents: number) {
  return `Rs. ${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function SalonStatistics({ insights }: { insights: OwnerDashboardInsights }) {
  const maxRev = Math.max(...insights.revenueByService.map((r) => r.totalCents), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="rounded-none border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Revenue by service (completed)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {insights.revenueByService.length === 0 ? (
              <p className="text-sm text-muted-foreground tracking-wide">
                No completed bookings yet. Revenue appears here once you mark bookings as completed.
              </p>
            ) : (
              insights.revenueByService.map((r, i) => {
                const pct = Math.round((r.totalCents / maxRev) * 100);
                return (
                  <div key={r.serviceId} className="space-y-2">
                    <div className="flex justify-between text-sm tracking-wide">
                      <span>{r.name}</span>
                      <span className="text-muted-foreground">{formatRs(r.totalCents)}</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-none">
                      <div
                        className={`h-full ${COLORS[i % COLORS.length]} rounded-none`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
        <Card className="rounded-none border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Weekly bookings (by start time)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {insights.bookingsByWeek.map((m) => (
              <div
                key={m.weekLabel}
                className="flex justify-between text-sm py-3 border-b border-border last:border-0 tracking-wide"
              >
                <span>{m.weekLabel} (oldest → newest)</span>
                <span className="font-semibold">
                  {m.count} {m.count === 1 ? "booking" : "bookings"}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card className="rounded-none border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Last 7 days
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {insights.bookingsLast7Days.map((d) => (
            <div
              key={d.date}
              className="border border-border px-3 py-2 text-xs uppercase tracking-widest"
            >
              <span className="text-muted-foreground">{d.date}</span>
              <span className="ml-2 font-bold">{d.count}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const [selectedSalonId, setSelectedSalonId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["owner-dashboard"],
    queryFn: fetchOwnerDashboard,
    enabled: Boolean(getAccessToken()),
  });

  const { data: insights } = useQuery({
    queryKey: ["owner-insights", selectedSalonId],
    queryFn: () => fetchOwnerInsights(selectedSalonId!),
    enabled: Boolean(selectedSalonId),
  });

  useEffect(() => {
    const token = getAccessToken();
    const user = getStoredUser();
    if (!token || !user) {
      toast.info("Sign in to open the owner dashboard.");
      navigate("/login", { replace: true });
      return;
    }
    if (user.role !== "SALON_ADMIN") {
      toast.error("Only salon admins can access this dashboard.");
      navigate("/", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (!data?.salons.length) {
      setSelectedSalonId(null);
      return;
    }
    setSelectedSalonId((prev) => {
      if (prev && data.salons.some((s) => s.id === prev)) return prev;
      return data.salons[0].id;
    });
  }, [data?.salons]);

  const handleLogout = () => {
    clearAuth();
    toast.success("Signed out.");
    navigate("/login", { replace: true });
  };

  const selectedSalon = data?.salons.find((s) => s.id === selectedSalonId) ?? null;
  const pendingForSalon = selectedSalonId
    ? (insights?.pendingBySalonId[selectedSalonId] ?? 0)
    : 0;

  const statCards =
    selectedSalon && insights
      ? [
          {
            label: "Bookings",
            value: String(selectedSalon._count.bookings),
            icon: CalendarCheck,
            change: `${pendingForSalon} pending review`,
            colorClass: "text-blue-600 dark:text-blue-400",
            borderClass: "",
          },
          {
            label: "Guest contacts",
            value: String(insights.totals.uniqueGuestContacts),
            icon: Users,
            change: "Unique emails / registered customers",
            colorClass: "text-green-600 dark:text-green-400",
            borderClass: "",
          },
          {
            label: "Active services",
            value: String(selectedSalon._count.services),
            icon: Scissors,
            change: "Listed for this salon",
            colorClass: "text-red-500 dark:text-red-400",
            borderClass: "",
          },
          {
            label: "Revenue (completed)",
            value: formatRs(insights.totals.completedRevenueCents),
            icon: BarChart3,
            change: "All your salons · from completed visits",
            colorClass: "text-yellow-600 dark:text-yellow-400",
            borderClass: "border border-yellow-400/80 dark:border-yellow-500/80 shadow-sm",
          },
        ]
      : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background text-foreground transition-colors"
    >
      <Seo title="Owner Dashboard" description="Manage your salon on SaloonBooking." path="/dashboard" noindex />
      <div className="bg-black text-white px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-xl md:text-2xl tracking-widest uppercase">SaloonBooking</span>
            <span className="text-gold tracking-widest text-xs uppercase px-3 border-l border-white/20 hidden md:block">
              Owner Portal
            </span>
          </div>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs uppercase tracking-widest text-white/50 hover:text-white transition-colors flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      </div>

      <div className="container py-12 max-w-7xl">
        <h1 className="font-display text-4xl font-bold mb-8 uppercase tracking-widest text-foreground">
          Dashboard
        </h1>

        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground py-12">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm uppercase tracking-widest">Loading your data…</span>
          </div>
        )}

        {isError && (
          <p className="text-sm text-destructive py-8">
            {error instanceof Error ? error.message : "Could not load dashboard."}
          </p>
        )}

        {data && !isLoading && (
          <>
            <BranchSelector
              salons={data.salons}
              selectedSalonId={selectedSalonId}
              onSelect={setSelectedSalonId}
              onCreated={(id) => { setSelectedSalonId(id); setTab("profile"); }}
              maxSalons={data.planLimits.maxSalons}
              planName={data.subscription?.plan.name ?? null}
            />

            <div className="flex flex-wrap gap-3 mb-10">
              <Button
                onClick={() => setTab("services")}
                className="bg-blue-600 hover:bg-blue-700 text-white tracking-widest uppercase text-xs h-9 rounded-none"
              >
                New Service
              </Button>
              <Button
                onClick={() => setTab("bookings")}
                className="bg-yellow-500 hover:bg-yellow-600 text-white tracking-widest uppercase text-xs h-9 gap-2 shadow-sm rounded-none"
              >
                Review Bookings{" "}
                {pendingForSalon > 0 && (
                  <Badge className="bg-black/20 text-white border-0 hover:bg-black/30 px-1.5 py-0 h-5 rounded-none">
                    {pendingForSalon}
                  </Badge>
                )}
              </Button>
              <Button
                onClick={() => setTab("coupons")}
                className="bg-cyan-500 hover:bg-cyan-600 text-white tracking-widest uppercase text-xs shadow-sm h-9 rounded-none"
              >
                Coupons
              </Button>
              <Button
                onClick={() => setTab("promotions")}
                className="bg-slate-600 hover:bg-slate-700 text-white tracking-widest uppercase text-xs shadow-sm h-9 rounded-none"
              >
                Promotions
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {statCards.map((stat) => (
                <div
                  key={stat.label}
                  className={`bg-card border border-border p-8 shadow-sm transition-transform hover:-translate-y-1 rounded-sm ${stat.borderClass}`}
                >
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
                      {stat.label}
                    </span>
                    <stat.icon className={`h-5 w-5 ${stat.colorClass}`} />
                  </div>
                  <div className={`text-3xl font-display font-bold mb-2 tracking-widest ${stat.colorClass}`}>
                    {stat.value}
                  </div>
                  <p className="text-xs text-muted-foreground font-light tracking-wide">{stat.change}</p>
                </div>
              ))}
            </div>

            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="flex flex-wrap h-auto gap-8 bg-transparent border-b border-border rounded-none w-full justify-start p-0 mb-8 overflow-x-auto">
                {[
                  { id: "overview", label: "Statistics" },
                  { id: "bookings", label: "Bookings" },
                  { id: "profile", label: "Salon Profile" },
                  { id: "services", label: "Services" },
                  { id: "technicians", label: "Technicians" },
                  { id: "promotions", label: "SMS Campaigns" },
                  { id: "coupons", label: "Coupons" },
                  { id: "settings", label: "Settings" },
                ].map((t) => (
                  <TabsTrigger
                    key={t.id}
                    value={t.id}
                    className="rounded-none border-b-2 bg-transparent px-0 pb-4 pt-2 uppercase tracking-widest text-xs font-bold transition-all data-[state=active]:bg-transparent data-[state=active]:border-gold data-[state=active]:text-foreground text-muted-foreground border-transparent hover:text-foreground/80 shadow-none whitespace-nowrap"
                  >
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="bg-card border border-border shadow-sm p-8 min-h-[500px] rounded-sm">
                <TabsContent value="overview" className="mt-0 outline-none">
                  {insights ? <SalonStatistics insights={insights} /> : null}
                </TabsContent>
                <TabsContent value="bookings" className="mt-0 outline-none">
                  <BookingManager salonId={selectedSalonId} />
                </TabsContent>
                <TabsContent value="profile" className="mt-0 outline-none">
                  <SalonProfileEditor salonId={selectedSalonId} />
                </TabsContent>
                <TabsContent value="services" className="mt-0 outline-none">
                  <ServiceManager salonId={selectedSalonId} />
                </TabsContent>
                <TabsContent value="technicians" className="mt-0 outline-none">
                  <TechnicianManager salonId={selectedSalonId} />
                </TabsContent>
                <TabsContent value="promotions" className="mt-0 outline-none">
                  <PromotionSMS salonId={selectedSalonId} />
                </TabsContent>
                <TabsContent value="coupons" className="mt-0 outline-none">
                  <CouponManager />
                </TabsContent>
                <TabsContent value="settings" className="mt-0 outline-none">
                  <SettingsPanel subscription={data.subscription} />
                </TabsContent>
              </div>
            </Tabs>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default Dashboard;
