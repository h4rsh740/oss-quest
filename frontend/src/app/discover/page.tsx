"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { analyzeRepository, startRepair } from "@/lib/api";
import { AnalyzeRepoResponse, IssueItem } from "@/lib/types";
import {
  Search,
  ExternalLink,
  Flame,
  ArrowRight,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  HelpCircle,
  FileCode,
  Tag,
  AlertTriangle,
  RotateCw,
} from "lucide-react";

export default function DiscoverPage() {
  const router = useRouter();
  const [repoInput, setRepoInput] = useState("https://github.com/bharatcode-community/fast-slugify");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeRepoResponse | null>(null);
  const [repairingIssue, setRepairingIssue] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch for default repo
    handleAnalyze();
  }, []);

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!repoInput.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data = await analyzeRepository(repoInput);
      setAnalysis(data);
    } catch (err: any) {
      setError(err.message || "Failed to analyze repository.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartRepair = async (issue: IssueItem) => {
    setRepairingIssue(issue.id);
    try {
      const res = await startRepair({
        repo_url: analysis?.repo_url || repoInput,
        issue_url: issue.html_url,
        issue_number: issue.number,
        issue_title: issue.title,
        issue_body: issue.body,
        local_path: issue.is_demo ? "fixtures/demo_repo" : undefined,
        test_command: analysis?.test_framework === "pytest" ? "pytest" : undefined,
      });
      router.push(`/workspace/${res.run_id}`);
    } catch (err: any) {
      alert("Error starting repair: " + err.message);
      setRepairingIssue(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Search className="w-7 h-7 text-cyan-400" />
            Issue Discovery & Recoverability Ranking
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Scan open source repositories to discover real issues, rank their testability, and avoid hallucinations.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleAnalyze} className="flex gap-3">
          <input
            type="text"
            value={repoInput}
            onChange={(e) => setRepoInput(e.target.value)}
            placeholder="Enter GitHub repository URL (e.g. https://github.com/psf/requests or 'demo')"
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-cyan-500 transition"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-2 transition disabled:opacity-50"
          >
            {loading ? <RotateCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? "Inspecting..." : "Scan Repository"}
          </button>
        </form>

        {/* Notice on AI Estimation */}
        <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-lg p-3 text-xs text-zinc-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Recoverability scores are heuristic estimates</strong> based on testability, issue clarity, and scope—not objective guarantees.
            </span>
          </div>
          <span className="font-mono text-[11px] text-zinc-500">Rate-limit safe</span>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Repository Intelligence Summary Card */}
        {analysis && (
          <div className="border border-zinc-800 rounded-xl bg-zinc-950 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-indigo-400" />
                  {analysis.owner}/{analysis.name}
                </h2>
                <p className="text-zinc-400 text-xs mt-1 font-sans">{analysis.architecture_summary}</p>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                  Lang: {analysis.detected_language}
                </span>
                <span className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-emerald-400">
                  Tests: {analysis.test_framework}
                </span>
              </div>
            </div>

            {/* Candidate Issues List */}
            <div className="space-y-4">
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-500">
                Ranked Candidate Issues ({analysis.candidate_issues.length})
              </h3>

              {analysis.candidate_issues.length === 0 ? (
                <div className="py-8 text-center text-zinc-600 text-xs font-mono">
                  No open issues discovered for this repository.
                </div>
              ) : (
                <div className="space-y-4">
                  {analysis.candidate_issues.map((issue) => (
                    <div
                      key={issue.id}
                      className="border border-zinc-800/80 rounded-xl bg-zinc-900/30 p-5 hover:border-zinc-700 transition space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-rose-400 font-bold">#{issue.number}</span>
                            <h4 className="font-semibold text-zinc-100 text-sm">{issue.title}</h4>
                            <a
                              href={issue.html_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-zinc-500 hover:text-zinc-300"
                              title="Open original GitHub issue"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>

                          <p className="text-xs text-zinc-400 font-sans line-clamp-2">{issue.body || "No body provided."}</p>

                          {/* Labels */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {issue.labels.map((lbl, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px] font-mono flex items-center gap-1"
                              >
                                <Tag className="w-2.5 h-2.5 text-zinc-500" />
                                {lbl}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Composite Ranking Gauge */}
                        <div className="shrink-0 flex items-center sm:flex-col items-end gap-2 text-right">
                          <div className="text-right">
                            <div className="text-xs text-zinc-500 font-mono">Suitability Score</div>
                            <div className="text-lg font-bold font-mono text-emerald-400">
                              {(issue.ranking.composite * 100).toFixed(0)}%
                            </div>
                          </div>
                          <button
                            onClick={() => handleStartRepair(issue)}
                            disabled={repairingIssue === issue.id}
                            className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
                          >
                            <Flame className="w-3.5 h-3.5" />
                            {repairingIssue === issue.id ? "Launching..." : "Auto-Repair"}
                          </button>
                        </div>
                      </div>

                      {/* Explainable Factor Breakdown */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-zinc-800/60 font-mono text-[11px]">
                        <div>
                          <span className="text-zinc-500">Testability:</span>
                          <span className="text-zinc-300 font-semibold ml-1.5">
                            {(issue.ranking.testability * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-zinc-500">Locality/Scope:</span>
                          <span className="text-zinc-300 font-semibold ml-1.5">
                            {(issue.ranking.scope * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-zinc-500">Relevance:</span>
                          <span className="text-zinc-300 font-semibold ml-1.5">
                            {(issue.ranking.relevance * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-zinc-500">Setup Simplicity:</span>
                          <span className="text-zinc-300 font-semibold ml-1.5">
                            {(issue.ranking.setup_complexity * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      {/* Missing Information Indicators */}
                      {issue.ranking.missing_info_notes.length > 0 && (
                        <div className="space-y-1 bg-amber-950/20 border border-amber-900/30 p-2.5 rounded-lg text-[11px] text-amber-300">
                          <div className="font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            Missing Information / Caution:
                          </div>
                          {issue.ranking.missing_info_notes.map((note, nIdx) => (
                            <div key={nIdx} className="text-zinc-400 pl-4">
                              &bull; {note}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
