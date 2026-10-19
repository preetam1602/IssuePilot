"""Auth and input checks that reject a request before it touches the database."""
import pytest

from app.config import settings

RAG_INGEST_BODY = dict(document_id="d", title="t", source="s", organization="o", document_type="pdf", year=2026)


@pytest.mark.parametrize("path", ["/admin/ingest-issues", "/admin/ingest-events", "/admin/build-features", "/admin/score"])
@pytest.mark.parametrize("headers", [{}, {"X-Admin-Key": "wrong"}])
def test_admin_requires_key(client, path, headers):
    assert client.post(path, headers=headers).status_code == 403


def test_admin_rejects_everyone_when_key_unset(client, monkeypatch):
    monkeypatch.setattr(settings, "admin_api_key", None)
    assert client.post("/admin/score", headers={"X-Admin-Key": ""}).status_code == 403


def test_rag_search_requires_user(client):
    assert client.post("/rag/search", json={"query": "x", "top_k": 1}).status_code == 401


def test_rag_ingest_requires_admin(client, tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "rag_documents_dir", str(tmp_path))
    (tmp_path / "doc.pdf").write_bytes(b"%PDF")
    assert client.post("/rag/ingest", json={**RAG_INGEST_BODY, "file_path": "doc.pdf"}).status_code == 403


@pytest.mark.parametrize("file_path", ["../outside.pdf", "../../etc/passwd", "C:/Windows/win.ini", "/etc/passwd", "missing.pdf"])
def test_rag_ingest_stays_inside_documents_dir(client, admin_headers, tmp_path, monkeypatch, file_path):
    docs = tmp_path / "docs"
    docs.mkdir()
    (tmp_path / "outside.pdf").write_bytes(b"%PDF")
    monkeypatch.setattr(settings, "rag_documents_dir", str(docs))
    resp = client.post("/rag/ingest", json={**RAG_INGEST_BODY, "file_path": file_path}, headers=admin_headers)
    assert resp.status_code == 400


def test_oauth_login_sets_state_cookie(client):
    resp = client.get("/auth/github", follow_redirects=False)
    assert resp.status_code == 307
    assert "state=" in resp.headers["location"]
    assert "issuepilot_oauth_state=" in resp.headers["set-cookie"]


@pytest.mark.parametrize("cookie", [None, "something-else"])
def test_oauth_callback_rejects_bad_state(client, cookie):
    if cookie:
        client.cookies.set("issuepilot_oauth_state", cookie)
    resp = client.get("/auth/callback", params={"code": "c", "state": "s"}, follow_redirects=False)
    assert resp.status_code == 400


@pytest.mark.parametrize("path", ["/recommend", "/profile"])
def test_user_routes_require_token(client, path):
    assert client.get(path).status_code == 401


def test_predict_requires_token(client):
    assert client.post("/predict", json={"issue_id": "00000000-0000-0000-0000-000000000000"}).status_code == 401


def test_bad_issue_id_is_422_not_500(client):
    assert client.get("/issues/not-a-uuid").status_code == 422


@pytest.mark.parametrize(
    "params",
    [{"sort": "nope"}, {"difficulty": "extreme"}, {"limit": 0}, {"limit": 1000}, {"offset": -1}],
)
def test_issue_list_validates_params(client, params):
    assert client.get("/issues", params=params).status_code == 422
