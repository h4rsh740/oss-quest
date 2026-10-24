"use client";

import React, { useState } from "react";
import { Copy, Check, FileDiff } from "lucide-react";

interface DiffViewerProps {
  diff: string;
  filename?: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ diff, filename }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(diff);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!diff || !diff.trim()) {
    return (
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-8 text-center text-zinc-500 font-mono text-sm">
        No patch diff available for this run.
      </div>
    );
  }

  const lines = diff.split("\n");

  return (
    <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950 font-mono text-xs">
      <div className="bg-zinc-900/80 px-4 py-2 border-b border-zinc-800 flex items-center justify-between text-zinc-400">
        <div className="flex items-center gap-2">
          <FileDiff className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-zinc-200">{filename || "Unified Diff"}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition text-xs"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy Diff"}
        </button>
      </div>

      <div className="overflow-x-auto p-3 max-h-[460px] overflow-y-auto font-mono text-xs leading-relaxed select-text">
        {lines.map((line, idx) => {
          let lineStyle = "text-zinc-400";
          let bgStyle = "hover:bg-zinc-900/50";
          let prefix = "";

          if (line.startsWith("+++ ") || line.startsWith("--- ")) {
            lineStyle = "text-cyan-300 font-semibold";
            bgStyle = "bg-cyan-950/20";
          } else if (line.startsWith("@@ ")) {
            lineStyle = "text-indigo-300 font-semibold";
            bgStyle = "bg-indigo-950/20";
          } else if (line.startsWith("+")) {
            lineStyle = "text-emerald-300";
            bgStyle = "bg-emerald-950/40";
            prefix = "+ ";
          } else if (line.startsWith("-")) {
            lineStyle = "text-rose-300";
            bgStyle = "bg-rose-950/40";
            prefix = "- ";
          }

          return (
            <div key={idx} className={`flex items-start ${bgStyle} px-2 py-0.5 rounded transition-colors`}>
              <span className="w-8 text-zinc-600 select-none text-right pr-3 shrink-0">{idx + 1}</span>
              <span className={`whitespace-pre font-mono flex-1 ${lineStyle}`}>{line}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
