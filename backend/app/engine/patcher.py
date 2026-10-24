import os
import re
import shutil
import logging
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path
from backend.app.engine.llm import BharatCodeClient
from backend.app.engine.diagnose import DiagnosisResult

logger = logging.getLogger(__name__)


class PatchValidationError(Exception):
    pass


class Patcher:
    """
    Stage 4: Generates, validates, and applies unified diffs with strict security guards.
    """

    def __init__(self, llm_client: BharatCodeClient):
        self.llm = llm_client

    async def generate_patch(
        self,
        issue_title: str,
        diagnosis: DiagnosisResult,
        file_contents: Dict[str, str],
        failure_feedback: Optional[str] = None,
    ) -> str:
        files_section = ""
        for path, code in file_contents.items():
            files_section += f"\n--- File: {path} ---\n{code}\n"

        retry_section = ""
        if failure_feedback:
            retry_section = f"\n[PREVIOUS TEST FAILURE FEEDBACK - FIX THIS ERROR]\n{failure_feedback}\n"

        prompt = f"""
You are the PHOENIX Autonomous Software Recovery Engine.
Generate a minimal, surgical unified diff (patch) to fix the following issue.

[ISSUE]
{issue_title}

[DIAGNOSIS & ROOT CAUSE]
{diagnosis.root_cause_hypothesis}

[PROPOSED STRATEGY]
{diagnosis.proposed_strategy}

[EXISTING CODE]
{files_section}
{retry_section}

STRICT REQUIREMENTS:
1. Output ONLY a valid standard unified diff starting with '--- a/' and '+++ b/'.
2. Do not wrap with markdown backticks (no ```diff).
3. Do not include extraneous conversational text.
4. Keep the patch minimal and surgical — do not reformat unrelated code.
"""
        messages = [
            {"role": "system", "content": "You are a patch synthesis engine. Output standard unified diff only."},
            {"role": "user", "content": prompt},
        ]

        raw = await self.llm.chat_completion(messages=messages, temperature=0.1)
        
        # Clean diff output
        cleaned = raw.strip()
        if cleaned.startswith("```diff"):
            cleaned = cleaned[7:]
        elif cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        
        return cleaned.strip() + "\n"

    def validate_patch(self, patch_diff: str, workspace_root: Path) -> List[str]:
        """
        Validates unified diff against path traversal, forbidden files, and structure.
        Returns list of modified relative file paths.
        Raises PatchValidationError if invalid.
        """
        if not patch_diff or not patch_diff.strip():
            raise PatchValidationError("Patch is empty.")

        modified_files = []
        lines = patch_diff.splitlines()

        for line in lines:
            if line.startswith("--- ") or line.startswith("+++ "):
                parts = line.split(maxsplit=1)
                if len(parts) < 2:
                    continue
                raw_path = parts[1].strip()
                # Strip git prefixes a/ and b/
                clean_path = re.sub(r"^[ab]/", "", raw_path)

                # Path traversal validation
                if ".." in clean_path or clean_path.startswith("/") or clean_path.startswith("\\"):
                    raise PatchValidationError(f"Path traversal detected in patch file path: {clean_path}")

                if "\0" in clean_path:
                    raise PatchValidationError("Null byte detected in file path.")

                # Check forbidden file names
                forbidden_patterns = [".git/", ".env", "/etc/", ".ssh/"]
                if any(p in clean_path for p in forbidden_patterns):
                    raise PatchValidationError(f"Forbidden destination in patch: {clean_path}")

                target_file = (workspace_root / clean_path).resolve()
                try:
                    target_file.relative_to(workspace_root.resolve())
                except ValueError:
                    raise PatchValidationError(f"Patch path {clean_path} escapes workspace boundary {workspace_root}")

                if clean_path not in modified_files and clean_path != "/dev/null":
                    modified_files.append(clean_path)

        if not modified_files:
            raise PatchValidationError("No valid modified files found in patch diff header.")

        return modified_files

    def apply_patch(self, patch_diff: str, target_dir: Path) -> bool:
        """
        Applies unified diff cleanly to files in target_dir.
        Tries standard patch command first, with Python fallback parser.
        """
        self.validate_patch(patch_diff, target_dir)

        # 1. Try standard patch tool if available
        import subprocess
        try:
            res = subprocess.run(
                ["patch", "-p1", "--forward", "--batch"],
                input=patch_diff.encode("utf-8"),
                cwd=str(target_dir),
                capture_output=True,
                timeout=10,
            )
            if res.returncode == 0:
                logger.info(f"Patch successfully applied using patch tool in {target_dir}")
                return True
            else:
                logger.warning(f"Standard patch tool failed (exit {res.returncode}): {res.stderr.decode('utf-8', errors='replace')}. Falling back to Python diff applicator.")
        except Exception as e:
            logger.info(f"Standard patch tool not available or error: {e}. Using Python applicator.")

        # 2. Python fallback diff applicator
        hunks_by_file: Dict[str, List[Dict[str, Any]]] = {}
        current_file: Optional[str] = None
        current_hunk: Optional[Dict[str, Any]] = None

        for line in patch_diff.splitlines():
            if line.startswith("--- "):
                continue
            if line.startswith("+++ "):
                raw_path = line.split(maxsplit=1)[1].strip()
                current_file = re.sub(r"^[ab]/", "", raw_path)
                hunks_by_file[current_file] = []
                current_hunk = None
                continue

            if line.startswith("@@ "):
                m = re.match(r"@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@", line)
                if m and current_file:
                    old_start = int(m.group(1))
                    current_hunk = {
                        "old_start": old_start,
                        "lines": [],
                    }
                    hunks_by_file[current_file].append(current_hunk)
                continue

            if current_hunk is not None and current_file:
                current_hunk["lines"].append(line)

        for rel_path, hunks in hunks_by_file.items():
            file_path = (target_dir / rel_path).resolve()
            if not file_path.is_file():
                logger.error(f"Cannot apply patch: target file {file_path} does not exist.")
                return False

            original_content = file_path.read_text(encoding="utf-8")
            orig_lines = original_content.splitlines()

            modified_lines = list(orig_lines)
            for hunk in hunks:
                # Find matching sequence
                target_substr = "\n".join([l[1:] for l in hunk["lines"] if l.startswith("-") or l.startswith(" ")])
                replacement_substr = "\n".join([l[1:] for l in hunk["lines"] if l.startswith("+") or l.startswith(" ")])

                joined = "\n".join(modified_lines)
                if target_substr in joined:
                    joined = joined.replace(target_substr, replacement_substr, 1)
                    modified_lines = joined.splitlines()
                else:
                    # Target single line replacement if context differs
                    del_lines = [l[1:] for l in hunk["lines"] if l.startswith("-")]
                    add_lines = [l[1:] for l in hunk["lines"] if l.startswith("+")]
                    if len(del_lines) == 1 and del_lines[0] in joined:
                        joined = joined.replace(del_lines[0], "\n".join(add_lines), 1)
                        modified_lines = joined.splitlines()
                    else:
                        idx = max(0, hunk["old_start"] - 1)
                        del_count = sum(1 for l in hunk["lines"] if l.startswith("-"))
                        if idx < len(modified_lines):
                            modified_lines[idx : idx + del_count] = add_lines

            file_path.write_text("\n".join(modified_lines) + "\n", encoding="utf-8")

        return True
