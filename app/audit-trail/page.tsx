"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  Brain,
  CheckCircle2,
  Clock3,
  FileClock,
  Play,
  RefreshCcw,
  ShieldAlert,
  Wrench,
} from "lucide-react";

import { Sidebar } from "@/components/layout/sidebar";

type AuditEvent = {
  timestamp: string;
  type: string;
  message: string;
  metadata?: Record<string, unknown>;
};

type RecoveryResult = {
  recoveryCase: {
    id: string;
    paymentId: string;
    amount: number;
    failureReason: string;
  };

  auditTrail: AuditEvent[];
};

type CasesResponse = {
  success: boolean;
  count: number;
  results: RecoveryResult[];
};

type DisplayAuditEvent = AuditEvent & {
  caseId: string;
  paymentId: string;
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

function formatTime(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString(
    "en-IN",
    {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }
  );
}

function getEventStyle(type: string) {
  switch (type) {
    case "CASE_PROCESSING_STARTED":
      return {
        icon: Play,
        iconClass: "text-cyan-400",
        background: "bg-cyan-500/10",
        border: "border-cyan-500/20",
      };

    case "CONTEXT_BUILT":
      return {
        icon: Wrench,
        iconClass: "text-zinc-300",
        background: "bg-white/[0.05]",
        border: "border-white/10",
      };

    case "DECISION_GENERATED":
      return {
        icon: Brain,
        iconClass: "text-violet-400",
        background: "bg-violet-500/10",
        border: "border-violet-500/20",
      };

    case "POLICY_BLOCKED":
      return {
        icon: ShieldAlert,
        iconClass: "text-red-400",
        background: "bg-red-500/10",
        border: "border-red-500/20",
      };

    case "POLICY_APPROVED":
      return {
        icon: CheckCircle2,
        iconClass: "text-emerald-400",
        background: "bg-emerald-500/10",
        border: "border-emerald-500/20",
      };

    case "ACTION_EXECUTED":
    case "FALLBACK_EXECUTED":
      return {
        icon: CheckCircle2,
        iconClass: "text-emerald-400",
        background: "bg-emerald-500/10",
        border: "border-emerald-500/20",
      };

    default:
      return {
        icon: FileClock,
        iconClass: "text-zinc-400",
        background: "bg-white/[0.04]",
        border: "border-white/10",
      };
  }
}

export default function AuditTrailPage() {
  const [data, setData] =
    useState<CasesResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function loadAuditTrail() {
      try {
        const response = await fetch(
          "/api/recovery/cases"
        );

        const result = await response.json();

        setData(result);
      } catch (error) {
        console.error(
          "Failed to load audit trail",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadAuditTrail();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070b] text-zinc-400">
        <RefreshCcw className="mr-3 h-5 w-5 animate-spin" />

        Building audit trail...
      </main>
    );
  }

  if (!data?.success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070b] text-red-400">
        Audit trail unavailable.
      </main>
    );
  }

  const events: DisplayAuditEvent[] =
    data.results
      .flatMap((result) =>
        (result.auditTrail ?? []).map(
          (event) => ({
            ...event,
            caseId: result.recoveryCase.id,
            paymentId:
              result.recoveryCase.paymentId,
          })
        )
      )
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() -
          new Date(a.timestamp).getTime()
      );

  const blockedEvents = events.filter(
    (event) =>
      event.type === "POLICY_BLOCKED"
  ).length;

  const decisionEvents = events.filter(
    (event) =>
      event.type === "DECISION_GENERATED"
  ).length;

  const executionEvents = events.filter(
    (event) =>
      event.type === "ACTION_EXECUTED" ||
      event.type === "FALLBACK_EXECUTED"
  ).length;

  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      <Sidebar />

      <section className="ml-64 min-h-screen px-8 py-8">
        {/* HEADER */}

        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className="text-sm text-cyan-400">
              Governance & Observability
            </p>

            <h1 className="mt-2 text-3xl font-semibold">
              Audit Trail
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
              Every recovery decision, policy
              validation and execution step is
              recorded so autonomous behavior can
              be inspected and explained.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-xs text-zinc-600">
              Recorded Events
            </p>

            <p className="mt-1 text-lg font-semibold text-zinc-200">
              {events.length}
            </p>
          </div>
        </div>

        {/* SUMMARY */}

        <div className="mb-6 grid grid-cols-4 gap-4">
          <SummaryCard
            label="Recovery Cases"
            value={`${data.count}`}
          />

          <SummaryCard
            label="AI Decisions"
            value={`${decisionEvents}`}
          />

          <SummaryCard
            label="Policy Blocks"
            value={`${blockedEvents}`}
          />

          <SummaryCard
            label="Executions"
            value={`${executionEvents}`}
          />
        </div>

        {/* GOVERNANCE MESSAGE */}

        <div className="mb-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.05] p-5">
          <div className="flex items-start gap-4">
            <FileClock className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" />

            <div>
              <p className="text-sm font-medium text-cyan-200">
                Explainable by design
              </p>

              <p className="mt-2 max-w-4xl text-xs leading-5 text-cyan-100/60">
                RecoveryOS records the context,
                proposed decision, deterministic
                policy result and final execution
                separately. The AI proposal never
                silently becomes an executed action.
              </p>
            </div>
          </div>
        </div>

        {/* EVENTS */}

        <div className="rounded-2xl border border-white/10 bg-[#0b0f17]">
          <div className="grid grid-cols-[150px_150px_200px_1fr_110px] border-b border-white/10 px-6 py-4 text-xs uppercase tracking-wider text-zinc-600">
            <span>Time</span>
            <span>Case</span>
            <span>Event</span>
            <span>Details</span>
            <span>Trace</span>
          </div>

          {events.map((event, index) => {
            const style =
              getEventStyle(event.type);

            const Icon = style.icon;

            return (
              <div
                key={`${event.caseId}-${event.timestamp}-${index}`}
                className="grid grid-cols-[150px_150px_200px_1fr_110px] items-center border-b border-white/5 px-6 py-5 transition hover:bg-white/[0.02]"
              >
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Clock3 className="h-3.5 w-3.5" />

                  {formatTime(
                    event.timestamp
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium text-zinc-300">
                    {event.caseId}
                  </p>

                  <p className="mt-1 text-xs text-zinc-600">
                    {event.paymentId}
                  </p>
                </div>

                <div>
                  <div
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 ${style.background} ${style.border}`}
                  >
                    <Icon
                      className={`h-3.5 w-3.5 ${style.iconClass}`}
                    />

                    <span className="text-xs text-zinc-300">
                      {formatText(
                        event.type
                      )}
                    </span>
                  </div>
                </div>

                <p className="pr-8 text-sm leading-6 text-zinc-400">
                  {event.message}
                </p>

                <Link
                  href={`/recovery-queue/${event.caseId}`}
                  className="text-xs font-medium text-cyan-400 transition hover:text-cyan-300"
                >
                  View case →
                </Link>
              </div>
            );
          })}

          {events.length === 0 && (
            <div className="p-12 text-center">
              <FileClock className="mx-auto h-8 w-8 text-zinc-700" />

              <p className="mt-4 text-sm font-medium text-zinc-300">
                No audit events available.
              </p>

              <p className="mt-2 text-xs text-zinc-600">
                Process a recovery case to
                generate its decision trace.
              </p>
            </div>
          )}
        </div>

        {/* PRINCIPLE */}

        <div className="mt-6 rounded-2xl border border-white/10 bg-[#0b0f17] p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-600">
            RecoveryOS Governance Principle
          </p>

          <p className="mt-3 text-lg font-medium text-zinc-200">
            AI decides what should happen.
            Policies decide what may happen.
          </p>

          <p className="mt-2 text-sm text-zinc-600">
            Execution is always recorded after
            policy validation, creating an
            inspectable chain from context to
            outcome.
          </p>
        </div>
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