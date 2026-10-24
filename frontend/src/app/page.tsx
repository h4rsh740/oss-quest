import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Search,
  Cpu,
  FileCode2,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Terminal,
  FileText,
  AlertOctagon,
  Flame,
  Layers,
  Sparkles,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans selection:bg-rose-900 selection:text-white">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative px-4 pt-20 pb-16 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400 mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>PHOENIX Autonomous Software Recovery Engine</span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-300">BharatCode Build League</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6">
            Find the issue. Fix the code.{" "}
            <span className="bg-gradient-to-r from-amber-400 via-rose-500 to-rose-400 bg-clip-text text-transparent">
              Prove the repair.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            OSS Quest discovers GitHub issues, formulates root-cause hypotheses, writes minimal surgical patches, and{" "}
            <strong className="text-zinc-200 font-semibold">executes actual test suites in an isolated sandbox</strong> before preparing reviewable pull requests.
          </p>

          {/* Primary & Secondary CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-semibold text-sm shadow-lg shadow-rose-950/50 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
            >
              Analyze a GitHub Issue
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#workflow"
              className="px-6 py-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-semibold text-sm transition"
            >
              Explore the Workflow
            </a>
            <Link
              href="/dashboard?demo=true"
              className="px-6 py-3 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/50 border border-emerald-500/30 text-emerald-300 font-semibold text-sm flex items-center gap-2 transition"
            >
              <Flame className="w-4 h-4 text-emerald-400" />
              Launch Live Demo (Zero Config)
            </Link>
          </div>

          {/* Honest Status Distinction Pill */}
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 max-w-3xl mx-auto text-left shadow-2xl">
            <div className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-2 font-semibold">
              The PHOENIX Principle: Veracity Over Hallucination
            </div>
            <p className="text-xs text-zinc-400 mb-3">
              Never claim a bug is fixed merely because an AI model generated a patch. OSS Quest explicitly tracks empirical verification state:
            </p>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status="verified_checks_passed" size="sm" />
              <StatusBadge status="verification_failed" size="sm" />
              <StatusBadge status="patch_generated" size="sm" />
              <StatusBadge status="suggested_fix" size="sm" />
              <StatusBadge status="not_verified" size="sm" />
            </div>
          </div>
        </section>

        {/* Interactive 6-Stage Workflow Explanation */}
        <section id="workflow" className="py-20 border-t border-zinc-900 bg-zinc-950/50 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
                How PHOENIX Recovers Software
              </h2>
              <p className="text-zinc-400 text-sm max-w-xl mx-auto">
                A deterministic, evidence-backed 8-stage pipeline from issue discovery to verification and PR preparation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Step 1 */}
              <div className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/40 hover:border-zinc-700 transition space-y-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-800/50 flex items-center justify-center text-cyan-400 font-mono text-sm font-bold">
                  1
                </div>
                <h3 className="font-semibold text-zinc-200 text-sm flex items-center gap-2">
                  <Search className="w-4 h-4 text-cyan-400" />
                  Discover & Ingest
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Fetches GitHub issue metadata, labels, and description. Ranks candidate issues using explainable factors: scope, testability, and setup complexity.
                </p>
              </div>

              {/* Step 2 */}
              <div className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/40 hover:border-zinc-700 transition space-y-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-800/50 flex items-center justify-center text-indigo-400 font-mono text-sm font-bold">
                  2
                </div>
                <h3 className="font-semibold text-zinc-200 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  Scoped Inspection
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Identifies target files, test frameworks, and likely test commands. Builds compact, relevant context without wasting tokens or bloating LLM windows.
                </p>
              </div>

              {/* Step 3 */}
              <div className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/40 hover:border-zinc-700 transition space-y-3">
                <div className="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-800/50 flex items-center justify-center text-amber-400 font-mono text-sm font-bold">
                  3
                </div>
                <h3 className="font-semibold text-zinc-200 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Root-Cause Diagnosis
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  BharatCode model (qwen-3.8-27b) outputs structured root-cause hypothesis, supporting evidence, repair strategy, and known uncertainties.
                </p>
              </div>

              {/* Step 4 */}
              <div className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/40 hover:border-zinc-700 transition space-y-3">
                <div className="w-8 h-8 rounded-lg bg-purple-950/80 border border-purple-800/50 flex items-center justify-center text-purple-400 font-mono text-sm font-bold">
                  4
                </div>
                <h3 className="font-semibold text-zinc-200 text-sm flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-purple-400" />
                  Surgical Patch Gen
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Produces minimal unified diffs. Validates against path traversal (`..` attacks, null bytes, out-of-boundary writes) before touching any code.
                </p>
              </div>

              {/* Step 5 */}
              <div className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/40 hover:border-zinc-700 transition space-y-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-800/50 flex items-center justify-center text-emerald-400 font-mono text-sm font-bold">
                  5
                </div>
                <h3 className="font-semibold text-zinc-200 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Isolated Sandbox Proof
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Runs tests in a disposable temporary workspace. Strips all API keys from child environment. Captures real stdout, stderr, and exit codes.
                </p>
              </div>

              {/* Step 6 */}
              <div className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/40 hover:border-zinc-700 transition space-y-3">
                <div className="w-8 h-8 rounded-lg bg-rose-950/80 border border-rose-800/50 flex items-center justify-center text-rose-400 font-mono text-sm font-bold">
                  6
                </div>
                <h3 className="font-semibold text-zinc-200 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-rose-400" />
                  Evidence & Contribution
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Generates downloadable `.patch` files and audit Markdown reports. Provides a First-PR educational walkthrough for new contributors.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Security & Sandbox Principles */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <div className="border border-zinc-800 rounded-2xl bg-zinc-950 p-8 sm:p-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-rose-950/80 border border-rose-800/60 flex items-center justify-center text-rose-400">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Security Architecture & Boundaries</h2>
                <p className="text-zinc-400 text-xs font-mono">Untrusted repository code is strictly contained.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-zinc-400">
              <div className="space-y-2">
                <h4 className="font-semibold text-zinc-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  No Credential Leakage
                </h4>
                <p className="leading-relaxed">
                  Child test processes run in sanitized environments. BharatCode API keys and GitHub tokens are strictly scrubbed from subprocess variables.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-zinc-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Strict Timeout & Process Killing
                </h4>
                <p className="leading-relaxed">
                  Commands enforce hard timeouts (default 60s) to prevent infinite loops, crypto-mining, or hanging network sockets.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-zinc-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Disposable Sandbox Workspaces
                </h4>
                <p className="leading-relaxed">
                  Tests never run inside the backend server root. Temporary directories are created in `/tmp` and wiped immediately upon completion.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-zinc-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Zero Auto-Push Without Consent
                </h4>
                <p className="leading-relaxed">
                  PHOENIX exports `.patch` files and draft pull request markdown. Code is never pushed to remote remotes without explicit human review.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CLI Quickstart */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center">
          <h2 className="text-xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            Developer-First CLI (`ossq`)
          </h2>
          <p className="text-zinc-400 text-xs mb-6 font-mono">
            Full repair capabilities from your command line.
          </p>

          <div className="bg-black border border-zinc-800 rounded-lg p-4 font-mono text-xs text-left max-w-xl mx-auto space-y-2 text-zinc-300">
            <div className="text-zinc-500"># Run the built-in reproducible demo</div>
            <div className="text-emerald-400">$ ossq demo</div>
            <div className="text-zinc-500 pt-2"># Analyze candidate issues for any repository</div>
            <div className="text-cyan-300">$ ossq analyze https://github.com/psf/requests</div>
            <div className="text-zinc-500 pt-2"># Execute autonomous repair and verification</div>
            <div className="text-rose-300">$ ossq repair https://github.com/psf/requests/issues/6000</div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-8 text-center text-xs text-zinc-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            OSS Quest + PHOENIX Autonomous Software Recovery Engine &bull; BharatCode Build League 2026
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="hover:text-zinc-300">
              Dashboard
            </Link>
            <Link href="/discover" className="hover:text-zinc-300">
              Discover
            </Link>
            <a
              href="https://github.com/h4rsh740/oss-quest"
              target="_blank"
              rel="noreferrer"
              className="hover:text-zinc-300"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
