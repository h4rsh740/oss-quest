import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Text, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from backend.app.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    owner = Column(String, nullable=False, index=True)
    name = Column(String, nullable=False, index=True)
    repo_url = Column(String, nullable=False, unique=True)
    default_branch = Column(String, default="main")
    language = Column(String, default="Python")
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    issues = relationship("Issue", back_populates="project", cascade="all, delete-orphan")
    runs = relationship("RepairRun", back_populates="project", cascade="all, delete-orphan")


class Issue(Base):
    __tablename__ = "issues"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id"), nullable=False, index=True)
    issue_number = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    body = Column(Text, nullable=True)
    state = Column(String, default="open")
    html_url = Column(String, nullable=False)
    labels = Column(Text, default="[]")  # JSON encoded list of labels
    
    # Explainable ranking metrics (0.0 to 1.0)
    score_relevance = Column(Float, default=0.5)
    score_testability = Column(Float, default=0.5)
    score_scope = Column(Float, default=0.5)
    score_setup = Column(Float, default=0.5)
    composite_rank = Column(Float, default=0.5)
    missing_info_notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=utc_now)

    project = relationship("Project", back_populates="issues")
    runs = relationship("RepairRun", back_populates="issue", cascade="all, delete-orphan")


class RepairRun(Base):
    __tablename__ = "repair_runs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id"), nullable=True)
    issue_id = Column(String, ForeignKey("issues.id"), nullable=True)
    repo_url = Column(String, nullable=False)
    issue_url = Column(String, nullable=False)
    issue_number = Column(Integer, default=0)
    issue_title = Column(String, default="")

    stage = Column(String, default="stage_1_discover")
    verification_status = Column(String, default="suggested_fix")

    hypothesis = Column(Text, nullable=True)
    supporting_evidence = Column(Text, default="[]")  # JSON
    relevant_files = Column(Text, default="[]")  # JSON
    proposed_strategy = Column(Text, nullable=True)
    patch_diff = Column(Text, nullable=True)
    
    # Test execution proof
    test_command = Column(String, nullable=True)
    exit_code = Column(Integer, nullable=True)
    stdout = Column(Text, nullable=True)
    stderr = Column(Text, nullable=True)
    test_records = Column(Text, default="[]")  # JSON encoded list of records

    attempt_count = Column(Integer, default=1)
    max_attempts = Column(Integer, default=3)
    limitations = Column(Text, default="[]")  # JSON
    logs = Column(Text, default="[]")  # JSON

    pr_title = Column(String, nullable=True)
    pr_body = Column(Text, nullable=True)

    created_at = Column(DateTime, default=utc_now)
    completed_at = Column(DateTime, nullable=True)

    project = relationship("Project", back_populates="runs")
    issue = relationship("Issue", back_populates="runs")
