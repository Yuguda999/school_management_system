
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import RoleBasedLayout from './components/Layout/RoleBasedLayout';
import PlatformAdminRoute from './components/auth/PlatformAdminRoute';
import SchoolRoute from './components/auth/SchoolRoute';
import ProfileCompletionCheck from './components/auth/ProfileCompletionCheck';
import LoginPage from './pages/auth/LoginPage';
import SchoolLoginPage from './pages/auth/SchoolLoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import TeacherSetupPage from './pages/auth/TeacherSetupPage';
import FreemiumRegistrationPage from './pages/public/FreemiumRegistrationPage';
import LandingPage from './pages/public/LandingPage';
import TeacherProfileCompletionPage from './pages/teachers/TeacherProfileCompletionPage';

import TeacherProfilePage from './pages/teachers/TeacherProfilePage';
import TeacherSubjectsPage from './pages/teachers/TeacherSubjectsPage';
import TeacherToolsPage from './pages/teachers/TeacherToolsPage';
import TeacherLessonPlannerPage from './pages/teachers/TeacherLessonPlannerPage';
import AssignmentGeneratorPage from './pages/teachers/AssignmentGeneratorPage';
import RubricBuilderPage from './pages/teachers/RubricBuilderPage';
import ResourceLibraryPage from './pages/teachers/ResourceLibraryPage';
import ClassAttendancePage from './pages/teachers/ClassAttendancePage';
import SubjectAttendancePage from './pages/teachers/SubjectAttendancePage';
import ClassAttendanceRecordsPage from './pages/teachers/ClassAttendanceRecordsPage';
import SubjectAttendanceRecordsPage from './pages/teachers/SubjectAttendanceRecordsPage';

import StudentDashboardPage from './pages/students/StudentDashboardPage';
import StudentGradesPage from './pages/students/StudentGradesPage';
import CBTTestsPage from './pages/cbt/CBTTestsPage';
import CBTTestCreatePage from './pages/cbt/CBTTestCreatePage';
import CBTTestGeneratorPage from './pages/cbt/CBTTestGeneratorPage';
import CBTTestDetailPage from './pages/cbt/CBTTestDetailPage';
import TestSubmissionsPage from './pages/cbt/TestSubmissionsPage';
import SubmissionDetailPage from './pages/cbt/SubmissionDetailPage';
import StudentCBTPage from './pages/cbt/StudentCBTPage';
import StudentTestTakingPage from './pages/cbt/StudentTestTakingPage';
import StudentResultsPage from './pages/cbt/StudentResultsPage';
import StudentFeesPage from './pages/students/StudentFeesPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import StudentsPage from './pages/students/StudentsPage';
import StudentDetailPage from './pages/students/StudentDetailPage';
import TeachersPage from './pages/teachers/TeachersPage';
import TeacherInvitationsPage from './pages/teachers/TeacherInvitationsPage';
import ClassesPage from './pages/classes/ClassesPage';
import SubjectsPageWrapper from './pages/subjects/SubjectsPageWrapper';
import SubjectDetailPage from './pages/subjects/SubjectDetailPage';
import FeesPage from './pages/fees/FeesPage';
import GradesPage from './pages/grades/GradesPage';
import CommunicationPage from './pages/communication/CommunicationPage';
import SettingsPage from './pages/settings/SettingsPage';
import ReportCardTemplatesPage from './pages/templates/ReportCardTemplatesPage';
import TermManagementPage from './pages/terms/TermManagementPage';
import AssetsPage from './pages/assets/AssetsPage';
import LoadingSpinner from './components/ui/LoadingSpinner';
import ActivityLogPage from './pages/settings/ActivityLogPage';
import PlatformAdminPage from './pages/platform/PlatformAdminPage';
import PlatformSchoolsPage from './pages/platform/PlatformSchoolsPage';
import SchoolOwnersPage from './pages/platform/SchoolOwnersPage';
import PlatformAnalyticsPage from './pages/platform/PlatformAnalyticsPage';
import PlatformSettingsPage from './pages/platform/PlatformSettingsPage';
import RoleBasedRedirect from './components/auth/RoleBasedRedirect';

function App() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <NotificationProvider>
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
                <SchoolRoute allowedRoles={['school_owner', 'school_admin']}>
                  <StudentsPage />
                </SchoolRoute>
              }
            />
            <Route
              path="students/:studentId"
              element={
                <SchoolRoute allowedRoles={['school_owner', 'school_admin']}>
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
                <SchoolRoute allowedRoles={['school_owner', 'school_admin']}>
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

            {/* Assets Management */}
            <Route
              path="assets"
              element={
                <SchoolRoute allowedRoles={['school_owner', 'school_admin']}>
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
      </NotificationProvider>
    </>
  );
}

export default App;
