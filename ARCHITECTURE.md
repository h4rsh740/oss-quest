# OSS Quest + PHOENIX Recovery Engine: System Architecture

## 1. System Overview

**OSS Quest** is an open-source autonomous developer platform that pairs with the **PHOENIX Autonomous Software Recovery Engine**. It bridges the gap between AI code generation and software engineering rigor: it finds issues, understands codebases, generates minimal surgical patches, executes actual test suites in an isolated sandbox, and prepares verifiable pull requests backed by empirical test execution logs.

```
┌────────────────────────────────────────────────────────────────────────┐
│                               OSS QUEST                                │
│                     Next.js 14 Developer Interface                     │
│  ┌──────────────┬──────────────────┬─────────────────┬──────────────┐  │
│  │ Landing Page │ Dashboard & Runs │ Issue Discovery │ First-PR Hub │  │
│  └──────┬───────┴────────┬─────────┴────────┬────────┴──────┬───────┘  │
└─────────┼────────────────┼──────────────────┼───────────────┼──────────┘
          │                │                  │               │
          ▼                ▼                  ▼               ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        FastAPI Backend Gateway                         │
│   • REST Endpoints (/api/v1/issues, /api/v1/repairs, /api/v1/demo)     │
│   • Background Worker Queue (Async state machine execution)           │
│   • SQLite / PostgreSQL Storage (Jobs, Runs, Reports, Patches)         │
│   • Zero Credential Exposure (Secrets never stored or leaked)         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
       ┌────────────────────────────┴───────────────────────────┐
       ▼                                                        ▼
┌────────────────────────────────┐            ┌────────────────────────────────┐
│   BharatCode AI Integration    │            │    PHOENIX Recovery Engine     │
│  • Base URL:                   │            │  1. Discover   5. Verify       │
│    https://bharatcode.ai/api/  │            │  2. Inspect    6. Retry Loop   │
│    model/v1                    │            │  3. Diagnose   7. Report       │
│  • Default: qwen-3.8-27b       │            │  4. Patch Gen  8. Prepare PR   │
│  • Strict structured outputs   │            └───────────────┬────────────────┘
└────────────────────────────────┘                            │
                                                              ▼
                                              ┌────────────────────────────────┐
                                              │   Disposable Sandbox Worker    │
                                              │  • Isolated /tmp workspace     │
                                              │  • Path traversal blocked      │
                                              │  • Execution timeout limits    │
                                              │  • Strip API keys from env     │
                                              │  • Capture stdout/stderr/codes │
                                              └────────────────────────────────┘
```

---

## 2. PHOENIX Autonomous Software Recovery Engine Stages

1. **Stage 1 — Discover**:
   - Ingests repository metadata, issue description, labels, commits, and contribution docs.
   - Detects language ecosystem, package manifests (`pyproject.toml`, `package.json`, etc.), and test configuration.

2. **Stage 2 — Inspect**:
   - Performs scoped repository reconnaissance without sending the entire codebase to the LLM.
   - Identifies candidate files using lexical/structural indexing and file path heuristics.
   - Extracts relevant function and test definitions.

3. **Stage 3 — Diagnose**:
   - Queries BharatCode AI model (`qwen-3.8-27b`) for a typed diagnosis:
     - Root-cause hypothesis.
     - Supporting evidence.
     - Target files to modify.
     - Proposed minimal fix strategy.
     - Verification plan and uncertainty disclosure.

4. **Stage 4 — Patch Generation**:
   - Generates unified diff with strict path traversal validation (`..` checks, absolute path rejection).
   - Validates diff syntax and verifies target lines exist in the isolated working tree.

5. **Stage 5 — Isolated Verification**:
   - Creates a disposable working directory.
   - Runs baseline tests (to confirm failure reproduction or clean baseline).
   - Applies the validated patch.
   - Runs targeted test suite and regression tests.
   - Captures actual process exit codes, stdout, stderr, and run duration.

6. **Stage 6 — Retry Loop**:
   - If tests fail, feeds the exact error trace back to the BharatCode model.
   - Bounded at 3 retries max to prevent runaway token usage or infinite loops.
   - Blocks exact byte-identical patch retries.

7. **Stage 7 — Evidence-Backed Report**:
   - Compiles an unforgeable repair report:
     - Run ID & Timestamps.
     - Root-cause hypothesis.
     - Unified diff.
     - Executed commands with actual exit codes.
     - Full execution logs.
     - Honest verification classification.

8. **Stage 8 — Contribution Preparation**:
   - Generates PR title, markdown description, git commit message, and `.patch` export.
   - Never auto-pushes or auto-merges without human authorization.

---

## 3. Verification State Machine

OSS Quest strictly enforces honest status classification. A test that was not executed will **never** be labeled as passed:

| State | Definition |
|---|---|
| `SUGGESTED_FIX` | Root cause diagnosed and strategy formulated; no patch yet generated. |
| `PATCH_GENERATED` | Unified diff synthesized and validated syntactically; no tests executed yet. |
| `TESTS_EXECUTED` | Sandboxed test runner initiated and completed execution. |
| `VERIFIED_PASSED` | **All targeted & regression tests exited with code 0 after patch application.** |
| `VERIFICATION_FAILED` | Tests executed but one or more assertions failed or returned non-zero exit code. |
| `NOT_VERIFIED` | No executable test suite found or environment constraints precluded test execution. |

---

## 4. Security Architecture & Threat Model

Executing untrusted open-source repository code presents severe security risks. OSS Quest implements defense-in-depth:

1. **Subprocess Isolation**:
   - Never run repository tests inside the FastAPI web server process.
   - Disposable working copies in OS temporary directories (`/tmp/ossquest_sandbox_*`), completely wiped after execution.
2. **Environment Variable Scrubbing**:
   - Subprocesses are spawned with a sanitized `os.environ` containing only minimal system `PATH` and Python runtime vars.
   - `BHARATCODE_API_KEY`, GitHub tokens, and database credentials are strictly omitted from child process environments.
3. **Resource & Execution Limits**:
   - Timeouts (default 60 seconds per test run) prevent denial-of-service via infinite loops or hanging sockets.
   - Process tree killing via `SIGKILL` if timeout expires.
4. **Filesystem Boundaries**:
   - Patches are rejected if they reference files outside the target sandbox directory or use `../` directory traversal.
   - Symlinks pointing outside the sandbox root are blocked.

---

## 5. Persistence & Data Model

- **Project**: Represents a tracked GitHub repository (owner, name, default branch, language).
- **Issue**: Issue metadata (number, title, body, state, URL, discoverability ranking).
- **RepairRun**:
  - `run_id`: UUID
  - `status`: State machine enum
  - `hypothesis`: Text
  - `patch_diff`: Unified diff string
  - `test_command`: Shell command string
  - `exit_code`: Integer
  - `test_output`: Stdout + stderr
  - `created_at`, `completed_at`
- Storage uses async SQLite with schema compatible with PostgreSQL / Supabase.
