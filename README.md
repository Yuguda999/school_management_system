# 🏫 School Management System

A comprehensive, modern school management system built with FastAPI (backend) and React 18 (frontend). This system provides a complete solution for managing students, teachers, classes, attendance, fees, and communication in educational institutions.

## ✨ Features

### 👥 User Management
- **Multi-tenant Architecture**: Support for multiple schools
- **Role-based Access Control**: Super Admin, School Admin, Teacher, Student, Parent roles
- **User Authentication**: Secure JWT-based authentication
- **Profile Management**: Complete user profiles with photos and details

### 🎓 Student Management
- **Student Registration**: Comprehensive student enrollment system
- **Academic Records**: Track academic progress and performance
- **Parent Association**: Link students with their parents/guardians
- **Student Profiles**: Detailed student information and history

### 👨‍🏫 Teacher Management
- **Teacher Profiles**: Complete teacher information and qualifications
- **Class Assignments**: Assign teachers to specific classes and subjects
- **Performance Tracking**: Monitor teaching effectiveness
- **Schedule Management**: Manage teacher schedules and availability

### 📚 Academic Management
- **Class Management**: Create and manage classes, sections, and academic sessions
- **Subject Management**: Define subjects and curriculum
- **Term/Semester System**: Flexible academic calendar management
- **Grade Management**: Comprehensive grading and assessment system

### 📅 Attendance System
- **Real-time Attendance**: Mark and track student attendance
- **Attendance Reports**: Generate detailed attendance analytics
- **Automated Notifications**: Alert parents about absences
- **Attendance Trends**: Visual analytics and insights

### 💰 Fee Management
- **Fee Structure**: Flexible fee structure configuration
- **Payment Tracking**: Complete payment history and status
- **Invoice Generation**: Automated invoice and receipt generation
- **Payment Reminders**: Automated fee reminder system
- **Financial Reports**: Comprehensive financial analytics

### 📢 Communication System
- **Messaging**: Send messages to students, parents, and teachers
- **Announcements**: School-wide announcements and notices
- **Notification Templates**: Automated notification system
- **Multi-channel Communication**: Email, SMS, and in-app notifications

### 📊 Analytics & Reports
- **Dashboard Analytics**: Real-time insights and metrics
- **Custom Reports**: Generate various academic and administrative reports
- **Data Visualization**: Interactive charts and graphs
- **Export Functionality**: Export data in multiple formats

### 🎨 Modern UI/UX
- **Responsive Design**: Mobile-first, works on all devices
- **Smooth Animations**: Premium user experience with Framer Motion
- **Dark/Light Mode**: Theme customization
- **Accessibility**: WCAG compliant design

## 🛠️ Technology Stack

### Backend
- **FastAPI**: Modern, fast web framework for building APIs
- **PostgreSQL**: Robust relational database
- **SQLAlchemy**: Python SQL toolkit and ORM
- **Alembic**: Database migration tool
- **Pydantic**: Data validation using Python type annotations
- **JWT**: JSON Web Tokens for authentication
- **Celery**: Distributed task queue for background jobs
- **Redis**: In-memory data structure store for caching

### Frontend
- **React 18**: Latest React with concurrent features
- **TypeScript**: Type-safe JavaScript development
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Production-ready motion library
- **React Query**: Data fetching and state management
- **React Router**: Declarative routing
- **Lucide React**: Beautiful & consistent icon pack

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 16+
- PostgreSQL 12+
- Redis 6+

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd school-management-system
   ```

2. **Set up Python environment**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database and other configurations
   ```

4. **Set up database**
   ```bash
   # Create PostgreSQL database
   createdb school_management
   
   # Run migrations
   alembic upgrade head
   
   # Seed initial data (optional)
   python scripts/seed_data.py
   ```

5. **Start the backend server**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API URL and other configurations
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## 📁 Project Structure

```
school-management-system/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Core functionality
│   │   ├── models/         # Database models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   ├── alembic/            # Database migrations
│   ├── tests/              # Test suite
│   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript types
│   │   ├── utils/          # Utility functions
│   │   └── contexts/       # React contexts
│   ├── public/             # Static assets
│   └── package.json        # Node.js dependencies
├── docs/                   # Documentation
├── docker/                 # Docker configurations
└── README.md              # This file
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://user:password@localhost/school_management
TEST_DATABASE_URL=postgresql://user:password@localhost/school_management_test

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Redis
REDIS_URL=redis://localhost:6379

# File Storage
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760  # 10MB
```

#### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=School Management System
VITE_APP_VERSION=1.0.0
```

## 🐳 Docker Deployment

### Using Docker Compose

1. **Build and start services**
   ```bash
   docker-compose up -d
   ```

2. **Run database migrations**
   ```bash
   docker-compose exec backend alembic upgrade head
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8000

### Production Deployment

For production deployment, use the production Docker Compose file:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm run test
```

### End-to-End Tests
```bash
npm run test:e2e
```

## 📖 API Documentation

The API documentation is automatically generated and available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Key API Endpoints

- **Authentication**: `/api/v1/auth/`
- **Users**: `/api/v1/users/`
- **Students**: `/api/v1/students/`
- **Teachers**: `/api/v1/teachers/`
- **Classes**: `/api/v1/classes/`
- **Attendance**: `/api/v1/attendance/`
- **Fees**: `/api/v1/fees/`
- **Communication**: `/api/v1/communication/`

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Granular permissions system
- **Data Validation**: Comprehensive input validation
- **SQL Injection Prevention**: ORM-based database queries
- **CORS Protection**: Configurable CORS policies
- **Rate Limiting**: API rate limiting for abuse prevention
- **Password Hashing**: Secure password storage with bcrypt

## 🌐 Multi-tenancy

The system supports multi-tenancy with the following features:
- **School Isolation**: Complete data isolation between schools
- **Subdomain Support**: Each school can have its own subdomain
- **Custom Branding**: School-specific themes and branding
- **Separate Databases**: Optional separate databases per tenant

## 📱 Mobile Support

- **Progressive Web App (PWA)**: Installable web application
- **Responsive Design**: Optimized for all screen sizes
- **Touch-friendly Interface**: Mobile-optimized interactions
- **Offline Support**: Basic offline functionality

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **Email**: support@schoolmanagement.com

## 🗺️ Roadmap

- [ ] Mobile Applications (iOS/Android)
- [ ] Advanced Analytics Dashboard
- [ ] Integration with Learning Management Systems
- [ ] AI-powered Insights and Recommendations
- [ ] Video Conferencing Integration
- [ ] Advanced Reporting Engine
- [ ] Multi-language Support
- [ ] Advanced Security Features

## 🙏 Acknowledgments

- FastAPI team for the excellent web framework
- React team for the powerful frontend library
- All contributors who have helped improve this project

---

Made with ❤️ for educational institutions worldwide.
