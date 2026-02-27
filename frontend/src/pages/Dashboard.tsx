import React, { useEffect, useState } from 'react';
import { getDashboardMetrics, getRecommendedSchemes, type Scheme } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { LayoutDashboard, FileText, CheckCircle, Clock, User as UserIcon, Mail, Phone, MapPin, Briefcase, Sparkles, ChevronRight, IndianRupee, ExternalLink, Loader2, AlertCircle } from 'lucide-react';

interface Metrics {
  schemes_analyzed: number;
  eligibility_checks_performed: number;
  average_response_time_seconds: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [recommendations, setRecommendations] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [recsLoading, setRecsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Strictly prevent admin from seeing user dashboard
  if (user?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const metricsRes = await getDashboardMetrics();
        if (metricsRes.success) {
          setMetrics(metricsRes.data);
        }

        if (user?.profile) {
          setRecsLoading(true);
          const recsRes = await getRecommendedSchemes(user.profile);
          if (recsRes.success) {
            setRecommendations(recsRes.data);
          }
          setRecsLoading(false);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('An error occurred while fetching dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading && !metrics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
        <p className="text-slate-500 font-medium animate-pulse">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Your Dashboard</h1>
          <p className="text-sm sm:text-base text-slate-500 font-medium">Overview of your profile and recommended schemes.</p>
        </div>
        <div className="bg-primary-600 p-2.5 sm:p-3 rounded-2xl shadow-xl shadow-primary-100 ring-4 ring-primary-50">
          <LayoutDashboard className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl flex items-center gap-3">
          <AlertCircle className="h-5 w-5" />
          <p className="font-medium text-sm sm:text-base">{error}</p>
        </div>
      )}

      {/* Impact Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        <MetricCard
          title="Schemes Analyzed"
          value={metrics?.schemes_analyzed || 0}
          icon={<FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />}
          bgColor="bg-blue-50"
        />
        <MetricCard
          title="Eligibility Checks"
          value={metrics?.eligibility_checks_performed || 0}
          icon={<CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />}
          bgColor="bg-green-50"
        />
        <MetricCard
          title="Avg. Response Time"
          value={metrics?.average_response_time_seconds || '0s'}
          icon={<Clock className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />}
          bgColor="bg-purple-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-bold text-slate-800">Your Profile</h2>
              <Link to="/profile" className="text-xs font-bold text-primary-600 hover:text-primary-700 uppercase tracking-wider">Edit</Link>
            </div>
            <div className="p-6 space-y-4">
              <ProfileItem icon={<UserIcon className="h-4 w-4" />} label="Name" value={user?.name} />
              <ProfileItem icon={<Mail className="h-4 w-4" />} label="Email" value={user?.email} />
              <ProfileItem icon={<Phone className="h-4 w-4" />} label="Phone" value={user?.phoneNumber} />
              <ProfileItem icon={<MapPin className="h-4 w-4" />} label="Location" value={`${user?.profile?.district}, ${user?.profile?.state}`} />
              <ProfileItem icon={<Briefcase className="h-4 w-4" />} label="Category" value={user?.profile?.socialCategory} />
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg sm:text-xl font-bold text-slate-800">Smart Recommendations</h2>
            </div>
            <Link to="/search" className="text-xs sm:text-sm font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1">
              Explore More <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {recsLoading ? (
            <div className="bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 py-12 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
              <p className="text-slate-500 font-medium">Finding best matches for you...</p>
            </div>
          ) : recommendations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((scheme) => (
                <Link 
                  key={scheme._id} 
                  to={`/search?q=${encodeURIComponent(scheme.name)}`}
                  className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-primary-200 hover:shadow-md transition-all group"
                >
                  <div className="flex flex-col h-full justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 bg-primary-50 rounded-lg text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                          <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        <ExternalLink className="h-4 w-4 text-slate-300 group-hover:text-primary-500 transition-colors" />
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-primary-700 transition-colors line-clamp-2">{scheme.name}</h3>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <IndianRupee className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-slate-400" />
                        <span className="text-[10px] sm:text-xs font-bold text-slate-600">
                          {scheme.benefits?.max_value_inr?.toLocaleString()}
                        </span>
                      </div>
                      <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[9px] sm:text-[10px] font-bold rounded-md uppercase tracking-tight">
                        {scheme.benefits?.type}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 py-12 sm:py-16 text-center space-y-4 px-4">
              <div className="p-4 bg-white rounded-full w-fit mx-auto shadow-sm">
                <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-slate-300" />
              </div>
              <div>
                <p className="text-slate-500 font-bold text-sm sm:text-base">No personalized recommendations yet.</p>
                <p className="text-slate-400 text-xs sm:text-sm">Try updating your profile details to get AI suggestions.</p>
              </div>
              <Link 
                to="/profile"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-100 text-sm"
              >
                Update Profile
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, icon, bgColor }: any) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex items-center gap-4">
    <div className={`p-4 ${bgColor} rounded-2xl`}>{icon}</div>
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
      <p className="text-2xl font-black text-slate-900">{value}</p>
    </div>
  </div>
);

const ProfileItem = ({ icon, label, value }: any) => (
  <div className="flex items-center gap-3 group">
    <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{label}</p>
      <p className="text-sm font-semibold text-slate-700">{value || 'Not provided'}</p>
    </div>
  </div>
);

export default Dashboard;
