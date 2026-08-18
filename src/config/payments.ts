/**
 * Payment provider abstraction.
 *
 * The browser never chooses a provider, never computes an amount and never
 * marks a payment successful. It asks the server to create an order, hands the
 * user to the provider, then asks the server for the verified status.
 */

export type PaymentProvider = "cashfree" | "stripe";

export type PaymentStatus =
  | "awaiting_payment"
  | "processing"
  | "successful"
  | "failed"
  | "cancelled"
  | "pending_verification"
  | "refunded"
  | "partially_refunded";

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  awaiting_payment: "Awaiting payment",
  processing: "Processing",
  successful: "Payment verified",
  failed: "Payment failed",
  cancelled: "Payment cancelled",
  pending_verification: "Pending verification",
  refunded: "Refunded",
  partially_refunded: "Partially refunded",
};

/** Cashfree serves INR/UPI; Stripe serves international currencies. */
export function providerForCurrency(currency: string): PaymentProvider {
  return currency.toUpperCase() === "INR" ? "cashfree" : "stripe";
}

/** Names of the backend secrets an operator must supply before live payment. */
export const REQUIRED_PAYMENT_SECRETS: Record<PaymentProvider, string[]> = {
  cashfree: ["CASHFREE_APP_ID", "CASHFREE_SECRET_KEY", "CASHFREE_WEBHOOK_SECRET"],
  stripe: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
};
