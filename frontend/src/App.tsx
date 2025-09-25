
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import RoleBasedLayout from './components/Layout/RoleBasedLayout';
import PlatformAdminRoute from './components/auth/PlatformAdminRoute';
import SchoolRoute from './components/auth/SchoolRoute';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ProfileCompletionCheck from './components/auth/ProfileCompletionCheck';
import LoginPage from './pages/auth/LoginPage';
import SchoolLoginPage from './pages/auth/SchoolLoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import TeacherSetupPage from './pages/auth/TeacherSetupPage';
import FreemiumRegistrationPage from './pages/public/FreemiumRegistrationPage';
import LandingPage from './pages/public/LandingPage';
import TeacherProfileCompletionPage from './pages/teachers/TeacherProfileCompletionPage';
import TeacherDashboardPage from './pages/teachers/TeacherDashboardPage';
import TeacherProfilePage from './pages/teachers/TeacherProfilePage';
import TeacherSubjectsPage from './pages/teachers/TeacherSubjectsPage';
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
import ReportsPage from './pages/reports/ReportsPage';
import SettingsPage from './pages/settings/SettingsPage';
import TermManagementPage from './pages/terms/TermManagementPage';
import LoadingSpinner from './components/ui/LoadingSpinner';
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
      <Routes>
      {/* Public Routes */}
      <Route path="/home" element={<LandingPage />} />
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

      {/* School Routes - Completely Isolated */}
      <Route
        path="/"
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

        {/* Teacher Dashboard */}
        <Route
          path="teacher/dashboard"
          element={
            <SchoolRoute allowedRoles={['teacher']}>
              <TeacherDashboardPage />
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

        {/* Reports */}
        <Route
          path="reports"
          element={
            <SchoolRoute allowedRoles={['school_owner', 'school_admin']}>
              <ReportsPage />
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

        {/* Settings */}
        <Route
          path="settings"
          element={
            <SchoolRoute allowedRoles={['school_owner', 'school_admin']}>
              <SettingsPage />
            </SchoolRoute>
          }
        />

      </Route>
      
      {/* Catch all route */}
      <Route path="*" element={<RoleBasedRedirect />} />
    </Routes>
    </>
  );
}

export default App;
