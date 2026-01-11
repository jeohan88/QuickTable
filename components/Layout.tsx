
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Utensils, LayoutDashboard, Settings, Calendar } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  isAdmin?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, isAdmin = false }) => {
  const location = useLocation();

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-grow">
          {children}
        </main>
        <footer className="bg-stone-900 text-stone-400 py-12 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Utensils className="w-6 h-6 text-amber-500" />
              <span className="font-display text-xl text-white tracking-wider">QuickTable</span>
            </div>
            <p className="text-sm">© {new Date().getFullYear()} QuickTable. Seamless reservations via WhatsApp.</p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-stone-100">
      {/* Sidebar */}
      <aside className="w-64 bg-stone-900 text-stone-300 flex flex-col fixed h-full shadow-xl">
        <div className="p-6 flex items-center space-x-2 border-b border-stone-800">
          <Utensils className="w-8 h-8 text-amber-500" />
          <span className="font-display text-2xl text-white tracking-tight">QuickTable</span>
        </div>
        <nav className="flex-grow p-4 space-y-2 mt-4">
          <NavLink to="/admin" active={location.pathname === '/admin'}>
            <LayoutDashboard className="w-5 h-5 mr-3" />
            Dashboard
          </NavLink>
          <NavLink to="/admin/reservations" active={location.pathname === '/admin/reservations'}>
            <Calendar className="w-5 h-5 mr-3" />
            Reservations
          </NavLink>
          <NavLink to="/admin/settings" active={location.pathname === '/admin/settings'}>
            <Settings className="w-5 h-5 mr-3" />
            Settings
          </NavLink>
        </nav>
        <div className="p-4 border-t border-stone-800">
          <Link to="/" className="flex items-center text-sm hover:text-white transition-colors">
            View Public Site
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

const NavLink: React.FC<{ to: string, active: boolean, children: React.ReactNode }> = ({ to, active, children }) => (
  <Link
    to={to}
    className={`flex items-center px-4 py-3 rounded-lg transition-all ${
      active ? 'bg-amber-500 text-stone-900 font-semibold' : 'hover:bg-stone-800 hover:text-white'
    }`}
  >
    {children}
  </Link>
);
