from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from backend.app.engine.state import VerificationStatus, PhoenixStage, TestExecutionRecord


class IssueRanking(BaseModel):
    relevance: float = Field(..., ge=0.0, le=1.0, description="Relevance to core codebase (0-1)")
    testability: float = Field(..., ge=0.0, le=1.0, description="Estimated test reproducibility (0-1)")
    scope: float = Field(..., ge=0.0, le=1.0, description="Surgical locality score (0-1)")
    setup_complexity: float = Field(..., ge=0.0, le=1.0, description="Environment simplicity score (0-1)")
    composite: float = Field(..., ge=0.0, le=1.0, description="Overall weighted score (0-1)")
    missing_info_notes: List[str] = Field(default_factory=list)


class IssueItem(BaseModel):
    id: str
    number: int
    title: str
    body: Optional[str] = None
    state: str
    html_url: str
    labels: List[str] = Field(default_factory=list)
    ranking: IssueRanking
    is_demo: bool = False


class AnalyzeRepoRequest(BaseModel):
    repo_url: str = Field(..., description="GitHub repository URL or local fixture name")


class AnalyzeRepoResponse(BaseModel):
    repo_url: str
    owner: str
    name: str
    default_branch: str
    detected_language: str
    test_framework: str
    candidate_issues: List[IssueItem]
    architecture_summary: str


class RepairStartRequest(BaseModel):
    repo_url: str
    issue_url: str
    issue_number: Optional[int] = None
    issue_title: Optional[str] = None
    issue_body: Optional[str] = None
    local_path: Optional[str] = None
    test_command: Optional[str] = None
    auto_verify: bool = True


class RepairResponse(BaseModel):
    run_id: str
    repo_url: str
    issue_url: str
    issue_number: int
    issue_title: str
    stage: PhoenixStage
    verification_status: VerificationStatus
    root_cause_hypothesis: Optional[str] = None
    supporting_evidence: List[str] = Field(default_factory=list)
    relevant_files: List[str] = Field(default_factory=list)
    proposed_strategy: Optional[str] = None
    patch_diff: Optional[str] = None
    test_records: List[TestExecutionRecord] = Field(default_factory=list)
    attempt_count: int
    max_attempts: int
    limitations: List[str] = Field(default_factory=list)
    pr_title: Optional[str] = None
    pr_body: Optional[str] = None
    logs: List[str] = Field(default_factory=list)
    created_at: str
    completed_at: Optional[str] = None


class FirstPRGuidance(BaseModel):
    run_id: str
    issue_title: str
    plain_english_summary: str
    architecture_overview: str
    affected_components: List[Dict[str, str]]
    step_by_step_walkthrough: List[str]
    diff_line_by_line_explanation: List[Dict[str, str]]
    test_results_explanation: str
    contributor_checklist: List[str]
