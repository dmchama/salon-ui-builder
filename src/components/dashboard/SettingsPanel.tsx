import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Bell, CreditCard, Shield } from "lucide-react";
import { toast } from "sonner";
import { fetchMe } from "@/api/users-api";
import type { OwnerSubscription } from "@/api/salon-owner-api";

function formatPlanPrice(cents: number, currency: string) {
  const major = cents / 100;
  return `${currency} ${major.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

type Props = { subscription: OwnerSubscription | null };

const SettingsPanel = ({ subscription }: Props) => {
  const { data: me, isLoading } = useQuery({
    queryKey: ["users", "me"],
    queryFn: fetchMe,
  });

  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    newBooking: true,
    cancellation: true,
    reminder: true,
  });

  const handleSave = () => {
    toast.success("Preferences are local only until notification settings are added to the API.");
  };

  const ownerLabel =
    me?.firstName || me?.lastName
      ? [me.firstName, me.lastName].filter(Boolean).join(" ")
      : "—";

  return (
    <div className="space-y-6">
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Shield className="h-4 w-4" /> Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {isLoading ? (
            <p className="text-muted-foreground">Loading account…</p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Name</p>
                  <p className="font-medium">{ownerLabel}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Email</p>
                  <p className="font-medium">{me?.email ?? "—"}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground pt-2">
                Password changes are not implemented in the API yet. Use your registration flow or support if you need a reset.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Bell className="h-4 w-4" /> Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Toggles below are UI-only. Server-side notification preferences can be wired when the backend exposes them.
          </p>
          {[
            { key: "email" as const, label: "Email", desc: "Booking emails to guests use addresses from each booking." },
            { key: "sms" as const, label: "SMS", desc: "Not available yet." },
            { key: "newBooking" as const, label: "New booking alerts", desc: "Owner inbox / queue (future)." },
            { key: "cancellation" as const, label: "Cancellations", desc: "Future." },
            { key: "reminder" as const, label: "Reminders", desc: "Future." },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-border"
                  checked={notifications[item.key]}
                  onChange={(e) =>
                    setNotifications((prev) => ({ ...prev, [item.key]: e.target.checked }))
                  }
                />
              </label>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subscription ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-secondary/50 rounded-sm">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm">{subscription.plan.name}</p>
                  <Badge className="rounded-none">{subscription.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatPlanPrice(subscription.plan.priceCents, subscription.plan.currency)} per{" "}
                  {subscription.plan.intervalMonths === 1 ? "month" : `${subscription.plan.intervalMonths} months`}
                  {" · "}
                  Renews {new Date(subscription.expiresAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No active subscription record found. Complete registration with a plan, or contact support.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="gap-2 rounded-none">
          <Settings className="h-4 w-4" /> Save preferences (local)
        </Button>
      </div>
    </div>
  );
};

export default SettingsPanel;
