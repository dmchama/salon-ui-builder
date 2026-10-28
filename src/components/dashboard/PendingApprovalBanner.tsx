import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Clock, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/api/http";
import { MY_REGISTRATION_PAYMENT_KEY, uploadMyReceipt } from "@/api/registration-payments-api";
import ReceiptDropzone from "@/components/registration/ReceiptDropzone";
import { useMyRegistrationPayment } from "@/hooks/use-my-registration-payment";

/**
 * Shown while the owner's account is PENDING: payment under review, or rejected with a
 * reason and a re-upload area (spec 002 AC10, AC13). Hidden once the account is ACTIVE.
 */
const PendingApprovalBanner = () => {
  const queryClient = useQueryClient();
  const { data } = useMyRegistrationPayment();
  const [receipt, setReceipt] = useState<File | null>(null);
  const [preparing, setPreparing] = useState(false);

  const upload = useMutation({
    mutationFn: (file: File) => uploadMyReceipt(file),
    onSuccess: (result) => {
      queryClient.setQueryData(MY_REGISTRATION_PAYMENT_KEY, result);
      setReceipt(null);
      toast.success("New receipt uploaded — we'll review it shortly.");
    },
    onError: (e: unknown) => toast.error(e instanceof ApiError ? e.message : "Could not upload the receipt."),
  });

  if (!data || data.accountStatus !== "PENDING") return null;
  const payment = data.payment;
  const rejected = payment?.status === "REJECTED";
  const needsUpload = !payment || rejected;

  return (
    <div
      className={`rounded-2xl border p-5 shadow-soft ${
        rejected ? "border-red-300 bg-red-50 text-red-900" : "border-amber-300 bg-amber-50 text-amber-900"
      }`}
    >
      <div className="flex items-start gap-3">
        {rejected ? <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" /> : <Clock className="h-5 w-5 mt-0.5 shrink-0" />}
        <div className="space-y-2 flex-1">
          <p className="font-semibold">
            {rejected
              ? "Your payment receipt was not accepted"
              : payment
                ? "Your payment is being verified"
                : "Upload your payment receipt"}
          </p>
          <p className="text-sm">
            {rejected ? (
              <>
                Reason: <strong>{payment?.rejectionReason}</strong>. Please upload a new receipt.
              </>
            ) : payment ? (
              "Your account will be activated once the platform admin approves your payment. You can set up your salon in the meantime — publishing and bookings open after approval."
            ) : (
              "Upload the receipt for your plan payment so the platform admin can activate your account."
            )}
          </p>
          {payment && (
            <a
              href={payment.receiptUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm font-semibold underline underline-offset-2"
            >
              View my {rejected ? "previous " : ""}receipt <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}

          {needsUpload && (
            <div className="max-w-md space-y-3 pt-2">
              <ReceiptDropzone
                file={receipt}
                onChange={setReceipt}
                disabled={upload.isPending}
                onPreparingChange={setPreparing}
              />
              <Button
                size="sm"
                disabled={!receipt || preparing || upload.isPending}
                onClick={() => receipt && upload.mutate(receipt)}
              >
                {upload.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Upload receipt
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PendingApprovalBanner;
