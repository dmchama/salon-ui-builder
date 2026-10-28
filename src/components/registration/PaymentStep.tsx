import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Copy, Landmark, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { fetchPublicWebsiteSettings } from "@/api/admin-api";
import ReceiptDropzone from "./ReceiptDropzone";

type Props = {
  planName: string;
  amountLabel: string;
  receipt: File | null;
  onReceiptChange: (file: File | null) => void;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
};

/** Step 3 of registration: where to pay, how much, and the receipt upload (spec 002 AC1–AC5, AC21). */
const PaymentStep = ({ planName, amountLabel, receipt, onReceiptChange, onBack, onSubmit, submitting }: Props) => {
  const { data: settings, isLoading, isError, refetch } = useQuery({
    queryKey: ["website-settings-public"],
    queryFn: fetchPublicWebsiteSettings,
  });
  const details = settings?.paymentDetails ?? null;
  const [preparing, setPreparing] = useState(false);

  const copyAccountNumber = async () => {
    if (!details) return;
    try {
      await navigator.clipboard.writeText(details.accountNumber.replace(/\s+/g, ""));
      toast.success("Account number copied");
    } catch {
      toast.error("Could not copy — please copy it manually.");
    }
  };

  return (
    <div className="w-full max-w-lg">
      <div className="text-center mb-8">
        <h2 className="font-display text-3xl font-bold tracking-tight text-gray-900">Payment</h2>
        <div className="flex items-center justify-center gap-2 mt-3">
          <div className="w-6 h-1.5 rounded-full bg-gold/40" />
          <div className="w-6 h-1.5 rounded-full bg-gold/40" />
          <div className="w-6 h-1.5 rounded-full bg-gold" />
        </div>
        <p className="text-sm text-gray-500 mt-2">Step 3 of 3 — Pay and upload your receipt</p>
      </div>

      <div className="bg-white rounded-3xl shadow-elevated p-6 sm:p-8 space-y-6">
        <div className="flex items-end justify-between gap-4 border-b border-gray-100 pb-5">
          <div>
            <p className="text-xs font-semibold text-gray-500 tracking-wide">Selected plan</p>
            <p className="font-display text-lg font-bold text-gray-900">{planName}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-gray-500 tracking-wide">Amount to pay</p>
            <p className="text-2xl font-bold text-gray-900">{amountLabel}</p>
          </div>
        </div>

        {isLoading && (
          <div className="flex justify-center py-6 gap-2 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading payment details…</span>
          </div>
        )}

        {isError && (
          <div className="text-center space-y-3 py-4">
            <p className="text-sm text-destructive">Could not load payment details.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        )}

        {!isLoading && !isError && !details && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
            Payment details are not available yet — please contact support
            {settings?.supportEmail ? (
              <>
                {" "}
                at{" "}
                <a href={`mailto:${settings.supportEmail}`} className="font-semibold underline">
                  {settings.supportEmail}
                </a>
              </>
            ) : null}
            .
          </div>
        )}

        {details && (
          <>
            <div className="rounded-xl bg-gray-50 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Landmark className="h-4 w-4 text-gold" /> Bank transfer / deposit
              </div>
              <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-sm">
                <dt className="text-gray-500">Bank</dt>
                <dd className="text-gray-900 font-medium">{details.bankName}</dd>
                <dt className="text-gray-500">Account name</dt>
                <dd className="text-gray-900 font-medium">{details.accountName}</dd>
                <dt className="text-gray-500">Account no.</dt>
                <dd className="flex items-center gap-2 text-gray-900 font-medium">
                  <span className="font-mono">{details.accountNumber}</span>
                  <button
                    type="button"
                    onClick={copyAccountNumber}
                    className="text-gold hover:text-gold/80"
                    aria-label="Copy account number"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </dd>
                {details.branch && (
                  <>
                    <dt className="text-gray-500">Branch</dt>
                    <dd className="text-gray-900 font-medium">{details.branch}</dd>
                  </>
                )}
              </dl>
              <p className="text-xs text-gray-500">
                {details.instructions || "Use your email address as the payment reference."}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 tracking-wide">Payment receipt</p>
              <ReceiptDropzone
                file={receipt}
                onChange={onReceiptChange}
                disabled={submitting}
                onPreparingChange={setPreparing}
              />
            </div>
          </>
        )}

        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            onClick={onBack}
            className="gap-2 rounded-xl h-11 px-5 border-gray-200 text-gray-700 hover:bg-gray-50"
            disabled={submitting}
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <Button
            onClick={onSubmit}
            className="gap-2 rounded-xl h-11 px-6 bg-gold hover:bg-gold/90 text-white font-semibold"
            disabled={submitting || preparing || !details || !receipt}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Complete registration <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentStep;
