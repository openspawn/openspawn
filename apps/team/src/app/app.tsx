import { RouterProvider } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SidePanelProvider, registerPanelComponents } from "@openspawn/dashboard-data";
import { AgentDetailPanel, TaskDetailPanel } from "@openspawn/dashboard-ui";
import { router } from "../routes";

declare const __COMMIT_SHA__: string;
declare const __BUILD_TIME__: string;

console.log(
  `%c⚡ OpenSpawn Team %c${__COMMIT_SHA__}%c built ${__BUILD_TIME__}`,
  "color: #06b6d4; font-weight: bold; font-size: 14px",
  "color: #10b981; background: #0a1628; padding: 2px 6px; border-radius: 4px; font-family: monospace",
  "color: #64748b",
);

// Register shared panel components so useDashboardPanels() can render them
registerPanelComponents({ AgentDetailPanel, TaskDetailPanel });

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      gcTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SidePanelProvider>
        <RouterProvider router={router} />
      </SidePanelProvider>
    </QueryClientProvider>
  );
}

export default App;
