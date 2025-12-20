# School Management System API

A comprehensive multitenant school management system built with FastAPI, designed to handle multiple schools with role-based access control.

## Features

### 🎓 For School Owners (Super Admin)
- Register school and set up school profile
- Manage staff (add, edit, assign roles)
- Manage students (add, enroll in classes, promote)
- Class and subject management
- Term/Semester setup
- Fee management and tracking
- Performance management (exams, grades, reports)
- Timetable setup
- Communication system (SMS/Email)

### 👩‍🏫 For Teachers
- Manage class records
- Upload results/grades
- View timetable
- Mark attendance
- Send messages to parents/students

### 👩‍🎓 For Students
- View timetable
- Check results
- Download materials
- View school announcements
- Make payments (if enabled)

### 👨‍👩‍👧 For Parents
- View child's performance
- Pay fees
- Communicate with school
- View attendance records

## Technology Stack

- **Backend**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL with SQLAlchemy (async)
- **Authentication**: JWT tokens
- **Caching**: Redis
- **Background Tasks**: Celery
- **Documentation**: Swagger/OpenAPI
- **Testing**: Pytest
- **Containerization**: Docker & Docker Compose

## Project Structure

```
school_management_system/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/
│   │       │   ├── auth.py
│   │       │   ├── schools.py
│   │       │   ├── users.py
│   │       │   ├── students.py
│   │       │   ├── classes.py
│   │       │   ├── subjects.py
│   │       │   ├── terms.py
│   │       │   └── fees.py
│   │       └── api.py
│   ├── core/
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── security.py
│   │   └── deps.py
│   ├── models/
│   │   ├── base.py
│   │   ├── school.py
│   │   ├── user.py
│   │   ├── student.py
│   │   ├── academic.py
│   │   ├── fee.py
│   │   ├── grade.py
│   │   └── communication.py
│   ├── schemas/
│   │   ├── auth.py
│   │   ├── school.py
│   │   ├── user.py
│   │   ├── student.py
│   │   ├── academic.py
│   │   └── fee.py
│   ├── services/
│   │   ├── school_service.py
│   │   ├── user_service.py
│   │   ├── academic_service.py
│   │   └── fee_service.py
│   └── main.py
├── alembic/
├── tests/
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## Quick Start

### Using Docker (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd school_management_system
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Update the `.env` file with your configuration.

4. Start the services:
```bash
docker-compose up -d
```

5. The API will be available at `http://localhost:8000`
6. API documentation at `http://localhost:8000/api/v1/docs`

### Manual Setup

1. Install Python 3.11+ and PostgreSQL

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up database:
```bash
# Create database
createdb school_management

# Run migrations
alembic upgrade head
```

5. Start the application:
```bash
python run.py
```

## API Documentation

The API documentation is automatically generated and available at:
- Swagger UI: `http://localhost:8000/api/v1/docs`
- ReDoc: `http://localhost:8000/api/v1/redoc`
- OpenAPI JSON: `http://localhost:8000/api/v1/openapi.json`

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. To access protected endpoints:

1. Register a school:
```bash
POST /api/v1/schools/register
```

2. Login with admin credentials:
```bash
POST /api/v1/auth/login
```

3. Use the returned access token in the Authorization header:
```bash
Authorization: Bearer <access_token>
```

## Key API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user info
- `POST /api/v1/auth/change-password` - Change password

### School Management
- `POST /api/v1/schools/register` - Register new school
- `GET /api/v1/schools/me` - Get school info
- `PUT /api/v1/schools/me` - Update school info
- `GET /api/v1/schools/me/stats` - Get school statistics

### User Management
- `POST /api/v1/users/` - Create user
- `GET /api/v1/users/` - List users
- `GET /api/v1/users/{user_id}` - Get user details
- `PUT /api/v1/users/{user_id}` - Update user

### Student Management
- `POST /api/v1/students/` - Create student
- `GET /api/v1/students/` - List students
- `GET /api/v1/students/{student_id}` - Get student details
- `PUT /api/v1/students/{student_id}` - Update student

### Academic Management
- `POST /api/v1/classes/` - Create class
- `GET /api/v1/classes/` - List classes
- `POST /api/v1/subjects/` - Create subject
- `GET /api/v1/subjects/` - List subjects
- `POST /api/v1/terms/` - Create term
- `GET /api/v1/terms/current` - Get current term

### Fee Management
- `POST /api/v1/fees/structures` - Create fee structure
- `GET /api/v1/fees/structures` - List fee structures
- `POST /api/v1/fees/assignments` - Create fee assignment
- `POST /api/v1/fees/payments` - Record payment
- `GET /api/v1/fees/reports/collection` - Fee collection report

## Testing

Run the test suite:

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app

# Run specific test file
pytest tests/test_auth.py
```

## Environment Variables

Key environment variables (see `.env.example` for full list):

- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY` - JWT secret key
- `REDIS_URL` - Redis connection string
- `SENDGRID_API_KEY` - SendGrid API key for emails
- `TWILIO_ACCOUNT_SID` - Twilio account SID for SMS

## Database Migrations

Create and run migrations:

```bash
# Create new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.

## Platform Administration

To access the Platform Super Admin dashboard, you must first create an initial admin user. A utility script is provided for this purpose.

### Creating a Platform Super Admin

Run the following command from the `backend` directory:

```bash
python create_platform_admin.py
```

Follow the prompts to set the email, details, and password. Once created, you can log in via the standard login page, and the system will automatically redirect you to the Platform Dashboard.
