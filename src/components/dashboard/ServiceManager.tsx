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
import { Plus, Pencil, Trash2, Clock, DollarSign, Scissors, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  createManagedService,
  fetchManagedServices,
  updateManagedService,
  type ManageService,
} from "@/api/services-api";
import { ApiError } from "@/api/http";

function rupeesToCents(rupees: number) {
  return Math.round(rupees * 100);
}

function centsToRupees(cents: number) {
  return cents / 100;
}

type FormState = {
  name: string;
  description: string;
  priceRupees: string;
  durationMin: string;
  active: boolean;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  priceRupees: "",
  durationMin: "",
  active: true,
};

function serviceToForm(s: ManageService): FormState {
  return {
    name: s.name,
    description: s.description ?? "",
    priceRupees: String(centsToRupees(s.priceCents)),
    durationMin: String(s.durationMin),
    active: s.active,
  };
}

const ServiceForm = ({
  form,
  onChange,
  showActive = false,
}: {
  form: FormState;
  onChange: (field: keyof FormState, value: string | boolean) => void;
  showActive?: boolean;
}) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label>Service name</Label>
      <Input
        className="rounded-none"
        value={form.name}
        onChange={(e) => onChange("name", e.target.value)}
        placeholder="e.g. Haircut & styling"
      />
    </div>
    <div className="space-y-2">
      <Label>Description</Label>
      <Textarea
        className="rounded-none resize-y min-h-[100px]"
        value={form.description}
        onChange={(e) => onChange("description", e.target.value)}
        placeholder="What clients should expect…"
        rows={4}
      />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label className="flex items-center gap-1">
          <DollarSign className="h-3.5 w-3.5" /> Price (Rs.)
        </Label>
        <Input
          type="number"
          min={0}
          step={1}
          className="rounded-none"
          value={form.priceRupees}
          onChange={(e) => onChange("priceRupees", e.target.value)}
          placeholder="0"
        />
      </div>
      <div className="space-y-2">
        <Label className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" /> Duration (minutes)
        </Label>
        <Input
          type="number"
          min={5}
          className="rounded-none"
          value={form.durationMin}
          onChange={(e) => onChange("durationMin", e.target.value)}
          placeholder="45"
        />
      </div>
    </div>
    {showActive && (
      <div className="flex items-center gap-2">
        <Switch checked={form.active} onCheckedChange={(v) => onChange("active", v)} id="svc-active" />
        <Label htmlFor="svc-active">Active (visible on public booking page)</Label>
      </div>
    )}
  </div>
);

type Props = { salonId: string | null };

const ServiceManager = ({ salonId }: Props) => {
  const queryClient = useQueryClient();
  const [editingService, setEditingService] = useState<ManageService | null>(null);
  const [newForm, setNewForm] = useState<FormState>(emptyForm);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [serviceToDeactivate, setServiceToDeactivate] = useState<ManageService | null>(null);

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["managed-services", salonId],
    queryFn: () => fetchManagedServices(salonId!),
    enabled: Boolean(salonId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["managed-services", salonId] });
    queryClient.invalidateQueries({ queryKey: ["owner-dashboard"] });
  };

  const createMut = useMutation({
    mutationFn: () => {
      if (!salonId) throw new Error("No salon");
      const duration = Number(newForm.durationMin);
      const price = Number(newForm.priceRupees);
      if (!newForm.name.trim()) throw new Error("Name required");
      if (!Number.isFinite(duration) || duration < 5) throw new Error("Duration must be at least 5 minutes");
      if (!Number.isFinite(price) || price < 0) throw new Error("Invalid price");
      return createManagedService({
        salonId,
        name: newForm.name.trim(),
        description: newForm.description.trim() || undefined,
        durationMin: duration,
        priceCents: rupeesToCents(price),
      });
    },
    onSuccess: () => {
      invalidate();
      setNewForm(emptyForm);
      setIsAddOpen(false);
      toast.success("Service created");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Failed");
    },
  });

  const updateMut = useMutation({
    mutationFn: () => {
      if (!editingService) throw new Error("None");
      const duration = Number(editForm.durationMin);
      const price = Number(editForm.priceRupees);
      if (!editForm.name.trim()) throw new Error("Name required");
      if (!Number.isFinite(duration) || duration < 5) throw new Error("Duration must be at least 5 minutes");
      if (!Number.isFinite(price) || price < 0) throw new Error("Invalid price");
      return updateManagedService(editingService.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim() || undefined,
        durationMin: duration,
        priceCents: rupeesToCents(price),
        active: editForm.active,
      });
    },
    onSuccess: () => {
      invalidate();
      setIsEditOpen(false);
      setEditingService(null);
      toast.success("Service updated");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Failed");
    },
  });

  const toggleMut = useMutation({
    mutationFn: (s: ManageService) => updateManagedService(s.id, { active: !s.active }),
    onSuccess: () => {
      invalidate();
      toast.success("Service updated");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof ApiError ? err.message : "Failed");
    },
  });

  const deactivateMut = useMutation({
    mutationFn: (s: ManageService) => updateManagedService(s.id, { active: false }),
    onSuccess: () => {
      invalidate();
      setServiceToDeactivate(null);
      toast.success("Service deactivated (hidden from public booking)");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof ApiError ? err.message : "Failed");
    },
  });

  const openEdit = (s: ManageService) => {
    setEditingService(s);
    setEditForm(serviceToForm(s));
    setIsEditOpen(true);
  };

  if (!salonId) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12 tracking-wide">
        Select a salon above to manage services.
      </p>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-8">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading services…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {services.filter((s) => s.active).length} active · {services.length} total
        </p>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1 rounded-none">
              <Plus className="h-4 w-4" /> Add service
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-none">
            <DialogHeader>
              <DialogTitle className="font-display">New service</DialogTitle>
            </DialogHeader>
            <ServiceForm
              form={newForm}
              showActive={false}
              onChange={(f, v) => setNewForm((prev) => ({ ...prev, [f]: v }))}
            />
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
        {services.map((service) => (
          <Card key={service.id} className={!service.active ? "opacity-60" : ""}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4 flex-1 min-w-0">
                  <div className="w-16 h-16 shrink-0 border border-black/5 bg-black/5 flex items-center justify-center">
                    <Scissors className="h-5 w-5 text-black/20" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-medium text-sm">{service.name}</h3>
                      {!service.active && (
                        <Badge variant="outline" className="text-xs rounded-none">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    {service.description && (
                      <p className="text-xs text-muted-foreground mb-2">{service.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        Rs. {centsToRupees(service.priceCents).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {service.durationMin} mins
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={service.active}
                    onCheckedChange={() => toggleMut.mutate(service)}
                    disabled={toggleMut.isPending}
                  />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(service)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => setServiceToDeactivate(service)}
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

      {services.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">No services yet. Add one to accept bookings.</p>
      )}

      <AlertDialog
        open={!!serviceToDeactivate}
        onOpenChange={(open) => !open && setServiceToDeactivate(null)}
      >
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate service?</AlertDialogTitle>
            <AlertDialogDescription>
              It will disappear from the public booking page. Existing bookings are unchanged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-none bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => serviceToDeactivate && deactivateMut.mutate(serviceToDeactivate)}
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle className="font-display">Edit service</DialogTitle>
          </DialogHeader>
          {editingService && (
            <ServiceForm
              form={editForm}
              showActive
              onChange={(f, v) => setEditForm((prev) => ({ ...prev, [f]: v }))}
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

export default ServiceManager;
