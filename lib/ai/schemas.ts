import { z } from "zod";

export const RecoveryDecisionSchema = z.object({
  action: z.enum([
    "RETRY_NOW",
    "RETRY_LATER",
    "UPDATE_PAYMENT_METHOD",
    "SEND_PAYMENT_LINK",
    "PROMISE_TO_PAY",
    "ESCALATE_TO_HUMAN",
    "STOP_RECOVERY",
  ]),

  confidence: z.number().min(0).max(1),

  reason: z.string().min(1),

  delayHours: z.number().positive().optional(),
});

export type RecoveryDecision =
  z.infer<typeof RecoveryDecisionSchema>;