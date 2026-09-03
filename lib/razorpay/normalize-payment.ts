import { RecoveryCase } from "@/lib/recovery/types";

type RazorpayPaymentFailedPayload = {
  event: string;

  payload?: {
    payment?: {
      entity?: {
        id?: string;
        amount?: number;
        currency?: string;
        method?: string;
        error_code?: string;
        error_description?: string;
        created_at?: number;
      };
    };
  };
};

function mapFailureReason(
  errorCode?: string
): RecoveryCase["failureReason"] {
  switch (errorCode) {
    case "BAD_REQUEST_ERROR":
      return "PAYMENT_METHOD_INVALID";

    case "GATEWAY_ERROR":
      return "NETWORK_ERROR";

    case "SERVER_ERROR":
      return "ISSUER_UNAVAILABLE";

    default:
      return "NETWORK_ERROR";
  }
}

export function normalizeRazorpayFailure(
  payload: RazorpayPaymentFailedPayload
): RecoveryCase {
  const payment =
    payload.payload?.payment?.entity;

  if (!payment?.id) {
    throw new Error(
      "Invalid Razorpay payment.failed payload"
    );
  }

  return {
    id: `RZP_${payment.id}`,

    paymentId: payment.id,

    amount:
      typeof payment.amount === "number"
        ? payment.amount / 100
        : 0,

    currency: "INR",

    paymentMethod:
      payment.method?.toUpperCase() ??
      "UNKNOWN",

    failureReason: mapFailureReason(
      payment.error_code
    ),

    attemptCount: 1,

    lastAttemptHoursAgo: 0,

    successfulPayments: 0,

    failedPayments: 1,

    previousActions: [],

    customerMessage:
      payment.error_description ??
      "Payment failed at checkout.",

    status: "AT_RISK",
  };
}