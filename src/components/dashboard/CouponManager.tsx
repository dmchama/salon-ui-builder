import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit2, Trash2, Tag, Percent, Copy } from "lucide-react";
import { toast } from "sonner";

interface Coupon {
  id: string;
  code: string;
  type: "percentage" | "flat";
  value: number;
  minOrder: number;
  usageLimit: number;
  usedCount: number;
  expiryDate: string;
  active: boolean;
}

const initialCoupons: Coupon[] = [
  { id: "1", code: "WELCOME20", type: "percentage", value: 20, minOrder: 1000, usageLimit: 100, usedCount: 45, expiryDate: "2026-04-30", active: true },
  { id: "2", code: "FLAT500", type: "flat", value: 500, minOrder: 2000, usageLimit: 50, usedCount: 12, expiryDate: "2026-05-15", active: true },
  { id: "3", code: "SUMMER10", type: "percentage", value: 10, minOrder: 500, usageLimit: 200, usedCount: 200, expiryDate: "2026-03-01", active: false },
];

const CouponManager = () => {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ code: "", type: "percentage" as "percentage" | "flat", value: "", minOrder: "", usageLimit: "", expiryDate: "" });

  const resetForm = () => {
    setForm({ code: "", type: "percentage", value: "", minOrder: "", usageLimit: "", expiryDate: "" });
    setEditingId(null);
  };

  const handleSave = () => {
    if (!form.code || !form.value) {
      toast.error("Please fill in required fields");
      return;
    }
    const couponData = {
      code: form.code.toUpperCase(),
      type: form.type,
      value: Number(form.value),
      minOrder: Number(form.minOrder) || 0,
      usageLimit: Number(form.usageLimit) || 999,
      expiryDate: form.expiryDate,
    };

    if (editingId) {
      setCoupons(prev => prev.map(c => c.id === editingId ? { ...c, ...couponData } : c));
      toast.success("Coupon updated!");
    } else {
      setCoupons(prev => [...prev, { ...couponData, id: Date.now().toString(), usedCount: 0, active: true }]);
      toast.success("Coupon created!");
    }
    setDialogOpen(false);
    resetForm();
  };

  const handleEdit = (coupon: Coupon) => {
    setForm({ code: coupon.code, type: coupon.type, value: String(coupon.value), minOrder: String(coupon.minOrder), usageLimit: String(coupon.usageLimit), expiryDate: coupon.expiryDate });
    setEditingId(coupon.id);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setCoupons(prev => prev.filter(c => c.id !== id));
    toast.success("Coupon deleted");
  };

  const toggleActive = (id: string) => {
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, active: !c.active } : c));
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Copied: ${code}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold">Coupon Management</h2>
          <p className="text-sm text-muted-foreground">Create and manage discount coupons for your salon</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Create Coupon</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">{editingId ? "Edit" : "Create"} Coupon</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Coupon Code *</Label>
                <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. WELCOME20" className="uppercase" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Discount Type *</Label>
                  <Select value={form.type} onValueChange={val => setForm(f => ({ ...f, type: val as "percentage" | "flat" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="flat">Flat Amount (Rs.)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Value *</Label>
                  <Input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder={form.type === "percentage" ? "e.g. 20" : "e.g. 500"} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Min Order (Rs.)</Label>
                  <Input type="number" value={form.minOrder} onChange={e => setForm(f => ({ ...f, minOrder: e.target.value }))} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Usage Limit</Label>
                  <Input type="number" value={form.usageLimit} onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))} placeholder="100" />
                </div>
                <div className="space-y-2">
                  <Label>Expiry Date</Label>
                  <Input type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancel</Button>
                <Button onClick={handleSave}>{editingId ? "Update" : "Create"} Coupon</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Min Order</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map(c => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Tag className="h-3.5 w-3.5 text-primary" />
                      <span className="font-mono font-medium text-sm">{c.code}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyCode(c.code)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="gap-1">
                      {c.type === "percentage" ? <><Percent className="h-3 w-3" />{c.value}%</> : <>Rs. {c.value}</>}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">Rs. {c.minOrder.toLocaleString()}</TableCell>
                  <TableCell className="text-sm">{c.usedCount}/{c.usageLimit}</TableCell>
                  <TableCell className="text-sm">{c.expiryDate}</TableCell>
                  <TableCell><Switch checked={c.active} onCheckedChange={() => toggleActive(c.id)} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}><Edit2 className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CouponManager;
