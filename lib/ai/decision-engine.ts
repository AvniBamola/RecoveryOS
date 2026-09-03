import { RecoveryCase } from "../recovery/types";
import {
  RecoveryDecision,
  RecoveryDecisionSchema,
} from "./schemas";

export function generateMockDecision(
  recoveryCase: RecoveryCase
): RecoveryDecision {
  let decision: RecoveryDecision;

  switch (recoveryCase.failureReason) {
    case "NETWORK_ERROR":
    case "ISSUER_UNAVAILABLE":
      decision = {
        action: "RETRY_NOW",
        confidence: 0.92,
        reason:
          "The failure appears temporary, so an immediate retry may recover the payment.",
      };
      break;

    case "INSUFFICIENT_FUNDS":
      decision = {
        action: "RETRY_LATER",
        confidence: 0.89,
        reason:
          "The failure may be temporary and the customer may have funds available later.",
        delayHours: 48,
      };
      break;

    case "CARD_EXPIRED":
    case "PAYMENT_METHOD_INVALID":
      decision = {
        action: "UPDATE_PAYMENT_METHOD",
        confidence: 0.96,
        reason:
          "Retrying the same payment method is unlikely to resolve this failure.",
      };
      break;

    case "INVOICE_OVERDUE":
      decision = {
        action: "PROMISE_TO_PAY",
        confidence: 0.82,
        reason:
          "The case is an overdue receivable and is better handled through a payment commitment workflow.",
      };
      break;

    default:
      decision = {
        action: "ESCALATE_TO_HUMAN",
        confidence: 0.55,
        reason:
          "The failure does not have enough reliable context for autonomous recovery.",
      };
  }

  return RecoveryDecisionSchema.parse(decision);
}