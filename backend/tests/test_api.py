import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app


@pytest.mark.asyncio
async def test_health_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/v1/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "healthy"
        assert "bharatcode_model" in data


@pytest.mark.asyncio
async def test_demo_benchmark():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/v1/demo/benchmark")
        assert res.status_code == 200
        data = res.json()
        assert "measured_metrics" in data
        assert data["measured_metrics"]["verified_fix_rate"] == "91.7%"


@pytest.mark.asyncio
async def test_issue_analyze_demo():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/v1/issues/analyze", json={"repo_url": "demo"})
        assert res.status_code == 200
        data = res.json()
        assert len(data["candidate_issues"]) > 0
        first_issue = data["candidate_issues"][0]
        assert first_issue["ranking"]["composite"] > 0.8
