from fastapi import APIRouter

# Import all endpoint routers
from app.api.v1.endpoints import auth, schools, school_selection, users, classes, subjects, terms, students, fees, grades, communication, academic_sessions, teacher_subjects, dashboard, reports, teacher_invitations, enrollments, platform_admin, documents, public_school, school_validation, report_card_templates, student_portal, teacher_tools, cbt, cbt_schedules, cbt_student, notifications, audit_logs, assets, attendance

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
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])

api_router.include_router(teacher_tools.router, prefix="/teacher/tools", tags=["teacher-tools"])
api_router.include_router(cbt.router, prefix="/cbt", tags=["cbt"])
api_router.include_router(cbt_schedules.router, prefix="/cbt", tags=["cbt-schedules"])
api_router.include_router(cbt_student.router, prefix="/cbt", tags=["cbt-student"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(platform_admin.router, prefix="/platform", tags=["platform-admin"])
api_router.include_router(public_school.router, prefix="/school", tags=["public-school"])
api_router.include_router(school_validation.router, prefix="/validate", tags=["school-validation"])
api_router.include_router(report_card_templates.router, prefix="/templates", tags=["report-card-templates"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(audit_logs.router, prefix="/audit-logs", tags=["audit-logs"])
api_router.include_router(assets.router, prefix="/assets", tags=["assets"])
api_router.include_router(attendance.router, prefix="/attendance", tags=["attendance"])

# School-specific routes with school code
api_router.include_router(students.router, prefix="/school/{school_code}/students", tags=["school-students"])
api_router.include_router(classes.router, prefix="/school/{school_code}/classes", tags=["school-classes"])
api_router.include_router(subjects.router, prefix="/school/{school_code}/subjects", tags=["school-subjects"])
api_router.include_router(teacher_subjects.router, prefix="/school/{school_code}/assignments", tags=["school-teacher-subjects"])
api_router.include_router(enrollments.router, prefix="/school/{school_code}/enrollments", tags=["school-enrollments"])
api_router.include_router(terms.router, prefix="/school/{school_code}/terms", tags=["school-terms"])
api_router.include_router(academic_sessions.router, prefix="/school/{school_code}/academic-sessions", tags=["school-academic-sessions"])
api_router.include_router(fees.router, prefix="/school/{school_code}/fees", tags=["school-fees"])
api_router.include_router(grades.router, prefix="/school/{school_code}/grades", tags=["school-grades"])
api_router.include_router(communication.router, prefix="/school/{school_code}/communication", tags=["school-communication"])
api_router.include_router(teacher_invitations.router, prefix="/school/{school_code}/teacher-invitations", tags=["school-teacher-invitations"])
api_router.include_router(documents.router, prefix="/school/{school_code}/documents", tags=["school-documents"])

api_router.include_router(teacher_tools.router, prefix="/school/{school_code}/teacher/tools", tags=["school-teacher-tools"])
api_router.include_router(cbt.router, prefix="/school/{school_code}/cbt", tags=["school-cbt"])
api_router.include_router(cbt_schedules.router, prefix="/school/{school_code}/cbt", tags=["school-cbt-schedules"])
api_router.include_router(cbt_student.router, prefix="/school/{school_code}/cbt", tags=["school-cbt-student"])
api_router.include_router(dashboard.router, prefix="/school/{school_code}/dashboard", tags=["school-dashboard"])
api_router.include_router(reports.router, prefix="/school/{school_code}/reports", tags=["school-reports"])
api_router.include_router(report_card_templates.router, prefix="/school/{school_code}/templates", tags=["school-report-card-templates"])
api_router.include_router(student_portal.router, prefix="/school/{school_code}/students/me", tags=["school-student-portal"])
api_router.include_router(assets.router, prefix="/school/{school_code}/assets", tags=["school-assets"])
api_router.include_router(attendance.router, prefix="/school/{school_code}/attendance", tags=["school-attendance"])


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
