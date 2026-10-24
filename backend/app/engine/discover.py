import re
import logging
from typing import Dict, Any, List, Optional, Tuple
import httpx
from backend.app.config import settings
from backend.app.models.schemas import IssueItem, IssueRanking

logger = logging.getLogger(__name__)


def parse_github_url(url: str) -> Tuple[Optional[str], Optional[str], Optional[int]]:
    """
    Parses a GitHub URL into (owner, repo, issue_number).
    Examples:
      - https://github.com/psf/requests/issues/1234 -> ("psf", "requests", 1234)
      - https://github.com/psf/requests -> ("psf", "requests", None)
      - requests -> (None, "requests", None)
    """
    url = url.strip()
    issue_match = re.search(r"github\.com/([^/]+)/([^/]+)/issues/(\d+)", url)
    if issue_match:
        return issue_match.group(1), issue_match.group(2), int(issue_match.group(3))

    repo_match = re.search(r"github\.com/([^/]+)/([^/]+)", url)
    if repo_match:
        repo_name = repo_match.group(2).rstrip("/").replace(".git", "")
        return repo_match.group(1), repo_name, None

    return None, None, None


class GitHubDiscoverer:
    """
    Ingests GitHub repositories and issues with explainable ranking.
    Respects rate limits and provides deterministic fallbacks when offline.
    """

    def __init__(self, token: Optional[str] = None):
        self.token = token or settings.github_token

    def _get_headers(self) -> Dict[str, str]:
        headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "OSS-Quest-Phoenix-Agent",
        }
        if self.token and self.token != "your_github_personal_access_token_here":
            headers["Authorization"] = f"token {self.token}"
        return headers

    async def fetch_repository_info(self, owner: str, repo: str) -> Dict[str, Any]:
        """Fetch repo metadata from GitHub API or generate fallback."""
        url = f"https://api.github.com/repos/{owner}/{repo}"
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.get(url, headers=self._get_headers())
                if res.status_code == 200:
                    return res.json()
        except Exception as e:
            logger.warning(f"Failed to fetch GitHub repo {owner}/{repo}: {e}")

        # Fallback representation
        return {
            "owner": {"login": owner},
            "name": repo,
            "default_branch": "main",
            "language": "Python",
            "description": f"Repository {owner}/{repo} (cached or offline mode)",
            "html_url": f"https://github.com/{owner}/{repo}",
        }

    async def fetch_issue(self, owner: str, repo: str, issue_number: int) -> Dict[str, Any]:
        """Fetch a specific issue by number."""
        url = f"https://api.github.com/repos/{owner}/{repo}/issues/{issue_number}"
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.get(url, headers=self._get_headers())
                if res.status_code == 200:
                    return res.json()
        except Exception as e:
            logger.warning(f"Failed to fetch issue #{issue_number}: {e}")

        return {
            "number": issue_number,
            "title": f"Issue #{issue_number} in {owner}/{repo}",
            "body": "Unable to fetch live GitHub body. Please verify network access or configure GITHUB_TOKEN.",
            "state": "open",
            "html_url": f"https://github.com/{owner}/{repo}/issues/{issue_number}",
            "labels": [{"name": "bug"}],
        }

    async def list_candidate_issues(self, owner: str, repo: str, limit: int = 10) -> List[Dict[str, Any]]:
        """List open issues for the repository."""
        url = f"https://api.github.com/repos/{owner}/{repo}/issues?state=open&per_page={limit}"
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.get(url, headers=self._get_headers())
                if res.status_code == 200:
                    return [item for item in res.json() if "pull_request" not in item]
        except Exception as e:
            logger.warning(f"Failed to list issues for {owner}/{repo}: {e}")

        return []

    def rank_issue(self, issue_data: Dict[str, Any]) -> IssueRanking:
        """
        Explainable heuristic scoring (0.0 - 1.0) based on:
        - Scope: Is it a surgical, single-concern bug?
        - Testability: Are there mentions of pytest, reproduction steps, or expected vs actual output?
        - Relevance: Presence of bug/defect labels.
        - Setup Complexity: Absence of external DB/cloud dependencies.
        """
        title = (issue_data.get("title") or "").lower()
        body = (issue_data.get("body") or "").lower()
        labels = [l.get("name", "").lower() if isinstance(l, dict) else str(l).lower() for l in issue_data.get("labels", [])]

        missing_info = []

        # 1. Testability score
        testability = 0.4
        repro_keywords = ["steps to reproduce", "reproduction", "reproduce", "expected", "actual", "traceback", "assertionerror", "pytest", "test case"]
        matches = [kw for kw in repro_keywords if kw in body or kw in title]
        if matches:
            testability = min(1.0, 0.4 + len(matches) * 0.15)
        else:
            missing_info.append("No explicit reproduction steps or assertion tracebacks found in issue description.")

        # 2. Relevance score
        relevance = 0.5
        if any("bug" in l or "fix" in l or "defect" in l for l in labels) or "fix" in title or "bug" in title:
            relevance = 0.9
        elif any("enhancement" in l or "feature" in l for l in labels):
            relevance = 0.4
            missing_info.append("Marked as feature/enhancement rather than bug fix.")

        # 3. Scope score
        scope = 0.7
        if len(body) > 4000 or "refactor" in title or "architecture" in title or "rewrite" in title:
            scope = 0.3
            missing_info.append("Large scope or refactoring indicated, which increases risk.")
        elif any(k in title for k in ["typo", "validation", "regex", "boundary", "null", "edge case", "delimiter"]):
            scope = 0.95

        # 4. Setup complexity
        setup_complexity = 0.8
        if any(w in body for w in ["docker", "kubernetes", "postgres", "aws", "s3", "gpu", "cuda"]):
            setup_complexity = 0.3
            missing_info.append("Requires complex external infrastructure (DB/Cloud/GPU).")

        # Composite weighted score
        composite = round(0.35 * testability + 0.30 * scope + 0.20 * relevance + 0.15 * setup_complexity, 2)

        return IssueRanking(
            relevance=round(relevance, 2),
            testability=round(testability, 2),
            scope=round(scope, 2),
            setup_complexity=round(setup_complexity, 2),
            composite=composite,
            missing_info_notes=missing_info,
        )
