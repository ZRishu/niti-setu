import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register as apiRegister } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, UserPlus, Mail, Phone, MapPin, User, Calendar, Lock } from 'lucide-react';

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

const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    state: '',
    district: '',
    landHolding: '',
    cropType: '',
    socialCategory: '',
    gender: '',
    age: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const validateForm = () => {
    // Email validation
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(formData.email)) {
      return "Please enter a valid email address (e.g., user@example.com)";
    }

    // Phone validation
    if (!/^\d{10}$/.test(formData.phoneNumber)) {
      return "Phone number must be exactly 10 digits";
    }

    // Age validation
    const ageNum = parseInt(formData.age);
    if (isNaN(ageNum) || ageNum < 18) {
      return "You must be at least 18 years old to register";
    }

    // Password complexity validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      return "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character";
    }

    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }

    // Land holding validation
    if (formData.landHolding && parseFloat(formData.landHolding) < 0) {
      return "Land holding cannot be negative";
    }

    // Selection validations
    if (!formData.state) return "Please select your State / UT";
    if (!formData.gender) return "Please select your gender";
    if (!formData.socialCategory) return "Please select your social category";

    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
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

    const userData = {
      name: formData.name,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      password: formData.password,
      profile: {
        state: formData.state,
        district: formData.district,
        landHolding: formData.landHolding ? parseFloat(formData.landHolding) : 0,
        cropType: formData.cropType,
        socialCategory: formData.socialCategory,
        gender: formData.gender,
        age: parseInt(formData.age)
      }
    };

    try {
      const response = await apiRegister(userData);
      if (response.success) {
        login(response.user, response.token);
        navigate('/');
      } else {
        setError(response.error || 'Failed to register');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-50 mb-4">
            <UserPlus className="h-6 w-6 text-primary-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">
            Farmer Registration
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Join Niti-Setu to discover eligible government schemes
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Personal Info Section */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Basic Information</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                Full Name
              </label>
              <input
                name="name"
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                Email Address
              </label>
              <input
                name="email"
                type="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" />
                Phone Number
              </label>
              <input
                name="phoneNumber"
                type="tel"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="10-digit mobile number"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                Age
              </label>
              <input
                name="age"
                type="number"
                min="18"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter your age"
                value={formData.age}
                onChange={handleChange}
              />
            </div>

            {/* Profile Details Section */}
            <div className="space-y-4 md:col-span-2 pt-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Location & Demographics</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                State / UT
              </label>
              <select
                name="state"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-slate-300 text-slate-900 bg-white rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.state}
                onChange={handleChange}
              >
                <option value="">Select State</option>
                <optgroup label="States">
                  {states.map(s => <option key={s} value={s}>{s}</option>)}
                </optgroup>
                <optgroup label="Union Territories">
                  {unionTerritories.map(ut => <option key={ut} value={ut}>{ut}</option>)}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                District
              </label>
              <input
                name="district"
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter district"
                value={formData.district}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
              <select
                name="gender"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-slate-300 text-slate-900 bg-white rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Social Category</label>
              <select
                name="socialCategory"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-slate-300 text-slate-900 bg-white rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.socialCategory}
                onChange={handleChange}
              >
                <option value="">Select Category</option>
                <option value="General">General</option>
                <option value="OBC">OBC</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
              </select>
            </div>

            {/* Farming Details Section */}
            <div className="space-y-4 md:col-span-2 pt-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Farming Information</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Land Holding (Acres)</label>
              <input
                name="landHolding"
                type="number"
                step="0.1"
                min="0"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="e.g. 2.5"
                value={formData.landHolding}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Primary Crop</label>
              <input
                name="cropType"
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="e.g. Wheat, Cotton"
                value={formData.cropType}
                onChange={handleChange}
              />
            </div>

            {/* Security Section */}
            <div className="space-y-4 md:col-span-2 pt-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Security</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-400" />
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-400" />
                Confirm Password
              </label>
              <input
                name="confirmPassword"
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Repeat password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-4 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-all shadow-lg shadow-indigo-100"
            >
              {loading ? 'Creating Profile...' : 'Complete Farmer Registration'}
            </button>

            <div className="text-center">
              <Link to="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                Already have an account? <span className="font-bold underline">Sign in</span>
              </Link>
            </div>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                <span className="px-2 bg-white text-slate-400 font-bold">Administrative Access</span>
              </div>
            </div>

            <Link
              to="/admin/login?mode=register"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-200 transition-all group"
            >
              <ShieldAlert className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
              Register / Verify as Admin
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
