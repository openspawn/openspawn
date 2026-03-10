import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LandingPage } from "./landing-page";
import "./styles/globals.css";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Missing #root element");
createRoot(rootEl).render(
  <StrictMode>
    <LandingPage />
  </StrictMode>,
);
