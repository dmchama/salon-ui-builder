import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  LogOut, CreditCard, Users, BarChart3, Shield, Globe, Megaphone, Ticket, MessageSquare,
  Plus, Edit, Trash2, Eye, Ban, CheckCircle, TrendingUp, DollarSign, Store, AlertTriangle, Loader2,
  CalendarCheck, Building2, RefreshCw, Receipt,
} from "lucide-react";
import CampaignRequestManager from "@/components/admin/CampaignRequestManager";
import PaymentDetailsForm from "@/components/admin/PaymentDetailsForm";
import RegistrationPaymentDialog from "@/components/admin/RegistrationPaymentDialog";
import Seo from "@/components/Seo";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getAccessToken, getStoredUser } from "@/lib/auth-storage";
import { motion } from "framer-motion";
import {
  fetchAdminStats, AdminStats,
  SalonOwnerDto, fetchOwners, suspendOwner, activateOwner,
  AdminSalonDto, fetchAdminSalons, publishSalon, suspendSalon, draftSalon,
  WebsiteHeroSlide, WebsiteSettings,
  fetchWebsiteSettings, saveHeroSlides, saveFooterSettings, saveSeoSettings,
  AdminPromoCodeDto, fetchAdminPromoCodes,
  OverageInvoiceDto, OverageInvoiceStatus,
  fetchOveragePrice, saveOveragePrice,
  fetchOverageInvoices, generateOverageInvoices,
  sendOverageInvoice, markOverageInvoicePaid, cancelOverageInvoice,
} from "@/api/admin-api";
import {
  AdminPlanDto, CreatePlanPayload, UpdatePlanPayload,
  fetchAdminPlans, createPlan, updatePlan, deletePlan,
} from "@/api/plans-api";

/* Moved unchanged from pages/Admin.tsx (feature 004 T015). */

const WebsiteManager = () => {
  const qc = useQueryClient();
  const [editingSlide, setEditingSlide] = useState<WebsiteHeroSlide | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [footerText, setFooterText] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  const { data: settings, isLoading, isError, refetch } = useQuery<WebsiteSettings>({
    queryKey: ["admin-website"],
    queryFn: fetchWebsiteSettings,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!settings) return;
    setFooterText(settings.footerText);
    setSupportEmail(settings.supportEmail);
    setMetaTitle(settings.metaTitle);
    setMetaDescription(settings.metaDescription);
  }, [settings]);

  const slides = settings?.heroSlides ?? [];
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-website"] });

  const slidesMutation = useMutation({
    mutationFn: (s: WebsiteHeroSlide[]) => saveHeroSlides(s),
    onSuccess: () => { toast.success("Hero slides saved"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const footerMutation = useMutation({
    mutationFn: () => saveFooterSettings({ footerText, supportEmail }),
    onSuccess: () => { toast.success("Footer settings saved"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const seoMutation = useMutation({
    mutationFn: () => saveSeoSettings({ metaTitle, metaDescription }),
    onSuccess: () => { toast.success("SEO settings saved"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleDelete = (id: string) => {
    slidesMutation.mutate(slides.filter(s => s.id !== id));
  };

  const handleSaveSlide = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const mediaType = fd.get("mediaType") as "image" | "video";
    let mediaUrl = editingSlide?.mediaUrl ?? "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1920&q=80";
    const file = fd.get("mediaFile") as File;
    if (file && file.size > 0) {
      mediaUrl = mediaType === "video"
        ? "https://assets.mixkit.co/videos/preview/mixkit-working-with-the-hair-of-a-woman-in-a-hair-43486-large.mp4"
        : "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=1920&q=80";
    }
    const updated: WebsiteHeroSlide = {
      id: editingSlide?.id ?? `slide-${Date.now()}`,
      mediaType,
      mediaUrl,
      title: fd.get("title") as string,
      subtitle: fd.get("subtitle") as string,
      buttonText: fd.get("buttonText") as string,
    };
    const next = editingSlide
      ? slides.map(s => s.id === editingSlide.id ? updated : s)
      : [...slides, updated];
    slidesMutation.mutate(next);
    setIsDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="uppercase tracking-widest text-sm">Loading website settings…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <p className="text-muted-foreground text-sm tracking-wide">Failed to load website settings.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Website Management</h2>
      </div>

      {settings && <PaymentDetailsForm current={settings.paymentDetails} />}

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
        <Card className="rounded-none border border-black/10 shadow-none">
          <CardHeader><CardTitle className="text-sm uppercase tracking-widest font-bold">Footer Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-widest text-black/60 mb-2 block">Footer Text</Label>
              <Input
                className="rounded-none border-black/20"
                value={footerText}
                onChange={e => setFooterText(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-black/60 mb-2 block">Support Email</Label>
              <Input
                className="rounded-none border-black/20"
                type="email"
                value={supportEmail}
                onChange={e => setSupportEmail(e.target.value)}
              />
            </div>
            <Button
              className="w-full bg-black hover:bg-black/90 text-white rounded-none uppercase tracking-widest text-xs"
              onClick={() => footerMutation.mutate()}
              disabled={footerMutation.isPending}
            >
              {footerMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-none border border-black/10 shadow-none">
          <CardHeader><CardTitle className="text-sm uppercase tracking-widest font-bold">SEO Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-widest text-black/60 mb-2 block">Meta Title</Label>
              <Input
                className="rounded-none border-black/20"
                value={metaTitle}
                onChange={e => setMetaTitle(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-black/60 mb-2 block">Meta Description</Label>
              <Textarea
                rows={2}
                className="rounded-none border-black/20"
                value={metaDescription}
                onChange={e => setMetaDescription(e.target.value)}
              />
            </div>
            <Button
              className="w-full bg-black hover:bg-black/90 text-white rounded-none uppercase tracking-widest text-xs"
              onClick={() => seoMutation.mutate()}
              disabled={seoMutation.isPending}
            >
              {seoMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WebsiteManager;
