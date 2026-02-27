import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User as UserIcon, Mail, Phone, MapPin, Briefcase, Calendar, Award, Shield, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fade-in pb-12">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-medium text-sm sm:text-base"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        {/* Header/Cover Area */}
        <div className="h-24 sm:h-32 bg-gradient-to-r from-indigo-600 to-blue-500"></div>
        
        <div className="px-4 sm:px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-10 sm:-mt-12 mb-6">
            <div className="p-1.5 sm:p-2 bg-white rounded-2xl sm:rounded-3xl shadow-lg">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-indigo-100 rounded-xl sm:rounded-2xl flex items-center justify-center text-indigo-600">
                <UserIcon className="w-10 h-10 sm:w-12 sm:h-12" strokeWidth={1.5} />
              </div>
            </div>
            <div className="flex gap-2">
              <span className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest ${
                user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
              }`}>
                {user.role} Account
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{user.name}</h1>
            <p className="text-sm sm:text-base text-slate-500 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {user.email}
            </p>
          </div>

          <div className="mt-8 sm:mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
            <div className="space-y-6 sm:space-y-8">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 sm:mb-6">Personal Details</h3>
                <div className="space-y-4">
                  <InfoRow icon={<Phone />} label="Phone Number" value={user.phoneNumber} />
                  <InfoRow icon={<Calendar />} label="Age" value={user.profile?.age ? `${user.profile.age} Years` : undefined} />
                  <InfoRow icon={<Shield />} label="Social Category" value={user.profile?.socialCategory} />
                </div>
              </div>
            </div>

            <div className="space-y-6 sm:space-y-8">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 sm:mb-6">
                  {user.role === 'admin' ? 'Work Profile' : 'Farming Profile'}
                </h3>
                <div className="space-y-4">
                  <InfoRow icon={<MapPin />} label="Location" value={user.profile?.state ? `${user.profile.district || ''}, ${user.profile.state}` : undefined} />
                  <InfoRow icon={<Briefcase />} label="Occupation" value={user.role === 'admin' ? 'System Administrator' : (user.profile?.occupation || 'Farmer')} />
                  {user.role !== 'admin' && (
                    <InfoRow icon={<Award />} label="Land Holding" value={user.profile?.landHolding ? `${user.profile.landHolding} Acres` : undefined} />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 sm:mt-12 pt-8 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">About Me</h3>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed italic">
              {user.role === 'admin' ? (
                `"I am an administrator for Niti-Setu. I am dedicated to managing the intelligence engine, ensuring high-quality scheme ingestion, and leveraging AI to empower citizens with precise and accessible information."`
              ) : (
                `"I am a ${user.profile?.occupation || 'farmer'} from ${user.profile?.state || 'India'}. I use Niti-Setu to stay updated on government schemes that can help improve my livelihood and agricultural productivity."`
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode, label: string, value?: string | number }) => (
  <div className="flex items-center gap-4 group">
    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
      {React.cloneElement(icon as React.ReactElement<any>, { size: 18 })}
    </div>
    <div>
      <p className="text-[10px] sm:text-xs font-medium text-slate-400 leading-none mb-1">{label}</p>
      <p className="text-sm sm:text-base text-slate-900 font-semibold">{value || 'Not provided'}</p>
    </div>
  </div>
);

export default Profile;
