import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "../components/layout";
import { ThemeProvider } from "../components/theme-provider";
import { TasksPage, AgentsPage, CreditsPage, EventsPage } from "../pages";
import { DashboardPage } from "../pages/dashboard";
import { NetworkPage } from "../pages/network";
import { DemoProvider, DemoControls } from "../demo";
import type { ReactNode } from "react";

// Check for demo mode via URL param or env
const urlParams = new URLSearchParams(window.location.search);
const isDemoMode = urlParams.get('demo') === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';
const scenarioParam = urlParams.get('scenario') || 'growth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: isDemoMode ? 0 : 1000 * 60, // No cache in demo mode
      refetchOnWindowFocus: false,
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

export function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <QueryClientProvider client={queryClient}>
        <DemoWrapper>
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/agents" element={<AgentsPage />} />
                <Route path="/credits" element={<CreditsPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/network" element={<NetworkPage />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </DemoWrapper>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
