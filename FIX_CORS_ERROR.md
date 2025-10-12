# 🔧 Fix CORS Error - Quick Guide

## The Problem

You're seeing this error in the browser console:

```
Access to XMLHttpRequest at 'http://localhost:8000/api/v1/materials/stats/quota' 
from origin 'http://localhost:3000' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## The Cause

**The backend server is not running!** 

The frontend (React app on port 3000) is trying to connect to the backend (FastAPI on port 8000), but the backend server is not started.

## The Solution

### Step 1: Open a New Terminal

Keep your current terminal (with frontend) running and open a **new terminal window**.

### Step 2: Navigate to Backend Directory

```bash
cd /home/commanderzero/Desktop/Development/school_management_system/backend
```

### Step 3: Activate Virtual Environment

```bash
source venv/bin/activate
```

You should see `(venv)` appear in your terminal prompt.

### Step 4: Start the Backend Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Step 5: Verify Backend is Running

You should see output like this:

```
INFO:     Will watch for changes in these directories: ['/home/commanderzero/Desktop/Development/school_management_system/backend']
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [12345] using StatReload
INFO:     Started server process [12346]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### Step 6: Test Backend

Open your browser and go to:
- http://localhost:8000/api/v1/docs

You should see the Swagger API documentation.

### Step 7: Refresh Frontend

Go back to your frontend (http://localhost:3000) and refresh the page.

**The CORS error should be gone!** ✅

## Quick Commands Summary

```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload

# Terminal 2 - Frontend (already running)
cd frontend
npm start
```

## Verification Checklist

- ✅ Backend terminal shows "Application startup complete"
- ✅ Can access http://localhost:8000/api/v1/docs
- ✅ Frontend shows no CORS errors in console (F12)
- ✅ Can login and access Materials page
- ✅ Statistics load without errors

## Still Having Issues?

### Issue 1: Virtual Environment Not Found

**Error**: `source: venv/bin/activate: No such file or directory`

**Solution**: Create the virtual environment first:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Issue 2: Module Not Found Errors

**Error**: `ModuleNotFoundError: No module named 'fastapi'`

**Solution**: Install dependencies:
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

### Issue 3: Port 8000 Already in Use

**Error**: `ERROR: [Errno 98] Address already in use`

**Solution**: Kill the process using port 8000:
```bash
# Find the process
lsof -ti:8000

# Kill it
lsof -ti:8000 | xargs kill -9

# Or use a different port
uvicorn app.main:app --reload --port 8001
```

### Issue 4: Database Errors

**Error**: Database connection or migration errors

**Solution**: Run migrations:
```bash
cd backend
source venv/bin/activate
alembic upgrade head
```

## Complete Startup Process

### First Time Setup

```bash
# 1. Backend Setup
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head

# 2. Frontend Setup
cd ../frontend
npm install

# 3. Start Backend
cd ../backend
source venv/bin/activate
uvicorn app.main:app --reload

# 4. Start Frontend (in new terminal)
cd frontend
npm start
```

### Daily Startup

```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd frontend
npm start
```

## What Should Be Running

You should have **TWO terminal windows**:

### Terminal 1: Backend
```
(venv) user@computer:~/school_management_system/backend$ uvicorn app.main:app --reload
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [12345] using StatReload
INFO:     Started server process [12346]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### Terminal 2: Frontend
```
user@computer:~/school_management_system/frontend$ npm start

Compiled successfully!

You can now view school-management-frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.1.100:3000

Note that the development build is not optimized.
To create a production build, use npm run build.

webpack compiled successfully
```

## Testing the Fix

1. **Open browser** to http://localhost:3000
2. **Open DevTools** (F12)
3. **Go to Console tab**
4. **Login** as a teacher
5. **Click "Materials"** in sidebar
6. **Check console** - should see NO CORS errors
7. **Statistics should load** without errors

## Success Indicators

✅ No red errors in console  
✅ Backend terminal shows API requests  
✅ Materials page loads  
✅ Statistics show data  
✅ Can upload materials  

## Need More Help?

See the complete guides:
- `STARTUP_GUIDE.md` - Full startup instructions
- `MATERIALS_MANAGEMENT_README.md` - Technical documentation
- `TEACHER_MATERIALS_GUIDE.md` - User guide

## Quick Reference

| What | Where | Command |
|------|-------|---------|
| Backend API Docs | http://localhost:8000/api/v1/docs | - |
| Frontend App | http://localhost:3000 | - |
| Start Backend | backend/ | `uvicorn app.main:app --reload` |
| Start Frontend | frontend/ | `npm start` |
| Activate venv | backend/ | `source venv/bin/activate` |
| Run Migrations | backend/ | `alembic upgrade head` |

---

**TL;DR**: Start the backend server with `uvicorn app.main:app --reload` in the backend directory! 🚀

