# 🚀 Complete Setup Guide

This guide will walk you through setting up the School Management System from scratch on different environments.

## 📋 Prerequisites

### System Requirements
- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: Minimum 10GB free space
- **Internet**: Stable internet connection for downloading dependencies

### Required Software

#### 1. Python 3.9+
**Windows:**
```bash
# Download from python.org or use chocolatey
choco install python
```

**macOS:**
```bash
# Using Homebrew
brew install python@3.9
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install python3.9 python3.9-venv python3.9-dev
```

#### 2. Node.js 16+
**Windows:**
```bash
# Download from nodejs.org or use chocolatey
choco install nodejs
```

**macOS:**
```bash
# Using Homebrew
brew install node
```

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### 3. PostgreSQL 12+
**Windows:**
```bash
# Download installer from postgresql.org or use chocolatey
choco install postgresql
```

**macOS:**
```bash
# Using Homebrew
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### 4. Redis 6+
**Windows:**
```bash
# Using chocolatey
choco install redis-64
```

**macOS:**
```bash
# Using Homebrew
brew install redis
brew services start redis
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

## 🔧 Development Environment Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-username/school-management-system.git
cd school-management-system
```

### Step 2: Backend Setup

#### 2.1 Create Python Virtual Environment
```bash
cd backend
python -m venv venv

# Activate virtual environment
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
```

#### 2.2 Install Python Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

#### 2.3 Set Up Environment Variables
```bash
# Copy example environment file
cp .env.example .env

# Edit .env file with your configurations
nano .env  # or use your preferred editor
```

**Required Environment Variables:**
```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/school_management
TEST_DATABASE_URL=postgresql://username:password@localhost:5432/school_management_test

# Security
SECRET_KEY=your-super-secret-key-here-make-it-long-and-random
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_TLS=true
SMTP_SSL=false

# Redis Configuration
REDIS_URL=redis://localhost:6379/0

# File Upload Configuration
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760  # 10MB in bytes
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,doc,docx

# CORS Configuration
BACKEND_CORS_ORIGINS=["http://localhost:3000","http://localhost:5173"]

# Environment
ENVIRONMENT=development
DEBUG=true
```

#### 2.4 Set Up Database

**Create Database:**
```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE school_management;
CREATE USER school_admin WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE school_management TO school_admin;

# Create test database
CREATE DATABASE school_management_test;
GRANT ALL PRIVILEGES ON DATABASE school_management_test TO school_admin;

# Exit PostgreSQL
\q
```

**Run Database Migrations:**
```bash
# Initialize Alembic (if not already done)
alembic init alembic

# Run migrations
alembic upgrade head
```

**Seed Initial Data (Optional):**
```bash
python scripts/seed_data.py
```

#### 2.5 Start Backend Server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at: http://localhost:8000
API Documentation: http://localhost:8000/docs

### Step 3: Frontend Setup

#### 3.1 Navigate to Frontend Directory
```bash
cd ../frontend
```

#### 3.2 Install Node.js Dependencies
```bash
npm install
```

#### 3.3 Set Up Environment Variables
```bash
# Copy example environment file
cp .env.example .env.local

# Edit .env.local file
nano .env.local  # or use your preferred editor
```

**Required Environment Variables:**
```env
# API Configuration
VITE_API_URL=http://localhost:8000
VITE_API_VERSION=v1

# Application Configuration
VITE_APP_NAME=School Management System
VITE_APP_VERSION=1.0.0
VITE_APP_DESCRIPTION=Comprehensive School Management Solution

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_DARK_MODE=true

# File Upload Configuration
VITE_MAX_FILE_SIZE=10485760  # 10MB
VITE_ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,doc,docx

# Environment
VITE_NODE_ENV=development
```

#### 3.4 Start Frontend Development Server
```bash
npm run dev
```

The frontend will be available at: http://localhost:5173

## 🐳 Docker Setup (Alternative)

If you prefer using Docker, follow these steps:

### Step 1: Install Docker and Docker Compose

**Windows/macOS:**
- Download Docker Desktop from docker.com

**Linux:**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.12.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Step 2: Configure Environment Variables
```bash
# Copy and edit environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Edit the files with appropriate values
```

### Step 3: Build and Start Services
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Run database migrations
docker-compose exec backend alembic upgrade head

# Seed initial data (optional)
docker-compose exec backend python scripts/seed_data.py
```

### Step 4: Access the Application
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Database: localhost:5432

## 🧪 Testing Setup

### Backend Testing
```bash
cd backend

# Install test dependencies (if not already installed)
pip install pytest pytest-asyncio pytest-cov

# Run tests
pytest

# Run tests with coverage
pytest --cov=app tests/

# Run specific test file
pytest tests/test_users.py
```

### Frontend Testing
```bash
cd frontend

# Install test dependencies (if not already installed)
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 🔐 Security Configuration

### 1. Generate Secret Key
```python
# Run this in Python to generate a secure secret key
import secrets
print(secrets.token_urlsafe(32))
```

### 2. Set Up SSL/HTTPS (Production)
```bash
# Using Let's Encrypt with Certbot
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### 3. Configure Firewall
```bash
# Ubuntu/Debian
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

## 📊 Monitoring Setup (Optional)

### 1. Set Up Application Monitoring
```bash
# Install monitoring dependencies
pip install prometheus-client
npm install @sentry/react @sentry/tracing
```

### 2. Configure Logging
```python
# Add to backend/.env
LOG_LEVEL=INFO
LOG_FILE=logs/app.log
```

## 🚀 Production Deployment

### 1. Environment Configuration
```bash
# Update environment variables for production
ENVIRONMENT=production
DEBUG=false
DATABASE_URL=postgresql://user:pass@prod-db:5432/school_management
REDIS_URL=redis://prod-redis:6379/0
```

### 2. Build Frontend for Production
```bash
cd frontend
npm run build
```

### 3. Use Production Docker Compose
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Database Connection Error
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check if database exists
sudo -u postgres psql -l

# Reset database connection
sudo systemctl restart postgresql
```

#### 2. Redis Connection Error
```bash
# Check Redis status
sudo systemctl status redis-server

# Test Redis connection
redis-cli ping

# Restart Redis
sudo systemctl restart redis-server
```

#### 3. Port Already in Use
```bash
# Find process using port 8000
lsof -i :8000

# Kill process
kill -9 <PID>
```

#### 4. Permission Errors
```bash
# Fix file permissions
chmod +x scripts/*.py
chown -R $USER:$USER uploads/
```

### Getting Help

If you encounter issues:

1. Check the logs:
   ```bash
   # Backend logs
   tail -f logs/app.log
   
   # Docker logs
   docker-compose logs -f backend
   ```

2. Verify environment variables are set correctly
3. Ensure all services are running
4. Check the [GitHub Issues](https://github.com/your-repo/issues) for similar problems
5. Create a new issue with detailed error information

## ✅ Verification Checklist

After setup, verify everything is working:

- [ ] Backend server starts without errors
- [ ] Frontend development server starts
- [ ] Database connection is successful
- [ ] Redis connection is working
- [ ] API documentation is accessible
- [ ] Frontend can communicate with backend
- [ ] Authentication system works
- [ ] File upload functionality works
- [ ] Email notifications work (if configured)
- [ ] Tests pass successfully

## 🎉 Next Steps

Once setup is complete:

1. **Create your first school**: Use the admin interface to set up a school
2. **Add users**: Create admin, teacher, student, and parent accounts
3. **Configure classes**: Set up academic sessions, classes, and subjects
4. **Explore features**: Test attendance, fee management, and communication features
5. **Customize**: Modify themes, logos, and school-specific settings

Congratulations! Your School Management System is now ready to use. 🎊
