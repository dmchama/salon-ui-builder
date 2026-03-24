import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarCheck, Users, Scissors, Settings, BarChart3, LogOut, UserCheck, MessageSquare, Tag } from "lucide-react";
import { Link } from "react-router-dom";
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
    <div className="min-h-screen bg-secondary/20">
      {/* Top bar */}
      <div className="bg-card border-b">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Scissors className="h-5 w-5 text-primary" />
            <span className="font-display font-bold">GlamBook</span>
            <Badge variant="secondary" className="ml-2">Owner Dashboard</Badge>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-1">
                <LogOut className="h-4 w-4" /> Logout
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <h1 className="font-display text-2xl font-bold mb-6">Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Bookings", value: "48", icon: CalendarCheck, change: "+12% this month" },
            { label: "Customers", value: "32", icon: Users, change: "+5 new" },
            { label: "Services", value: "5", icon: Scissors, change: "4 active" },
            { label: "Revenue", value: "Rs. 128,500", icon: BarChart3, change: "+18% this month" },
          ].map(stat => (
            <Card key={stat.label}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold font-display">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="overview">Bookings</TabsTrigger>
            <TabsTrigger value="profile">Salon Profile</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="technicians">Technicians</TabsTrigger>
            <TabsTrigger value="promotions">Promotion SMS</TabsTrigger>
            <TabsTrigger value="coupons">Coupons</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <BookingManager />
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <SalonProfileEditor />
          </TabsContent>

          <TabsContent value="services" className="mt-6">
            <ServiceManager />
          </TabsContent>

          <TabsContent value="technicians" className="mt-6">
            <TechnicianManager />
          </TabsContent>

          <TabsContent value="promotions" className="mt-6">
            <PromotionSMS />
          </TabsContent>

          <TabsContent value="coupons" className="mt-6">
            <CouponManager />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <SettingsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
