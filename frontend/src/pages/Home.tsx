import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { Search, ChevronRight, Mic, ShieldCheck, FileText, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  // Redirect admin to their own control panel as home has no use for them
  if (isAuthenticated && user?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login?message=Please login first to search for schemes');
      return;
    }
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4 py-12">
      <div className="max-w-4xl w-full space-y-12">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-100 text-primary-700 text-sm font-bold uppercase tracking-wider mb-4">
            <ShieldCheck className="w-4 h-4" />
            Empowering Farmers with AI
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Bureaucracy to <span className="text-primary-600 italic">Benefits</span> <br className="hidden md:block" /> 
            in Seconds.
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Talk to Niti-Setu to check your eligibility for government schemes. Get instant Yes/No decisions with citations from official documents.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto w-full group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Search className="h-6 w-6 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
            </div>
            <input
              type="text"
              className="block w-full pl-14 pr-16 sm:pr-32 py-5 bg-white border border-slate-200 rounded-2xl text-lg shadow-xl shadow-slate-200/50 placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all"
              placeholder="Search schemes or ask 'Am I eligible?'"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button
              type="submit"
              className="absolute right-2.5 top-2.5 bottom-2.5 bg-primary-600 hover:bg-primary-700 text-white px-4 sm:px-8 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-primary-200"
            >
              <Search className="h-5 w-5 sm:hidden" />
              <span className="hidden sm:inline">Search</span>
              <ChevronRight className="h-5 w-5 hidden sm:block" />
            </button>
          </form>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-4">
          {isAuthenticated ? (
            <Link to="/dashboard" className="flex items-center gap-2 text-slate-700 font-bold hover:text-primary-600 transition-colors">
              <LayoutDashboard className="w-5 h-5 text-primary-500" />
              Go to Your Dashboard
            </Link>
          ) : (
            <>
              <Link to="/signup" className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl">
                Create Farmer Profile
              </Link>
              <Link to="/chat" className="w-full sm:w-auto px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-md flex items-center justify-center gap-2">
                <Mic className="w-5 h-5 text-primary-600" />
                Try Voice Search
              </Link>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 text-left">
          <FeatureCard 
            title="Voice Interface" 
            desc="Farmers can interact in their own language without typing complex queries." 
            icon={<Mic className="w-6 h-6 text-primary-600" />}
          />
          <FeatureCard 
            title="PDF Decoded" 
            desc="We read 50-page guidelines so you don't have to. Real citations provided." 
            icon={<FileText className="h-6 w-6 text-primary-600" />}
          />
          <FeatureCard 
            title="Eligibility Engine" 
            desc="Personalized Yes/No decisions based on your land holding, crop, and profile." 
            icon={<ShieldCheck className="h-6 w-6 text-primary-600" />}
          />
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ title, desc, icon }: { title: string; desc: string; icon: React.ReactNode }) => (
  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
    <div className="bg-primary-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">{icon}</div>
    <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-600 leading-relaxed text-sm">{desc}</p>
  </div>
);

export default Home;
