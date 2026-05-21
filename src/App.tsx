import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ProfessorDashboard } from './pages/professor/Dashboard';
import { History } from './pages/professor/History';
import { StudentPage } from './pages/student/StudentPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/professor"
            element={
              <PrivateRoute role="TEACHER">
                <ProfessorDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/professor/historico"
            element={
              <PrivateRoute role="TEACHER">
                <History />
              </PrivateRoute>
            }
          />
          <Route
            path="/aluno"
            element={
              <PrivateRoute role="STUDENT">
                <StudentPage />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
