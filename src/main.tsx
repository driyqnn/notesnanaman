import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// Add this to src/main.tsx
import { initAnalytics } from './draeAnalytics';

// Initialize after the DOM loads
initAnalytics('https://discord.com/api/webhooks/1398235802114326598/eNnmPek4vpmjthQzCnz0t18uQFI-Zw6JkfHavd5NcLcJMhmm6eMCHaaTlwxRwoAVx7IG');


createRoot(document.getElementById("root")!).render(<App />);
