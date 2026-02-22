import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Settings from './pages/Settings';

import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import ManageDepartments from './pages/admin/ManageDepartments';
import ManageSubjects from './pages/admin/ManageSubjects';
import Analytics from './pages/admin/Analytics';
import SectionReports from './pages/admin/SectionReports';

import FacultyLayout from './pages/faculty/FacultyLayout';
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import MarkAttendance from './pages/faculty/MarkAttendance';
import ViewAttendance from './pages/faculty/ViewAttendance';

import StudentLayout from './pages/student/StudentLayout';
import StudentDashboard from './pages/student/StudentDashboard';
import MyAttendance from './pages/student/MyAttendance';
import AttendanceCalendar from './pages/student/AttendanceCalendar';
import SubjectDetails from './pages/student/SubjectDetails';

import './index.css';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute roles={['admin']}><AdminLayout /></ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<ManageUsers />} />
            <Route path="departments" element={<ManageDepartments />} />
            <Route path="subjects" element={<ManageSubjects />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="section-reports" element={<SectionReports />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Faculty Routes */}
          <Route path="/faculty" element={
            <ProtectedRoute roles={['faculty']}><FacultyLayout /></ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<FacultyDashboard />} />
            <Route path="mark-attendance" element={<MarkAttendance />} />
            <Route path="view-attendance" element={<ViewAttendance />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Student Routes */}
          <Route path="/student" element={
            <ProtectedRoute roles={['student']}><StudentLayout /></ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="attendance" element={<MyAttendance />} />
            <Route path="calendar" element={<AttendanceCalendar />} />
            <Route path="subject/:subjectId" element={<SubjectDetails />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;