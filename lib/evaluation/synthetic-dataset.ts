import { RecoveryCase } from "@/lib/recovery/types";

const failureReasons = [
  "NETWORK_ERROR",
  "ISSUER_UNAVAILABLE",
  "CARD_EXPIRED",
  "PAYMENT_METHOD_INVALID",
  "INSUFFICIENT_FUNDS",
  "INVOICE_OVERDUE",
] as const;

const amounts = [
  499,
  799,
  999,
  1299,
  1999,
  2499,
  4999,
  7999,
  14999,
  24999,
];

export function generateSyntheticDataset(): RecoveryCase[] {
  const cases: RecoveryCase[] = [];

  for (let i = 0; i < 100; i++) {
    const failureReason =
      failureReasons[i % failureReasons.length];

    const amount =
      amounts[(i * 3) % amounts.length];

    const attemptCount = (i % 4) + 1;

    const successfulPayments =
      (i * 7) % 25;

    const failedPayments =
      (i * 3) % 6;

    let paymentMethod = "CARD";

    if (
      failureReason === "ISSUER_UNAVAILABLE"
    ) {
      paymentMethod = "UPI";
    }

    if (
      failureReason === "INVOICE_OVERDUE"
    ) {
      paymentMethod = "BANK_TRANSFER";
    }

    let customerMessage =
      "Customer has not provided additional context.";

    if (
      failureReason === "INSUFFICIENT_FUNDS" &&
      i % 2 === 0
    ) {
      customerMessage =
        "Please try again after a few days.";
    }

    if (
      failureReason === "INVOICE_OVERDUE"
    ) {
      customerMessage =
        i % 2 === 0
          ? "Accounts team expects to pay next week."
          : "Please send another payment link.";
    }

    if (
      failureReason === "CARD_EXPIRED"
    ) {
      customerMessage =
        "My previous card may have expired.";
    }

    cases.push({
      id: `SYN_${String(i + 1).padStart(
        3,
        "0"
      )}`,

      paymentId: `pay_syn_${String(
        i + 1
      ).padStart(3, "0")}`,

      amount,

      currency: "INR",

      paymentMethod,

      failureReason,

      attemptCount,

      lastAttemptHoursAgo:
        ((i * 5) % 72) + 1,

      successfulPayments,

      failedPayments,

      previousActions:
        attemptCount >= 3
          ? ["RETRY_NOW", "RETRY_LATER"]
          : [],

      customerMessage,

      status: "AT_RISK",
    });
  }

  return cases;
}