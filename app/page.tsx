"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  IndianRupee,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Sidebar } from "@/components/layout/sidebar";

type RecoveryResponse = {
  success: boolean;

  result: {
    recoveryCase: {
      id: string;
      paymentId: string;
      amount: number;
      currency: string;
      paymentMethod: string;
      failureReason: string;
      attemptCount: number;
      successfulPayments: number;
      failedPayments: number;
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

  auditTrail: {
    timestamp: string;
    type: string;
    message: string;
  }[];
};

function formatAction(action?: string) {
  if (!action) return "—";

  return action
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1).toLowerCase()
    )
    .join(" ");
}

export default function Home() {
  const [data, setData] =
    useState<RecoveryResponse | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecoveryData() {
      try {
        const response = await fetch(
          "/api/recovery/demo"
        );

        const result = await response.json();

        setData(result);
      } catch (error) {
        console.error(
          "Failed to load RecoveryOS dashboard",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadRecoveryData();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070b] text-white">
        <div className="flex items-center gap-3 text-zinc-400">
          <RefreshCcw className="h-5 w-5 animate-spin" />
          Loading RecoveryOS...
        </div>
      </main>
    );
  }

  if (!data?.result) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070b] text-red-400">
        RecoveryOS backend unavailable.
      </main>
    );
  }

  const recoveryCase = data.result.recoveryCase;
  const decision = data.result.decision;
  const policy = data.result.policyResult;
  const execution = data.result.execution;

  const confidence =
    Math.round(decision.confidence * 100);

  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      <Sidebar />

      <section className="ml-64 min-h-screen px-8 py-8">
        {/* HEADER */}

        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-zinc-500">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              Autonomous Revenue Recovery
            </div>

            <h2 className="text-3xl font-semibold tracking-tight">
              Recovery Dashboard
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              Monitor at-risk revenue, AI decisions,
              policy enforcement and recovery outcomes.
            </p>
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
            ● Recovery Engine Active
          </div>
        </div>

        {/* KPI CARDS */}

        <div className="grid grid-cols-4 gap-4">
          <MetricCard
            title="At-Risk Revenue"
            value={`₹${recoveryCase.amount.toLocaleString(
              "en-IN"
            )}`}
            subtitle="Current recovery case"
            icon={IndianRupee}
          />

          <MetricCard
            title="AI Confidence"
            value={`${confidence}%`}
            subtitle="Decision confidence"
            icon={BrainCircuit}
          />

          <MetricCard
            title="Attempts"
            value={`${recoveryCase.attemptCount}`}
            subtitle="Recovery attempts"
            icon={RefreshCcw}
          />

          <MetricCard
            title="Policy Status"
            value={
              policy.approved
                ? "Approved"
                : "Blocked"
            }
            subtitle={
              policy.approved
                ? "Safe to execute"
                : "Guardrail activated"
            }
            icon={ShieldCheck}
            danger={!policy.approved}
          />
        </div>

        {/* MAIN CONTENT */}

        <div className="mt-6 grid grid-cols-3 gap-6">
          {/* RECOVERY CASE */}

          <div className="col-span-2 rounded-2xl border border-white/10 bg-[#0b0f17] p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-600">
                  Active Recovery Case
                </p>

                <h3 className="mt-2 text-xl font-semibold">
                  {recoveryCase.id}
                </h3>
              </div>

              <div className="rounded-lg bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
                {recoveryCase.status}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <CaseField
                label="Payment"
                value={recoveryCase.paymentId}
              />

              <CaseField
                label="Amount"
                value={`₹${recoveryCase.amount.toLocaleString(
                  "en-IN"
                )}`}
              />

              <CaseField
                label="Method"
                value={recoveryCase.paymentMethod}
              />

              <CaseField
                label="Failure"
                value={formatAction(
                  recoveryCase.failureReason
                )}
              />
            </div>

            {/* DECISION TRACE */}

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
                    {formatAction(decision.action)}
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
                  <ShieldCheck
                    className={`mb-4 h-5 w-5 ${
                      policy.approved
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  />

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
                    policy.violations.length > 0 && (
                      <p className="mt-3 text-xs text-red-300/80">
                        {formatAction(
                          policy.violations[0]
                        )}
                      </p>
                    )}
                </div>

                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.06] p-5">
                  <ArrowUpRight className="mb-4 h-5 w-5 text-cyan-400" />

                  <p className="text-xs text-zinc-500">
                    Final Execution
                  </p>

                  <p className="mt-2 font-semibold text-cyan-300">
                    {policy.approved
                      ? formatAction(decision.action)
                      : formatAction(
                          policy.fallbackAction
                        )}
                  </p>

                  <p className="mt-3 text-xs text-zinc-500">
                    {execution
                      ? formatAction(execution.status)
                      : "No execution"}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <p className="mb-2 text-xs text-zinc-500">
                  Why RecoveryOS chose this
                </p>

                <p className="text-sm leading-6 text-zinc-300">
                  {decision.reason}
                </p>
              </div>
            </div>
          </div>

          {/* AI INSIGHT */}

          <div className="rounded-2xl border border-white/10 bg-[#0b0f17] p-6">
            <div className="mb-5 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-400" />

              <h3 className="font-semibold">
                Recovery Insight
              </h3>
            </div>

            {!policy.approved ? (
              <>
                <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-400" />

                    <span className="text-sm font-medium text-red-300">
                      Unsafe action prevented
                    </span>
                  </div>

                  <p className="mt-3 text-xs leading-5 text-red-200/60">
                    RecoveryOS blocked the proposed
                    action because it violated a
                    deterministic recovery policy.
                  </p>
                </div>

                <p className="text-xs text-zinc-500">
                  Safe fallback
                </p>

                <p className="mt-2 text-lg font-semibold">
                  {formatAction(
                    policy.fallbackAction
                  )}
                </p>
              </>
            ) : (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <CheckCircle2 className="mb-3 h-5 w-5 text-emerald-400" />

                <p className="text-sm text-emerald-300">
                  Decision passed all recovery
                  policies.
                </p>
              </div>
            )}

            <div className="mt-8 border-t border-white/10 pt-5">
              <p className="text-xs text-zinc-600">
                RecoveryOS Principle
              </p>

              <p className="mt-3 text-sm leading-6 text-zinc-300">
                AI decides what{" "}
                <span className="text-white">
                  should
                </span>{" "}
                happen. Policies decide what{" "}
                <span className="text-white">
                  may
                </span>{" "}
                happen.
              </p>
            </div>
          </div>
        </div>

        {/* AUDIT */}

        <div className="mt-6 rounded-2xl border border-white/10 bg-[#0b0f17] p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">
                Live Audit Trail
              </h3>

              <p className="mt-1 text-xs text-zinc-500">
                Explainable record of every recovery
                decision and system action.
              </p>
            </div>

            <Clock3 className="h-5 w-5 text-zinc-600" />
          </div>

          <div className="space-y-3">
            {data.auditTrail
              .slice(-5)
              .map((event, index) => (
                <div
                  key={`${event.timestamp}-${index}`}
                  className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3"
                >
                  <div
                    className={`h-2 w-2 rounded-full ${
                      event.type ===
                      "POLICY_BLOCKED"
                        ? "bg-red-400"
                        : "bg-emerald-400"
                    }`}
                  />

                  <div className="flex-1">
                    <p className="text-sm text-zinc-300">
                      {event.message}
                    </p>

                    <p className="mt-1 text-xs text-zinc-600">
                      {event.type}
                    </p>
                  </div>

                  <p className="text-xs text-zinc-600">
                    {new Date(
                      event.timestamp
                    ).toLocaleTimeString()}
                  </p>
                </div>
              ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  danger = false,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  danger?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b0f17] p-5">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          {title}
        </p>

        <div className="rounded-lg bg-white/5 p-2">
          <Icon
            className={`h-4 w-4 ${
              danger
                ? "text-red-400"
                : "text-zinc-400"
            }`}
          />
        </div>
      </div>

      <p
        className={`text-2xl font-semibold ${
          danger
            ? "text-red-300"
            : "text-white"
        }`}
      >
        {value}
      </p>

      <p className="mt-2 text-xs text-zinc-600">
        {subtitle}
      </p>
    </div>
  );
}

function CaseField({
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

      <p className="mt-2 truncate text-sm font-medium text-zinc-200">
        {value}
      </p>
    </div>
  );
}