import io

def get_auth_token(client, username="alice", email="alice@test.com"):
    res = client.post("/api/auth/register", json={
        "username": username,
        "email": email,
        "password": "password123"
    })
    return res.json()["access_token"]

def test_conversation_crud(client):
    token = get_auth_token(client, "chatuser", "chatuser@test.com")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create conversation
    create_res = client.post("/api/conversations", json={"title": "Test Chat"}, headers=headers)
    assert create_res.status_code == 201
    conv = create_res.json()
    assert conv["title"] == "Test Chat"
    conv_id = conv["id"]

    # 2. List conversations
    list_res = client.get("/api/conversations", headers=headers)
    assert list_res.status_code == 200
    assert any(c["id"] == conv_id for c in list_res.json())

    # 3. Rename conversation
    patch_res = client.patch(f"/api/conversations/{conv_id}", json={"title": "Renamed Chat"}, headers=headers)
    assert patch_res.status_code == 200
    assert patch_res.json()["title"] == "Renamed Chat"

    # 4. Get conversation detail
    detail_res = client.get(f"/api/conversations/{conv_id}", headers=headers)
    assert detail_res.status_code == 200
    assert detail_res.json()["title"] == "Renamed Chat"

    # 5. Delete conversation
    del_res = client.delete(f"/api/conversations/{conv_id}", headers=headers)
    assert del_res.status_code == 200

    # Verify deleted
    get_res = client.get(f"/api/conversations/{conv_id}", headers=headers)
    assert get_res.status_code == 404

def test_document_upload_and_list(client):
    token = get_auth_token(client, "docuser", "docuser@test.com")
    headers = {"Authorization": f"Bearer {token}"}

    # Upload test txt file
    file_content = b"Artificial intelligence is transforming every industry. Machine learning enables computers to learn from data."
    files = {"file": ("test_ai.txt", io.BytesIO(file_content), "text/plain")}

    upload_res = client.post("/api/documents/upload", files=files, headers=headers)
    assert upload_res.status_code == 201
    doc_data = upload_res.json()["document"]
    assert doc_data["filename"] == "test_ai.txt"
    assert doc_data["chunk_count"] >= 1
    doc_id = doc_data["id"]

    # List documents
    docs_res = client.get("/api/documents", headers=headers)
    assert docs_res.status_code == 200
    assert any(d["id"] == doc_id for d in docs_res.json())

    # Delete document
    del_doc = client.delete(f"/api/documents/{doc_id}", headers=headers)
    assert del_doc.status_code == 200
