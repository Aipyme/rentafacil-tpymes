import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import Simulador from "@/pages/Simulador";
import Triage from "@/pages/Triage";
import { Redirect } from "wouter";
import Blog from "@/pages/Blog";
import BlogArticle from "@/pages/BlogArticle";
import AvisoLegal from "@/pages/AvisoLegal";
import PoliticaPrivacidad from "@/pages/PoliticaPrivacidad";
import PoliticaCookies from "@/pages/PoliticaCookies";
import NotFound from "@/pages/NotFound";
import DemoAlfredo from "@/pages/DemoAlfredo";
import Andalucia from "@/pages/Andalucia";
import PanelAsesor from "@/pages/PanelAsesor";
import SeguimientoCliente from "@/pages/SeguimientoCliente";
import SimuladorRenta from "@/pages/SimuladorRenta";
import PagoRenta from "@/pages/PagoRenta";
import MiRenta from "@/pages/MiRenta";
import AsesorFiscal from "@/pages/AsesorFiscal";
import Madrid from "@/pages/Madrid";
import Cataluna from "@/pages/Cataluna";
import Valencia from "@/pages/Valencia";
import Canarias from "@/pages/Canarias";
import Derivaciones from "@/pages/Derivaciones";

function AppRouter() {
  // make sure to consider if you need authentication for certain routes
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
      <Route path="/demo-alfredo"><Redirect to="/404" /></Route>
      <Route path="/andalucia" component={Andalucia} />
      <Route path="/madrid" component={Madrid} />
      <Route path="/cataluna" component={Cataluna} />
      <Route path="/valencia" component={Valencia} />
      <Route path="/canarias" component={Canarias} />
      <Route path="/panel-asesor" component={PanelAsesor} />
      <Route path="/derivaciones" component={Derivaciones} />
      <Route path="/seguimiento" component={SeguimientoCliente} />
      <Route path="/renta" component={SimuladorRenta} />
      <Route path="/renta/simulador" component={SimuladorRenta} />
      <Route path="/pago/:expedienteId" component={PagoRenta} />
      <Route path="/mi-renta/:expedienteId" component={MiRenta} />
      <Route path="/asesor-fiscal" component={AsesorFiscal} />
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
