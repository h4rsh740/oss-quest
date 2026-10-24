import os
import pytest
from pathlib import Path
from backend.app.engine.sandbox import ExecutionSandbox


@pytest.mark.asyncio
async def test_sandbox_environment_scrubbing(tmp_path):
    # Set fake secret in host environment
    os.environ["BHARATCODE_API_KEY"] = "super_secret_test_key_12345"
    os.environ["GITHUB_TOKEN"] = "fake_github_token_xyz"

    sandbox = ExecutionSandbox(source_dir=tmp_path)
    with sandbox:
        # Check that environment does NOT leak BHARATCODE_API_KEY or GITHUB_TOKEN
        rec = await sandbox.run_command("python3 -c \"import os; print('KEY_IN_ENV:', 'BHARATCODE_API_KEY' in os.environ)\"")
        assert rec.exit_code == 0
        assert "KEY_IN_ENV: False" in rec.stdout


@pytest.mark.asyncio
async def test_sandbox_timeout_enforcement(tmp_path):
    # Enforce 2 second timeout
    sandbox = ExecutionSandbox(source_dir=tmp_path, timeout_seconds=2)
    with sandbox:
        rec = await sandbox.run_command("python3 -c \"import time; time.sleep(5)\"")
        assert rec.exit_code == 124
        assert rec.passed is False
        assert "timed out" in rec.stderr


@pytest.mark.asyncio
async def test_sandbox_exit_code_capture(tmp_path):
    sandbox = ExecutionSandbox(source_dir=tmp_path)
    with sandbox:
        rec_pass = await sandbox.run_command("python3 -c \"exit(0)\"")
        assert rec_pass.exit_code == 0
        assert rec_pass.passed is True

        rec_fail = await sandbox.run_command("python3 -c \"exit(42)\"")
        assert rec_fail.exit_code == 42
        assert rec_fail.passed is False
