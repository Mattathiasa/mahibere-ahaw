import { ReactNode, useState } from 'react';
import { Bell, Home, FileText, Calendar, Users, BookOpen, Menu, Settings, Network, ChevronLeft, ChevronRight, LogOut, Sun, Moon, Languages, DollarSign, Scale, Globe, Handshake, Heart, FolderOpen, ShieldHalf, Newspaper, Layout, Church, UserPlus, Building2, Map as MapIcon, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import logo from '@/assets/logo.png';
import { Link, useLocation } from 'react-router-dom';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ProfileDropdown } from '@/components/ProfileDropdown';
import { NotificationBell } from '@/components/NotificationBell';
import type { PermissionKey } from '@/lib/rolePermissions';
import { useSoftwareControl } from '@/hooks/useSoftwareControl';
import { usePendingRequests } from '@/hooks/usePendingRequests';
import { usePermissions } from '@/contexts/PermissionContext';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LANGUAGE_ENDONYM, nextLanguage } from '@/i18n/languages';
import { ThreeBackground } from './ThreeBackground';

interface DashboardLayoutProps {
  children: ReactNode;
}

interface NavFlags {
  can: (permission: PermissionKey) => boolean;
  /** Belongs to a parish AND has a parish-level role — i.e. runs one. */
  runsAnAtbiya: boolean;
  /** Sees data across the whole organisation, so has no single queue of its own. */
  isHeadOffice: boolean;
  mayApprove: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
}

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  /** Shown when the user holds this permission. */
  permission?: PermissionKey;
  /** For entries with no single permission of their own. */
  show?: boolean;
}

/**
 * The sidebar.
 *
 * Every entry is permission-gated. This list used to be half unconditional, so
 * an ordinary member who signed up landed on a sidebar offering finance, HR,
 * inventory and the strategic plan — pages their role never had permission to
 * act in. The permission keys mostly already existed; nothing was reading them.
 */
const getNavigationItems = ({
  can, runsAnAtbiya, isHeadOffice, mayApprove, isSuperAdmin, isAdmin,
}: NavFlags): NavItem[] => {
  const items: NavItem[] = [
    { name: 'dashboard', href: '/dashboard', icon: Home, permission: 'canViewDashboard' },
    { name: 'announcements', href: '/announcements', icon: Bell, permission: 'canViewAnnouncements' },
    { name: 'plans', href: '/plans', icon: FileText, permission: 'canViewPlans' },
    { name: 'reports', href: '/reports', icon: Calendar, permission: 'canViewReports' },
    { name: 'members', href: '/members', icon: Users, permission: 'canViewMembers' },
    { name: 'meetings', href: '/meetings', icon: Calendar, permission: 'canViewMeetings' },
    { name: 'finance', href: '/finance', icon: DollarSign, permission: 'canViewFinance' },
    { name: 'hr', href: '/hr', icon: Users, permission: 'canViewHR' },
    { name: 'inventory', href: '/inventory', icon: FolderOpen, permission: 'canViewInventory' },
    // Where a member reads announcements broadcast to them, so it must be
    // reachable by every role that can receive one.
    { name: 'notifications', href: '/notifications', icon: Bell, permission: 'canViewNotifications' },
    { name: 'churchRules', href: '/church-rules', icon: Scale, permission: 'canViewChurchRules' },
    { name: 'higeDenb', href: '/hige-denb', icon: BookOpen, permission: 'canViewHigeDenb' },
    { name: 'strategicPlan', href: '/strategic-plan', icon: FileText, permission: 'canViewStrategicPlan' },
    { name: 'documents', href: '/documents', icon: FolderOpen, permission: 'canViewDocuments' },
    { name: 'news', href: '/news-manager', icon: Newspaper, permission: 'canViewNews' },
    { name: 'userManagement', href: '/user-management', icon: Users, permission: 'canViewUserManagement' },
    { name: 'hierarchy', href: '/hierarchy', icon: Network, permission: 'canViewHierarchy' },
    // Every org level, congregations included, behind one entry.
    { name: 'organisation', href: '/organisation', icon: Building2, show: can('canViewHierarchy') || can('canManageAtbiyas') },
    // Beside the registry it complements: the same congregations, placed rather
    // than listed. Gated on the permission that already governs the registry, so
    // super admins and head office see it and nobody else does.
    { name: 'churchMap', href: '/church-map', icon: MapIcon, permission: 'canManageAtbiyas' },
    { name: 'myAtbiya', href: '/my-atbiya', icon: Church, show: runsAnAtbiya },
    // Head office approves on any congregation's behalf but runs none itself,
    // so /my-atbiya is empty for them and the queue needs its own home.
    { name: 'membershipRequests', href: '/membership-requests', icon: UserPlus, show: isHeadOffice && mayApprove },
    // The Landing Editor had no sidebar entry at all — it was reachable only via
    // a card buried in Settings, which is why it looked like it had been removed.
    { name: 'landingEditor', href: '/admin/landing-editor', icon: Layout, show: isAdmin || isSuperAdmin },
    { name: 'softwareControl', href: '/admin/software-control', icon: ShieldHalf, show: isSuperAdmin },
    { name: 'settings', href: '/settings', icon: Settings, permission: 'canViewSettings' },
  ];

  return items.filter((item) => item.show ?? (item.permission ? can(item.permission) : true));
};

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const { user: currentUser, logout, isLoggingOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { showNav } = useSoftwareControl();
  const { can, isSuperAdmin, isAdminRole, isApproverRole, isHeadOffice, scopeOf, myAtbiyaId } = usePermissions();
  const { count: pendingCount } = usePendingRequests();
  const navigationItems = getNavigationItems({
    // `can` is the permission matrix itself, so User Management is no longer
    // driven by a hardcoded `=== 'Memriya'` that had locked out Sinodos.
    can,
    runsAnAtbiya: !!myAtbiyaId && scopeOf(currentUser?.hierarchyLevel) === 'atbiya',
    isHeadOffice,
    // Same test MembershipRequests uses, so the entry never leads to a page
    // that renders nothing.
    mayApprove: isSuperAdmin || can('canApproveMembers') || isApproverRole(currentUser?.hierarchyLevel),
    isSuperAdmin,
    isAdmin: isAdminRole(currentUser?.hierarchyLevel),
  }).filter((item) => showNav(item.name));

  const handleLogout = () => {
    logout();
  };

  const upcomingLanguage = nextLanguage(language);
  const toggleLanguage = () => setLanguage(upcomingLanguage);

  const NavContent = ({ isCollapsed = false }: { isCollapsed?: boolean }) => (
    <nav className="space-y-1">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href;
        // Newer nav entries have no i18n key yet — fall back rather than
        // rendering an empty label.
        // Every nav key now exists in the `nav` section, so there is no English
        // fallback map to fall through to — that map was why Notifications,
        // Landing Page and Membership Requests stayed English.
        const translatedName = (t.nav as Record<string, string | undefined>)[item.name] ?? item.name;
        // Requests waiting on this parish, shown where the administrator will
        // actually look rather than only inside the console itself.
        const badge = item.name === 'myAtbiya' || item.name === 'membershipRequests'
          ? pendingCount : 0;
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
                  <div className="relative group mx-auto w-20 h-20">
                    <div className="absolute -inset-2 bg-gradient-to-r from-[#2E5E99]/30 to-[#7BA4D0]/30 rounded-2xl blur-md opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10 w-full h-full p-2 bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-2xl border border-[#2E5E99]/20 shadow-lg flex items-center justify-center">
                      <img src={logo} alt={t.common.logoAlt} className="w-full h-full object-contain drop-shadow-md" />
                    </div>
                  </div>
                  <h2 className="mt-4 text-center text-xl font-black text-[#2E5E99] tracking-tight">{t.common.brandName}</h2>
                  <p className={`text-center text-[10px] tracking-[0.25em] uppercase font-bold ${theme === 'dark' ? 'text-white/50' : 'text-[#0D2440]/50'}`}>
                    {t.common.brandTagline}
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  <NavContent isCollapsed={false} />
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2">
            <div className="p-1 rounded-xl bg-white/80 dark:bg-white/10 border border-[#2E5E99]/20 shadow-sm">
              <img src={logo} alt={t.common.logoAlt} className="h-9 w-9 object-contain drop-shadow-sm" />
            </div>
            <span className="font-black text-base text-[#2E5E99] tracking-tighter">{t.common.brandShort}</span>
          </div>

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
              title={LANGUAGE_ENDONYM[language]}
              className="gap-1 hover:bg-[#2E5E99]/10 font-bold"
            >
              <Languages className={`h-5 w-5 ${theme === 'dark' ? 'text-[#7BA4D0]' : 'text-[#2E5E99]'}`} />
              <span className={`text-xs ml-1 ${theme === 'dark' ? 'text-white' : 'text-[#0D2440]'}`}>
                {LANGUAGE_ENDONYM[language]}
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
            <div className={`p-6 border-b border-[#2E5E99]/10 ${isCollapsed ? 'p-4 flex justify-center' : ''}`}>
              <div className={`relative group transition-all duration-300 ${isCollapsed ? 'w-12 h-12' : 'w-24 h-24 mx-auto'}`}>
                <div className="absolute -inset-2 bg-gradient-to-r from-[#2E5E99]/30 via-[#FABB2A]/20 to-[#7BA4D0]/30 rounded-2xl blur-lg opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 w-full h-full p-2.5 bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-2xl border border-[#2E5E99]/20 shadow-lg flex items-center justify-center">
                  <img
                    src={logo}
                    alt={t.common.logoAlt}
                    className="w-full h-full object-contain drop-shadow-md"
                  />
                </div>
              </div>
              {!isCollapsed && (
                <>
                  <h1 className="mt-4 text-center text-2xl font-black text-[#2E5E99] tracking-tighter">{t.common.brandName}</h1>
                  <p className={`text-center text-[10px] uppercase tracking-[0.25em] font-bold mt-1 ${theme === 'dark' ? 'text-[#7BA4D0]' : 'text-[#2E5E99]'}`}>
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
                  {LANGUAGE_ENDONYM[language]}
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
