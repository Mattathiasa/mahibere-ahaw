import { ReactNode, useState } from 'react';
import { Bell, Home, FileText, Calendar, Users, BookOpen, Menu, Settings, Network, ChevronLeft, ChevronRight, LogOut, Sun, Moon, Languages, DollarSign, Scale, Globe, Handshake, Heart, FolderOpen, ShieldHalf, Newspaper, Layout, Church } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import logo from '@/assets/logo.png';
import { Link, useLocation } from 'react-router-dom';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ProfileDropdown } from '@/components/ProfileDropdown';
import { NotificationBell } from '@/components/NotificationBell';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { useSoftwareControl } from '@/hooks/useSoftwareControl';
import { usePendingRequests } from '@/hooks/usePendingRequests';
import { usePermissions } from '@/contexts/PermissionContext';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ThreeBackground } from './ThreeBackground';

interface DashboardLayoutProps {
  children: ReactNode;
}

const NAV_FALLBACK_LABELS: Record<string, string> = {
  news: 'News',
  landingEditor: 'Landing Page',
  softwareControl: 'Software Control',
  atbiyaRegistry: 'Atbiya Registry',
  myAtbiya: 'My Atbiya',
};

interface NavFlags {
  canViewHierarchy: boolean;
  canManageUsers: boolean;
  canViewNews: boolean;
  canManageAtbiyas: boolean;
  /** Belongs to a parish AND has a parish-level role — i.e. runs one. */
  runsAnAtbiya: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
}

const getNavigationItems = ({
  canViewHierarchy, canManageUsers, canViewNews, canManageAtbiyas, runsAnAtbiya,
  isSuperAdmin, isAdmin,
}: NavFlags) => {
  const items = [
    { name: 'dashboard', href: '/dashboard', icon: Home },
    { name: 'announcements', href: '/announcements', icon: Bell },
    { name: 'plans', href: '/plans', icon: FileText },
    { name: 'reports', href: '/reports', icon: Calendar },
    { name: 'members', href: '/members', icon: Users },
    { name: 'meetings', href: '/meetings', icon: Calendar },
    { name: 'finance', href: '/finance', icon: DollarSign },
    { name: 'hr', href: '/hr', icon: Users },
    { name: 'inventory', href: '/inventory', icon: FolderOpen },
    { name: 'churchRules', href: '/church-rules', icon: Scale },
    { name: 'higeDenb', href: '/hige-denb', icon: BookOpen },
    { name: 'strategicPlan', href: '/strategic-plan', icon: FileText },
    { name: 'documents', href: '/documents', icon: FolderOpen },
  ];

  if (canViewNews) {
    items.push({ name: 'news', href: '/news-manager', icon: Newspaper });
  }

  if (canManageUsers) {
    items.push({ name: 'userManagement', href: '/user-management', icon: Users });
  }

  if (canViewHierarchy) {
    items.push({ name: 'hierarchy', href: '/hierarchy', icon: Network });
  }

  if (runsAnAtbiya) {
    items.push({ name: 'myAtbiya', href: '/my-atbiya', icon: Church });
  }

  if (canManageAtbiyas) {
    items.push({ name: 'atbiyaRegistry', href: '/atbiya-registry', icon: Church });
  }

  // The Landing Editor had no sidebar entry at all — it was reachable only via
  // a card buried in Settings, which is why it looked like it had been removed.
  if (isAdmin || isSuperAdmin) {
    items.push({ name: 'landingEditor', href: '/admin/landing-editor', icon: Layout });
  }

  if (isSuperAdmin) {
    items.push({ name: 'softwareControl', href: '/admin/software-control', icon: ShieldHalf });
  }

  items.push({ name: 'settings', href: '/settings', icon: Settings });

  return items;
};

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const permissions = useRolePermissions();
  const { user: currentUser, logout, isLoggingOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { showNav } = useSoftwareControl();
  const { isSuperAdmin, isAdminRole, scopeOf, myAtbiyaId } = usePermissions();
  const { count: pendingCount } = usePendingRequests();
  // Driven by the permission matrix now, not a hardcoded `=== 'Memriya'`,
  // which had locked Sinodos and super admins out of User Management.
  const canManageUsers = permissions.canViewUserManagement;
  const navigationItems = getNavigationItems({
    canViewHierarchy: permissions.canViewHierarchy,
    canManageUsers,
    canViewNews: permissions.canViewNews,
    canManageAtbiyas: permissions.canManageAtbiyas,
    runsAnAtbiya: !!myAtbiyaId && scopeOf(currentUser?.hierarchyLevel) === 'atbiya',
    isSuperAdmin,
    isAdmin: isAdminRole(currentUser?.hierarchyLevel),
  }).filter((item) => showNav(item.name));

  const handleLogout = () => {
    logout();
  };

  const toggleLanguage = () => {
    if (language === 'en') setLanguage('am');
    else if (language === 'am') setLanguage('om');
    else if (language === 'om') setLanguage('ti');
    else setLanguage('en');
  };

  const NavContent = ({ isCollapsed = false }: { isCollapsed?: boolean }) => (
    <nav className="space-y-1">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href;
        // Newer nav entries have no i18n key yet — fall back rather than
        // rendering an empty label.
        const translatedName = (t.nav as any)[item.name] ?? NAV_FALLBACK_LABELS[item.name] ?? item.name;
        // Requests waiting on this parish, shown where the administrator will
        // actually look rather than only inside the console itself.
        const badge = item.name === 'myAtbiya' ? pendingCount : 0;
        return (
          <Link
            key={item.name}
            to={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative ${isActive
              ? 'bg-[#2E5E99] text-white font-bold shadow-lg shadow-[#2E5E99]/20'
              : `text-muted-foreground hover:bg-[#2E5E99]/5 hover:text-[#2E5E99] ${theme === 'dark' ? 'text-white/60' : 'text-[#0D2440]/60'}`
              }`}
            title={isCollapsed ? `${translatedName}${badge > 0 ? ` (${badge} waiting)` : ''}` : undefined}
          >
            <Icon className={`h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110 ${isCollapsed ? 'mx-auto' : ''}`} />
            {!isCollapsed && <span className="font-medium tracking-wide">{translatedName}</span>}
            {badge > 0 && (
              <span className={`ml-auto min-w-5 h-5 px-1.5 rounded-full bg-amber-500 text-white text-[11px] font-bold flex items-center justify-center ${
                isCollapsed ? 'absolute top-1.5 right-1.5 ml-0' : ''}`}>
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </Link>
        );
      })}

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group text-red-500/80 hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed ${isCollapsed ? 'justify-center' : ''
          }`}
        title={isCollapsed ? t.nav.logout : undefined}
      >
        <LogOut className={`h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110 ${isCollapsed ? 'mx-auto' : ''}`} />
        {!isCollapsed && <span className="font-medium tracking-wide">{isLoggingOut ? t.nav.logout : t.nav.logout}</span>}
      </button>
    </nav>
  );


  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-700 ${theme === 'dark' ? 'bg-[#0D2440]' : 'bg-[#E7F0FA]'}`}>
      <ThreeBackground />

      {/* Abstract Background Elements */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-[#2E5E99]/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#7BA4D0]/5 blur-[100px] pointer-events-none" />

      {/* Mobile Header */}
      <header className={`lg:hidden sticky top-0 z-40 border-b border-[#2E5E99]/10 backdrop-blur-xl supports-[backdrop-filter]:bg-opacity-80 ${theme === 'dark' ? 'bg-[#0D2440]/80' : 'bg-white/80'}`}>
        <div className="flex items-center justify-between px-4 py-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-[#2E5E99]/10">
                <Menu className={`h-6 w-6 ${theme === 'dark' ? 'text-white' : 'text-[#0D2440]'}`} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className={`w-72 p-0 border-r border-[#2E5E99]/10 ${theme === 'dark' ? 'bg-[#0D2440]' : 'bg-[#E7F0FA]'}`}>
              <div className="flex flex-col h-full">
                <div className="p-6 border-b border-[#2E5E99]/10">
                  <div className="relative group mx-auto w-16 h-16">
                    <div className="absolute -inset-2 bg-[#2E5E99]/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                    <img src={logo} alt="Ahaw Logo" className="h-16 w-16 relative z-10" />
                  </div>
                  <h2 className="mt-3 text-center text-lg font-black text-[#2E5E99] tracking-tight text-xl">AHAW</h2>
                  <p className={`text-center text-xs tracking-wider uppercase font-bold ${theme === 'dark' ? 'text-white/40' : 'text-[#0D2440]/40'}`}>
                    Church Management
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  <NavContent isCollapsed={false} />
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <img src={logo} alt="Ahaw" className="h-10 w-10 drop-shadow-md" />

          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="hover:bg-[#2E5E99]/10"
              title={theme === 'light' ? t.settings.appearance : t.settings.appearance}
            >
              {theme === 'light' ? <Moon className="h-5 w-5 text-[#2E5E99]" /> : <Sun className="h-5 w-5 text-[#7BA4D0]" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              title={language === 'en' ? 'Switch to Amharic' : language === 'am' ? 'Switch to Afaan Oromoo' : language === 'om' ? 'Switch to Tigrigna' : 'Switch to English'}
              className="gap-1 hover:bg-[#2E5E99]/10 font-bold"
            >
              <Languages className={`h-5 w-5 ${theme === 'dark' ? 'text-[#7BA4D0]' : 'text-[#2E5E99]'}`} />
              <span className={`text-xs ml-1 ${theme === 'dark' ? 'text-white' : 'text-[#0D2440]'}`}>
                {language === 'en' ? 'AM' : language === 'am' ? 'OM' : language === 'om' ? 'TI' : 'EN'}
              </span>
            </Button>
            <ProfileDropdown />
          </div>
        </div>
      </header>

      <div className="flex relative z-10">
        {/* Desktop Sidebar */}
        <aside
          className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 border-r border-[#2E5E99]/10 backdrop-blur-2xl transition-all duration-300 ${isCollapsed ? 'lg:w-24' : 'lg:w-72'} ${theme === 'dark' ? 'bg-[#0D2440]/40' : 'bg-white/40'}`}
        >
          <div className="flex flex-col h-full">
            <div className={`p-8 border-b border-[#2E5E99]/10 ${isCollapsed ? 'p-4 flex justify-center' : ''}`}>
              <div className={`relative group transition-all duration-300 ${isCollapsed ? 'w-10 h-10' : 'w-20 h-20 mx-auto'}`}>
                <div className="absolute -inset-4 bg-[#2E5E99]/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <img
                  src={logo}
                  alt="Ahaw Logo"
                  className="w-full h-full object-contain relative z-10 drop-shadow-2xl"
                />
              </div>
              {!isCollapsed && (
                <>
                  <h1 className="mt-6 text-center text-3xl font-black text-[#2E5E99] tracking-tighter">AHAW</h1>
                  <p className={`text-center text-[10px] uppercase tracking-[0.3em] font-black mt-1 ${theme === 'dark' ? 'text-[#7BA4D0]' : 'text-[#2E5E99]'}`}>
                    Digital Ministry
                  </p>
                </>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <NavContent isCollapsed={isCollapsed} />
            </div>

            <div className="border-t border-[#2E5E99]/10 p-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={`w-full hover:bg-[#2E5E99]/10 rounded-xl ${theme === 'dark' ? 'text-white/60 hover:text-white' : 'text-[#0D2440]/60 hover:text-[#0D2440]'}`}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <>
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    <span className="text-[10px] uppercase font-black tracking-widest">{t.common.cancel}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main
          className={`flex-1 transition-all duration-500 min-h-screen ${isCollapsed ? 'lg:pl-24' : 'lg:pl-72'}`}
        >
          {/* Desktop Top Bar */}
          <div className={`hidden lg:flex items-center justify-between gap-3 px-10 py-6 border-b border-[#2E5E99]/10 backdrop-blur-xl sticky top-0 z-30 ${theme === 'dark' ? 'bg-[#0D2440]/40' : 'bg-white/40'}`}>
            <div className="flex-1">
              <Breadcrumbs />
            </div>

            <div className="flex items-center gap-4">
              <NotificationBell />
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="hover:bg-[#2E5E99]/10 rounded-xl transition-all"
              >
                {theme === 'light' ? <Moon className="h-5 w-5 text-[#2E5E99]" /> : <Sun className="h-5 w-5 text-[#7BA4D0]" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLanguage}
                className="gap-2 hover:bg-[#2E5E99]/10 rounded-xl px-4 h-10 transition-all font-bold"
              >
                <Languages className={`h-4 w-4 ${theme === 'dark' ? 'text-[#7BA4D0]' : 'text-[#2E5E99]'}`} />
                <span className={`text-xs ${theme === 'dark' ? 'text-white' : 'text-[#0D2440]'}`}>
                  {language === 'en' ? 'AMHARIC' : language === 'am' ? 'OROMOO' : 'ENGLISH'}
                </span>
              </Button>
              <div className="w-px h-8 bg-[#2E5E99]/20 mx-2" />
              <ProfileDropdown />
            </div>
          </div>

          <div className="container max-w-7xl mx-auto p-4 sm:p-6 lg:p-12 space-y-6 sm:space-y-8">
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
