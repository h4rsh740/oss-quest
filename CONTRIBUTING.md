# Contributing to OSS Quest & PHOENIX

Thank you for your interest in contributing to **OSS Quest**! We welcome bug reports, feature suggestions, framework integrations, and pull requests.

## Development Setup

### 1. Clone & Set Up Backend
```bash
git clone https://github.com/bharatcode-community/oss-quest.git
cd oss-quest

# Python virtual environment (Python 3.10+)
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies and editable CLI
pip install -r backend/requirements.txt
pip install -e backend
```

### 2. Set Up Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Run Backend API Server
```bash
source .venv/bin/activate
uvicorn backend.app.main:app --reload --port 8000
```

## Running Tests
Run the test suite before submitting pull requests:
```bash
source .venv/bin/activate
PYTHONPATH=. pytest backend/tests -v
```

Run the built-in reproducible demo verification:
```bash
ossq demo
```

## Pull Request Guidelines
1. **Never bypass empirical verification**: Do not claim tests passed without executing them.
2. **Keep patches minimal and surgical**: Do not include unrelated reformatting.
3. **Follow security boundaries**: Never execute untrusted code in the main web server process.
4. **Scrub credentials**: Never commit API keys or environment secrets.
