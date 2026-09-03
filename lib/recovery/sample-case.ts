import { RecoveryCase } from "./types";

export const sampleCase: RecoveryCase = {
  id: "RC_002",
  paymentId: "pay_demo_002",

  amount: 4999,
  currency: "INR",

  paymentMethod: "CARD",
  failureReason: "INSUFFICIENT_FUNDS",

  attemptCount: 3,
  lastAttemptHoursAgo: 30,

  successfulPayments: 8,
  failedPayments: 3,

  previousActions: [
    "RETRY_NOW",
    "RETRY_LATER",
    "RETRY_NOW",
  ],

  customerMessage:
    "Please try again later.",

  status: "AT_RISK",
};