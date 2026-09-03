"use client";

import { useEffect, useState } from "react";

import {
  AlertTriangle,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  CircleDollarSign,
  RefreshCcw,
  ShieldCheck,
  UserRoundCheck,
  Zap,
} from "lucide-react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Sidebar } from "@/components/layout/sidebar";

type StrategyMetrics = {
  strategy: string;

  totalCases: number;
  totalAtRisk: number;

  recoveredCases: number;
  recoveredRevenue: number;
  recoveryRate: number;

  interventions: number;

  unnecessaryRetries: number;
  unsafeInterventions: number;

  escalations: number;
  pendingHumanReview: number;

  stoppedRecoveries: number;

  interventionEfficiency: number;
};

type EvaluationResponse = {
  success: boolean;

  evaluation: {
    generatedAt: string;

    dataset: {
      type: string;
      cases: number;
      totalAtRisk: number;
    };

    strategies: StrategyMetrics[];

    summary: {
      recoveryOSRevenue: number;
      recoveryOSRecoveryRate: number;

      revenueUpliftVsFixed: number;

      unnecessaryRetriesPrevented: number;

      unsafeInterventionsPrevented: number;

      humanEscalations: number;

      interventionEfficiency: number;
    };
  };
};

function formatCurrency(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

export default function EvaluationsPage() {
  const [data, setData] =
    useState<EvaluationResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function loadEvaluation() {
      try {
        const response = await fetch(
          "/api/evaluation"
        );

        const result =
          await response.json();

        setData(result);
      } catch (error) {
        console.error(
          "Failed to load evaluation",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadEvaluation();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070b] text-zinc-400">
        <RefreshCcw className="mr-3 h-5 w-5 animate-spin" />

        Running RecoveryOS benchmark...
      </main>
    );
  }

  if (!data?.success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070b] text-red-400">
        Evaluation unavailable.
      </main>
    );
  }

  const {
    dataset,
    strategies,
    summary,
  } = data.evaluation;

  const recoveryOS =
    strategies.find(
      (strategy) =>
        strategy.strategy === "RecoveryOS"
    ) ?? strategies[2];

  const fixedRetry =
    strategies.find(
      (strategy) =>
        strategy.strategy === "Fixed Retry"
    ) ?? strategies[0];

  const ruleBased =
    strategies.find(
      (strategy) =>
        strategy.strategy === "Rule Based"
    ) ?? strategies[1];

  const recoveryChartData =
    strategies.map((strategy) => ({
      strategy: strategy.strategy,

      recoveredRevenue:
        strategy.recoveredRevenue,

      recoveredCases:
        strategy.recoveredCases,
    }));

  const safetyChartData =
    strategies.map((strategy) => ({
      strategy: strategy.strategy,

      unnecessaryRetries:
        strategy.unnecessaryRetries,

      unsafeInterventions:
        strategy.unsafeInterventions,

      escalations:
        strategy.escalations,
    }));

  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      <Sidebar />

      <section className="ml-64 min-h-screen px-8 py-8">
        {/* HEADER */}

        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className="text-sm text-violet-400">
              Recovery Intelligence
            </p>

            <h1 className="mt-2 text-3xl font-semibold">
              Evaluation Lab
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
              Benchmarking recovery strategies
              across a deterministic synthetic
              portfolio while measuring both
              recovered revenue and intervention
              safety.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-xs text-zinc-600">
              Benchmark Dataset
            </p>

            <p className="mt-1 text-sm font-medium text-zinc-300">
              {dataset.cases} synthetic cases
            </p>
          </div>
        </div>

        {/* TOP KPI CARDS */}

        <div className="grid grid-cols-4 gap-4">
          <MetricCard
            icon={
              <CircleDollarSign className="h-5 w-5 text-emerald-400" />
            }
            label="At-Risk Portfolio"
            value={formatCurrency(
              dataset.totalAtRisk
            )}
            description={`${dataset.cases} evaluated recovery cases`}
          />

          <MetricCard
            icon={
              <ArrowUpRight className="h-5 w-5 text-violet-400" />
            }
            label="RecoveryOS Revenue"
            value={formatCurrency(
              summary.recoveryOSRevenue
            )}
            description={`${Math.round(
              summary.recoveryOSRecoveryRate *
                100
            )}% case recovery rate`}
          />

          <MetricCard
            icon={
              <ShieldCheck className="h-5 w-5 text-cyan-400" />
            }
            label="Unsafe Actions Prevented"
            value={`${summary.unsafeInterventionsPrevented}`}
            description="Compared with fixed retry"
          />

          <MetricCard
            icon={
              <UserRoundCheck className="h-5 w-5 text-amber-400" />
            }
            label="Human Escalations"
            value={`${summary.humanEscalations}`}
            description="Ambiguous cases safely routed"
          />
        </div>

        {/* MAIN GRID */}

        <div className="mt-6 grid grid-cols-[1.35fr_0.65fr] gap-6">
          {/* STRATEGY COMPARISON */}

          <div className="rounded-2xl border border-white/10 bg-[#0b0f17] p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-white">
                  Revenue Recovery Comparison
                </p>

                <p className="mt-1 text-xs text-zinc-600">
                  Simulated recovered revenue
                  across each recovery strategy.
                </p>
              </div>

              <div className="rounded-lg bg-violet-500/10 px-3 py-2 text-xs text-violet-300">
                100-case benchmark
              </div>
            </div>

            <div className="mt-7 h-[320px]">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={recoveryChartData}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#ffffff0d"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="strategy"
                    stroke="#52525b"
                    tick={{
                      fill: "#71717a",
                      fontSize: 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    stroke="#52525b"
                    tick={{
                      fill: "#71717a",
                      fontSize: 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) =>
                      `₹${Math.round(
                        value / 1000
                      )}k`
                    }
                  />

                  <Tooltip
                    cursor={{
                      fill: "#ffffff05",
                    }}
                    contentStyle={{
                      background: "#10151f",
                      border:
                        "1px solid #ffffff14",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                    formatter={(
                      value
                    ) => [
                      formatCurrency(
                        Number(value)
                      ),
                      "Recovered Revenue",
                    ]}
                  />

                  <Bar
                    dataKey="recoveredRevenue"
                    fill="#8b5cf6"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* RECOVERY OS INSIGHT */}

          <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-b from-violet-500/[0.08] to-[#0b0f17] p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
              <Bot className="h-5 w-5 text-violet-300" />
            </div>

            <p className="mt-5 text-lg font-semibold text-white">
              RecoveryOS Trade-off
            </p>

            <p className="mt-3 text-sm leading-6 text-zinc-400">
              RecoveryOS intentionally avoids
              maximizing revenue recovery at any
              cost.
            </p>

            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Compared with aggressive automation,
              it prevents unsafe retries and routes
              uncertain cases for human review.
            </p>

            <div className="mt-6 space-y-3">
              <InsightRow
                label="Recovered Revenue"
                value={formatCurrency(
                  recoveryOS.recoveredRevenue
                )}
              />

              <InsightRow
                label="Unnecessary Retries"
                value={`${recoveryOS.unnecessaryRetries}`}
              />

              <InsightRow
                label="Unsafe Interventions"
                value={`${recoveryOS.unsafeInterventions}`}
              />

              <InsightRow
                label="Escalated Safely"
                value={`${recoveryOS.escalations}`}
              />
            </div>

            <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4">
              <div className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />

                <p className="text-xs leading-5 text-emerald-200/70">
                  RecoveryOS prevented{" "}
                  <span className="font-medium text-emerald-300">
                    {
                      summary.unnecessaryRetriesPrevented
                    }
                  </span>{" "}
                  unnecessary retries relative to
                  fixed retry.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SAFETY CHART */}

        <div className="mt-6 rounded-2xl border border-white/10 bg-[#0b0f17] p-6">
          <div>
            <p className="text-sm font-medium text-white">
              Intervention Safety
            </p>

            <p className="mt-1 text-xs text-zinc-600">
              Recovery effectiveness alone is not
              enough. RecoveryOS also measures the
              cost and safety of interventions.
            </p>
          </div>

          <div className="mt-7 h-[300px]">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={safetyChartData}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#ffffff0d"
                  vertical={false}
                />

                <XAxis
                  dataKey="strategy"
                  stroke="#52525b"
                  tick={{
                    fill: "#71717a",
                    fontSize: 12,
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  stroke="#52525b"
                  tick={{
                    fill: "#71717a",
                    fontSize: 12,
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  cursor={{
                    fill: "#ffffff05",
                  }}
                  contentStyle={{
                    background: "#10151f",
                    border:
                      "1px solid #ffffff14",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                />

                <Legend />

                <Bar
                  dataKey="unnecessaryRetries"
                  name="Unnecessary Retries"
                  fill="#ef4444"
                  radius={[5, 5, 0, 0]}
                />

                <Bar
                  dataKey="unsafeInterventions"
                  name="Unsafe Interventions"
                  fill="#f59e0b"
                  radius={[5, 5, 0, 0]}
                />

                <Bar
                  dataKey="escalations"
                  name="Human Escalations"
                  fill="#06b6d4"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* STRATEGY TABLE */}

        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#0b0f17]">
          <div className="border-b border-white/10 px-6 py-5">
            <p className="text-sm font-medium text-white">
              Strategy Benchmark
            </p>

            <p className="mt-1 text-xs text-zinc-600">
              Side-by-side evaluation across the
              same deterministic synthetic dataset.
            </p>
          </div>

          <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr_1fr_1fr] border-b border-white/10 px-6 py-4 text-xs uppercase tracking-wider text-zinc-600">
            <span>Strategy</span>
            <span>Recovered</span>
            <span>Recovery Rate</span>
            <span>Bad Retries</span>
            <span>Unsafe Actions</span>
            <span>Escalations</span>
          </div>

          {strategies.map((strategy) => (
            <div
              key={strategy.strategy}
              className="grid grid-cols-[1.2fr_1fr_1fr_1fr_1fr_1fr] items-center border-b border-white/5 px-6 py-5 text-sm"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`h-2 w-2 rounded-full ${
                    strategy.strategy ===
                    "RecoveryOS"
                      ? "bg-violet-400"
                      : strategy.strategy ===
                        "Rule Based"
                      ? "bg-cyan-400"
                      : "bg-zinc-500"
                  }`}
                />

                <span
                  className={
                    strategy.strategy ===
                    "RecoveryOS"
                      ? "font-medium text-violet-300"
                      : "text-zinc-300"
                  }
                >
                  {strategy.strategy}
                </span>
              </div>

              <span className="text-zinc-300">
                {formatCurrency(
                  strategy.recoveredRevenue
                )}
              </span>

              <span className="text-zinc-300">
                {Math.round(
                  strategy.recoveryRate *
                    100
                )}
                %
              </span>

              <span
                className={
                  strategy.unnecessaryRetries ===
                  0
                    ? "text-emerald-400"
                    : "text-red-400"
                }
              >
                {
                  strategy.unnecessaryRetries
                }
              </span>

              <span
                className={
                  strategy.unsafeInterventions ===
                  0
                    ? "text-emerald-400"
                    : "text-amber-400"
                }
              >
                {
                  strategy.unsafeInterventions
                }
              </span>

              <span className="text-zinc-300">
                {strategy.escalations}
              </span>
            </div>
          ))}
        </div>

        {/* METHODOLOGY */}

        <div className="mt-6 flex items-start gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-5">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />

          <div>
            <p className="text-sm font-medium text-amber-200">
              Synthetic Evaluation
            </p>

            <p className="mt-2 max-w-4xl text-xs leading-5 text-amber-100/60">
              These results come from a
              deterministic synthetic benchmark,
              not live merchant transactions.
              Recovery probabilities are modeled
              from payment failure type, retry
              history, customer history, timing and
              contextual signals. The benchmark is
              designed to compare strategy behavior
              reproducibly rather than claim
              production recovery performance.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function MetricCard({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b0f17] p-5">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04]">
          {icon}
        </div>

        <Zap className="h-4 w-4 text-zinc-700" />
      </div>

      <p className="mt-5 text-sm text-zinc-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold text-white">
        {value}
      </p>

      <p className="mt-2 text-xs text-zinc-600">
        {description}
      </p>
    </div>
  );
}

function InsightRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.025] px-4 py-3">
      <span className="text-xs text-zinc-500">
        {label}
      </span>

      <span className="text-sm font-medium text-zinc-200">
        {value}
      </span>
    </div>
  );
}