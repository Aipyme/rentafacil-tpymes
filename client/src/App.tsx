import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Simulador from "./pages/Simulador";
import Triage from "./pages/Triage";
import Blog from "./pages/Blog";
import BlogArticle from "./pages/BlogArticle";
import WhatsAppButton from "./components/WhatsAppButton";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/simulador"} component={Simulador} />
      <Route path={"/empezar"} component={Triage} />
      <Route path={"/blog"} component={Blog} />
      <Route path={"/blog/:slug"} component={BlogArticle} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
          <WhatsAppButton />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
