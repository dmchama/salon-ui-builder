import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle, ExternalLink, FileText, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/app-shell/parts";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/api/http";
import {
  approveRegistrationPayment,
  fetchOwnerRegistrationPayment,
  rejectRegistrationPayment,
  type RegistrationPaymentStatus,
} from "@/api/admin-api";

const rejectSchema = z.object({
  reason: z.string().trim().min(1, "Please give a reason").max(500, "Keep it under 500 characters"),
});
type RejectForm = z.infer<typeof rejectSchema>;


const colomboDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-LK", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const money = (cents: number, currency: string) =>
  new Intl.NumberFormat("en-LK", { style: "currency", currency, maximumFractionDigits: 2 }).format(cents / 100);

type Props = { ownerId: string | null; onClose: () => void };

/** Admin view of an owner's payment receipt with Approve / Reject (spec 002 AC15–AC18). */
const RegistrationPaymentDialog = ({ ownerId, onClose }: Props) => {
  const qc = useQueryClient();
  const [rejecting, setRejecting] = useState(false);
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const form = useForm<RejectForm>({ resolver: zodResolver(rejectSchema), defaultValues: { reason: "" } });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-registration-payment", ownerId],
    queryFn: () => fetchOwnerRegistrationPayment(ownerId!),
    enabled: !!ownerId,
  });

  const done = (message: string) => {
    toast.success(message);
    qc.invalidateQueries({ queryKey: ["admin-owners"] });
    qc.invalidateQueries({ queryKey: ["admin-registration-payment", ownerId] });
    setRejecting(false);
    form.reset();
    onClose();
  };
  const fail = (e: unknown) => toast.error(e instanceof ApiError ? e.message : "Something went wrong");

  const approve = useMutation({
    mutationFn: (id: string) => approveRegistrationPayment(id),
    onSuccess: () => done("Payment approved — account is now active"),
    onError: fail,
  });
  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectRegistrationPayment(id, reason),
    onSuccess: () => done("Payment rejected — the owner can upload a new receipt"),
    onError: fail,
  });

  const payment = data?.payment ?? null;
  const isPdf = payment?.receiptFormat === "pdf";
  const busy = approve.isPending || reject.isPending;

  return (
    <Dialog
      open={!!ownerId}
      onOpenChange={(open) => {
        if (!open) {
          setRejecting(false);
          form.reset();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Registration payment</DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {isError && <p className="text-sm text-destructive py-6">Could not load the payment.</p>}

        {data && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Owner</p>
                <p className="font-medium">{data.owner.displayName}</p>
                <p className="text-muted-foreground">{data.owner.email}</p>
              </div>
              {payment && (
                <div>
                  <p className="text-xs text-muted-foreground">Plan & amount</p>
                  <p className="font-medium">{payment.planName}</p>
                  <p className="text-lg font-semibold">{money(payment.amountCents, payment.currency)}</p>
                </div>
              )}
            </div>

            {!payment && (
              <p className="text-sm text-muted-foreground border border-dashed p-6 text-center">
                This owner has not uploaded a payment receipt.
              </p>
            )}

            {payment && (
              <>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <StatusBadge kind="payment" status={payment.status} />
                  <span className="text-muted-foreground">Uploaded {colomboDateTime(payment.createdAt)}</span>
                  {payment.reviewedAt && (
                    <span className="text-muted-foreground">· Reviewed {colomboDateTime(payment.reviewedAt)}</span>
                  )}
                </div>
                {payment.rejectionReason && (
                  <p className="text-sm text-red-700">Rejection reason: {payment.rejectionReason}</p>
                )}

                {isPdf || failedImageUrl === payment.receiptUrl ? (
                  <a
                    href={payment.receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 border p-8 text-sm font-semibold hover:bg-muted"
                  >
                    <FileText className="h-5 w-5" />
                    {isPdf ? "Open PDF receipt" : "Preview unavailable — open receipt"}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : (
                  <a href={payment.receiptUrl} target="_blank" rel="noreferrer" title="Open full size">
                    <img
                      src={payment.receiptUrl}
                      alt="Payment receipt"
                      onError={() => setFailedImageUrl(payment.receiptUrl)}
                      className="w-full max-h-[60vh] object-contain border bg-muted"
                    />
                  </a>
                )}

                {payment.status === "PENDING" && !rejecting && (
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" disabled={busy} onClick={() => setRejecting(true)} className="gap-2">
                      <XCircle className="h-4 w-4" /> Reject
                    </Button>
                    <Button
                      disabled={busy}
                      onClick={() => approve.mutate(payment.id)}
                      className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {approve.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                      Approve & activate
                    </Button>
                  </div>
                )}

                {payment.status === "PENDING" && rejecting && (
                  <form
                    className="space-y-3"
                    onSubmit={form.handleSubmit(({ reason }) => reject.mutate({ id: payment.id, reason }))}
                  >
                    <Label htmlFor="reject-reason">Reason (shown to the owner)</Label>
                    <Textarea
                      id="reject-reason"
                      rows={3}
                      placeholder="e.g. The amount on the receipt does not match the plan price"
                      {...form.register("reason")}
                    />
                    {form.formState.errors.reason && (
                      <p className="text-xs text-destructive">{form.formState.errors.reason.message}</p>
                    )}
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="ghost" disabled={busy} onClick={() => setRejecting(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" variant="destructive" disabled={busy} className="gap-2">
                        {reject.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                        Reject receipt
                      </Button>
                    </div>
                  </form>
                )}
              </>
            )}

            {data.history.length > 0 && (
              <div className="space-y-2 border-t pt-4">
                <p className="text-xs text-muted-foreground">Earlier receipts</p>
                {data.history.map((h) => (
                  <div key={h.id} className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                    <StatusBadge kind="payment" status={h.status} />
                    <span>{colomboDateTime(h.createdAt)}</span>
                    {h.rejectionReason && <span>— {h.rejectionReason}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RegistrationPaymentDialog;
