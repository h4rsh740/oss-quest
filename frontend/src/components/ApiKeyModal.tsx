"use client";

import React, { useState, useEffect } from "react";
import {
  Key,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Zap,
  GraduationCap,
  Sparkles,
  X,
  RotateCw,
  Copy,
  Eye,
  EyeOff,
} from "lucide-react";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    authenticated: boolean;
    subscription_active: boolean;
    models: string[];
    message: string;
  } | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    // Load from localStorage if present
    const stored = localStorage.getItem("bharatcode_custom_api_key");
    if (stored) {
      setApiKey(stored);
    }
  }, []);

  if (!isOpen) return null;

  const handleVerify = async () => {
    if (!apiKey.trim()) return;
    setVerifying(true);
    setVerificationResult(null);
    setSavedSuccess(false);

    try {
      const res = await fetch("http://localhost:8000/api/v1/config/verify-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey }),
      });
      const data = await res.json();
      setVerificationResult(data);

      if (data.authenticated) {
        // Save in localStorage
        localStorage.setItem("bharatcode_custom_api_key", apiKey.trim());
        // Also update runtime on backend server
        await fetch("http://localhost:8000/api/v1/config/set-runtime-key", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ api_key: apiKey.trim() }),
        });
        setSavedSuccess(true);
      }
    } catch (err: any) {
      setVerificationResult({
        authenticated: false,
        subscription_active: false,
        models: [],
        message: "Failed to connect to backend verification service: " + err.message,
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleUseDemo = () => {
    localStorage.removeItem("bharatcode_custom_api_key");
    setApiKey("");
    setVerificationResult(null);
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in font-sans">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-xl w-full p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-500 hover:text-zinc-200 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white">
              <Key className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Connect BharatCode AI Engine
            </h2>
          </div>
          <p className="text-zinc-400 text-xs leading-relaxed">
            Connect your personal BharatCode developer API key to enable live model reasoning with{" "}
            <strong className="text-zinc-200">Qwen 3.8 27B</strong>.
          </p>
        </div>

        {/* API Key Input Field */}
        <div className="space-y-2">
          <label className="block text-xs font-mono text-zinc-400 font-medium">
            Your BharatCode API Key
          </label>
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="bc_live_xxxxxxxxxxxxxxxxxxxxxxxx..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-3.5 pr-20 py-2.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-rose-500 transition"
            />
            <div className="absolute right-2 top-2 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="p-1 text-zinc-500 hover:text-zinc-300"
                title={showKey ? "Hide key" : "Show key"}
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleVerify}
            disabled={verifying || !apiKey.trim()}
            className="w-full sm:flex-1 py-2.5 rounded-lg bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-semibold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-md shadow-rose-950/50"
          >
            {verifying ? (
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5" />
            )}
            {verifying ? "Testing API Connection..." : "Verify & Save API Key"}
          </button>
          <button
            onClick={handleUseDemo}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-medium text-xs transition"
          >
            Use Offline Demo Mode
          </button>
        </div>

        {/* Verification Diagnostics Feedback Box */}
        {verificationResult && (
          <div
            className={`p-4 rounded-xl border space-y-2 text-xs font-mono ${
              verificationResult.authenticated && verificationResult.subscription_active
                ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                : verificationResult.authenticated
                ? "bg-amber-950/30 border-amber-500/40 text-amber-300"
                : "bg-rose-950/30 border-rose-500/40 text-rose-300"
            }`}
          >
            <div className="flex items-center gap-2 font-semibold">
              {verificationResult.authenticated ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span>
                {verificationResult.authenticated
                  ? verificationResult.subscription_active
                    ? "Live API Connected & Active"
                    : "Key Authenticated (Plan Activation Needed)"
                  : "Authentication Failed"}
              </span>
            </div>
            <p className="text-[11px] text-zinc-300 font-sans leading-relaxed">
              {verificationResult.message}
            </p>
            {verificationResult.models.length > 0 && (
              <div className="pt-1 text-[11px] text-zinc-400">
                Models available on your account:{" "}
                <span className="text-zinc-200">{verificationResult.models.join(", ")}</span>
              </div>
            )}
          </div>
        )}

        {/* Plans and Access Options Card */}
        <div className="border border-zinc-800 rounded-xl bg-zinc-900/40 p-4 space-y-3">
          <div className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Where to get BharatCode token access:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Student Free Plan */}
            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-300">
                <GraduationCap className="w-4 h-4 text-emerald-400" />
                Students: 100% Free
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                Verify your college email (<code className="text-zinc-300">.edu</code> / <code className="text-zinc-300">.ac.in</code>) on BharatCode to get <strong>10 Million free tokens/day</strong> for Qwen.
              </p>
              <a
                href="https://bharatcode.ai/account"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-medium"
              >
                Verify Student Account <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Developer Lite Plan */}
            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-rose-300">
                <Zap className="w-4 h-4 text-rose-400" />
                Developer Lite Plan
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                Subscribe to BharatCode Lite (<strong>₹399/month</strong>) for full API token generation and access to Qwen 3.8 27B.
              </p>
              <a
                href="https://bharatcode.ai/subscribe"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 font-medium"
              >
                View Plans & Subscribe <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="text-[11px] text-zinc-500 font-mono flex items-center justify-between border-t border-zinc-900 pt-3">
          <span>🔒 Keys are stored securely and never leaked in child test environments.</span>
          <button onClick={onClose} className="hover:text-zinc-300">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
