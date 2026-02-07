import { StrictMode } from "react";
import * as ReactDOM from "react-dom/client";
import App from "./app/app";

// Check for demo mode via URL param or env
const urlParams = new URLSearchParams(window.location.search);
const isDemoMode = urlParams.get('demo') === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

async function enableMocking() {
  if (!isDemoMode) {
    return;
  }
  
  console.log('[Demo] Starting MSW in demo mode...');
  
  const { worker } = await import('./demo/browser');
  
  return worker.start({
    onUnhandledRequest: 'bypass', // Allow non-mocked requests through
  });
}

enableMocking().then(() => {
  const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
