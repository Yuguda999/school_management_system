# 🤝 Contributing to School Management System

We love your input! We want to make contributing to the School Management System as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Issue Reporting](#issue-reporting)
- [Feature Requests](#feature-requests)
- [Community](#community)

## 📜 Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to [conduct@schoolmanagement.com](mailto:conduct@schoolmanagement.com).

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, sex characteristics, gender identity and expression, level of experience, education, socio-economic status, nationality, personal appearance, race, religion, or sexual identity and orientation.

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have:

- Python 3.9+ installed
- Node.js 16+ installed
- PostgreSQL 12+ installed
- Redis 6+ installed
- Git installed
- A GitHub account

### Setting Up Development Environment

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/school-management-system.git
   cd school-management-system
   ```

3. **Add the original repository as upstream**:
   ```bash
   git remote add upstream https://github.com/original-owner/school-management-system.git
   ```

4. **Set up the development environment** following our [Setup Guide](docs/SETUP_GUIDE.md)

5. **Create a new branch** for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 🔄 Development Process

We use GitHub Flow, so all code changes happen through pull requests:

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code lints
6. Issue that pull request!

### Branch Naming Convention

Use descriptive branch names with prefixes:

- `feature/` - New features
- `bugfix/` - Bug fixes
- `hotfix/` - Critical fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test improvements

Examples:
- `feature/student-attendance-tracking`
- `bugfix/fee-calculation-error`
- `docs/api-documentation-update`

## 🔀 Pull Request Process

### Before Submitting

1. **Update your branch** with the latest changes:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run tests** to ensure everything works:
   ```bash
   # Backend tests
   cd backend && pytest
   
   # Frontend tests
   cd frontend && npm test
   ```

3. **Check code quality**:
   ```bash
   # Backend linting
   cd backend && flake8 app/
   cd backend && black app/ --check
   
   # Frontend linting
   cd frontend && npm run lint
   ```

### Pull Request Template

When creating a pull request, use this template:

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Added tests for new functionality
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots to help explain your changes.

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
```

### Review Process

1. **Automated checks** must pass (CI/CD pipeline)
2. **Code review** by at least one maintainer
3. **Manual testing** if applicable
4. **Documentation review** if docs are changed
5. **Approval** from maintainer before merge

## 📝 Coding Standards

### Backend (Python/FastAPI)

#### Code Style
- Follow [PEP 8](https://www.python.org/dev/peps/pep-0008/)
- Use [Black](https://black.readthedocs.io/) for code formatting
- Use [isort](https://pycqa.github.io/isort/) for import sorting
- Maximum line length: 88 characters

#### Naming Conventions
- Variables and functions: `snake_case`
- Classes: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Private methods: `_leading_underscore`

#### Example:
```python
from typing import List, Optional
from pydantic import BaseModel


class StudentCreate(BaseModel):
    """Schema for creating a new student."""
    first_name: str
    last_name: str
    email: Optional[str] = None
    date_of_birth: str


async def create_student(
    student_data: StudentCreate,
    db: Session = Depends(get_db)
) -> Student:
    """Create a new student in the database."""
    student = Student(**student_data.dict())
    db.add(student)
    db.commit()
    db.refresh(student)
    return student
```

### Frontend (React/TypeScript)

#### Code Style
- Use [Prettier](https://prettier.io/) for code formatting
- Use [ESLint](https://eslint.org/) for linting
- Follow [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)

#### Naming Conventions
- Components: `PascalCase`
- Files: `PascalCase` for components, `camelCase` for utilities
- Variables and functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- CSS classes: `kebab-case`

#### Example:
```typescript
import React, { useState, useEffect } from 'react';
import { Student } from '@/types/student';
import { Button } from '@/components/ui/Button';

interface StudentListProps {
  students: Student[];
  onStudentSelect: (student: Student) => void;
}

export function StudentList({ students, onStudentSelect }: StudentListProps) {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student);
    onStudentSelect(student);
  };

  return (
    <div className="student-list">
      {students.map((student) => (
        <Button
          key={student.id}
          onClick={() => handleStudentClick(student)}
          variant={selectedStudent?.id === student.id ? 'primary' : 'outline'}
        >
          {student.firstName} {student.lastName}
        </Button>
      ))}
    </div>
  );
}
```

## 🧪 Testing Guidelines

### Backend Testing

#### Test Structure
```python
# tests/test_students.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

class TestStudentAPI:
    """Test cases for student API endpoints."""
    
    def test_create_student_success(self):
        """Test successful student creation."""
        student_data = {
            "first_name": "John",
            "last_name": "Doe",
            "email": "john.doe@example.com"
        }
        response = client.post("/api/v1/students", json=student_data)
        assert response.status_code == 201
        assert response.json()["first_name"] == "John"
    
    def test_create_student_invalid_email(self):
        """Test student creation with invalid email."""
        student_data = {
            "first_name": "John",
            "last_name": "Doe",
            "email": "invalid-email"
        }
        response = client.post("/api/v1/students", json=student_data)
        assert response.status_code == 422
```

#### Test Coverage
- Aim for 80%+ test coverage
- Test happy paths and edge cases
- Include integration tests for API endpoints
- Mock external dependencies

### Frontend Testing

#### Test Structure
```typescript
// src/components/StudentList.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { StudentList } from './StudentList';

const mockStudents = [
  { id: '1', firstName: 'John', lastName: 'Doe' },
  { id: '2', firstName: 'Jane', lastName: 'Smith' },
];

describe('StudentList', () => {
  it('renders student list correctly', () => {
    const onStudentSelect = jest.fn();
    
    render(
      <StudentList students={mockStudents} onStudentSelect={onStudentSelect} />
    );
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });
  
  it('calls onStudentSelect when student is clicked', () => {
    const onStudentSelect = jest.fn();
    
    render(
      <StudentList students={mockStudents} onStudentSelect={onStudentSelect} />
    );
    
    fireEvent.click(screen.getByText('John Doe'));
    expect(onStudentSelect).toHaveBeenCalledWith(mockStudents[0]);
  });
});
```

## 📚 Documentation

### Code Documentation

#### Backend
- Use docstrings for all functions and classes
- Follow [Google Style](https://google.github.io/styleguide/pyguide.html#38-comments-and-docstrings)
- Document API endpoints with OpenAPI/Swagger

#### Frontend
- Use JSDoc for complex functions
- Document component props with TypeScript interfaces
- Include usage examples in component documentation

### API Documentation
- Update OpenAPI schemas when changing API endpoints
- Include request/response examples
- Document error codes and responses

### User Documentation
- Update user guides when adding new features
- Include screenshots for UI changes
- Maintain changelog for version updates

## 🐛 Issue Reporting

### Bug Reports

Use the bug report template:

```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
 - OS: [e.g. iOS]
 - Browser [e.g. chrome, safari]
 - Version [e.g. 22]

**Additional context**
Add any other context about the problem here.
```

### Security Issues

**Do not** create public issues for security vulnerabilities. Instead:

1. Email security@schoolmanagement.com
2. Include detailed description
3. Provide steps to reproduce
4. Allow time for fix before disclosure

## 💡 Feature Requests

Use the feature request template:

```markdown
**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is.

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.
```

## 🏷️ Labels

We use labels to categorize issues and PRs:

### Type Labels
- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Improvements or additions to documentation
- `question` - Further information is requested

### Priority Labels
- `priority: high` - Critical issues
- `priority: medium` - Important issues
- `priority: low` - Nice to have

### Status Labels
- `status: needs review` - Waiting for review
- `status: in progress` - Currently being worked on
- `status: blocked` - Blocked by other issues

### Component Labels
- `backend` - Backend related
- `frontend` - Frontend related
- `database` - Database related
- `api` - API related

## 🎯 Good First Issues

Look for issues labeled `good first issue` if you're new to the project. These are typically:

- Well-defined and scoped
- Don't require deep knowledge of the codebase
- Have clear acceptance criteria
- Include helpful context and guidance

## 🌟 Recognition

Contributors are recognized in:

- README.md contributors section
- Release notes for significant contributions
- Annual contributor appreciation posts

## 📞 Community

### Communication Channels

- **GitHub Discussions**: For general questions and discussions
- **Discord**: Real-time chat with the community
- **Email**: For private matters (contact@schoolmanagement.com)

### Getting Help

1. Check existing documentation
2. Search existing issues
3. Ask in GitHub Discussions
4. Join our Discord community

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

## 🙏 Thank You

Thank you for contributing to the School Management System! Your efforts help make education technology better for schools worldwide.

---

**Happy Contributing!** 🎉
