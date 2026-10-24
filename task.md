# OSS Quest + PHOENIX Recovery Engine — Implementation Task List

## Phase 1: Repository Audit & Core Foundations
- [x] Inspect existing workspace (confirmed empty workspace, initialized git and Python 3.14 venv).
- [x] Create system documentation: `ARCHITECTURE.md`, `task.md`, `progress.md`.
- [x] Create `.gitignore` and `.env.example` with BharatCode configuration parameters.
- [x] Set up monorepo directory layout (`backend/`, `frontend/`, `fixtures/`, `.github/`).

## Phase 2: PHOENIX Autonomous Software Recovery Engine (Backend)
- [x] Backend core setup: FastAPI app, Pydantic data schemas, SQLite/async DB persistence.
- [x] BharatCode LLM Client: OpenAI-compatible API client (`https://bharatcode.ai/api/model/v1`, default model `qwen-3.8-27b`).
- [x] GitHub & Repository Ingestion: Fetch issues, repo trees, test configs, rate-limit awareness.
- [x] Stage 1 & 2 (Discover & Inspect): Issue parsing, relevance scoring, scoped context builder.
- [x] Stage 3 (Diagnose): Structured root-cause hypothesis generation with confidence markers.
- [x] Stage 4 (Patch Generation): Focused unified diff generation with strict path traversal & syntax validation.
- [x] Stage 5 (Isolated Verification Worker): Sandboxed execution runner with timeout, memory limit, path boundary enforcement, baseline vs post-patch test execution.
- [x] Stage 6 (Retry Loop): Feedback-driven iteration with test failure logs (capped, no exact retries).
- [x] Stage 7 & 8 (Report & Prepare Contribution): Structured evidence report, diff exporter, PR metadata formatter.
- [x] Background job processing: Async repair runner with state machine transitions and live status polling.

## Phase 3: Built-in Reproducible Demo & Benchmark Suite
- [x] Create `fixtures/demo_repo`: Standalone Python project with intentional reproducible bug and failing pytest suite.
- [x] Verify reproducible baseline failure and post-patch recovery in local sandbox.
- [x] Implement benchmark evaluator: Issue reproduction rate, verified fix rate, evidence completeness.

## Phase 4: Developer CLI (`ossq`)
- [x] CLI entry point with commands:
  - `ossq analyze <issue-url>`
  - `ossq repair <issue-url>`
  - `ossq verify <run-id>`
  - `ossq report <run-id>`
  - `ossq export-patch <run-id>`
  - `ossq demo` (runs local reproducible demo end-to-end)
- [x] Packaging setup with entry point in `pyproject.toml`.

## Phase 5: Next.js Frontend Application
- [x] Next.js 16 App Router setup with TypeScript and Tailwind CSS.
- [x] Design system & component tokens: dark-mode developer theme, responsive layout, Lucide icons.
- [x] **A. Landing Page**: Product headline, interactive workflow visualizer, live demo launch CTA, architecture transparency.
- [x] **B. Main Dashboard**: Repo & Issue input, sample repo quick-loads, recent repair runs, filterable history.
- [x] **C. Issue Discovery Screen**: Real issue ranking (scope, testability, relevance), estimate labeling, missing info detection.
- [x] **D. Repository Intelligence View**: File tree, test framework detection, targeted context snippets.
- [x] **E. Repair Workspace**: Multi-panel layout (Issue & Files | Hypothesis & Changes | Repair State & Controls | Terminal logs).
- [x] **F. Verification Report**: Comprehensive audit report, exit codes, patch download, markdown export, status veracity.
- [x] **G. First-PR Guided Mode**: Step-by-step breakdown for junior engineers, learning checklists, diff explanation.

## Phase 6: Automated Testing & Verification
- [x] Backend unit tests: diff validator, state machine, status classification.
- [x] API integration tests: issue discovery endpoint, repair submission, report generation.
- [x] End-to-end verification run on demo fixture (`ossq demo` passing exit code 0).
- [x] Frontend build validation (`npm run build` compiled 9/9 routes).

## Phase 7: BharatCode Compliance & Open Source Polish
- [x] Create `BharatCode.txt` at root.
- [x] Create `README.md` with complete architecture, workflow diagram, genuine CLI/UI guide, security model.
- [x] Create `LICENSE` (Apache 2.0), `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `CHANGELOG.md`.
- [x] Create GitHub issue and PR templates in `.github/`.
- [x] Update `progress.md` with final verification evidence and metrics.
