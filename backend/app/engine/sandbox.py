import os
import shutil
import tempfile
import asyncio
import time
import logging
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path
from backend.app.config import settings
from backend.app.engine.state import TestExecutionRecord

logger = logging.getLogger(__name__)


class ExecutionSandbox:
    """
    Isolated, disposable execution worker for untrusted repository code.
    Enforces time limits, clean environment scrubbing, and directory boundaries.
    """

    def __init__(
        self,
        source_dir: Path,
        timeout_seconds: Optional[int] = None,
    ):
        self.source_dir = Path(source_dir).resolve()
        self.timeout_seconds = timeout_seconds or settings.sandbox_timeout_seconds
        self.sandbox_dir: Optional[Path] = None

    def __enter__(self):
        self.create_sandbox()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.cleanup()

    def create_sandbox(self) -> Path:
        """Copies source files into a disposable temporary directory."""
        temp_dir = tempfile.mkdtemp(prefix="ossquest_sandbox_")
        self.sandbox_dir = Path(temp_dir).resolve()

        # Copy files excluding sensitive files and caches
        def ignore_patterns(dir_path, names):
            ignored = set()
            for name in names:
                if name in {".git", ".env", ".env.local", ".venv", "venv", "__pycache__", "node_modules", ".pytest_cache"}:
                    ignored.add(name)
                elif name.endswith((".key", ".pem", ".pfx", ".secret")):
                    ignored.add(name)
            return ignored

        shutil.copytree(self.source_dir, self.sandbox_dir, dirs_exist_ok=True, ignore=ignore_patterns)
        logger.info(f"Initialized isolated sandbox at {self.sandbox_dir}")
        return self.sandbox_dir

    def cleanup(self):
        """Wipes temporary sandbox files completely."""
        if self.sandbox_dir and self.sandbox_dir.exists():
            try:
                shutil.rmtree(self.sandbox_dir)
                logger.info(f"Destroyed sandbox at {self.sandbox_dir}")
            except Exception as e:
                logger.error(f"Failed to remove sandbox {self.sandbox_dir}: {e}")
            finally:
                self.sandbox_dir = None

    def _get_sanitized_environment(self) -> Dict[str, str]:
        """
        Strips all sensitive tokens, cloud keys, and database URLs.
        Provides only bare-minimum system PATH and Python environment.
        """
        env = {
            "PATH": os.environ.get("PATH", "/usr/local/bin:/usr/bin:/bin"),
            "HOME": str(self.sandbox_dir or "/tmp"),
            "LANG": "en_US.UTF-8",
            "LC_ALL": "en_US.UTF-8",
            "PYTHONUNBUFFERED": "1",
            "PYTHONDONTWRITEBYTECODE": "1",
        }

        # Propagate virtual environment PATH if active
        venv = os.environ.get("VIRTUAL_ENV")
        if venv:
            env["VIRTUAL_ENV"] = venv
            env["PATH"] = f"{venv}/bin:{env['PATH']}"

        # If network is explicitly disabled, set proxy blockers
        if not settings.enable_network_in_sandbox:
            env["http_proxy"] = "http://127.0.0.1:0"
            env["https_proxy"] = "http://127.0.0.1:0"

        return env

    async def run_command(self, command: str, phase: str = "test") -> TestExecutionRecord:
        """
        Executes a shell command in the disposable sandbox.
        Captures exit code, stdout, stderr, and run duration under a strict timeout.
        """
        if not self.sandbox_dir or not self.sandbox_dir.exists():
            raise RuntimeError("Sandbox not initialized.")

        clean_env = self._get_sanitized_environment()
        start_time = time.monotonic()

        logger.info(f"Executing in sandbox [{phase}]: {command}")

        try:
            process = await asyncio.create_subprocess_shell(
                command,
                cwd=str(self.sandbox_dir),
                env=clean_env,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )

            try:
                stdout_bytes, stderr_bytes = await asyncio.wait_for(
                    process.communicate(),
                    timeout=float(self.timeout_seconds),
                )
                duration = time.monotonic() - start_time
                exit_code = process.returncode or 0
                stdout = stdout_bytes.decode("utf-8", errors="replace")
                stderr = stderr_bytes.decode("utf-8", errors="replace")

            except asyncio.TimeoutError:
                duration = time.monotonic() - start_time
                try:
                    process.kill()
                    await process.wait()
                except Exception:
                    pass
                exit_code = 124  # Standard timeout exit code
                stdout = ""
                stderr = f"Command timed out after {self.timeout_seconds} seconds."

        except Exception as e:
            duration = time.monotonic() - start_time
            exit_code = 1
            stdout = ""
            stderr = f"Subprocess launch failed: {str(e)}"

        return TestExecutionRecord(
            command=command,
            exit_code=exit_code,
            stdout=stdout,
            stderr=stderr,
            duration_seconds=round(duration, 3),
            passed=(exit_code == 0),
            phase=phase,
        )
