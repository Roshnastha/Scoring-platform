import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import CandidateListPage from './pages/CandidateListPage';
import CandidateDetailPage from './pages/CandidateDetailPage';
import CreateCandidatePage from './pages/CreateCandidatePage';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-container">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected */}
        <Route
          path="/candidates"
          element={
            <ProtectedRoute>
              <Layout><CandidateListPage /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidates/new"
          element={
            <ProtectedRoute adminOnly>
              <Layout><CreateCandidatePage /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidates/:id"
          element={
            <ProtectedRoute>
              <Layout><CandidateDetailPage /></Layout>
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/candidates" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
