import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import AuthPage from "./pages/Auth";
import Feed from "./pages/Feed";
import Messages from "./pages/Messages";
import MainLayout from "./components/MainLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SidebarProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/feed" replace />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route
              path="/feed"
              element={
                <MainLayout>
                  <Feed />
                </MainLayout>
              }
            />
            <Route
              path="/messages"
              element={
                <MainLayout>
                  <Messages />
                </MainLayout>
              }
            />
          </Routes>
        </BrowserRouter>
      </SidebarProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;