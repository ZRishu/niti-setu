import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { login as apiLogin, register as apiRegister } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, ArrowLeft, Key, UserPlus, LogIn, Mail, Lock, User, Phone, MapPin, Calendar } from 'lucide-react';

const states = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", 
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", 
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

const unionTerritories = [
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", 
  "Delhi NCR", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const AdminLogin: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [isRegisterMode, setIsRegisterMode] = useState(searchParams.get('mode') === 'register');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    adminSecret: '',
    state: '',
    district: '',
    socialCategory: '',
    gender: '',
    age: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  // Sync mode if query param changes
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'register') {
      setIsRegisterMode(true);
    } else {
      setIsRegisterMode(false);
    }
  }, [searchParams]);

  const validateForm = () => {
    // Email validation
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(formData.email)) {
      return "Please enter a valid email address";
    }

    // Password complexity validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      return "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character";
    }

    if (isRegisterMode) {
      // Name validation: Letters and spaces only
      if (!/^[a-zA-Z\s]+$/.test(formData.name)) {
        return "Name must only contain letters and spaces";
      }

      // Phone validation
      if (!/^\d{10}$/.test(formData.phoneNumber)) {
        return "Phone number must be exactly 10 digits and contain only numbers";
      }

      // Age validation
      const ageNum = parseInt(formData.age);
      if (isNaN(ageNum) || ageNum < 18) {
        return "Admin must be at least 18 years old";
      }

      // District validation
      if (!/^[a-zA-Z\s]+$/.test(formData.district)) {
        return "District name must only contain letters and spaces";
      }

      if (formData.password !== formData.confirmPassword) {
        return 'Passwords do not match';
      }

      if (!formData.state) return "Please select your State / UT";
      if (!formData.gender) return "Please select your gender";
      if (!formData.socialCategory) return "Please select your social category";
    }

    if (!formData.adminSecret) {
      return "Admin Secret Key is required";
    }

    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Proactive phone number restriction: allow only digits
    if (name === 'phoneNumber') {
      const onlyNums = value.replace(/[^0-9]/g, '');
      if (onlyNums.length <= 10) {
        setFormData({ ...formData, [name]: onlyNums });
      }
      return;
    }

    // Proactive name, district restriction: allow only letters and spaces
    if (['name', 'district'].includes(name)) {
      const onlyLetters = value.replace(/[^a-zA-Z\s]/g, '');
      setFormData({ ...formData, [name]: onlyLetters });
      return;
    }

    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);

    try {
      if (isRegisterMode) {
        const registrationData = {
          name: formData.name,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          password: formData.password,
          adminSecret: formData.adminSecret,
          profile: {
            state: formData.state,
            district: formData.district,
            socialCategory: formData.socialCategory,
            gender: formData.gender,
            age: parseInt(formData.age)
          }
        };

        const response = await apiRegister(registrationData);
        if (response.success) {
          login(response.user, response.token);
          navigate('/admin/dashboard');
        } else {
          setError(response.error || 'Registration failed');
        }
      } else {
        const response = await apiLogin({ 
          email: formData.email, 
          password: formData.password, 
          adminSecret: formData.adminSecret 
        });
        
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
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-2 sm:px-4 py-8 sm:py-12">
      <div className="max-w-xl w-full space-y-6 sm:space-y-8 bg-white p-5 sm:p-8 rounded-2xl shadow-xl border border-slate-100">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-50 mb-4">
            {isRegisterMode ? <UserPlus className="h-6 w-6 text-indigo-600" /> : <ShieldCheck className="h-6 w-6 text-indigo-600" />}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
            {isRegisterMode ? 'Register Admin' : 'Admin Verification'}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {isRegisterMode 
              ? 'Create an administrative account' 
              : 'Sign in to access administrative features'}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
          <button
            onClick={() => setIsRegisterMode(false)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all ${!isRegisterMode ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <LogIn className="w-4 h-4" />
            Verify
          </button>
          <button
            onClick={() => setIsRegisterMode(true)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all ${isRegisterMode ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <UserPlus className="w-4 h-4" />
            Register
          </button>
        </div>

        <form className="mt-4 sm:mt-8 space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Common Fields */}
            {isRegisterMode && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-500" />
                    Full Name
                  </label>
                  <input
                    name="name"
                    type="text"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-base"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-indigo-500" />
                      Phone
                    </label>
                    <input
                      name="phoneNumber"
                      type="tel"
                      required
                      className="appearance-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-base"
                      placeholder="Mobile"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-500" />
                      Age
                    </label>
                    <input
                      name="age"
                      type="number"
                      min="18"
                      required
                      className="appearance-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-base"
                      placeholder="Age"
                      value={formData.age}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-indigo-500" />
                      State / UT
                    </label>
                    <select
                      name="state"
                      required
                      className="appearance-none relative block w-full px-3 py-2 border border-slate-300 text-slate-900 bg-white rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-base"
                      value={formData.state}
                      onChange={handleChange}
                    >
                      <option value="">Select State</option>
                      <optgroup label="States">
                        {states.map(s => <option key={s} value={s}>{s}</option>)}
                      </optgroup>
                      <optgroup label="UTs">
                        {unionTerritories.map(ut => <option key={ut} value={ut}>{ut}</option>)}
                      </optgroup>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-indigo-500" />
                      District
                    </label>
                    <input
                      name="district"
                      type="text"
                      required
                      className="appearance-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-base"
                      placeholder="District"
                      value={formData.district}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                    <select
                      name="gender"
                      required
                      className="appearance-none relative block w-full px-3 py-2 border border-slate-300 text-slate-900 bg-white rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-base"
                      value={formData.gender}
                      onChange={handleChange}
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                    <select
                      name="socialCategory"
                      required
                      className="appearance-none relative block w-full px-3 py-2 border border-slate-300 text-slate-900 bg-white rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-base"
                      value={formData.socialCategory}
                      onChange={handleChange}
                    >
                      <option value="">Select</option>
                      <option value="General">General</option>
                      <option value="OBC">OBC</option>
                      <option value="SC">SC</option>
                      <option value="ST">ST</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-500" />
                Email Address
              </label>
              <input
                name="email"
                type="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-base"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            
            <div className={`grid ${isRegisterMode ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} gap-3`}>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-indigo-500" />
                  Password
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-base"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
              {isRegisterMode && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-indigo-500" />
                    Confirm
                  </label>
                  <input
                    name="confirmPassword"
                    type="password"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-base"
                    placeholder="Repeat password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              )}
            </div>

            <div className="pt-2">
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-500" />
                Admin Secret Key
              </label>
              <input
                name="adminSecret"
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-amber-200 bg-amber-50/30 placeholder-slate-400 text-slate-900 rounded-lg focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm text-base"
                placeholder="Enter master secret"
                value={formData.adminSecret}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all shadow-lg shadow-indigo-100"
            >
              {loading ? 'Processing...' : (isRegisterMode ? 'Create Admin Account' : 'Verify & Access Admin Panel')}
            </button>

            <Link
              to={isRegisterMode ? "/signup" : "/login"}
              className="flex items-center justify-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to regular user {isRegisterMode ? "signup" : "login"}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
