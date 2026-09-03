import { RecoveryCase, RecoveryAction } from "../recovery/types";
import { RecoveryDecision } from "../ai/schemas";

export interface PolicyResult {
  approved: boolean;
  requiresHuman: boolean;
  violations: string[];
  fallbackAction?: RecoveryAction;
}

export function evaluatePolicies(
  recoveryCase: RecoveryCase,
  decision: RecoveryDecision
): PolicyResult {
  const violations: string[] = [];

  let requiresHuman = false;
  let fallbackAction: RecoveryAction | undefined;

  const isRetryAction =
    decision.action === "RETRY_NOW" ||
    decision.action === "RETRY_LATER";

  // Rule 1: Do not retry indefinitely
  if (isRetryAction && recoveryCase.attemptCount >= 3) {
    violations.push("MAX_RETRY_LIMIT_REACHED");
    fallbackAction = "ESCALATE_TO_HUMAN";
  }

  // Rule 2: Hard failures should not be retried
  if (
    isRetryAction &&
    (recoveryCase.failureReason === "CARD_EXPIRED" ||
      recoveryCase.failureReason === "PAYMENT_METHOD_INVALID")
  ) {
    violations.push("HARD_DECLINE_RETRY_FORBIDDEN");
    fallbackAction = "UPDATE_PAYMENT_METHOD";
  }

  // Rule 3: Prevent immediate retries too soon
  if (
    decision.action === "RETRY_NOW" &&
    recoveryCase.lastAttemptHoursAgo < 1
  ) {
    violations.push("RETRY_COOLDOWN_NOT_MET");
    fallbackAction = "RETRY_LATER";
  }

  // Rule 4: Low-confidence decisions need human review
  if (decision.confidence < 0.65) {
    violations.push("LOW_CONFIDENCE");
    requiresHuman = true;
    fallbackAction = "ESCALATE_TO_HUMAN";
  }

  // Rule 5: High-value cases need human review
  if (recoveryCase.amount >= 50000) {
    requiresHuman = true;
    violations.push("HIGH_VALUE_REQUIRES_REVIEW");
    fallbackAction = "ESCALATE_TO_HUMAN";
  }

  // Rule 6: Do not process terminal cases again
  if (
    recoveryCase.status === "RECOVERED" ||
    recoveryCase.status === "STOPPED"
  ) {
    violations.push("TERMINAL_CASE");
    fallbackAction = "STOP_RECOVERY";
  }

  return {
    approved: violations.length === 0,
    requiresHuman,
    violations,
    fallbackAction,
  };
}