import type { ReactNode } from "react";
import { AlertTriangle, RefreshCw, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { statusBadge, type StatusKind, type StatusTone } from "@/lib/status-styles";

/** Shared building blocks of the logged-in areas (spec 004 BR3). */

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-[1.75rem]">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** White rounded card with a soft shadow — the standard surface for every section. */
export function Panel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-border/70 bg-card shadow-soft", className)}>
      {(title || actions) && (
        <div className="flex flex-col gap-2 border-b border-border/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {title && <h2 className="text-base font-semibold text-foreground">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function StatCard({ label, value, hint, icon: Icon }: { label: string; value: ReactNode; hint?: string; icon: LucideIcon }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/10 text-gold-strong">
          <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
      </div>
      <div className="mt-3 text-[1.75rem] font-semibold tracking-tight text-foreground">{value}</div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

const TONE_CLASSES: Record<StatusTone, string> = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  warning: "bg-amber-50 text-amber-800 ring-amber-600/25",
  danger: "bg-red-50 text-red-700 ring-red-600/20",
  brand: "bg-gold/10 text-gold-strong ring-gold/30",
  neutral: "bg-muted text-muted-foreground ring-border",
};

export function StatusBadge({ kind, status, className }: { kind: StatusKind; status: string; className?: string }) {
  const { label, tone } = statusBadge(kind, status);
  return <ToneBadge tone={tone} label={label} className={className} />;
}

export function ToneBadge({ tone, label, className }: { tone: StatusTone; label: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10 text-gold-strong">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <p className="font-semibold text-foreground">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Try again
        </Button>
      )}
    </div>
  );
}

export function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 rounded-2xl" />
      ))}
    </div>
  );
}

/** Pill tabs for grouped sections (e.g. Marketing). */
export function SubTabs({ tabs, value, onChange }: { tabs: { id: string; label: string }[]; value: string; onChange: (id: string) => void }) {
  return (
    <div role="tablist" className="mb-6 inline-flex flex-wrap gap-1 rounded-xl bg-muted p-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={t.id === value}
          onClick={() => onChange(t.id)}
          className={cn(
            "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            t.id === value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
