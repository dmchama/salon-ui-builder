import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";

import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence } from "framer-motion";
import Index from "./pages/Index";
import Salons from "./pages/Salons";
import SalonDetail from "./pages/SalonDetail";
import Booking from "./pages/Booking";
import Pricing from "./pages/Pricing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Contact from "./pages/Contact";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();
  // Dashboard and admin sections live in the URL; keep one key per area so switching sections
  // doesn't replay the page transition or remount the page (spec 004).
  const area = location.pathname.match(/^\/(dashboard|admin)(\/|$)/)?.[1];
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={area ? `/${area}` : location.pathname}>
        <Route path="/" element={<Index />} />
        <Route path="/salons" element={<Salons />} />
        <Route path="/salon/:slug" element={<SalonDetail />} />
        <Route path="/booking/:slug" element={<Booking />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard/:section?" element={<Dashboard />} />
        <Route path="/admin/:section?" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
