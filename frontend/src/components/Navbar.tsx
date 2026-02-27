import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, BookOpen, Search, MessageSquare, User, LogOut, LayoutDashboard, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <nav className="bg-white shadow-md border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to={isAdmin ? "/admin/dashboard" : "/"} className="flex-shrink-0 flex items-center gap-2 group">
              <BookOpen className={`h-8 w-8 transition-transform duration-300 group-hover:scale-110 ${isAdmin ? 'text-indigo-600' : 'text-primary-600'}`} />
              <span className="font-bold text-xl text-slate-800 tracking-tight">Niti-Setu</span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            {!isAdmin && (
              <>
                <NavLink 
                  to={isAuthenticated ? "/search" : "/login?message=Please login first to search for schemes"} 
                  icon={<Search className="w-4 h-4"/>} 
                  text="Find Schemes" 
                  active={isActive('/search')} 
                />
                
                <NavLink 
                  to={isAuthenticated ? "/chat" : "/login?message=Please login first to use the AI Assistant"} 
                  icon={<MessageSquare className="w-4 h-4"/>} 
                  text="AI Assistant" 
                  active={isActive('/chat')} 
                />
                
                {isAuthenticated && (
                  <NavLink to="/dashboard" icon={<LayoutDashboard className="w-4 h-4"/>} text="Dashboard" active={isActive('/dashboard')} />
                )}
              </>
            )}
            
            <div className="h-6 w-px bg-slate-200 mx-2" />
            
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <NavLink 
                  to="/profile" 
                  icon={<User className="w-4 h-4"/>} 
                  text={user?.name || 'Profile'} 
                  active={isActive('/profile')} 
                  variant={isAdmin ? 'indigo' : 'blue'}
                />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <NavLink 
                  to="/login" 
                  text="Login" 
                  active={isActive('/login')} 
                  icon={<LogIn className="w-4 h-4" />}
                  variant="green"
                />
                <Link
                  to="/signup"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors shadow-sm active:scale-95 transition-transform"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`relative flex items-center justify-center p-2 rounded-xl transition-all duration-300 z-50 ${
                isOpen ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <div className={`transition-transform duration-300 ${isOpen ? 'rotate-90 scale-110' : 'rotate-0'}`}>
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </div>
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <>
          {/* Backdrop with subtle blur */}
          <div 
            className="md:hidden fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-40 animate-in fade-in duration-300"
            onClick={() => setIsOpen(false)}
          />
          
          <div className="md:hidden absolute top-[4.5rem] left-4 right-4 bg-white/95 backdrop-blur-md border border-slate-200 shadow-2xl rounded-2xl overflow-hidden animate-in slide-in-from-top-4 duration-300 origin-top z-50">
            <div className="px-4 pt-4 pb-3 space-y-1 sm:px-6">
              {!isAdmin && (
                <>
                  <MobileNavLink 
                    to={isAuthenticated ? "/search" : "/login?message=Please login first to search for schemes"} 
                    icon={<Search className="w-4 h-4"/>}
                    text="Find Schemes" 
                    active={isActive('/search')}
                    onClick={() => setIsOpen(false)} 
                  />
                  <MobileNavLink 
                    to={isAuthenticated ? "/chat" : "/login?message=Please login first to use the AI Assistant"} 
                    icon={<MessageSquare className="h-4 w-4"/>}
                    text="AI Assistant" 
                    active={isActive('/chat')}
                    onClick={() => setIsOpen(false)} 
                  />
                  {isAuthenticated && (
                    <MobileNavLink 
                      to="/dashboard" 
                      icon={<LayoutDashboard className="h-4 w-4"/>}
                      text="Dashboard" 
                      active={isActive('/dashboard')}
                      onClick={() => setIsOpen(false)} 
                    />
                  )}
                </>
              )}
              {isAuthenticated && (
                <MobileNavLink 
                  to="/profile" 
                  icon={<User className="h-4 w-4"/>}
                  text="My Profile" 
                  active={isActive('/profile')}
                  onClick={() => setIsOpen(false)} 
                />
              )}
            </div>
            <div className="px-4 py-4 space-y-3 sm:px-6 bg-slate-50/50">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-3 px-3 py-2 bg-white/50 rounded-xl border border-slate-100">
                    <div className={`p-2 rounded-lg ${isAdmin ? 'bg-indigo-50 text-indigo-600' : 'bg-primary-50 text-primary-600'}`}>
                      <User className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900 leading-tight">{user?.name}</span>
                      <span className="text-xs text-slate-500 capitalize">{user?.role}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-base font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors active:scale-[0.98]"
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3 pb-2">
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-2 px-4 py-3 text-base font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all active:scale-[0.98]"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center px-4 py-3 text-base font-semibold text-white bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-600/20 rounded-xl transition-all active:scale-[0.98]"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}

    </nav>
  );
};

const NavLink = ({ 
  to, 
  text, 
  active, 
  icon, 
  variant = 'blue' 
}: { 
  to: string; 
  text: string; 
  active: boolean; 
  icon: React.ReactNode;
  variant?: 'blue' | 'green' | 'indigo';
}) => {
  let activeStyles = 'text-blue-600 bg-blue-50';
  let hoverStyles = 'hover:text-blue-600 hover:bg-slate-50';

  if (variant === 'green') {
    activeStyles = 'text-primary-600 bg-primary-50';
    hoverStyles = 'hover:text-primary-600 hover:bg-primary-50';
  } else if (variant === 'indigo') {
    activeStyles = 'text-indigo-600 bg-indigo-50';
    hoverStyles = 'hover:text-indigo-600 hover:bg-indigo-50';
  }

  return (
    <Link
      to={to}
      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
        active ? activeStyles : `text-slate-600 ${hoverStyles}`
      }`}
    >
      {icon}
      {text}
    </Link>
  );
};

const MobileNavLink = ({ 
  to, 
  text, 
  icon, 
  active, 
  onClick 
}: { 
  to: string; 
  text: string; 
  icon?: React.ReactNode; 
  active?: boolean; 
  onClick: () => void; 
}) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-base font-semibold transition-all duration-200 ${
      active 
        ? 'text-primary-600 bg-primary-50/50 border border-primary-100/50 shadow-sm' 
        : 'text-slate-600 hover:text-primary-600 hover:bg-slate-50 border border-transparent'
    }`}
  >
    {icon && <div className={`${active ? 'scale-110' : ''} transition-transform duration-200`}>{icon}</div>}
    {text}
  </Link>
);

export default Navbar;
