import OpenAI from "openai";

import {
  RecoveryDecision,
  RecoveryDecisionSchema,
} from "@/lib/ai/schemas";

import { RecoveryCase } from "@/lib/recovery/types";
import { buildRecoveryContext } from "@/lib/recovery/context-builder";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateLLMDecision(
  recoveryCase: RecoveryCase
): Promise<RecoveryDecision> {
  const context = buildRecoveryContext(recoveryCase);

  const response = await openai.responses.create({
    model: "gpt-5.6-luna",

    instructions: `
You are the AI decision layer inside RecoveryOS,
a bounded revenue recovery system.

Your job is to propose the most appropriate next
recovery action.

You CANNOT execute actions.

A deterministic policy engine will validate your
proposal afterward.

Allowed actions:

RETRY_NOW
RETRY_LATER
UPDATE_PAYMENT_METHOD
SEND_PAYMENT_LINK
PROMISE_TO_PAY
ESCALATE_TO_HUMAN
STOP_RECOVERY

Rules:

- Temporary failures may justify retrying.
- Do not blindly retry hard payment-method failures.
- Consider previous attempts.
- Consider previous actions.
- Consider customer context.
- Avoid unnecessary customer friction.
- Escalate when human judgment is appropriate.
- STOP_RECOVERY is valid when further intervention
  would be unsafe or unjustified.

Return ONLY valid JSON:

{
  "action": "ONE_ALLOWED_ACTION",
  "confidence": 0.0,
  "reason": "short explanation"
}

confidence must be between 0 and 1.
`,

    input: JSON.stringify(context),
  });

  const output = response.output_text;

  if (!output) {
    throw new Error(
      "OpenAI returned an empty response."
    );
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(output);
  } catch {
    throw new Error(
      `OpenAI returned invalid JSON: ${output}`
    );
  }

  return RecoveryDecisionSchema.parse(parsed);
}