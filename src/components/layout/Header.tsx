import React, { useState } from 'react';
import { useQueue } from '../../context/QueueContext';
import {
  Layers,
  Building2,
  Users,
  Tv,
  Touchpad,
  ShieldCheck,
  Globe,
  Sun,
  Moon,
  Bell,
  CheckCircle2,
  ChevronDown,
  PlayCircle,
  PlusCircle,
  User as UserIcon,
  LogOut,
  Hospital,
  Landmark,
  GraduationCap,
  ShieldAlert,
  Sparkles,
  Clock,
  KeyRound
} from 'lucide-react';

interface HeaderProps {
  onOpenDemoModal: () => void;
  onOpenAuthModal: () => void;
  onOpenOnboardModal: () => void;
  onOpenSecurityModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenDemoModal,
  onOpenAuthModal,
  onOpenOnboardModal,
  onOpenSecurityModal
}) => {
  const {
    organizations,
    currentOrg,
    switchOrganization,
    currentUser,
    logout,
    currentView,
    setCurrentView,
    language,
    setLanguage,
    theme,
    setTheme,
    notifications,
    markNotificationAsRead,
    clearNotifications,
    activeCitizenToken,
    userTokens
  } = useQueue();

  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [isNotifsOpen, setIsNotifsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;
  const activeUserTokensCount = userTokens.filter(t => t.status === 'WAITING' || t.status === 'CALLED' || t.status === 'IN_SERVICE').length;

  const getOrgIcon = (type: string) => {
    switch (type) {
      case 'hospital': return <Hospital className="w-4 h-4 text-sky-500" />;
      case 'government': return <Landmark className="w-4 h-4 text-indigo-500" />;
      case 'bank': return <Building2 className="w-4 h-4 text-emerald-500" />;
      case 'university': return <GraduationCap className="w-4 h-4 text-amber-500" />;
      default: return <Building2 className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors shadow-xs">
      {/* Top Demo Bar / SIH Notice Bar */}
      <div className="bg-slate-900 text-white px-3 sm:px-6 py-1.5 text-xs border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[10px] border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            SIH READY PLATFORM
          </span>
          <span className="hidden md:inline text-slate-300 text-[11px]">
            Universal Multi-Tenant Queue Engine • Zero-Trust Access • 1 Token, Multiple Desks
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSecurityModal}
            className="px-2.5 py-1 rounded-md bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            <span>Live Security Lab (15 Tests)</span>
          </button>
          <button
            onClick={onOpenDemoModal}
            className="px-2.5 py-1 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-[11px] flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Judge Walkthrough</span>
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        
        {/* Left: Brand Logo & Org Selector */}
        <div className="flex items-center gap-3 sm:gap-6">
          <div
            onClick={() => setCurrentView('citizen')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-sky-600 to-emerald-500 p-0.5 shadow-md shadow-indigo-500/20 flex items-center justify-center text-white">
              <div className="w-full h-full bg-slate-900 dark:bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Layers className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  Queue<span className="text-sky-600 dark:text-sky-400">Less</span>
                </span>
                <span className="hidden md:inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 uppercase tracking-wider">
                  Universal
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-none hidden sm:block">
                Smart Queue Platform
              </p>
            </div>
          </div>

          {/* Org Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
              className="flex items-center gap-2 py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors"
            >
              {getOrgIcon(currentOrg.type)}
              <span className="truncate max-w-[120px] sm:max-w-[190px] text-left">
                {language === 'hi' ? currentOrg.nameHi : currentOrg.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {isOrgDropdownOpen && (
              <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Switch Organization
                </div>
                {organizations.map(org => (
                  <button
                    key={org.id}
                    onClick={() => {
                      switchOrganization(org.id);
                      setIsOrgDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                      org.id === currentOrg.id ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 font-bold' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {getOrgIcon(org.type)}
                      <div className="truncate">
                        <p className="truncate font-semibold">{org.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{org.tagline}</p>
                      </div>
                    </div>
                    {org.id === currentOrg.id && <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0" />}
                  </button>
                ))}
                <div className="border-t border-slate-100 dark:border-slate-800 my-1 pt-1">
                  <button
                    onClick={() => {
                      setIsOrgDropdownOpen(false);
                      onOpenOnboardModal();
                    }}
                    className="w-full px-3 py-2 text-left text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center gap-2"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>+ Onboard New Organization</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center: Portal Navigation Tabs (Desktop) */}
        <nav className="hidden xl:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/70 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
          <button
            onClick={() => setCurrentView('citizen')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentView === 'citizen'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Get a Token</span>
          </button>

          <button
            onClick={() => setCurrentView('user_dashboard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentView === 'user_dashboard'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            <span>My QueueLess</span>
            {activeUserTokensCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-sky-500 text-slate-950 text-[10px] font-black">
                {activeUserTokensCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentView('staff')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentView === 'staff'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Staff Console</span>
          </button>

          <button
            onClick={() => setCurrentView('display')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentView === 'display'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Waiting TV</span>
          </button>

          <button
            onClick={() => setCurrentView('kiosk')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentView === 'kiosk'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Touchpad className="w-3.5 h-3.5" />
            <span>Touch Kiosk</span>
          </button>

          <button
            onClick={() => setCurrentView('admin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentView === 'admin'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Org Admin</span>
          </button>
        </nav>

        {/* Right: Language, Theme, Notifs & User Profile */}
        <div className="flex items-center gap-2">
          
          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
            title="Switch Language (English / हिंदी)"
          >
            <Globe className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span className="font-mono text-xs">{language === 'en' ? 'HI' : 'EN'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Toggle Light / Dark Mode"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setIsNotifsOpen(!isNotifsOpen)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              )}
            </button>

            {isNotifsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-800 dark:text-white">Notifications ({notifications.length})</span>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearNotifications}
                      className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold cursor-pointer"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div className="max-h-60 overflow-y-auto py-2 space-y-2">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">No notifications yet.</p>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationAsRead(n.id)}
                        className={`p-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                          n.read ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400' : 'bg-sky-50 dark:bg-sky-950/40 text-slate-800 dark:text-slate-200 border-l-2 border-sky-500'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sky-600 dark:text-sky-400">{n.title}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{n.timestamp}</span>
                        </div>
                        <p className="text-[11px] mt-0.5 leading-relaxed">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile / Auth Button */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 py-1.5 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-colors cursor-pointer"
            >
              <UserIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="truncate max-w-[80px] sm:max-w-[120px]">{currentUser.name}</span>
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-black text-slate-900 dark:text-white">{currentUser.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono uppercase">Role: {currentUser.role}</p>
                </div>

                <div className="py-1 space-y-0.5">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setCurrentView('user_dashboard');
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                    <span>My Personal Dashboard</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onOpenAuthModal();
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-sky-500" />
                    <span>Switch Role / Sign In</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Mobile Portal Navigation Bar (Scrollable) */}
      <div className="xl:hidden flex items-center gap-1.5 px-4 py-2 border-t border-slate-100 dark:border-slate-800/80 overflow-x-auto no-scrollbar bg-slate-50/80 dark:bg-slate-900/80">
        <button
          onClick={() => setCurrentView('citizen')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            currentView === 'citizen' ? 'bg-sky-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Get Token</span>
        </button>
        <button
          onClick={() => setCurrentView('user_dashboard')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            currentView === 'user_dashboard' ? 'bg-purple-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>My QueueLess</span>
        </button>
        <button
          onClick={() => setCurrentView('staff')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            currentView === 'staff' ? 'bg-sky-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Staff Console</span>
        </button>
        <button
          onClick={() => setCurrentView('display')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            currentView === 'display' ? 'bg-sky-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          <Tv className="w-3.5 h-3.5" />
          <span>Waiting TV</span>
        </button>
        <button
          onClick={() => setCurrentView('kiosk')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            currentView === 'kiosk' ? 'bg-sky-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          <Touchpad className="w-3.5 h-3.5" />
          <span>Kiosk</span>
        </button>
        <button
          onClick={() => setCurrentView('admin')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            currentView === 'admin' ? 'bg-sky-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Org Admin</span>
        </button>
      </div>
    </header>
  );
};
