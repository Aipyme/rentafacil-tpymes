import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle,
  ChevronRight,
  Building2,
  User,
  TrendingUp,
  Shield,
  Download,
  MessageCircle,
  Star,
  ArrowRight,
  Bell,
  Settings,
  LogOut,
} from "lucide-react";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";

/* ─── Mock Data ─── */
const MOCK_USER = {
  name: "Ana García",
  email: "ana.garcia@email.com",
  plan: "Renta Estándar",
  referenceNumber: "RF-2025-00482",
};

const MOCK_TIMELINE = [
  {
    id: 1,
    status: "completed",
    title: "Solicitud recibida",
    desc: "Hemos recibido tu formulario y datos fiscales.",
    date: "10 abr 2026",
    icon: CheckCircle2,
  },
  {
    id: 2,
    status: "completed",
    title: "Documentación revisada",
    desc: "Tu documentación ha sido validada por nuestro equipo.",
    date: "11 abr 2026",
    icon: FileText,
  },
  {
    id: 3,
    status: "in_progress",
    title: "Asesor asignado",
    desc: "María López, asesora fiscal senior, está revisando tu caso.",
    date: "12 abr 2026",
    icon: User,
  },
  {
    id: 4,
    status: "pending",
    title: "Borrador preparado",
    desc: "Tu declaración será preparada y enviada para tu revisión.",
    date: "Estimado: 14 abr",
    icon: FileText,
  },
  {
    id: 5,
    status: "pending",
    title: "Presentación ante la AEAT",
    desc: "Presentación oficial de tu declaración de la renta.",
    date: "Estimado: 16 abr",
    icon: CheckCircle2,
  },
];

const MOCK_DOCUMENTS = [
  {
    id: 1,
    name: "Confirmación de solicitud",
    type: "PDF",
    date: "10 abr 2026",
    available: true,
  },
  {
    id: 2,
    name: "Borrador declaración",
    type: "PDF",
    date: "Pendiente",
    available: false,
  },
  {
    id: 3,
    name: "Declaración presentada",
    type: "PDF",
    date: "Pendiente",
    available: false,
  },
];

/* ─── Status Config ─── */
const statusConfig = {
  completed: {
    color: "text-[hsl(160,100%,33%)]",
    bg: "bg-[hsl(160,100%,33%)]/10",
    border: "border-[hsl(160,100%,33%)]/20",
    dot: "bg-[hsl(160,100%,33%)]",
    label: "Completado",
  },
  in_progress: {
    color: "text-[hsl(215,55%,35%)]",
    bg: "bg-[hsl(215,55%,35%)]/10",
    border: "border-[hsl(215,55%,35%)]/20",
    dot: "bg-[hsl(215,55%,35%)]",
    label: "En proceso",
  },
  pending: {
    color: "text-muted-foreground",
    bg: "bg-muted/50",
    border: "border-border",
    dot: "bg-muted-foreground/30",
    label: "Pendiente",
  },
};

/* ─── Timeline Component ─── */
function Timeline() {
  return (
    <div className="space-y-0">
      {MOCK_TIMELINE.map((item, i) => {
        const cfg = statusConfig[item.status as keyof typeof statusConfig];
        const isLast = i === MOCK_TIMELINE.length - 1;
        return (
          <div key={item.id} className="flex gap-4" data-testid={`timeline-item-${item.id}`}>
            {/* Connector */}
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${cfg.bg} ${cfg.border}`}
              >
                {item.status === "completed" ? (
                  <CheckCircle2 className={`h-4 w-4 ${cfg.color}`} />
                ) : item.status === "in_progress" ? (
                  <Clock className={`h-4 w-4 ${cfg.color}`} />
                ) : (
                  <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                )}
              </div>
              {!isLast && (
                <div className="w-px flex-1 bg-border/50 my-1 min-h-[2rem]" />
              )}
            </div>

            {/* Content */}
            <div className="pb-5 flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className={`text-sm font-semibold ${cfg.color}`}>{item.title}</p>
                <span className="text-xs text-muted-foreground flex-shrink-0">{item.date}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              {item.status === "in_progress" && (
                <div className="mt-2">
                  <Badge variant="outline" className={`text-xs ${cfg.color} border-[hsl(215,55%,35%)]/30`}>
                    <Clock className="h-3 w-3 mr-1" />
                    En proceso
                  </Badge>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Document Row ─── */
function DocumentRow({ doc }: { doc: typeof MOCK_DOCUMENTS[0] }) {
  return (
    <div
      className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
      data-testid={`document-row-${doc.id}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
          <FileText className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">{doc.name}</p>
          <p className="text-xs text-muted-foreground">{doc.type} · {doc.date}</p>
        </div>
      </div>
      <Button
        size="sm"
        variant={doc.available ? "outline" : "ghost"}
        disabled={!doc.available}
        className="text-xs"
        data-testid={`button-download-doc-${doc.id}`}
      >
        <Download className="h-3.5 w-3.5 mr-1.5" />
        {doc.available ? "Descargar" : "No disponible"}
      </Button>
    </div>
  );
}

/* ─── Main Dashboard ─── */
export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"estado" | "documentos" | "asesor">("estado");

  const completedSteps = MOCK_TIMELINE.filter((t) => t.status === "completed").length;
  const totalSteps = MOCK_TIMELINE.length;
  const progressPercent = Math.round((completedSteps / totalSteps) * 100);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 text-sm font-bold">
              <Building2 className="h-4 w-4 text-[hsl(215,55%,25%)]" />
              Ayuda T Pymes
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" data-testid="button-notifications">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" data-testid="button-settings">
              <Settings className="h-4 w-4" />
            </Button>
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" data-testid="button-logout">
                <LogOut className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1" data-testid="text-dashboard-title">
            Hola, {MOCK_USER.name.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Expediente <span className="font-mono font-medium">{MOCK_USER.referenceNumber}</span>
            {" · "}{MOCK_USER.plan}
          </p>
        </div>

        {/* Progress Card */}
        <Card className="mb-6 border-border/60 bg-gradient-to-r from-[hsl(215,55%,18%)]/5 to-transparent">
          <CardContent className="pt-5 pb-5 px-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold">Estado de tu declaración</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {completedSteps} de {totalSteps} pasos completados
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-[hsl(160,100%,33%)]">{progressPercent}%</span>
              </div>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-[hsl(160,100%,33%)] rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
                data-testid="progress-bar"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted/50 p-1 rounded-lg mb-6">
          {(["estado", "documentos", "asesor"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              data-testid={`tab-${tab}`}
              className={`flex-1 text-sm py-2 px-3 rounded-md font-medium transition-all ${
                activeTab === tab
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "estado" ? "Estado" : tab === "documentos" ? "Documentos" : "Mi Asesor"}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "estado" && (
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Seguimiento del proceso</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <Timeline />
            </CardContent>
          </Card>
        )}

        {activeTab === "documentos" && (
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Tus documentos</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {MOCK_DOCUMENTS.map((doc) => (
                <DocumentRow key={doc.id} doc={doc} />
              ))}
            </CardContent>
          </Card>
        )}

        {activeTab === "asesor" && (
          <Card className="border-border/60">
            <CardContent className="pt-6 pb-6 px-6">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-14 h-14 rounded-full bg-[hsl(215,55%,18%)]/10 flex items-center justify-center flex-shrink-0">
                  <User className="h-7 w-7 text-[hsl(215,55%,25%)]" />
                </div>
                <div>
                  <p className="font-semibold" data-testid="text-advisor-name">María López</p>
                  <p className="text-sm text-muted-foreground">Asesora fiscal senior · 8 años de experiencia</p>
                  <div className="flex gap-0.5 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                    <span className="text-xs text-muted-foreground ml-1">5.0</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-3">Especialidades: IRPF, autónomos, inversiones, declaración conjunta</p>
                <Button
                  className="w-full bg-[hsl(160,100%,33%)] hover:bg-[hsl(160,100%,28%)] text-white"
                  data-testid="button-contact-advisor"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Contactar asesora
                </Button>
                <Button variant="outline" className="w-full" data-testid="button-schedule-call">
                  <Clock className="mr-2 h-4 w-4" />
                  Programar llamada
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="mt-8 pt-5 border-t border-border/30 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-muted-foreground">
            © 2026 Ayuda T Pymes · <a href="#" className="hover:underline">Soporte</a>
          </p>
          <PerplexityAttribution />
        </div>
      </main>
    </div>
  );
}
