import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchSchemes } from '../services/api';
import type { Scheme } from '../services/api';
import { Filter, User, MapPin, IndianRupee } from 'lucide-react';

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [state, setState] = useState('');
  const [gender, setGender] = useState('');
  const [caste, setCaste] = useState('');

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    try {
      const userProfile = {
        state: state || undefined,
        gender: gender || undefined,
        caste: caste || undefined,
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
            <div className="flex items-center gap-2 mb-6 text-slate-800 font-semibold">
              <Filter className="w-5 h-5" />
              <h2>Filters</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                <select 
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                >
                  <option value="">All India</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Pan-India">Pan-India</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                <select 
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="">Any</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Transgender">Transgender</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Caste</label>
                <select 
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  value={caste}
                  onChange={(e) => setCaste(e.target.value)}
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
                className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors mt-4"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-3 space-y-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for schemes..."
              className="flex-grow rounded-xl border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-lg py-3 px-4"
            />
            <button 
              type="submit"
              className="bg-slate-900 text-white px-8 rounded-xl font-medium hover:bg-slate-800 transition-colors"
            >
              Search
            </button>
          </form>

          {loading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {!loading && results.length === 0 && query && !error && (
               <div className="text-center py-12 text-slate-500">
                 No schemes found matching your criteria. Try adjusting filters or keywords.
               </div>
            )}

            {results.map((scheme) => (
              <div key={scheme._id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-slate-900">{scheme.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    scheme.benefits?.type === 'Financial' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {scheme.benefits?.type || 'Scheme'}
                  </span>
                </div>

                <p className="text-slate-600 mb-4 line-clamp-3">
                  {scheme.snippet || scheme.benefits?.description || "No description available."}
                </p>

                <div className="flex flex-wrap gap-4 text-sm text-slate-500 mb-4">
                  {scheme.benefits?.max_value_inr > 0 && (
                    <div className="flex items-center gap-1">
                      <IndianRupee className="w-4 h-4" />
                      <span>Max Benefit: ₹{scheme.benefits.max_value_inr.toLocaleString()}</span>
                    </div>
                  )}
                  {scheme.filters?.state?.length > 0 && (
                     <div className="flex items-center gap-1">
                       <MapPin className="w-4 h-4" />
                       <span>{scheme.filters.state.join(', ')}</span>
                     </div>
                  )}
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>{scheme.filters?.gender?.join(', ') || 'All'}</span>
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