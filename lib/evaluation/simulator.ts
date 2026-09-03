import { RecoveryCase } from "@/lib/recovery/types";

export type StrategyAction =
  | "RETRY_NOW"
  | "RETRY_LATER"
  | "UPDATE_PAYMENT_METHOD"
  | "SEND_PAYMENT_LINK"
  | "PROMISE_TO_PAY"
  | "ESCALATE_TO_HUMAN"
  | "STOP_RECOVERY";

export type SimulationResult = {
  recovered: boolean;
  recoveredAmount: number;

  recoveryProbability: number;

  unnecessaryRetry: boolean;

  pendingHumanReview: boolean;

  stoppedSafely: boolean;

  unsafeIntervention: boolean;
};

/*
  Deterministic pseudo-random number.

  Same case + same action = same result every time.

  This keeps our evaluation reproducible instead of
  generating different benchmark numbers on every refresh.
*/
function deterministicScore(
  recoveryCase: RecoveryCase,
  action: StrategyAction
): number {
  const input =
    `${recoveryCase.id}-${action}`;

  let hash = 0;

  for (let i = 0; i < input.length; i++) {
    hash =
      (hash * 31 +
        input.charCodeAt(i)) %
      100000;
  }

  return hash / 100000;
}

function clampProbability(
  value: number
): number {
  return Math.max(
    0,
    Math.min(0.98, value)
  );
}

export function simulateOutcome(
  recoveryCase: RecoveryCase,
  action: StrategyAction
): SimulationResult {
  const {
    amount,
    failureReason,
    attemptCount,
    lastAttemptHoursAgo,
    successfulPayments,
    failedPayments,
    customerMessage,
  } = recoveryCase;

  const message =
    customerMessage?.toLowerCase() ?? "";

  let recoveryProbability = 0;

  let unnecessaryRetry = false;

  let pendingHumanReview = false;

  let stoppedSafely = false;

  let unsafeIntervention = false;

  /*
   * -------------------------------------------------
   * TEMPORARY TECHNICAL FAILURES
   * -------------------------------------------------
   */

  if (
    failureReason === "NETWORK_ERROR" ||
    failureReason === "ISSUER_UNAVAILABLE"
  ) {
    if (action === "RETRY_NOW") {
      recoveryProbability =
        lastAttemptHoursAgo >= 2
          ? 0.78
          : 0.48;

      if (attemptCount >= 3) {
        recoveryProbability -= 0.25;

        unnecessaryRetry = true;
      }
    }

    if (action === "RETRY_LATER") {
      recoveryProbability = 0.72;

      if (lastAttemptHoursAgo < 2) {
        recoveryProbability += 0.12;
      }

      if (attemptCount >= 3) {
        recoveryProbability -= 0.2;
      }
    }

    if (action === "SEND_PAYMENT_LINK") {
      recoveryProbability = 0.38;
    }

    if (action === "ESCALATE_TO_HUMAN") {
      pendingHumanReview = true;
      recoveryProbability = 0;
    }
  }

  /*
   * -------------------------------------------------
   * HARD PAYMENT-METHOD FAILURES
   * -------------------------------------------------
   */

  if (
    failureReason === "CARD_EXPIRED" ||
    failureReason ===
      "PAYMENT_METHOD_INVALID"
  ) {
    if (
      action ===
      "UPDATE_PAYMENT_METHOD"
    ) {
      recoveryProbability = 0.8;

      if (successfulPayments >= 8) {
        recoveryProbability += 0.08;
      }

      if (failedPayments >= 4) {
        recoveryProbability -= 0.1;
      }
    }

    if (action === "SEND_PAYMENT_LINK") {
      recoveryProbability = 0.48;
    }

    if (
      action === "RETRY_NOW" ||
      action === "RETRY_LATER"
    ) {
      recoveryProbability = 0.05;

      unnecessaryRetry = true;
      unsafeIntervention = true;
    }

    if (action === "ESCALATE_TO_HUMAN") {
      pendingHumanReview = true;
    }
  }

  /*
   * -------------------------------------------------
   * INSUFFICIENT FUNDS
   * -------------------------------------------------
   */

  if (
    failureReason ===
    "INSUFFICIENT_FUNDS"
  ) {
    if (action === "RETRY_NOW") {
      recoveryProbability = 0.18;

      if (attemptCount >= 2) {
        unnecessaryRetry = true;
      }

      if (attemptCount >= 3) {
        recoveryProbability = 0.05;
        unsafeIntervention = true;
      }
    }

    if (action === "RETRY_LATER") {
      recoveryProbability = 0.55;

      if (
        message.includes("later") ||
        message.includes("few days")
      ) {
        recoveryProbability += 0.18;
      }

      if (successfulPayments >= 10) {
        recoveryProbability += 0.08;
      }

      if (attemptCount >= 3) {
        recoveryProbability -= 0.4;

        unnecessaryRetry = true;
      }
    }

    if (action === "SEND_PAYMENT_LINK") {
      recoveryProbability = 0.42;

      if (attemptCount >= 2) {
        recoveryProbability += 0.08;
      }
    }

    if (action === "ESCALATE_TO_HUMAN") {
      pendingHumanReview = true;
    }
  }

  /*
   * -------------------------------------------------
   * OVERDUE INVOICE
   * -------------------------------------------------
   */

  if (
    failureReason ===
    "INVOICE_OVERDUE"
  ) {
    if (
      action === "PROMISE_TO_PAY"
    ) {
      recoveryProbability = 0.58;

      if (
        message.includes(
          "accounts team"
        ) ||
        message.includes("next week")
      ) {
        recoveryProbability += 0.22;
      }
    }

    if (
      action === "SEND_PAYMENT_LINK"
    ) {
      recoveryProbability = 0.52;

      if (
        message.includes(
          "payment link"
        )
      ) {
        recoveryProbability += 0.22;
      }
    }

    if (
      action === "RETRY_NOW" ||
      action === "RETRY_LATER"
    ) {
      recoveryProbability = 0.08;
      unnecessaryRetry = true;
    }

    if (
      action ===
      "ESCALATE_TO_HUMAN"
    ) {
      pendingHumanReview = true;
    }
  }

  /*
   * -------------------------------------------------
   * STOPPING
   * -------------------------------------------------
   */

  if (action === "STOP_RECOVERY") {
    recoveryProbability = 0;

    stoppedSafely = true;
  }

  /*
   * Repeated interventions generally reduce success
   * and increase customer friction.
   */

  if (
    attemptCount >= 4 &&
    action !== "STOP_RECOVERY" &&
    action !== "ESCALATE_TO_HUMAN"
  ) {
    recoveryProbability -= 0.12;
  }

  /*
   * A historically reliable customer has a slightly
   * higher probability of completing recovery.
   */

  if (
    successfulPayments >= 15 &&
    recoveryProbability > 0
  ) {
    recoveryProbability += 0.05;
  }

  /*
   * Heavy failure history slightly reduces recovery
   * probability.
   */

  if (
    failedPayments >= 5 &&
    recoveryProbability > 0
  ) {
    recoveryProbability -= 0.08;
  }

  recoveryProbability =
    clampProbability(
      recoveryProbability
    );

  const score =
    deterministicScore(
      recoveryCase,
      action
    );

  const recovered =
    !pendingHumanReview &&
    !stoppedSafely &&
    score < recoveryProbability;

  return {
    recovered,

    recoveredAmount:
      recovered ? amount : 0,

    recoveryProbability,

    unnecessaryRetry,

    pendingHumanReview,

    stoppedSafely,

    unsafeIntervention,
  };
}