import sys
import httpx
import json

BASE_URL = "http://127.0.0.1:8000"

def run_tests():
    print(f"Connecting to {BASE_URL}...")
    client = httpx.Client(base_url=BASE_URL, timeout=30.0)

    # 1. Health
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("[OK] Health check OK:", res.json())

    # 2. Register
    username = f"liveuser_{sys.version_info.major}"
    email = f"{username}@example.com"
    reg_res = client.post("/api/auth/register", json={
        "username": username,
        "email": email,
        "password": "livepassword123"
    })
    if reg_res.status_code == 400 and "already registered" in reg_res.text:
        # Login instead
        login_res = client.post("/api/auth/login", json={
            "username": username,
            "password": "livepassword123"
        })
        token = login_res.json()["access_token"]
        print("[OK] Logged in existing user")
    else:
        assert reg_res.status_code == 201, f"Registration failed: {reg_res.text}"
        token = reg_res.json()["access_token"]
        print("[OK] Registered user:", username)

    headers = {"Authorization": f"Bearer {token}"}

    # 3. Auth Me
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200, f"Me endpoint failed: {me_res.text}"
    print("[OK] Auth /me OK:", me_res.json()["username"])

    # 4. Upload Document
    doc_content = b"Vishnu AI is a full-stack conversational AI platform built with FastAPI and React. It supports RAG and streaming."
    files = {"file": ("vishnu_guide.txt", doc_content, "text/plain")}
    upload_res = client.post("/api/documents/upload", files=files, headers=headers)
    assert upload_res.status_code == 201, f"Upload failed: {upload_res.text}"
    doc_id = upload_res.json()["document"]["id"]
    print("[OK] Document uploaded & indexed into RAG. ID:", doc_id)

    # 5. List Documents
    docs_res = client.get("/api/documents", headers=headers)
    assert docs_res.status_code == 200
    assert any(d["id"] == doc_id for d in docs_res.json())
    print("[OK] Listed documents:", len(docs_res.json()))

    # 6. Create Conversation
    conv_res = client.post("/api/conversations", json={"title": "Live Architecture Chat"}, headers=headers)
    assert conv_res.status_code == 201
    conv_id = conv_res.json()["id"]
    print("[OK] Created conversation:", conv_id)

    # 7. Test Chat Stream (SSE)
    print("Testing SSE streaming /api/chat...")
    with client.stream("POST", "/api/chat", json={
        "conversation_id": conv_id,
        "message": "Explain what Vishnu AI is based on uploaded documents.",
        "use_rag": True
    }, headers=headers) as stream_res:
        assert stream_res.status_code == 200
        collected_chunks = []
        for line in stream_res.iter_lines():
            if line.startswith("data: "):
                data = json.loads(line[6:])
                if data.get("content"):
                    collected_chunks.append(data["content"])
                if data.get("done"):
                    print("[OK] Received done event. Message ID:", data.get("message_id"))
                    break
        response_text = "".join(collected_chunks)
        print("[OK] Streamed response received (length:", len(response_text), ")")
        print("Preview:", response_text[:120].replace("\n", " "), "...")

    # 8. Check Messages in DB
    msgs_res = client.get(f"/api/conversations/{conv_id}/messages", headers=headers)
    assert msgs_res.status_code == 200
    messages = msgs_res.json()
    assert len(messages) >= 2, f"Expected user and assistant messages, got: {len(messages)}"
    print(f"[OK] Messages persisted in database: {len(messages)} messages (roles: {[m['role'] for m in messages]})")

    # 9. Clean up document
    del_doc = client.delete(f"/api/documents/{doc_id}", headers=headers)
    assert del_doc.status_code == 200
    print("[OK] Deleted test document and vectors")

    print("\n🎉 ALL LIVE END-TO-END VERIFICATION CHECKS PASSED!")

if __name__ == "__main__":
    run_tests()
