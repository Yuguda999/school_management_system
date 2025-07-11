# 🧪 Testing Guide

This guide covers the comprehensive testing strategy for the School Management System, including unit tests, integration tests, end-to-end tests, and performance testing.

## 📋 Testing Strategy

### Testing Pyramid

Our testing strategy follows the testing pyramid approach:

1. **Unit Tests (70%)** - Fast, isolated tests for individual components
2. **Integration Tests (20%)** - Tests for component interactions
3. **End-to-End Tests (10%)** - Full user journey tests

### Test Types

- **Unit Tests**: Test individual functions, classes, and components
- **Integration Tests**: Test API endpoints and database interactions
- **Component Tests**: Test React components in isolation
- **End-to-End Tests**: Test complete user workflows
- **Performance Tests**: Test system performance under load
- **Security Tests**: Test authentication and authorization

## 🔧 Backend Testing

### Setup

```bash
cd backend
pip install pytest pytest-asyncio pytest-cov
```

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app tests/

# Run specific test file
pytest tests/test_students_api.py

# Run specific test
pytest tests/test_students_api.py::TestStudentsAPI::test_create_student_success

# Run tests with verbose output
pytest -v

# Run tests in parallel
pytest -n auto
```

### Test Configuration

**pytest.ini:**
```ini
[tool:pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = 
    --strict-markers
    --strict-config
    --cov=app
    --cov-report=term-missing
    --cov-report=html
    --cov-fail-under=80
markers =
    unit: Unit tests
    integration: Integration tests
    slow: Slow running tests
    auth: Authentication tests
    db: Database tests
```

### Test Structure

```
backend/tests/
├── conftest.py              # Test configuration and fixtures
├── test_auth.py            # Authentication tests
├── test_users_api.py       # User API tests
├── test_students_api.py    # Student API tests
├── test_teachers_api.py    # Teacher API tests
├── test_classes_api.py     # Class API tests
├── test_attendance_api.py  # Attendance API tests
├── test_fees_api.py        # Fee management tests
├── test_communication_api.py # Communication tests
├── test_integration.py     # Integration tests
├── test_performance.py     # Performance tests
└── test_security.py        # Security tests
```

### Writing Unit Tests

```python
import pytest
from app.services.student_service import StudentService
from app.schemas.student import StudentCreate

class TestStudentService:
    """Unit tests for StudentService."""
    
    @pytest.mark.unit
    async def test_create_student_success(self, db_session, test_school):
        """Test successful student creation."""
        service = StudentService(db_session)
        student_data = StudentCreate(
            admission_number="STU001",
            first_name="Test",
            last_name="Student",
            email="test@example.com",
            date_of_birth="2005-01-01",
            gender="male"
        )
        
        student = await service.create_student(student_data, test_school.id)
        
        assert student.admission_number == "STU001"
        assert student.first_name == "Test"
        assert student.email == "test@example.com"
    
    @pytest.mark.unit
    async def test_create_student_duplicate_admission_number(self, db_session, test_school):
        """Test student creation with duplicate admission number."""
        service = StudentService(db_session)
        
        # Create first student
        student_data1 = StudentCreate(
            admission_number="STU001",
            first_name="First",
            last_name="Student",
            email="first@example.com",
            date_of_birth="2005-01-01",
            gender="male"
        )
        await service.create_student(student_data1, test_school.id)
        
        # Try to create second student with same admission number
        student_data2 = StudentCreate(
            admission_number="STU001",  # Duplicate
            first_name="Second",
            last_name="Student",
            email="second@example.com",
            date_of_birth="2005-01-01",
            gender="female"
        )
        
        with pytest.raises(ValueError, match="Admission number already exists"):
            await service.create_student(student_data2, test_school.id)
```

### Writing Integration Tests

```python
import pytest
from fastapi.testclient import TestClient

class TestStudentIntegration:
    """Integration tests for student endpoints."""
    
    @pytest.mark.integration
    def test_student_crud_workflow(self, client: TestClient, auth_headers: dict):
        """Test complete CRUD workflow for students."""
        # Create student
        student_data = {
            "admission_number": "STU001",
            "first_name": "Test",
            "last_name": "Student",
            "email": "test@example.com",
            "date_of_birth": "2005-01-01",
            "gender": "male"
        }
        
        response = client.post("/api/v1/students", json=student_data, headers=auth_headers)
        assert response.status_code == 201
        student = response.json()
        student_id = student["id"]
        
        # Read student
        response = client.get(f"/api/v1/students/{student_id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["admission_number"] == "STU001"
        
        # Update student
        update_data = {"first_name": "Updated"}
        response = client.put(f"/api/v1/students/{student_id}", json=update_data, headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["first_name"] == "Updated"
        
        # Delete student
        response = client.delete(f"/api/v1/students/{student_id}", headers=auth_headers)
        assert response.status_code == 204
        
        # Verify deletion
        response = client.get(f"/api/v1/students/{student_id}", headers=auth_headers)
        assert response.status_code == 404
```

### Database Testing

```python
@pytest.mark.db
async def test_database_constraints(db_session, test_school):
    """Test database constraints and relationships."""
    from app.models.student import Student
    from sqlalchemy.exc import IntegrityError
    
    # Test unique constraint on admission number
    student1 = Student(
        admission_number="STU001",
        first_name="First",
        last_name="Student",
        school_id=test_school.id
    )
    db_session.add(student1)
    await db_session.commit()
    
    student2 = Student(
        admission_number="STU001",  # Duplicate
        first_name="Second",
        last_name="Student",
        school_id=test_school.id
    )
    db_session.add(student2)
    
    with pytest.raises(IntegrityError):
        await db_session.commit()
```

## 🎨 Frontend Testing

### Setup

```bash
cd frontend
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test StudentList.test.tsx

# Run tests matching pattern
npm test -- --grep "Button"
```

### Test Configuration

**vitest.config.ts:**
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test-utils.tsx'],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
});
```

### Component Testing

```typescript
import { render, screen, fireEvent } from '@/test-utils';
import { StudentCard } from './StudentCard';

describe('StudentCard', () => {
  const mockStudent = {
    id: '1',
    admission_number: 'STU001',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    is_active: true,
  };

  it('renders student information correctly', () => {
    render(<StudentCard student={mockStudent} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('STU001')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const onSelect = vi.fn();
    render(<StudentCard student={mockStudent} onSelect={onSelect} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith(mockStudent);
  });

  it('shows inactive state for inactive students', () => {
    const inactiveStudent = { ...mockStudent, is_active: false };
    render(<StudentCard student={inactiveStudent} />);
    
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });
});
```

### Hook Testing

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useStudents } from '@/hooks/useStudents';

describe('useStudents', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('fetches students successfully', async () => {
    const { result } = renderHook(() => useStudents(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.students).toBeInstanceOf(Array);
  });
});
```

## 🔄 End-to-End Testing

### Setup with Playwright

```bash
npm install --save-dev @playwright/test
npx playwright install
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test.describe('Student Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'admin@test.com');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should create a new student', async ({ page }) => {
    // Navigate to students page
    await page.click('[data-testid="students-nav"]');
    await expect(page).toHaveURL('/students');

    // Click create student button
    await page.click('[data-testid="create-student-button"]');
    
    // Fill student form
    await page.fill('[data-testid="admission-number"]', 'STU001');
    await page.fill('[data-testid="first-name"]', 'John');
    await page.fill('[data-testid="last-name"]', 'Doe');
    await page.fill('[data-testid="email"]', 'john@example.com');
    await page.fill('[data-testid="date-of-birth"]', '2005-01-01');
    await page.selectOption('[data-testid="gender"]', 'male');
    
    // Submit form
    await page.click('[data-testid="submit-button"]');
    
    // Verify student was created
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('text=John Doe')).toBeVisible();
  });

  test('should search for students', async ({ page }) => {
    await page.goto('/students');
    
    // Search for student
    await page.fill('[data-testid="search-input"]', 'John');
    await page.press('[data-testid="search-input"]', 'Enter');
    
    // Verify search results
    await expect(page.locator('[data-testid="student-card"]')).toContainText('John');
  });
});
```

## ⚡ Performance Testing

### Load Testing with Locust

```python
# locustfile.py
from locust import HttpUser, task, between

class SchoolManagementUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        """Login before starting tasks."""
        response = self.client.post("/api/v1/auth/login", json={
            "email": "test@example.com",
            "password": "password"
        })
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    @task(3)
    def view_students(self):
        """View students list."""
        self.client.get("/api/v1/students", headers=self.headers)
    
    @task(2)
    def view_dashboard(self):
        """View dashboard."""
        self.client.get("/api/v1/dashboard", headers=self.headers)
    
    @task(1)
    def create_student(self):
        """Create a new student."""
        student_data = {
            "admission_number": f"STU{self.environment.runner.user_count}",
            "first_name": "Test",
            "last_name": "Student",
            "email": f"student{self.environment.runner.user_count}@test.com",
            "date_of_birth": "2005-01-01",
            "gender": "male"
        }
        self.client.post("/api/v1/students", json=student_data, headers=self.headers)
```

### Running Performance Tests

```bash
# Install locust
pip install locust

# Run load test
locust -f locustfile.py --host=http://localhost:8000

# Run headless load test
locust -f locustfile.py --host=http://localhost:8000 --users 100 --spawn-rate 10 --run-time 60s --headless
```

## 🔒 Security Testing

### Authentication Tests

```python
class TestSecurity:
    """Security-focused tests."""
    
    def test_unauthorized_access(self, client: TestClient):
        """Test that endpoints require authentication."""
        response = client.get("/api/v1/students")
        assert response.status_code == 401
    
    def test_invalid_token(self, client: TestClient):
        """Test invalid token handling."""
        headers = {"Authorization": "Bearer invalid-token"}
        response = client.get("/api/v1/students", headers=headers)
        assert response.status_code == 401
    
    def test_expired_token(self, client: TestClient):
        """Test expired token handling."""
        # Create expired token
        expired_token = create_access_token(
            data={"sub": "test@example.com"},
            expires_delta=timedelta(seconds=-1)
        )
        headers = {"Authorization": f"Bearer {expired_token}"}
        response = client.get("/api/v1/students", headers=headers)
        assert response.status_code == 401
    
    def test_role_based_access(self, client: TestClient):
        """Test role-based access control."""
        # Student should not access admin endpoints
        student_headers = get_student_auth_headers()
        response = client.post("/api/v1/users", headers=student_headers)
        assert response.status_code == 403
```

### SQL Injection Tests

```python
def test_sql_injection_protection(client: TestClient, auth_headers: dict):
    """Test protection against SQL injection."""
    malicious_input = "'; DROP TABLE students; --"
    
    response = client.get(
        f"/api/v1/students?search={malicious_input}",
        headers=auth_headers
    )
    
    # Should not cause server error
    assert response.status_code in [200, 400]
    
    # Verify tables still exist
    response = client.get("/api/v1/students", headers=auth_headers)
    assert response.status_code == 200
```

## 📊 Test Coverage

### Coverage Goals

- **Overall Coverage**: 80%+
- **Critical Paths**: 95%+
- **Business Logic**: 90%+
- **API Endpoints**: 85%+

### Generating Coverage Reports

```bash
# Backend coverage
pytest --cov=app --cov-report=html tests/

# Frontend coverage
npm run test:coverage

# View coverage reports
open htmlcov/index.html  # Backend
open coverage/index.html  # Frontend
```

## 🚀 Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'
    
    - name: Install dependencies
      run: |
        cd backend
        pip install -r requirements.txt
    
    - name: Run tests
      run: |
        cd backend
        pytest --cov=app --cov-report=xml
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./backend/coverage.xml

  frontend-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: |
        cd frontend
        npm ci
    
    - name: Run tests
      run: |
        cd frontend
        npm run test:coverage
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./frontend/coverage/coverage-final.json
```

## 🛠️ Testing Best Practices

### General Principles

1. **Test Pyramid**: More unit tests, fewer E2E tests
2. **Fast Feedback**: Tests should run quickly
3. **Isolation**: Tests should not depend on each other
4. **Deterministic**: Tests should produce consistent results
5. **Maintainable**: Tests should be easy to understand and modify

### Writing Good Tests

1. **Descriptive Names**: Test names should describe what is being tested
2. **Arrange-Act-Assert**: Structure tests clearly
3. **Single Responsibility**: Each test should test one thing
4. **Test Edge Cases**: Include boundary conditions and error cases
5. **Mock External Dependencies**: Use mocks for external services

### Common Pitfalls

1. **Testing Implementation Details**: Focus on behavior, not implementation
2. **Brittle Tests**: Avoid tests that break with minor changes
3. **Slow Tests**: Keep tests fast by using appropriate test doubles
4. **Flaky Tests**: Ensure tests are reliable and deterministic
5. **Poor Test Data**: Use realistic but minimal test data

## 📚 Resources

- [Pytest Documentation](https://docs.pytest.org/)
- [Testing Library Documentation](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [Locust Documentation](https://locust.io/)

This comprehensive testing guide ensures high-quality, reliable software through thorough testing at all levels.
