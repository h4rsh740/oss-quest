import React from "react";
import { VerificationStatus } from "@/lib/types";
import { CheckCircle2, XCircle, AlertTriangle, FileCode2, Clock, HelpCircle } from "lucide-react";

interface StatusBadgeProps {
  status: VerificationStatus;
  size?: "sm" | "md" | "lg";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = "md" }) => {
  const configs: Record<
    VerificationStatus,
    { label: string; icon: React.ReactNode; bg: string; text: string; border: string }
  > = {
    verified_checks_passed: {
      label: "Verified Checks Passed",
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
      bg: "bg-emerald-950/60",
      text: "text-emerald-300",
      border: "border-emerald-500/30",
    },
    verification_failed: {
      label: "Verification Failed",
      icon: <XCircle className="w-3.5 h-3.5 text-rose-400" />,
      bg: "bg-rose-950/60",
      text: "text-rose-300",
      border: "border-rose-500/30",
    },
    patch_generated: {
      label: "Patch Generated (Untested)",
      icon: <FileCode2 className="w-3.5 h-3.5 text-cyan-400" />,
      bg: "bg-cyan-950/60",
      text: "text-cyan-300",
      border: "border-cyan-500/30",
    },
    suggested_fix: {
      label: "Suggested Fix Only",
      icon: <Clock className="w-3.5 h-3.5 text-amber-400" />,
      bg: "bg-amber-950/60",
      text: "text-amber-300",
      border: "border-amber-500/30",
    },
    tests_executed: {
      label: "Tests Executed",
      icon: <AlertTriangle className="w-3.5 h-3.5 text-blue-400" />,
      bg: "bg-blue-950/60",
      text: "text-blue-300",
      border: "border-blue-500/30",
    },
    not_verified: {
      label: "Not Verified",
      icon: <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />,
      bg: "bg-zinc-900",
      text: "text-zinc-400",
      border: "border-zinc-800",
    },
  };

  const c = configs[status] || configs.not_verified;
  const sizeClasses =
    size === "sm"
      ? "text-xs px-2 py-0.5 gap-1"
      : size === "lg"
      ? "text-sm px-3.5 py-1.5 gap-2"
      : "text-xs px-2.5 py-1 gap-1.5";

  return (
    <span
      className={`inline-flex items-center font-mono font-medium rounded-full border ${c.bg} ${c.text} ${c.border} ${sizeClasses}`}
    >
      {c.icon}
      {c.label}
    </span>
  );
};
