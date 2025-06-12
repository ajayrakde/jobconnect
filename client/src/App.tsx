import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/components/auth/AuthProvider";
import { AdminProtectedRoute } from "@/components/auth/AdminProtectedRoute";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navbar } from "@/components/common/Navbar";
import { Chatbot } from "@/components/common/Chatbot";
import { Landing } from "@/pages/Landing";
import { Dashboard } from "@/pages/Dashboard";
import { Admin } from "@/pages/Admin";
import { CandidateApplications } from "@/components/candidate/CandidateApplications";
import { CandidateProfileEdit } from "@/components/candidate/CandidateProfileEdit";
import { EmployerRegistration } from "@/components/employer/EmployerRegistration";
import { EmployerDashboard } from "@/components/employer/EmployerDashboard";
import { EmployerJobs } from "@/components/employer/EmployerJobs";
import { EmployerJobCreate } from "@/components/employer/EmployerJobCreate";
import { EmployerJobEdit } from "@/components/employer/EmployerJobEdit";
import { JobDetails } from "@/components/employer/JobDetails";
import { EmployerProfile } from "@/components/employer/EmployerProfile";
import { AdminCandidates } from "@/components/admin/AdminCandidates";
import { AdminEmployers } from "@/components/admin/AdminEmployers";
import { AdminJobPosts } from "@/components/admin/AdminJobPosts";
import { AdminVerifications } from "@/components/admin/AdminVerifications";
import { AdminCompatibilityEngine } from "@/components/admin/AdminCompatibilityEngine";
import { AdminReportsAnalytics } from "@/components/admin/AdminReportsAnalytics";
import { AdminTools } from "@/components/admin/AdminTools";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Landing />;
  }

  return <>{children}</>;
}

function Router() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      {user && <Navbar />}
      <Switch>
        <Route path="/" component={user ? Dashboard : Landing} />

        {/* Admin Routes */}
        <Route path="/admin" component={Admin} />
        <Route path="/admin/dashboard">
          <ProtectedRoute>
            <div className="min-h-screen bg-background">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <AdminDashboard />
              </div>
            </div>
          </ProtectedRoute>
        </Route>
        <Route path="/admin/search">
          <ProtectedRoute>
            <div className="min-h-screen bg-background">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <AdminJobPosts />
              </div>
            </div>
          </ProtectedRoute>
        </Route>
        <Route path="/admin/verifications">
          <AdminProtectedRoute>
            <div className="min-h-screen bg-background">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <AdminVerifications />
              </div>
            </div>
          </AdminProtectedRoute>
        </Route>
        <Route path="/admin/tools">
          <AdminProtectedRoute>
            <div className="min-h-screen bg-background">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <AdminTools />
              </div>
            </div>
          </AdminProtectedRoute>
        </Route>

        {/* Candidate Routes */}
        <Route path="/candidate">
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/candidate/jobs">
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/applications">
          <ProtectedRoute>
            <div className="min-h-screen bg-background">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <CandidateApplications />
              </div>
            </div>
          </ProtectedRoute>
        </Route>
        <Route path="/profile">
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/candidate/profile/edit">
          <ProtectedRoute>
            <div className="min-h-screen bg-background">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <CandidateProfileEdit />
              </div>
            </div>
          </ProtectedRoute>
        </Route>
        <Route path="/dashboard">
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        </Route>

        {/* Employer Routes */}
        <Route path="/employer/">
          <ProtectedRoute>
            <div className="min-h-screen bg-background">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <EmployerDashboard />
              </div>
            </div>
          </ProtectedRoute>
        </Route>
        <Route path="/employer/dashboard">
          <ProtectedRoute>
            <div className="min-h-screen bg-background">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <EmployerDashboard />
              </div>
            </div>
          </ProtectedRoute>
        </Route>

        {/* Additional Employer Routes */}
        <Route path="/employer/register">
          <ProtectedRoute>
            <EmployerRegistration />
          </ProtectedRoute>
        </Route>
        <Route path="/jobs">
          <ProtectedRoute>
            <div className="min-h-screen bg-background">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <EmployerJobs />
              </div>
            </div>
          </ProtectedRoute>
        </Route>

        <Route path="/jobs/create">
          <ProtectedRoute>
            <div className="min-h-screen bg-background">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <EmployerJobCreate />
              </div>
            </div>
          </ProtectedRoute>
        </Route>
        <Route path="/jobs/:id/edit">
          <ProtectedRoute>
            <div className="min-h-screen bg-background">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <EmployerJobEdit />
              </div>
            </div>
          </ProtectedRoute>
        </Route>
        <Route path="/jobs/:id">
          <ProtectedRoute>
            <div className="min-h-screen bg-background">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <JobDetails />
              </div>
            </div>
          </ProtectedRoute>
        </Route>
        <Route path="/employer/profile">
          <ProtectedRoute>
            <div className="min-h-screen bg-background">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <EmployerProfile />
              </div>
            </div>
          </ProtectedRoute>
        </Route>

        <Route component={NotFound} />
      </Switch>
      <Chatbot />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="lokaltalent-theme">
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Router />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
