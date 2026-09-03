"use client";

import { useEffect, useState } from "react";

import {
  AlertTriangle,
  ArrowRight,
  RefreshCcw,
  ShieldAlert,
  UserRoundCheck,
} from "lucide-react";

import Link from "next/link";

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

export default function EscalationsPage() {
  const [data, setData] =
    useState<CasesResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function loadCases() {
      try {
        const response = await fetch(
          "/api/recovery/cases"
        );

        const result =
          await response.json();

        setData(result);
      } catch (error) {
        console.error(
          "Failed to load escalations",
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
        Loading escalations...
      </main>
    );
  }

  if (!data?.success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070b] text-red-400">
        Escalations unavailable.
      </main>
    );
  }

  const escalations =
    data.results.filter(
      (item) =>
        !item.policyResult.approved ||
        item.policyResult.requiresHuman ||
        item.execution?.status ===
          "ESCALATED_TO_HUMAN"
    );

  const totalValue =
    escalations.reduce(
      (sum, item) =>
        sum + item.recoveryCase.amount,
      0
    );

  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      <Sidebar />

      <section className="ml-64 min-h-screen px-8 py-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className="text-sm text-amber-400">
              Human-in-the-Loop
            </p>

            <h1 className="mt-2 text-3xl font-semibold">
              Escalations
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
              Cases RecoveryOS refused to automate
              because deterministic policy constraints
              or ambiguity required human judgment.
            </p>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] px-4 py-3">
            <p className="text-xs text-amber-300/70">
              Pending Review
            </p>

            <p className="mt-1 text-lg font-semibold text-amber-300">
              {escalations.length}
            </p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-4">
          <SummaryCard
            label="Escalated Cases"
            value={`${escalations.length}`}
          />

          <SummaryCard
            label="Revenue Under Review"
            value={`₹${totalValue.toLocaleString(
              "en-IN"
            )}`}
          />

          <SummaryCard
            label="Unsafe Actions Executed"
            value="0"
          />
        </div>

        <div className="space-y-4">
          {escalations.map((item) => {
            const confidence =
              Math.round(
                item.decision.confidence * 100
              );

            return (
              <Link
                key={item.recoveryCase.id}
                href={`/recovery-queue/${item.recoveryCase.id}`}
                className="block rounded-2xl border border-white/10 bg-[#0b0f17] p-6 transition hover:border-white/20 hover:bg-white/[0.025]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10">
                      <ShieldAlert className="h-5 w-5 text-red-400" />
                    </div>

                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-lg font-semibold text-white">
                          {item.recoveryCase.id}
                        </h2>

                        <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-[11px] font-medium text-red-300">
                          HUMAN REVIEW
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-zinc-600">
                        {item.recoveryCase.paymentId}
                      </p>
                    </div>
                  </div>

                  <ArrowRight className="h-4 w-4 text-zinc-600" />
                </div>

                <div className="mt-6 grid grid-cols-5 gap-4">
                  <InfoBlock
                    label="Amount"
                    value={`₹${item.recoveryCase.amount.toLocaleString(
                      "en-IN"
                    )}`}
                  />

                  <InfoBlock
                    label="Failure"
                    value={formatText(
                      item.recoveryCase.failureReason
                    )}
                  />

                  <InfoBlock
                    label="AI Proposal"
                    value={formatText(
                      item.decision.action
                    )}
                    accent="violet"
                  />

                  <InfoBlock
                    label="Confidence"
                    value={`${confidence}%`}
                  />

                  <InfoBlock
                    label="Safe Fallback"
                    value={formatText(
                      item.policyResult.fallbackAction
                    )}
                    accent="cyan"
                  />
                </div>

                <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/[0.05] p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-red-300/80">
                        Policy Violation
                      </p>

                      <p className="mt-2 text-sm text-red-200/70">
                        {item.policyResult
                          .violations.length > 0
                          ? item.policyResult.violations
                              .map(formatText)
                              .join(", ")
                          : "Manual review required"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <UserRoundCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />

                  <div>
                    <p className="text-xs font-medium text-zinc-300">
                      Why human review?
                    </p>

                    <p className="mt-1 text-xs leading-5 text-zinc-600">
                      The proposed action exceeded
                      deterministic safety constraints.
                      RecoveryOS blocked execution and
                      routed the case for review instead
                      of allowing the AI layer to override
                      policy.
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {escalations.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-[#0b0f17] p-10 text-center">
            <UserRoundCheck className="mx-auto h-8 w-8 text-emerald-400" />

            <p className="mt-4 text-sm font-medium text-white">
              No cases require human review.
            </p>

            <p className="mt-2 text-xs text-zinc-600">
              All current recovery actions passed policy validation.
            </p>
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

function InfoBlock({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "violet" | "cyan";
}) {
  const valueClass =
    accent === "violet"
      ? "text-violet-300"
      : accent === "cyan"
      ? "text-cyan-300"
      : "text-zinc-200";

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <p className="text-xs text-zinc-600">
        {label}
      </p>

      <p className={`mt-2 text-sm font-medium ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}