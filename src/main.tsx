import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ThemeProvider } from "next-themes";
import "./index.css";
import { initMonitoring } from "./lib/monitoring";

// Initialize monitoring system
initMonitoring();

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <App />
  </ThemeProvider>
);
