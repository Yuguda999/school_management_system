# School Management System - Startup Guide

## 🚀 Quick Start

This guide will help you start both the backend and frontend servers to use the Materials Management System.

## Prerequisites

- Python 3.8+ installed
- Node.js 14+ and npm installed
- PostgreSQL or SQLite database

## 🔧 Backend Setup

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Create Virtual Environment (First Time Only)

```bash
# On Linux/Mac
python3 -m venv venv

# On Windows
python -m venv venv
```

### 3. Activate Virtual Environment

```bash
# On Linux/Mac
source venv/bin/activate

# On Windows
venv\Scripts\activate
```

### 4. Install Dependencies (First Time Only)

```bash
pip install -r requirements.txt
```

### 5. Set Up Environment Variables

Create a `.env` file in the `backend` directory (copy from `.env.example`):

```bash
cp .env.example .env
```

Edit `.env` and configure:

```env
# Database
DATABASE_URL=sqlite:///./school_management.db
# Or for PostgreSQL:
# DATABASE_URL=postgresql+asyncpg://user:password@localhost/school_management

# Security
SECRET_KEY=your-secret-key-here-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS - Frontend URL
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Material Management
MATERIAL_UPLOAD_DIR=uploads/materials/
MAX_MATERIAL_SIZE=52428800
TEACHER_STORAGE_QUOTA_MB=5000
```

### 6. Run Database Migrations

```bash
# Initialize database (first time only)
alembic upgrade head
```

### 7. Start the Backend Server

```bash
# Development mode with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### 8. Verify Backend is Running

Open your browser and go to:
- **API Docs**: http://localhost:8000/api/v1/docs
- **Health Check**: http://localhost:8000/health

## 🎨 Frontend Setup

### 1. Open a New Terminal

Keep the backend terminal running and open a new terminal window.

### 2. Navigate to Frontend Directory

```bash
cd frontend
```

### 3. Install Dependencies (First Time Only)

```bash
npm install
```

### 4. Set Up Environment Variables

Create a `.env` file in the `frontend` directory:

```env
REACT_APP_API_URL=http://localhost:8000
```

### 5. Start the Frontend Server

```bash
npm start
```

The app will automatically open in your browser at:
- **Frontend**: http://localhost:3000

## ✅ Verify Everything is Working

### 1. Check Backend Connection

In the browser console (F12), you should NOT see any CORS errors.

### 2. Login

Use your teacher credentials to login.

### 3. Access Materials Management

- Click on "Materials" in the sidebar
- You should see the Materials Management page
- Try uploading a material

## 🐛 Troubleshooting

### CORS Errors

**Problem**: 
```
Access to XMLHttpRequest at 'http://localhost:8000/api/v1/materials/...' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solutions**:

1. **Make sure backend is running**:
   ```bash
   # In backend directory
   uvicorn app.main:app --reload
   ```

2. **Check CORS settings in backend/.env**:
   ```env
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
   ```

3. **Restart backend server** after changing .env:
   ```bash
   # Press CTRL+C to stop
   # Then start again
   uvicorn app.main:app --reload
   ```

### Backend Won't Start

**Problem**: `ModuleNotFoundError` or import errors

**Solution**:
```bash
# Make sure virtual environment is activated
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows

# Reinstall dependencies
pip install -r requirements.txt
```

### Database Errors

**Problem**: Database connection errors

**Solutions**:

1. **For SQLite** (default):
   ```bash
   # Make sure migrations are run
   alembic upgrade head
   ```

2. **For PostgreSQL**:
   ```bash
   # Make sure PostgreSQL is running
   # Check DATABASE_URL in .env
   # Run migrations
   alembic upgrade head
   ```

### Frontend Won't Start

**Problem**: npm errors

**Solutions**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Or try
npm cache clean --force
npm install
```

### Port Already in Use

**Problem**: Port 8000 or 3000 already in use

**Solutions**:

1. **Find and kill the process**:
   ```bash
   # Linux/Mac
   lsof -ti:8000 | xargs kill -9
   lsof -ti:3000 | xargs kill -9

   # Windows
   netstat -ano | findstr :8000
   taskkill /PID <PID> /F
   ```

2. **Use different ports**:
   ```bash
   # Backend
   uvicorn app.main:app --reload --port 8001

   # Frontend
   PORT=3001 npm start
   ```

## 📝 Development Workflow

### Daily Startup

1. **Start Backend**:
   ```bash
   cd backend
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   uvicorn app.main:app --reload
   ```

2. **Start Frontend** (in new terminal):
   ```bash
   cd frontend
   npm start
   ```

### Making Changes

- **Backend changes**: Server auto-reloads (thanks to `--reload` flag)
- **Frontend changes**: React auto-reloads
- **Database schema changes**: Create and run migrations:
  ```bash
  cd backend
  alembic revision --autogenerate -m "Description of changes"
  alembic upgrade head
  ```

## 🔐 Creating Test Users

### Using the API

1. Go to http://localhost:8000/api/v1/docs
2. Use the `/api/v1/auth/register` endpoint
3. Or use the freemium registration page

### Using Python Shell

```bash
cd backend
python

# In Python shell:
from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

db = SessionLocal()

# Create a teacher user
teacher = User(
    email="teacher@example.com",
    hashed_password=get_password_hash("password123"),
    full_name="Test Teacher",
    role="teacher",
    is_active=True
)
db.add(teacher)
db.commit()
```

## 📊 Accessing Materials Management

1. **Login** as a teacher
2. **Click "Materials"** in the sidebar
3. **Upload materials**:
   - Click "Upload Material" button
   - Drag and drop files or browse
   - Fill in details
   - Click Upload

4. **Organize materials**:
   - Switch to "Folders" tab
   - Create folders
   - Organize materials

5. **View statistics**:
   - Switch to "Statistics" tab
   - See storage usage
   - View popular materials
   - Check recent uploads

## 🎯 Testing the System

### Test Upload

1. Prepare a test PDF file (< 50MB)
2. Go to Materials page
3. Click "Upload Material"
4. Upload the file
5. Verify it appears in the list

### Test Sharing

1. Click on a material
2. Click "Share" button
3. Select share type (e.g., "All Students")
4. Set permissions
5. Click "Share Material"

### Test Folders

1. Go to "Folders" tab
2. Click "New Folder"
3. Enter folder name and color
4. Click "Create Folder"
5. Verify folder appears in the tree

## 🚀 Production Deployment

For production deployment:

1. **Set proper environment variables**:
   ```env
   DEBUG=False
   SECRET_KEY=<strong-random-key>
   DATABASE_URL=<production-database-url>
   ALLOWED_ORIGINS=https://yourdomain.com
   ```

2. **Use production server**:
   ```bash
   # Instead of uvicorn --reload, use:
   gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
   ```

3. **Build frontend**:
   ```bash
   cd frontend
   npm run build
   # Serve the build folder with nginx or similar
   ```

## 📞 Getting Help

If you encounter issues:

1. Check the console for error messages
2. Check backend logs in the terminal
3. Verify all environment variables are set
4. Make sure both servers are running
5. Check the troubleshooting section above

## 🎉 Success!

If everything is working:
- ✅ Backend running on http://localhost:8000
- ✅ Frontend running on http://localhost:3000
- ✅ No CORS errors in console
- ✅ Can login and access Materials page
- ✅ Can upload, view, and manage materials

**You're ready to use the Materials Management System!** 🚀

