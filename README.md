# OSS Quest + PHOENIX Recovery Engine
### Extreme-Quality Open-Source Autonomous AI Developer Platform | BharatCode Build League

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16%20App%20Router-black)](https://nextjs.org/)
[![Model](https://img.shields.io/badge/Model-BharatCode%20qwen--3.8--27b-red)](https://bharatcode.ai)

> **Tagline:** Find the issue. Fix the code. Prove the repair.

---

## 1. The Problem

Most AI coding assistants act as probabilistic code generators: they suggest code that looks plausible but frequently breaks existing tests, introduces regressions, fails on subtle edge cases, or leaks sensitive API tokens. Maintainers are overwhelmed by low-quality, untested pull requests.

**OSS Quest** transforms this paradigm. Powered by the **PHOENIX Autonomous Software Recovery Engine**, it does not merely generate code—it discovers real issues, formulates evidence-backed root-cause hypotheses, writes minimal surgical patches, executes test suites in an isolated sandbox, and **proves the repair with unforgeable test logs and exit codes**.

### The PHOENIX Rule of Honest Status
A test that did not run is **never** displayed as passed. The platform strictly distinguishes:
- `Suggested fix`
- `Patch generated`
- `Tests executed`
- `Verified checks passed` (Exit code 0 observed)
- `Verification failed` (Non-zero exit code or assertion failure)
- `Not verified`

---

## 2. Product Workflow & Architecture

PHOENIX executes an 8-stage autonomous recovery pipeline:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ 1. Discover  │ ──> │ 2. Inspect   │ ──> │ 3. Diagnose  │ ──> │ 4. Patch Gen │
│ GitHub Issue │     │ Scoped Files │     │ BharatCode AI│     │ Unified Diff │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                                       │
                                                                       ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ 8. Prepare PR│ <── │ 7. Report    │ <── │ 6. Retry     │ <── │ 5. Verify    │
│ Contribution │     │ Audit Logs   │     │ Feedback Loop│     │ Disposable Box│
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

1. **Discover**: Ingests issue description, labels, and metadata with rate-limit protection. Ranks issues by explainable testability scores.
2. **Inspect**: Scans directory structure, language manifests, and test frameworks without bloating model context.
3. **Diagnose**: Prompts BharatCode (`qwen-3.8-27b`) for structured hypothesis, supporting evidence, and verification plan.
4. **Generate Patch**: Synthesizes surgical unified diff. Validates against path traversal (`..`), null bytes, and out-of-boundary paths.
5. **Verify**: Runs tests before patch (baseline reproduction), applies patch, and executes post-patch verification in an isolated sandbox.
6. **Retry Loop**: If assertions fail, feeds the exact error trace back to the model (up to 3 attempts). Blocks exact-retry loops.
7. **Report**: Compiles audit evidence including command duration, exit codes, and diffs.
8. **Prepare Contribution**: Generates PR title, markdown description, and downloadable `.patch` file.

---

## 3. Genuine Working Interface & Screenshots

OSS Quest includes a dark-first developer workspace built with Next.js 16 and Tailwind CSS:

- **Recovery Dashboard (`/dashboard`)**: Launch repairs by GitHub URL, explore recent runs, and trigger one-click sandbox demos.
- **Issue Discovery (`/discover`)**: Scan repositories and rank issues by testability and scope.
- **Multi-panel Workspace (`/workspace/[id]`)**: Live state machine progress, root-cause diagnosis, unified diff viewer, and sandbox terminal logs.
- **Evidence Report (`/report/[id]`)**: Complete audit report with exit codes and exportable `.patch` and Markdown files.
- **First-PR Mode (`/first-pr/[id]`)**: Step-by-step educational guide for junior open-source contributors.

---

## 4. Installation & Requirements

### System Requirements
- macOS, Linux, or Windows (WSL2)
- Python 3.10+ (tested on Python 3.14)
- Node.js 18+ and npm 9+
- Git

### 1. Clone Repository & Setup Backend
```bash
git clone https://github.com/h4rsh740/oss-quest.git
cd oss-quest

# Create Python virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install backend dependencies and CLI
pip install -r backend/requirements.txt
pip install -e backend
```

### 2. Setup Frontend
```bash
cd frontend
npm install
cd ..
```

---

## 5. Configuration

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

| Environment Variable | Description | Default |
|---|---|---|
| `BHARATCODE_BASE_URL` | BharatCode AI inference base URL | `https://bharatcode.ai/api/model/v1` |
| `BHARATCODE_API_KEY` | BharatCode API Key | None (uses deterministic demo engine if unset) |
| `BHARATCODE_MODEL` | BharatCode model identifier | `qwen-3.8-27b` |
| `GITHUB_TOKEN` | GitHub PAT for higher API rate limits | None (optional for public repos) |
| `DATABASE_URL` | Async SQLAlchemy database URL | `sqlite+aiosqlite:///./ossquest.db` |
| `SANDBOX_TIMEOUT_SECONDS` | Subprocess execution limit | `60` |
| `NEXT_PUBLIC_API_URL` | Frontend API backend address | `http://localhost:8000` |

---

## 6. How to Run the Application

### Start Backend API Server
```bash
source .venv/bin/activate
uvicorn backend.app.main:app --reload --port 8000
```
API Documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

### Start Frontend Developer Interface
In a separate terminal:
```bash
cd frontend
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 7. Developer CLI (`ossq`)

The platform ships with a standalone Python CLI `ossq` sharing core recovery logic:

```bash
# 1. Run the built-in reproducible demo test (reproduces bug, applies patch, passes pytest)
ossq demo

# 2. Analyze a GitHub issue or repository
ossq analyze https://github.com/bharatcode-community/fast-slugify/issues/104

# 3. Execute autonomous recovery and verification
ossq repair https://github.com/bharatcode-community/fast-slugify/issues/104

# 4. Check status of a previous run
ossq verify run_94e9c49d9b

# 5. Export unified patch file
ossq export-patch run_94e9c49d9b
```

---

## 8. Running Automated Tests

Run the full backend test suite:
```bash
source .venv/bin/activate
PYTHONPATH=. pytest backend/tests -v
```

Verified test results:
- `test_health_endpoint`: PASSED
- `test_demo_benchmark`: PASSED
- `test_issue_analyze_demo`: PASSED
- `test_path_traversal_detection`: PASSED (blocks `../../etc/passwd`)
- `test_null_byte_rejection`: PASSED
- `test_empty_patch_rejection`: PASSED
- `test_patch_application_safe`: PASSED
- `test_sandbox_environment_scrubbing`: PASSED (confirms zero credential leakage to child process)
- `test_sandbox_timeout_enforcement`: PASSED
- `test_sandbox_exit_code_capture`: PASSED
- `test_verification_status_values`: PASSED
- `test_phoenix_stages`: PASSED
- `test_test_execution_record`: PASSED

---

## 9. Security Architecture & Threat Model

Executing untrusted open-source repository code is inherently risky. OSS Quest implements defense-in-depth:
1. **Process Isolation**: Arbitrary test suites run inside temporary directories (`/tmp/ossquest_sandbox_*`) that are destroyed after verification.
2. **Environment Variable Scrubbing**: Subprocesses run in a sanitized environment where `BHARATCODE_API_KEY`, `GITHUB_TOKEN`, and database connection strings are omitted.
3. **Execution Limits**: Hard timeouts (60 seconds) terminate runaway processes via `SIGKILL`.
4. **Path Traversal Guards**: Unified diffs are inspected and rejected if they attempt directory traversal or escape the sandbox root.
5. **No Blind Pushes**: PHOENIX prepares PR drafts and patch files. It never pushes or merges code automatically.

---

## 10. Known Limitations

- **Complex Multi-Service Environments**: Repositories requiring multi-node distributed clusters or specialized GPU drivers cannot be verified within the lightweight local sandbox.
- **Interactive Prompts**: Test suites that require interactive TTY input (`input()`, interactive curses) will trigger sandbox timeouts.
- **Network-Isolated Tests**: Test suites that attempt to fetch remote assets during testing will fail when sandbox network isolation is enabled.

---

## 11. Roadmap

- [ ] Docker / Firecracker microVM execution worker backend for multi-tenant production hosting.
- [ ] Language expansion: Native TypeScript / Jest / Cargo / Go test runners.
- [ ] GitHub App webhook integration for `@ossquest repair` comment triggers.
- [ ] Synthetic test generation: Automatically writing reproduction test cases when repositories lack targeted unit tests.

---

## 12. License & Event Compliance

- **License:** Apache License 2.0 (see [LICENSE](LICENSE))
- **Event:** BharatCode Build League 2026
- **Submission File:** `BharatCode.txt` at repository root
