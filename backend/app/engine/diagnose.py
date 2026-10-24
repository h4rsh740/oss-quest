import json
import logging
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from backend.app.engine.llm import BharatCodeClient

logger = logging.getLogger(__name__)


class DiagnosisResult(BaseModel):
    root_cause_hypothesis: str
    supporting_evidence: List[str]
    relevant_files: List[str]
    proposed_strategy: str
    verification_plan: str
    uncertainties: List[str]


class Diagnoser:
    """
    Stage 3: Formulates a structured root-cause hypothesis and repair plan
    using BharatCode AI model.
    """

    def __init__(self, llm_client: BharatCodeClient):
        self.llm = llm_client

    async def diagnose_issue(
        self,
        issue_title: str,
        issue_body: str,
        relevant_files: List[Dict[str, str]],
        detected_test_command: str = "pytest",
    ) -> DiagnosisResult:
        files_context = ""
        for item in relevant_files:
            files_context += f"\n--- File: {item['path']} ---\n{item['snippet']}\n"

        prompt = f"""
You are the PHOENIX Autonomous Recovery Engine on OSS Quest.
Analyze this GitHub issue and repository context to diagnose the root cause.

[ISSUE TITLE]
{issue_title}

[ISSUE DESCRIPTION]
{issue_body}

[RELEVANT REPOSITORY FILES]
{files_context}

[DETECTED TEST COMMAND]
{detected_test_command}

Return a valid JSON object strictly matching this schema:
{{
  "root_cause_hypothesis": "Clear explanation of why the bug occurs in the code",
  "supporting_evidence": ["Evidence point 1", "Evidence point 2"],
  "relevant_files": ["relative/path/to/file.py"],
  "proposed_strategy": "Surgical, minimal strategy to fix the bug without side-effects",
  "verification_plan": "Specific test command and assertions to verify the fix",
  "uncertainties": ["Any edge cases or known risks"]
}}
"""
        messages = [
            {"role": "system", "content": "You are PHOENIX, an elite software recovery agent. Produce only valid JSON."},
            {"role": "user", "content": prompt},
        ]

        raw_response = await self.llm.chat_completion(
            messages=messages,
            temperature=0.1,
            response_format={"type": "json_object"},
        )

        try:
            # Clean possible markdown fence
            cleaned = raw_response.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            data = json.loads(cleaned.strip())
            return DiagnosisResult(**data)
        except Exception as e:
            logger.warning(f"Failed to parse diagnosis JSON: {e}. Raw content: {raw_response[:200]}")
            return DiagnosisResult(
                root_cause_hypothesis="Issue parsing error or unexpected code structure.",
                supporting_evidence=[f"Issue: {issue_title}"],
                relevant_files=[item["path"] for item in relevant_files[:1]] or ["main.py"],
                proposed_strategy="Inspect affected logic and apply unit test regression checks.",
                verification_plan=f"Run {detected_test_command}",
                uncertainties=["Diagnosis derived via fallback parser."],
            )
