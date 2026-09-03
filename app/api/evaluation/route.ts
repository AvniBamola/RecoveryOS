import { NextResponse } from "next/server";
import { runEvaluation } from "@/lib/evaluation/evaluator";

export async function GET() {
  try {
    const evaluation = runEvaluation();

    return NextResponse.json({
      success: true,
      evaluation,
    });
  } catch (error) {
    console.error("Evaluation failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Evaluation failed",
      },
      { status: 500 }
    );
  }
}