import { Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { OwnerDashboardSalon } from "@/api/salon-owner-api";

type Props = {
  salons: OwnerDashboardSalon[];
  selectedSalonId: string | null;
  onSelect: (id: string) => void;
  canAddBranch: boolean;
  onAddBranch: () => void;
};

/** Branch picker + "Add branch" for the dashboard top bar (spec 004 AC7). */
const BranchSwitcher = ({ salons, selectedSalonId, onSelect, canAddBranch, onAddBranch }: Props) => (
  <div className="flex items-center gap-2">
    {salons.length > 0 && (
      <Select value={selectedSalonId ?? ""} onValueChange={onSelect}>
        <SelectTrigger
          className="h-9 w-[150px] whitespace-nowrap rounded-lg bg-card sm:w-[220px] [&>span]:truncate"
          aria-label="Branch"
        >
          <SelectValue placeholder="Choose branch" />
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          {salons.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              <span className="flex items-center gap-2">
                {s.name}
                {s.isDefault && <Star className="h-3 w-3 fill-gold text-gold" aria-label="Default branch" />}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )}
    <Button
      variant="outline"
      size="sm"
      className="h-9 gap-1.5 rounded-lg"
      onClick={onAddBranch}
      disabled={!canAddBranch}
      title={canAddBranch ? "Add a branch" : "Branch limit reached — upgrade your plan to add more"}
      aria-label="Add branch"
    >
      <Plus className="h-4 w-4" />
      <span className="hidden md:inline">Add branch</span>
    </Button>
  </div>
);

export default BranchSwitcher;
