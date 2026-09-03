import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

import { normalizeRazorpayFailure } from "@/lib/razorpay/normalize-payment";
import { processRecoveryCase } from "@/lib/recovery/orchestrator";

/*
 * Prototype idempotency store.
 *
 * Razorpay can deliver the same webhook more than once.
 * x-razorpay-event-id uniquely identifies an event.
 *
 * For production this would live in Redis / DB.
 */
const processedEvents = new Set<string>();

function verifyWebhookSignature(
  rawBody: string,
  receivedSignature: string,
  secret: string
) {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const expectedBuffer = Buffer.from(
    expectedSignature,
    "utf8"
  );

  const receivedBuffer = Buffer.from(
    receivedSignature,
    "utf8"
  );

  if (
    expectedBuffer.length !==
    receivedBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    expectedBuffer,
    receivedBuffer
  );
}

export async function POST(
  request: NextRequest
) {
  try {
    /*
     * IMPORTANT:
     * Read the RAW body first.
     *
     * Razorpay's signature is generated against the
     * raw request body, not JSON.stringify(parsedBody).
     */
    const rawBody = await request.text();

    const signature =
      request.headers.get(
        "x-razorpay-signature"
      );

    const eventId =
      request.headers.get(
        "x-razorpay-event-id"
      );

    const webhookSecret =
      process.env.RAZORPAY_WEBHOOK_SECRET;

    /*
     * -----------------------------------------------
     * SIGNATURE VERIFICATION
     * -----------------------------------------------
     */

    let signatureVerified = false;

    if (webhookSecret) {
      if (!signature) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Missing Razorpay webhook signature",
          },
          { status: 401 }
        );
      }

      signatureVerified =
        verifyWebhookSignature(
          rawBody,
          signature,
          webhookSecret
        );

      if (!signatureVerified) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid Razorpay webhook signature",
          },
          { status: 401 }
        );
      }
    } else {
      /*
       * Local development convenience.
       *
       * Production should NEVER accept unsigned
       * webhook payloads.
       */
      if (
        process.env.NODE_ENV ===
        "production"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "RAZORPAY_WEBHOOK_SECRET is not configured",
          },
          { status: 500 }
        );
      }
    }

    /*
     * -----------------------------------------------
     * IDEMPOTENCY
     * -----------------------------------------------
     */

    if (
      eventId &&
      processedEvents.has(eventId)
    ) {
      return NextResponse.json({
        success: true,
        duplicate: true,
        message:
          "Webhook event already processed",
        eventId,
      });
    }

    /*
     * -----------------------------------------------
     * PARSE PAYLOAD
     * -----------------------------------------------
     */

    let payload: unknown;

    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid webhook JSON payload",
        },
        { status: 400 }
      );
    }

    const razorpayPayload =
      payload as {
        event?: string;
      };

    /*
     * -----------------------------------------------
     * EVENT FILTERING
     * -----------------------------------------------
     */

    if (
      razorpayPayload.event !==
      "payment.failed"
    ) {
      return NextResponse.json({
        success: true,
        ignored: true,
        event:
          razorpayPayload.event ??
          "unknown",
        message:
          "RecoveryOS only processes payment.failed events",
      });
    }

    /*
     * -----------------------------------------------
     * NORMALIZE RAZORPAY → RECOVERYOS
     * -----------------------------------------------
     */

    const recoveryCase =
      normalizeRazorpayFailure(
        payload as Parameters<
          typeof normalizeRazorpayFailure
        >[0]
      );

    /*
     * -----------------------------------------------
     * RECOVERY ORCHESTRATION
     * -----------------------------------------------
     */

    const result =
      await processRecoveryCase(
        recoveryCase
      );

    /*
     * Mark event processed only after successful
     * processing.
     */
    if (eventId) {
      processedEvents.add(eventId);
    }

    return NextResponse.json({
      success: true,

      source: "razorpay",

      event: "payment.failed",

      eventId:
        eventId ?? null,

      signatureVerified,

      recoveryCase,

      result,
    });
  } catch (error) {
    console.error(
      "Razorpay webhook processing failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Razorpay webhook processing failed",

        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}