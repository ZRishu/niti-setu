import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register as apiRegister } from '../services/api';
import { useAuth } from '../context/AuthContext';

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
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
        landHolding: formData.landHolding ? parseFloat(formData.landHolding) : undefined,
        cropType: formData.cropType,
        socialCategory: formData.socialCategory,
        gender: formData.gender,
        age: formData.age ? parseInt(formData.age) : undefined
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
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-slate-100">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
            Create Farmer Profile
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Join Niti-Setu to discover eligible schemes
          </p>
        </div>
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
          <div className="space-y-3">
            <input
              name="name"
              type="text"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
            />
            <input
              name="email"
              type="email"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
            />
            <input
              name="phoneNumber"
              type="tel"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Phone Number"
              value={formData.phoneNumber}
              onChange={handleChange}
            />
            
            <div className="grid grid-cols-1 gap-3">
              <select
                name="state"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-slate-300 text-slate-900 bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={formData.state}
                onChange={handleChange}
              >
                <option value="">Select State / UT</option>
                <optgroup label="States">
                  {states.map(s => <option key={s} value={s}>{s}</option>)}
                </optgroup>
                <optgroup label="Union Territories">
                  {unionTerritories.map(ut => <option key={ut} value={ut}>{ut}</option>)}
                </optgroup>
              </select>
              <input
                name="district"
                type="text"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="District"
                value={formData.district}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                name="landHolding"
                type="number"
                step="0.1"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Land Holding (Acres)"
                value={formData.landHolding}
                onChange={handleChange}
              />
              <input
                name="cropType"
                type="text"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Primary Crop"
                value={formData.cropType}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <select
                name="gender"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-slate-300 text-slate-900 bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="">Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <select
                name="socialCategory"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-slate-300 text-slate-900 bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={formData.socialCategory}
                onChange={handleChange}
              >
                <option value="">Category</option>
                <option value="General">General</option>
                <option value="OBC">OBC</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
              </select>
            </div>

            <input
              name="age"
              type="number"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Age"
              value={formData.age}
              onChange={handleChange}
            />

            <input
              name="password"
              type="password"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Password (min 6 characters)"
              value={formData.password}
              onChange={handleChange}
            />
            <input
              name="confirmPassword"
              type="password"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Processing...' : 'Register as Farmer'}
            </button>
          </div>
          <div className="text-center text-sm">
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
