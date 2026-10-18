import { UserRound, Users } from "lucide-react";
import type { PublicSalonTechnician } from "@/api/salon-api";
import { cn } from "@/lib/utils";

type Props = {
  technicians: PublicSalonTechnician[];
  selected: string;
  onSelect: (id: string) => void;
};

const ProfessionalStep = ({ technicians, selected, onSelect }: Props) => {
  const options = [
    { id: "", name: "Any professional", detail: "For maximum availability", any: true },
    ...technicians.map((t) => ({ id: t.id, name: t.name, detail: t.specialization ?? "", any: false })),
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="listbox" aria-label="Professionals">
      {options.map((o) => {
        const isSelected = o.id === selected;
        return (
          <button
            key={o.id || "any"}
            type="button"
            role="option"
            aria-selected={isSelected}
            onClick={() => onSelect(o.id)}
            className={cn(
              "flex items-center gap-4 p-5 rounded-xl border bg-white text-left transition-colors",
              isSelected ? "border-gold ring-2 ring-gold" : "border-gray-200 hover:border-gray-400",
            )}
          >
            <span className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
              {o.any ? <Users className="h-5 w-5 text-gold" /> : <UserRound className="h-5 w-5 text-gold" />}
            </span>
            <span className="min-w-0">
              <span className="block font-semibold text-gray-900">{o.name}</span>
              {o.detail && <span className="block text-sm text-gray-500 truncate">{o.detail}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default ProfessionalStep;
