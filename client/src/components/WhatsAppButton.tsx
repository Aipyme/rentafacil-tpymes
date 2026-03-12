/**
 * Design: Fintech Institucional
 * Botón flotante de WhatsApp Business
 * Palette: WhatsApp green #25D366
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const WHATSAPP_NUMBER = "34600000000"; // CAMBIAR por el número real de TPymes
const DEFAULT_MESSAGE = "Hola, me interesa el servicio de declaración de la renta de Renta Fácil TPymes. ¿Podrían informarme?";

export default function WhatsAppButton() {
  const [showTooltip, setShowTooltip] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`;

  // Mostrar tooltip después de 5 segundos
  useState(() => {
    const timer = setTimeout(() => {
      if (!dismissed) setShowTooltip(true);
    }, 5000);
    return () => clearTimeout(timer);
  });

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && !dismissed && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="bg-white rounded-xl shadow-xl border border-gray-100 p-4 max-w-[260px] relative"
          >
            <button
              onClick={() => setDismissed(true)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <p className="text-sm text-gray-700 pr-4">
              <span className="font-semibold text-[#1a365d]">¿Tienes dudas?</span>
              <br />
              Escríbenos por WhatsApp y te ayudamos con tu declaración.
            </p>
            {/* Triangle pointer */}
            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white border-r border-b border-gray-100 transform rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* WhatsApp Button */}
      <motion.a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-[60px] h-[60px] rounded-full bg-[#25D366] shadow-lg shadow-green-300/40 hover:shadow-xl hover:shadow-green-300/50 transition-all duration-300 hover:scale-105 group"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Contactar por WhatsApp"
        onClick={() => setDismissed(true)}
      >
        <svg
          viewBox="0 0 24 24"
          fill="white"
          className="w-7 h-7"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        {/* Pulse animation */}
        <span className="absolute w-full h-full rounded-full bg-[#25D366] animate-ping opacity-20" />
      </motion.a>
    </div>
  );
}
