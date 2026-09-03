import { NextResponse } from "next/server";

import { sampleCases } from "@/lib/recovery/sample-cases";
import { generateLLMDecision } from "@/lib/ai/llm-decision-engine";

export async function GET() {
  try {
    const recoveryCase = sampleCases[2];

    const decision =
      await generateLLMDecision(recoveryCase);

    return NextResponse.json({
      success: true,
      recoveryCase,
      decision,
    });
  } catch (error) {
    console.error("AI decision failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "AI decision failed",
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}