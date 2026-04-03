import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Scissors, LogOut, CreditCard, Users, BarChart3, Shield, Globe, Megaphone, Ticket, MessageSquare,
  Plus, Edit, Trash2, Eye, Ban, CheckCircle, TrendingUp, DollarSign, Store, AlertTriangle
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { initialHeroSlides, HeroSlide } from "@/data/mockSalons";

// ─── Mock Data ───
const mockPlans = [
  { id: 1, name: "Starter", price: 0, period: "Free", features: 3, subscribers: 42, active: true },
  { id: 2, name: "Professional", price: 2500, period: "/month", features: 6, subscribers: 128, active: true },
  { id: 3, name: "Enterprise", price: 5000, period: "/month", features: 8, subscribers: 31, active: true },
];

const mockOwners = [
  { id: 1, name: "Priya Sharma", email: "priya@salon.com", salon: "Glamour Studio", plan: "Professional", status: "active", joined: "2025-11-10" },
  { id: 2, name: "Rahul Verma", email: "rahul@barber.com", salon: "Royal Cuts", plan: "Enterprise", status: "active", joined: "2025-12-05" },
  { id: 3, name: "Anita Singh", email: "anita@beauty.com", salon: "Beauty Bliss", plan: "Starter", status: "suspended", joined: "2026-01-15" },
  { id: 4, name: "Vikram Patel", email: "vikram@style.com", salon: "Style Hub", plan: "Professional", status: "active", joined: "2026-02-20" },
  { id: 5, name: "Meera Das", email: "meera@glow.com", salon: "Glow Up Salon", plan: "Starter", status: "pending", joined: "2026-03-10" },
];

const mockSalonsModeration = [
  { id: 1, name: "Glamour Studio", owner: "Priya Sharma", status: "approved", flagged: false, reports: 0 },
  { id: 2, name: "Royal Cuts", owner: "Rahul Verma", status: "approved", flagged: false, reports: 1 },
  { id: 3, name: "New Look Salon", owner: "Ajay Kumar", status: "pending", flagged: true, reports: 3 },
  { id: 4, name: "Beauty Bliss", owner: "Anita Singh", status: "suspended", flagged: true, reports: 5 },
];

const mockCoupons = [
  { id: 1, code: "WELCOME20", discount: "20%", type: "percentage", usage: 145, limit: 500, expires: "2026-06-30", active: true },
  { id: 2, code: "FLAT200", discount: "Rs. 200", type: "flat", usage: 78, limit: 200, expires: "2026-04-30", active: true },
  { id: 3, code: "SUMMER50", discount: "50%", type: "percentage", usage: 200, limit: 200, expires: "2026-03-15", active: false },
];

const mockPromotions = [
  { id: 1, title: "Summer Sale Banner", placement: "Homepage Hero", status: "active", startDate: "2026-03-01", endDate: "2026-04-30" },
  { id: 2, title: "New Year Offer", placement: "Salon Listing", status: "scheduled", startDate: "2026-04-01", endDate: "2026-04-15" },
  { id: 3, title: "Festival Discount", placement: "Homepage Banner", status: "expired", startDate: "2026-01-10", endDate: "2026-02-10" },
];

const mockSmsHistory = [
  { id: 1, campaign: "March Offers", recipients: 450, sent: 448, delivered: 440, date: "2026-03-15", status: "completed" },
  { id: 2, campaign: "Welcome Message", recipients: 32, sent: 32, delivered: 31, date: "2026-03-20", status: "completed" },
  { id: 3, campaign: "Easter Promo", recipients: 500, sent: 0, delivered: 0, date: "2026-04-01", status: "scheduled" },
];

// ─── Sub-Components ───

const SubscriptionManager = () => {
  const [editOpen, setEditOpen] = useState(false);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Subscription Plans</h2>
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Add Plan</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Subscription Plan</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Plan Name</Label><Input placeholder="e.g. Premium" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Price (Rs.)</Label><Input type="number" placeholder="0" /></div>
                <div><Label>Billing Period</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent><SelectItem value="month">Monthly</SelectItem><SelectItem value="year">Yearly</SelectItem><SelectItem value="free">Free</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Features (one per line)</Label><Textarea rows={4} placeholder="Feature 1&#10;Feature 2" /></div>
              <Button className="w-full" onClick={() => { toast.success("Plan created"); setEditOpen(false); }}>Create Plan</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {mockPlans.map(p => (
          <Card key={p.id}>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-display font-semibold text-lg">{p.name}</span>
                <Badge variant={p.active ? "default" : "secondary"}>{p.active ? "Active" : "Inactive"}</Badge>
              </div>
              <div className="text-2xl font-bold font-display">{p.price === 0 ? "Free" : `Rs. ${p.price.toLocaleString()}`}<span className="text-sm text-muted-foreground font-normal">{p.period !== "Free" ? p.period : ""}</span></div>
              <p className="text-sm text-muted-foreground">{p.features} features · {p.subscribers} subscribers</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1"><Edit className="h-3 w-3" /> Edit</Button>
                <Button variant="outline" size="sm" className="gap-1 text-destructive"><Trash2 className="h-3 w-3" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const AccountManager = () => {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? mockOwners : mockOwners.filter(o => o.status === filter);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-display text-lg font-semibold">Salon Owner Accounts</h2>
        <div className="flex gap-2">
          {["all", "active", "suspended", "pending"].map(s => (
            <Button key={s} variant={filter === s ? "default" : "outline"} size="sm" onClick={() => setFilter(s)} className="capitalize">{s}</Button>
          ))}
        </div>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Owner</TableHead><TableHead>Salon</TableHead><TableHead>Plan</TableHead><TableHead>Status</TableHead><TableHead>Joined</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(o => (
              <TableRow key={o.id}>
                <TableCell><div className="font-medium">{o.name}</div><div className="text-xs text-muted-foreground">{o.email}</div></TableCell>
                <TableCell>{o.salon}</TableCell>
                <TableCell><Badge variant="secondary">{o.plan}</Badge></TableCell>
                <TableCell><Badge className={`${o.status === "active" ? "bg-green-600 hover:bg-green-700" : o.status === "pending" ? "bg-yellow-500 hover:bg-yellow-600 text-black" : o.status === "suspended" ? "bg-red-500 hover:bg-red-600" : ""} text-white border-0 capitalize`}>{o.status}</Badge></TableCell>
                <TableCell className="text-sm text-muted-foreground">{o.joined}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                    {o.status === "active" ? <Button variant="ghost" size="sm" onClick={() => toast.info(`${o.name} suspended`)}><Ban className="h-4 w-4 text-destructive" /></Button> : <Button variant="ghost" size="sm" onClick={() => toast.success(`${o.name} activated`)}><CheckCircle className="h-4 w-4 text-primary" /></Button>}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

const SystemStats = () => (
  <div className="space-y-6">
    <h2 className="font-display text-lg font-semibold">System Statistics</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { label: "Total Salons", value: "156", icon: Store, change: "+12 this month", color: "text-blue-600 dark:text-blue-400", borderClass: "" },
        { label: "Total Users", value: "1,248", icon: Users, change: "+85 this month", color: "text-green-600 dark:text-green-400", borderClass: "" },
        { label: "Revenue", value: "Rs. 4,52,000", icon: DollarSign, change: "+22% vs last month", color: "text-red-500 dark:text-red-400", borderClass: "" },
        { label: "Active Bookings", value: "342", icon: TrendingUp, change: "+18% this week", color: "text-yellow-600 dark:text-yellow-400", borderClass: "border border-yellow-400/80 dark:border-yellow-500/80 shadow-sm" },
      ].map(s => (
        <Card key={s.label} className={s.borderClass}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold">{s.label}</span>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <div className={`text-2xl font-bold font-display ${s.color}`}>{s.value}</div>
            <p className="text-xs text-muted-foreground mt-1 tracking-wide">{s.change}</p>
          </CardContent>
        </Card>
      ))}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card><CardHeader><CardTitle className="text-base">Plan Distribution</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[{ plan: "Starter", count: 42, pct: 21 }, { plan: "Professional", count: 128, pct: 64 }, { plan: "Enterprise", count: 31, pct: 15 }].map(p => (
            <div key={p.plan} className="space-y-1">
              <div className="flex justify-between text-sm"><span>{p.plan}</span><span className="text-muted-foreground">{p.count} ({p.pct}%)</span></div>
              <div className="h-2 bg-secondary rounded-full"><div className="h-full bg-primary rounded-full" style={{ width: `${p.pct}%` }} /></div>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card><CardHeader><CardTitle className="text-base">Monthly Revenue Trend</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {[{ month: "Jan", rev: "Rs. 3,20,000" }, { month: "Feb", rev: "Rs. 3,70,000" }, { month: "Mar", rev: "Rs. 4,52,000" }].map(m => (
            <div key={m.month} className="flex justify-between text-sm py-2 border-b last:border-0">
              <span>{m.month} 2026</span><span className="font-semibold">{m.rev}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  </div>
);

const SalonModeration = () => (
  <div className="space-y-4">
    <h2 className="font-display text-lg font-semibold">Salon Profile Moderation</h2>
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Salon</TableHead><TableHead>Owner</TableHead><TableHead>Status</TableHead><TableHead>Reports</TableHead><TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockSalonsModeration.map(s => (
            <TableRow key={s.id}>
              <TableCell className="font-medium">{s.name} {s.flagged && <AlertTriangle className="inline h-3 w-3 text-destructive ml-1" />}</TableCell>
              <TableCell>{s.owner}</TableCell>
              <TableCell><Badge className={`${s.status === "approved" ? "bg-green-600 hover:bg-green-700" : s.status === "pending" ? "bg-yellow-500 hover:bg-yellow-600 text-black" : "bg-red-500 hover:bg-red-600"} text-white border-0 capitalize`}>{s.status}</Badge></TableCell>
              <TableCell>{s.reports}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                  {s.status === "pending" && <Button variant="ghost" size="sm" onClick={() => toast.success(`${s.name} approved`)}><CheckCircle className="h-4 w-4 text-primary" /></Button>}
                  {s.status !== "suspended" && <Button variant="ghost" size="sm" onClick={() => toast.info(`${s.name} suspended`)}><Ban className="h-4 w-4 text-destructive" /></Button>}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  </div>
);

const WebsiteManager = () => {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("heroSlides");
    if (stored) setSlides(JSON.parse(stored));
    else setSlides(initialHeroSlides);
  }, []);

  const saveSlides = (newSlides: HeroSlide[]) => {
    setSlides(newSlides);
    localStorage.setItem("heroSlides", JSON.stringify(newSlides));
    toast.success("Hero slides updated successfully");
  };

  const handleDelete = (id: string) => {
    saveSlides(slides.filter(s => s.id !== id));
  };

  const handleSaveSlide = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const mediaType = formData.get("mediaType") as "image" | "video";
    
    // Simulating file upload - in a real app this would upload to S3/Cloudinary
    let mediaUrl = editingSlide?.mediaUrl || "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1920&q=80";
    const file = formData.get("mediaFile") as File;
    if (file && file.size > 0) {
       mediaUrl = mediaType === 'video' 
         ? "https://assets.mixkit.co/videos/preview/mixkit-working-with-the-hair-of-a-woman-in-a-hair-43486-large.mp4"
         : "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=1920&q=80";
    }

    const newSlide: HeroSlide = {
      id: editingSlide ? editingSlide.id : `slide-${Date.now()}`,
      mediaType,
      mediaUrl,
      title: formData.get("title") as string,
      subtitle: formData.get("subtitle") as string,
      buttonText: formData.get("buttonText") as string,
    };

    saveSlides(editingSlide ? slides.map(s => s.id === editingSlide.id ? newSlide : s) : [...slides, newSlide]);
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Website Management</h2>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <CardTitle className="text-base font-bold uppercase tracking-widest">Homepage Hero Slides</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-gold hover:bg-gold/90 text-white rounded-none tracking-widest uppercase text-xs" onClick={() => setEditingSlide(null)}>
                <Plus className="h-4 w-4 mr-2" /> Add Slide
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleSaveSlide}>
                <DialogHeader>
                  <DialogTitle className="font-display uppercase tracking-widest">{editingSlide ? 'Edit Slide' : 'Add New Slide'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label className="uppercase tracking-widest text-xs font-bold text-black/60 mb-2 block">Media Type</Label>
                    <Select name="mediaType" defaultValue={editingSlide?.mediaType || "image"}>
                      <SelectTrigger className="rounded-none border-black/20"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="image">Image Background</SelectItem>
                        <SelectItem value="video">Video Background</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="uppercase tracking-widest text-xs font-bold text-black/60 mb-2 block">Upload Media</Label>
                    <Input type="file" name="mediaFile" accept="image/*,video/*" className="rounded-none border-black/20 file:bg-black/5 file:border-0 file:rounded-none file:px-4 file:py-1 file:mr-4 file:uppercase file:tracking-widest file:text-xs" />
                    <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">Simulated upload. Leave empty to keep existing.</p>
                  </div>
                  <div>
                    <Label className="uppercase tracking-widest text-xs font-bold text-black/60 mb-2 block">Main Title</Label>
                    <Input name="title" defaultValue={editingSlide?.title || ""} className="rounded-none border-black/20" required />
                  </div>
                  <div>
                    <Label className="uppercase tracking-widest text-xs font-bold text-black/60 mb-2 block">Subtitle / Description</Label>
                    <Textarea name="subtitle" rows={2} defaultValue={editingSlide?.subtitle || ""} className="rounded-none border-black/20" required />
                  </div>
                  <div>
                    <Label className="uppercase tracking-widest text-xs font-bold text-black/60 mb-2 block">Button Text</Label>
                    <Input name="buttonText" defaultValue={editingSlide?.buttonText || "Book Now"} className="rounded-none border-black/20" required />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-black/10">
                  <Button type="button" variant="outline" className="rounded-none tracking-widest uppercase text-xs" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-black hover:bg-black/80 text-white rounded-none tracking-widest uppercase text-xs">Save Slide</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-black/10 bg-black/[0.02]">
                <TableHead className="uppercase tracking-widest text-xs font-bold text-black py-4 px-6 w-[120px]">Media</TableHead>
                <TableHead className="uppercase tracking-widest text-xs font-bold text-black py-4">Content</TableHead>
                <TableHead className="uppercase tracking-widest text-xs font-bold text-black py-4 text-right px-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slides.map(slide => (
                <TableRow key={slide.id} className="border-b border-black/5">
                  <TableCell className="px-6 py-4">
                    <div className="w-20 h-12 bg-black/10 relative overflow-hidden group">
                      {slide.mediaType === 'video' ? (
                        <video src={slide.mediaUrl} className="w-full h-full object-cover" />
                      ) : (
                        <img src={slide.mediaUrl} className="w-full h-full object-cover" alt="slide" />
                      )}
                      <div className="absolute top-1 right-1 bg-black/80 text-white text-[8px] uppercase tracking-widest px-1 py-0.5">{slide.mediaType}</div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="font-display font-semibold text-sm mb-1">{slide.title}</div>
                    <div className="text-xs text-muted-foreground font-light line-clamp-1">{slide.subtitle}</div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-black/5 hover:text-black rounded-none" onClick={() => { setEditingSlide(slide); setIsDialogOpen(true); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-none" onClick={() => handleDelete(slide.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-black/10">
        <Card className="rounded-none border border-black/10 shadow-none"><CardHeader><CardTitle className="text-sm uppercase tracking-widest font-bold">Footer Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label className="text-xs uppercase tracking-widest text-black/60 mb-2 block">Footer Text</Label><Input className="rounded-none border-black/20" defaultValue="© 2026 GlamBook. All rights reserved." /></div>
            <div><Label className="text-xs uppercase tracking-widest text-black/60 mb-2 block">Support Email</Label><Input className="rounded-none border-black/20" defaultValue="support@glambook.com" /></div>
            <Button className="w-full bg-black hover:bg-black/90 text-white rounded-none uppercase tracking-widest text-xs" onClick={() => toast.success("Footer updated")}>Save Changes</Button>
          </CardContent>
        </Card>
        <Card className="rounded-none border border-black/10 shadow-none"><CardHeader><CardTitle className="text-sm uppercase tracking-widest font-bold">SEO Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label className="text-xs uppercase tracking-widest text-black/60 mb-2 block">Meta Title</Label><Input className="rounded-none border-black/20" defaultValue="GlamBook - Luxury Salon Booking" /></div>
            <div><Label className="text-xs uppercase tracking-widest text-black/60 mb-2 block">Meta Description</Label><Textarea rows={2} className="rounded-none border-black/20" defaultValue="Book premium salon services instantly." /></div>
            <Button className="w-full bg-black hover:bg-black/90 text-white rounded-none uppercase tracking-widest text-xs" onClick={() => toast.success("SEO settings updated")}>Save Changes</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const PromotionManager = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h2 className="font-display text-lg font-semibold">Promotions</h2>
      <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> New Promotion</Button>
    </div>
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead><TableHead>Placement</TableHead><TableHead>Status</TableHead><TableHead>Duration</TableHead><TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockPromotions.map(p => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.title}</TableCell>
              <TableCell>{p.placement}</TableCell>
              <TableCell><Badge variant={p.status === "active" ? "default" : p.status === "scheduled" ? "secondary" : "outline"}>{p.status}</Badge></TableCell>
              <TableCell className="text-sm text-muted-foreground">{p.startDate} → {p.endDate}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  </div>
);

const CouponManager = () => {
  const [addOpen, setAddOpen] = useState(false);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Coupon Management</h2>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild><Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Create Coupon</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Coupon</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Coupon Code</Label><Input placeholder="e.g. SAVE30" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Discount Type</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent><SelectItem value="percentage">Percentage</SelectItem><SelectItem value="flat">Flat Amount</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label>Discount Value</Label><Input type="number" placeholder="20" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Usage Limit</Label><Input type="number" placeholder="500" /></div>
                <div><Label>Expiry Date</Label><Input type="date" /></div>
              </div>
              <Button className="w-full" onClick={() => { toast.success("Coupon created"); setAddOpen(false); }}>Create Coupon</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead><TableHead>Discount</TableHead><TableHead>Usage</TableHead><TableHead>Expires</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockCoupons.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-mono font-semibold">{c.code}</TableCell>
                <TableCell>{c.discount}</TableCell>
                <TableCell>{c.usage}/{c.limit}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{c.expires}</TableCell>
                <TableCell><Badge variant={c.active ? "default" : "secondary"}>{c.active ? "Active" : "Expired"}</Badge></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

const SmsManager = () => {
  const [composeOpen, setComposeOpen] = useState(false);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Promotion SMS Management</h2>
        <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
          <DialogTrigger asChild><Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> New Campaign</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create SMS Campaign</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Campaign Name</Label><Input placeholder="e.g. April Offers" /></div>
              <div><Label>Target Audience</Label>
                <Select><SelectTrigger><SelectValue placeholder="Select audience" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Users</SelectItem><SelectItem value="active">Active Customers</SelectItem><SelectItem value="inactive">Inactive Customers</SelectItem><SelectItem value="owners">Salon Owners</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Message</Label><Textarea rows={3} placeholder="Type your SMS message..." /><p className="text-xs text-muted-foreground mt-1">Max 160 characters per SMS</p></div>
              <div><Label>Schedule</Label><Input type="datetime-local" /></div>
              <Button className="w-full" onClick={() => { toast.success("SMS campaign scheduled"); setComposeOpen(false); }}>Schedule Campaign</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead><TableHead>Recipients</TableHead><TableHead>Sent</TableHead><TableHead>Delivered</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockSmsHistory.map(s => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.campaign}</TableCell>
                <TableCell>{s.recipients}</TableCell>
                <TableCell>{s.sent}</TableCell>
                <TableCell>{s.delivered}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{s.date}</TableCell>
                <TableCell><Badge variant={s.status === "completed" ? "default" : "secondary"}>{s.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

// ─── Main Admin Page ───

const Admin = () => {
  const [tab, setTab] = useState("stats");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-background text-foreground transition-colors">
      <div className="bg-black text-white px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-xl md:text-2xl tracking-widest uppercase">GLAMBOOK</span>
            <span className="text-red-500 tracking-widest text-xs uppercase px-3 border-l border-white/20 hidden md:block">System Admin</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/dashboard">
              <span className="text-xs uppercase tracking-widest text-white/50 hover:text-white transition-colors">Owner Portal</span>
            </Link>
            <Link to="/">
              <span className="text-xs uppercase tracking-widest text-white/50 hover:text-white transition-colors flex items-center gap-2">
                <LogOut className="h-4 w-4" /> Sign Out
              </span>
            </Link>
          </div>
        </div>
      </div>

      <div className="container py-12 max-w-7xl">
        <h1 className="font-display text-4xl font-bold mb-8 uppercase tracking-widest text-foreground">Admin Dashboard</h1>

        <div className="flex flex-wrap gap-3 mb-10">
          <Button onClick={() => setTab("accounts")} className="bg-blue-600 hover:bg-blue-700 text-white tracking-widest uppercase text-xs h-9">Manage Shops</Button>
          <Button onClick={() => setTab("moderation")} className="bg-yellow-500 hover:bg-yellow-600 text-white tracking-widest uppercase text-xs h-9 gap-2 shadow-sm rounded-none">
            Review Requests <Badge className="bg-black/20 text-white border-0 hover:bg-black/30 px-1.5 py-0 h-5">1</Badge>
          </Button>
          <Button onClick={() => setTab("plans")} className="bg-cyan-500 hover:bg-cyan-600 text-white tracking-widest uppercase text-xs shadow-sm h-9">Subscription Plans</Button>
          <Button onClick={() => setTab("accounts")} className="bg-slate-600 hover:bg-slate-700 text-white tracking-widest uppercase text-xs shadow-sm h-9">Manage Shop Types</Button>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex flex-wrap h-auto gap-8 bg-transparent border-b border-border rounded-none w-full justify-start p-0 mb-8 overflow-x-auto">
            <TabsTrigger value="stats" className="rounded-none border-b-2 bg-transparent px-0 pb-4 pt-2 uppercase tracking-widest text-[10px] md:text-xs font-bold transition-all data-[state=active]:bg-transparent data-[state=active]:border-gold data-[state=active]:text-foreground text-muted-foreground border-transparent hover:text-foreground/80 shadow-none whitespace-nowrap gap-2"><BarChart3 className="h-3.5 w-3.5" /> Statistics</TabsTrigger>
            <TabsTrigger value="plans" className="rounded-none border-b-2 bg-transparent px-0 pb-4 pt-2 uppercase tracking-widest text-[10px] md:text-xs font-bold transition-all data-[state=active]:bg-transparent data-[state=active]:border-gold data-[state=active]:text-foreground text-muted-foreground border-transparent hover:text-foreground/80 shadow-none whitespace-nowrap gap-2"><CreditCard className="h-3.5 w-3.5" /> Plans</TabsTrigger>
            <TabsTrigger value="accounts" className="rounded-none border-b-2 bg-transparent px-0 pb-4 pt-2 uppercase tracking-widest text-[10px] md:text-xs font-bold transition-all data-[state=active]:bg-transparent data-[state=active]:border-gold data-[state=active]:text-foreground text-muted-foreground border-transparent hover:text-foreground/80 shadow-none whitespace-nowrap gap-2"><Users className="h-3.5 w-3.5" /> Accounts</TabsTrigger>
            <TabsTrigger value="moderation" className="rounded-none border-b-2 bg-transparent px-0 pb-4 pt-2 uppercase tracking-widest text-[10px] md:text-xs font-bold transition-all data-[state=active]:bg-transparent data-[state=active]:border-gold data-[state=active]:text-foreground text-muted-foreground border-transparent hover:text-foreground/80 shadow-none whitespace-nowrap gap-2"><Shield className="h-3.5 w-3.5" /> Moderation</TabsTrigger>
            <TabsTrigger value="website" className="rounded-none border-b-2 bg-transparent px-0 pb-4 pt-2 uppercase tracking-widest text-[10px] md:text-xs font-bold transition-all data-[state=active]:bg-transparent data-[state=active]:border-gold data-[state=active]:text-foreground text-muted-foreground border-transparent hover:text-foreground/80 shadow-none whitespace-nowrap gap-2"><Globe className="h-3.5 w-3.5" /> Website</TabsTrigger>
            <TabsTrigger value="promotions" className="rounded-none border-b-2 bg-transparent px-0 pb-4 pt-2 uppercase tracking-widest text-[10px] md:text-xs font-bold transition-all data-[state=active]:bg-transparent data-[state=active]:border-gold data-[state=active]:text-foreground text-muted-foreground border-transparent hover:text-foreground/80 shadow-none whitespace-nowrap gap-2"><Megaphone className="h-3.5 w-3.5" /> Promotions</TabsTrigger>
            <TabsTrigger value="coupons" className="rounded-none border-b-2 bg-transparent px-0 pb-4 pt-2 uppercase tracking-widest text-[10px] md:text-xs font-bold transition-all data-[state=active]:bg-transparent data-[state=active]:border-gold data-[state=active]:text-foreground text-muted-foreground border-transparent hover:text-foreground/80 shadow-none whitespace-nowrap gap-2"><Ticket className="h-3.5 w-3.5" /> Coupons</TabsTrigger>
            <TabsTrigger value="sms" className="rounded-none border-b-2 bg-transparent px-0 pb-4 pt-2 uppercase tracking-widest text-[10px] md:text-xs font-bold transition-all data-[state=active]:bg-transparent data-[state=active]:border-gold data-[state=active]:text-foreground text-muted-foreground border-transparent hover:text-foreground/80 shadow-none whitespace-nowrap gap-2"><MessageSquare className="h-3.5 w-3.5" /> SMS</TabsTrigger>
          </TabsList>

          <div className="bg-card border border-border shadow-sm p-8 min-h-[500px] rounded-sm">
            <TabsContent value="stats" className="mt-0 outline-none"><SystemStats /></TabsContent>
            <TabsContent value="plans" className="mt-0 outline-none"><SubscriptionManager /></TabsContent>
            <TabsContent value="accounts" className="mt-0 outline-none"><AccountManager /></TabsContent>
            <TabsContent value="moderation" className="mt-0 outline-none"><SalonModeration /></TabsContent>
            <TabsContent value="website" className="mt-0 outline-none"><WebsiteManager /></TabsContent>
            <TabsContent value="promotions" className="mt-0 outline-none"><PromotionManager /></TabsContent>
            <TabsContent value="coupons" className="mt-0 outline-none"><CouponManager /></TabsContent>
            <TabsContent value="sms" className="mt-0 outline-none"><SmsManager /></TabsContent>
          </div>
        </Tabs>
      </div>
    </motion.div>
  );
};

export default Admin;
