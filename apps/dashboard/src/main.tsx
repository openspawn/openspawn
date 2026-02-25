import { StrictMode } from "react";
import * as ReactDOM from "react-dom/client";
import App from "./app/app";
import { AppErrorBoundary } from "./components/error-boundary";

// Simple render - no MSW needed, demo mode uses mock fetcher directly
const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

root.render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
);
