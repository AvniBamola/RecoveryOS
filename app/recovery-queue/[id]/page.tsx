"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Sidebar } from "@/components/layout/sidebar";

type RecoveryResult = {
  recoveryCase: {
    id: string;
    paymentId: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    failureReason: string;
    attemptCount: number;
    lastAttemptHoursAgo: number;
    successfulPayments: number;
    failedPayments: number;
    previousActions: string[];
    customerMessage?: string;
    status: string;
  };

  decision: {
    action: string;
    confidence: number;
    reason: string;
    delayHours?: number;
  };

  policyResult: {
    approved: boolean;
    requiresHuman: boolean;
    violations: string[];
    fallbackAction?: string;
  };

  execution: {
    success: boolean;
    status: string;
  } | null;
};

type CasesResponse = {
  success: boolean;
  count: number;
  results: RecoveryResult[];
};

function formatText(value?: string) {
  if (!value) return "—";

  return value
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1).toLowerCase()
    )
    .join(" ");
}

export default function RecoveryCaseDetailPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [item, setItem] =
    useState<RecoveryResult | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCase() {
      try {
        const response = await fetch(
          "/api/recovery/cases"
        );

        const data: CasesResponse =
          await response.json();

        const found = data.results.find(
          (result) =>
            result.recoveryCase.id === id
        );

        setItem(found ?? null);
      } catch (error) {
        console.error(
          "Failed to load recovery case",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadCase();
  }, [id]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070b] text-zinc-400">
        Loading recovery case...
      </main>
    );
  }

  if (!item) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070b] text-red-400">
        Recovery case not found.
      </main>
    );
  }

  const recoveryCase = item.recoveryCase;
  const decision = item.decision;
  const policy = item.policyResult;
  const execution = item.execution;

  const confidence = Math.round(
    decision.confidence * 100
  );

  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      <Sidebar />

      <section className="ml-64 min-h-screen px-8 py-8">
        <button
          onClick={() =>
            router.push("/recovery-queue")
          }
          className="mb-6 flex items-center gap-2 text-sm text-zinc-500 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Recovery Queue
        </button>

        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className="text-sm text-emerald-400">
              Recovery Case Analysis
            </p>

            <h1 className="mt-2 text-3xl font-semibold">
              {recoveryCase.id}
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Full decision trace for this
              at-risk revenue case.
            </p>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm text-amber-400">
            {recoveryCase.status}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <InfoCard
            label="Amount"
            value={`₹${recoveryCase.amount.toLocaleString(
              "en-IN"
            )}`}
          />

          <InfoCard
            label="Failure"
            value={formatText(
              recoveryCase.failureReason
            )}
          />

          <InfoCard
            label="Attempts"
            value={`${recoveryCase.attemptCount}`}
          />

          <InfoCard
            label="AI Confidence"
            value={`${confidence}%`}
          />
        </div>

        <div className="mt-6 grid grid-cols-3 gap-6">
          <div className="col-span-2 rounded-2xl border border-white/10 bg-[#0b0f17] p-6">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-600">
                Recovery Context
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <ContextField
                label="Payment ID"
                value={recoveryCase.paymentId}
              />

              <ContextField
                label="Payment Method"
                value={
                  recoveryCase.paymentMethod
                }
              />

              <ContextField
                label="Last Attempt"
                value={`${recoveryCase.lastAttemptHoursAgo}h ago`}
              />

              <ContextField
                label="Successful Payments"
                value={`${recoveryCase.successfulPayments}`}
              />

              <ContextField
                label="Previous Failures"
                value={`${recoveryCase.failedPayments}`}
              />

              <ContextField
                label="Previous Actions"
                value={
                  recoveryCase.previousActions
                    .length > 0
                    ? recoveryCase.previousActions
                        .map(formatText)
                        .join(", ")
                    : "None"
                }
              />
            </div>

            {recoveryCase.customerMessage && (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-xs text-zinc-600">
                  Customer Context
                </p>

                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  “{recoveryCase.customerMessage}”
                </p>
              </div>
            )}

            <div className="mt-8 border-t border-white/10 pt-6">
              <p className="mb-5 text-xs uppercase tracking-[0.2em] text-zinc-600">
                Decision Trace
              </p>

              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.06] p-5">
                  <BrainCircuit className="mb-4 h-5 w-5 text-violet-400" />

                  <p className="text-xs text-zinc-500">
                    AI Proposal
                  </p>

                  <p className="mt-2 font-semibold text-violet-300">
                    {formatText(
                      decision.action
                    )}
                  </p>

                  <p className="mt-3 text-xs text-zinc-500">
                    Confidence
                  </p>

                  <p className="mt-1 text-sm">
                    {confidence}%
                  </p>
                </div>

                <div
                  className={`rounded-xl border p-5 ${
                    policy.approved
                      ? "border-emerald-500/20 bg-emerald-500/[0.06]"
                      : "border-red-500/20 bg-red-500/[0.06]"
                  }`}
                >
                  {policy.approved ? (
                    <ShieldCheck className="mb-4 h-5 w-5 text-emerald-400" />
                  ) : (
                    <ShieldAlert className="mb-4 h-5 w-5 text-red-400" />
                  )}

                  <p className="text-xs text-zinc-500">
                    Policy Engine
                  </p>

                  <p
                    className={`mt-2 font-semibold ${
                      policy.approved
                        ? "text-emerald-300"
                        : "text-red-300"
                    }`}
                  >
                    {policy.approved
                      ? "APPROVED"
                      : "BLOCKED"}
                  </p>

                  {!policy.approved &&
                    policy.violations.length >
                      0 && (
                      <p className="mt-3 text-xs text-red-300/80">
                        {formatText(
                          policy.violations[0]
                        )}
                      </p>
                    )}
                </div>

                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.06] p-5">
                  <Sparkles className="mb-4 h-5 w-5 text-cyan-400" />

                  <p className="text-xs text-zinc-500">
                    Final Execution
                  </p>

                  <p className="mt-2 font-semibold text-cyan-300">
                    {policy.approved
                      ? formatText(
                          decision.action
                        )
                      : formatText(
                          policy.fallbackAction
                        )}
                  </p>

                  <p className="mt-3 text-xs text-zinc-500">
                    {execution
                      ? formatText(
                          execution.status
                        )
                      : "No execution"}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-xs text-zinc-500">
                  AI Reasoning
                </p>

                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  {decision.reason}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0b0f17] p-6">
            <h3 className="font-semibold">
              Policy Summary
            </h3>

            <div className="mt-5 space-y-3">
              <PolicyItem
                label="Schema Validation"
                passed
              />

              <PolicyItem
                label="Retry Limit"
                passed={
                  !policy.violations.includes(
                    "MAX_RETRY_LIMIT_REACHED"
                  )
                }
              />

              <PolicyItem
                label="Hard Decline Protection"
                passed={
                  !policy.violations.includes(
                    "HARD_DECLINE_RETRY_FORBIDDEN"
                  )
                }
              />

              <PolicyItem
                label="Retry Cooldown"
                passed={
                  !policy.violations.includes(
                    "RETRY_COOLDOWN_NOT_MET"
                  )
                }
              />

              <PolicyItem
                label="Confidence Threshold"
                passed={
                  !policy.violations.includes(
                    "LOW_CONFIDENCE"
                  )
                }
              />

              <PolicyItem
                label="High Value Review"
                passed={
                  !policy.violations.includes(
                    "HIGH_VALUE_REQUIRES_REVIEW"
                  )
                }
              />
            </div>

            {!policy.approved && (
              <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/[0.06] p-4">
                <p className="text-xs text-red-300">
                  Safe fallback
                </p>

                <p className="mt-2 font-semibold text-red-200">
                  {formatText(
                    policy.fallbackAction
                  )}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-[#0b0f17] p-6">
          <div className="mb-5 flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-zinc-500" />

            <h3 className="font-semibold">
              Recovery Timeline
            </h3>
          </div>

          <div className="space-y-3">
            <TimelineItem
              text="Recovery case received"
            />

            <TimelineItem
              text={`Context assembled from payment history and failure reason`}
            />

            <TimelineItem
              text={`AI proposed ${formatText(
                decision.action
              )} at ${confidence}% confidence`}
            />

            <TimelineItem
              text={
                policy.approved
                  ? "Policy engine approved the proposed action"
                  : `Policy engine blocked the action: ${formatText(
                      policy.violations[0]
                    )}`
              }
              danger={!policy.approved}
            />

            <TimelineItem
              text={
                execution
                  ? `Final execution: ${formatText(
                      execution.status
                    )}`
                  : "No execution performed"
              }
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b0f17] p-5">
      <p className="text-sm text-zinc-500">
        {label}
      </p>

      <p className="mt-3 text-xl font-semibold">
        {value}
      </p>
    </div>
  );
}

function ContextField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-white/[0.03] p-4">
      <p className="text-xs text-zinc-600">
        {label}
      </p>

      <p className="mt-2 text-sm text-zinc-200">
        {value}
      </p>
    </div>
  );
}

function PolicyItem({
  label,
  passed,
}: {
  label: string;
  passed: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
      <span className="text-sm text-zinc-400">
        {label}
      </span>

      {passed ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
      ) : (
        <ShieldAlert className="h-4 w-4 text-red-400" />
      )}
    </div>
  );
}

function TimelineItem({
  text,
  danger = false,
}: {
  text: string;
  danger?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <div
        className={`mt-1 h-2 w-2 rounded-full ${
          danger
            ? "bg-red-400"
            : "bg-emerald-400"
        }`}
      />

      <p
        className={`text-sm ${
          danger
            ? "text-red-300"
            : "text-zinc-300"
        }`}
      >
        {text}
      </p>
    </div>
  );
}