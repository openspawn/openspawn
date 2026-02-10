import { BrowserRouter, HashRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout, ProtectedRoute, NotificationProvider } from "../components";
import { ThemeProvider } from "../components/theme-provider";
import { KeyboardShortcutsHelp, useKeyboardShortcuts } from "../components/keyboard-shortcuts";
import { TasksPage, AgentsPage, CreditsPage, EventsPage, LoginPage, AuthCallbackPage, SettingsPage, MessagesPage } from "../pages";
import { DashboardPage } from "../pages/dashboard";
import { NetworkPage } from "../pages/network";
import { MobileStatusPage } from "../pages/mobile-status";
import { DemoProvider, DemoControls, DemoWelcome } from "../demo";
import { CommandPalette } from "../components/command-palette";

declare const __COMMIT_SHA__: string;
declare const __BUILD_TIME__: string;

// Log build info to console
console.log(
  `%c🌊 BikiniBottom %c${__COMMIT_SHA__}%c built ${__BUILD_TIME__}`,
  'color: #06b6d4; font-weight: bold; font-size: 14px',
  'color: #10b981; background: #0a1628; padding: 2px 6px; border-radius: 4px; font-family: monospace',
  'color: #64748b'
);
import { PageTransition } from "../components/page-transition";
import { OnboardingProvider, WelcomeScreen, FeatureTour, CompletionCelebration } from "../components/onboarding";
import { AuthProvider } from "../contexts";
import type { ReactNode } from "react";

// Check for demo mode via URL param or env
const urlParams = new URLSearchParams(window.location.search);
const isDemoMode = urlParams.get('demo') === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';
const scenarioParam = urlParams.get('scenario') || 'acmetech';

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
      <DemoWelcome />
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

function KeyboardShortcutsWrapper({ children }: { children: ReactNode }) {
  const { helpOpen, setHelpOpen } = useKeyboardShortcuts();
  return (
    <>
      {children}
      <KeyboardShortcutsHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}

export function App() {
  return (
    <ThemeProvider defaultTheme="deep-ocean">
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <NotificationProvider>
            <OnboardingProvider>
            <DemoWrapper>
              <Router>
              <CommandPalette />
              <WelcomeScreen />
              <FeatureTour />
              <CompletionCelebration />
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
                        <PageTransition>
                          <Route path="/" element={<DashboardPage />} />
                          <Route path="/tasks" element={<TasksPage />} />
                          <Route path="/agents" element={<AgentsPage />} />
                          <Route path="/credits" element={<CreditsPage />} />
                          <Route path="/events" element={<EventsPage />} />
                          <Route path="/messages" element={<MessagesPage />} />
                          <Route path="/network" element={<NetworkPage />} />
                          <Route path="/settings" element={<SettingsPage />} />
                          <Route path="/status" element={<MobileStatusPage />} />
                        </PageTransition>
                      </Layout>
                    </MaybeProtectedRoute>
                  }
                />
              </Routes>
            </Router>
            </DemoWrapper>
            </OnboardingProvider>
          </NotificationProvider>
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
