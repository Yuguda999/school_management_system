from fastapi import APIRouter

# Import all endpoint routers
from app.api.v1.endpoints import auth, schools, school_selection, users, classes, subjects, terms, students, fees, grades, communication, academic_sessions, teacher_subjects, dashboard, reports, teacher_invitations, enrollments, platform_admin

api_router = APIRouter()

# Include all routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(schools.router, prefix="/schools", tags=["schools"])
api_router.include_router(school_selection.router, prefix="/school-selection", tags=["school-selection"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(students.router, prefix="/students", tags=["students"])
api_router.include_router(classes.router, prefix="/classes", tags=["classes"])
api_router.include_router(subjects.router, prefix="/subjects", tags=["subjects"])
api_router.include_router(teacher_subjects.router, prefix="/assignments", tags=["teacher-subjects"])
api_router.include_router(enrollments.router, prefix="/enrollments", tags=["enrollments"])
api_router.include_router(terms.router, prefix="/terms", tags=["terms"])
api_router.include_router(academic_sessions.router, prefix="/academic-sessions", tags=["academic-sessions"])
api_router.include_router(fees.router, prefix="/fees", tags=["fees"])
api_router.include_router(grades.router, prefix="/grades", tags=["grades"])
api_router.include_router(communication.router, prefix="/communication", tags=["communication"])
api_router.include_router(teacher_invitations.router, prefix="/teacher-invitations", tags=["teacher-invitations"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(platform_admin.router, prefix="/platform", tags=["platform-admin"])


@api_router.get("/")
async def api_info():
    return {
        "message": "School Management System API v1",
        "endpoints": {
            "docs": "/api/v1/docs",
            "redoc": "/api/v1/redoc",
            "openapi": "/api/v1/openapi.json"
        }
    }
