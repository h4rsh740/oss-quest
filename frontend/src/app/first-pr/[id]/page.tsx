"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { getFirstPRGuidance, getRepairStatus } from "@/lib/api";
import { FirstPRGuidance, RepairResponse } from "@/lib/types";
import {
  BookOpen,
  CheckSquare,
  Square,
  ArrowLeft,
  FileCode,
  ListOrdered,
  HelpCircle,
  Lightbulb,
  ShieldCheck,
  CheckCircle2,
  Terminal,
  ExternalLink,
} from "lucide-react";

function FirstPRContent() {
  const params = useParams();
  const runId = params.id as string;

  const [guidance, setGuidance] = useState<FirstPRGuidance | null>(null);
  const [run, setRun] = useState<RepairResponse | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  useEffect(() => {
    Promise.all([getFirstPRGuidance(runId), getRepairStatus(runId)])
      .then(([g, r]) => {
        setGuidance(g);
        setRun(r);
      })
      .catch((err) => console.error(err));
  }, [runId]);

  const toggleCheck = (idx: number) => {
    setCheckedItems((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  if (!guidance || !run) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center font-mono text-xs text-zinc-400">
          Loading First-PR Guided Onboarding...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        {/* Header */}
        <div className="border-b border-zinc-800 pb-6 space-y-2">
          <Link
            href={`/workspace/${run.run_id}`}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-zinc-200 transition mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Workspace
          </Link>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-mono font-semibold">
              First-PR Guided Mode
            </span>
            <span className="text-zinc-500 text-xs font-mono">Run {run.run_id}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Contributing to Open Source: #{run.issue_number}
          </h1>
          <p className="text-zinc-400 text-xs max-w-2xl leading-relaxed">
            This guided walk-through explains the issue in plain English, teaches you what changed in the code, and guides you through making your first pull request.
          </p>
        </div>

        {/* Section 1: Approachable Bug Explanation */}
        <div className="border border-zinc-800 rounded-xl bg-zinc-950 p-6 space-y-3">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            What is the problem in plain English?
          </h2>
          <div className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/40 p-4 rounded-lg border border-zinc-800/80 font-sans">
            {guidance.plain_english_summary}
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed font-sans">
            <strong>Why it matters:</strong> {guidance.architecture_overview}
          </p>
        </div>

        {/* Section 2: Affected Files & Roles */}
        <div className="border border-zinc-800 rounded-xl bg-zinc-950 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <FileCode className="w-4 h-4 text-indigo-400" />
            Files Affected
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {guidance.affected_components.map((comp, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs space-y-1 font-mono"
              >
                <div className="text-cyan-300 font-bold truncate">{comp.file}</div>
                <div className="text-zinc-400 text-[11px] font-sans">{comp.role}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Step-by-Step Contribution Walkthrough */}
        <div className="border border-zinc-800 rounded-xl bg-zinc-950 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-cyan-400" />
            Step-by-Step Contribution Guide
          </h2>
          <div className="space-y-3 text-xs text-zinc-300 font-sans">
            {guidance.step_by_step_walkthrough.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-zinc-900/30 border border-zinc-900">
                <span className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-300 font-mono text-xs flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <span className="leading-relaxed pt-0.5">{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Line-by-Line Diff Explanation */}
        <div className="border border-zinc-800 rounded-xl bg-zinc-950 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-purple-400" />
            Understanding the Code Changes
          </h2>
          <p className="text-xs text-zinc-400 font-sans">
            Before submitting code to an open-source project, you should understand every single line that was modified:
          </p>

          <div className="space-y-2 font-mono text-xs">
            {guidance.diff_line_by_line_explanation.length === 0 ? (
              <div className="text-zinc-500">No patch diff lines to explain.</div>
            ) : (
              guidance.diff_line_by_line_explanation.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                    item.type === "addition"
                      ? "bg-emerald-950/20 border-emerald-900/40 text-emerald-300"
                      : "bg-rose-950/20 border-rose-900/40 text-rose-300"
                  }`}
                >
                  <code className="text-xs font-semibold">{item.line}</code>
                  <span className="text-[11px] font-sans text-zinc-400 sm:text-right">{item.explanation}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Section 5: Contributor Checklist */}
        <div className="border border-zinc-800 rounded-xl bg-zinc-950 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-emerald-400" />
            Pre-Submission Checklist
          </h2>
          <p className="text-xs text-zinc-400 font-sans">
            Check off each requirement before opening your pull request on GitHub:
          </p>

          <div className="space-y-2.5 font-sans text-xs">
            {guidance.contributor_checklist.map((item, idx) => {
              const isChecked = !!checkedItems[idx];
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleCheck(idx)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 text-left transition"
                >
                  {isChecked ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-zinc-600 shrink-0" />
                  )}
                  <span className={isChecked ? "line-through text-zinc-500" : "text-zinc-200"}>
                    {item}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function FirstPRPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-black text-zinc-500 font-mono text-xs flex items-center justify-center">Loading First-PR guidance...</div>}>
      <FirstPRContent />
    </React.Suspense>
  );
}

