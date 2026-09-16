def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_register_and_login(client):
    # Register user
    reg_response = client.post("/api/auth/register", json={
        "username": "authuser",
        "email": "authuser@example.com",
        "password": "password123"
    })
    assert reg_response.status_code == 201
    data = reg_response.json()
    assert "access_token" in data
    assert data["user"]["username"] == "authuser"
    token = data["access_token"]

    # Test /api/auth/me
    me_response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_response.status_code == 200
    assert me_response.json()["email"] == "authuser@example.com"

    # Test login
    login_response = client.post("/api/auth/login", json={
        "username": "authuser",
        "password": "password123"
    })
    assert login_response.status_code == 200
    assert "access_token" in login_response.json()

def test_duplicate_registration(client):
    client.post("/api/auth/register", json={
        "username": "uniqueuser",
        "email": "unique@example.com",
        "password": "password123"
    })
    
    dup_response = client.post("/api/auth/register", json={
        "username": "uniqueuser",
        "email": "different@example.com",
        "password": "password123"
    })
    assert dup_response.status_code == 400
    assert "already registered" in dup_response.json()["detail"]
