#!/usr/bin/env python3
import sys
import os
import argparse
import asyncio
import json
from pathlib import Path

# Ensure root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.config import settings
from backend.app.engine.discover import GitHubDiscoverer, parse_github_url
from backend.app.engine.workflow import PhoenixWorkflow
from backend.app.engine.state import VerificationStatus, PhoenixStage
from backend.app.engine.reporter import RepairReporter


def print_banner():
    print(r"""
========================================================================
   ____  _____ _____   ____                  _   
  / __ \/ ___// ___/  / __ \__  _____  _____/ /_ 
 / / / /\__ \ \__ \  / / / / / / / _ \/ ___/ __/ 
/ /_/ /___/ /___/ / / /_/ / /_/ /  __(__  ) /_   
\____//____//____/  \___\_\__,_/\___/____/\__/   
       PHOENIX Autonomous Software Recovery Engine
   "Find the issue. Fix the code. Prove the repair."
========================================================================
""")


async def cmd_analyze(issue_url: str):
    print(f"[*] Analyzing issue URL: {issue_url}")
    owner, repo, num = parse_github_url(issue_url)
    if not owner or not repo:
        print(f"[!] Error: Unable to parse GitHub URL: {issue_url}")
        sys.exit(2)

    discoverer = GitHubDiscoverer()
    if num:
        print(f"[*] Fetching issue #{num} from {owner}/{repo}...")
        issue = await discoverer.fetch_issue(owner, repo, num)
        ranking = discoverer.rank_issue(issue)
        print("\n--- ISSUE DETAILS ---")
        print(f"Title:       {issue.get('title')}")
        print(f"State:       {issue.get('state')}")
        print(f"Labels:      {[l.get('name') if isinstance(l, dict) else l for l in issue.get('labels', [])]}")
        print("\n--- EXPLAINABLE RECOVERABILITY RANKING ---")
        print(f"Composite Score:   {ranking.composite * 100:.1f}%")
        print(f"  • Testability:   {ranking.testability * 100:.1f}%")
        print(f"  • Locality/Scope:{ranking.scope * 100:.1f}%")
        print(f"  • Relevance:     {ranking.relevance * 100:.1f}%")
        print(f"  • Setup Simplicity: {ranking.setup_complexity * 100:.1f}%")
        if ranking.missing_info_notes:
            print("\nNotes / Missing Context:")
            for note in ranking.missing_info_notes:
                print(f"  ⚠️  {note}")
    else:
        print(f"[*] Fetching candidate issues for {owner}/{repo}...")
        issues = await discoverer.list_candidate_issues(owner, repo, limit=5)
        print(f"Found {len(issues)} open candidate issues:")
        for idx, item in enumerate(issues, 1):
            r = discoverer.rank_issue(item)
            print(f" {idx}. #{item.get('number')}: {item.get('title')} (Suitability: {r.composite * 100:.0f}%)")


async def cmd_repair(issue_url: str, local_path: str = None, test_cmd: str = None):
    print(f"[*] Initiating PHOENIX autonomous recovery on: {issue_url}")
    owner, repo, num = parse_github_url(issue_url)
    repo_url = f"https://github.com/{owner}/{repo}" if owner and repo else issue_url

    workflow = PhoenixWorkflow()
    evidence = await workflow.execute_repair(
        repo_url=repo_url,
        issue_url=issue_url,
        issue_number=num or 1,
        local_path=local_path,
        test_command=test_cmd,
        auto_verify=True,
    )

    print("\n==================== REPAIR RESULT ====================")
    print(f"Run ID:        {evidence.run_id}")
    print(f"Status:        {evidence.verification_status.value.upper()}")
    print(f"Attempts:      {evidence.attempt_count}/{evidence.max_attempts}")
    print(f"Root Cause:    {evidence.root_cause_hypothesis}")
    print(f"Modified Files:{evidence.relevant_files}")
    
    if evidence.test_records:
        print("\nTest Execution Logs:")
        for rec in evidence.test_records:
            icon = "✅" if rec.passed else "❌"
            print(f"  {icon} [{rec.phase}] `{rec.command}` (Exit Code: {rec.exit_code}, {rec.duration_seconds}s)")

    if evidence.verification_status == VerificationStatus.VERIFIED_PASSED:
        print("\n🎉 VERIFICATION PASSED: All tests succeeded with code 0!")
        sys.exit(0)
    elif evidence.verification_status == VerificationStatus.VERIFICATION_FAILED:
        print("\n❌ VERIFICATION FAILED: Tests exited with non-zero status.")
        sys.exit(1)
    else:
        print(f"\n⚪ STATUS: {evidence.verification_status.value}")
        sys.exit(0)


async def cmd_demo():
    print("[*] Running PHOENIX reproducible verification demo...")
    print("[*] Target: built-in 'fast_slugify' package (intentional boundary delimiter bug)")
    
    # Path to demo repo
    base_dir = Path(__file__).resolve().parent.parent.parent
    demo_path = base_dir / "fixtures" / "demo_repo"
    
    workflow = PhoenixWorkflow()
    evidence = await workflow.execute_repair(
        repo_url="https://github.com/bharatcode-community/fast-slugify",
        issue_url="https://github.com/bharatcode-community/fast-slugify/issues/104",
        issue_number=104,
        issue_title="slugify() leaves trailing hyphens and duplicates hyphens on edge cases",
        issue_body="Calling slugify('trailing hyphen -') returns 'trailing-hyphen-'. Expected 'trailing-hyphen'.",
        local_path=str(demo_path),
        test_command="pytest tests/test_slugify.py",
        auto_verify=True,
    )

    print("\n--- DEMO VERIFICATION SUMMARY ---")
    print(f"Run ID:               {evidence.run_id}")
    print(f"Final Status:         {evidence.verification_status.value.upper()}")
    print(f"Root Cause:           {evidence.root_cause_hypothesis}")
    print("\nExecution History:")
    for rec in evidence.test_records:
        badge = "PASS [Exit 0]" if rec.passed else f"FAIL [Exit {rec.exit_code}]"
        print(f"  • {rec.phase:<24} {badge:<16} duration: {rec.duration_seconds}s")

    print("\nGenerated Patch:")
    print("------------------------------------------------------------------------")
    print(evidence.patch_diff)
    print("------------------------------------------------------------------------")

    if evidence.verification_status == VerificationStatus.VERIFIED_PASSED:
        print("✅ SUCCESS: PHOENIX autonomous recovery verified by actual test execution.")
        sys.exit(0)
    else:
        print("❌ FAILED: Did not pass verification.")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        prog="ossq",
        description="OSS Quest + PHOENIX: Autonomous Software Recovery Engine CLI",
    )
    subparsers = parser.add_subparsers(dest="command", help="Available subcommands")

    # analyze
    parser_analyze = subparsers.add_parser("analyze", help="Analyze GitHub repository or issue")
    parser_analyze.add_argument("url", help="GitHub issue or repository URL")

    # repair
    parser_repair = subparsers.add_parser("repair", help="Run autonomous repair on an issue")
    parser_repair.add_argument("url", help="GitHub issue URL")
    parser_repair.add_argument("--local-path", default=None, help="Path to local repository workspace")
    parser_repair.add_argument("--test-command", default=None, help="Override test command (e.g. 'pytest')")

    # demo
    subparsers.add_parser("demo", help="Run built-in reproducible demo test")

    # verify
    parser_verify = subparsers.add_parser("verify", help="Check verification status for a run ID")
    parser_verify.add_argument("run_id", help="Repair Run ID")

    # report
    parser_report = subparsers.add_parser("report", help="Export markdown evidence report")
    parser_report.add_argument("run_id", help="Repair Run ID")

    # export-patch
    parser_export = subparsers.add_parser("export-patch", help="Export unified diff patch file")
    parser_export.add_argument("run_id", help="Repair Run ID")

    args = parser.parse_args()

    if not args.command:
        print_banner()
        parser.print_help()
        sys.exit(0)

    print_banner()

    if args.command == "analyze":
        asyncio.run(cmd_analyze(args.url))
    elif args.command == "repair":
        asyncio.run(cmd_repair(args.url, args.local_path, args.test_command))
    elif args.command == "demo":
        asyncio.run(cmd_demo())
    elif args.command in ["verify", "report", "export-patch"]:
        print(f"[*] Querying run '{args.run_id}' via database...")
        from backend.app.database import engine
        from sqlalchemy import text
        async def fetch_run():
            async with engine.connect() as conn:
                res = await conn.execute(text("SELECT id, verification_status, patch_diff, test_records FROM repair_runs WHERE id = :id"), {"id": args.run_id})
                row = res.fetchone()
                if not row:
                    print(f"[!] Run ID {args.run_id} not found in local database.")
                    sys.exit(1)
                if args.command == "verify":
                    print(f"Run ID: {row[0]}")
                    print(f"Verification Status: {row[1]}")
                elif args.command == "export-patch":
                    if row[2]:
                        out_file = f"patch_{args.run_id}.patch"
                        Path(out_file).write_text(row[2])
                        print(f"[+] Saved patch to {out_file}")
                    else:
                        print("[!] No patch exists for this run.")
                elif args.command == "report":
                    print(f"# Report for {row[0]}")
                    print(f"Status: {row[1]}")
        asyncio.run(fetch_run())


if __name__ == "__main__":
    main()
