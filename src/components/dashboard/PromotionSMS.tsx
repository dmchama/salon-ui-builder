import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Send, Plus, Clock, CheckCircle, Users } from "lucide-react";
import { toast } from "sonner";

interface SMSCampaign {
  id: string;
  title: string;
  message: string;
  audience: string;
  scheduledDate: string;
  status: "draft" | "scheduled" | "sent";
  recipients: number;
}

const initialCampaigns: SMSCampaign[] = [
  { id: "1", title: "Weekend Offer", message: "Get 20% off all hair services this weekend! Visit Glamour Studio. T&C apply.", audience: "All Customers", scheduledDate: "2026-03-28", status: "scheduled", recipients: 120 },
  { id: "2", title: "New Service Launch", message: "Introducing our new Bridal Makeup package! Book now at special rates.", audience: "Female Customers", scheduledDate: "2026-03-20", status: "sent", recipients: 85 },
];

const PromotionSMS = () => {
  const [campaigns, setCampaigns] = useState<SMSCampaign[]>(initialCampaigns);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", audience: "All Customers", scheduledDate: "" });

  const handleSend = () => {
    if (!form.title || !form.message) {
      toast.error("Please fill in all required fields");
      return;
    }
    setCampaigns(prev => [...prev, {
      id: Date.now().toString(),
      ...form,
      status: form.scheduledDate ? "scheduled" : "draft",
      recipients: Math.floor(Math.random() * 100) + 50,
    }]);
    toast.success(form.scheduledDate ? "SMS campaign scheduled!" : "SMS campaign saved as draft");
    setDialogOpen(false);
    setForm({ title: "", message: "", audience: "All Customers", scheduledDate: "" });
  };

  const statusColor = (s: string) => s === "sent" ? "default" : s === "scheduled" ? "secondary" : "outline";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold">Promotion SMS</h2>
          <p className="text-sm text-muted-foreground">Send promotional messages to your customers</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> New Campaign</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Create SMS Campaign</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Campaign Title *</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Weekend Special Offer" />
              </div>
              <div className="space-y-2">
                <Label>Message *</Label>
                <Textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Type your promotional message..." rows={3} maxLength={160} />
                <p className="text-xs text-muted-foreground text-right">{form.message.length}/160 characters</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <Select value={form.audience} onValueChange={val => setForm(f => ({ ...f, audience: val }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All Customers">All Customers</SelectItem>
                      <SelectItem value="New Customers">New Customers</SelectItem>
                      <SelectItem value="Regular Customers">Regular Customers</SelectItem>
                      <SelectItem value="Inactive Customers">Inactive Customers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Schedule Date</Label>
                  <Input type="date" value={form.scheduledDate} onChange={e => setForm(f => ({ ...f, scheduledDate: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSend} className="gap-2"><Send className="h-4 w-4" /> {form.scheduledDate ? "Schedule" : "Save Draft"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Campaigns", value: campaigns.length, icon: MessageSquare },
          { label: "Total Recipients", value: campaigns.reduce((a, c) => a + c.recipients, 0), icon: Users },
          { label: "Sent", value: campaigns.filter(c => c.status === "sent").length, icon: CheckCircle },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold font-display">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map(c => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{c.title}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[250px]">{c.message}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{c.audience}</TableCell>
                  <TableCell className="text-sm">{c.recipients}</TableCell>
                  <TableCell className="text-sm">{c.scheduledDate}</TableCell>
                  <TableCell><Badge variant={statusColor(c.status)}>{c.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PromotionSMS;
