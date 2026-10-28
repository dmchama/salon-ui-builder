import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, CheckCircle, Loader2, RefreshCw, Store, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, ErrorState, Panel, SectionSkeleton, StatusBadge, SubTabs } from "@/components/app-shell/parts";
import { draftSalon, fetchAdminSalons, publishSalon, suspendSalon, type AdminSalonDto } from "@/api/admin-api";

type Filter = "ALL" | "DRAFT" | "PUBLISHED" | "SUSPENDED";
const FILTER_LABELS: Record<Filter, string> = { ALL: "All", DRAFT: "Draft", PUBLISHED: "Published", SUSPENDED: "Suspended" };

/** Salon moderation: publish, suspend, return to draft — restyled in feature 004. */
const SalonModeration = () => {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("ALL");

  const { data: salons = [], isLoading, isError, refetch, isFetching } = useQuery<AdminSalonDto[]>({
    queryKey: ["admin-salons"],
    queryFn: fetchAdminSalons,
    staleTime: 30_000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-salons"] });
  const nameOf = (id: string) => salons.find((s) => s.id === id)?.name;

  const publishMutation = useMutation({
    mutationFn: (id: string) => publishSalon(id),
    onSuccess: (_d, id) => {
      toast.success(`"${nameOf(id)}" published`);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => suspendSalon(id),
    onSuccess: (_d, id) => {
      toast.info(`"${nameOf(id)}" suspended`);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const draftMutation = useMutation({
    mutationFn: (id: string) => draftSalon(id),
    onSuccess: (_d, id) => {
      toast.info(`"${nameOf(id)}" moved to draft`);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const anyMutating = publishMutation.isPending || suspendMutation.isPending || draftMutation.isPending;
  const counts: Record<Filter, number> = {
    ALL: salons.length,
    DRAFT: salons.filter((s) => s.status === "DRAFT").length,
    PUBLISHED: salons.filter((s) => s.status === "PUBLISHED").length,
    SUSPENDED: salons.filter((s) => s.status === "SUSPENDED").length,
  };
  const filtered = filter === "ALL" ? salons : salons.filter((s) => s.status === filter);
  const tabs = (Object.keys(FILTER_LABELS) as Filter[]).map((id) => ({ id, label: `${FILTER_LABELS[id]} (${counts[id]})` }));

  if (isLoading) return <SectionSkeleton />;
  if (isError) {
    return (
      <Panel>
        <ErrorState message="Failed to load salons." onRetry={() => refetch()} />
      </Panel>
    );
  }

  const iconButton = (label: string, onClick: () => void, busy: boolean, icon: JSX.Element, className: string) => (
    <Button
      variant="ghost"
      size="icon"
      className={`h-9 w-9 ${className}`}
      disabled={anyMutating}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
    </Button>
  );
  const publishBtn = (s: AdminSalonDto, label: string) =>
    iconButton(label, () => publishMutation.mutate(s.id), publishMutation.isPending, <CheckCircle className="h-4 w-4" />,
      "text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800");
  const suspendBtn = (s: AdminSalonDto) =>
    iconButton("Suspend salon", () => suspendMutation.mutate(s.id), suspendMutation.isPending, <Ban className="h-4 w-4" />,
      "text-destructive hover:bg-red-50 hover:text-destructive");
  const draftBtn = (s: AdminSalonDto) =>
    iconButton("Move to draft", () => draftMutation.mutate(s.id), draftMutation.isPending, <Undo2 className="h-4 w-4" />,
      "text-muted-foreground hover:bg-muted hover:text-foreground");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SubTabs tabs={tabs} value={filter} onChange={(id) => setFilter(id as Filter)} />
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-2">
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <Panel bodyClassName="p-0">
        {filtered.length === 0 ? (
          <EmptyState icon={Store} title="No salons found" description="Try another filter." />
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[820px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Salon</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Bookings</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="pr-5 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id} className={s.status === "SUSPENDED" ? "opacity-60" : ""}>
                    <TableCell className="min-w-[200px] pl-5">
                      <div className="font-medium">{s.name}</div>
                      <div className="font-mono text-xs text-muted-foreground">/{s.slug}</div>
                    </TableCell>
                    <TableCell className="min-w-[220px]">
                      <div className="text-sm">{s.owner.displayName}</div>
                      <div className="text-xs text-muted-foreground">{s.owner.email}</div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {[s.city, s.country].filter(Boolean).join(", ") || "—"}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{s.bookingCount}</TableCell>
                    <TableCell>
                      <StatusBadge kind="salon" status={s.status} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(s.createdAt).toLocaleDateString("en-LK", { year: "numeric", month: "short", day: "numeric" })}
                    </TableCell>
                    <TableCell className="pr-5">
                      <div className="flex justify-end gap-1">
                        {s.status === "DRAFT" && (
                          <>
                            {publishBtn(s, "Publish salon")}
                            {suspendBtn(s)}
                          </>
                        )}
                        {s.status === "PUBLISHED" && suspendBtn(s)}
                        {s.status === "SUSPENDED" && (
                          <>
                            {publishBtn(s, "Re-publish salon")}
                            {draftBtn(s)}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Panel>
    </div>
  );
};

export default SalonModeration;
