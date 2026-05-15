import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  MapPin,
  Save,
  Loader2,
  Globe,
  Phone,
  Mail,
  Link2,
  Clock,
  ImagePlus,
  Trash2,
  GitBranch,
  Star,
  Plus,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import {
  createSalon,
  fetchMySalons,
  publishSalon,
  setDefaultBranch,
  updateSalon,
  type SalonRecord,
} from "@/api/salon-api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { uploadGalleryImage, deleteGalleryItem, fetchGalleryForSalon } from "@/api/gallery-api";
import { ApiError } from "@/api/http";
import { slugify } from "@/lib/utils";
import {
  DAY_LABELS,
  DAY_ORDER,
  type BusinessHoursState,
  businessHoursToJson,
  defaultBusinessHours,
  mergeBusinessHoursFromApi,
} from "@/lib/business-hours";

type DraftForm = {
  name: string;
  slug: string;
  description: string;
  address: string;
  city: string;
  country: string;
  contactPhone: string;
  contactEmail: string;
  websiteUrl: string;
};

const emptyDraft: DraftForm = {
  name: "",
  slug: "",
  description: "",
  address: "",
  city: "",
  country: "",
  contactPhone: "",
  contactEmail: "",
  websiteUrl: "",
};

function salonToForm(s: SalonRecord): DraftForm {
  return {
    name: s.name,
    slug: s.slug,
    description: s.description ?? "",
    address: s.address ?? "",
    city: s.city ?? "",
    country: s.country ?? "",
    contactPhone: s.contactPhone ?? "",
    contactEmail: s.contactEmail ?? "",
    websiteUrl: s.websiteUrl ?? "",
  };
}

const SalonProfileEditor = ({ salonId }: { salonId?: string | null }) => {
  const queryClient = useQueryClient();
  const slugEditedRef = useRef(false);

  const { data: salons = [], isLoading, isError, error } = useQuery({
    queryKey: ["salons", "mine"],
    queryFn: fetchMySalons,
  });

  const [selectedId, setSelectedId] = useState<string | null>(salonId ?? null);
  const selectedSalon = useMemo(
    () => salons.find((s) => s.id === selectedId) ?? null,
    [salons, selectedId],
  );

  const [createForm, setCreateForm] = useState(emptyDraft);
  const [editForm, setEditForm] = useState(emptyDraft);
  const [businessHoursState, setBusinessHoursState] = useState<BusinessHoursState>(() =>
    defaultBusinessHours(),
  );

  const [galleryFile, setGalleryFile] = useState<File | null>(null);
  const [galleryPreview, setGalleryPreview] = useState<string | null>(null);
  const [galleryCaption, setGalleryCaption] = useState("");
  const [galleryFileError, setGalleryFileError] = useState<string | null>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);

  const { data: galleryItems = [], isLoading: galleryLoading } = useQuery({
    queryKey: ["gallery", selectedId],
    queryFn: () => fetchGalleryForSalon(selectedId!),
    enabled: Boolean(selectedId),
  });

  // Sync when parent changes selected branch
  useEffect(() => {
    if (salonId) { setSelectedId(salonId); return; }
    if (salons.length === 0) { setSelectedId(null); return; }
    setSelectedId((prev) => {
      if (prev && salons.some((s) => s.id === prev)) return prev;
      return salons[0].id;
    });
  }, [salonId, salons]);

  useEffect(() => {
    if (selectedSalon) {
      setEditForm(salonToForm(selectedSalon));
      setBusinessHoursState(mergeBusinessHoursFromApi(selectedSalon.businessHours ?? null));
      slugEditedRef.current = true;
    }
  }, [selectedSalon]);

  const invalidateSalons = async () => {
    await queryClient.invalidateQueries({ queryKey: ["salons", "mine"] });
    await queryClient.invalidateQueries({ queryKey: ["owner-dashboard"] });
    await queryClient.invalidateQueries({ queryKey: ["salon-public"] });
    await queryClient.invalidateQueries({ queryKey: ["public-salons"] });
  };

  const createMutation = useMutation({
    mutationFn: () =>
      createSalon({
        name: createForm.name.trim(),
        slug: createForm.slug.trim(),
        description: createForm.description.trim() || undefined,
        address: createForm.address.trim() || undefined,
        city: createForm.city.trim() || undefined,
        country: createForm.country.trim() || undefined,
        contactPhone: createForm.contactPhone.trim() || undefined,
        contactEmail: createForm.contactEmail.trim() || undefined,
        websiteUrl: createForm.websiteUrl.trim() || undefined,
      }),
    onSuccess: async () => {
      slugEditedRef.current = false;
      setCreateForm(emptyDraft);
      toast.success("Salon created (draft). You can publish when ready.");
      await invalidateSalons();
    },
    onError: (e: unknown) => {
      const msg = e instanceof ApiError ? e.message : "Could not create salon";
      toast.error(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!selectedSalon) throw new Error("No salon");
      return updateSalon(selectedSalon.id, {
        name: editForm.name.trim(),
        slug: editForm.slug.trim(),
        description: editForm.description.trim() || undefined,
        address: editForm.address.trim() || undefined,
        city: editForm.city.trim() || undefined,
        country: editForm.country.trim() || undefined,
        contactPhone: editForm.contactPhone.trim() || undefined,
        contactEmail: editForm.contactEmail.trim() || undefined,
        websiteUrl: editForm.websiteUrl.trim() || undefined,
        businessHours: businessHoursToJson(businessHoursState),
      });
    },
    onSuccess: async () => {
      toast.success("Salon profile saved.");
      await invalidateSalons();
    },
    onError: (e: unknown) => {
      const msg = e instanceof ApiError ? e.message : "Could not save salon";
      toast.error(msg);
    },
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => publishSalon(id),
    onSuccess: async () => {
      toast.success("Salon is now published and visible on the public listing.");
      await invalidateSalons();
    },
    onError: (e: unknown) => {
      const msg = e instanceof ApiError ? e.message : "Could not publish";
      toast.error(msg);
    },
  });

  const addGalleryMutation = useMutation({
    mutationFn: () => {
      if (!selectedSalon) throw new Error("No salon");
      if (!galleryFile) throw new Error("Please select an image");
      return uploadGalleryImage(selectedSalon.id, galleryFile, galleryCaption.trim() || undefined);
    },
    onSuccess: async () => {
      setGalleryFile(null);
      setGalleryPreview(null);
      setGalleryCaption("");
      setGalleryFileError(null);
      if (galleryFileInputRef.current) galleryFileInputRef.current.value = "";
      toast.success("Image uploaded to gallery.");
      await queryClient.invalidateQueries({ queryKey: ["gallery", selectedId] });
      await invalidateSalons();
    },
    onError: (e: unknown) => {
      const msg =
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Could not add image";
      toast.error(msg);
    },
  });

  const deleteGalleryMutation = useMutation({
    mutationFn: (itemId: string) => deleteGalleryItem(itemId),
    onSuccess: async () => {
      toast.success("Image removed.");
      await queryClient.invalidateQueries({ queryKey: ["gallery", selectedId] });
      await invalidateSalons();
    },
    onError: (e: unknown) => {
      toast.error(e instanceof ApiError ? e.message : "Could not remove image");
    },
  });

  // ── Branch management ────────────────────────────────────────────────────
  const [addBranchOpen, setAddBranchOpen] = useState(false);
  const [branchForm, setBranchForm] = useState({ name: "", slug: "", city: "", country: "" });
  const branchSlugEditedRef = useRef(false);

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => setDefaultBranch(id),
    onSuccess: async (salon) => {
      toast.success(`"${salon.name}" is now the default branch.`);
      await invalidateSalons();
    },
    onError: (e: unknown) => {
      toast.error(e instanceof ApiError ? e.message : "Could not set default");
    },
  });

  const addBranchMutation = useMutation({
    mutationFn: () =>
      createSalon({
        name: branchForm.name.trim(),
        slug: branchForm.slug.trim(),
        city: branchForm.city.trim() || undefined,
        country: branchForm.country.trim() || undefined,
      }),
    onSuccess: async (salon) => {
      toast.success(`Branch "${salon.name}" created — fill in the profile and publish it.`);
      setBranchForm({ name: "", slug: "", city: "", country: "" });
      branchSlugEditedRef.current = false;
      setAddBranchOpen(false);
      await invalidateSalons();
      setSelectedId(salon.id);
    },
    onError: (e: unknown) => {
      toast.error(e instanceof ApiError ? e.message : "Could not create branch");
    },
  });

  const onCreateNameChange = (value: string) => {
    setCreateForm((f) => {
      const next = { ...f, name: value };
      if (!slugEditedRef.current) {
        next.slug = slugify(value);
      }
      return next;
    });
  };

  const onCreateSlugChange = (value: string) => {
    slugEditedRef.current = true;
    setCreateForm((f) => ({ ...f, slug: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading your salons…
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-destructive text-sm">
        {error instanceof Error ? error.message : "Failed to load salons."}
      </p>
    );
  }

  const hasSalons = salons.length > 0;

  return (
    <div className="space-y-8">
      {!hasSalons && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Create your salon</CardTitle>
            <p className="text-sm text-muted-foreground font-normal">
              Add your business details. Your listing starts as a draft until you publish.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 max-w-xl">
            <div className="space-y-2">
              <Label>Salon name</Label>
              <Input
                value={createForm.name}
                onChange={(e) => onCreateNameChange(e.target.value)}
                placeholder="e.g. Glamour Studio"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>URL slug</Label>
              <Input
                value={createForm.slug}
                onChange={(e) => onCreateSlugChange(e.target.value)}
                placeholder="glamour-studio"
              />
              <p className="text-xs text-muted-foreground">
                Used in your public URL. Lowercase letters, numbers, and hyphens only.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={createForm.description}
                onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                rows={4}
                placeholder="Brief overview for customers…"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> Address
              </Label>
              <Input
                value={createForm.address}
                onChange={(e) => setCreateForm((f) => ({ ...f, address: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={createForm.city}
                  onChange={(e) => setCreateForm((f) => ({ ...f, city: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input
                  value={createForm.country}
                  onChange={(e) => setCreateForm((f) => ({ ...f, country: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" /> Phone
                </Label>
                <Input
                  value={createForm.contactPhone}
                  onChange={(e) => setCreateForm((f) => ({ ...f, contactPhone: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" /> Email
                </Label>
                <Input
                  type="email"
                  value={createForm.contactEmail}
                  onChange={(e) => setCreateForm((f) => ({ ...f, contactEmail: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Link2 className="h-3.5 w-3.5" /> Website
              </Label>
              <Input
                value={createForm.websiteUrl}
                onChange={(e) => setCreateForm((f) => ({ ...f, websiteUrl: e.target.value }))}
                placeholder="https://…"
              />
            </div>
            <Button
              type="button"
              disabled={
                createMutation.isPending ||
                createForm.name.trim().length < 2 ||
                createForm.slug.trim().length < 2
              }
              onClick={() => createMutation.mutate()}
              className="gap-2"
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Create salon
            </Button>
          </CardContent>
        </Card>
      )}

      {hasSalons && (
        <>
          {selectedSalon && (
            <>
              <Card>
                <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
                  <div>
                    <CardTitle className="font-display text-lg">Salon profile</CardTitle>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant={selectedSalon.status === "PUBLISHED" ? "default" : "secondary"}>
                        {selectedSalon.status}
                      </Badge>
                      {selectedSalon.status === "DRAFT" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={publishMutation.isPending}
                          onClick={() => publishMutation.mutate(selectedSalon.id)}
                        >
                          {publishMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Globe className="h-4 w-4 mr-2" />
                          )}
                          Publish to public site
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 max-w-xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Salon name</Label>
                      <Input
                        value={editForm.name}
                        onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Slug</Label>
                      <Input
                        value={editForm.slug}
                        onChange={(e) => setEditForm((f) => ({ ...f, slug: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                      rows={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> Address
                    </Label>
                    <Input
                      value={editForm.address}
                      onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input
                        value={editForm.city}
                        onChange={(e) => setEditForm((f) => ({ ...f, city: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Country</Label>
                      <Input
                        value={editForm.country}
                        onChange={(e) => setEditForm((f) => ({ ...f, country: e.target.value }))}
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    disabled={
                      updateMutation.isPending ||
                      editForm.name.trim().length < 2 ||
                      editForm.slug.trim().length < 2
                    }
                    onClick={() => updateMutation.mutate()}
                    className="gap-2"
                  >
                    {updateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save profile
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <Phone className="h-4 w-4" /> Contact details
                  </CardTitle>
                  <p className="text-sm text-muted-foreground font-normal">
                    Shown on your public salon page (not your login email).
                  </p>
                </CardHeader>
                <CardContent className="space-y-4 max-w-xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={editForm.contactPhone}
                        onChange={(e) => setEditForm((f) => ({ ...f, contactPhone: e.target.value }))}
                        placeholder="+94 …"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={editForm.contactEmail}
                        onChange={(e) => setEditForm((f) => ({ ...f, contactEmail: e.target.value }))}
                        placeholder="contact@salon.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      <Link2 className="h-3.5 w-3.5" /> Website or social link
                    </Label>
                    <Input
                      value={editForm.websiteUrl}
                      onChange={(e) => setEditForm((f) => ({ ...f, websiteUrl: e.target.value }))}
                      placeholder="https://…"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={updateMutation.isPending}
                    onClick={() => updateMutation.mutate()}
                    className="gap-2"
                  >
                    {updateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save contact
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Business hours
                  </CardTitle>
                  <p className="text-sm text-muted-foreground font-normal">
                    Set closed days or open and close times (24h format).
                  </p>
                </CardHeader>
                <CardContent className="space-y-4 max-w-2xl">
                  <div className="space-y-3">
                    {DAY_ORDER.map((day) => {
                      const row = businessHoursState[day];
                      return (
                        <div
                          key={day}
                          className="flex flex-col sm:flex-row sm:items-center gap-3 border border-border p-3 rounded-sm"
                        >
                          <span className="text-sm font-medium w-28 shrink-0">{DAY_LABELS[day]}</span>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`closed-${day}`}
                              checked={row.closed}
                              onCheckedChange={(v) =>
                                setBusinessHoursState((prev) => ({
                                  ...prev,
                                  [day]: { ...prev[day], closed: Boolean(v) },
                                }))
                              }
                            />
                            <Label htmlFor={`closed-${day}`} className="text-sm font-normal cursor-pointer">
                              Closed
                            </Label>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 flex-1">
                            <Input
                              type="time"
                              className="w-36 rounded-none"
                              disabled={row.closed}
                              value={row.open}
                              onChange={(e) =>
                                setBusinessHoursState((prev) => ({
                                  ...prev,
                                  [day]: { ...prev[day], open: e.target.value },
                                }))
                              }
                            />
                            <span className="text-muted-foreground text-sm">to</span>
                            <Input
                              type="time"
                              className="w-36 rounded-none"
                              disabled={row.closed}
                              value={row.close}
                              onChange={(e) =>
                                setBusinessHoursState((prev) => ({
                                  ...prev,
                                  [day]: { ...prev[day], close: e.target.value },
                                }))
                              }
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={updateMutation.isPending}
                    onClick={() => updateMutation.mutate()}
                    className="gap-2"
                  >
                    {updateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save hours
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <ImagePlus className="h-4 w-4" /> Gallery
                  </CardTitle>
                  <p className="text-sm text-muted-foreground font-normal">
                    Upload images directly. They are stored on Cloudinary and the URL is saved automatically. First image is used as the hero on your public page.
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 max-w-xl">
                    <div className="space-y-2">
                      <Label>Image file</Label>
                      <Input
                        ref={galleryFileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          setGalleryFileError(null);
                          if (!file) { setGalleryFile(null); setGalleryPreview(null); return; }
                          if (file.size > 5 * 1024 * 1024) {
                            setGalleryFileError("Image must be smaller than 5 MB");
                            setGalleryFile(null); setGalleryPreview(null);
                            e.target.value = "";
                            return;
                          }
                          setGalleryFile(file);
                          setGalleryPreview(URL.createObjectURL(file));
                        }}
                      />
                      {galleryFileError && (
                        <p className="text-xs text-destructive">{galleryFileError}</p>
                      )}
                      <p className="text-xs text-muted-foreground">JPEG, PNG or WebP · max 5 MB</p>
                    </div>
                    {galleryPreview && (
                      <div className="w-32 h-32 rounded-md overflow-hidden border border-border">
                        <img src={galleryPreview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Caption (optional)</Label>
                      <Input
                        value={galleryCaption}
                        onChange={(e) => setGalleryCaption(e.target.value)}
                        placeholder="Short description"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={addGalleryMutation.isPending || !galleryFile}
                      onClick={() => addGalleryMutation.mutate()}
                      className="gap-2 w-fit"
                    >
                      {addGalleryMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ImagePlus className="h-4 w-4" />
                      )}
                      Upload image
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-muted-foreground uppercase tracking-widest text-xs">
                      Current images ({galleryLoading ? "…" : galleryItems.length})
                    </Label>
                    {galleryItems.length === 0 && !galleryLoading && (
                      <p className="text-sm text-muted-foreground">No gallery images yet.</p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {galleryItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex gap-3 border border-border p-3 rounded-sm items-start"
                        >
                          <div className="w-20 h-20 shrink-0 bg-muted overflow-hidden rounded-sm">
                            <img
                              src={item.url}
                              alt={item.caption ?? ""}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.opacity = "0.3";
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <p className="text-xs text-muted-foreground truncate">{item.url}</p>
                            {item.caption && (
                              <p className="text-xs font-medium truncate">{item.caption}</p>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="shrink-0 text-destructive"
                            disabled={deleteGalleryMutation.isPending}
                            onClick={() => deleteGalleryMutation.mutate(item.id)}
                            aria-label="Remove image"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

      {/* Branches section — shown whenever at least one branch exists */}
      {hasSalons && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <GitBranch className="h-4 w-4" /> Branches
              </CardTitle>
              <p className="text-sm text-muted-foreground font-normal mt-1">
                Manage your locations. The default branch is shown first to customers.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-none text-xs uppercase tracking-widest shrink-0"
              onClick={() => setAddBranchOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" /> Add Branch
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {salons.map((branch) => {
                const locationLine = [branch.city, branch.country].filter(Boolean).join(", ");
                return (
                  <div
                    key={branch.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border rounded-sm transition-colors ${
                      branch.id === selectedId
                        ? "border-foreground/20 bg-muted/40"
                        : "border-border"
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5 shrink-0">
                        {branch.isDefault ? (
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        ) : (
                          <GitBranch className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{branch.name}</span>
                          {branch.isDefault && (
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-sm">
                              Default
                            </span>
                          )}
                          <Badge
                            variant="secondary"
                            className={`text-[10px] px-1.5 py-0 ${
                              branch.status === "PUBLISHED"
                                ? "bg-green-100 text-green-700 border-green-200"
                                : branch.status === "SUSPENDED"
                                ? "bg-red-100 text-red-700 border-red-200"
                                : "bg-secondary text-muted-foreground"
                            }`}
                          >
                            {branch.status}
                          </Badge>
                        </div>
                        {locationLine && (
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {locationLine}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground/60 mt-0.5">/salon/{branch.slug}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pl-7 sm:pl-0">
                      {branch.id !== selectedId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-8"
                          onClick={() => setSelectedId(branch.id)}
                        >
                          Edit
                        </Button>
                      )}
                      {branch.id === selectedId && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Editing
                        </span>
                      )}
                      {!branch.isDefault && branch.status === "PUBLISHED" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 gap-1 border-amber-300 text-amber-700 hover:bg-amber-50"
                          disabled={setDefaultMutation.isPending}
                          onClick={() => setDefaultMutation.mutate(branch.id)}
                        >
                          {setDefaultMutation.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Star className="h-3 w-3" />
                          )}
                          Set Default
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add branch dialog */}
      <Dialog open={addBranchOpen} onOpenChange={setAddBranchOpen}>
        <DialogContent className="rounded-none max-w-md">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-widest text-sm">New Branch</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Branch Name</Label>
              <Input
                placeholder="e.g. Glamour Studio Colombo"
                value={branchForm.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setBranchForm((f) => ({
                    ...f,
                    name,
                    slug: branchSlugEditedRef.current ? f.slug : slugify(name),
                  }));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>URL Slug</Label>
              <Input
                placeholder="glamour-studio-colombo"
                value={branchForm.slug}
                onChange={(e) => {
                  branchSlugEditedRef.current = true;
                  setBranchForm((f) => ({ ...f, slug: e.target.value }));
                }}
              />
              <p className="text-xs text-muted-foreground">Public URL: /salon/{branchForm.slug || "your-slug"}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  placeholder="Colombo"
                  value={branchForm.city}
                  onChange={(e) => setBranchForm((f) => ({ ...f, city: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input
                  placeholder="Sri Lanka"
                  value={branchForm.country}
                  onChange={(e) => setBranchForm((f) => ({ ...f, country: e.target.value }))}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Starts as <strong>Draft</strong>. Go to the branch profile to fill in details and publish.
            </p>
            <Button
              className="w-full rounded-none uppercase tracking-widest text-xs"
              disabled={
                !branchForm.name.trim() ||
                !branchForm.slug.trim() ||
                addBranchMutation.isPending
              }
              onClick={() => addBranchMutation.mutate()}
            >
              {addBranchMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Create Branch
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <p className="text-xs text-muted-foreground border-t border-border pt-6">
        Published salons appear on the public listing and salon detail page with your hours, contact info, and gallery.
      </p>
    </div>
  );
};

export default SalonProfileEditor;
