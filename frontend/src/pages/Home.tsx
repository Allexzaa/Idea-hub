import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Redirect to ideas feed if authenticated
    if (isAuthenticated) {
      navigate('/ideas');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to IdeaNest 🪺
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            A safe, warm space where ideas hatch and grow together
          </p>
          <div className="space-x-4">
            <button
              onClick={() => navigate('/register')}
              className="btn-primary"
            >
              Get Started
            </button>
            <button
              onClick={() => navigate('/login')}
              className="btn-ghost"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/ideas')}
              className="btn-ghost"
            >
              Browse Ideas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
