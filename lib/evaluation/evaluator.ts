import { RecoveryCase } from "@/lib/recovery/types";

import {
  fixedRetryStrategy,
  ruleBasedStrategy,
} from "./baselines";

import {
  simulateOutcome,
  StrategyAction,
} from "./simulator";

import { generateSyntheticDataset } from "./synthetic-dataset";

type StrategyMetrics = {
  strategy: string;

  totalCases: number;
  totalAtRisk: number;

  recoveredCases: number;
  recoveredRevenue: number;
  recoveryRate: number;

  interventions: number;

  unnecessaryRetries: number;
  unsafeInterventions: number;

  escalations: number;
  pendingHumanReview: number;

  stoppedRecoveries: number;

  interventionEfficiency: number;
};

function evaluateStrategy(
  dataset: RecoveryCase[],
  strategyName: string,
  strategy: (
    recoveryCase: RecoveryCase
  ) => StrategyAction
): StrategyMetrics {
  let recoveredCases = 0;
  let recoveredRevenue = 0;

  let unnecessaryRetries = 0;
  let unsafeInterventions = 0;

  let escalations = 0;
  let pendingHumanReview = 0;

  let stoppedRecoveries = 0;

  const totalAtRisk = dataset.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  for (const recoveryCase of dataset) {
    const action = strategy(recoveryCase);

    const outcome = simulateOutcome(
      recoveryCase,
      action
    );

    if (outcome.recovered) {
      recoveredCases++;
      recoveredRevenue +=
        outcome.recoveredAmount;
    }

    if (outcome.unnecessaryRetry) {
      unnecessaryRetries++;
    }

    if (outcome.unsafeIntervention) {
      unsafeInterventions++;
    }

    if (action === "ESCALATE_TO_HUMAN") {
      escalations++;
    }

    if (outcome.pendingHumanReview) {
      pendingHumanReview++;
    }

    if (outcome.stoppedSafely) {
      stoppedRecoveries++;
    }
  }

  const unsafeOrWastefulActions =
    unnecessaryRetries +
    unsafeInterventions;

  const interventionEfficiency =
    dataset.length === 0
      ? 0
      : Math.max(
          0,
          1 -
            unsafeOrWastefulActions /
              dataset.length
        );

  return {
    strategy: strategyName,

    totalCases: dataset.length,
    totalAtRisk,

    recoveredCases,
    recoveredRevenue,

    recoveryRate:
      dataset.length === 0
        ? 0
        : recoveredCases / dataset.length,

    interventions: dataset.length,

    unnecessaryRetries,
    unsafeInterventions,

    escalations,
    pendingHumanReview,

    stoppedRecoveries,

    interventionEfficiency,
  };
}

function recoveryOSStrategy(
  recoveryCase: RecoveryCase
): StrategyAction {
  const {
    failureReason,
    attemptCount,
    lastAttemptHoursAgo,
    successfulPayments,
    failedPayments,
    customerMessage,
    amount,
  } = recoveryCase;

  if (
    failureReason === "NETWORK_ERROR" ||
    failureReason === "ISSUER_UNAVAILABLE"
  ) {
    if (attemptCount >= 3) {
      return "ESCALATE_TO_HUMAN";
    }

    if (lastAttemptHoursAgo < 2) {
      return "RETRY_LATER";
    }

    return "RETRY_NOW";
  }

  if (
    failureReason === "CARD_EXPIRED" ||
    failureReason ===
      "PAYMENT_METHOD_INVALID"
  ) {
    return "UPDATE_PAYMENT_METHOD";
  }

  if (
    failureReason ===
    "INSUFFICIENT_FUNDS"
  ) {
    const message =
      customerMessage?.toLowerCase() ?? "";

    if (attemptCount >= 3) {
      return "ESCALATE_TO_HUMAN";
    }

    if (
      message.includes("few days") ||
      message.includes("later")
    ) {
      return "RETRY_LATER";
    }

    if (
      successfulPayments >= 10 &&
      failedPayments <= 2
    ) {
      return "RETRY_LATER";
    }

    return "SEND_PAYMENT_LINK";
  }

  if (
    failureReason === "INVOICE_OVERDUE"
  ) {
    const message =
      customerMessage?.toLowerCase() ?? "";

    if (
      message.includes("next week") ||
      message.includes("accounts team")
    ) {
      return "PROMISE_TO_PAY";
    }

    if (
      message.includes("payment link")
    ) {
      return "SEND_PAYMENT_LINK";
    }

    if (amount >= 20000) {
      return "ESCALATE_TO_HUMAN";
    }

    return "SEND_PAYMENT_LINK";
  }

  return "STOP_RECOVERY";
}

export function runEvaluation() {
  const dataset =
    generateSyntheticDataset();

  const fixedRetry = evaluateStrategy(
    dataset,
    "Fixed Retry",
    fixedRetryStrategy
  );

  const ruleBased = evaluateStrategy(
    dataset,
    "Rule Based",
    ruleBasedStrategy
  );

  const recoveryOS = evaluateStrategy(
    dataset,
    "RecoveryOS",
    recoveryOSStrategy
  );

  const revenueUpliftVsFixed =
    fixedRetry.recoveredRevenue === 0
      ? 0
      : (
          (recoveryOS.recoveredRevenue -
            fixedRetry.recoveredRevenue) /
          fixedRetry.recoveredRevenue
        ) * 100;

  const unnecessaryRetriesPrevented =
    fixedRetry.unnecessaryRetries -
    recoveryOS.unnecessaryRetries;

  const unsafeInterventionsPrevented =
    fixedRetry.unsafeInterventions -
    recoveryOS.unsafeInterventions;

  return {
    generatedAt: new Date().toISOString(),

    dataset: {
      type: "synthetic",
      cases: dataset.length,

      totalAtRisk: dataset.reduce(
        (sum, item) =>
          sum + item.amount,
        0
      ),
    },

    strategies: [
      fixedRetry,
      ruleBased,
      recoveryOS,
    ],

    summary: {
      recoveryOSRevenue:
        recoveryOS.recoveredRevenue,

      recoveryOSRecoveryRate:
        recoveryOS.recoveryRate,

      revenueUpliftVsFixed,

      unnecessaryRetriesPrevented,

      unsafeInterventionsPrevented,

      humanEscalations:
        recoveryOS.escalations,

      interventionEfficiency:
        recoveryOS.interventionEfficiency,
    },
  };
}