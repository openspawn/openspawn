import { StrictMode } from "react";
import * as ReactDOM from "react-dom/client";
import App from "./app/app";

// Simple render - no MSW needed, demo mode uses mock fetcher directly
const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
