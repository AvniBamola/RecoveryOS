import { NextResponse } from "next/server";
import { sampleCases } from "../../../../lib/recovery/sample-cases";
import { processRecoveryCase } from "../../../../lib/recovery/orchestrator";

export async function GET() {
  try {
    const results = [];

    for (const recoveryCase of sampleCases) {
      const result = await processRecoveryCase(recoveryCase);

      results.push(result);
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error("Failed to process recovery cases:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to process recovery cases",
      },
      { status: 500 }
    );
  }
}