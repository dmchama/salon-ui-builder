import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarCheck, Users, Scissors, BarChart3, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import SalonProfileEditor from "@/components/dashboard/SalonProfileEditor";
import ServiceManager from "@/components/dashboard/ServiceManager";
import BookingManager from "@/components/dashboard/BookingManager";
import SettingsPanel from "@/components/dashboard/SettingsPanel";
import TechnicianManager from "@/components/dashboard/TechnicianManager";
import PromotionSMS from "@/components/dashboard/PromotionSMS";
import CouponManager from "@/components/dashboard/CouponManager";

const Dashboard = () => {
  const [tab, setTab] = useState("overview");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-[#FDFDFD]">
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
        <h1 className="font-display text-4xl font-bold mb-12 uppercase tracking-widest text-black">Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {[
            { label: "Bookings", value: "48", icon: CalendarCheck, change: "+12% this month" },
            { label: "Clients", value: "32", icon: Users, change: "+5 new" },
            { label: "Services", value: "5", icon: Scissors, change: "4 active" },
            { label: "Revenue", value: "Rs. 1.2M", icon: BarChart3, change: "+18% this month" },
          ].map(stat => (
            <div key={stat.label} className="bg-white border border-black/5 p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs uppercase tracking-widest text-black/40 font-bold">{stat.label}</span>
                <stat.icon className="h-5 w-5 text-gold" />
              </div>
              <div className="text-3xl font-display font-bold mb-2 tracking-widest">{stat.value}</div>
              <p className="text-xs text-black/40 font-light tracking-wide">{stat.change}</p>
            </div>
          ))}
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex flex-wrap h-auto gap-8 bg-transparent border-b border-black/10 rounded-none w-full justify-start p-0 mb-8 overflow-x-auto">
            {[ 
              { id: 'overview', label: 'Bookings' },
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
                className="rounded-none border-b-2 bg-transparent px-0 pb-4 pt-2 uppercase tracking-widest text-xs font-bold transition-all data-[state=active]:bg-transparent data-[state=active]:border-gold data-[state=active]:text-black text-black/40 border-transparent hover:text-black/70 shadow-none whitespace-nowrap"
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="bg-white border border-black/5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-8 min-h-[500px]">
            <TabsContent value="overview" className="mt-0 outline-none"><BookingManager /></TabsContent>
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
