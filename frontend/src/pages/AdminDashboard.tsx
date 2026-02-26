import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllSchemes, type Scheme } from '../services/api';
import { 
  LayoutDashboard, 
  Upload, 
  History, 
  FileText, 
  Calendar, 
  MapPin, 
  Users,
  ChevronRight,
  ExternalLink,
  Loader2,
  AlertCircle
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [schemes, setSchemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

    fetchHistory();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Control Panel</h1>
          <p className="text-slate-600">Manage government schemes and system intelligence.</p>
        </div>
        <div className="bg-indigo-600 p-3 rounded-full shadow-lg shadow-indigo-100">
          <LayoutDashboard className="h-8 w-8 text-white" />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link 
          to="/admin/ingest"
          className="bg-white p-6 rounded-2xl border-2 border-indigo-50 hover:border-indigo-200 shadow-sm hover:shadow-md transition-all group"
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
        </Link>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-amber-50 rounded-xl">
            <History className="h-8 w-8 text-amber-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">{schemes.length}</h3>
            <p className="text-slate-500">Total Schemes Ingested</p>
          </div>
        </div>
      </div>

      {/* Ingestion History */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <History className="h-5 w-5 text-indigo-600" />
          <h2 className="text-xl font-bold text-slate-800">Ingestion History</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-xl p-6 flex items-center gap-3 text-red-700">
            <AlertCircle className="h-6 w-6" />
            <p>{error}</p>
          </div>
        ) : schemes.length > 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-sm font-bold text-slate-600 uppercase tracking-wider">Scheme Name</th>
                  <th className="px-6 py-4 text-sm font-bold text-slate-600 uppercase tracking-wider">Date Ingested</th>
                  <th className="px-6 py-4 text-sm font-bold text-slate-600 uppercase tracking-wider">Filters</th>
                  <th className="px-6 py-4 text-sm font-bold text-slate-600 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schemes.map((scheme) => (
                  <tr key={scheme._id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-white transition-colors">
                          <FileText className="h-5 w-5 text-slate-500" />
                        </div>
                        <span className="font-semibold text-slate-900">{scheme.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <Calendar className="h-4 w-4" />
                        {new Date(scheme.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {scheme.filters?.state?.slice(0, 1).map((s: string) => (
                          <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-md uppercase tracking-tight">
                            {s}
                          </span>
                        ))}
                        {scheme.filters?.gender?.slice(0, 1).map((g: string) => (
                          <span key={g} className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[10px] font-bold rounded-md uppercase tracking-tight">
                            {g}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link 
                        to={`/search?q=${encodeURIComponent(scheme.name)}`}
                        className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        View Results
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 py-12 text-center space-y-4">
            <p className="text-slate-500 font-medium">No schemes have been ingested yet.</p>
            <Link 
              to="/admin/ingest"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
            >
              <Upload className="h-5 w-5" />
              Upload Your First Scheme
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
