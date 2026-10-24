import pytest
from backend.app.engine.state import VerificationStatus, PhoenixStage, TestExecutionRecord, RepairRunEvidence


def test_verification_status_values():
    expected_statuses = {
        "suggested_fix",
        "patch_generated",
        "tests_executed",
        "verified_checks_passed",
        "verification_failed",
        "not_verified",
    }
    actual_statuses = {s.value for s in VerificationStatus}
    assert expected_statuses == actual_statuses


def test_phoenix_stages():
    stages = [
        PhoenixStage.DISCOVER,
        PhoenixStage.INSPECT,
        PhoenixStage.DIAGNOSE,
        PhoenixStage.GENERATE_PATCH,
        PhoenixStage.VERIFY,
        PhoenixStage.RETRY,
        PhoenixStage.REPORT,
        PhoenixStage.PREPARE_CONTRIBUTION,
    ]
    assert len(stages) == 8


def test_test_execution_record():
    rec = TestExecutionRecord(
        command="pytest",
        exit_code=0,
        stdout="4 passed",
        stderr="",
        duration_seconds=0.45,
        passed=True,
        phase="post_patch_verification",
    )
    assert rec.passed is True
    assert rec.exit_code == 0
