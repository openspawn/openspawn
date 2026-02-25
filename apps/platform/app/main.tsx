import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LandingPage } from "./landing-page";
import "./styles/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LandingPage />
  </StrictMode>
);
