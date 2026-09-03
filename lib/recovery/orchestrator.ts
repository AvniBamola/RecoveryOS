import { RecoveryCase } from "./types";
import { buildRecoveryContext } from "./context-builder";
import { generateMockDecision } from "../ai/decision-engine";
import { evaluatePolicies } from "../policy/policy-engine";
import { executeRecoveryAction } from "../tools/executor";
import { logAuditEvent } from "../audit/logger";

export async function processRecoveryCase(
  recoveryCase: RecoveryCase
) {
  logAuditEvent(
    "CASE_PROCESSING_STARTED",
    `Started processing ${recoveryCase.id}`
  );

  const context = buildRecoveryContext(recoveryCase);

  logAuditEvent(
    "CONTEXT_BUILT",
    "Recovery context created",
    {
      ...context,
    }
  );

  const decision = generateMockDecision(recoveryCase);

  logAuditEvent(
    "DECISION_GENERATED",
    `Decision: ${decision.action}`,
    {
      confidence: decision.confidence,
      reason: decision.reason,
      delayHours: decision.delayHours,
    }
  );

  const policyResult = evaluatePolicies(
    recoveryCase,
    decision
  );

  // If policy blocks the AI decision
  if (!policyResult.approved) {
    logAuditEvent(
      "POLICY_BLOCKED",
      `Action ${decision.action} was blocked`,
      {
        violations: policyResult.violations,
        fallbackAction: policyResult.fallbackAction,
        requiresHuman: policyResult.requiresHuman,
      }
    );

    // No safe fallback available
    if (!policyResult.fallbackAction) {
      return {
        recoveryCase,
        context,
        decision,
        policyResult,
        execution: null,
      };
    }

    // Execute safe fallback
    const fallbackExecution =
      await executeRecoveryAction(
        recoveryCase,
        policyResult.fallbackAction
      );

    logAuditEvent(
      "FALLBACK_EXECUTED",
      `Executed fallback ${policyResult.fallbackAction}`,
      {
        ...fallbackExecution,
      }
    );

    return {
      recoveryCase,
      context,
      decision,
      policyResult,
      execution: fallbackExecution,
    };
  }

  // AI decision passed policy
  logAuditEvent(
    "POLICY_APPROVED",
    `Action ${decision.action} approved`,
    {
      action: decision.action,
    }
  );

  const execution =
    await executeRecoveryAction(
      recoveryCase,
      decision.action
    );

  logAuditEvent(
    "ACTION_EXECUTED",
    `Executed ${decision.action}`,
    {
      ...execution,
    }
  );

  return {
    recoveryCase,
    context,
    decision,
    policyResult,
    execution,
  };
}