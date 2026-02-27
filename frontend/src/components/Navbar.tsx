import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, BookOpen, Search, MessageSquare, User, LogOut, LayoutDashboard, LogIn, ShieldCheck } from 'lucide-react';
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
            <Link to={isAdmin ? "/admin/dashboard" : "/"} className="flex-shrink-0 flex items-center gap-2">
              <BookOpen className={`h-8 w-8 ${isAdmin ? 'text-indigo-600' : 'text-primary-600'}`} />
              <span className="font-bold text-xl text-slate-800 tracking-tight">Niti-Setu</span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            {!isAdmin && (
              <NavLink to="/" icon={<Search className="w-4 h-4"/>} text="Find Schemes" active={isActive('/') || isActive('/search')} />
            )}
            
            <NavLink 
              to="/chat" 
              icon={<MessageSquare className="w-4 h-4"/>} 
              text="AI Assistant" 
              active={isActive('/chat')} 
              variant={isAdmin ? 'indigo' : 'blue'}
            />
            
            {isAuthenticated && !isAdmin && (
              <NavLink to="/dashboard" icon={<LayoutDashboard className="w-4 h-4"/>} text="Dashboard" active={isActive('/dashboard')} />
            )}

            {isAdmin && (
              <NavLink 
                to="/admin/dashboard" 
                icon={<ShieldCheck className="w-4 h-4"/>} 
                text="Admin Panel" 
                active={isActive('/admin/dashboard')} 
                variant="indigo"
              />
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
              className="text-slate-500 hover:text-slate-700 focus:outline-none p-2"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 animate-in slide-in-from-top duration-200">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-b border-slate-50">
            {!isAdmin && (
              <MobileNavLink to="/" text="Find Schemes" onClick={() => setIsOpen(false)} />
            )}
            <MobileNavLink to="/chat" text="AI Assistant" onClick={() => setIsOpen(false)} />
            {isAdmin ? (
              <MobileNavLink to="/admin/dashboard" text="Admin Panel" onClick={() => setIsOpen(false)} />
            ) : isAuthenticated && (
              <MobileNavLink to="/dashboard" text="Dashboard" onClick={() => setIsOpen(false)} />
            )}
          </div>
          <div className="px-4 py-4 space-y-2">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700 px-2 py-1">
                  <User className="w-4 h-4 text-slate-500" />
                  <span>{user?.name} ({user?.role})</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="block w-full px-3 py-2 text-center text-base font-medium text-slate-700 hover:bg-slate-50 rounded-md"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setIsOpen(false)}
                  className="block w-full px-3 py-2 text-center text-base font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
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

const MobileNavLink = ({ to, text, onClick }: { to: string; text: string; onClick: () => void }) => (
  <Link
    to={to}
    onClick={onClick}
    className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50"
  >
    {text}
  </Link>
);

export default Navbar;
