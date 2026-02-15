import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, BookOpen, Search, MessageSquare, Upload } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white shadow-md border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-primary-600" />
              <span className="font-bold text-xl text-slate-800 tracking-tight">Niti-Setu</span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <NavLink to="/" icon={<Search className="w-4 h-4"/>} text="Find Schemes" active={isActive('/') || isActive('/search')} />
            <NavLink to="/chat" icon={<MessageSquare className="w-4 h-4"/>} text="AI Assistant" active={isActive('/chat')} />
            <NavLink to="/admin/ingest" icon={<Upload className="w-4 h-4"/>} text="Admin Upload" active={isActive('/admin/ingest')} />
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
        <div className="md:hidden bg-white border-b border-gray-100">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <MobileNavLink to="/" text="Find Schemes" onClick={() => setIsOpen(false)} />
            <MobileNavLink to="/chat" text="AI Assistant" onClick={() => setIsOpen(false)} />
            <MobileNavLink to="/admin/ingest" text="Admin Upload" onClick={() => setIsOpen(false)} />
          </div>
        </div>
      )}
    </nav>
  );
};

const NavLink = ({ to, text, active, icon }: { to: string; text: string; active: boolean, icon: React.ReactNode }) => (
  <Link
    to={to}
    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
      active
        ? 'text-primary-600 bg-primary-50'
        : 'text-slate-600 hover:text-primary-600 hover:bg-slate-50'
    }`}
  >
    {icon}
    {text}
  </Link>
);

const MobileNavLink = ({ to, text, onClick }: { to: string; text: string; onClick: () => void }) => (
  <Link
    to={to}
    onClick={onClick}
    className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-primary-600 hover:bg-slate-50"
  >
    {text}
  </Link>
);

export default Navbar;