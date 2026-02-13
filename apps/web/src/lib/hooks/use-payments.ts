import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface PaymentIntentResponse {
  client_secret: string;
  payment_intent_id: string;
  amount_cents: number;
  currency: string;
}

export function useCreatePaymentIntent() {
  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const { data } = await api.post<PaymentIntentResponse>("/payments/create-intent", {
        invoice_id: invoiceId,
      });
      return data;
    },
  });
}
