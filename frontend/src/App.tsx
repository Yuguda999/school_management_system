
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ProfileCompletionCheck from './components/auth/ProfileCompletionCheck';
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import TeacherSetupPage from './pages/auth/TeacherSetupPage';
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

function App() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/teacher/accept-invitation" element={<TeacherSetupPage />} />
      <Route path="/teacher/complete-profile" element={<TeacherProfileCompletionPage />} />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <ProfileCompletionCheck>
              <Layout />
            </ProfileCompletionCheck>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />

        {/* Teacher Dashboard */}
        <Route
          path="teacher/dashboard"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Teacher Profile */}
        <Route
          path="teacher/profile"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherProfilePage />
            </ProtectedRoute>
          }
        />
        
        {/* Student Management */}
        <Route path="students" element={<StudentsPage />} />
        <Route path="students/:studentId" element={<StudentDetailPage />} />
        
        {/* Teacher Management */}
        <Route
          path="teachers"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
              <TeachersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="teacher-invitations"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
              <TeacherInvitationsPage />
            </ProtectedRoute>
          }
        />

        {/* Class Management */}
        <Route path="classes" element={<ClassesPage />} />

        {/* Subject Management */}
        <Route
          path="subjects"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher']}>
              <SubjectsPageWrapper />
            </ProtectedRoute>
          }
        />
        <Route
          path="subjects/:subjectId"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
              <SubjectDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Fee Management */}
        <Route
          path="fees"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher']}>
              <FeesPage />
            </ProtectedRoute>
          }
        />
        
        {/* Grades */}
        <Route path="grades" element={<GradesPage />} />
        
        {/* Communication */}
        <Route path="communication" element={<CommunicationPage />} />

        {/* Reports */}
        <Route
          path="reports"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher']}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />

        {/* Terms Management */}
        <Route
          path="terms"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
              <TermManagementPage />
            </ProtectedRoute>
          }
        />

        {/* Settings */}
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
    </>
  );
}

export default App;
