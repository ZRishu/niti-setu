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
  Search,
  IndianRupee,
  Filter
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
    <div className="fixed inset-0 z-[70] overflow-hidden">
      <div className="flex items-center justify-center h-full p-4 text-center">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
        </div>
        <div className="inline-block bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:max-w-xl sm:w-full border border-slate-100 animate-in zoom-in-95 duration-200">
          <div className="bg-white px-6 py-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Ingest New Scheme</h3>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 hover:bg-slate-50 rounded-lg">
                <X className="w-5 h-5" />
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
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Scheme Name</label>
                <input
                  type="text"
                  required
                  value={schemeName}
                  onChange={(e) => setSchemeName(e.target.value)}
                  className="w-full rounded-xl border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 bg-slate-50/50 text-slate-900 text-sm placeholder-slate-400 outline-none transition-all"
                  placeholder="e.g., PM Kisan Samman Nidhi"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Max Benefit Value (INR)</label>
                <input
                  type="number"
                  value={benefitsValue}
                  onChange={(e) => setBenefitsValue(e.target.value)}
                  className="w-full rounded-xl border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 bg-slate-50/50 text-slate-900 text-sm placeholder-slate-400 outline-none transition-all"
                  placeholder="e.g., 6000"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Scheme Document (PDF)</label>
                <div className={`mt-1 flex justify-center px-6 pt-4 pb-5 border-2 border-dashed rounded-2xl transition-all ${
                    file ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-200 bg-slate-50/30 hover:border-indigo-300 hover:bg-indigo-50/10'
                }`}>
                  <div className="space-y-2 text-center">
                    <div className={`mx-auto p-3 rounded-full w-fit ${file ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                      <FileText className={`h-8 w-8 ${file ? 'text-indigo-600' : 'text-slate-400'}`} />
                    </div>
                    <div className="flex text-sm text-slate-600 justify-center">
                      <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-bold text-indigo-600 hover:text-indigo-500 focus-within:outline-none">
                        <span>{file ? file.name : 'Choose a file'}</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".pdf" onChange={handleFileChange} />
                      </label>
                    </div>
                    {!file && <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">PDF format only</p>}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-100 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 transition-all active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Processing AI Model...
                    </>
                  ) : (
                    'Start AI Ingestion'
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

const HistoryModal = ({ isOpen, onClose, schemes }: { isOpen: boolean; onClose: () => void; schemes: any[] }) => {
  const [query, setQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [valueFilter, setValueFilter] = useState('');

  const filtered = schemes.filter(s => {
    const matchesName = s.name.toLowerCase().includes(query.toLowerCase());
    const matchesDate = !dateFilter || new Date(s.createdAt).toLocaleDateString().includes(dateFilter);
    const matchesValue = !valueFilter || (s.benefits?.max_value_inr && s.benefits.max_value_inr >= parseInt(valueFilter));
    return matchesName && matchesDate && matchesValue;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] overflow-hidden">
      <div className="flex items-center justify-center h-full p-4 text-center">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
        </div>
        <div className="inline-block bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:max-w-4xl sm:w-full border border-slate-100 animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-white px-6 py-6 sm:p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
                  <History className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Ingestion History</h3>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-50 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Advanced Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search by name..." 
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Date (DD/MM/YYYY)" 
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input 
                  type="number" 
                  placeholder="Min Value (INR)" 
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                  value={valueFilter}
                  onChange={(e) => setValueFilter(e.target.value)}
                />
              </div>
            </div>

            <div className="max-h-[40vh] overflow-y-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-50 z-10">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scheme Details</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Value</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((scheme) => (
                    <tr key={scheme._id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{scheme.name}</span>
                          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3" /> {new Date(scheme.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-bold text-slate-600">
                          ₹{scheme.benefits?.max_value_inr?.toLocaleString() || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link 
                          to={`/search?q=${encodeURIComponent(scheme.name)}`}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-white hover:bg-indigo-600 transition-all px-3 py-1.5 rounded-lg border border-indigo-100"
                        >
                          Verify AI
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-slate-400 italic">No matching schemes found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const [schemes, setSchemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isIngestOpen, setIsIngestOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await getAllSchemes();
      if (response.success) {
        setSchemes(response.data);
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

  return (
    <div className="max-w-5xl mx-auto space-y-4 animate-fade-in -mt-4">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-600 font-bold uppercase tracking-[0.2em] text-[10px]">
            <div className="h-1 w-4 bg-indigo-600 rounded-full" />
            Control Center
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-slate-500 font-medium max-w-lg">Monitor, manage, and train the Niti-Setu intelligence engine.</p>
        </div>
        <div className="bg-white p-4 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center gap-4 group hover:scale-105 transition-all">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-200">
            <LayoutDashboard className="h-6 w-6 text-white" />
          </div>
          <div className="pr-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase">System Status</p>
            <p className="text-sm font-black text-green-600 flex items-center gap-1.5">
              <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              AI Active
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Primary Action: Ingest */}
        <button 
          onClick={() => setIsIngestOpen(true)}
          className="relative bg-indigo-600 p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-200 overflow-hidden group hover:-translate-y-1 transition-all duration-300"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
            <Upload className="h-32 w-32 text-white" />
          </div>
          <div className="relative z-10 flex flex-col items-start text-left space-y-4">
            <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl">
              <Upload className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white tracking-tight">Ingest Scheme</h3>
              <p className="text-indigo-100/80 text-sm font-medium max-w-[200px]">Upload new government PDF documents to train the AI.</p>
            </div>
            <div className="flex items-center gap-2 text-white font-bold text-xs bg-black/10 px-4 py-2 rounded-full backdrop-blur-sm group-hover:bg-black/20 transition-all">
              Launch Uploader <ChevronRight className="h-4 w-4" />
            </div>
          </div>
        </button>

        {/* Secondary Action: History/Search */}
        <button 
          onClick={() => setIsHistoryOpen(true)}
          className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-start text-left space-y-4 group hover:-translate-y-1 transition-all duration-300"
        >
          <div className="p-4 bg-amber-50 rounded-2xl group-hover:bg-amber-100 transition-colors">
            <History className="h-8 w-8 text-amber-600" />
          </div>
          <div className="flex-grow">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">View History</h3>
            <p className="text-slate-500 text-sm font-medium">Search and manage {schemes.length} previously ingested schemes.</p>
          </div>
          <div className="w-full flex items-center justify-between pt-2">
            <div className="flex -space-x-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-slate-400" />
                </div>
              ))}
              {schemes.length > 3 && (
                <div className="h-8 w-8 rounded-full border-2 border-white bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                  +{schemes.length - 3}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs bg-indigo-50 px-4 py-2 rounded-full group-hover:bg-indigo-100 transition-all">
              Manage History <Search className="h-4 w-4" />
            </div>
          </div>
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Live Schemes" value={schemes.length} color="text-indigo-600" />
        <StatCard label="AI Training Level" value="100%" color="text-green-600" />
        <StatCard label="System Security" value="Verified" color="text-blue-600" />
      </div>

      <IngestModal 
        isOpen={isIngestOpen} 
        onClose={() => setIsIngestOpen(false)} 
        onRefresh={fetchHistory}
      />

      <HistoryModal 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        schemes={schemes}
      />
    </div>
  );
};

const StatCard = ({ label, value, color }: { label: string; value: string | number; color: string }) => (
  <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center space-y-1">
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">{label}</p>
    <p className={`text-2xl font-black ${color}`}>{value}</p>
  </div>
);

export default AdminDashboard;
