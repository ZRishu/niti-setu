import React, { useEffect, useState } from 'react';
import { getDashboardMetrics, type User } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FileText, CheckCircle, Clock, User as UserIcon, Mail, Phone, MapPin, Briefcase } from 'lucide-react';

interface Metrics {
  schemes_analyzed: number;
  eligibility_checks_performed: number;
  average_response_time_seconds: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await getDashboardMetrics();
        if (response.success) {
          setMetrics(response.data);
        } else {
          setError('Failed to load metrics');
        }
      } catch (err) {
        console.error('Error fetching metrics:', err);
        setError('An error occurred while fetching dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
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

      {/* Profile Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-indigo-600" />
            Profile Information
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <ProfileItem icon={<UserIcon />} label="Full Name" value={user?.name} />
              <ProfileItem icon={<Mail />} label="Email Address" value={user?.email} />
              <ProfileItem icon={<Phone />} label="Phone Number" value={user?.phoneNumber} />
            </div>
            <div className="space-y-4">
              <ProfileItem icon={<MapPin />} label="State" value={user?.profile?.state || 'Not specified'} />
              <ProfileItem icon={<Briefcase />} label="Occupation" value={user?.profile?.occupation || 'Not specified'} />
              <div className="pt-2">
                <span className="text-sm font-medium text-slate-500 block mb-1">Account Role</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user?.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-indigo-100 text-indigo-800'
                }`}>
                  {user?.role?.toUpperCase()}
                </span>
              </div>
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

const ProfileItem: React.FC<{ icon: React.ReactNode, label: string, value?: string }> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="text-slate-400 mt-1">
      {React.cloneElement(icon as React.ReactElement, { size: 18 })}
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="text-slate-900 font-medium">{value || 'N/A'}</p>
    </div>
  </div>
);

export default Dashboard;
