import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import CandidateListPage from './pages/CandidateListPage';
import CandidateDetailPage from './pages/CandidateDetailPage';
import CreateCandidatePage from './pages/CreateCandidatePage';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto min-w-0">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

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

        <Route path="*" element={<Navigate to="/candidates" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
