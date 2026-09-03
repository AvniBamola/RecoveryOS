export type FailureReason =
  | "NETWORK_ERROR"
  | "ISSUER_UNAVAILABLE"
  | "INSUFFICIENT_FUNDS"
  | "CARD_EXPIRED"
  | "PAYMENT_METHOD_INVALID"
  | "AUTHENTICATION_FAILED"
  | "LIMIT_EXCEEDED"
  | "MANDATE_FAILED"
  | "INVOICE_OVERDUE"
  | "CUSTOMER_ABANDONED"
  | "UNKNOWN";

export type RecoveryAction =
  | "RETRY_NOW"
  | "RETRY_LATER"
  | "UPDATE_PAYMENT_METHOD"
  | "SEND_PAYMENT_LINK"
  | "PROMISE_TO_PAY"
  | "ESCALATE_TO_HUMAN"
  | "STOP_RECOVERY";

export type RecoveryStatus =
  | "AT_RISK"
  | "IN_RECOVERY"
  | "WAITING"
  | "ESCALATED"
  | "RECOVERED"
  | "STOPPED";

export interface RecoveryCase {
  id: string;
  paymentId: string;

  amount: number;
  currency: "INR";

  paymentMethod: string;
  failureReason: FailureReason;

  attemptCount: number;
  lastAttemptHoursAgo: number;

  successfulPayments: number;
  failedPayments: number;

  previousActions: RecoveryAction[];

  customerMessage?: string;

  status: RecoveryStatus;
}