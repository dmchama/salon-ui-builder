import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Mail, Clock, ImagePlus, Save, X } from "lucide-react";
import { toast } from "sonner";

const defaultHours = [
  { day: "Monday", open: "09:00", close: "18:00", isOpen: true },
  { day: "Tuesday", open: "09:00", close: "18:00", isOpen: true },
  { day: "Wednesday", open: "09:00", close: "18:00", isOpen: true },
  { day: "Thursday", open: "09:00", close: "18:00", isOpen: true },
  { day: "Friday", open: "09:00", close: "18:00", isOpen: true },
  { day: "Saturday", open: "09:00", close: "17:00", isOpen: true },
  { day: "Sunday", open: "10:00", close: "14:00", isOpen: false },
];

const SalonProfileEditor = () => {
  const [profile, setProfile] = useState({
    name: "Glamour Studio",
    description: "A premium beauty salon offering a wide range of hair, skin, and bridal services.",
    address: "123 Galle Road, Colombo 03",
    city: "Colombo",
    phone: "+94 11 234 5678",
    email: "info@glamourstudio.lk",
    website: "www.glamourstudio.lk",
  });

  const [hours, setHours] = useState(defaultHours);
  const [images, setImages] = useState<string[]>([
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=300&h=200&fit=crop",
  ]);

  const handleProfileChange = (field: string, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const toggleDay = (index: number) => {
    setHours(prev => prev.map((h, i) => i === index ? { ...h, isOpen: !h.isOpen } : h));
  };

  const updateHour = (index: number, field: "open" | "close", value: string) => {
    setHours(prev => prev.map((h, i) => i === index ? { ...h, [field]: value } : h));
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    toast.success("Salon profile updated successfully!");
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Salon Name</Label>
              <Input value={profile.name} onChange={e => handleProfileChange("name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input value={profile.city} onChange={e => handleProfileChange("city", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={profile.description} onChange={e => handleProfileChange("description", e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Address</Label>
            <Input value={profile.address} onChange={e => handleProfileChange("address", e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> Phone</Label>
              <Input value={profile.phone} onChange={e => handleProfileChange("phone", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> Email</Label>
              <Input value={profile.email} onChange={e => handleProfileChange("email", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input value={profile.website} onChange={e => handleProfileChange("website", e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gallery */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Gallery Images</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((img, i) => (
              <div key={i} className="relative group rounded-lg overflow-hidden aspect-video">
                <img src={img} alt={`Salon ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <button className="aspect-video rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors">
              <ImagePlus className="h-5 w-5" />
              <span className="text-xs">Add Image</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Business Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Clock className="h-4 w-4" /> Business Hours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {hours.map((h, i) => (
              <div key={h.day} className="flex items-center gap-3 py-2">
                <button
                  onClick={() => toggleDay(i)}
                  className="w-24 text-left"
                >
                  <span className={`text-sm font-medium ${h.isOpen ? "text-foreground" : "text-muted-foreground line-through"}`}>
                    {h.day}
                  </span>
                </button>
                {h.isOpen ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={h.open}
                      onChange={e => updateHour(i, "open", e.target.value)}
                      className="w-32 h-8 text-sm"
                    />
                    <span className="text-muted-foreground text-sm">to</span>
                    <Input
                      type="time"
                      value={h.close}
                      onChange={e => updateHour(i, "close", e.target.value)}
                      className="w-32 h-8 text-sm"
                    />
                  </div>
                ) : (
                  <Badge variant="secondary">Closed</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" /> Save Profile
        </Button>
      </div>
    </div>
  );
};

export default SalonProfileEditor;
