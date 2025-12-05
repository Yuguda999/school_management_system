import pytest
import pytest_asyncio
import asyncio
import os
from typing import AsyncGenerator, Generator
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import get_db, Base
from app.core.config import settings
from app.api.v1.api import api_router

# Set testing environment
os.environ["TESTING"] = "1"

# Test database URL
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"

# Create test engine
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

# Create test session factory
TestingSessionLocal = sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False
)


@asynccontextmanager
async def test_lifespan(app: FastAPI):
    """Test lifespan that doesn't run migrations."""
    yield


def create_test_app() -> FastAPI:
    """Create a test FastAPI app without database initialization."""
    test_app = FastAPI(
        title="Test School Management System",
        version="1.0.0",
        lifespan=test_lifespan
    )
    test_app.include_router(api_router, prefix="/api/v1")
    return test_app


# Create test app instance
test_app = create_test_app()


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create a test database session."""
    async with test_engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

        async with TestingSessionLocal() as session:
            yield session

        await connection.run_sync(Base.metadata.drop_all)


# Alias for compatibility
db = db_session


@pytest.fixture
def client(db_session: AsyncSession) -> TestClient:
    """Create a test client."""
    async def override_get_db():
        yield db_session

    test_app.dependency_overrides[get_db] = override_get_db

    with TestClient(test_app) as test_client:
        yield test_client

    test_app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def test_school(db_session: AsyncSession):
    """Create a test school."""
    from app.models.school import School

    school = School(
        name="Test School",
        code="TEST001",
        email="test@school.com",
        address_line1="123 Test Street",
        city="Test City",
        state="Test State",
        postal_code="12345",
        country="Nigeria",
        current_session="2023/2024",
        current_term="First Term"
    )

    db_session.add(school)
    await db_session.commit()
    await db_session.refresh(school)

    return school


@pytest_asyncio.fixture
async def test_admin_user(db_session: AsyncSession, test_school):
    """Create a test admin user."""
    from app.models.user import User, UserRole
    from app.core.security import get_password_hash
    
    user = User(
        email="admin@test.com",
        password_hash=get_password_hash("testpassword"),
        first_name="Test",
        last_name="Admin",
        role=UserRole.SCHOOL_ADMIN,
        school_id=test_school.id,
        is_active=True,
        is_verified=True
    )
    
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    
    return user


@pytest.fixture
def auth_headers(client: TestClient, test_admin_user, test_school):
    """Get authentication headers for test admin user."""
    response = client.post(
        f"/api/v1/auth/school/{test_school.code}/login",
        json={
            "email": test_admin_user.email,
            "password": "testpassword"
        }
    )

    assert response.status_code == 200, f"Login failed: {response.json()}"
    token = response.json()["access_token"]

    return {"Authorization": f"Bearer {token}"}


# Aliases for compatibility with different test patterns
@pytest_asyncio.fixture
async def admin_user(test_admin_user):
    """Alias for test_admin_user fixture."""
    return test_admin_user


@pytest.fixture
def admin_headers(auth_headers):
    """Alias for auth_headers fixture."""
    return auth_headers
