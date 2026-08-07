import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import Home from "./pages/Home";
import Login from "./pages/Login";
import AboutFeatures from "./pages/AboutFeatures";
import Signup from "./pages/Signup";
import PendingApproval from "./pages/PendingApproval";
import LandingEditor from "./pages/LandingEditor";
import PermissionControl from "./pages/PermissionControl";
const MobileControl = lazy(() => import("./pages/MobileControl"));
const SoftwareControl = lazy(() => import("./pages/SoftwareControl"));
const ModuleConfig = lazy(() => import("./pages/ModuleConfig"));

const Quickboard = lazy(() => import("./pages/Quickboard"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Announcements = lazy(() => import("./pages/Announcements"));
const Plans = lazy(() => import("./pages/Plans"));
const Reports = lazy(() => import("./pages/Reports"));
const Members = lazy(() => import("./pages/Members"));
const Meetings = lazy(() => import("./pages/Meetings"));
const Finance = lazy(() => import("./pages/Finance"));
const Hierarchy = lazy(() => import("./pages/Hierarchy"));
const HigeDenb = lazy(() => import("./pages/HigeDenb"));
const Settings = lazy(() => import("./pages/Settings"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const Missionary = lazy(() => import("./pages/Missionary"));
const Teaching = lazy(() => import("./pages/Teaching"));
const StrategicPlan = lazy(() => import("./pages/StrategicPlan"));
const PartnerContact = lazy(() => import("./pages/PartnerContact"));
const Volunteer = lazy(() => import("./pages/Volunteer"));
const MemriyaDocuments = lazy(() => import("./pages/MemriyaDocuments"));
const HR = lazy(() => import("./pages/HR"));
const Inventory = lazy(() => import("./pages/Inventory"));
const ChurchLaws = lazy(() => import("./pages/ChurchLaws"));
const Notifications = lazy(() => import("./pages/Notifications"));
const NewsManager = lazy(() => import("./pages/NewsManager"));
const AtbiyaRegistry = lazy(() => import("./pages/AtbiyaRegistry"));
const MyAtbiya = lazy(() => import("./pages/MyAtbiya"));
const NewsIndex = lazy(() => import("./pages/NewsIndex"));
const NewsPostPage = lazy(() => import("./pages/NewsPost"));
const NotFound = lazy(() => import("./pages/NotFound"));
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import { PermissionProvider } from "./contexts/PermissionContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import { RequirePermission } from "./components/RequirePermission";
import DashboardLayout from "./components/DashboardLayout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { BrandedLoader } from "./components/BrandedLoader";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Route-level Suspense fallbacks. Declared once rather than inline per route:
 * there are thirty-odd of them, and they used to drift into three different
 * spellings of the same bare "Loading…" div.
 *
 * `publicFallback` uses the landing page's own palette so a visitor waiting on
 * a news chunk sees the site, not a blank panel; `appFallback` uses the theme
 * tokens the dashboard is built from.
 */
const appFallback = <BrandedLoader variant="app" />;
const publicFallback = <BrandedLoader />;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <PermissionProvider>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <ErrorBoundary>
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/features" element={<AboutFeatures />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/pending" element={<PendingApproval />} />
                  <Route path="/news" element={<Suspense fallback={publicFallback}><NewsIndex /></Suspense>} />
                  <Route path="/news/:slug" element={<Suspense fallback={publicFallback}><NewsPostPage /></Suspense>} />
                  <Route path="/admin/landing-editor" element={<AdminRoute><LandingEditor /></AdminRoute>} />
                  <Route path="/admin/permissions" element={<AdminRoute superAdminOnly><PermissionControl /></AdminRoute>} />
                  <Route path="/admin/mobile-control" element={<AdminRoute><Suspense fallback={appFallback}><MobileControl /></Suspense></AdminRoute>} />
                  <Route path="/admin/software-control" element={<AdminRoute superAdminOnly><Suspense fallback={appFallback}><SoftwareControl /></Suspense></AdminRoute>} />
                  <Route path="/admin/module-config" element={<AdminRoute><Suspense fallback={appFallback}><ModuleConfig /></Suspense></AdminRoute>} />

                  {/* Protected Dashboard Routes */}
                  <Route path="/quickboard" element={<ProtectedRoute><Suspense fallback={appFallback}><Quickboard /></Suspense></ProtectedRoute>} />
                  <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><Suspense fallback={appFallback}><Dashboard /></Suspense></DashboardLayout></ProtectedRoute>} />
                  <Route path="/announcements" element={<ProtectedRoute><DashboardLayout><RequirePermission permission="canViewAnnouncements" module="announcements" title="Announcements"><Suspense fallback={appFallback}><Announcements /></Suspense></RequirePermission></DashboardLayout></ProtectedRoute>} />
                  <Route path="/plans" element={<ProtectedRoute><DashboardLayout><RequirePermission permission="canViewPlans" module="plans" title="Plans"><Suspense fallback={appFallback}><Plans /></Suspense></RequirePermission></DashboardLayout></ProtectedRoute>} />
                  <Route path="/reports" element={<ProtectedRoute><DashboardLayout><RequirePermission permission="canViewReports" module="reports" title="Reports"><Suspense fallback={appFallback}><Reports /></Suspense></RequirePermission></DashboardLayout></ProtectedRoute>} />
                  <Route path="/members" element={<ProtectedRoute><DashboardLayout><RequirePermission permission="canViewMembers" module="members" title="Members"><Suspense fallback={appFallback}><Members /></Suspense></RequirePermission></DashboardLayout></ProtectedRoute>} />
                  <Route path="/meetings" element={<ProtectedRoute><DashboardLayout><RequirePermission permission="canViewMeetings" module="meetings" title="Meetings"><Suspense fallback={appFallback}><Meetings /></Suspense></RequirePermission></DashboardLayout></ProtectedRoute>} />
                  <Route path="/finance" element={<ProtectedRoute><DashboardLayout><RequirePermission permission="canViewFinance" module="finance" title="Finance"><Suspense fallback={appFallback}><Finance /></Suspense></RequirePermission></DashboardLayout></ProtectedRoute>} />
                  <Route path="/finances" element={<ProtectedRoute><DashboardLayout><RequirePermission permission="canViewFinance" module="finance" title="Finance"><Suspense fallback={appFallback}><Finance /></Suspense></RequirePermission></DashboardLayout></ProtectedRoute>} />
                  <Route path="/hr" element={<ProtectedRoute><DashboardLayout><RequirePermission permission="canViewHR" module="hr" title="Human Resources"><Suspense fallback={appFallback}><HR /></Suspense></RequirePermission></DashboardLayout></ProtectedRoute>} />
                  <Route path="/inventory" element={<ProtectedRoute><DashboardLayout><RequirePermission permission="canViewInventory" module="inventory" title="Inventory"><Suspense fallback={appFallback}><Inventory /></Suspense></RequirePermission></DashboardLayout></ProtectedRoute>} />
                  <Route path="/assets" element={<ProtectedRoute><DashboardLayout><RequirePermission permission="canViewInventory" module="inventory" title="Inventory"><Suspense fallback={appFallback}><Inventory /></Suspense></RequirePermission></DashboardLayout></ProtectedRoute>} />
                  <Route path="/hierarchy" element={<ProtectedRoute><DashboardLayout><Suspense fallback={appFallback}><Hierarchy /></Suspense></DashboardLayout></ProtectedRoute>} />
                  {/* Not under /admin/* on purpose: these are gated by the
                      canManageAtbiyas / parish-scope permissions, which a role
                      can hold without being an admin role. */}
                  <Route path="/atbiya-registry" element={<ProtectedRoute><DashboardLayout><Suspense fallback={appFallback}><AtbiyaRegistry /></Suspense></DashboardLayout></ProtectedRoute>} />
                  <Route path="/my-atbiya" element={<ProtectedRoute><DashboardLayout><Suspense fallback={appFallback}><MyAtbiya /></Suspense></DashboardLayout></ProtectedRoute>} />
                  <Route path="/hige-denb" element={<ProtectedRoute><DashboardLayout><Suspense fallback={appFallback}><HigeDenb /></Suspense></DashboardLayout></ProtectedRoute>} />
                  <Route path="/church-rules" element={<ProtectedRoute><DashboardLayout><Suspense fallback={appFallback}><ChurchLaws /></Suspense></DashboardLayout></ProtectedRoute>} />
                  <Route path="/notifications" element={<ProtectedRoute><DashboardLayout><Suspense fallback={appFallback}><Notifications /></Suspense></DashboardLayout></ProtectedRoute>} />
                  <Route path="/news-manager" element={<ProtectedRoute><DashboardLayout><Suspense fallback={appFallback}><NewsManager /></Suspense></DashboardLayout></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><DashboardLayout><Suspense fallback={appFallback}><Settings /></Suspense></DashboardLayout></ProtectedRoute>} />
                  <Route path="/user-management" element={<ProtectedRoute><DashboardLayout><Suspense fallback={appFallback}><UserManagement /></Suspense></DashboardLayout></ProtectedRoute>} />
                  <Route path="/users" element={<ProtectedRoute><DashboardLayout><Suspense fallback={appFallback}><UserManagement /></Suspense></DashboardLayout></ProtectedRoute>} />
                  <Route path="/missionary" element={<ProtectedRoute><DashboardLayout><Suspense fallback={appFallback}><Missionary /></Suspense></DashboardLayout></ProtectedRoute>} />
                  <Route path="/teachings" element={<ProtectedRoute><DashboardLayout><Suspense fallback={appFallback}><Teaching /></Suspense></DashboardLayout></ProtectedRoute>} />
                  <Route path="/strategic-plan" element={<ProtectedRoute><DashboardLayout><RequirePermission permission="canViewStrategicPlan" module="strategicPlan" title="Strategic Plan"><Suspense fallback={appFallback}><StrategicPlan /></Suspense></RequirePermission></DashboardLayout></ProtectedRoute>} />
                  <Route path="/partner" element={<ProtectedRoute><DashboardLayout><Suspense fallback={appFallback}><PartnerContact /></Suspense></DashboardLayout></ProtectedRoute>} />
                  <Route path="/volunteer" element={<ProtectedRoute><DashboardLayout><Suspense fallback={appFallback}><Volunteer /></Suspense></DashboardLayout></ProtectedRoute>} />
                  <Route path="/documents" element={<ProtectedRoute><DashboardLayout><RequirePermission permission="canViewDocuments" module="documents" title="Documents"><Suspense fallback={appFallback}><MemriyaDocuments /></Suspense></RequirePermission></DashboardLayout></ProtectedRoute>} />
                  
                  {/* Redirect to NotFound module */}
                  <Route path="*" element={<Navigate to="/404" replace />} />
                  <Route path="/404" element={<Suspense fallback={publicFallback}><NotFound /></Suspense>} />
                </Routes>
              </BrowserRouter>
            </ErrorBoundary>
          </TooltipProvider>
        </LanguageProvider>
        </PermissionProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
