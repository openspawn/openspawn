import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "../components/layout";
import { ThemeProvider } from "../components/theme-provider";
import { TasksPage, AgentsPage, CreditsPage, EventsPage } from "../pages";
import { DashboardPage } from "../pages/dashboard";
import { NetworkPage } from "../pages/network";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <QueryClientProvider client={queryClient}>
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
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
