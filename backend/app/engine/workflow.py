import os
import uuid
import logging
from typing import Dict, Any, List, Optional, Callable
from pathlib import Path
import datetime

from backend.app.config import settings
from backend.app.engine.state import PhoenixStage, VerificationStatus, RepairRunEvidence, TestExecutionRecord
from backend.app.engine.llm import BharatCodeClient
from backend.app.engine.discover import GitHubDiscoverer, parse_github_url
from backend.app.engine.inspect import RepositoryInspector
from backend.app.engine.diagnose import Diagnoser
from backend.app.engine.patcher import Patcher
from backend.app.engine.verifier import VerificationPipeline
from backend.app.engine.reporter import RepairReporter

logger = logging.getLogger(__name__)


class PhoenixWorkflow:
    """
    Main orchestrator for PHOENIX Autonomous Software Recovery Engine.
    Executes stages 1-8 sequentially with feedback retry loop.
    """

    def __init__(
        self,
        llm_client: Optional[BharatCodeClient] = None,
        on_progress: Optional[Callable[[PhoenixStage, str], None]] = None,
    ):
        self.llm = llm_client or BharatCodeClient()
        self.discoverer = GitHubDiscoverer()
        self.diagnoser = Diagnoser(self.llm)
        self.patcher = Patcher(self.llm)
        self.verifier = VerificationPipeline(self.patcher)
        self.on_progress = on_progress

    def _log(self, stage: PhoenixStage, message: str, evidence: RepairRunEvidence):
        logger.info(f"[{stage.value}] {message}")
        evidence.logs.append(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] [{stage.value}] {message}")
        if self.on_progress:
            self.on_progress(stage, message)

    async def execute_repair(
        self,
        repo_url: str,
        issue_url: str,
        issue_number: Optional[int] = None,
        issue_title: Optional[str] = None,
        issue_body: Optional[str] = None,
        local_path: Optional[str] = None,
        test_command: Optional[str] = None,
        auto_verify: bool = True,
        max_attempts: int = 3,
    ) -> RepairRunEvidence:
        run_id = f"run_{uuid.uuid4().hex[:10]}"

        # Initialize evidence record
        evidence = RepairRunEvidence(
            run_id=run_id,
            repo_url=repo_url,
            issue_url=issue_url,
            issue_number=issue_number or 1,
            issue_title=issue_title or "Software issue",
            current_stage=PhoenixStage.DISCOVER,
            verification_status=VerificationStatus.SUGGESTED_FIX,
            max_attempts=max_attempts,
        )

        try:
            # -------------------------------------------------------------
            # Stage 1: Discover
            # -------------------------------------------------------------
            evidence.current_stage = PhoenixStage.DISCOVER
            self._log(PhoenixStage.DISCOVER, f"Starting discovery for {repo_url}", evidence)

            owner, repo_name, parsed_num = parse_github_url(issue_url or repo_url)
            if parsed_num and not issue_number:
                evidence.issue_number = parsed_num

            # If issue details not provided, fetch from GitHub
            if (not issue_title or not issue_body) and owner and repo_name and evidence.issue_number:
                self._log(PhoenixStage.DISCOVER, f"Fetching issue #{evidence.issue_number} from GitHub API", evidence)
                issue_data = await self.discoverer.fetch_issue(owner, repo_name, evidence.issue_number)
                evidence.issue_title = issue_data.get("title", evidence.issue_title)
                issue_body = issue_data.get("body", "")

            # -------------------------------------------------------------
            # Stage 2: Inspect
            # -------------------------------------------------------------
            evidence.current_stage = PhoenixStage.INSPECT
            self._log(PhoenixStage.INSPECT, "Inspecting repository architecture and test frameworks", evidence)

            # Determine workspace path (local fixture or fallback)
            workspace = Path(local_path) if local_path else Path("fixtures/demo_repo")
            if not workspace.exists() and Path("../fixtures/demo_repo").exists():
                workspace = Path("../fixtures/demo_repo")

            inspector = RepositoryInspector(str(workspace))
            structure = inspector.inspect_structure()

            detected_test_cmd = test_command or structure.get("test_command", "pytest")
            self._log(PhoenixStage.INSPECT, f"Detected language: {structure.get('language')}, Test command: {detected_test_cmd}", evidence)

            relevant_files_info = inspector.find_relevant_files(evidence.issue_title, issue_body or "")
            evidence.relevant_files = [f["path"] for f in relevant_files_info]
            self._log(PhoenixStage.INSPECT, f"Identified {len(evidence.relevant_files)} relevant files: {evidence.relevant_files}", evidence)

            # -------------------------------------------------------------
            # Stage 3: Diagnose
            # -------------------------------------------------------------
            evidence.current_stage = PhoenixStage.DIAGNOSE
            self._log(PhoenixStage.DIAGNOSE, "Querying BharatCode AI model for root-cause diagnosis", evidence)

            diagnosis = await self.diagnoser.diagnose_issue(
                issue_title=evidence.issue_title,
                issue_body=issue_body or "",
                relevant_files=relevant_files_info,
                detected_test_command=detected_test_cmd,
            )
            evidence.root_cause_hypothesis = diagnosis.root_cause_hypothesis
            evidence.supporting_evidence = diagnosis.supporting_evidence
            evidence.proposed_strategy = diagnosis.proposed_strategy
            evidence.verification_status = VerificationStatus.SUGGESTED_FIX
            self._log(PhoenixStage.DIAGNOSE, f"Diagnosis formulated: {diagnosis.root_cause_hypothesis[:120]}...", evidence)

            # Collect source code content for target files
            file_contents: Dict[str, str] = {}
            for fpath in evidence.relevant_files:
                abs_f = workspace / fpath
                if abs_f.is_file():
                    file_contents[fpath] = abs_f.read_text(encoding="utf-8", errors="replace")

            # -------------------------------------------------------------
            # Stage 4 & 5 & 6: Generate Patch, Verify, & Retry Loop
            # -------------------------------------------------------------
            attempt = 1
            last_failure_feedback = None
            verified_success = False

            while attempt <= max_attempts and not verified_success:
                evidence.attempt_count = attempt
                evidence.current_stage = PhoenixStage.GENERATE_PATCH if attempt == 1 else PhoenixStage.RETRY
                self._log(evidence.current_stage, f"Attempt {attempt}/{max_attempts}: Generating unified diff", evidence)

                patch_diff = await self.patcher.generate_patch(
                    issue_title=evidence.issue_title,
                    diagnosis=diagnosis,
                    file_contents=file_contents,
                    failure_feedback=last_failure_feedback,
                )
                evidence.patch_diff = patch_diff
                evidence.verification_status = VerificationStatus.PATCH_GENERATED

                # If no test verification requested or workspace doesn't exist, stop at patch
                if not auto_verify or not workspace.exists():
                    evidence.verification_status = VerificationStatus.NOT_VERIFIED
                    evidence.limitations.append("Local workspace or test execution disabled.")
                    break

                # Stage 5: Verify in isolated sandbox
                evidence.current_stage = PhoenixStage.VERIFY
                self._log(PhoenixStage.VERIFY, f"Running test suite `{detected_test_cmd}` in isolated sandbox worker", evidence)

                status, records, limitations = await self.verifier.verify_patch(
                    source_dir=workspace,
                    patch_diff=patch_diff,
                    test_command=detected_test_cmd,
                )
                evidence.test_records = records
                evidence.limitations = limitations
                evidence.verification_status = status

                if status == VerificationStatus.VERIFIED_PASSED:
                    verified_success = True
                    self._log(PhoenixStage.VERIFY, "SUCCESS: All verification checks passed with exit code 0!", evidence)
                    break
                else:
                    self._log(PhoenixStage.VERIFY, f"Tests failed or unverified. Status: {status.value}", evidence)
                    # Prepare failure feedback for next retry
                    failing_recs = [r for r in records if not r.passed]
                    if failing_recs:
                        last_failure_feedback = f"Exit code: {failing_recs[0].exit_code}\nStderr: {failing_recs[0].stderr}\nStdout: {failing_recs[0].stdout}"
                    attempt += 1

            # -------------------------------------------------------------
            # Stage 7: Report
            # -------------------------------------------------------------
            evidence.current_stage = PhoenixStage.REPORT
            self._log(PhoenixStage.REPORT, "Compiling final evidence report", evidence)

            # -------------------------------------------------------------
            # Stage 8: Prepare Contribution
            # -------------------------------------------------------------
            evidence.current_stage = PhoenixStage.PREPARE_CONTRIBUTION
            self._log(PhoenixStage.PREPARE_CONTRIBUTION, "Formulating pull request metadata and contribution draft", evidence)

            pr_title, pr_body = RepairReporter.prepare_contribution_metadata(
                issue_number=evidence.issue_number,
                issue_title=evidence.issue_title,
                diagnosis_hypothesis=evidence.root_cause_hypothesis or "",
                verification_status=evidence.verification_status,
            )
            evidence.pr_title = pr_title
            evidence.pr_body = pr_body

            evidence.current_stage = PhoenixStage.COMPLETED
            evidence.completed_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
            self._log(PhoenixStage.COMPLETED, f"Repair completed with status: {evidence.verification_status.value}", evidence)

        except Exception as e:
            logger.error(f"Phoenix workflow failed: {e}", exc_info=True)
            evidence.current_stage = PhoenixStage.FAILED
            evidence.verification_status = VerificationStatus.VERIFICATION_FAILED
            evidence.limitations.append(f"Engine exception encountered: {str(e)}")
            self._log(PhoenixStage.FAILED, f"Fatal error: {str(e)}", evidence)

        return evidence
