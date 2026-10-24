import logging
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path
from backend.app.engine.state import VerificationStatus, TestExecutionRecord
from backend.app.engine.sandbox import ExecutionSandbox
from backend.app.engine.patcher import Patcher

logger = logging.getLogger(__name__)


class VerificationPipeline:
    """
    Stage 5: Isolated test verification pipeline.
    Runs pre-patch tests, applies patch, runs post-patch tests, and classifies status honestly.
    """

    def __init__(self, patcher: Patcher):
        self.patcher = patcher

    async def verify_patch(
        self,
        source_dir: Path,
        patch_diff: str,
        test_command: Optional[str] = None,
    ) -> Tuple[VerificationStatus, List[TestExecutionRecord], List[str]]:
        records: List[TestExecutionRecord] = []
        limitations: List[str] = []

        if not test_command or test_command.strip() == "":
            limitations.append("No automated test command detected or configured for this repository.")
            return VerificationStatus.NOT_VERIFIED, records, limitations

        # Spawn isolated execution sandbox
        sandbox = ExecutionSandbox(source_dir=source_dir)
        try:
            sandbox.create_sandbox()

            # 1. Baseline pre-patch execution
            baseline_record = await sandbox.run_command(test_command, phase="baseline_pre_patch")
            records.append(baseline_record)

            if baseline_record.passed:
                limitations.append(
                    "Warning: Pre-patch tests passed. The existing test suite did not reproduce the defect before patching."
                )

            # 2. Apply patch in sandbox
            apply_success = False
            try:
                apply_success = self.patcher.apply_patch(patch_diff, sandbox.sandbox_dir)
            except Exception as e:
                limitations.append(f"Patch application failed: {str(e)}")
                return VerificationStatus.VERIFICATION_FAILED, records, limitations

            if not apply_success:
                limitations.append("Unified diff could not be cleanly applied to target files.")
                return VerificationStatus.VERIFICATION_FAILED, records, limitations

            # 3. Post-patch test execution
            post_patch_record = await sandbox.run_command(test_command, phase="post_patch_verification")
            records.append(post_patch_record)

            # Classification
            if post_patch_record.passed:
                # If baseline failed and post-patch passed, this is a verified fix!
                status = VerificationStatus.VERIFIED_PASSED
            else:
                status = VerificationStatus.VERIFICATION_FAILED

            return status, records, limitations

        finally:
            sandbox.cleanup()
