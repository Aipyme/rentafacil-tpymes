import { Shield } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-[#1a365d] text-white">
      <div className="container py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-['DM_Sans'] font-bold text-white text-lg tracking-tight">
                  Renta Fácil
                </span>
                <span className="text-[10px] font-medium text-white/50 tracking-widest uppercase">
                  by TPymes
                </span>
              </div>
            </div>
            <p className="text-white/60 text-sm leading-relaxed max-w-sm">
              Servicio de declaración de la renta con el respaldo de Ayuda T Pymes, 
              más de 600 profesionales y 20.000 clientes confían en nosotros.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-['DM_Sans'] font-semibold text-sm text-white/80 mb-4 uppercase tracking-wider">
              Servicio
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/simulador" className="text-sm text-white/50 hover:text-white transition-colors no-underline">
                  Simulador gratuito
                </Link>
              </li>
              <li>
                <Link href="/empezar" className="text-sm text-white/50 hover:text-white transition-colors no-underline">
                  Hacer mi renta
                </Link>
              </li>
              <li>
                <a href="#precios" className="text-sm text-white/50 hover:text-white transition-colors no-underline">
                  Precios
                </a>
              </li>
              <li>
                <a href="#como-funciona" className="text-sm text-white/50 hover:text-white transition-colors no-underline">
                  Cómo funciona
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-['DM_Sans'] font-semibold text-sm text-white/80 mb-4 uppercase tracking-wider">
              Legal
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a href="#" className="text-sm text-white/50 hover:text-white transition-colors no-underline">
                  Aviso legal
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-white/50 hover:text-white transition-colors no-underline">
                  Política de privacidad
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-white/50 hover:text-white transition-colors no-underline">
                  Cookies
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} Ayuda T Pymes S.L. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-white/40">Alianza con</span>
            <span className="text-xs font-semibold text-white/60">BBVA</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
