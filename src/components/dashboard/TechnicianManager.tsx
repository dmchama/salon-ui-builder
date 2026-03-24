import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Edit2, Trash2, UserCheck, Phone, Mail } from "lucide-react";
import { toast } from "sonner";

interface Technician {
  id: string;
  name: string;
  phone: string;
  email: string;
  specialization: string;
  experience: string;
  active: boolean;
}

const initialTechnicians: Technician[] = [
  { id: "1", name: "Nimal Perera", phone: "077-1234567", email: "nimal@glamour.lk", specialization: "Hair Styling", experience: "5 years", active: true },
  { id: "2", name: "Kamal Silva", phone: "076-9876543", email: "kamal@glamour.lk", specialization: "Skin Care", experience: "3 years", active: true },
  { id: "3", name: "Saman Fernando", phone: "071-5556677", email: "saman@glamour.lk", specialization: "Nail Art", experience: "2 years", active: false },
];

const specializations = ["Hair Styling", "Skin Care", "Nail Art", "Makeup", "Massage", "Bridal"];

const TechnicianManager = () => {
  const [technicians, setTechnicians] = useState<Technician[]>(initialTechnicians);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", specialization: "", experience: "" });

  const resetForm = () => {
    setForm({ name: "", phone: "", email: "", specialization: "", experience: "" });
    setEditingId(null);
  };

  const handleSave = () => {
    if (!form.name || !form.phone || !form.specialization) {
      toast.error("Please fill in required fields");
      return;
    }
    if (editingId) {
      setTechnicians(prev => prev.map(t => t.id === editingId ? { ...t, ...form } : t));
      toast.success("Technician updated!");
    } else {
      setTechnicians(prev => [...prev, { ...form, id: Date.now().toString(), active: true }]);
      toast.success("Technician added!");
    }
    setDialogOpen(false);
    resetForm();
  };

  const handleEdit = (tech: Technician) => {
    setForm({ name: tech.name, phone: tech.phone, email: tech.email, specialization: tech.specialization, experience: tech.experience });
    setEditingId(tech.id);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setTechnicians(prev => prev.filter(t => t.id !== id));
    toast.success("Technician removed");
  };

  const toggleActive = (id: string) => {
    setTechnicians(prev => prev.map(t => t.id === id ? { ...t, active: !t.active } : t));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold">Technicians</h2>
          <p className="text-sm text-muted-foreground">Manage your salon staff and their specializations</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Add Technician</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">{editingId ? "Edit" : "Add"} Technician</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Nimal Perera" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone *</Label>
                  <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="077-1234567" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@salon.lk" type="email" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Specialization *</Label>
                  <Select value={form.specialization} onValueChange={val => setForm(f => ({ ...f, specialization: val }))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {specializations.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Experience</Label>
                  <Input value={form.experience} onChange={e => setForm(f => ({ ...f, experience: e.target.value }))} placeholder="e.g. 3 years" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancel</Button>
                <Button onClick={handleSave}>{editingId ? "Update" : "Add"} Technician</Button>
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
                <TableHead>Technician</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {technicians.map(tech => (
                <TableRow key={tech.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {tech.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">{tech.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs space-y-0.5">
                      <div className="flex items-center gap-1"><Phone className="h-3 w-3 text-muted-foreground" />{tech.phone}</div>
                      {tech.email && <div className="flex items-center gap-1"><Mail className="h-3 w-3 text-muted-foreground" />{tech.email}</div>}
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="secondary">{tech.specialization}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{tech.experience}</TableCell>
                  <TableCell>
                    <Switch checked={tech.active} onCheckedChange={() => toggleActive(tech.id)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(tech)}><Edit2 className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(tech.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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

export default TechnicianManager;
