
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import RoleBasedLayout from './components/Layout/RoleBasedLayout';
import PlatformAdminRoute from './components/auth/PlatformAdminRoute';
import SchoolRoute from './components/auth/SchoolRoute';
import ProfileCompletionCheck from './components/auth/ProfileCompletionCheck';
import LoadingSpinner from './components/ui/LoadingSpinner';
import { lazy, Suspense } from 'react';
import ReloadPrompt from './components/pwa/ReloadPrompt';
import RoleBasedRedirect from './components/auth/RoleBasedRedirect';

const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const SchoolLoginPage = lazy(() => import('./pages/auth/SchoolLoginPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const TeacherSetupPage = lazy(() => import('./pages/auth/TeacherSetupPage'));
const FreemiumRegistrationPage = lazy(() => import('./pages/public/FreemiumRegistrationPage'));
const LandingPage = lazy(() => import('./pages/public/LandingPage'));
const TeacherProfileCompletionPage = lazy(() => import('./pages/teachers/TeacherProfileCompletionPage'));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'));
const VerificationPage = lazy(() => import('./pages/public/VerificationPage'));
const VerifyCredentialPage = lazy(() => import('./pages/verify/VerifyCredentialPage'));

const TeacherProfilePage = lazy(() => import('./pages/teachers/TeacherProfilePage'));
const TeacherSubjectsPage = lazy(() => import('./pages/teachers/TeacherSubjectsPage'));
const TeacherToolsPage = lazy(() => import('./pages/teachers/TeacherToolsPage'));
const TeacherLessonPlannerPage = lazy(() => import('./pages/teachers/TeacherLessonPlannerPage'));
const AssignmentGeneratorPage = lazy(() => import('./pages/teachers/AssignmentGeneratorPage'));
const RubricBuilderPage = lazy(() => import('./pages/teachers/RubricBuilderPage'));
const ResourceLibraryPage = lazy(() => import('./pages/teachers/ResourceLibraryPage'));
const ClassAttendancePage = lazy(() => import('./pages/teachers/ClassAttendancePage'));
const SubjectAttendancePage = lazy(() => import('./pages/teachers/SubjectAttendancePage'));
const ClassAttendanceRecordsPage = lazy(() => import('./pages/teachers/ClassAttendanceRecordsPage'));
const SubjectAttendanceRecordsPage = lazy(() => import('./pages/teachers/SubjectAttendanceRecordsPage'));
const MyPermissionsPage = lazy(() => import('./pages/teachers/MyPermissionsPage'));

const StudentDashboardPage = lazy(() => import('./pages/students/StudentDashboardPage'));
const StudentGradesPage = lazy(() => import('./pages/students/StudentGradesPage'));
const StudentCredentialsPage = lazy(() => import('./pages/students/StudentCredentialsPage'));
const CBTTestsPage = lazy(() => import('./pages/cbt/CBTTestsPage'));
const CBTTestCreatePage = lazy(() => import('./pages/cbt/CBTTestCreatePage'));
const CBTTestGeneratorPage = lazy(() => import('./pages/cbt/CBTTestGeneratorPage'));
const CBTTestDetailPage = lazy(() => import('./pages/cbt/CBTTestDetailPage'));
const TestSubmissionsPage = lazy(() => import('./pages/cbt/TestSubmissionsPage'));
const SubmissionDetailPage = lazy(() => import('./pages/cbt/SubmissionDetailPage'));
const StudentCBTPage = lazy(() => import('./pages/cbt/StudentCBTPage'));
const StudentTestTakingPage = lazy(() => import('./pages/cbt/StudentTestTakingPage'));
const StudentResultsPage = lazy(() => import('./pages/cbt/StudentResultsPage'));
const StudentFeesPage = lazy(() => import('./pages/students/StudentFeesPage'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const StudentsPage = lazy(() => import('./pages/students/StudentsPage'));
const StudentDetailPage = lazy(() => import('./pages/students/StudentDetailPage'));
const TeachersPage = lazy(() => import('./pages/teachers/TeachersPage'));
const TeacherInvitationsPage = lazy(() => import('./pages/teachers/TeacherInvitationsPage'));
const ClassesPage = lazy(() => import('./pages/classes/ClassesPage'));
const SubjectsPageWrapper = lazy(() => import('./pages/subjects/SubjectsPageWrapper'));
const SubjectDetailPage = lazy(() => import('./pages/subjects/SubjectDetailPage'));
const FeesPage = lazy(() => import('./pages/fees/FeesPage'));
const GradesPage = lazy(() => import('./pages/grades/GradesPage'));
const CommunicationPage = lazy(() => import('./pages/communication/CommunicationPage'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
const ReportCardTemplatesPage = lazy(() => import('./pages/templates/ReportCardTemplatesPage'));
const TermManagementPage = lazy(() => import('./pages/terms/TermManagementPage'));
const PromotionManagementPage = lazy(() => import('./pages/sessions/PromotionManagementPage'));
const PendingApprovalsPage = lazy(() => import('./pages/sessions/PendingApprovalsPage'));
const SessionManagementPage = lazy(() => import('./pages/sessions/SessionManagementPage'));
const AssetsPage = lazy(() => import('./pages/assets/AssetsPage'));
const ActivityLogPage = lazy(() => import('./pages/settings/ActivityLogPage'));
const TeacherPermissionsPage = lazy(() => import('./pages/settings/TeacherPermissionsPage'));

const PlatformAdminPage = lazy(() => import('./pages/platform/PlatformAdminPage'));
const PlatformSchoolsPage = lazy(() => import('./pages/platform/PlatformSchoolsPage'));
const SchoolOwnersPage = lazy(() => import('./pages/platform/SchoolOwnersPage'));
const PlatformAnalyticsPage = lazy(() => import('./pages/platform/PlatformAnalyticsPage'));
const PlatformSettingsPage = lazy(() => import('./pages/platform/PlatformSettingsPage'));

function App() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <ReloadPrompt />
      <NotificationProvider>
        <Suspense fallback={<div className="h-screen w-full flex items-center justify-center"><LoadingSpinner /></div>}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/:schoolCode/login" element={<SchoolLoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/teacher/accept-invitation" element={<TeacherSetupPage />} />
            <Route path="/teacher/complete-profile" element={<TeacherProfileCompletionPage />} />
            <Route path="/register" element={<FreemiumRegistrationPage />} />
            <Route path="/verify-certificate/:assetId" element={<VerificationPage />} />
            <Route path="/verify" element={<VerifyCredentialPage />} />
            <Route path="/verify/:assetId" element={<VerifyCredentialPage />} />

            {/* Platform Admin Routes - Completely Isolated */}
            <Route
              path="/platform/*"
              element={
                <PlatformAdminRoute>
                  <RoleBasedLayout />
                </PlatformAdminRoute>
              }
            >
              <Route index element={<PlatformAdminPage />} />
              <Route path="schools" element={<PlatformSchoolsPage />} />
              <Route path="school-owners" element={<SchoolOwnersPage />} />
              <Route path="analytics" element={<PlatformAnalyticsPage />} />
              <Route path="settings" element={<PlatformSettingsPage />} />
            </Route>

            {/* Student Public/Auth Routes (not nested under schoolCode) */}
            <Route path="/student/cbt/test/:scheduleId" element={<StudentTestTakingPage />} />

            {/* School Routes - Completely Isolated with School Code */}
            <Route
              path="/:schoolCode"
              element={
                <SchoolRoute>
                  <ProfileCompletionCheck>
                    <RoleBasedLayout />
                  </ProfileCompletionCheck>
                </SchoolRoute>
              }
            >
              <Route index element={<RoleBasedRedirect />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="student/fees" element={<StudentFeesPage />} />



              {/* Student Dashboard */}
              <Route
                path="student/dashboard"
                element={
                  <SchoolRoute allowedRoles={['student']}>
                    <StudentDashboardPage />
                  </SchoolRoute>
                }
              />

              {/* Student Grades */}
              <Route
                path="student/grades"
                element={
                  <SchoolRoute allowedRoles={['student']}>
                    <StudentGradesPage />
                  </SchoolRoute>
                }
              />

              {/* Student Credentials */}
              <Route
                path="student/credentials"
                element={
                  <SchoolRoute allowedRoles={['student']}>
                    <StudentCredentialsPage />
                  </SchoolRoute>
                }
              />

              {/* Teacher Profile */}
              <Route
                path="teacher/profile"
                element={
                  <SchoolRoute allowedRoles={['teacher']}>
                    <TeacherProfilePage />
                  </SchoolRoute>
                }
              />

              {/* Teacher Subjects */}
              <Route
                path="teacher/subjects"
                element={
                  <SchoolRoute allowedRoles={['teacher']}>
                    <TeacherSubjectsPage />
                  </SchoolRoute>
                }
              />



              {/* Teacher Tools */}
              <Route
                path="teacher/tools"
                element={
                  <SchoolRoute allowedRoles={['teacher']}>
                    <TeacherToolsPage />
                  </SchoolRoute>
                }
              />

              {/* Teacher Lesson Planner */}
              <Route
                path="teacher/tools/lesson-planner"
                element={
                  <SchoolRoute allowedRoles={['teacher']}>
                    <TeacherLessonPlannerPage />
                  </SchoolRoute>
                }
              />

              {/* Teacher Assignment Generator */}
              <Route
                path="teacher/tools/assignment-generator"
                element={
                  <SchoolRoute allowedRoles={['teacher']}>
                    <AssignmentGeneratorPage />
                  </SchoolRoute>
                }
              />

              {/* Teacher Rubric Builder */}
              <Route
                path="teacher/tools/rubric-builder"
                element={
                  <SchoolRoute allowedRoles={['teacher']}>
                    <RubricBuilderPage />
                  </SchoolRoute>
                }
              />

              {/* Teacher Resource Library */}
              <Route
                path="teacher/tools/resource-library"
                element={
                  <SchoolRoute allowedRoles={['teacher']}>
                    <ResourceLibraryPage />
                  </SchoolRoute>
                }
              />

              {/* Teacher Attendance */}
              <Route
                path="teacher/attendance/class"
                element={
                  <SchoolRoute allowedRoles={['teacher']}>
                    <ClassAttendancePage />
                  </SchoolRoute>
                }
              />
              <Route
                path="teacher/attendance/subject"
                element={
                  <SchoolRoute allowedRoles={['teacher']}>
                    <SubjectAttendancePage />
                  </SchoolRoute>
                }
              />
              <Route
                path="teacher/attendance/class/records"
                element={
                  <SchoolRoute allowedRoles={['teacher']}>
                    <ClassAttendanceRecordsPage />
                  </SchoolRoute>
                }
              />
              <Route
                path="teacher/attendance/subject/records"
                element={
                  <SchoolRoute allowedRoles={['teacher']}>
                    <SubjectAttendanceRecordsPage />
                  </SchoolRoute>
                }
              />

              {/* CBT - Teacher Routes */}
              <Route
                path="cbt/tests"
                element={
                  <SchoolRoute allowedRoles={['teacher', 'school_admin', 'school_owner']}>
                    <CBTTestsPage />
                  </SchoolRoute>
                }
              />
              <Route
                path="cbt/tests/new"
                element={
                  <SchoolRoute allowedRoles={['teacher', 'school_admin', 'school_owner']}>
                    <CBTTestCreatePage />
                  </SchoolRoute>
                }
              />
              <Route
                path="cbt/tests/generate"
                element={
                  <SchoolRoute allowedRoles={['teacher', 'school_admin', 'school_owner']}>
                    <CBTTestGeneratorPage />
                  </SchoolRoute>
                }
              />
              <Route
                path="cbt/tests/:testId"
                element={
                  <SchoolRoute allowedRoles={['teacher', 'school_admin', 'school_owner']}>
                    <CBTTestDetailPage />
                  </SchoolRoute>
                }
              />
              <Route
                path="cbt/tests/:testId/edit"
                element={
                  <SchoolRoute allowedRoles={['teacher', 'school_admin', 'school_owner']}>
                    <CBTTestCreatePage />
                  </SchoolRoute>
                }
              />
              <Route
                path="cbt/tests/:testId/submissions"
                element={
                  <SchoolRoute allowedRoles={['teacher', 'school_admin', 'school_owner']}>
                    <TestSubmissionsPage />
                  </SchoolRoute>
                }
              />
              <Route
                path="cbt/submissions/:submissionId"
                element={
                  <SchoolRoute allowedRoles={['teacher', 'school_admin', 'school_owner']}>
                    <SubmissionDetailPage />
                  </SchoolRoute>
                }
              />

              {/* CBT - Student Routes */}
              <Route
                path="cbt/student"
                element={
                  <SchoolRoute allowedRoles={['student']}>
                    <StudentCBTPage />
                  </SchoolRoute>
                }
              />

              <Route
                path="cbt/student/results/:submissionId"
                element={
                  <SchoolRoute allowedRoles={['student']}>
                    <StudentResultsPage />
                  </SchoolRoute>
                }
              />

              {/* Student Management */}
              <Route
                path="students"
                element={
                  <SchoolRoute allowedRoles={['school_owner', 'school_admin', 'teacher']} requiredPermission="manage_students">
                    <StudentsPage />
                  </SchoolRoute>
                }
              />
              <Route
                path="students/:studentId"
                element={
                  <SchoolRoute allowedRoles={['school_owner', 'school_admin', 'teacher']} requiredPermission="manage_students">
                    <StudentDetailPage />
                  </SchoolRoute>
                }
              />

              {/* Teacher Management */}
              <Route
                path="teachers"
                element={
                  <SchoolRoute allowedRoles={['school_owner', 'school_admin']}>
                    <TeachersPage />
                  </SchoolRoute>
                }
              />
              <Route
                path="teacher-invitations"
                element={
                  <SchoolRoute allowedRoles={['school_owner', 'school_admin']}>
                    <TeacherInvitationsPage />
                  </SchoolRoute>
                }
              />

              {/* Class Management */}
              <Route
                path="classes"
                element={
                  <SchoolRoute allowedRoles={['school_owner', 'school_admin', 'teacher']}>
                    <ClassesPage />
                  </SchoolRoute>
                }
              />

              {/* Subject Management */}
              <Route
                path="subjects"
                element={
                  <SchoolRoute allowedRoles={['school_owner', 'school_admin', 'teacher']}>
                    <SubjectsPageWrapper />
                  </SchoolRoute>
                }
              />
              <Route
                path="subjects/:subjectId"
                element={
                  <SchoolRoute allowedRoles={['school_owner', 'school_admin']}>
                    <SubjectDetailPage />
                  </SchoolRoute>
                }
              />

              {/* Fee Management */}
              <Route
                path="fees"
                element={
                  <SchoolRoute allowedRoles={['school_owner', 'school_admin', 'teacher']} requiredPermission="manage_fees">
                    <FeesPage />
                  </SchoolRoute>
                }
              />

              {/* Grades */}
              <Route
                path="grades"
                element={
                  <SchoolRoute>
                    <GradesPage />
                  </SchoolRoute>
                }
              />


              {/* Communication */}
              <Route
                path="communication"
                element={
                  <SchoolRoute>
                    <CommunicationPage />
                  </SchoolRoute>
                }
              />

              {/* Terms Management */}
              <Route
                path="terms"
                element={
                  <SchoolRoute allowedRoles={['school_owner', 'school_admin']}>
                    <TermManagementPage />
                  </SchoolRoute>
                }
              />

              {/* Sessions Management */}
              <Route
                path="sessions"
                element={
                  <SchoolRoute allowedRoles={['school_owner', 'school_admin']}>
                    <SessionManagementPage />
                  </SchoolRoute>
                }
              />

              {/* Promotions (accessed from Settings > Academic > Sessions, or by teachers for their class) */}
              <Route
                path="sessions/:sessionId/promotions"
                element={
                  <SchoolRoute allowedRoles={['school_owner', 'school_admin', 'teacher']}>
                    <PromotionManagementPage />
                  </SchoolRoute>
                }
              />

              {/* Pending Promotion Approvals (admin only) */}
              <Route
                path="promotions/pending"
                element={
                  <SchoolRoute allowedRoles={['school_owner', 'school_admin']}>
                    <PendingApprovalsPage />
                  </SchoolRoute>
                }
              />

              {/* Assets Management */}
              <Route
                path="assets"
                element={
                  <SchoolRoute allowedRoles={['school_owner', 'school_admin', 'teacher']} requiredPermission="manage_assets">
                    <AssetsPage />
                  </SchoolRoute>
                }
              />

              {/* Settings */}
              <Route
                path="settings"
                element={
                  <SchoolRoute allowedRoles={['school_owner', 'school_admin']}>
                    <SettingsPage />
                  </SchoolRoute>
                }
              />
              <Route
                path="settings/templates"
                element={
                  <SchoolRoute allowedRoles={['school_owner']}>
                    <ReportCardTemplatesPage />
                  </SchoolRoute>
                }
              />
              <Route
                path="settings/activity-log"
                element={
                  <SchoolRoute allowedRoles={['school_owner', 'school_admin']}>
                    <ActivityLogPage />
                  </SchoolRoute>
                }
              />
              <Route
                path="settings/teacher-permissions"
                element={
                  <SchoolRoute allowedRoles={['school_owner']}>
                    <TeacherPermissionsPage />
                  </SchoolRoute>
                }
              />
              <Route
                path="my-permissions"
                element={
                  <SchoolRoute allowedRoles={['teacher']}>
                    <MyPermissionsPage />
                  </SchoolRoute>
                }
              />

            </Route>

            {/* Full-Screen CBT Test Taking - Outside Layout */}
            <Route
              path="/:schoolCode/cbt/student/take/:submissionId"
              element={
                <SchoolRoute allowedRoles={['student']}>
                  <StudentTestTakingPage />
                </SchoolRoute>
              }
            />

            {/* Catch all route */}
            <Route path="*" element={<RoleBasedRedirect />} />
          </Routes>
        </Suspense>
      </NotificationProvider>
    </>
  );
}

export default App;
