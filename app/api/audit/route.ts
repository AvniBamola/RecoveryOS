import { NextResponse } from "next/server";
import { getAuditEvents } from "@/lib/audit/logger";

export async function GET() {
  try {
    const events = getAuditEvents();

    return NextResponse.json({
      success: true,
      count: events.length,
      events: [...events].reverse(),
    });
  } catch (error) {
    console.error("Failed to fetch audit events:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch audit events",
      },
      { status: 500 }
    );
  }
}