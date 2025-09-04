import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DraeToastHandler } from "@/components/DraeToastHandler";
import { GlobalStyle } from "@/components/GlobalStyle";

import { ServiceWorkerManager } from "@/components/ServiceWorkerManager";


import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Feedback from "./pages/Feedback";
import Changelog from "./pages/Changelog";
import { Tour } from "./pages/Tour";
import NotFound from "./pages/NotFound";

const App = () => (
  <TooltipProvider>
    <GlobalStyle />
    <Toaster />
    <Sonner />
    <DraeToastHandler />
    <ServiceWorkerManager />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/changelog" element={<Changelog />} />
        <Route path="/tour" element={<Tour />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
