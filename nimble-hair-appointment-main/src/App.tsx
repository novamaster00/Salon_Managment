
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Appointment from "./pages/Appointment";
import WalkIn from "./pages/WalkIn";
import Queue from "./pages/Queue";
import Dashboard from "./pages/Dashboard";
import WorkingHours from "./pages/WorkingHours";
import BlockedSlots from "./pages/BlockedSlots";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/appointment" element={<Appointment />} />
            <Route path="/walk-in" element={<WalkIn />} />
            <Route path="/queue" element={<Queue />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/working-hours" element={<WorkingHours />} />
            <Route path="/blocked-slots" element={<BlockedSlots />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
