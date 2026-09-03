"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  RefreshCcw,
  ShieldAlert,
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
    status: string;
  };

  decision: {
    action: string;
    confidence: number;
    reason: string;
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

export default function RecoveryQueuePage() {
  const [data, setData] =
    useState<CasesResponse | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCases() {
      try {
        const response = await fetch(
          "/api/recovery/cases"
        );

        const result = await response.json();

        setData(result);
      } catch (error) {
        console.error(
          "Failed to load recovery cases",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadCases();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070b] text-zinc-400">
        <RefreshCcw className="mr-3 h-5 w-5 animate-spin" />
        Loading recovery queue...
      </main>
    );
  }

  if (!data?.success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070b] text-red-400">
        Recovery queue unavailable.
      </main>
    );
  }

  const totalAtRisk = data.results.reduce(
    (sum, item) =>
      sum + item.recoveryCase.amount,
    0
  );

  const blocked = data.results.filter(
    (item) => !item.policyResult.approved
  ).length;

  const escalated = data.results.filter(
    (item) =>
      item.execution?.status ===
      "ESCALATED_TO_HUMAN"
  ).length;

  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      <Sidebar />

      <section className="ml-64 min-h-screen px-8 py-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className="text-sm text-emerald-400">
              Revenue Recovery Operations
            </p>

            <h1 className="mt-2 text-3xl font-semibold">
              Recovery Queue
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Every at-risk revenue case currently
              being evaluated by RecoveryOS.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-400">
            {data.count} active cases
          </div>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-4">
          <SummaryCard
            label="Total At-Risk Revenue"
            value={`₹${totalAtRisk.toLocaleString(
              "en-IN"
            )}`}
          />

          <SummaryCard
            label="Policy Blocks"
            value={`${blocked}`}
          />

          <SummaryCard
            label="Human Escalations"
            value={`${escalated}`}
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b0f17]">
          <div className="grid grid-cols-[0.8fr_1fr_1.2fr_1.4fr_1fr_1.4fr_0.3fr] border-b border-white/10 px-5 py-4 text-xs uppercase tracking-wider text-zinc-600">
            <span>Case</span>
            <span>Amount</span>
            <span>Failure</span>
            <span>AI Decision</span>
            <span>Policy</span>
            <span>Execution</span>
            <span />
          </div>

          {data.results.map((item) => {
            const confidence = Math.round(
              item.decision.confidence * 100
            );

            return (
              <Link
                key={item.recoveryCase.id}
                href={`/recovery-queue/${item.recoveryCase.id}`}
                className="grid grid-cols-[0.8fr_1fr_1.2fr_1.4fr_1fr_1.4fr_0.3fr] items-center border-b border-white/5 px-5 py-5 transition hover:bg-white/[0.025]"
              >
                <div>
                  <p className="font-medium text-zinc-200">
                    {item.recoveryCase.id}
                  </p>

                  <p className="mt-1 text-xs text-zinc-600">
                    {item.recoveryCase.paymentId}
                  </p>
                </div>

                <div>
                  <p className="font-medium text-zinc-200">
                    ₹
                    {item.recoveryCase.amount.toLocaleString(
                      "en-IN"
                    )}
                  </p>

                  <p className="mt-1 text-xs text-zinc-600">
                    {item.recoveryCase.paymentMethod}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-zinc-300">
                    {formatText(
                      item.recoveryCase.failureReason
                    )}
                  </p>

                  <p className="mt-1 text-xs text-zinc-600">
                    {item.recoveryCase.attemptCount}{" "}
                    attempt
                    {item.recoveryCase.attemptCount !==
                    1
                      ? "s"
                      : ""}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-violet-300">
                    {formatText(
                      item.decision.action
                    )}
                  </p>

                  <p className="mt-1 text-xs text-zinc-600">
                    {confidence}% confidence
                  </p>
                </div>

                <div>
                  {item.policyResult.approved ? (
                    <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Approved
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Blocked
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-sm text-cyan-300">
                    {formatText(
                      item.execution?.status
                    )}
                  </p>

                  {!item.policyResult.approved &&
                    item.policyResult
                      .fallbackAction && (
                      <p className="mt-1 text-xs text-red-300/70">
                        Fallback:{" "}
                        {formatText(
                          item.policyResult
                            .fallbackAction
                        )}
                      </p>
                    )}
                </div>

                <div className="flex justify-end">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/5 hover:text-white">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {blocked > 0 && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.06] p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-red-400" />

            <div>
              <p className="text-sm font-medium text-red-300">
                Guardrails actively protected the
                recovery workflow
              </p>

              <p className="mt-1 text-xs leading-5 text-red-200/60">
                {blocked} proposed recovery action
                {blocked !== 1 ? "s were" : " was"}{" "}
                blocked before execution because of
                deterministic policy constraints.
              </p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function SummaryCard({
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

      <p className="mt-3 text-2xl font-semibold text-white">
        {value}
      </p>
    </div>
  );
}