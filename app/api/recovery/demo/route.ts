import { NextResponse } from "next/server";
import { sampleCase } from "../../../../lib/recovery/sample-case";
import { processRecoveryCase } from "../../../../lib/recovery/orchestrator";
import { getAuditEvents } from "../../../../lib/audit/logger";

export async function GET() {
  try {
    const result = await processRecoveryCase(sampleCase);

    return NextResponse.json({
      success: true,
      message: "RecoveryOS processed the case successfully",
      result,
      auditTrail: getAuditEvents(),
    });
  } catch (error) {
    console.error("RecoveryOS processing failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "RecoveryOS failed to process the case",
      },
      { status: 500 }
    );
  }
}