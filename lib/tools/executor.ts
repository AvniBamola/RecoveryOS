import { RecoveryAction, RecoveryCase } from "../recovery/types";

export interface ToolResult {
  success: boolean;
  status: string;
  externalReference?: string;
  metadata?: Record<string, unknown>;
}

export async function executeRecoveryAction(
  recoveryCase: RecoveryCase,
  action: RecoveryAction
): Promise<ToolResult> {
  switch (action) {
    case "RETRY_NOW":
      return {
        success: true,
        status: "RETRY_TRIGGERED",
        metadata: { paymentId: recoveryCase.paymentId },
      };

    case "RETRY_LATER":
      return {
        success: true,
        status: "RETRY_SCHEDULED",
        metadata: { paymentId: recoveryCase.paymentId },
      };

    case "UPDATE_PAYMENT_METHOD":
      return {
        success: true,
        status: "PAYMENT_METHOD_UPDATE_REQUESTED",
      };

    case "SEND_PAYMENT_LINK":
      return {
        success: true,
        status: "PAYMENT_LINK_CREATED",
        externalReference: `plink_${recoveryCase.id}`,
      };

    case "PROMISE_TO_PAY":
      return {
        success: true,
        status: "PROMISE_TO_PAY_CREATED",
      };

    case "ESCALATE_TO_HUMAN":
      return {
        success: true,
        status: "ESCALATED_TO_HUMAN",
      };

    case "STOP_RECOVERY":
      return {
        success: true,
        status: "RECOVERY_STOPPED",
      };
  }
}