import { useQuery } from "@tanstack/react-query";
import { fetchMyRegistrationPayment, MY_REGISTRATION_PAYMENT_KEY } from "@/api/registration-payments-api";

/** The owner's account status and latest receipt, read from the API rather than the stored login user (spec 002). */
export function useMyRegistrationPayment() {
  return useQuery({ queryKey: MY_REGISTRATION_PAYMENT_KEY, queryFn: fetchMyRegistrationPayment });
}
