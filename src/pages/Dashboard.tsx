import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarCheck, Users, Scissors, BarChart3, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SalonProfileEditor from "@/components/dashboard/SalonProfileEditor";
import ServiceManager from "@/components/dashboard/ServiceManager";
import BookingManager from "@/components/dashboard/BookingManager";
import SettingsPanel from "@/components/dashboard/SettingsPanel";
import TechnicianManager from "@/components/dashboard/TechnicianManager";
import PromotionSMS from "@/components/dashboard/PromotionSMS";
import CouponManager from "@/components/dashboard/CouponManager";

const SalonStatistics = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="rounded-none border-border shadow-sm"><CardHeader><CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Revenue by Service</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[{ plan: "Haircut & Styling", count: "Rs. 45,000", pct: 40, color: "bg-blue-500" }, { plan: "Hair Coloring", count: "Rs. 32,000", pct: 30, color: "bg-green-500" }, { plan: "Facials", count: "Rs. 25,000", pct: 20, color: "bg-yellow-500" }, { plan: "Bridal", count: "Rs. 18,000", pct: 10, color: "bg-red-500" }].map(p => (
            <div key={p.plan} className="space-y-2">
              <div className="flex justify-between text-sm tracking-wide"><span>{p.plan}</span><span className="text-muted-foreground">{p.count}</span></div>
              <div className="h-1.5 bg-secondary rounded-none"><div className={`h-full ${p.color} rounded-none`} style={{ width: `${p.pct}%` }} /></div>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="rounded-none border-border shadow-sm"><CardHeader><CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Weekly Bookings Trend</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {[{ month: "Week 1", rev: "32 Bookings" }, { month: "Week 2", rev: "45 Bookings" }, { month: "Week 3", rev: "28 Bookings" }, { month: "Week 4", rev: "48 Bookings" }].map(m => (
            <div key={m.month} className="flex justify-between text-sm py-3 border-b border-border last:border-0 tracking-wide">
              <span>{m.month}</span><span className="font-semibold">{m.rev}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  </div>
);

const Dashboard = () => {
  const [tab, setTab] = useState("overview");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-background text-foreground transition-colors">
      {/* Top bar */}
      <div className="bg-black text-white px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-xl md:text-2xl tracking-widest uppercase">GLAMBOOK</span>
            <span className="text-gold tracking-widest text-xs uppercase px-3 border-l border-white/20 hidden md:block">Owner Portal</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/">
              <span className="text-xs uppercase tracking-widest text-white/50 hover:text-white transition-colors flex items-center gap-2">
                <LogOut className="h-4 w-4" /> Exit Portal
              </span>
            </Link>
          </div>
        </div>
      </div>

      <div className="container py-12 max-w-7xl">
        <h1 className="font-display text-4xl font-bold mb-8 uppercase tracking-widest text-foreground">Dashboard</h1>

        <div className="flex flex-wrap gap-3 mb-10">
          <Button onClick={() => setTab("services")} className="bg-blue-600 hover:bg-blue-700 text-white tracking-widest uppercase text-xs h-9 rounded-none">New Service</Button>
          <Button onClick={() => setTab("bookings")} className="bg-yellow-500 hover:bg-yellow-600 text-white tracking-widest uppercase text-xs h-9 gap-2 shadow-sm rounded-none">
            Review Bookings <Badge className="bg-black/20 text-white border-0 hover:bg-black/30 px-1.5 py-0 h-5 rounded-none">2</Badge>
          </Button>
          <Button onClick={() => setTab("coupons")} className="bg-cyan-500 hover:bg-cyan-600 text-white tracking-widest uppercase text-xs shadow-sm h-9 rounded-none">Create Coupon</Button>
          <Button onClick={() => setTab("promotions")} className="bg-slate-600 hover:bg-slate-700 text-white tracking-widest uppercase text-xs shadow-sm h-9 rounded-none">Promote Salon</Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {[
            { label: "Bookings", value: "48", icon: CalendarCheck, change: "+12% this month", colorClass: "text-blue-600 dark:text-blue-400", borderClass: "" },
            { label: "Clients", value: "32", icon: Users, change: "+5 new", colorClass: "text-green-600 dark:text-green-400", borderClass: "" },
            { label: "Services", value: "5", icon: Scissors, change: "4 active", colorClass: "text-red-500 dark:text-red-400", borderClass: "" },
            { label: "Revenue", value: "Rs. 1.2M", icon: BarChart3, change: "+18% this month", colorClass: "text-yellow-600 dark:text-yellow-400", borderClass: "border border-yellow-400/80 dark:border-yellow-500/80 shadow-sm" },
          ].map(stat => (
            <div key={stat.label} className={`bg-card border border-border p-8 shadow-sm transition-transform hover:-translate-y-1 rounded-sm ${stat.borderClass}`}>
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold">{stat.label}</span>
                <stat.icon className={`h-5 w-5 ${stat.colorClass}`} />
              </div>
              <div className={`text-3xl font-display font-bold mb-2 tracking-widest ${stat.colorClass}`}>{stat.value}</div>
              <p className="text-xs text-muted-foreground font-light tracking-wide">{stat.change}</p>
            </div>
          ))}
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex flex-wrap h-auto gap-8 bg-transparent border-b border-border rounded-none w-full justify-start p-0 mb-8 overflow-x-auto">
            {[ 
              { id: 'overview', label: 'Statistics' },
              { id: 'bookings', label: 'Bookings' },
              { id: 'profile', label: 'Salon Profile' },
              { id: 'services', label: 'Services' },
              { id: 'technicians', label: 'Technicians' },
              { id: 'promotions', label: 'Promotions' },
              { id: 'coupons', label: 'Coupons' },
              { id: 'settings', label: 'Settings' }
            ].map(t => (
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
            <TabsContent value="overview" className="mt-0 outline-none"><SalonStatistics /></TabsContent>
            <TabsContent value="bookings" className="mt-0 outline-none"><BookingManager /></TabsContent>
            <TabsContent value="profile" className="mt-0 outline-none"><SalonProfileEditor /></TabsContent>
            <TabsContent value="services" className="mt-0 outline-none"><ServiceManager /></TabsContent>
            <TabsContent value="technicians" className="mt-0 outline-none"><TechnicianManager /></TabsContent>
            <TabsContent value="promotions" className="mt-0 outline-none"><PromotionSMS /></TabsContent>
            <TabsContent value="coupons" className="mt-0 outline-none"><CouponManager /></TabsContent>
            <TabsContent value="settings" className="mt-0 outline-none"><SettingsPanel /></TabsContent>
          </div>
        </Tabs>
      </div>
    </motion.div>
  );
};

export default Dashboard;
