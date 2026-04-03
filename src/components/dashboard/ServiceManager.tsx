import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Pencil, Trash2, Clock, DollarSign, Scissors } from "lucide-react";
import { toast } from "sonner";

interface Service {
  id: string;
  name: string;
  description: string;
  price?: number;
  duration?: number;
  category: string;
  isActive: boolean;
  image?: string;
}

const initialServices: Service[] = [
  { id: "s1", name: "Haircut & Styling", description: "Professional haircut with wash, blow-dry, and styling.", price: 1500, duration: 45, category: "Hair", isActive: true },
  { id: "s2", name: "Hair Coloring", description: "Full hair coloring with premium color products.", price: 5000, duration: 120, category: "Hair", isActive: true },
  { id: "s3", name: "Keratin Treatment", description: "Smoothing keratin treatment for frizz-free hair.", price: 8000, duration: 180, category: "Hair", isActive: true },
  { id: "s4", name: "Bridal Makeup", description: "Complete bridal makeup package with trial session.", price: 15000, duration: 150, category: "Bridal", isActive: true },
  { id: "s5", name: "Facial Treatment", description: "Deep cleansing facial with premium skincare products.", price: 3500, duration: 60, category: "Skin", isActive: false },
];

const emptyService: Omit<Service, "id"> = {
  name: "", description: "", price: undefined, duration: undefined, category: "Hair", isActive: true, image: "",
};

const ServiceForm = ({ service, onChange }: { service: Omit<Service, "id"> | Service; onChange: (field: string, value: any) => void }) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label>Service Name</Label>
      <Input value={service.name} onChange={e => onChange("name", e.target.value)} placeholder="e.g., Haircut & Styling" />
    </div>
    <div className="space-y-2">
      <Label>Description</Label>
      <Textarea value={service.description} onChange={e => onChange("description", e.target.value)} rows={4} className="resize-y min-h-[100px]" placeholder="Detailed description of the service..." />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" /> Price (Rs.) <span className="text-muted-foreground font-normal">(Optional)</span></Label>
        <Input type="number" value={service.price === undefined ? "" : service.price} onChange={e => onChange("price", e.target.value === "" ? undefined : Number(e.target.value))} placeholder="Leave empty for 'Varies'" />
      </div>
      <div className="space-y-2">
        <Label className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Duration (mins) <span className="text-muted-foreground font-normal">(Optional)</span></Label>
        <Input type="number" value={service.duration === undefined ? "" : service.duration} onChange={e => onChange("duration", e.target.value === "" ? undefined : Number(e.target.value))} placeholder="Leave empty for 'Varies'" />
      </div>
    </div>
    <div className="space-y-2">
      <Label>Category</Label>
      <Input value={service.category} onChange={e => onChange("category", e.target.value)} placeholder="e.g., Hair, Skin, Bridal" />
    </div>
    <div className="space-y-2">
      <Label>Service Image (Optional)</Label>
      <Input type="file" accept="image/*" onChange={(e) => {
        if (e.target.files && e.target.files.length > 0) {
          onChange("image", URL.createObjectURL(e.target.files[0]));
        }
      }} className="text-xs" />
      {service.image && <img src={service.image} alt="Preview" className="h-16 w-16 object-cover border border-black/10 mt-2" />}
    </div>
  </div>
);

const ServiceManager = () => {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [newService, setNewService] = useState(emptyService);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);

  const handleAdd = () => {
    if (!newService.name) {
      toast.error("Please fill in the service name");
      return;
    }
    const service: Service = { ...newService, id: `s${Date.now()}` };
    setServices(prev => [...prev, service]);
    setNewService(emptyService);
    setIsAddOpen(false);
    toast.success("Service added successfully!");
  };

  const handleEdit = () => {
    if (!editingService) return;
    setServices(prev => prev.map(s => s.id === editingService.id ? editingService : s));
    setIsEditOpen(false);
    toast.success("Service updated!");
  };

  const handleDelete = (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
    setServiceToDelete(null);
    toast.success("Service removed");
  };

  const toggleActive = (id: string) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{services.filter(s => s.isActive).length} active services</p>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Add Service</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Add New Service</DialogTitle>
            </DialogHeader>
            <ServiceForm service={newService} onChange={(f, v) => setNewService(prev => ({ ...prev, [f]: v }))} />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd}>Add Service</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {services.map(service => (
          <Card key={service.id} className={!service.isActive ? "opacity-60" : ""}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex gap-4">
                    {service.image ? (
                      <div className="w-16 h-16 shrink-0 border border-black/5 bg-black/5">
                        <img src={service.image} alt={service.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 shrink-0 border border-black/5 bg-black/5 flex items-center justify-center">
                         <Scissors className="h-5 w-5 text-black/20" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm">{service.name}</h3>
                        <Badge variant="secondary" className="text-xs">{service.category}</Badge>
                        {!service.isActive && <Badge variant="outline" className="text-xs">Inactive</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{service.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{service.price ? `Rs. ${service.price.toLocaleString()}` : 'Price Varies'}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {service.duration ? `${service.duration} mins` : 'Duration Varies'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={service.isActive} onCheckedChange={() => toggleActive(service.id)} />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => { setEditingService(service); setIsEditOpen(true); }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setServiceToDelete(service.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!serviceToDelete} onOpenChange={(open) => !open && setServiceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the service from your list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => serviceToDelete && handleDelete(serviceToDelete)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Edit Service</DialogTitle>
          </DialogHeader>
          {editingService && (
            <ServiceForm service={editingService} onChange={(f, v) => setEditingService(prev => prev ? { ...prev, [f]: v } : null)} />
          )}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServiceManager;
