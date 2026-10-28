import { apiRequest } from "./http";
import { asUploadFile } from "@/lib/receipt-file";
import type { RegistrationPaymentStatus } from "./admin-api";

/** Query key for the signed-in owner's registration payment (spec 002). */
export const MY_REGISTRATION_PAYMENT_KEY = ["registration-payment", "me"] as const;

export type MyRegistrationPayment = {
  accountStatus: "PENDING" | "ACTIVE" | "SUSPENDED";
  payment: {
    id: string;
    status: RegistrationPaymentStatus;
    amountCents: number;
    currency: string;
    planName: string;
    rejectionReason: string | null;
    createdAt: string;
    receiptFormat: string;
    /** Signed URL, valid for about 10 minutes. */
    receiptUrl: string;
  } | null;
};

export async function fetchMyRegistrationPayment(): Promise<MyRegistrationPayment> {
  return apiRequest<MyRegistrationPayment>("/registration-payments/me", { method: "GET" });
}

export async function uploadMyReceipt(receipt: File): Promise<MyRegistrationPayment> {
  const form = new FormData();
  form.append("receipt", asUploadFile(receipt));
  return apiRequest<MyRegistrationPayment>("/registration-payments/me/receipt", { method: "POST", body: form });
}
