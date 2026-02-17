import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchSchemes } from '../services/api';
import type { Scheme } from '../services/api';
import { Filter, User, MapPin, IndianRupee, CheckCircle2, XCircle, Info, Quote } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SearchPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filters - initialized from user profile if available
  const [state, setState] = useState(user?.profile?.state || '');
  const [gender, setGender] = useState(user?.profile?.gender || '');
  const [socialCategory, setSocialCategory] = useState(user?.profile?.socialCategory || '');

  useEffect(() => {
    if (user?.profile) {
      if (user.profile.state) setState(user.profile.state);
      if (user.profile.gender) setGender(user.profile.gender);
      if (user.profile.socialCategory) setSocialCategory(user.profile.socialCategory);
    }
  }, [user]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    try {
      const userProfile = user?.profile || {
        state: state || undefined,
        gender: gender || undefined,
        socialCategory: socialCategory || undefined,
      };
      
      const response = await searchSchemes(query, userProfile);
      if (response.success) {
        setResults(response.data);
      } else {
        setResults([]);
      }
    } catch (err) {
      setError('Failed to fetch schemes. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      handleSearch();
    }
  }, [initialQuery]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-24">
            <div className="flex items-center gap-2 mb-6 text-slate-800 font-semibold border-b border-slate-100 pb-4">
              <Filter className="w-5 h-5 text-primary-600" />
              <h2>Filters</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">State</label>
                <input 
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm bg-white text-slate-900"
                  placeholder="Enter State"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Gender</label>
                <select 
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm bg-white text-slate-900"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="">Any</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Category</label>
                <select 
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm bg-white text-slate-900"
                  value={socialCategory}
                  onChange={(e) => setSocialCategory(e.target.value)}
                >
                  <option value="">Any</option>
                  <option value="General">General</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                </select>
              </div>

              <button 
                onClick={() => handleSearch()}
                className="w-full bg-primary-600 text-white py-2.5 rounded-lg hover:bg-primary-700 transition-colors mt-4 font-semibold text-sm shadow-sm shadow-primary-200"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-3 space-y-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-grow">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for schemes (e.g., land irrigation, subsidy)..."
                className="w-full rounded-xl border-slate-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-lg py-3.5 px-5 transition-all bg-white text-slate-900"
              />
            </div>
            <button 
              type="submit"
              className="bg-slate-900 text-white px-8 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg"
            >
              Search
            </button>
          </form>

          {loading && (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <p className="text-slate-500 font-medium animate-pulse">Analyzing eligibility against official documents...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          <div className="space-y-6">
            {!loading && results.length === 0 && query && !error && (
               <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-100 shadow-sm">
                 No schemes found matching your criteria. Try adjusting filters or keywords.
               </div>
            )}

            {results.map((scheme) => (
              <div key={scheme._id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-1">{scheme.name}</h3>
                      <div className="flex gap-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                          {scheme.benefits?.type || 'Agricultural'}
                        </span>
                        {scheme.eligibility?.benefitAmount && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Benefit: {scheme.eligibility.benefitAmount}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {scheme.eligibility && (
                      <div className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold border-2 ${
                        scheme.eligibility.isEligible 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {scheme.eligibility.isEligible ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        {scheme.eligibility.isEligible ? 'Eligible' : 'Not Eligible'}
                      </div>
                    )}
                  </div>

                  {scheme.eligibility && (
                    <div className={`mb-6 p-4 rounded-xl border ${
                      scheme.eligibility.isEligible ? 'bg-green-50/50 border-green-100' : 'bg-red-50/50 border-red-100'
                    }`}>
                      <div className="flex items-start gap-2 mb-2">
                        <Info className={`w-4 h-4 mt-0.5 ${scheme.eligibility.isEligible ? 'text-green-600' : 'text-red-600'}`} />
                        <p className="text-sm font-semibold">{scheme.eligibility.reason}</p>
                      </div>
                      
                      {scheme.eligibility.citation && (
                        <div className="mt-3 pt-3 border-t border-slate-200/50">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Quote className="w-3 h-3 text-slate-400" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Official Document Proof</span>
                          </div>
                          <p className="text-xs text-slate-600 italic leading-relaxed bg-white/50 p-3 rounded-lg border border-slate-100">
                            "{scheme.eligibility.citation}"
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-slate-600 mb-6 line-clamp-2 text-sm leading-relaxed">
                    {scheme.snippet || scheme.benefits?.description}
                  </p>

                  <div className="flex flex-wrap gap-6 text-xs font-bold text-slate-400 pt-4 border-t border-slate-50 uppercase tracking-tight">
                    {scheme.benefits?.max_value_inr > 0 && (
                      <div className="flex items-center gap-1.5">
                        <IndianRupee className="w-3.5 h-3.5" />
                        <span>Up to ₹{scheme.benefits.max_value_inr.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{scheme.filters?.state?.join(', ') || 'Pan-India'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      <span>Category: {scheme.filters?.caste?.join(', ') || 'All'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;