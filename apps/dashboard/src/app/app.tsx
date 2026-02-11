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
import { isSandboxMode } from "../graphql/fetcher";
import { CommandPalette } from "../components/command-palette";
import { PwaInstallPrompt } from "../components/pwa-install-prompt";
import { OfflineIndicator } from "../components/offline-indicator";

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
import { AuthProvider, SidePanelProvider } from "../contexts";
import type { ReactNode } from "react";

// Check for demo/sandbox mode via URL param or env
const urlParams = new URLSearchParams(window.location.search);
const isDemoMode = urlParams.get('demo') === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';
const scenarioParam = urlParams.get('scenario') || 'acmetech';

// Use HashRouter everywhere — BrowserRouter causes blank page with nested Routes in PageTransition
const Router = HashRouter;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: (isDemoMode || isSandboxMode) ? 1000 * 5 : 1000 * 60, // 5s in demo/sandbox
      gcTime: (isDemoMode || isSandboxMode) ? 1000 * 30 : 1000 * 60 * 5, // 30s in demo/sandbox
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      // In sandbox mode, poll every 3s for live updates from Ollama agents
      ...(isSandboxMode ? { refetchInterval: 3000 } : {}),
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

// In demo/sandbox mode, skip auth protection
function MaybeProtectedRoute({ children }: { children: ReactNode }) {
  if (isDemoMode || isSandboxMode) {
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
            <SidePanelProvider>
            <DemoWrapper>
              <Router>
              <OfflineIndicator />
              {/* <PwaInstallPrompt /> — disabled for public demo */}
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
            </SidePanelProvider>
            </OnboardingProvider>
          </NotificationProvider>
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
