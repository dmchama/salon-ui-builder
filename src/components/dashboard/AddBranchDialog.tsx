import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSalon } from "@/api/salon-api";

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (salonId: string) => void;
};

/** Create a new branch (salon). Starts as Draft. */
const AddBranchDialog = ({ open, onOpenChange, onCreated }: Props) => {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");

  const createMut = useMutation({
    mutationFn: () =>
      createSalon({ name: name.trim(), slug: slug.trim(), city: city.trim() || undefined, country: country.trim() || undefined }),
    onSuccess: async (salon) => {
      await qc.invalidateQueries({ queryKey: ["owner-dashboard"] });
      qc.invalidateQueries({ queryKey: ["salons", "mine"] });
      onOpenChange(false);
      setName("");
      setSlug("");
      setCity("");
      setCountry("");
      onCreated(salon.id);
      toast.success(`Branch "${salon.name}" created — now fill in the profile and publish it.`);
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Failed to create branch"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>New branch</DialogTitle>
          <DialogDescription>
            The branch starts as a draft. Publish it from Salon profile when it's ready (available once your
            account is approved).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="branch-name">Branch name</Label>
            <Input
              id="branch-name"
              placeholder="e.g. Glamour Studio Colombo"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSlug(slugify(e.target.value));
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="branch-slug">URL slug</Label>
            <Input id="branch-slug" placeholder="glamour-studio-colombo" value={slug} onChange={(e) => setSlug(e.target.value)} />
            <p className="text-xs text-muted-foreground">Public URL: /salon/{slug || "your-slug"}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="branch-city">City</Label>
              <Input id="branch-city" placeholder="Colombo" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="branch-country">Country</Label>
              <Input id="branch-country" placeholder="Sri Lanka" value={country} onChange={(e) => setCountry(e.target.value)} />
            </div>
          </div>
          <Button
            className="w-full"
            disabled={!name.trim() || !slug.trim() || createMut.isPending}
            onClick={() => createMut.mutate()}
          >
            {createMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create branch
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddBranchDialog;
