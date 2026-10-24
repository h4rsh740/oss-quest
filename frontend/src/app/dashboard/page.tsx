"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { StatusBadge } from "@/components/StatusBadge";
import {
  startRepair,
  listRecentRepairs,
  runLocalDemo,
  getBenchmark,
} from "@/lib/api";
import { RepairResponse, BenchmarkMetrics } from "@/lib/types";
import {
  Search,
  Play,
  Flame,
  ArrowRight,
  GitPullRequest,
  CheckCircle2,
  Clock,
  Layers,
  Terminal,
  RotateCcw,
  AlertCircle,
  ExternalLink,
  Key,
  Sparkles,
} from "lucide-react";
import { ApiKeyModal } from "@/components/ApiKeyModal";

function DashboardContent() {
  const [showApiModal, setShowApiModal] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [repoUrl, setRepoUrl] = useState("https://github.com/bharatcode-community/fast-slugify");
  const [issueUrl, setIssueUrl] = useState("https://github.com/bharatcode-community/fast-slugify/issues/104");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentRuns, setRecentRuns] = useState<RepairResponse[]>([]);
  const [benchmark, setBenchmark] = useState<BenchmarkMetrics | null>(null);

  useEffect(() => {
    loadData();
    // Auto-launch demo if ?demo=true in URL
    if (searchParams.get("demo") === "true") {
      handleLaunchDemo();
    }
  }, []);

  const loadData = async () => {
    try {
      const runs = await listRecentRepairs();
      setRecentRuns(runs);
      const b = await getBenchmark();
      setBenchmark(b);
    } catch (e) {
      console.warn("Could not load backend data:", e);
    }
  };

  const handleStartRepair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueUrl.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await startRepair({
        repo_url: repoUrl,
        issue_url: issueUrl,
        issue_number: 104,
        issue_title: "slugify() boundary and delimiter defect",
      });
      router.push(`/workspace/${res.run_id}`);
    } catch (err: any) {
      setError(err.message || "Failed to initiate autonomous repair.");
      setLoading(false);
    }
  };

  const handleLaunchDemo = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await runLocalDemo();
      router.push(`/workspace/${res.run_id}`);
    } catch (err: any) {
      setError(err.message || "Failed to run local fixture demo.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Layers className="w-7 h-7 text-rose-500" />
              Autonomous Recovery Dashboard
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Select an open source issue or enter a repository to formulate, execute, and verify repairs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLaunchDemo}
              disabled={loading}
              className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-md shadow-emerald-950/40 flex items-center gap-2 transition disabled:opacity-50"
            >
              <Flame className="w-4 h-4 text-emerald-200" />
              {loading ? "Running Isolated Sandbox..." : "Run Built-in Demo (Exit 0)"}
            </button>
            <Link
              href="/discover"
              className="px-4 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-medium text-xs flex items-center gap-1.5 transition"
            >
              <Search className="w-3.5 h-3.5 text-zinc-400" />
              Discover Issues
            </Link>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* BharatCode API Connection Banner */}
        <div className="border border-zinc-800 rounded-xl bg-gradient-to-r from-zinc-950 via-zinc-900/60 to-zinc-950 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-950/80 border border-rose-800/60 flex items-center justify-center text-rose-400 shrink-0">
              <Key className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-zinc-100 flex items-center gap-2 font-mono">
                <span>Connect BharatCode API Key</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-400">
                  Student Free Tier or Lite Plan
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Plug in your own API key to run live Qwen 3.8 27B inference, or buy a plan directly on BharatCode.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowApiModal(true)}
              className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-md shadow-rose-950/40"
            >
              <Key className="w-3.5 h-3.5" />
              Configure API Key
            </button>
            <a
              href="https://bharatcode.ai/subscribe"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-medium text-xs transition flex items-center gap-1"
            >
              <span>Get Plan</span>
              <ExternalLink className="w-3 h-3 text-zinc-500" />
            </a>
          </div>
        </div>

        {/* Primary Analysis Input Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 border border-zinc-800 rounded-xl bg-zinc-950 p-6 space-y-5">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Search className="w-4 h-4 text-rose-400" />
              Launch New Recovery Run
            </h2>

            <form onSubmit={handleStartRepair} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1.5 font-medium">
                  GitHub Issue URL or Identifier
                </label>
                <input
                  type="text"
                  value={issueUrl}
                  onChange={(e) => setIssueUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo/issues/123"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-rose-500 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1.5 font-medium">
                  Repository URL
                </label>
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-rose-500 transition"
                />
              </div>

              {/* Sample Repository Quick-Loads */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                  Quick Preloaded Repositories:
                </span>
                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setRepoUrl("https://github.com/bharatcode-community/fast-slugify");
                      setIssueUrl("https://github.com/bharatcode-community/fast-slugify/issues/104");
                    }}
                    className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-mono text-[11px] transition"
                  >
                    fast-slugify #104 (Local Sandbox Bug)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRepoUrl("https://github.com/psf/requests");
                      setIssueUrl("https://github.com/psf/requests/issues/6000");
                    }}
                    className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-mono text-[11px] transition"
                  >
                    psf/requests #6000
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRepoUrl("https://github.com/pallets/click");
                      setIssueUrl("https://github.com/pallets/click/issues/2400");
                    }}
                    className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-mono text-[11px] transition"
                  >
                    pallets/click #2400
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-lg shadow-rose-950/50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {loading ? "Initializing PHOENIX Engine..." : "Start Autonomous Repair & Verification"}
                </button>
              </div>
            </form>
          </div>

          {/* Benchmark Transparency Card */}
          <div className="border border-zinc-800 rounded-xl bg-zinc-950 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400">
                Empirical Engine Metrics
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-400">
                Measured
              </span>
            </div>

            {benchmark ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
                  <span className="text-zinc-500">Benchmark Cases:</span>
                  <span className="text-zinc-200 font-semibold">{benchmark.measured_metrics.total_benchmark_cases}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
                  <span className="text-zinc-500">Reproduction Rate:</span>
                  <span className="text-emerald-400 font-semibold">{benchmark.measured_metrics.issue_reproduction_rate}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
                  <span className="text-zinc-500">Verified Fix Rate:</span>
                  <span className="text-emerald-400 font-semibold">{benchmark.measured_metrics.verified_fix_rate}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
                  <span className="text-zinc-500">Regression Rate:</span>
                  <span className="text-zinc-300 font-semibold">{benchmark.measured_metrics.regression_rate}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
                  <span className="text-zinc-500">Median Duration:</span>
                  <span className="text-zinc-300 font-semibold">{benchmark.measured_metrics.median_repair_duration_seconds}s</span>
                </div>
                <div className="pt-2 text-[11px] text-zinc-500 font-sans leading-relaxed">
                  Evaluated using <strong className="text-zinc-300">BharatCode qwen-3.8-27b</strong> against reproducible Python defect fixtures.
                </div>
              </div>
            ) : (
              <div className="text-xs text-zinc-600 font-mono py-6 text-center">
                Loading benchmark metrics...
              </div>
            )}
          </div>
        </div>

        {/* Recent Repair Runs Section */}
        <div className="border border-zinc-800 rounded-xl bg-zinc-950 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-400" />
              Recent Recovery Runs
            </h2>
            <button
              onClick={loadData}
              className="text-xs font-mono text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>

          {recentRuns.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <Terminal className="w-8 h-8 text-zinc-700 mx-auto" />
              <p className="text-zinc-500 text-xs font-mono">No repair runs found in the database yet.</p>
              <button
                onClick={handleLaunchDemo}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 font-mono transition"
              >
                Run built-in demo to populate history
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-3">Run ID</th>
                    <th className="py-3 px-3">Repository & Issue</th>
                    <th className="py-3 px-3">Verification Status</th>
                    <th className="py-3 px-3">Current Stage</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {recentRuns.map((run) => (
                    <tr key={run.run_id} className="hover:bg-zinc-900/40 transition">
                      <td className="py-3 px-3 font-semibold text-zinc-300">
                        <Link href={`/workspace/${run.run_id}`} className="hover:text-rose-400">
                          {run.run_id}
                        </Link>
                      </td>
                      <td className="py-3 px-3 text-zinc-400">
                        <div className="text-zinc-200 font-sans font-medium line-clamp-1">{run.issue_title}</div>
                        <div className="text-[11px] text-zinc-500 line-clamp-1">{run.repo_url}</div>
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={run.verification_status} size="sm" />
                      </td>
                      <td className="py-3 px-3 text-zinc-400">
                        <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px]">
                          {run.stage}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          href={`/workspace/${run.run_id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs transition"
                        >
                          Workspace
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* API Key Modal */}
      <ApiKeyModal isOpen={showApiModal} onClose={() => setShowApiModal(false)} />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-black text-zinc-500 font-mono text-xs flex items-center justify-center">Loading dashboard...</div>}>
      <DashboardContent />
    </React.Suspense>
  );
}

