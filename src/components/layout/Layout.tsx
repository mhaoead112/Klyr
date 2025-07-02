import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Users, 
  CreditCard, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Moon, 
  Sun,
  Cloud,
  CloudSnow
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { GlassCard } from '../ui/GlassCard';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/personal', icon: Cloud, label: 'Personal Cloud' },
    { path: '/shared', icon: CloudSnow, label: 'Shared Cloud' },
    { path: '/cards', icon: CreditCard, label: 'Cards' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-gradient/10 to-primary/30 dark:from-dark-bg dark:via-dark-surface/50 dark:to-dark-bg">
      {/* Header */}
      <header className="sticky top-0 z-40">
        <GlassCard className="mx-4 mb-0" opacity="high">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              {/* Logo */}
              <div className="flex items-center">
                <Link to="/personal" className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-primary to-gradient rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">K</span>
                  </div>
                  <span className="text-h2 font-bold text-dark-blue dark:text-white">Klyr</span>
                </Link>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-2">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                      location.pathname === item.path
                        ? 'bg-primary text-white shadow-lg'
                        : 'text-dark-blue dark:text-white hover:bg-white/10 dark:hover:bg-white/5'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
              </nav>

              {/* User Menu */}
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-xl text-dark-blue dark:text-white hover:bg-white/10 dark:hover:bg-white/5 transition-colors"
                >
                  {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                <div className="hidden md:flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-primary to-gradient rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user?.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-dark-blue dark:text-white font-medium">{user?.name}</span>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="hidden md:flex items-center gap-2 px-3 py-2 text-secondary dark:text-gray-300 hover:text-error hover:bg-error/10 rounded-xl transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>

                {/* Mobile menu button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden p-2 text-dark-blue dark:text-white hover:bg-white/10 dark:hover:bg-white/5 rounded-xl transition-colors"
                >
                  {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-white/10 px-6 py-4">
              <div className="space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                      location.pathname === item.path
                        ? 'bg-primary text-white'
                        : 'text-dark-blue dark:text-white hover:bg-white/10 dark:hover:bg-white/5'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
                
                <div className="border-t border-white/10 pt-4 mt-4">
                  <div className="flex items-center gap-3 px-3 py-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-primary to-gradient rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {user?.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-dark-blue dark:text-white font-medium">{user?.name}</span>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-3 text-secondary dark:text-gray-300 hover:text-error hover:bg-error/10 rounded-xl transition-colors w-full"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </GlassCard>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
};