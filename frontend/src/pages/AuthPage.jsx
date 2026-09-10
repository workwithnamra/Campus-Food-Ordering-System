import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Utensils, ShieldCheck, UserCheck, GraduationCap, Leaf, MapPin, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [foodPref, setFoodPref] = useState('jain');
  const [canteen, setCanteen] = useState('ground');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegister 
      ? { name, email, password, role, food_pref: foodPref, canteen } 
      : { email, password };

    try {
      const res = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Authentication failed');
        return;
      }
      login(data.user, data.token);
      navigate(data.user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError('Network error. Is the backend server running?');
    } finally {
      setLoading(false);
    }
  };

  // Quick 1-click Demo Login Helpers
  const handleQuickLogin = (demoRole) => {
    if (demoRole === 'admin') {
      login({
        id: 1,
        name: "SVKM Central Admin",
        email: "admin@svkm.edu",
        role: "admin",
        food_pref: "all",
        canteen: "all"
      }, "admin-token");
      navigate('/admin');
    } else if (demoRole === 'student') {
      login({
        id: 2,
        name: "Aarav Shah",
        email: "student@svkm.edu",
        role: "student",
        food_pref: "jain",
        canteen: "ground",
        loyalty_count: 4
      }, "student-token");
      navigate('/');
    } else if (demoRole === 'teacher') {
      login({
        id: 3,
        name: "Prof. Kothari",
        email: "teacher@svkm.edu",
        role: "teacher",
        food_pref: "jain",
        canteen: "6th_floor",
        loyalty_count: 2
      }, "teacher-token");
      navigate('/');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-100 shadow-xl space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-violet-200">
            <Utensils className="w-6 h-6 text-amber-300" />
          </div>
          <h2 className="text-2xl font-black font-heading text-gray-900">
            {isRegister ? 'Create SVKM Account' : 'Welcome to SVKM Canteen'}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Browse all 3 campus floors with Jain and regional filters
          </p>
        </div>

        {/* Quick Demo Logins Bar */}
        <div className="space-y-1.5 p-3 rounded-2xl bg-violet-50/60 border border-violet-100">
          <span className="text-[10px] uppercase font-black text-violet-700 tracking-wider block text-center">
            ⚡ Quick Demo Logins (1-Click)
          </span>
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => handleQuickLogin('student')}
              className="p-1.5 bg-white hover:bg-violet-100 rounded-xl text-[11px] font-bold text-gray-800 shadow-sm border border-gray-100 transition"
            >
              🎓 Student
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('teacher')}
              className="p-1.5 bg-white hover:bg-violet-100 rounded-xl text-[11px] font-bold text-gray-800 shadow-sm border border-gray-100 transition"
            >
              👨‍🏫 Faculty
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin')}
              className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[11px] font-bold shadow-sm transition"
            >
              🛡️ Admin
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aarav Shah"
                className="w-full text-xs p-3 border border-gray-200 rounded-2xl focus:outline-none focus:border-violet-600"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">College Email / Roll ID</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@svkm.edu"
              className="w-full text-xs p-3 border border-gray-200 rounded-2xl focus:outline-none focus:border-violet-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-xs p-3 border border-gray-200 rounded-2xl focus:outline-none focus:border-violet-600"
            />
          </div>

          {isRegister && (
            <>
              {/* Jain vs Normal Food Preference (Requested Feature) */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">
                  Default Food Preference
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFoodPref('jain')}
                    className={`p-2.5 rounded-2xl text-xs font-bold border flex items-center justify-center space-x-1.5 transition ${
                      foodPref === 'jain'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Leaf className="w-3.5 h-3.5" />
                    <span>🌿 Jain Food</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFoodPref('normal')}
                    className={`p-2.5 rounded-2xl text-xs font-bold border flex items-center justify-center space-x-1.5 transition ${
                      foodPref === 'normal'
                        ? 'bg-amber-500 text-gray-950 border-amber-500 shadow-md shadow-amber-200'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span>Regular Veg</span>
                  </button>
                </div>
              </div>

              {/* Default Floor Canteen */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">
                  Primary Campus Floor
                </label>
                <select
                  value={canteen}
                  onChange={(e) => setCanteen(e.target.value)}
                  className="w-full text-xs p-3 border border-gray-200 rounded-2xl focus:outline-none focus:border-violet-600 font-medium"
                >
                  <option value="ground">Ground Floor - Main Campus Plaza</option>
                  <option value="6th_floor">6th Floor - Faculty & Student Hub</option>
                  <option value="8th_floor">8th Floor - Sky Lounge</option>
                </select>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-violet-200 transition active:scale-95 flex items-center justify-center space-x-1.5"
          >
            <span>{isRegister ? 'Complete Registration' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Toggle between Login & Register */}
        <div className="text-center pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs text-violet-600 hover:underline font-bold"
          >
            {isRegister 
              ? 'Already have an account? Sign in here' 
              : "Don't have an account yet? Register here"}
          </button>
        </div>

      </div>
    </div>
  );
}
