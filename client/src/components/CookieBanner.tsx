/**
 * CookieBanner — Banner de consentimiento de cookies
 * Conforme con: LSSI-CE (art. 22.2), RGPD (art. 6.1.a), LOPD-GDD
 * 
 * Diseño: Fintech Institucional — fondo oscuro, bordes sutiles, tipografía DM Sans
 * Funcionalidad: Aceptar todas, Rechazar no esenciales, Configurar granularmente
 * Persistencia: localStorage con clave 'cookie_consent'
 */

import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Cookie, Settings, Check, X, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CookiePreferences {
  necessary: boolean; // Siempre true, no se puede desactivar
  analytics: boolean;
  thirdParty: boolean;
  timestamp: string;
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  necessary: true,
  analytics: false,
  thirdParty: false,
  timestamp: "",
};

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    const stored = localStorage.getItem("cookie_consent");
    if (!stored) {
      // Pequeño delay para que no aparezca instantáneamente al cargar
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const saveConsent = (prefs: CookiePreferences) => {
    const finalPrefs = { ...prefs, timestamp: new Date().toISOString() };
    localStorage.setItem("cookie_consent", JSON.stringify(finalPrefs));
    setVisible(false);
    setShowConfig(false);
  };

  const handleAcceptAll = () => {
    saveConsent({
      necessary: true,
      analytics: true,
      thirdParty: true,
      timestamp: "",
    });
  };

  const handleRejectNonEssential = () => {
    saveConsent({
      necessary: true,
      analytics: false,
      thirdParty: false,
      timestamp: "",
    });
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6"
        >
          <div className="max-w-4xl mx-auto bg-[#0a1628] border border-[#1e3a5f]/60 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
            {/* Banner principal */}
            {!showConfig && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-5 md:p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="hidden sm:flex items-center justify-center w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shrink-0 mt-0.5">
                    <Cookie className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-base mb-1.5">
                      Este sitio web utiliza cookies
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Utilizamos cookies propias y de terceros para analizar el uso del sitio web y mejorar nuestros servicios. 
                      Las cookies técnicas son necesarias para el funcionamiento del sitio. 
                      Puede aceptar todas las cookies, rechazar las no esenciales o configurar sus preferencias. 
                      Más información en nuestra{" "}
                      <Link
                        href="/cookies"
                        className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors"
                      >
                        Política de Cookies
                      </Link>.
                    </p>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 mt-5">
                  <button
                    onClick={handleAcceptAll}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-medium text-sm rounded-lg transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    Aceptar todas
                  </button>
                  <button
                    onClick={handleRejectNonEssential}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-transparent hover:bg-white/5 text-slate-300 hover:text-white font-medium text-sm rounded-lg border border-slate-600 hover:border-slate-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Solo esenciales
                  </button>
                  <button
                    onClick={() => setShowConfig(true)}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-transparent hover:bg-white/5 text-slate-400 hover:text-slate-200 font-medium text-sm rounded-lg transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Configurar
                  </button>
                </div>
              </motion.div>
            )}

            {/* Panel de configuración granular */}
            {showConfig && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-5 md:p-6"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <Shield className="w-4.5 h-4.5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-base">
                      Configurar cookies
                    </h3>
                    <p className="text-slate-500 text-xs">
                      Seleccione qué tipos de cookies desea permitir
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Cookies necesarias — siempre activas */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-white text-sm font-medium">Cookies técnicas</span>
                        <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          NECESARIAS
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs leading-relaxed">
                        Imprescindibles para el funcionamiento del sitio web. Incluyen la preferencia de cookies y el estado de sesión.
                      </p>
                    </div>
                    <div className="w-11 h-6 bg-emerald-500/20 rounded-full flex items-center justify-end px-0.5 shrink-0 cursor-not-allowed">
                      <div className="w-5 h-5 bg-emerald-500 rounded-full" />
                    </div>
                  </div>

                  {/* Cookies analíticas */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-white text-sm font-medium">Cookies analíticas</span>
                      </div>
                      <p className="text-slate-500 text-xs leading-relaxed">
                        Nos permiten medir el número de visitantes y analizar cómo se utiliza el sitio web para mejorar su funcionamiento. Google Analytics, Umami.
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setPreferences((p) => ({ ...p, analytics: !p.analytics }))
                      }
                      className={`w-11 h-6 rounded-full flex items-center px-0.5 shrink-0 transition-colors ${
                        preferences.analytics
                          ? "bg-emerald-500/20 justify-end"
                          : "bg-slate-700 justify-start"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full transition-colors ${
                          preferences.analytics ? "bg-emerald-500" : "bg-slate-500"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Cookies de terceros */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-white text-sm font-medium">Cookies de terceros</span>
                      </div>
                      <p className="text-slate-500 text-xs leading-relaxed">
                        Utilizadas por servicios externos como el botón de WhatsApp (Meta). Pueden recopilar información sobre su navegación.
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setPreferences((p) => ({ ...p, thirdParty: !p.thirdParty }))
                      }
                      className={`w-11 h-6 rounded-full flex items-center px-0.5 shrink-0 transition-colors ${
                        preferences.thirdParty
                          ? "bg-emerald-500/20 justify-end"
                          : "bg-slate-700 justify-start"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full transition-colors ${
                          preferences.thirdParty ? "bg-emerald-500" : "bg-slate-500"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Botones de configuración */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 mt-5">
                  <button
                    onClick={handleSavePreferences}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-medium text-sm rounded-lg transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    Guardar preferencias
                  </button>
                  <button
                    onClick={handleAcceptAll}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-transparent hover:bg-white/5 text-slate-300 hover:text-white font-medium text-sm rounded-lg border border-slate-600 hover:border-slate-500 transition-colors"
                  >
                    Aceptar todas
                  </button>
                  <button
                    onClick={() => setShowConfig(false)}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-transparent hover:bg-white/5 text-slate-400 hover:text-slate-200 font-medium text-sm rounded-lg transition-colors"
                  >
                    Volver
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
