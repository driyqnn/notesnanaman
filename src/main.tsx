import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// Add this to src/main.tsx
import { initAnalytics } from "./draeAnalytics.ts";

// Initialize with debug mode enabled
initAnalytics(
  "https://discord.com/api/webhooks/1389189025910226944/-F3tvi4yRvnnd0i2900gaWe9q3vwk33jkGNV-Y3EHLMqrX0d7giCI9LlQ7zPGtzzU995",
  true // Enable debug mode
);

createRoot(document.getElementById("root")!).render(<App />);
