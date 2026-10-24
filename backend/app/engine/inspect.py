import os
import re
import logging
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path

logger = logging.getLogger(__name__)


class RepositoryInspector:
    """
    Stage 2 Inspector: Scans repository structure, identifies test frameworks,
    and extracts targeted relevant context without bloating model tokens.
    """

    def __init__(self, workspace_path: str):
        self.workspace_path = Path(workspace_path).resolve()

    def inspect_structure(self) -> Dict[str, Any]:
        """Scans filesystem to determine project type, files, and test commands."""
        files = []
        try:
            for root, dirs, filenames in os.walk(self.workspace_path):
                # Prune common non-source directories
                dirs[:] = [d for d in dirs if d not in {".git", ".venv", "venv", "node_modules", "__pycache__", ".pytest_cache", "build", "dist"}]
                for f in filenames:
                    rel_path = os.path.relpath(os.path.join(root, f), self.workspace_path)
                    files.append(rel_path)
        except Exception as e:
            logger.error(f"Error scanning workspace {self.workspace_path}: {e}")

        test_framework, test_command = self._detect_test_framework(files)
        language = self._detect_language(files)

        return {
            "language": language,
            "test_framework": test_framework,
            "test_command": test_command,
            "file_count": len(files),
            "files": files[:150],  # Bound summary list
        }

    def _detect_language(self, files: List[str]) -> str:
        for f in files:
            if f.endswith(".py") or f in ["pyproject.toml", "setup.py", "requirements.txt"]:
                return "Python"
            if f.endswith((".ts", ".tsx", ".js", ".jsx")) or f == "package.json":
                return "TypeScript/JavaScript"
            if f.endswith(".go") or f == "go.mod":
                return "Go"
            if f.endswith(".rs") or f == "Cargo.toml":
                return "Rust"
        return "Unknown"

    def _detect_test_framework(self, files: List[str]) -> Tuple[str, str]:
        # Python detection
        if any("pytest" in f for f in files) or "conftest.py" in files or any(f.startswith("tests/") for f in files):
            return "pytest", "pytest"
        if any(f.endswith("_test.py") or f.startswith("test_") for f in files):
            return "unittest", "python3 -m unittest"
        
        # JS / TS detection
        if "package.json" in files:
            return "npm test", "npm test"

        # Go detection
        if any(f.endswith("_test.go") for f in files):
            return "go test", "go test ./..."

        return "unknown", "pytest"

    def find_relevant_files(self, issue_title: str, issue_body: str) -> List[Dict[str, str]]:
        """
        Heuristic keyword and filename matching to select candidate files
        related to the issue, keeping context small and precise.
        """
        structure = self.inspect_structure()
        all_files = structure.get("files", [])
        
        issue_text = f"{issue_title} {issue_body}".lower()
        scored_files = []

        # Find words and tokens in issue
        tokens = set(re.findall(r"[a-zA-Z0-9_]{3,}", issue_text))

        for f in all_files:
            score = 0
            f_lower = f.lower()
            f_name = os.path.basename(f_lower)
            stem = os.path.splitext(f_name)[0]

            # Direct filename / module mention
            if stem in tokens:
                score += 5
            if f_name in issue_text:
                score += 7

            # Source files prioritization over configs
            if f.endswith(".py") and not f.startswith("."):
                score += 1
            if "test" in f_lower:
                score += 2

            # Match individual tokens
            for token in tokens:
                if token in f_lower:
                    score += 1

            if score > 0:
                scored_files.append((score, f))

        scored_files.sort(key=lambda x: x[0], reverse=True)
        top_candidates = [f for _, f in scored_files[:5]]

        # If no specific match, pick first Python or source files
        if not top_candidates:
            top_candidates = [f for f in all_files if f.endswith(".py")][:3]

        results = []
        for f in top_candidates:
            abs_path = self.workspace_path / f
            reason = "Directly mentioned in issue or high lexical match with bug description."
            if "test" in f.lower():
                reason = "Test suite covering affected component."
            
            content_snippet = ""
            if abs_path.is_file():
                try:
                    content = abs_path.read_text(encoding="utf-8", errors="replace")
                    # Bound to first 120 lines to protect context window
                    lines = content.splitlines()[:120]
                    content_snippet = "\n".join(lines)
                except Exception:
                    content_snippet = "[Unreadable file]"

            results.append({
                "path": f,
                "reason": reason,
                "snippet": content_snippet,
            })

        return results
