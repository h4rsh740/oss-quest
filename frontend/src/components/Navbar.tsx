"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, GitPullRequest, Search, Terminal, Activity, BookOpen, Code2 } from "lucide-react";

export const Navbar: React.FC = () => {
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("http://localhost:8000/api/v1/health")
      .then((res) => {
        setBackendOnline(res.ok);
      })
      .catch(() => setBackendOnline(false));
  }, []);

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-950/40 group-hover:scale-105 transition-transform">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-zinc-100 tracking-tight text-base font-mono">OSS QUEST</span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                  PHOENIX
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 hidden sm:block">Find. Fix. Prove.</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-zinc-400">
            <Link
              href="/dashboard"
              className="px-3 py-1.5 rounded-md hover:text-zinc-100 hover:bg-zinc-900 transition flex items-center gap-1.5"
            >
              <Activity className="w-3.5 h-3.5 text-zinc-400" />
              Dashboard
            </Link>
            <Link
              href="/discover"
              className="px-3 py-1.5 rounded-md hover:text-zinc-100 hover:bg-zinc-900 transition flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5 text-zinc-400" />
              Discover Issues
            </Link>
            <Link
              href="/dashboard?demo=true"
              className="px-3 py-1.5 rounded-md hover:text-zinc-100 hover:bg-zinc-900 transition flex items-center gap-1.5 text-amber-400/90"
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              One-Click Demo
            </Link>
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Health Status Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400">
            <span
              className={`w-2 h-2 rounded-full ${
                backendOnline === true
                  ? "bg-emerald-400 animate-pulse"
                  : backendOnline === false
                  ? "bg-rose-500"
                  : "bg-zinc-600"
              }`}
            />
            <span>{backendOnline ? "PHOENIX Engine Ready" : "Local Engine"}</span>
          </div>

          {/* BharatCode Build League Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-950/40 border border-rose-900/40 text-[11px] text-rose-300 font-mono">
            BharatCode Build League
          </div>

          {/* GitHub Link */}
          <a
            href="https://github.com/h4rsh740/oss-quest"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-md hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition"
            title="GitHub Repository"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </a>
        </div>
      </div>
    </header>
  );
};
