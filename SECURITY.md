# Security Policy

## Reporting Security Issues

Security is paramount when running automated developer recovery engines on arbitrary repositories. If you discover a vulnerability or security boundary bypass in **OSS Quest** or the **PHOENIX Recovery Engine**, please report it responsibly.

**Do NOT report security vulnerabilities via public GitHub issues.**

Please send details directly to our security team or email `security@bharatcode.ai`. Include:
- A description of the issue and potential impact
- Steps to reproduce or proof-of-concept
- Any affected components or dependencies

## Security Design & Containment

1. **Untrusted Code Execution**:
   - Arbitrary repository tests are **never** executed inside the web server or primary API process.
   - All executions occur inside disposable temporary directories (`/tmp/ossquest_sandbox_*`) that are destroyed after verification.
2. **Environment Sanitization**:
   - Subprocesses run with stripped environments that explicitly omit `BHARATCODE_API_KEY`, GitHub tokens, and database credentials.
3. **Path Traversal Guards**:
   - Generated patches are validated prior to application. Relative path traversal (`..`), null bytes, and writes outside the target workspace are rejected.
4. **Timeouts & Resource Quotas**:
   - All subprocess executions enforce timeouts (default 60 seconds) and terminate unresponsive child processes.
