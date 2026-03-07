import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import AboutFeatures from "./pages/AboutFeatures";
import Dashboard from "./pages/Dashboard";
import Announcements from "./pages/Announcements";
import Plans from "./pages/Plans";
import Reports from "./pages/Reports";
import Members from "./pages/Members";
import Meetings from "./pages/Meetings";
import Finance from "./pages/Finance";
import Hierarchy from "./pages/Hierarchy";
import HigeDenb from "./pages/HigeDenb";
import Settings from "./pages/Settings";
import UserManagement from "./pages/UserManagement";
import Missionary from "./pages/Missionary";
import Teaching from "./pages/Teaching";
import StrategicPlan from "./pages/StrategicPlan";
import PartnerContact from "./pages/PartnerContact";
import Volunteer from "./pages/Volunteer";
import MemriyaDocuments from "./pages/MemriyaDocuments";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";

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
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/features" element={<AboutFeatures />} />

                {/* Protected Dashboard Routes */}
                <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><Dashboard /></DashboardLayout></ProtectedRoute>} />
                <Route path="/announcements" element={<ProtectedRoute><DashboardLayout><Announcements /></DashboardLayout></ProtectedRoute>} />
                <Route path="/plans" element={<ProtectedRoute><DashboardLayout><Plans /></DashboardLayout></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute><DashboardLayout><Reports /></DashboardLayout></ProtectedRoute>} />
                <Route path="/members" element={<ProtectedRoute><DashboardLayout><Members /></DashboardLayout></ProtectedRoute>} />
                <Route path="/meetings" element={<ProtectedRoute><DashboardLayout><Meetings /></DashboardLayout></ProtectedRoute>} />
                <Route path="/finance" element={<ProtectedRoute><DashboardLayout><Finance /></DashboardLayout></ProtectedRoute>} />
                <Route path="/hierarchy" element={<ProtectedRoute><DashboardLayout><Hierarchy /></DashboardLayout></ProtectedRoute>} />
                <Route path="/hige-denb" element={<ProtectedRoute><DashboardLayout><HigeDenb /></DashboardLayout></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><DashboardLayout><Settings /></DashboardLayout></ProtectedRoute>} />
                <Route path="/user-management" element={<ProtectedRoute><DashboardLayout><UserManagement /></DashboardLayout></ProtectedRoute>} />
                <Route path="/missionary" element={<ProtectedRoute><DashboardLayout><Missionary /></DashboardLayout></ProtectedRoute>} />
                <Route path="/teachings" element={<ProtectedRoute><DashboardLayout><Teaching /></DashboardLayout></ProtectedRoute>} />
                <Route path="/strategic-plan" element={<ProtectedRoute><DashboardLayout><StrategicPlan /></DashboardLayout></ProtectedRoute>} />
                <Route path="/partner" element={<ProtectedRoute><DashboardLayout><PartnerContact /></DashboardLayout></ProtectedRoute>} />
                <Route path="/volunteer" element={<ProtectedRoute><DashboardLayout><Volunteer /></DashboardLayout></ProtectedRoute>} />
                <Route path="/documents" element={<ProtectedRoute><DashboardLayout><MemriyaDocuments /></DashboardLayout></ProtectedRoute>} />

                {/* Redirect all other routes to home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
