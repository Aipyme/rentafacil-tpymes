import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import Simulador from "@/pages/Simulador";
import Triage from "@/pages/Triage";
import Blog from "@/pages/Blog";
import BlogArticle from "@/pages/BlogArticle";
import AvisoLegal from "@/pages/AvisoLegal";
import PoliticaPrivacidad from "@/pages/PoliticaPrivacidad";
import PoliticaCookies from "@/pages/PoliticaCookies";
import NotFound from "@/pages/NotFound";
import DemoAlfredo from "@/pages/DemoAlfredo";
import Andalucia from "@/pages/Andalucia";

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/simulador" component={Simulador} />
      <Route path="/empezar" component={Triage} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={BlogArticle} />
      <Route path="/aviso-legal" component={AvisoLegal} />
      <Route path="/privacidad" component={PoliticaPrivacidad} />
      <Route path="/cookies" component={PoliticaCookies} />
      <Route path="/demo-alfredo" component={DemoAlfredo} />
      <Route path="/andalucia" component={Andalucia} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppRouter />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
