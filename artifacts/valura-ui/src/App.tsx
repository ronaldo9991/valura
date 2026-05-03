import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import ChronosPage from "@/pages/chronos";
import Login from "@/pages/login";
import { getStoredUserId } from "@/lib/auth";

const queryClient = new QueryClient();

function ProtectedDashboard() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (!getStoredUserId()) setLocation("/login");
  }, [setLocation]);
  if (!getStoredUserId()) return null;
  return <Dashboard />;
}

function ProtectedChronos() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (!getStoredUserId()) setLocation("/login");
  }, [setLocation]);
  if (!getStoredUserId()) return null;
  return <ChronosPage />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/dashboard" component={ProtectedDashboard} />
      <Route path="/chronos" component={ProtectedChronos} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="theme">
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
