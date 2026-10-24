from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
import datetime


class VerificationStatus(str, Enum):
    """
    Honest verification state machine for OSS Quest.
    Never claim a bug is fixed merely because an AI model generated a patch.
    """
    SUGGESTED_FIX = "suggested_fix"
    PATCH_GENERATED = "patch_generated"
    TESTS_EXECUTED = "tests_executed"
    VERIFIED_PASSED = "verified_checks_passed"
    VERIFICATION_FAILED = "verification_failed"
    NOT_VERIFIED = "not_verified"


class PhoenixStage(str, Enum):
    DISCOVER = "stage_1_discover"
    INSPECT = "stage_2_inspect"
    DIAGNOSE = "stage_3_diagnose"
    GENERATE_PATCH = "stage_4_generate_patch"
    VERIFY = "stage_5_verify"
    RETRY = "stage_6_retry"
    REPORT = "stage_7_report"
    PREPARE_CONTRIBUTION = "stage_8_prepare_contribution"
    COMPLETED = "completed"
    FAILED = "failed"


class TestExecutionRecord(BaseModel):
    command: str
    exit_code: int
    stdout: str
    stderr: str
    duration_seconds: float
    passed: bool
    phase: str  # "baseline", "targeted_pre_patch", "post_patch", "regression"
    timestamp: str = Field(default_factory=lambda: datetime.datetime.now(datetime.timezone.utc).isoformat())


class RepairRunEvidence(BaseModel):
    run_id: str
    repo_url: str
    issue_url: str
    issue_number: int
    issue_title: str
    current_stage: PhoenixStage
    verification_status: VerificationStatus
    root_cause_hypothesis: Optional[str] = None
    supporting_evidence: List[str] = Field(default_factory=list)
    relevant_files: List[str] = Field(default_factory=list)
    proposed_strategy: Optional[str] = None
    patch_diff: Optional[str] = None
    test_records: List[TestExecutionRecord] = Field(default_factory=list)
    attempt_count: int = 1
    max_attempts: int = 3
    limitations: List[str] = Field(default_factory=list)
    pr_title: Optional[str] = None
    pr_body: Optional[str] = None
    logs: List[str] = Field(default_factory=list)
    created_at: str = Field(default_factory=lambda: datetime.datetime.now(datetime.timezone.utc).isoformat())
    completed_at: Optional[str] = None
