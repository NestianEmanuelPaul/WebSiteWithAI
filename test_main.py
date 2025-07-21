import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Set test environment variable before importing app
os.environ['TESTING'] = '1'

# Import app after setting environment variables
from app.main import app, Base, get_db

# Test database setup
TEST_DATABASE_URL = "sqlite:///:memory:"

# Create test engine with in-memory SQLite
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)

# Create test session
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

# Override the get_db dependency
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

# Apply the override
app.dependency_overrides[get_db] = override_get_db

# Create test client
client = TestClient(app)

# Fixture to set up and tear down the database
@pytest.fixture(scope="function")
def test_db():
    # Create all tables
    Base.metadata.create_all(bind=test_engine)
    
    yield  # this is where the testing happens
    
    # Drop all tables after test
    Base.metadata.drop_all(bind=test_engine)

def test_health_check(test_db):
    """Test the health check endpoint"""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "message" in data
    assert data["message"] == "Service is running"

def test_create_project(test_db):
    """Test project creation"""
    project_data = {"name": "Test Project", "description": "A test project"}
    response = client.post("/api/projects/", json=project_data)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == project_data["name"]
    assert data["description"] == project_data["description"]
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data

def test_list_projects(test_db):
    """Test listing projects"""
    # First create a project
    project_data = [
        {"name": "Test Project 1", "description": "First test project"},
        {"name": "Test Project 2", "description": "Second test project"}
    ]
    
    # Add projects
    for project in project_data:
        client.post("/api/projects/", json=project)
    
    # Test listing
    response = client.get("/api/projects/")
    assert response.status_code == 200
    data = response.json()
    
    # Should have at least the two projects we created
    assert len(data) >= 2
    
    # Check if our test projects are in the response
    project_names = {p["name"] for p in data}
    assert "Test Project 1" in project_names
    assert "Test Project 2" in project_names
