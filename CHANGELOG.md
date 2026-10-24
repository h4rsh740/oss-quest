# Changelog

All notable changes to **OSS Quest** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-10-24

### Added
- **PHOENIX Recovery Engine**: 8-stage autonomous repair pipeline (Discover, Inspect, Diagnose, Patch Gen, Verify, Retry, Report, Prepare PR).
- **Honest Status State Machine**: Distinction between `suggested_fix`, `patch_generated`, `tests_executed`, `verified_checks_passed`, `verification_failed`, and `not_verified`.
- **Isolated Execution Sandbox**: Disposable `/tmp` runner with subprocess isolation, timeout limits, and environment variable stripping.
- **BharatCode AI Model Integration**: Support for OpenAI-compatible endpoint at `https://bharatcode.ai/api/model/v1` (default model `qwen-3.8-27b`) with offline demo fallback.
- **Explainable Issue Ranking**: Multi-factor heuristic scoring (Testability, Locality/Scope, Relevance, Setup Simplicity).
- **Developer CLI (`ossq`)**: Full terminal commands for `analyze`, `repair`, `demo`, `verify`, `report`, and `export-patch`.
- **Next.js Developer Interface**: Dark-first UI featuring Landing page, Recovery Dashboard, Issue Discovery, Multi-panel Workspace, Verification Evidence Report, and First-PR Guided Mode.
- **Reproducible Test Fixture**: Built-in `fast_slugify` package with reproducible boundary delimiter bug and pytest assertions.
