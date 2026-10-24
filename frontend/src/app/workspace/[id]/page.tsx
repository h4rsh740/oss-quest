"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { StatusBadge } from "@/components/StatusBadge";
import { DiffViewer } from "@/components/DiffViewer";
import { TerminalLog } from "@/components/TerminalLog";
import { WorkflowStepper } from "@/components/WorkflowStepper";
import {
  getRepairStatus,
  getPatchDownloadUrl,
  getReportDownloadUrl,
} from "@/lib/api";
import { RepairResponse } from "@/lib/types";
import {
  FileText,
  Download,
  BookOpen,
  RotateCw,
  GitPullRequest,
  Check,
  X,
  ExternalLink,
  ShieldAlert,
  Flame,
  Terminal,
  FileCode,
  Sparkles,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";

function WorkspaceContent() {
  const params = useParams();
  const router = useRouter();
  const runId = params.id as string;

  const [run, setRun] = useState<RepairResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(true);
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    fetchStatus();
    // Poll every 1.5 seconds if running
    const interval = setInterval(() => {
      if (polling) fetchStatus();
    }, 1500);
    return () => clearInterval(interval);
  }, [runId, polling]);

  const fetchStatus = async () => {
    try {
      const data = await getRepairStatus(runId);
      setRun(data);
      if (data.stage === "completed" || data.stage === "failed") {
        setPolling(false);
      }
    } catch (err: any) {
      console.warn("Failed to poll repair status:", err);
      // Don't kill UI if single poll fails
    } finally {
      setLoading(false);
    }
  };

  if (loading && !run) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center font-mono text-xs text-zinc-400 gap-2">
          <RotateCw className="w-4 h-4 animate-spin text-rose-500" />
          Loading PHOENIX Repair Workspace ({runId})...
        </div>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3 font-mono text-xs text-zinc-400">
          <AlertTriangle className="w-8 h-8 text-rose-500" />
          <p>Repair Run &apos;{runId}&apos; not found.</p>
          <Link href="/dashboard" className="px-4 py-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-200">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
        {/* Top Header & Quick Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-zinc-500">{run.run_id}</span>
              <StatusBadge status={run.verification_status} size="md" />
              {polling && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-800/40 text-[10px] font-mono text-cyan-300">
                  <RotateCw className="w-3 h-3 animate-spin text-cyan-400" />
                  Live Syncing
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              #{run.issue_number}: {run.issue_title}
            </h1>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            {run.patch_diff && (
              <a
                href={getPatchDownloadUrl(run.run_id)}
                download={`phoenix_repair_${run.run_id}.patch`}
                className="px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5 text-zinc-400" />
                Export Patch (.patch)
              </a>
            )}
            <Link
              href={`/report/${run.run_id}`}
              className="px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 flex items-center gap-1.5 transition"
            >
              <FileText className="w-3.5 h-3.5 text-zinc-400" />
              Formal Report
            </Link>
            <Link
              href={`/first-pr/${run.run_id}`}
              className="px-3 py-2 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 flex items-center gap-1.5 transition font-semibold"
            >
              <BookOpen className="w-3.5 h-3.5 text-rose-400" />
              First-PR Guided Mode
            </Link>
          </div>
        </div>

        {/* 8-Stage Workflow Stepper */}
        <WorkflowStepper currentStage={run.stage} />

        {/* Multi-Panel Main Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT PANEL: Issue Metadata & Relevant Files (3 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Issue Card */}
            <div className="border border-zinc-800 rounded-xl bg-zinc-950 p-5 space-y-3">
              <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-500 flex items-center justify-between">
                <span>Issue Context</span>
                <a
                  href={run.issue_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-zinc-500 hover:text-zinc-300 flex items-center gap-1 font-normal text-[11px]"
                >
                  GitHub <ExternalLink className="w-3 h-3" />
                </a>
              </h2>
              <div className="text-xs text-zinc-300 leading-relaxed font-sans">
                {run.issue_title}
              </div>
              <div className="text-[11px] text-zinc-500 font-mono line-clamp-1">
                Repository: {run.repo_url}
              </div>
            </div>

            {/* Changed & Relevant Files */}
            <div className="border border-zinc-800 rounded-xl bg-zinc-950 p-5 space-y-3">
              <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                Target Files ({run.relevant_files.length})
              </h2>
              {run.relevant_files.length === 0 ? (
                <div className="text-xs text-zinc-600 font-mono">No target files identified yet.</div>
              ) : (
                <div className="space-y-1.5">
                  {run.relevant_files.map((file, idx) => (
                    <div
                      key={idx}
                      className="px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 flex items-center gap-2"
                    >
                      <span className="text-cyan-400 font-bold">&bull;</span>
                      <span className="truncate">{file}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Diagnostic Evidence Bullet Points */}
            <div className="border border-zinc-800 rounded-xl bg-zinc-950 p-5 space-y-3">
              <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Diagnostic Evidence
              </h2>
              {run.supporting_evidence.length === 0 ? (
                <div className="text-xs text-zinc-600 font-mono">Synthesizing diagnosis...</div>
              ) : (
                <ul className="space-y-2 text-xs text-zinc-400 leading-relaxed font-sans">
                  {run.supporting_evidence.map((ev, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-400 shrink-0 font-mono">›</span>
                      <span>{ev}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* CENTER & RIGHT PANEL: Root Cause Hypothesis & Proposed Diff (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Root-Cause Hypothesis & Strategy */}
            <div className="border border-zinc-800 rounded-xl bg-zinc-950 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-500" />
                  Root-Cause Hypothesis
                </h2>
                <span className="text-[11px] font-mono text-zinc-500">
                  Attempt {run.attempt_count} of {run.max_attempts}
                </span>
              </div>

              <div className="text-xs text-zinc-300 leading-relaxed font-sans bg-zinc-900/40 p-4 rounded-lg border border-zinc-800/80">
                {run.root_cause_hypothesis || "Diagnosis in progress by BharatCode AI model..."}
              </div>

              {run.proposed_strategy && (
                <div className="text-xs text-zinc-400 space-y-1">
                  <span className="font-mono text-zinc-500 uppercase tracking-wider text-[10px] font-semibold">
                    Proposed Fix Strategy:
                  </span>
                  <div className="text-zinc-300 font-mono text-xs bg-zinc-900/20 p-2.5 rounded">
                    {run.proposed_strategy}
                  </div>
                </div>
              )}
            </div>

            {/* Unified Diff Viewer */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400">
                  Synthesized Unified Diff (Validated)
                </h2>
                <span className="text-[11px] font-mono text-zinc-500">
                  Path traversal blocked &bull; Isolated target
                </span>
              </div>
              <DiffViewer diff={run.patch_diff || ""} />
            </div>

            {/* Proposed PR Metadata Preview */}
            {run.pr_title && (
              <div className="border border-zinc-800 rounded-xl bg-zinc-950 p-5 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-zinc-300 flex items-center gap-1.5">
                    <GitPullRequest className="w-4 h-4 text-emerald-400" />
                    Reviewable Contribution Metadata
                  </h3>
                  <span className="text-[10px] text-zinc-500">Explicit User Authorization Required</span>
                </div>
                <div className="text-zinc-300 bg-zinc-900 px-3 py-2 rounded border border-zinc-800">
                  <strong>Title:</strong> {run.pr_title}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM PANEL: Isolated Sandbox Execution Logs */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              Isolated Execution Worker Proof
            </h2>
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="text-xs font-mono text-zinc-500 hover:text-zinc-300"
            >
              {showLogs ? "Hide Logs" : "Show Logs"}
            </button>
          </div>

          {showLogs && (
            <TerminalLog records={run.test_records} logs={run.logs} />
          )}
        </div>
      </main>
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-black text-zinc-500 font-mono text-xs flex items-center justify-center">Loading Workspace...</div>}>
      <WorkspaceContent />
    </React.Suspense>
  );
}

