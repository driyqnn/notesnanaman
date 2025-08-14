import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MotionConfig } from "framer-motion";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Feedback from "./pages/Feedback";
import NotFound from "./pages/NotFound";
import './draeAnalytics';

const App = () => (
  <MotionConfig reducedMotion="user" transition={{ type: "spring", stiffness: 320, damping: 28, mass: 0.7 }}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/feedback" element={<Feedback />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </MotionConfig>
);

export default App;
