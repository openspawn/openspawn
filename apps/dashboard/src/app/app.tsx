import { BrowserRouter, HashRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout, ProtectedRoute } from "../components";
import { ThemeProvider } from "../components/theme-provider";
import { TasksPage, AgentsPage, CreditsPage, EventsPage, LoginPage, AuthCallbackPage, SettingsPage, MessagesPage } from "../pages";
import { DashboardPage } from "../pages/dashboard";
import { NetworkPage } from "../pages/network";
import { DemoProvider, DemoControls } from "../demo";
import { AuthProvider } from "../contexts";
import type { ReactNode } from "react";

// Check for demo mode via URL param or env
const urlParams = new URLSearchParams(window.location.search);
const isDemoMode = urlParams.get('demo') === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';
const scenarioParam = urlParams.get('scenario') || 'fresh';

// Use HashRouter for static demo deployment (GitHub Pages), BrowserRouter otherwise
const Router = isDemoMode ? HashRouter : BrowserRouter;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: isDemoMode ? 0 : 1000 * 60, // No cache in demo mode
      gcTime: isDemoMode ? 0 : 1000 * 60 * 5, // No garbage collection delay in demo
      refetchOnWindowFocus: false,
      refetchOnMount: isDemoMode ? 'always' : true, // Always refetch in demo mode
    },
  },
});

// Wrapper that conditionally applies DemoProvider
function DemoWrapper({ children }: { children: ReactNode }) {
  if (!isDemoMode) {
    return <>{children}</>;
  }
  
  return (
    <DemoProvider scenario={scenarioParam} autoPlay={false} initialSpeed={1}>
      {children}
      <DemoControls />
    </DemoProvider>
  );
}

// In demo mode, skip auth protection
function MaybeProtectedRoute({ children }: { children: ReactNode }) {
  if (isDemoMode) {
    return <>{children}</>;
  }
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

export function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <DemoWrapper>
            <Router>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/auth/callback" element={<AuthCallbackPage />} />
                
                {/* Protected routes */}
                <Route
                  path="/*"
                  element={
                    <MaybeProtectedRoute>
                      <Layout>
                        <Routes>
                          <Route path="/" element={<DashboardPage />} />
                          <Route path="/tasks" element={<TasksPage />} />
                          <Route path="/agents" element={<AgentsPage />} />
                          <Route path="/credits" element={<CreditsPage />} />
                          <Route path="/events" element={<EventsPage />} />
                          <Route path="/messages" element={<MessagesPage />} />
                          <Route path="/network" element={<NetworkPage />} />
                          <Route path="/settings" element={<SettingsPage />} />
                        </Routes>
                      </Layout>
                    </MaybeProtectedRoute>
                  }
                />
              </Routes>
            </Router>
          </DemoWrapper>
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
