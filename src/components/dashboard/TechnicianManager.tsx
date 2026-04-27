import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Mail, Phone, Loader2, User } from "lucide-react";
import { toast } from "sonner";
import {
  createTechnician,
  fetchManagedTechnicians,
  updateTechnician,
  type ManagedTechnician,
} from "@/api/technicians-api";
import { ApiError } from "@/api/http";

type FormState = {
  name: string;
  phone: string;
  email: string;
  specialization: string;
  active: boolean;
};

const emptyForm: FormState = {
  name: "",
  phone: "",
  email: "",
  specialization: "",
  active: true,
};

function techToForm(t: ManagedTechnician): FormState {
  return {
    name: t.name,
    phone: t.phone ?? "",
    email: t.email ?? "",
    specialization: t.specialization ?? "",
    active: t.active,
  };
}

const TechForm = ({
  form,
  onChange,
  showActive,
}: {
  form: FormState;
  onChange: (field: keyof FormState, value: string | boolean) => void;
  showActive?: boolean;
}) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label>Name</Label>
      <Input
        className="rounded-none"
        value={form.name}
        onChange={(e) => onChange("name", e.target.value)}
        placeholder="Staff display name"
      />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label className="flex items-center gap-1">
          <Phone className="h-3.5 w-3.5" /> Phone
        </Label>
        <Input
          className="rounded-none"
          value={form.phone}
          onChange={(e) => onChange("phone", e.target.value)}
          placeholder="Optional"
        />
      </div>
      <div className="space-y-2">
        <Label className="flex items-center gap-1">
          <Mail className="h-3.5 w-3.5" /> Email
        </Label>
        <Input
          type="email"
          className="rounded-none"
          value={form.email}
          onChange={(e) => onChange("email", e.target.value)}
          placeholder="Optional"
        />
      </div>
    </div>
    <div className="space-y-2">
      <Label>Specialization</Label>
      <Textarea
        className="rounded-none resize-y min-h-[72px]"
        value={form.specialization}
        onChange={(e) => onChange("specialization", e.target.value)}
        placeholder="e.g. Color, cuts, bridal…"
      />
    </div>
    {showActive && (
      <div className="flex items-center gap-2">
        <Switch checked={form.active} onCheckedChange={(v) => onChange("active", v)} id="tech-active" />
        <Label htmlFor="tech-active">Active (shown on public booking)</Label>
      </div>
    )}
  </div>
);

type Props = { salonId: string | null };

const TechnicianManager = ({ salonId }: Props) => {
  const queryClient = useQueryClient();
  const [newForm, setNewForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState<ManagedTechnician | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [toDeactivate, setToDeactivate] = useState<ManagedTechnician | null>(null);

  const { data: technicians = [], isLoading } = useQuery({
    queryKey: ["managed-technicians", salonId],
    queryFn: () => fetchManagedTechnicians(salonId!),
    enabled: Boolean(salonId),
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["managed-technicians", salonId] });
    await queryClient.invalidateQueries({ queryKey: ["owner-dashboard"] });
    await queryClient.invalidateQueries({ queryKey: ["salon-public"] });
  };

  const createMut = useMutation({
    mutationFn: () => {
      if (!salonId) throw new Error("No salon");
      if (!newForm.name.trim()) throw new Error("Name required");
      return createTechnician({
        salonId,
        name: newForm.name.trim(),
        phone: newForm.phone.trim() || undefined,
        email: newForm.email.trim() || undefined,
        specialization: newForm.specialization.trim() || undefined,
      });
    },
    onSuccess: async () => {
      await invalidate();
      setNewForm(emptyForm);
      setIsAddOpen(false);
      toast.success("Technician added");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Failed");
    },
  });

  const updateMut = useMutation({
    mutationFn: () => {
      if (!editing) throw new Error("None");
      if (!editForm.name.trim()) throw new Error("Name required");
      return updateTechnician(editing.id, {
        name: editForm.name.trim(),
        phone: editForm.phone.trim() || undefined,
        email: editForm.email.trim() || undefined,
        specialization: editForm.specialization.trim() || undefined,
        active: editForm.active,
      });
    },
    onSuccess: async () => {
      await invalidate();
      setIsEditOpen(false);
      setEditing(null);
      toast.success("Saved");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Failed");
    },
  });

  const toggleMut = useMutation({
    mutationFn: (t: ManagedTechnician) => updateTechnician(t.id, { active: !t.active }),
    onSuccess: () => {
      invalidate();
      toast.success("Updated");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof ApiError ? err.message : "Failed");
    },
  });

  const deactivateMut = useMutation({
    mutationFn: (t: ManagedTechnician) => updateTechnician(t.id, { active: false }),
    onSuccess: async () => {
      await invalidate();
      setToDeactivate(null);
      toast.success("Technician deactivated");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof ApiError ? err.message : "Failed");
    },
  });

  const openEdit = (t: ManagedTechnician) => {
    setEditing(t);
    setEditForm(techToForm(t));
    setIsEditOpen(true);
  };

  if (!salonId) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12 tracking-wide">
        Select a salon above to manage technicians.
      </p>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-8">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {technicians.filter((t) => t.active).length} active · {technicians.length} total
        </p>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1 rounded-none">
              <Plus className="h-4 w-4" /> Add technician
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-none">
            <DialogHeader>
              <DialogTitle className="font-display">New technician</DialogTitle>
            </DialogHeader>
            <TechForm form={newForm} onChange={(f, v) => setNewForm((p) => ({ ...p, [f]: v }))} />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" className="rounded-none" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button className="rounded-none" onClick={() => createMut.mutate()} disabled={createMut.isPending}>
                Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {technicians.map((t) => (
          <Card key={t.id} className={!t.active ? "opacity-60" : ""}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 shrink-0 border border-border flex items-center justify-center bg-secondary/40">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-medium text-sm">{t.name}</h3>
                      {!t.active && (
                        <Badge variant="outline" className="text-xs rounded-none">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    {t.specialization && (
                      <p className="text-xs text-muted-foreground mb-1">{t.specialization}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {t.phone && <span>{t.phone}</span>}
                      {t.email && <span>{t.email}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={t.active}
                    onCheckedChange={() => toggleMut.mutate(t)}
                    disabled={toggleMut.isPending}
                  />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => setToDeactivate(t)}
                    title="Deactivate"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {technicians.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">
          No technicians yet. Add staff so guests can request them when booking.
        </p>
      )}

      <AlertDialog open={!!toDeactivate} onOpenChange={(open) => !open && setToDeactivate(null)}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate technician?</AlertDialogTitle>
            <AlertDialogDescription>
              They will no longer appear on the public booking form. Existing bookings keep the assignment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-none bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => toDeactivate && deactivateMut.mutate(toDeactivate)}
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle className="font-display">Edit technician</DialogTitle>
          </DialogHeader>
          {editing && (
            <TechForm
              form={editForm}
              showActive
              onChange={(f, v) => setEditForm((p) => ({ ...p, [f]: v }))}
            />
          )}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" className="rounded-none" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-none" onClick={() => updateMut.mutate()} disabled={updateMut.isPending}>
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TechnicianManager;
