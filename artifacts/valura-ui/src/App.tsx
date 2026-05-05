import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AppErrorBoundary } from "@/components/error-boundary";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import ChronosPage from "@/pages/chronos";
import PathfinderPage from "@/pages/pathfinder";
import Login from "@/pages/login";
import { getStoredUserId, SCRATCH_USER_ID } from "@/lib/auth";
import PortfolioBuilder from "@/pages/portfolio-builder";

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

function ProtectedPathfinder() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (!getStoredUserId()) setLocation("/login");
  }, [setLocation]);
  if (!getStoredUserId()) return null;
  return <PathfinderPage />;
}

function ProtectedPortfolioBuilder() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    const id = getStoredUserId();
    if (!id) setLocation("/login");
    else if (id !== SCRATCH_USER_ID) setLocation("/dashboard");
  }, [setLocation]);
  const id = getStoredUserId();
  if (!id || id !== SCRATCH_USER_ID) return null;
  return <PortfolioBuilder />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/dashboard" component={ProtectedDashboard} />
      <Route path="/build" component={ProtectedPortfolioBuilder} />
      <Route path="/pathfinder" component={ProtectedPathfinder} />
      <Route path="/chronos" component={ProtectedChronos} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AppErrorBoundary>
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
    </AppErrorBoundary>
  );
}

export default App;
