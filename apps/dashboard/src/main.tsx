import * as ReactDOM from "react-dom/client";
import App from "./app/app";
import { AppErrorBoundary } from "./components/error-boundary";

// Simple render - no MSW needed, demo mode uses mock fetcher directly
const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

// StrictMode disabled — causes __store crash with TanStack Router + React 19
// (double-render triggers router store access before initialization)
root.render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>,
);
