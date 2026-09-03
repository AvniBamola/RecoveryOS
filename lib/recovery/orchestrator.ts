import { RecoveryCase } from "./types";
import { buildRecoveryContext } from "./context-builder";
import { generateMockDecision } from "../ai/decision-engine";
import { evaluatePolicies } from "../policy/policy-engine";
import { executeRecoveryAction } from "../tools/executor";
import {
  AuditEvent,
  logAuditEvent,
} from "../audit/logger";

export async function processRecoveryCase(
  recoveryCase: RecoveryCase
) {
  /*
   * Every case gets its own isolated audit trail.
   *
   * We still log globally for terminal observability,
   * but we ALSO return the events with the case result.
   */
  const auditTrail: AuditEvent[] = [];

  function recordAuditEvent(
    type: string,
    message: string,
    metadata?: Record<string, unknown>
  ) {
    const event = logAuditEvent(
      type,
      message,
      metadata
    );

    auditTrail.push(event);

    return event;
  }

  /*
   * -------------------------------------------------
   * 1. CASE RECEIVED
   * -------------------------------------------------
   */

  recordAuditEvent(
    "CASE_PROCESSING_STARTED",
    `Started processing ${recoveryCase.id}`,
    {
      caseId: recoveryCase.id,
      paymentId: recoveryCase.paymentId,
    }
  );

  /*
   * -------------------------------------------------
   * 2. CONTEXT BUILT
   * -------------------------------------------------
   */

  const context =
    buildRecoveryContext(recoveryCase);

  recordAuditEvent(
    "CONTEXT_BUILT",
    "Recovery context created",
    {
      ...context,
    }
  );

  /*
   * -------------------------------------------------
   * 3. AI DECISION
   * -------------------------------------------------
   */

  const decision =
    generateMockDecision(recoveryCase);

  recordAuditEvent(
    "DECISION_GENERATED",
    `Decision: ${decision.action}`,
    {
      confidence: decision.confidence,
      reason: decision.reason,
      delayHours: decision.delayHours,
    }
  );

  /*
   * -------------------------------------------------
   * 4. POLICY VALIDATION
   * -------------------------------------------------
   */

  const policyResult =
    evaluatePolicies(
      recoveryCase,
      decision
    );

  /*
   * -------------------------------------------------
   * POLICY BLOCKED
   * -------------------------------------------------
   */

  if (!policyResult.approved) {
    recordAuditEvent(
      "POLICY_BLOCKED",
      `Action ${decision.action} was blocked`,
      {
        violations:
          policyResult.violations,

        fallbackAction:
          policyResult.fallbackAction,

        requiresHuman:
          policyResult.requiresHuman,
      }
    );

    /*
     * No safe fallback exists.
     */

    if (!policyResult.fallbackAction) {
      recordAuditEvent(
        "RECOVERY_STOPPED",
        "Recovery stopped because no policy-safe fallback was available",
        {
          violations:
            policyResult.violations,
        }
      );

      return {
        recoveryCase,
        context,
        decision,
        policyResult,
        execution: null,
        auditTrail,
      };
    }

    /*
     * -------------------------------------------------
     * 5A. EXECUTE SAFE FALLBACK
     * -------------------------------------------------
     */

    const fallbackExecution =
      await executeRecoveryAction(
        recoveryCase,
        policyResult.fallbackAction
      );

    recordAuditEvent(
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
      execution:
        fallbackExecution,

      auditTrail,
    };
  }

  /*
   * -------------------------------------------------
   * POLICY APPROVED
   * -------------------------------------------------
   */

  recordAuditEvent(
    "POLICY_APPROVED",
    `Action ${decision.action} approved`,
    {
      action: decision.action,
    }
  );

  /*
   * -------------------------------------------------
   * 5B. EXECUTE APPROVED ACTION
   * -------------------------------------------------
   */

  const execution =
    await executeRecoveryAction(
      recoveryCase,
      decision.action
    );

  recordAuditEvent(
    "ACTION_EXECUTED",
    `Executed ${decision.action}`,
    {
      ...execution,
    }
  );

  /*
   * -------------------------------------------------
   * FINAL RESULT
   * -------------------------------------------------
   */

  return {
    recoveryCase,
    context,
    decision,
    policyResult,
    execution,

    auditTrail,
  };
}