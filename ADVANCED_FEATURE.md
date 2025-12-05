Features for School Owners / Administrators
1. Executive School Analytics Dashboard 2.0
Name & description
Executive School Analytics Dashboard 2.0 – a richer, admin-only dashboard with drill-down views on enrollment, academics, attendance, finance, and teacher performance, across terms and classes.
Problem it solves
Today, DashboardService.get_dashboard_data and DashboardPage.tsx give a good overview but limited drill-down. Owners need actionable insights (e.g., “Which classes are underperforming?”, “Which term had the biggest drop in attendance?”) without manually jumping between multiple reports.
Key functionality & workflow
Admin lands on dashboard → sees high-level cards (students, teachers, classes, revenue, attendance rate).
Can filter by term, class, grade level.
Click on a card (e.g., “Attendance 82%”) to open a drill-down panel:
Per-class attendance distribution.
List of classes below a threshold.
Similar drill-downs for performance (grades), fees, teacher workload.
Links from widgets directly into detailed ReportsPage tabs (students, financial, academic).
Integration with existing code
Backend:
Extend  backend/app/services/dashboard_service.py:
Enrich DashboardStats and DashboardData with per-class and per-grade breakdowns.
Extend backend/app/api/v1/endpoints/reports.py:
Either expand /dashboard//dashboard/data to accept more filters or add endpoints like:
GET /api/v1/reports/dashboard/details?metric=attendance&class_id=...
Frontend:
frontend/src/pages/dashboard/DashboardPage.tsx:
Add admin-only “drill-down” panels and modals.
Reuse and extend charts (EnrollmentChart, RevenueChart) and add new small charts/cards under frontend/src/components/reports or components/dashboard.
Technical approach
API / services
Extend DashboardData Pydantic schema to include:
class_level_stats: list[ClassStats]
attendance_by_class, performance_by_class, etc.
Add methods in DashboardService to compute per-class aggregates by joining:
Student, Class, Grade, Attendance, FeePayment.
DB
Mostly read-only aggregates on existing models; ensure proper indexes on school_id, term_id, class_id.
Frontend
Add filter state (term, class, range) in DashboardPage.
Implement chart cards and modals using existing Tailwind and chart components.
Security
Keep route guarded with require_teacher_or_admin_user() but UI only exposes advanced panes to admin roles.
Priority
Impact: Very High (centralizes value for owners).
Complexity: Medium.
Priority: P1.
2. Enrollment & Cohort Trends Explorer
Name & description
Enrollment & Cohort Trends Explorer – a dedicated reports view for tracking student enrollment growth, retention, and churn across terms/years and classes.
Problem it solves
Owners can see current counts, but not “how did we get here?” – they need to understand recruitment and retention trends (e.g., “What’s our JSS1→JSS2 retention rate year over year?”).
Key functionality & workflow
Admin goes to Reports → Students / Enrollment Trends.
Selects time range, grade band, and optionally a cohort (e.g., entry year).
Sees:
Enrollment over time (line chart).
New vs returning students.
Cohort survival curves (how many from a given intake remain over time).
Can export as CSV/PDF.
Integration with existing code
Backend:
Use Student, Enrollment, Term, Class from backend/app/models.
Add EnrollmentAnalyticsService or extend DashboardService with:
get_enrollment_trend_by_grade, get_cohort_retention.
New endpoints in  backend/app/api/v1/endpoints/reports.py:
GET /api/v1/reports/enrollment-trends
GET /api/v1/reports/cohort-retention
Frontend:
Add a new section under ReportsPage.tsx (e.g., extend StudentReports or add an EnrollmentReports component).
Use charts similar to EnrollmentChart.
Technical approach
API / schemas
Define Pydantic response structures:
EnrollmentTrendPoint { date, total, new_students, returning_students }
CohortRetentionPoint { period_label, retained_count, retention_percentage }.
DB
Use Student.admission_date, StudentClassHistory / Enrollment to calculate transitions.
Frontend
React hooks to call new /reports endpoints.
Chart components using existing chart lib (same style as current dashboard charts).
Security
Guard with require_school_admin() or require_school_owner().
Priority
Impact: High.
Complexity: Medium.
Priority: P1–P2 (after Executive Dashboard).
3. Fees & Financial Performance Analytics
Name & description
Fees & Financial Performance Analytics – deeper financial reports for collections, outstanding balances, and revenue trends.
Problem it solves
Current DashboardService.get_revenue_data gives some stats but doesn’t answer questions like “Which classes owe the most?”, “What’s our collection rate by term?”, or “Which fee types underperform?”.
Key functionality & workflow
Owners/finance admins go to Reports → Financial.
Filters: term, class, fee type, payment status.
Views:
Overall revenue vs target per term.
Aging buckets for outstanding fees (0–30d, 31–60d, etc.).
Top N classes by outstanding balance.
Export lists for follow-up.
Integration with existing code
Backend:
Use FeePayment, FeeAssignment, and existing revenue logic in DashboardService.
Extend FinancialReports APIs or add:
GET /api/v1/reports/fees/summary
GET /api/v1/reports/fees/outstanding
Frontend:
Extend frontend/src/pages/reports/ReportsPage.tsx → FinancialReports with new charts and tables.
Reuse RevenueChart for more granular breakdowns.
Technical approach
API / services
New methods in a FinanceAnalyticsService or DashboardService:
Aggregations grouped by term_id, class_id, fee_type.
DB
Ensure indexes on (school_id, term_id, status) for payments.
Frontend
Financial summary cards + charts (bar charts for revenue by term, pie for paid vs unpaid).
Security
Guard endpoints with require_school_admin() and optionally fine-grain via SchoolOwnership.can_manage_billing.
Priority
Impact: High (directly tied to cashflow).
Complexity: Medium.
Priority: P1.
4. Teacher Performance & Workload Insights
Name & description
Teacher Performance & Workload Insights – analytics around each teacher’s teaching load and impact, combining classes, grades, attendance, and CBT usage.
Problem it solves
Owners lack a consolidated view of who is overloaded, which teachers’ students are struggling, or which teachers are underutilizing tools like CBT/assignments.
Key functionality & workflow
Admin opens Reports → Teachers.
For each teacher:
Number of classes and students.
Average student grade per subject/class.
Attendance levels in their classes.
Use of CBT tests and assignment generator.
Identify outliers (e.g., classes with consistently low performance) and rebalance workload.
Integration with existing code
Backend:
Use User (role=TEACHER), Class, Enrollment, Grade, Attendance, CBTTest, CBTSubmission.
New TeacherAnalyticsService with APIs:
GET /api/v1/reports/teachers/performance
Frontend:
New TeacherReports component under ReportsPage.tsx.
Optionally a summary widget on main DashboardPage for admins.
Technical approach
API / services
Aggregated queries grouped by teacher_id.
Careful performance tuning (e.g., using selectinload or pre-aggregated views if needed).
Frontend
Table with sortable columns (load, average grade, attendance).
Small trend spark-lines per teacher.
Security
Admin-only (require_school_admin() / require_school_owner()).
Priority
Impact: High.
Complexity: High (cross-cutting many models).
Priority: P2 (after core dashboards & finance).
5. Automated Reporting & Alert Rules
Name & description
Automated Reporting & Alert Rules – configurable daily/weekly digests and threshold-based alerts (email + in-app) for key metrics.
Problem it solves
Owners and admins must manually check dashboards. They need proactive notifications (e.g., “attendance below 80% for three days”, “Class JSS2A math pass rate < 50%”).
Key functionality & workflow
Admin defines alert rules (metric, filter, threshold, frequency, channels).
System periodically evaluates rules and:
Sends summary emails.
Adds in-app notifications.
“Reports” tab to download scheduled PDFs/CSVs (e.g., weekly academic & financial summary).
Integration with existing code
Backend:
Leverage existing DashboardService/analytics methods.
Use existing SMTP/mail configuration (see EMAIL_SMTP_FIX.md).
Frontend:
New “Alerts & Schedules” section under admin settings or reports.
Technical approach
DB
New models extending TenantBaseModel:
AlertRule (metric, filters JSON, threshold, operator, frequency, channels, created_by, school_id).
AlertNotification (rule_id, status, last_triggered_at, payload_snapshot).
API
CRUD for rules under /api/v1/admin/alerts.
Execution
Start simple: an endpoint POST /api/v1/admin/alerts/run invoked by an external cron (or later integrate Celery/APS).
This endpoint loops through active rules and evaluates them via dashboard/analytics services.
Security
Restricted to school owners/admins; data always filtered by  school_id.
Priority
Impact: Very High (drives daily value).
Complexity: High (scheduler + config UI).
Priority: P2–P3 (phase after analytics foundation).
Features for Teachers
6. Class Performance Insights Panel (Per-Class Analytics)
Name & description
Class Performance Insights Panel – a teacher-centric view of academic and attendance metrics for each class they teach.
Problem it solves
Teachers currently see grades and maybe some stats, but not a single place to answer: “Which students are at risk in this class?”, “How is attendance affecting performance?”
Key functionality & workflow
From Teacher Dashboard or Class Details, teacher opens “Insights”.
For the selected class:
Grade distribution by subject and exam type.
Attendance rates and trend line.
List of at-risk students (low grades, poor attendance).
Quick actions: send message to selected students/parents, schedule a CBT retest, create targeted assignments via AI generator.
Integration with existing code
Backend:
Use GradeService + Grade models, Attendance, CBTSubmission, Enrollment.
Likely add methods to DashboardService or a new ClassAnalyticsService.
Frontend:
A new component (e.g., ClassInsightsPanel) shown from teacher views.
Data fetched via new /api/v1/reports/classes/{class_id}/insights.
Technical approach
API
GET /api/v1/reports/classes/{class_id}/insights guarded by require_teacher(); ensure teacher teaches that class.
Pydantic response: grade histogram, attendance summary, risk list.
Frontend
Chart components for distribution + lists with filters.
Security
Enforce class-level access checks in service or dependency layer.
Priority
Impact: Very High (directly improves teaching decisions).
Complexity: Medium.
Priority: P1 for teachers.
7. Curriculum Coverage & Lesson Plan Tracker
Name & description
Curriculum Coverage & Lesson Plan Tracker – structured tracking of syllabus coverage linked to your existing lesson planner/AI tools.
Problem it solves
The lesson planner and AI tools help create lessons, but teachers need visibility on coverage vs plan: “How much of the term’s curriculum have we actually covered?” and “Which topics are behind schedule?”
Key functionality & workflow
For each subject + class, teacher sees:
Planned topics (from curriculum/lesson plans).
Coverage percentage.
Overdue/uncovered topics.
When a lesson is delivered (e.g., marking a lesson as “taught”), coverage auto-updates.
Insights: suggestions of which topics to prioritize next.
Integration with existing code
Backend:
Build on lesson planner endpoints described in docs (LESSON_PLANNER_IMPLEMENTATION.md, gemini_service suggestions).
Frontend:
Extend teacher’s lesson planner pages with a “Coverage” tab and progress bars per topic.
Technical approach
DB
Table(s) for CurriculumUnit and LessonPlanItem if not yet present, tied to Subject, Class, Term, school_id.
coverage_status fields (planned, in_progress, completed).
API
Endpoints:
GET /api/v1/teacher/curriculum/{class_id}/{subject_id}
PATCH /api/v1/teacher/lessons/{lesson_id}/status
AI integration
When AI generates lesson plans, tag them with curriculum units so coverage views stay in sync.
Security
require_teacher() with class/subject authorization.
Priority
Impact: High.
Complexity: Medium–High (data model + UI).
Priority: P2.
8. Unified Assessment & Gradebook Automation
Name & description
Unified Assessment & Gradebook Automation – a single gradebook per class where CBT scores, manual assignments, and exams auto-flow into final grades based on templates.
Problem it solves
Teachers juggle CBT results, manual grading, and term exams separately. This increases admin work and error risk in calculating term grades.
Key functionality & workflow
Teacher defines or selects a grade template (e.g., First CA 20%, Second CA 20%, Exam 60%).
CBT tests and assignments are mapped to components (e.g., Test 1 → First CA).
Gradebook view auto-calculates percentages and letter grades using existing GradeTemplate logic.
One-click “publish grades” pushes results into official Grade records and report cards.
Integration with existing code
Backend:
Strong reuse of GradeTemplate model (backend/app/models/grade_template.py) and GradeService.
Use CBTSubmission, AI-generated assignments, and Grade to populate data.
Frontend:
A “Gradebook” view under teacher’s menu.
Integrate with CBT pages and assignment tools so they can be mapped to grade components.
Technical approach
DB
Ensure GradeTemplate is connected to classes/subjects.
Possibly a mapping table: AssessmentComponentMapping(assessment_id, component_name, weight, class_id, subject_id).
API
Endpoints to:
Manage mappings and templates per class.
Fetch gradebook data (students x components) with calculated totals.
Logic
Centralize calculation in GradeService to avoid duplicate weighting logic.
Security
require_teacher_only() ensuring teachers can only manage their classes.
Priority
Impact: Very High (saves time, reduces errors).
Complexity: High (data & UI heavy).
Priority: P1–P2.
9. Communication & Engagement Center
Name & description
Communication & Engagement Center – a unified place for teachers to message students/parents and share announcements tied to classes and performance.
Problem it solves
There is messaging support (sent_messages/received_messages on User), but teachers need structured flows: “Notify all parents of students failing maths in JSS2A”, “Share recap and materials after a test.”
Key functionality & workflow
Teacher picks a class or group filter (e.g., “students below 50% in last exam”) and composes:
In-app message.
Email (if configured).
Templates for common scenarios: “Upcoming test”, “Low attendance warning”.
Conversation view per student/parent.
Integration with existing code
Backend:
Extend messaging endpoints around the Message model (not yet inspected, but referenced on User).
Optionally reuse analytics endpoints to build recipient lists.
Frontend:
New “Communication” tab in teacher UI distinct from admin “Communication/Announcements” view.
Technical approach
DB
Reuse Message table; add context fields (class_id, subject_id, metric_triggered).
API
Bulk messaging endpoint that filters recipients via analytics criteria.
Security
Teachers only allowed to message students/parents in their classes.
Privacy
No sharing of other students’ names or grades; filters are internal only.
Priority
Impact: High.
Complexity: Medium.
Priority: P2.
10. Smart Resource Library & AI Search
Name & description
Smart Resource Library & AI Search – richer organization and discovery over the existing folder/materials system and AI assignment generator.
Problem it solves
You already have materials/folders and AI-generated assignments, but as content grows, teachers need fast retrieval, tagging, and reuse across classes/terms.
Key functionality & workflow
Tag resources by class, subject, topic, difficulty, exam type.
AI-assisted search: “Find all JSS2 algebra practice worksheets”.
Suggest related materials when planning lessons or creating assignments.
Integration with existing code
Backend:
Build on materials and folder APIs (per MATERIALS_MANAGEMENT_README.md, FOLDER_SYSTEM_IMPLEMENTATION.md).
Reuse Gemini integration to power semantic search prompts (without storing student data).
Frontend:
Enhance teacher materials UI plus assignment generator save flows (assignmentGeneratorService.saveAssignment).
Technical approach
DB
Add tagging tables or JSON field for tags/metadata on materials.
API
Endpoints to search by tags/keywords.
AI
For semantic search, call Gemini with teacher query + metadata (respecting preference not to store uploaded files locally).
Security
All materials strictly scoped by school_id and teacher permissions.
Priority
Impact: Medium–High (especially as content grows).
Complexity: Medium–High.
Priority: P3.
Features for Students
11. Enhanced Personal Analytics Dashboard
Name & description
Enhanced Personal Analytics Dashboard – a richer student dashboard with multi-term performance trends, subject strengths/weaknesses, and attendance insights.
Problem it solves
StudentDashboardPage.tsx already shows overall average and some trends, but students need more granular, actionable insight: “Which subjects am I improving in?”, “How did I do per term?”
Key functionality & workflow
Student dashboard shows:
Grade trend line across terms.
Subject-wise cards (average, trend, last exam score).
Attendance summary and its correlation with performance.
Simple explanations (“Your maths scores improved by 8% this term”).
Integration with existing code
Backend:
Extend student-specific grade/analytics endpoints (using StudentGradesSummary, GradeService, Attendance).
Frontend:
Enhance StudentDashboardPage.tsx to use richer analytics data rather than fixed trends structure.
Technical approach
API
New endpoint GET /api/v1/student/analytics guarded by require_student(), returning per-student PerformanceTrends.
Frontend
Charts & cards, reusing visual style of main dashboards.
Security
Filter strictly by authenticated student’s user_id /  student_id; no access to other students’ data.
Priority
Impact: High (student motivation & transparency).
Complexity: Medium.
Priority: P1 for students.
12. Assignment & Deadline Planner
Name & description
Assignment & Deadline Planner – a unified calendar/list of all upcoming CBTs, assignments, and key school deadlines.
Problem it solves
Students currently navigate separate areas (“My Tests”, “My Grades”) but need a single source of truth for upcoming tasks with reminders.
Key functionality & workflow
Student sees a calendar + list of:
CBT schedules (from CBTTestSchedule).
Assignment due dates (from assignment models).
Important school events (exams, holidays if available).
Can filter by subject and mark items as “planned”, “in progress”, “completed”.
Integration with existing code
Backend:
Reuse CBT scheduling in backend/app/api/v1/endpoints/cbt.py.
Add endpoints to fetch student-specific schedule:
GET /api/v1/student/tasks
Frontend:
New StudentTasksPage and/or section on StudentDashboardPage linked from “Assignments & Deadlines”.
Technical approach
DB
Ensure assignments and CBT tests have explicit due dates and class_id.
API
Aggregate tasks from multiple sources in one response (CBT schedules, assignments).
Frontend
Calendar component + list with status toggles stored per student (e.g., local state + backend field).
Security
Only show tasks for the logged-in student based on class enrollments.
Priority
Impact: High.
Complexity: Medium.
Priority: P1–P2.
13. Goal Setting & Progress Tracker
Name & description
Goal Setting & Progress Tracker – students set personal goals (e.g., “Maths ≥ 75% this term”) and track progress against them.
Problem it solves
Analytics tell students how they did, but not whether they are on track for self-defined targets, which is key for motivation.
Key functionality & workflow
Student defines per-subject or overall goals per term.
Dashboard shows:
Current vs target.
Simple progress indicators (e.g., “You’re 10% below your goal in Science.”).
Integration with existing code
Backend:
Use existing grade analytics to measure progress to goals.
Frontend:
Add “Goals” section to StudentDashboardPage or a dedicated page.
Technical approach
DB
New StudentGoal model (extending TenantBaseModel): student_id, subject_id (optional), term_id, target_percentage, created_by.
API
CRUD endpoints under /api/v1/student/goals, guarded by require_student().
Frontend
Simple forms and progress widgets.
Priority
Impact: Medium–High.
Complexity: Low–Medium.
Priority: P2.
14. Smart Study Recommendations & Resource Suggestions
Name & description
Smart Study Recommendations & Resource Suggestions – AI-driven hints on what to study next and which resources to use, based on performance.
Problem it solves
Students see grades but often don’t know what to do to improve. With your AI + materials infrastructure, you can bridge analytics and action.
Key functionality & workflow
Under each subject card on student dashboard:
“View Recommendations” button.
Recommendations include:
Priority topics.
Suggested materials in the school’s resource library.
Personalized study tips.
Integration with existing code
Backend:
Use GeminiService (generate_assignment_stream and related methods) to generate recommendations from summarized performance.
Frontend:
New component on StudentDashboardPage or a modal with recommendations.
Technical approach
API
POST /api/v1/student/recommendations:
Input: student_id inferred from token, optional subject.
Backend composes a prompt summarizing:
Recent grades, weak areas.
Available materials metadata (no file content unless on-demand).
Sends to Gemini (respecting your preference: no long-term storage of files; direct upload if needed then deletion after).
Security & privacy
Only student sees their recommendations.
Prompts avoid including other students’ data.
Performance
Cache last recommendations per subject to avoid excessive AI calls.
Priority
Impact: High (differentiating feature).
Complexity: Medium–High (AI + analytics + materials).
Priority: P2–P3.
15. Class Benchmark & Insights (Privacy-Preserving)
Name & description
Class Benchmark & Insights – show students how they compare to anonymized class averages and distributions.
Problem it solves
Students often don’t know if a grade is “good” in context. Benchmarks provide perspective without exposing classmates’ identities.
Key functionality & workflow
On grade views, student sees:
Their score vs class average and highest/lowest (no names).
Simple distribution graph (e.g., bar chart of score bands).
Textual explanation: “You’re in the top 25% of your class for English.”
Integration with existing code
Backend:
Leverage GradeService and class-level stats already used in dashboards.
Frontend:
Enhance student grade pages (/student/grades) and StudentDashboard subject cards.
Technical approach
API
GET /api/v1/student/grade-benchmarks?subject_id=...&exam_id=... returning anonymized stats only.
Security
No per-student data in responses other than the requesting student.
Frontend
Simple charts (e.g., small histogram) alongside grade details.
Priority
Impact: Medium.
Complexity: Medium.
Priority: P3.
Suggested overall sequencing
If you want a pragmatic roadmap aligned with impact vs effort:

P1 (foundation, high ROI)
Executive School Analytics Dashboard 2.0 (Admins).
Fees & Financial Performance Analytics (Admins).
Class Performance Insights Panel (Teachers).
Enhanced Personal Analytics Dashboard (Students).
Assignment & Deadline Planner (Students).
P2 (round out experience)
Enrollment & Cohort Trends Explorer.
Unified Assessment & Gradebook Automation.
Curriculum Coverage & Lesson Plan Tracker.
Teacher Performance & Workload Insights.
Goal Setting & Progress Tracker.
Communication & Engagement Center.
Smart Study Recommendations.
P3 (nice-to-haves / advanced)
Automated Reporting & Alert Rules.
Smart Resource Library & AI Search.
Class Benchmark & Insights.



