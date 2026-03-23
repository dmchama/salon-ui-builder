import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Settings, Bell, CreditCard, Shield, Key } from "lucide-react";
import { toast } from "sonner";

const SettingsPanel = () => {
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    newBooking: true,
    cancellation: true,
    reminder: true,
  });

  const handleSave = () => {
    toast.success("Settings saved!");
  };

  return (
    <div className="space-y-6">
      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Shield className="h-4 w-4" /> Account Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Owner Name</Label>
              <Input defaultValue="Salon Owner" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input defaultValue="owner@glamourstudio.lk" type="email" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1"><Key className="h-3.5 w-3.5" /> Change Password</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input type="password" placeholder="Current password" />
              <Input type="password" placeholder="New password" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Bell className="h-4 w-4" /> Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "email" as const, label: "Email Notifications", desc: "Receive updates via email" },
            { key: "sms" as const, label: "SMS Notifications", desc: "Receive SMS alerts for bookings" },
            { key: "newBooking" as const, label: "New Booking Alerts", desc: "Get notified for every new booking" },
            { key: "cancellation" as const, label: "Cancellation Alerts", desc: "Get notified when a booking is cancelled" },
            { key: "reminder" as const, label: "Daily Reminders", desc: "Summary of upcoming bookings" },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <Switch
                checked={notifications[item.key]}
                onCheckedChange={val => setNotifications(prev => ({ ...prev, [item.key]: val }))}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm">Professional Plan</p>
                <Badge>Active</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Rs. 4,999/month · Renews April 15, 2026</p>
            </div>
            <Button variant="outline" size="sm">Manage Plan</Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="gap-2">
          <Settings className="h-4 w-4" /> Save Settings
        </Button>
      </div>
    </div>
  );
};

export default SettingsPanel;
