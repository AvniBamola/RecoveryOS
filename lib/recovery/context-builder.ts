import { RecoveryCase } from "./types";

export function buildRecoveryContext(recoveryCase: RecoveryCase) {
  return {
    amount: recoveryCase.amount,
    currency: recoveryCase.currency,
    paymentMethod: recoveryCase.paymentMethod,
    failureReason: recoveryCase.failureReason,
    attemptCount: recoveryCase.attemptCount,
    lastAttemptHoursAgo: recoveryCase.lastAttemptHoursAgo,
    successfulPayments: recoveryCase.successfulPayments,
    failedPayments: recoveryCase.failedPayments,
    previousActions: recoveryCase.previousActions,
    customerMessage: recoveryCase.customerMessage ?? null,
  };
}