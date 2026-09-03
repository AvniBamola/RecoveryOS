import { RecoveryCase } from "@/lib/recovery/types";
import { StrategyAction } from "./simulator";

export function fixedRetryStrategy(
  recoveryCase: RecoveryCase
): StrategyAction {
  return "RETRY_NOW";
}

export function ruleBasedStrategy(
  recoveryCase: RecoveryCase
): StrategyAction {
  switch (recoveryCase.failureReason) {
    case "NETWORK_ERROR":
    case "ISSUER_UNAVAILABLE":
      return "RETRY_NOW";

    case "CARD_EXPIRED":
    case "PAYMENT_METHOD_INVALID":
      return "UPDATE_PAYMENT_METHOD";

    case "INSUFFICIENT_FUNDS":
      return recoveryCase.attemptCount >= 3
        ? "ESCALATE_TO_HUMAN"
        : "RETRY_LATER";

    case "INVOICE_OVERDUE":
      return "PROMISE_TO_PAY";

    default:
      return "ESCALATE_TO_HUMAN";
  }
}