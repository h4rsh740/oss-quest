import pytest
from pathlib import Path
from backend.app.engine.patcher import Patcher, PatchValidationError
from backend.app.engine.llm import BharatCodeClient


def test_path_traversal_detection(tmp_path):
    patcher = Patcher(BharatCodeClient())
    malicious_diff = """--- a/../../etc/passwd
+++ b/../../etc/passwd
@@ -1,1 +1,1 @@
-root:x:0:0
+pwned:x:0:0
"""
    with pytest.raises(PatchValidationError) as excinfo:
        patcher.validate_patch(malicious_diff, tmp_path)
    assert "Path traversal" in str(excinfo.value)


def test_null_byte_rejection(tmp_path):
    patcher = Patcher(BharatCodeClient())
    malicious_diff = """--- a/file.py\0.evil
+++ b/file.py\0.evil
@@ -1,1 +1,1 @@
-pass
+fail
"""
    with pytest.raises(PatchValidationError) as excinfo:
        patcher.validate_patch(malicious_diff, tmp_path)
    assert "Null byte detected" in str(excinfo.value)


def test_empty_patch_rejection(tmp_path):
    patcher = Patcher(BharatCodeClient())
    with pytest.raises(PatchValidationError):
        patcher.validate_patch("", tmp_path)


def test_patch_application_safe(tmp_path):
    test_file = tmp_path / "hello.py"
    test_file.write_text("def hello():\n    return 'old'\n")

    valid_diff = f"""--- a/hello.py
+++ b/hello.py
@@ -1,2 +1,2 @@
 def hello():
-    return 'old'
+    return 'new'
"""
    patcher = Patcher(BharatCodeClient())
    success = patcher.apply_patch(valid_diff, tmp_path)
    assert success is True
    assert "return 'new'" in test_file.read_text()
