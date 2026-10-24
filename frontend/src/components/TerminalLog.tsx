import React from "react";
import { Terminal, ShieldCheck, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { TestExecutionRecord } from "@/lib/types";

interface TerminalLogProps {
  records: TestExecutionRecord[];
  logs?: string[];
}

export const TerminalLog: React.FC<TerminalLogProps> = ({ records, logs = [] }) => {
  return (
    <div className="border border-zinc-800 rounded-lg bg-black font-mono text-xs overflow-hidden">
      <div className="bg-zinc-900 px-4 py-2 border-b border-zinc-800 flex items-center justify-between text-zinc-400">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="text-zinc-200 font-semibold">Sandbox Execution Logs</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-zinc-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Environment Scrubbed
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4 max-h-[420px] overflow-y-auto">
        {records.length === 0 && logs.length === 0 && (
          <div className="text-zinc-600 text-center py-6">
            No execution commands logged yet. Waiting for sandbox worker...
          </div>
        )}

        {/* Engine Pipeline Stage Logs */}
        {logs.length > 0 && (
          <div className="space-y-1 pb-3 border-b border-zinc-900">
            <div className="text-zinc-500 text-[11px] uppercase tracking-wider mb-1 font-semibold">Stage Transitions</div>
            {logs.map((log, idx) => (
              <div key={idx} className="text-zinc-400 hover:text-zinc-200 transition-colors">
                <span className="text-cyan-500 mr-2">›</span>
                {log}
              </div>
            ))}
          </div>
        )}

        {/* Individual Test Execution Records */}
        {records.map((rec, idx) => (
          <div key={idx} className="border border-zinc-800/80 rounded bg-zinc-950/70 p-3 space-y-2">
            <div className="flex items-center justify-between border-b border-zinc-800/50 pb-2">
              <div className="flex items-center gap-2">
                {rec.passed ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                )}
                <span className="text-zinc-200 font-medium uppercase text-[11px] tracking-wide">
                  [{rec.phase}]
                </span>
                <span className="text-emerald-400 font-mono font-semibold">$ {rec.command}</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-400 text-xs">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-zinc-500" />
                  {rec.duration_seconds}s
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    rec.passed ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-rose-950 text-rose-400 border border-rose-800"
                  }`}
                >
                  Exit {rec.exit_code}
                </span>
              </div>
            </div>

            {rec.stdout && (
              <div className="text-zinc-300 whitespace-pre-wrap font-mono text-[11px] bg-zinc-900/60 p-2.5 rounded border border-zinc-800/40">
                {rec.stdout}
              </div>
            )}

            {rec.stderr && (
              <div className="text-rose-300 whitespace-pre-wrap font-mono text-[11px] bg-rose-950/30 p-2.5 rounded border border-rose-900/40">
                {rec.stderr}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
