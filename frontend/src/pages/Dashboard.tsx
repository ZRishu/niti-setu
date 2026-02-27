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

  if (user?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const metricsRes = await getDashboardMetrics();
        if (metricsRes.success) {
          setMetrics(metricsRes.data);
        }

        if (user?.profile) {
          setRecsLoading(true);
          try {
            const recsRes = await getRecommendedSchemes(user.profile);
            if (recsRes.success) {
              setRecommendations(recsRes.data);
            }
          } catch (recsErr: any) {
            console.error('Error fetching recommended schemes:', recsErr);
            // Don't set global error for just recommendations failing, 
            // but log it for debugging
          } finally {
            setRecsLoading(false);
          }
        }
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        const errorMessage = err.response?.data?.error || 'An error occurred while fetching dashboard data';
        setError(errorMessage);
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
    <div className="animate-fade-in pb-12">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-top-4 duration-300">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}
      {/* MOBILE ONLY REDESIGN */}
      <div className="block lg:hidden space-y-6">
        <div className="flex items-center justify-between px-1">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Namaste, {user?.name.split(' ')[0]}</h1>
            <p className="text-[11px] text-slate-500 font-medium">Your Agricultural Overview</p>
          </div>
          <div className="bg-primary-600 p-2 rounded-xl shadow-lg shadow-primary-100">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
        </div>

        {/* Compact Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Schemes Analyzed</p>
              <p className="text-lg font-black text-slate-900">{metrics?.schemes_analyzed || 0}</p>
            </div>
          </div>
          <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
              <CheckCircle className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Eligibility Checks</p>
              <p className="text-lg font-black text-slate-900">{metrics?.eligibility_checks_performed || 0}</p>
            </div>
          </div>
        </div>

        {/* Recommendations Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-bold text-slate-800">For You</h2>
            </div>
            <Link to="/search" className="text-[10px] font-bold text-primary-600 flex items-center gap-0.5">
              View All <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {recsLoading ? (
            <div className="bg-white rounded-2xl border border-slate-100 py-10 flex flex-col items-center justify-center space-y-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
              <p className="text-[11px] text-slate-400 font-medium">Matching your profile...</p>
            </div>
          ) : recommendations.length > 0 ? (
            <div className="space-y-3">
              {recommendations.map((scheme) => (
                <Link 
                  key={`mob-${scheme._id}`} 
                  to={`/search?q=${encodeURIComponent(scheme.name)}`}
                  className="block bg-white p-4 rounded-2xl border border-slate-100 shadow-sm active:scale-[0.98] transition-all"
                >
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0 text-primary-600 border border-slate-100">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-bold text-primary-600 uppercase bg-primary-50 px-1.5 py-0.5 rounded-md">
                          {scheme.benefits?.type}
                        </span>
                        <ExternalLink className="h-3 w-3 text-slate-300" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">{scheme.name}</h3>
                      <div className="mt-2 flex items-center gap-1.5">
                        <IndianRupee className="h-3 w-3 text-slate-400" />
                        <span className="text-xs font-bold text-slate-600">{scheme.benefits?.max_value_inr?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 py-10 text-center space-y-3 px-4">
              <Sparkles className="h-6 w-6 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Complete your profile to see suggests.</p>
              <Link to="/profile" className="inline-block px-4 py-2 bg-primary-600 text-white text-[11px] font-bold rounded-lg shadow-sm">
                Update Profile
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* DESKTOP ONLY LAYOUT - UNTOUCHED */}
      <div className="hidden lg:block space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Namaste, {user?.name.split(' ')[0]}</h1>
            <p className="text-slate-500 font-medium">Overview of your profile and recommended schemes.</p>
          </div>
          <div className="bg-primary-600 p-3 rounded-2xl shadow-xl shadow-primary-100 ring-4 ring-primary-50">
            <LayoutDashboard className="h-7 w-7 text-white" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Schemes Analyzed"
            value={metrics?.schemes_analyzed || 0}
            icon={<FileText className="h-6 w-6 text-blue-600" />}
            bgColor="bg-blue-50"
          />
          <MetricCard
            title="Eligibility Checks"
            value={metrics?.eligibility_checks_performed || 0}
            icon={<CheckCircle className="h-6 w-6 text-green-600" />}
            bgColor="bg-green-50"
          />
          <MetricCard
            title="Avg. Response Time"
            value={metrics?.average_response_time_seconds || '0s'}
            icon={<Clock className="h-6 w-6 text-purple-600" />}
            bgColor="bg-purple-50"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h2 className="font-bold text-slate-800">Your Profile</h2>
                <Link to="/profile" className="text-xs font-bold text-primary-600 hover:text-primary-700 uppercase tracking-wider">View</Link>
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

          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <h2 className="text-xl font-bold text-slate-800">Smart Recommendations</h2>
              </div>
              <Link to="/search" className="text-sm font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1">
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
                    className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-primary-200 hover:shadow-md transition-all group"
                  >
                    <div className="flex flex-col h-full justify-between">
                      <div>
                        <div className="flex items-start justify-between mb-3">
                          <div className="p-2 bg-primary-50 rounded-lg text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                            <FileText className="h-5 w-5" />
                          </div>
                          <ExternalLink className="h-4 w-4 text-slate-300 group-hover:text-primary-500 transition-colors" />
                        </div>
                        <h3 className="font-bold text-slate-900 group-hover:text-primary-700 transition-colors line-clamp-2">{scheme.name}</h3>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <IndianRupee className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-xs font-bold text-slate-600">Up to {scheme.benefits?.max_value_inr?.toLocaleString()}</span>
                        </div>
                        <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-md uppercase tracking-tight">
                          {scheme.benefits?.type}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 py-16 text-center space-y-4">
                <div className="p-4 bg-white rounded-full w-fit mx-auto shadow-sm">
                  <Sparkles className="h-8 w-8 text-slate-300" />
                </div>
                <div>
                  <p className="text-slate-500 font-bold">No personalized recommendations yet.</p>
                  <p className="text-slate-400 text-sm">Try updating your profile details to get AI suggestions.</p>
                </div>
                <Link to="/profile" className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-100">
                  Update Profile
                </Link>
              </div>
            )}
          </div>
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
