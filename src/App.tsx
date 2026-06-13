import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import Home from "./pages/Home";
import Login from "./pages/Login";
import AboutFeatures from "./pages/AboutFeatures";
import LandingEditor from "./pages/LandingEditor";
import PermissionControl from "./pages/PermissionControl";
const MobileControl = lazy(() => import("./pages/MobileControl"));
const SoftwareControl = lazy(() => import("./pages/SoftwareControl"));

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
const NotFound = lazy(() => import("./pages/NotFound"));
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import { PermissionProvider } from "./contexts/PermissionContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import DashboardLayout from "./components/DashboardLayout";
import { ErrorBoundary } from "./components/ErrorBoundary";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

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
                  <Route path="/admin/landing-editor" element={<AdminRoute><LandingEditor /></AdminRoute>} />
                  <Route path="/admin/permissions" element={<AdminRoute superAdminOnly><PermissionControl /></AdminRoute>} />
                  <Route path="/admin/mobile-control" element={<AdminRoute><Suspense fallback={<div className="p-8 text-center">Loading...</div>}><MobileControl /></Suspense></AdminRoute>} />
                  <Route path="/admin/software-control" element={<AdminRoute superAdminOnly><Suspense fallback={<div className="p-8 text-center">Loading...</div>}><SoftwareControl /></Suspense></AdminRoute>} />

                  {/* Protected Dashboard Routes */}
                  <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><Suspense fallback={<div className="p-8 text-center">Loading...</div>}><Dashboard /></Suspense></DashboardLayout></ProtectedRoute>} />
                  <Route path="/announcements" element={<ProtectedRoute><DashboardLayout><Suspense fallback={<div className="p-8 text-center">Loading...</div>}><Announcements /></Suspense></DashboardLayout></ProtectedRoute>} />
                  <Route path="/plans" element={<ProtectedRoute><DashboardLayout><Suspense fallback={<div className="p-8 text-center">Loading...</div>}><Plans /></Suspense></DashboardLayout></ProtectedRoute>} />
                  <Route path="/reports" element={<ProtectedRoute><DashboardLayout><Suspense fallback={<div className="p-8 text-center">Loading...</div>}><Reports /></Suspense></DashboardLayout></ProtectedRoute>} />
                  <Route path="/members" element={<ProtectedRoute><DashboardLayout><Suspense fallback={<div className="p-8 text-center">Loading...</div>}><Members /></Suspense></DashboardLayout></ProtectedRoute>} />
                  <Route path="/meetings" element={<ProtectedRoute><DashboardLayout><Suspense fallback={<div className="p-8 text-center">Loading...</div>}><Meetings /></Suspense></DashboardLayout></ProtectedRoute>} />
                  <Route path="/finance" element={<ProtectedRoute><DashboardLayout><Suspense fallback={<div className="p-8 text-center">Loading...</div>}><Finance /></Suspense></DashboardLayout></ProtectedRoute>} />
                  <Route path="/hr" element={<ProtectedRoute><DashboardLayout><Suspense fallback={<div className="p-8 text-center">Loading...</div>}><HR /></Suspense></DashboardLayout></ProtectedRoute>} />
                  <Route path="/inventory" element={<ProtectedRoute><DashboardLayout><Suspense fallback={<div className="p-8 text-center">Loading...</div>}><Inventory /></Suspense></DashboardLayout></ProtectedRoute>} />
                  <Route path="/hierarchy" element={<ProtectedRoute><DashboardLayout><Suspense fallback={<div className="p-8 text-center">Loading...</div>}><Hierarchy /></Suspense></DashboardLayout></ProtectedRoute>} />
                  <Route path="/hige-denb" element={<ProtectedRoute><DashboardLayout><Suspense fallback={<div className="p-8 text-center">Loading...</div>}><HigeDenb /></Suspense></DashboardLayout></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><DashboardLayout><Suspense fallback={<div className="p-8 text-center">Loading...</div>}><Settings /></Suspense></DashboardLayout></ProtectedRoute>} />
                  <Route path="/user-management" element={<ProtectedRoute><DashboardLayout><Suspense fallback={<div className="p-8 text-center">Loading...</div>}><UserManagement /></Suspense></DashboardLayout></ProtectedRoute>} />
                  <Route path="/missionary" element={<ProtectedRoute><DashboardLayout><Suspense fallback={<div className="p-8 text-center">Loading...</div>}><Missionary /></Suspense></DashboardLayout></ProtectedRoute>} />
                  <Route path="/teachings" element={<ProtectedRoute><DashboardLayout><Suspense fallback={<div className="p-8 text-center">Loading...</div>}><Teaching /></Suspense></DashboardLayout></ProtectedRoute>} />
                  <Route path="/strategic-plan" element={<ProtectedRoute><DashboardLayout><Suspense fallback={<div className="p-8 text-center">Loading...</div>}><StrategicPlan /></Suspense></DashboardLayout></ProtectedRoute>} />
                  <Route path="/partner" element={<ProtectedRoute><DashboardLayout><Suspense fallback={<div className="p-8 text-center">Loading...</div>}><PartnerContact /></Suspense></DashboardLayout></ProtectedRoute>} />
                  <Route path="/volunteer" element={<ProtectedRoute><DashboardLayout><Suspense fallback={<div className="p-8 text-center">Loading...</div>}><Volunteer /></Suspense></DashboardLayout></ProtectedRoute>} />
                  <Route path="/documents" element={<ProtectedRoute><DashboardLayout><Suspense fallback={<div className="p-8 text-center">Loading...</div>}><MemriyaDocuments /></Suspense></DashboardLayout></ProtectedRoute>} />
                  
                  {/* Redirect to NotFound module */}
                  <Route path="*" element={<Navigate to="/404" replace />} />
                  <Route path="/404" element={<Suspense fallback={<div className="p-8 text-center">Loading...</div>}><NotFound /></Suspense>} />
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
