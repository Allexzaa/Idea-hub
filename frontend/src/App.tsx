import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import IdeasFeed from './pages/IdeasFeed';
import IdeaDetail from './pages/IdeaDetail';
import CreateIdea from './pages/CreateIdea';
import EditIdea from './pages/EditIdea';

// Protected route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  const { isAuthenticated, isLoading, loadFromStorage } = useAuthStore();

  useEffect(() => {
    // Load auth state from localStorage on app start
    loadFromStorage();
  }, [loadFromStorage]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes without layout */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/ideas" /> : <Login />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/ideas" /> : <Register />}
        />

        {/* Routes with layout */}
        <Route
          path="/"
          element={
            <Layout>
              <Home />
            </Layout>
          }
        />
        <Route
          path="/ideas"
          element={
            <Layout>
              <IdeasFeed />
            </Layout>
          }
        />
        <Route
          path="/ideas/new"
          element={
            <Layout>
              <ProtectedRoute>
                <CreateIdea />
              </ProtectedRoute>
            </Layout>
          }
        />
        <Route
          path="/ideas/:id/edit"
          element={
            <Layout>
              <ProtectedRoute>
                <EditIdea />
              </ProtectedRoute>
            </Layout>
          }
        />
        <Route
          path="/ideas/:id"
          element={
            <Layout>
              <IdeaDetail />
            </Layout>
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
