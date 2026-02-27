import { useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, BookOpen, Search, MessageSquare, User, LogOut, LayoutDashboard, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
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
    <nav className="bg-white/70 backdrop-blur-xl border-b border-white/40 shadow-[0_4px_30px_rgba(0,0,0,0.03)] sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to={isAdmin ? "/admin/dashboard" : "/"} className="flex-shrink-0 flex items-center gap-2 group">
              <div className={`p-1.5 rounded-xl transition-colors duration-300 ${isAdmin ? 'bg-indigo-50 group-hover:bg-indigo-100' : 'bg-primary-50 group-hover:bg-primary-100'}`}>
                <BookOpen className={`h-6 w-6 ${isAdmin ? 'text-indigo-600' : 'text-primary-600'}`} />
              </div>
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
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`flex items-center justify-center gap-2 h-10 px-4 rounded-full font-semibold transition-all duration-300 active:scale-95 ${
                isOpen 
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' 
                  : 'bg-white border border-slate-200/60 text-slate-700 hover:bg-slate-50 shadow-[0_2px_10px_rgba(0,0,0,0.04)]'
              }`}
            >
              <span className="text-sm tracking-wide">{isOpen ? 'Close' : 'Menu'}</span>
              <div className={`transition-transform duration-300 ${isOpen ? 'rotate-90 scale-110' : 'rotate-0'}`}>
                {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </div>
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity duration-300"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu Content */}
          <div className="md:hidden fixed top-4 left-4 right-4 z-50 bg-white/95 backdrop-blur-md border border-white/20 shadow-2xl rounded-3xl overflow-hidden animate-in slide-in-from-top-4 fade-in duration-300">
            <div className="flex items-center justify-between p-4 border-b border-slate-100/50">
              <div className="flex items-center gap-2">
                <div className={`p-1 rounded-lg ${isAdmin ? 'bg-indigo-50' : 'bg-primary-50'}`}>
                  <BookOpen className={`h-4 w-4 ${isAdmin ? 'text-indigo-600' : 'text-primary-600'}`} />
                </div>
                <span className="font-bold text-sm text-slate-800">Menu</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 active:scale-90 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-2">
              {!isAdmin && (
                <>
                  <MobileNavLink 
                    to={isAuthenticated ? "/search" : "/login?message=Please login first to search for schemes"} 
                    icon={<Search className="w-5 h-5"/>} 
                    text="Find Schemes" 
                    active={isActive('/search')}
                    onClick={() => setIsOpen(false)} 
                  />
                  <MobileNavLink 
                    to={isAuthenticated ? "/chat" : "/login?message=Please login first to use the AI Assistant"} 
                    icon={<MessageSquare className="w-5 h-5"/>} 
                    text="AI Assistant" 
                    active={isActive('/chat')}
                    onClick={() => setIsOpen(false)} 
                  />
                  {isAuthenticated && (
                    <MobileNavLink 
                      to="/dashboard" 
                      icon={<LayoutDashboard className="w-5 h-5"/>} 
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
                  icon={<User className="w-5 h-5"/>} 
                  text="My Profile" 
                  active={isActive('/profile')}
                  variant={isAdmin ? 'indigo' : 'blue'}
                  onClick={() => setIsOpen(false)} 
                />
              )}
            </div>
            
            <div className="p-4 bg-slate-50/80 border-t border-slate-100/50 space-y-3">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
                      <div className={`p-2 rounded-full ${isAdmin ? 'bg-indigo-100 text-indigo-600' : 'bg-primary-100 text-primary-600'}`}>
                        <User className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{user?.name}</span>
                        <span className="text-xs text-slate-500 capitalize">{user?.role}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-base font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors active:scale-[0.98]"
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-2 px-4 py-3.5 text-base font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl transition-all active:scale-[0.98]"
                  >
                    <LogIn className="w-5 h-5" />
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center px-4 py-3.5 text-base font-semibold text-white bg-primary-600 hover:bg-primary-700 shadow-md shadow-primary-600/20 rounded-2xl transition-all active:scale-[0.98]"
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
}

export default Navbar;
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
  icon: ReactNode;
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
  onClick, 
  variant = 'blue' 
}: { 
  to: string; 
  text: string; 
  icon?: ReactNode; 
  active?: boolean; 
  onClick: () => void; 
  variant?: 'blue' | 'green' | 'indigo' 
}) => {
  let activeStyles = 'text-blue-600 bg-blue-50/80 border-blue-100';
  let hoverStyles = 'hover:text-blue-600 hover:bg-slate-50 border-transparent';

  if (variant === 'green') {
    activeStyles = 'text-primary-600 bg-primary-50/80 border-primary-100';
    hoverStyles = 'hover:text-primary-600 hover:bg-primary-50 border-transparent';
  } else if (variant === 'indigo') {
    activeStyles = 'text-indigo-600 bg-indigo-50/80 border-indigo-100';
    hoverStyles = 'hover:text-indigo-600 hover:bg-indigo-50 border-transparent';
  }

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-base font-semibold transition-all duration-200 border ${
        active ? activeStyles : `text-slate-600 ${hoverStyles}`
      }`}
    >
      {icon && <div className={`${active ? 'scale-110' : ''} transition-transform duration-200`}>{icon}</div>}
      {text}
    </Link>
  );
};
