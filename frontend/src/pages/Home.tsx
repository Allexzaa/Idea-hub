import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Home() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) {
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
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary">IdeaNest 🪺</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Hello, {user?.fullName || user?.username}!
              </span>
              <button onClick={handleLogout} className="btn-ghost text-sm">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to your Idea Nest!
          </h2>
          <p className="text-lg text-gray-600">
            Authentication is working! 🎉
          </p>
        </div>

        {/* User Info Card */}
        <div className="max-w-2xl mx-auto card">
          <h3 className="text-xl font-semibold mb-4">Your Profile</h3>
          <div className="space-y-2">
            <p><strong>Name:</strong> {user?.fullName}</p>
            <p><strong>Username:</strong> @{user?.username}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Helpfulness Score:</strong> {user?.helpfulnessScore}</p>
            <p><strong>Email Verified:</strong> {user?.emailVerified ? '✅ Yes' : '❌ No'}</p>
          </div>
        </div>

        <div className="mt-8 text-center text-gray-600">
          <p>Coming soon: Create ideas, spark interest, and nurture collaboration!</p>
        </div>
      </div>
    </div>
  );
}
