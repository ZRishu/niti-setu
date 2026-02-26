import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login as apiLogin } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, ArrowLeft, Key } from 'lucide-react';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminSecret, setAdminSecret] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiLogin({ email, password, adminSecret });
      if (response.success) {
        login(response.user, response.token);
        if (response.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          setError('Verification failed. Role not upgraded.');
        }
      } else {
        setError(response.error || 'Failed to verify admin status');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred during verification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-indigo-50">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 mb-4">
            <ShieldCheck className="h-6 w-6 text-indigo-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">
            Admin Verification
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Enter your credentials and the master secret key to access administrative features.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email address</label>
              <input
                type="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="admin@nitisetu.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-500" />
                Admin Secret Key
              </label>
              <input
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-amber-200 bg-amber-50/30 placeholder-slate-400 text-slate-900 rounded-lg focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                placeholder="Enter master secret"
                value={adminSecret}
                onChange={(e) => setAdminSecret(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all shadow-lg shadow-indigo-100"
            >
              {loading ? 'Verifying...' : 'Verify & Access Admin Panel'}
            </button>

            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to regular login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
