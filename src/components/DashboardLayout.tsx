import { ReactNode, useState } from 'react';
import { Bell, Home, FileText, Calendar, Users, BookOpen, Menu, Settings, Network, ChevronLeft, ChevronRight, LogOut, Sun, Moon, Languages, DollarSign, Scale, Globe, Handshake, Heart, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import logo from '@/assets/logo.png';
import { Link, useLocation } from 'react-router-dom';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ProfileDropdown } from '@/components/ProfileDropdown';
import { NotificationBell } from '@/components/NotificationBell';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';
import { ThreeBackground } from './ThreeBackground';

interface DashboardLayoutProps {
  children: ReactNode;
}

const getNavigationItems = (canViewHierarchy: boolean, canManageUsers: boolean, t: (key: string) => string) => {
  const items = [
    { name: 'dashboard', href: '/dashboard', icon: Home },
    { name: 'announcements', href: '/announcements', icon: Bell },
    { name: 'plans', href: '/plans', icon: FileText },
    { name: 'reports', href: '/reports', icon: Calendar },
    { name: 'members', href: '/members', icon: Users },
    { name: 'meetings', href: '/meetings', icon: Calendar },
    { name: 'finance', href: '/finance', icon: DollarSign },
    { name: 'churchRules', href: '/church-rules', icon: Scale },
    { name: 'higeDenb', href: '/hige-denb', icon: BookOpen },
    { name: 'missionary', href: '/missionary', icon: Globe },
    { name: 'teachings', href: '/teachings', icon: BookOpen },
    { name: 'strategicPlan', href: '/strategic-plan', icon: FileText },
    { name: 'partner', href: '/partner', icon: Handshake },
    { name: 'volunteer', href: '/volunteer', icon: Heart },
    { name: 'documents', href: '/documents', icon: FolderOpen },
  ];

  if (canManageUsers) {
    items.push({ name: 'userManagement', href: '/user-management', icon: Users });
  }

  if (canViewHierarchy) {
    items.push({ name: 'hierarchy', href: '/hierarchy', icon: Network });
  }

  items.push({ name: 'settings', href: '/settings', icon: Settings });

  return items;
};

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const permissions = useRolePermissions();
  const { user: currentUser, logout, isLoggingOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage } = useLanguage();
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const canManageUsers = currentUser?.hierarchyLevel === 'Memriya';
  const navigationItems = getNavigationItems(permissions.canViewHierarchy, canManageUsers, t);

  const handleLogout = () => {
    logout();
  };

  const NavContent = ({ isCollapsed = false }: { isCollapsed?: boolean }) => (
    <nav className="space-y-1">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href;
        const translatedName = t(item.name as any);
        return (
          <Link
            key={item.name}
            to={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${isActive
              ? 'bg-[#2E5E99] text-white font-bold shadow-lg shadow-[#2E5E99]/20'
              : `text-muted-foreground hover:bg-[#2E5E99]/5 hover:text-[#2E5E99] ${theme === 'dark' ? 'text-white/60' : 'text-[#0D2440]/60'}`
              }`}
            title={isCollapsed ? translatedName : undefined}
          >
            <Icon className={`h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110 ${isCollapsed ? 'mx-auto' : ''}`} />
            {!isCollapsed && <span className="font-medium tracking-wide">{translatedName}</span>}
          </Link>
        );
      })}

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group text-red-500/80 hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed ${isCollapsed ? 'justify-center' : ''
          }`}
        title={isCollapsed ? t('logout') : undefined}
      >
        <LogOut className={`h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110 ${isCollapsed ? 'mx-auto' : ''}`} />
        {!isCollapsed && <span className="font-medium tracking-wide">{isLoggingOut ? t('loggingOut') : t('logout')}</span>}
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
              title={theme === 'light' ? t('switchToDark') : t('switchToLight')}
            >
              {theme === 'light' ? <Moon className="h-5 w-5 text-[#2E5E99]" /> : <Sun className="h-5 w-5 text-[#7BA4D0]" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              title={language === 'en' ? t('switchToAmharic') : t('switchToEnglish')}
              className="gap-1 hover:bg-[#2E5E99]/10 font-bold"
            >
              <Languages className={`h-5 w-5 ${theme === 'dark' ? 'text-[#7BA4D0]' : 'text-[#2E5E99]'}`} />
              <span className={`text-xs ml-1 ${theme === 'dark' ? 'text-white' : 'text-[#0D2440]'}`}>{language === 'en' ? 'AM' : 'EN'}</span>
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
                    <span className="text-[10px] uppercase font-black tracking-widest">{t('collapse')}</span>
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
                <span className={`text-xs ${theme === 'dark' ? 'text-white' : 'text-[#0D2440]'}`}>{language === 'en' ? 'AMHARIC' : 'ENGLISH'}</span>
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
