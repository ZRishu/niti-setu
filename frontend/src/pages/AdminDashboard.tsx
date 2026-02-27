import React, { useEffect, useState } from 'react';
import { getAllSchemes, ingestScheme } from '../services/api';
import { 
  LayoutDashboard, 
  Upload, 
  History, 
  FileText, 
  Calendar, 
  ChevronRight,
  ExternalLink,
  Loader2,
  AlertCircle,
  X,
  CheckCircle,
  Search
} from 'lucide-react';
import { Link } from 'react-router-dom';

const IngestModal = ({ isOpen, onClose, onRefresh }: { isOpen: boolean; onClose: () => void; onRefresh: () => void }) => {
  const [file, setFile] = useState<File | null>(null);
  const [schemeName, setSchemeName] = useState('');
  const [benefitsValue, setBenefitsValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !schemeName) {
      setStatus({ type: 'error', message: 'Please provide a file and scheme name.' });
      return;
    }

    setLoading(true);
    setStatus(null);

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('schemeName', schemeName);
    formData.append('benefitsValue', benefitsValue);
    formData.append('benefitsType', 'Financial');

    try {
      const response = await ingestScheme(formData);
      if (response.success) {
        setStatus({ type: 'success', message: 'Scheme uploaded and processed successfully!' });
        setFile(null);
        setSchemeName('');
        setBenefitsValue('');
        onRefresh();
        setTimeout(() => {
          onClose();
          setStatus(null);
        }, 2000);
      } else {
        setStatus({ type: 'error', message: response.error || 'Upload failed.' });
      }
    } catch (error: any) {
      setStatus({ type: 'error', message: error.message || 'An error occurred during upload.' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full border border-slate-100 animate-in zoom-in-95 duration-200">
          <div className="bg-white px-6 py-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 leading-none">Ingest New Scheme</h3>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-50 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>

            {status && (
              <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 border animate-in slide-in-from-top-2 duration-300 ${
                status.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'
              }`}>
                {status.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                <p className="text-sm font-medium">{status.message}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Scheme Name <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={schemeName}
                  onChange={(e) => setSchemeName(e.target.value)}
                  className="w-full rounded-xl border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 bg-slate-50/50 text-slate-900 text-sm placeholder-slate-400"
                  placeholder="e.g., Pradhan Mantri Awas Yojana"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Max Benefit Value (INR)
                </label>
                <input
                  type="number"
                  value={benefitsValue}
                  onChange={(e) => setBenefitsValue(e.target.value)}
                  className="w-full rounded-xl border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 bg-slate-50/50 text-slate-900 text-sm placeholder-slate-400"
                  placeholder="e.g., 50000"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Scheme Document (PDF) <span className="text-red-500 font-bold">*</span>
                </label>
                <div className={`mt-1 flex justify-center px-6 pt-6 pb-7 border-2 border-dashed rounded-2xl transition-all ${
                    file ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-200 bg-slate-50/30 hover:border-indigo-300 hover:bg-indigo-50/10'
                }`}>
                  <div className="space-y-2 text-center">
                    <FileText className={`mx-auto h-10 w-10 ${file ? 'text-indigo-500' : 'text-slate-300'}`} />
                    <div className="flex text-sm text-slate-600 justify-center">
                      <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-bold text-indigo-600 hover:text-indigo-500 focus-within:outline-none">
                        <span>{file ? file.name : 'Choose a file'}</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".pdf" onChange={handleFileChange} />
                      </label>
                    </div>
                    {!file && <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">PDF up to 10MB</p>}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-100 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    'Upload & Process Scheme'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const [schemes, setSchemes] = useState<any[]>([]);
  const [filteredSchemes, setFilteredSchemes] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await getAllSchemes();
      if (response.success) {
        setSchemes(response.data);
        setFilteredSchemes(response.data);
      } else {
        setError('Failed to fetch ingestion history');
      }
    } catch (err) {
      console.error('Error fetching history:', err);
      setError('An error occurred while fetching history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Real-time search filtering
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSchemes(schemes);
    } else {
      const lowerQuery = searchQuery.toLowerCase();
      const filtered = schemes.filter(s => 
        s.name.toLowerCase().includes(lowerQuery)
      );
      setFilteredSchemes(filtered);
    }
  }, [searchQuery, schemes]);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Admin Control Panel</h1>
          <p className="text-slate-500 font-medium">Manage government schemes and system intelligence.</p>
        </div>
        <div className="bg-indigo-600 p-3 rounded-2xl shadow-xl shadow-indigo-100 ring-4 ring-indigo-50">
          <LayoutDashboard className="h-7 w-7 text-white" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-white p-6 rounded-2xl border-2 border-indigo-50 hover:border-indigo-200 shadow-sm hover:shadow-md transition-all group text-left"
        >
          <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-50 rounded-xl group-hover:bg-indigo-100 transition-colors">
              <Upload className="h-8 w-8 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Ingest New Scheme</h3>
              <p className="text-slate-500">Upload PDF documents to train the AI.</p>
            </div>
            <ChevronRight className="ml-auto h-6 w-6 text-slate-300 group-hover:text-indigo-600 transition-all" />
          </div>
        </button>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-amber-50 rounded-xl">
            <History className="h-8 w-8 text-amber-600" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">{schemes.length}</h3>
            <p className="text-slate-500 font-medium tracking-tight uppercase text-[10px]">Total Schemes Ingested</p>
          </div>
        </div>
      </div>

      {/* Admin Search Bar */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search ingested schemes by name..."
          className="block w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all font-medium text-slate-900 placeholder-slate-400"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <History className="h-5 w-5 text-indigo-600" />
          <h2 className="text-xl font-bold text-slate-800">
            {searchQuery ? `Search Results (${filteredSchemes.length})` : 'Ingestion History'}
          </h2>
        </div>

        {loading && schemes.length === 0 ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex items-center gap-3 text-red-700">
            <AlertCircle className="h-6 w-6" />
            <p className="font-medium">{error}</p>
          </div>
        ) : filteredSchemes.length > 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scheme Name</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Date Ingested</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSchemes.map((scheme) => (
                    <tr key={scheme._id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-white transition-colors border border-slate-100 shadow-sm">
                            <FileText className="h-5 w-5 text-slate-500" />
                          </div>
                          <span className="font-bold text-slate-800">{scheme.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2 text-slate-500 text-sm font-medium">
                          <Calendar className="h-4 w-4" />
                          {new Date(scheme.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link 
                          to={`/search?q=${encodeURIComponent(scheme.name)}`}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 px-3 py-1.5 rounded-lg"
                        >
                          View AI Training
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 py-16 text-center space-y-4">
            <div className="p-4 bg-white rounded-full w-fit mx-auto shadow-sm">
              <Search className="h-10 w-10 text-slate-300" />
            </div>
            <div>
              <p className="text-slate-500 font-bold">No matching schemes found.</p>
              <p className="text-slate-400 text-sm">Try searching with a different name or keyword.</p>
            </div>
          </div>
        )}
      </div>

      <IngestModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onRefresh={fetchHistory}
      />
    </div>
  );
};

export default AdminDashboard;
