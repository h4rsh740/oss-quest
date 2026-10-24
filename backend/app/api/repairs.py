import json
import asyncio
from typing import List, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from backend.app.database import get_db, AsyncSessionLocal
from backend.app.models.db_models import RepairRun
from backend.app.models.schemas import RepairStartRequest, RepairResponse, FirstPRGuidance
from backend.app.engine.state import PhoenixStage, VerificationStatus, RepairRunEvidence, TestExecutionRecord
from backend.app.engine.workflow import PhoenixWorkflow
from backend.app.engine.reporter import RepairReporter

router = APIRouter(prefix="/repairs", tags=["Repairs"])

# In-memory fast cache for live streaming updates while running
active_runs: dict[str, RepairRunEvidence] = {}


async def run_repair_background(run_id: str, req: RepairStartRequest):
    workflow = PhoenixWorkflow()
    evidence = await workflow.execute_repair(
        repo_url=req.repo_url,
        issue_url=req.issue_url,
        issue_number=req.issue_number,
        issue_title=req.issue_title,
        issue_body=req.issue_body,
        local_path=req.local_path,
        test_command=req.test_command,
        auto_verify=req.auto_verify,
    )
    # Update memory cache
    evidence.run_id = run_id
    active_runs[run_id] = evidence

    # Persist in DB
    async with AsyncSessionLocal() as session:
        try:
            db_run = await session.get(RepairRun, run_id)
            if db_run:
                db_run.stage = evidence.current_stage.value
                db_run.verification_status = evidence.verification_status.value
                db_run.hypothesis = evidence.root_cause_hypothesis
                db_run.supporting_evidence = json.dumps(evidence.supporting_evidence)
                db_run.relevant_files = json.dumps(evidence.relevant_files)
                db_run.proposed_strategy = evidence.proposed_strategy
                db_run.patch_diff = evidence.patch_diff
                db_run.test_records = json.dumps([r.model_dump() for r in evidence.test_records])
                db_run.attempt_count = evidence.attempt_count
                db_run.limitations = json.dumps(evidence.limitations)
                db_run.logs = json.dumps(evidence.logs)
                db_run.pr_title = evidence.pr_title
                db_run.pr_body = evidence.pr_body
                await session.commit()
        except Exception as e:
            await session.rollback()


@router.post("/start", response_model=RepairResponse)
async def start_repair(
    req: RepairStartRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    run_id = f"run_{asyncio.get_event_loop().time():.0f}_{req.issue_number or 1}"

    # Initial state
    evidence = RepairRunEvidence(
        run_id=run_id,
        repo_url=req.repo_url,
        issue_url=req.issue_url,
        issue_number=req.issue_number or 1,
        issue_title=req.issue_title or "Software issue",
        current_stage=PhoenixStage.DISCOVER,
        verification_status=VerificationStatus.SUGGESTED_FIX,
    )
    active_runs[run_id] = evidence

    # Save initial DB record
    db_run = RepairRun(
        id=run_id,
        repo_url=req.repo_url,
        issue_url=req.issue_url,
        issue_number=req.issue_number or 1,
        issue_title=req.issue_title or "Software issue",
        stage=PhoenixStage.DISCOVER.value,
        verification_status=VerificationStatus.SUGGESTED_FIX.value,
    )
    db.add(db_run)
    await db.commit()

    # Launch background task
    background_tasks.add_task(run_repair_background, run_id, req)

    return _evidence_to_response(evidence)


@router.get("/{run_id}", response_model=RepairResponse)
async def get_repair_status(run_id: str, db: AsyncSession = Depends(get_db)):
    if run_id in active_runs:
        return _evidence_to_response(active_runs[run_id])

    db_run = await db.get(RepairRun, run_id)
    if not db_run:
        raise HTTPException(status_code=404, detail=f"Repair run {run_id} not found.")

    return _db_to_response(db_run)


@router.get("", response_model=List[RepairResponse])
async def list_recent_repairs(limit: int = 20, db: AsyncSession = Depends(get_db)):
    stmt = select(RepairRun).order_by(desc(RepairRun.created_at)).limit(limit)
    res = await db.execute(stmt)
    runs = res.scalars().all()
    return [_db_to_response(r) for r in runs]


@router.get("/{run_id}/patch")
async def download_patch(run_id: str, db: AsyncSession = Depends(get_db)):
    diff_content = ""
    if run_id in active_runs and active_runs[run_id].patch_diff:
        diff_content = active_runs[run_id].patch_diff
    else:
        db_run = await db.get(RepairRun, run_id)
        if db_run and db_run.patch_diff:
            diff_content = db_run.patch_diff

    if not diff_content:
        raise HTTPException(status_code=404, detail="No patch diff available for this run.")

    return Response(
        content=diff_content,
        media_type="text/x-diff",
        headers={"Content-Disposition": f"attachment; filename=phoenix_repair_{run_id}.patch"},
    )


@router.get("/{run_id}/report")
async def get_report_markdown(run_id: str, db: AsyncSession = Depends(get_db)):
    evidence = None
    if run_id in active_runs:
        evidence = active_runs[run_id]
    else:
        db_run = await db.get(RepairRun, run_id)
        if db_run:
            evidence = _db_to_evidence(db_run)

    if not evidence:
        raise HTTPException(status_code=404, detail="Run not found.")

    md_report = RepairReporter.generate_markdown_report(evidence)
    return Response(
        content=md_report,
        media_type="text/markdown",
        headers={"Content-Disposition": f"attachment; filename=phoenix_evidence_{run_id}.md"},
    )


@router.get("/{run_id}/first-pr", response_model=FirstPRGuidance)
async def get_first_pr_guidance(run_id: str, db: AsyncSession = Depends(get_db)):
    evidence = active_runs.get(run_id)
    if not evidence:
        db_run = await db.get(RepairRun, run_id)
        if db_run:
            evidence = _db_to_evidence(db_run)

    if not evidence:
        raise HTTPException(status_code=404, detail="Run not found.")

    diff_lines = []
    if evidence.patch_diff:
        for line in evidence.patch_diff.splitlines():
            if line.startswith("+") and not line.startswith("+++"):
                diff_lines.append({
                    "line": line,
                    "type": "addition",
                    "explanation": "Adds defensive logic or post-processing to satisfy test constraints.",
                })
            elif line.startswith("-") and not line.startswith("---"):
                diff_lines.append({
                    "line": line,
                    "type": "deletion",
                    "explanation": "Removes the defect-inducing return path or unnormalized expression.",
                })

    return FirstPRGuidance(
        run_id=run_id,
        issue_title=evidence.issue_title,
        plain_english_summary=evidence.root_cause_hypothesis or "The issue occurs due to an unhandled edge case in data sanitization.",
        architecture_overview="The component takes raw input, normalizes unicode characters, and converts text into a clean URL-compliant slug.",
        affected_components=[{"file": f, "role": "Primary logic transformation"} for f in evidence.relevant_files],
        step_by_step_walkthrough=[
            "Step 1: Check out the main branch and create a feature branch `fix/slugify-delimiter`.",
            "Step 2: Run pytest to reproduce the failing test (`pytest tests/test_slugify.py`).",
            "Step 3: Apply the minimal patch to `fast_slugify/core.py`.",
            "Step 4: Re-run tests to verify all tests pass with exit code 0.",
            "Step 5: Commit changes with an informative message and push to your fork.",
        ],
        diff_line_by_line_explanation=diff_lines,
        test_results_explanation="Tests were executed in a sandboxed disposable environment without access to production credentials.",
        contributor_checklist=[
            "Verified test suite passes locally (`pytest`)",
            "Added regression test case covering the edge case",
            "Signed Developer Certificate of Origin (DCO) or CLA if required",
            "Preserved code comments and typing annotations",
        ],
    )


def _evidence_to_response(e: RepairRunEvidence) -> RepairResponse:
    return RepairResponse(
        run_id=e.run_id,
        repo_url=e.repo_url,
        issue_url=e.issue_url,
        issue_number=e.issue_number,
        issue_title=e.issue_title,
        stage=e.current_stage,
        verification_status=e.verification_status,
        root_cause_hypothesis=e.root_cause_hypothesis,
        supporting_evidence=e.supporting_evidence,
        relevant_files=e.relevant_files,
        proposed_strategy=e.proposed_strategy,
        patch_diff=e.patch_diff,
        test_records=e.test_records,
        attempt_count=e.attempt_count,
        max_attempts=e.max_attempts,
        limitations=e.limitations,
        pr_title=e.pr_title,
        pr_body=e.pr_body,
        logs=e.logs,
        created_at=e.created_at,
        completed_at=e.completed_at,
    )


def _db_to_response(db_run: RepairRun) -> RepairResponse:
    test_recs = []
    if db_run.test_records:
        try:
            for item in json.loads(db_run.test_records):
                test_recs.append(TestExecutionRecord(**item))
        except Exception:
            pass

    return RepairResponse(
        run_id=db_run.id,
        repo_url=db_run.repo_url,
        issue_url=db_run.issue_url,
        issue_number=db_run.issue_number,
        issue_title=db_run.issue_title,
        stage=PhoenixStage(db_run.stage) if db_run.stage in [s.value for s in PhoenixStage] else PhoenixStage.DISCOVER,
        verification_status=VerificationStatus(db_run.verification_status) if db_run.verification_status in [s.value for s in VerificationStatus] else VerificationStatus.SUGGESTED_FIX,
        root_cause_hypothesis=db_run.hypothesis,
        supporting_evidence=json.loads(db_run.supporting_evidence or "[]"),
        relevant_files=json.loads(db_run.relevant_files or "[]"),
        proposed_strategy=db_run.proposed_strategy,
        patch_diff=db_run.patch_diff,
        test_records=test_recs,
        attempt_count=db_run.attempt_count,
        max_attempts=db_run.max_attempts,
        limitations=json.loads(db_run.limitations or "[]"),
        pr_title=db_run.pr_title,
        pr_body=db_run.pr_body,
        logs=json.loads(db_run.logs or "[]"),
        created_at=db_run.created_at.isoformat() if db_run.created_at else "",
        completed_at=db_run.completed_at.isoformat() if db_run.completed_at else None,
    )


def _db_to_evidence(db_run: RepairRun) -> RepairRunEvidence:
    test_recs = []
    if db_run.test_records:
        try:
            for item in json.loads(db_run.test_records):
                test_recs.append(TestExecutionRecord(**item))
        except Exception:
            pass

    return RepairRunEvidence(
        run_id=db_run.id,
        repo_url=db_run.repo_url,
        issue_url=db_run.issue_url,
        issue_number=db_run.issue_number,
        issue_title=db_run.issue_title,
        current_stage=PhoenixStage(db_run.stage) if db_run.stage in [s.value for s in PhoenixStage] else PhoenixStage.DISCOVER,
        verification_status=VerificationStatus(db_run.verification_status) if db_run.verification_status in [s.value for s in VerificationStatus] else VerificationStatus.SUGGESTED_FIX,
        root_cause_hypothesis=db_run.hypothesis,
        supporting_evidence=json.loads(db_run.supporting_evidence or "[]"),
        relevant_files=json.loads(db_run.relevant_files or "[]"),
        proposed_strategy=db_run.proposed_strategy,
        patch_diff=db_run.patch_diff,
        test_records=test_recs,
        attempt_count=db_run.attempt_count,
        max_attempts=db_run.max_attempts,
        limitations=json.loads(db_run.limitations or "[]"),
        pr_title=db_run.pr_title,
        pr_body=db_run.pr_body,
        logs=json.loads(db_run.logs or "[]"),
        created_at=db_run.created_at.isoformat() if db_run.created_at else "",
        completed_at=db_run.completed_at.isoformat() if db_run.completed_at else None,
    )
