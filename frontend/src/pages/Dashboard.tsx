import React, { useEffect, useState } from 'react';
import { getDashboardMetrics, getRecommendedSchemes, type User, type Scheme } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FileText, CheckCircle, Clock, User as UserIcon, Mail, Phone, MapPin, Briefcase, Sparkles, ChevronRight, IndianRupee, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">User Dashboard</h1>
          <p className="text-slate-600">Welcome back, {user?.name}!</p>
        </div>
        <div className="bg-indigo-100 p-3 rounded-full">
          <LayoutDashboard className="h-8 w-8 text-indigo-600" />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700">
          <p>{error}</p>
        </div>
      )}

      {/* Metrics Section */}
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
        {/* Recommendations Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Recommended for You
            </h2>
            <Link to="/search" className="text-indigo-600 text-sm font-semibold hover:underline flex items-center gap-1">
              Browse all schemes
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {recsLoading ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
            </div>
          ) : recommendations.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {recommendations.map((scheme) => (
                <div key={scheme._id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{scheme.name}</h3>
                      <div className="flex gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 uppercase">
                          {scheme.benefits.type}
                        </span>
                        {scheme.benefits.max_value_inr > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700">
                            <IndianRupee className="h-3 w-3" />
                            UP TO ₹{scheme.benefits.max_value_inr.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <Link 
                      to={`/search?q=${encodeURIComponent(scheme.name)}`}
                      className="p-2 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3">
              <p className="text-slate-500 italic">No specific recommendations yet. Try updating your profile or searching.</p>
              <Link to="/search" className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-sm shadow-indigo-100">
                Explore Schemes
              </Link>
            </div>
          )}
        </div>

        {/* Quick Profile Summary Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden sticky top-24">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-indigo-600" />
                Quick Profile
              </h2>
              <Link to="/profile" className="text-indigo-600 hover:text-indigo-800 p-1">
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl">
                  {user?.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{user?.name}</p>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">{user?.role}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-50 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Location</span>
                  <span className="font-semibold text-slate-700">{user?.profile?.state || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Occupation</span>
                  <span className="font-semibold text-slate-700">{user?.profile?.occupation || 'Farmer'}</span>
                </div>
              </div>

              <Link 
                to="/profile" 
                className="block w-full text-center py-2.5 rounded-xl border-2 border-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-50 hover:border-slate-200 transition-all mt-4"
              >
                View Full Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  bgColor: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, bgColor }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4 hover:shadow-md transition-shadow">
    <div className={`${bgColor} p-3 rounded-lg`}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  </div>
);

export default Dashboard;
