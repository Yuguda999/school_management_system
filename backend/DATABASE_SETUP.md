# Automatic Database Setup and Migration

This School Management System includes automatic database initialization and migration features that eliminate the need for manual database setup.

## 🚀 Quick Start

Simply start the server and everything will be set up automatically:

```bash
cd backend
python start_server.py
```

Or use the regular run script:

```bash
cd backend
python run.py
```

## 🔧 How It Works

### 1. Environment Configuration

The system reads database configuration from your `.env` file:

```env
# Database Configuration
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/database_name
DATABASE_URL_SYNC=postgresql+psycopg2://user:password@localhost:5432/database_name
```

### 2. Automatic Database Initialization

When the server starts, it automatically:

1. **Checks Database Connection**: Verifies that the database is accessible
2. **Detects Database State**: Determines if tables exist and what migrations are needed
3. **Creates Tables**: If the database is empty, creates all tables using SQLAlchemy metadata
4. **Runs Migrations**: Applies any pending Alembic migrations to bring the database up to date
5. **Starts Application**: Once the database is ready, starts the FastAPI server

### 3. Migration Management

The system uses Alembic for database migrations with these features:

- **Automatic Migration Detection**: Compares current database revision with the latest migration
- **Auto-Migration Execution**: Runs pending migrations automatically on startup
- **Fallback Table Creation**: If migrations fail, falls back to direct table creation
- **Environment-Based Configuration**: Database URL is read from environment variables

## 📁 Key Files

### Database Configuration
- `app/core/config.py` - Application settings and environment variable handling
- `app/core/database.py` - Database engine and session configuration
- `app/core/database_init.py` - Automatic database initialization logic

### Migration Configuration
- `alembic.ini` - Alembic configuration (reads URL from environment)
- `alembic/env.py` - Migration environment setup
- `alembic/versions/` - Migration files directory

### Application Startup
- `app/main.py` - FastAPI application with startup event handlers
- `run.py` - Simple development server runner
- `start_server.py` - Enhanced startup script with detailed logging

## 🛠️ Manual Migration Commands

While the system handles migrations automatically, you can still run manual commands:

```bash
# Create a new migration
alembic revision --autogenerate -m "description of changes"

# Apply migrations manually
alembic upgrade head

# Check current migration status
alembic current

# View migration history
alembic history
```

## 🔍 Database URL Configuration

The system supports both async and sync database URLs:

- `DATABASE_URL`: Used for async operations (FastAPI endpoints)
- `DATABASE_URL_SYNC`: Used for sync operations (Alembic migrations)

### Supported Database Drivers

**PostgreSQL (Recommended)**:
```env
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/dbname
DATABASE_URL_SYNC=postgresql+psycopg2://user:pass@localhost:5432/dbname
```

**SQLite (Development)**:
```env
DATABASE_URL=sqlite+aiosqlite:///./database.db
DATABASE_URL_SYNC=sqlite:///./database.db
```

## 🚨 Error Handling

The system includes comprehensive error handling:

1. **Connection Failures**: Clear error messages if database is unreachable
2. **Migration Errors**: Automatic fallback to direct table creation
3. **Environment Issues**: Validation of required environment variables
4. **Startup Failures**: Detailed logging of initialization problems

## 📊 Logging

The system provides detailed logging during initialization:

```
2025-09-15 20:12:37,201 - app.main - INFO - Starting up School Management System...
2025-09-15 20:12:37,245 - app.core.database_init - INFO - Database appears to be initialized with 23 tables
2025-09-15 20:12:37,279 - alembic.runtime.migration - INFO - Context impl PostgresqlImpl.
2025-09-15 20:12:37,296 - app.main - INFO - Database initialization completed
```

## 🔄 Development Workflow

1. **First Time Setup**: Just run the server - tables will be created automatically
2. **Model Changes**: Create migrations with `alembic revision --autogenerate`
3. **Server Restart**: Migrations are applied automatically on next startup
4. **Production Deployment**: Same process - no manual intervention needed

## 🛡️ Production Considerations

- Ensure database credentials are properly secured
- Consider running migrations in a separate deployment step for large databases
- Monitor startup logs for any initialization issues
- Use connection pooling for high-traffic applications

## 📚 API Documentation

Once the server is running, access the interactive API documentation at:
- Swagger UI: http://localhost:8000/api/v1/docs
- ReDoc: http://localhost:8000/api/v1/redoc
