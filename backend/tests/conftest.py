import pytest
import asyncio
from typing import AsyncGenerator, Generator
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import get_db, Base
from app.core.config import settings

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


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create a test database session."""
    async with test_engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
        
        async with TestingSessionLocal() as session:
            yield session
        
        await connection.run_sync(Base.metadata.drop_all)


@pytest.fixture
def client(db_session: AsyncSession) -> TestClient:
    """Create a test client."""
    def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest.fixture
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


@pytest.fixture
async def test_admin_user(db_session: AsyncSession, test_school):
    """Create a test admin user."""
    from app.models.user import User, UserRole
    from app.core.security import get_password_hash
    
    user = User(
        email="admin@test.com",
        password_hash=get_password_hash("testpassword"),
        first_name="Test",
        last_name="Admin",
        role=UserRole.SUPER_ADMIN,
        school_id=test_school.id,
        is_active=True,
        is_verified=True
    )
    
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    
    return user


@pytest.fixture
def auth_headers(client: TestClient, test_admin_user):
    """Get authentication headers for test admin user."""
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": test_admin_user.email,
            "password": "testpassword"
        }
    )
    
    assert response.status_code == 200
    token = response.json()["access_token"]
    
    return {"Authorization": f"Bearer {token}"}
