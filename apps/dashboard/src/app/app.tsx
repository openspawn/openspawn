import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider as UrqlProvider } from "urql";
import { client } from "../graphql/client";
import { Layout } from "../components/layout";
import { ThemeProvider } from "../components/theme-provider";
import { TasksPage, AgentsPage, CreditsPage, EventsPage } from "../pages";
import { DashboardPage } from "../pages/dashboard";

export function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <UrqlProvider value={client}>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/agents" element={<AgentsPage />} />
              <Route path="/credits" element={<CreditsPage />} />
              <Route path="/events" element={<EventsPage />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </UrqlProvider>
    </ThemeProvider>
  );
}

export default App;
