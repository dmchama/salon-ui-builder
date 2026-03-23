import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarCheck, Users, Scissors, Settings, BarChart3, LogOut } from "lucide-react";
import { Link } from "react-router-dom";

const mockBookings = [
  { id: "b1", customer: "Ama Perera", service: "Haircut & Styling", date: "2026-03-25", time: "10:00 AM", status: "confirmed" },
  { id: "b2", customer: "Kamal Silva", service: "Hair Coloring", date: "2026-03-25", time: "2:00 PM", status: "pending" },
  { id: "b3", customer: "Nisha Fernando", service: "Keratin Treatment", date: "2026-03-26", time: "11:00 AM", status: "confirmed" },
  { id: "b4", customer: "Ravi Kumar", service: "Bridal Package", date: "2026-03-27", time: "9:00 AM", status: "pending" },
];

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
            { label: "Services", value: "4", icon: Scissors, change: "All active" },
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
          <TabsList>
            <TabsTrigger value="overview">Bookings</TabsTrigger>
            <TabsTrigger value="profile">Salon Profile</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <Card>
              <CardHeader><CardTitle className="font-display text-lg">Upcoming Bookings</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockBookings.map(b => (
                    <div key={b.id} className="flex items-center justify-between p-3 rounded-md bg-secondary/50">
                      <div>
                        <p className="font-medium text-sm">{b.customer}</p>
                        <p className="text-xs text-muted-foreground">{b.service} · {b.date} at {b.time}</p>
                      </div>
                      <Badge variant={b.status === "confirmed" ? "default" : "secondary"}>
                        {b.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">Salon profile editor will be available once backend is connected. You'll be able to update your salon name, description, images, contact info, and opening hours here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">Service management will be available once backend is connected. You'll be able to add, edit, and deactivate services with pricing and duration.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardContent className="p-6 flex items-center gap-3">
                <Settings className="h-5 w-5 text-muted-foreground" />
                <p className="text-muted-foreground">Account settings, subscription management, and notification preferences will appear here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
