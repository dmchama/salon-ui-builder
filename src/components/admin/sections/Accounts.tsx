import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, CheckCircle, Loader2, Receipt, RefreshCw, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, ErrorState, Panel, SectionSkeleton, StatusBadge, SubTabs, ToneBadge } from "@/components/app-shell/parts";
import RegistrationPaymentDialog from "@/components/admin/RegistrationPaymentDialog";
import { activateOwner, fetchOwners, suspendOwner, type SalonOwnerDto } from "@/api/admin-api";

type Filter = "all" | "active" | "pending" | "suspended";

/** Salon owner accounts with payment review (feature 002) — restyled in feature 004. */
const AccountManager = () => {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("all");
  const [reviewOwnerId, setReviewOwnerId] = useState<string | null>(null);

  const { data: owners = [], isLoading, isError, refetch, isFetching } = useQuery<SalonOwnerDto[]>({
    queryKey: ["admin-owners"],
    queryFn: fetchOwners,
    staleTime: 30_000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-owners"] });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => suspendOwner(id),
    onSuccess: (_d, id) => {
      toast.info(`${owners.find((o) => o.id === id)?.displayName ?? "Owner"} suspended`);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => activateOwner(id),
    onSuccess: (_d, id) => {
      toast.success(`${owners.find((o) => o.id === id)?.displayName ?? "Owner"} activated`);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const anyPending = suspendMutation.isPending || activateMutation.isPending;
  const filtered = filter === "all" ? owners : owners.filter((o) => o.status === filter);
  const counts: Record<Filter, number> = {
    all: owners.length,
    active: owners.filter((o) => o.status === "active").length,
    pending: owners.filter((o) => o.status === "pending").length,
    suspended: owners.filter((o) => o.status === "suspended").length,
  };
  const tabs = (["all", "pending", "active", "suspended"] as const).map((id) => ({
    id,
    label: `${id === "all" ? "All" : id.charAt(0).toUpperCase() + id.slice(1)} (${counts[id]})`,
  }));

  if (isLoading) return <SectionSkeleton />;
  if (isError) {
    return (
      <Panel>
        <ErrorState message="Failed to load accounts." onRetry={() => refetch()} />
      </Panel>
    );
  }

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
          <EmptyState icon={Users} title="No accounts found" description="Try another filter." />
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[860px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Owner</TableHead>
                  <TableHead>Salons</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="pr-5 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((o) => (
                  <TableRow key={o.id} className={o.status === "suspended" ? "opacity-60" : ""}>
                    <TableCell className="pl-5">
                      <div className="font-medium">{o.displayName}</div>
                      <div className="text-xs text-muted-foreground">{o.email}</div>
                      {o.phone && <div className="text-xs text-muted-foreground">{o.phone}</div>}
                    </TableCell>
                    <TableCell className="min-w-[200px]">
                      {o.salons.length === 0 ? (
                        <span className="text-xs text-muted-foreground">No salons yet</span>
                      ) : (
                        <div className="space-y-1">
                          {o.salons.map((s) => (
                            <div key={s.id} className="flex flex-wrap items-center gap-1.5 text-sm">
                              {s.name}
                              <StatusBadge kind="salon" status={s.status} />
                            </div>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {o.subscription ? (
                        <ToneBadge tone="neutral" label={o.subscription.planName} />
                      ) : (
                        <span className="text-xs text-muted-foreground">No plan</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {o.registrationPayment ? (
                        <StatusBadge kind="payment" status={o.registrationPayment.status} />
                      ) : (
                        <span className="text-xs text-muted-foreground">No receipt</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge kind="account" status={o.status} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(o.joinedAt).toLocaleDateString("en-LK", { year: "numeric", month: "short", day: "numeric" })}
                    </TableCell>
                    <TableCell className="pr-5">
                      <div className="flex justify-end gap-1">
                        {/* Approval of PENDING owners happens in the payment dialog (spec 002 AC17). */}
                        {o.registrationPayment && (
                          <Button
                            variant={o.status === "pending" && o.registrationPayment.status === "PENDING" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setReviewOwnerId(o.id)}
                            className="gap-1.5"
                          >
                            <Receipt className="h-4 w-4" />
                            {o.status === "pending" && o.registrationPayment.status === "PENDING" ? "Review payment" : "Receipt"}
                          </Button>
                        )}
                        {(o.status === "pending" || o.status === "active") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-destructive hover:bg-red-50 hover:text-destructive"
                            disabled={anyPending}
                            onClick={() => suspendMutation.mutate(o.id)}
                            aria-label={o.status === "pending" ? "Reject or suspend account" : "Suspend account"}
                            title={o.status === "pending" ? "Reject / suspend" : "Suspend account"}
                          >
                            {suspendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                          </Button>
                        )}
                        {o.status === "suspended" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                            disabled={anyPending}
                            onClick={() => activateMutation.mutate(o.id)}
                            aria-label="Reactivate account"
                            title="Reactivate account"
                          >
                            {activateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                          </Button>
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
      <RegistrationPaymentDialog ownerId={reviewOwnerId} onClose={() => setReviewOwnerId(null)} />
    </div>
  );
};

export default AccountManager;
