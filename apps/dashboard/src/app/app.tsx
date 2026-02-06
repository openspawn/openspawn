import { Provider } from "urql";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { Layout } from "../components";
import { client } from "../graphql/client";
import { TasksPage, AgentsPage, CreditsPage, EventsPage } from "../pages";

export function App() {
  return (
    <Provider value={client}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/tasks" replace />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/agents" element={<AgentsPage />} />
            <Route path="/credits" element={<CreditsPage />} />
            <Route path="/events" element={<EventsPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
