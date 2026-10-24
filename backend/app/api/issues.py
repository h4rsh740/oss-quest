import uuid
from typing import List
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.database import get_db
from backend.app.models.db_models import Project, Issue
from backend.app.models.schemas import AnalyzeRepoRequest, AnalyzeRepoResponse, IssueItem, IssueRanking
from backend.app.engine.discover import GitHubDiscoverer, parse_github_url
from backend.app.engine.inspect import RepositoryInspector

router = APIRouter(prefix="/issues", tags=["Issues"])
discoverer = GitHubDiscoverer()


@router.post("/analyze", response_model=AnalyzeRepoResponse)
async def analyze_repository(req: AnalyzeRepoRequest, db: AsyncSession = Depends(get_db)):
    url = req.repo_url.strip()
    owner, repo, issue_num = parse_github_url(url)

    # Special handling for local demo fixture
    if "demo" in url.lower() or not owner or not repo:
        owner = "bharatcode-community"
        repo = "fast-slugify"
        candidate_issues = [
            IssueItem(
                id="demo-issue-104",
                number=104,
                title="slugify() leaves trailing hyphens and duplicates hyphens on edge cases",
                body="When calling slugify('trailing hyphen -'), the returned string is 'trailing-hyphen-'. Expected 'trailing-hyphen'. Also sequential hyphens are not properly collapsed.",
                state="open",
                html_url="https://github.com/bharatcode-community/fast-slugify/issues/104",
                labels=["bug", "reproducible", "good-first-issue"],
                ranking=IssueRanking(
                    relevance=0.95,
                    testability=0.98,
                    scope=0.95,
                    setup_complexity=0.90,
                    composite=0.95,
                    missing_info_notes=[],
                ),
                is_demo=True,
            ),
            IssueItem(
                id="demo-issue-108",
                number=108,
                title="Add support for Cyrillic and Devanagari transliteration",
                body="Feature request to support hindi and russian characters in slug transliteration.",
                state="open",
                html_url="https://github.com/bharatcode-community/fast-slugify/issues/108",
                labels=["enhancement"],
                ranking=IssueRanking(
                    relevance=0.40,
                    testability=0.45,
                    scope=0.40,
                    setup_complexity=0.70,
                    composite=0.45,
                    missing_info_notes=["Feature request rather than bug fix.", "Requires external transliteration table."],
                ),
                is_demo=True,
            ),
        ]
        return AnalyzeRepoResponse(
            repo_url=f"https://github.com/{owner}/{repo}",
            owner=owner,
            name=repo,
            default_branch="main",
            detected_language="Python",
            test_framework="pytest",
            candidate_issues=candidate_issues,
            architecture_summary="Fast URL slug generation library with pytest test suite and zero external runtime dependencies.",
        )

    # Live GitHub inspection
    repo_info = await discoverer.fetch_repository_info(owner, repo)
    raw_issues = await discoverer.list_candidate_issues(owner, repo, limit=10)

    candidate_items: List[IssueItem] = []
    for item in raw_issues:
        ranking = discoverer.rank_issue(item)
        labels = [l.get("name") if isinstance(l, dict) else str(l) for l in item.get("labels", [])]
        candidate_items.append(
            IssueItem(
                id=str(item.get("id", uuid.uuid4())),
                number=item.get("number", 0),
                title=item.get("title", ""),
                body=item.get("body", ""),
                state=item.get("state", "open"),
                html_url=item.get("html_url", ""),
                labels=labels,
                ranking=ranking,
                is_demo=False,
            )
        )

    # Sort candidate issues by composite rank
    candidate_items.sort(key=lambda x: x.ranking.composite, reverse=True)

    return AnalyzeRepoResponse(
        repo_url=repo_info.get("html_url", url),
        owner=owner,
        name=repo,
        default_branch=repo_info.get("default_branch", "main"),
        detected_language=repo_info.get("language") or "Python",
        test_framework="pytest",
        candidate_issues=candidate_items,
        architecture_summary=repo_info.get("description") or f"GitHub repository {owner}/{repo}",
    )
