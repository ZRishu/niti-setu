import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight } from 'lucide-react';

const Home = () => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      <div className="max-w-3xl w-full space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight">
            Discover Government Schemes <span className="text-primary-600">Made for You</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
            Niti-Setu uses AI to match you with the right government schemes based on your profile and needs.
          </p>
        </div>

        <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto w-full group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-6 w-6 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-full text-lg shadow-sm placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all"
            placeholder="e.g., Financial aid for farmers in Maharashtra..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            className="absolute right-2 top-2 bottom-2 bg-primary-600 hover:bg-primary-700 text-white px-6 rounded-full font-medium transition-colors flex items-center gap-2"
          >
            Search
            <ChevronRight className="h-4 w-4" />
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-left">
          <FeatureCard 
            title="AI Powered Search" 
            desc="Natural language understanding to find exactly what you need." 
            emoji="🤖"
          />
          <FeatureCard 
            title="Personalized Matches" 
            desc="Filter by state, caste, and gender to get relevant results." 
            emoji="🎯"
          />
          <FeatureCard 
            title="Instant Answers" 
            desc="Chat with our assistant to clarify doubts about any scheme." 
            emoji="💬"
          />
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ title, desc, emoji }: { title: string; desc: string; emoji: string }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="text-4xl mb-4">{emoji}</div>
    <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
    <p className="text-slate-600 leading-relaxed">{desc}</p>
  </div>
);

export default Home;