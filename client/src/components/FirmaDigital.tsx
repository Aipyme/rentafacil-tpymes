/**
 * FirmaDigital — Componente de firma digital para el cliente
 *
 * Permite al cliente firmar con el dedo o ratón sobre un canvas.
 * Al confirmar, la firma se envía al backend que la sube a S3 y la registra en la BD.
 */

import { useRef, useEffect, useState, useCallback } from "react";
import SignaturePad from "signature_pad";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, PenLine, RotateCcw, Shield, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface FirmaDigitalProps {
  casoId: string;
  nif: string;
  nombreCliente: string;
  onFirmado?: (firmaUrl: string) => void;
}

export default function FirmaDigital({ casoId, nif, nombreCliente, onFirmado }: FirmaDigitalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [firmado, setFirmado] = useState(false);
  const [firmaUrl, setFirmaUrl] = useState<string | null>(null);

  // Verificar si ya existe firma
  const { data: firmaExistente } = trpc.firmas.verificar.useQuery(
    { casoId, nif },
    { enabled: !!casoId && !!nif }
  );

  const guardarFirma = trpc.firmas.guardar.useMutation();

  // Inicializar el canvas y SignaturePad
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    // Ajustar resolución del canvas para pantallas HiDPI
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(ratio, ratio);

    const pad = new SignaturePad(canvas, {
      backgroundColor: "rgba(255,255,255,0)",
      penColor: "#1a365d",
      minWidth: 1.5,
      maxWidth: 3,
    });

    pad.addEventListener("beginStroke", () => setIsEmpty(false));
    signaturePadRef.current = pad;

    return () => {
      pad.off();
    };
  }, [firmado]);

  // Limpiar la firma
  const handleLimpiar = useCallback(() => {
    signaturePadRef.current?.clear();
    setIsEmpty(true);
  }, []);

  // Confirmar y guardar la firma
  const handleConfirmar = useCallback(async () => {
    const pad = signaturePadRef.current;
    if (!pad || pad.isEmpty()) {
      toast.error("Por favor, firma antes de continuar");
      return;
    }

    setGuardando(true);
    try {
      // Obtener PNG en base64
      const firmaBase64 = pad.toDataURL("image/png");

      const resultado = await guardarFirma.mutateAsync({
        casoId,
        nif,
        firmaBase64,
      });

      if (resultado.success && resultado.firmaUrl) {
        setFirmado(true);
        setFirmaUrl(resultado.firmaUrl);
        toast.success("Firma registrada correctamente");
        onFirmado?.(resultado.firmaUrl);
      } else {
        toast.error(resultado.error || "Error al guardar la firma");
      }
    } catch (e) {
      toast.error("Error al guardar la firma. Inténtalo de nuevo.");
    } finally {
      setGuardando(false);
    }
  }, [casoId, nif, guardarFirma, onFirmado]);

  // Si ya está firmado (en esta sesión o en sesiones anteriores)
  if (firmado || firmaExistente?.firmado) {
    const fechaFirma = firmaExistente?.firma?.fecha
      ? new Date(firmaExistente.firma.fecha).toLocaleDateString("es-ES", {
          day: "2-digit", month: "long", year: "numeric",
          hour: "2-digit", minute: "2-digit"
        })
      : new Date().toLocaleDateString("es-ES", {
          day: "2-digit", month: "long", year: "numeric",
          hour: "2-digit", minute: "2-digit"
        });

    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-800 mb-1">Autorización firmada</h3>
              <p className="text-sm text-green-700 mb-3">
                Has firmado digitalmente la autorización para presentar tu declaración de la renta.
              </p>
              <div className="bg-white rounded-lg border border-green-200 p-3 space-y-1">
                <p className="text-xs text-gray-500">
                  <span className="font-medium text-gray-700">Firmante:</span> {nombreCliente} ({nif.toUpperCase()})
                </p>
                <p className="text-xs text-gray-500">
                  <span className="font-medium text-gray-700">Fecha:</span> {fechaFirma}
                </p>
                <p className="text-xs text-gray-500">
                  <span className="font-medium text-gray-700">Caso:</span> {casoId}
                </p>
              </div>
              {(firmaUrl || firmaExistente?.firma?.firmaUrl) && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1 font-medium">Tu firma:</p>
                  <img
                    src={firmaUrl || firmaExistente?.firma?.firmaUrl || ""}
                    alt="Firma digital"
                    className="max-h-16 border border-green-200 rounded bg-white p-1"
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[#1a365d]/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-[#1a365d] flex items-center gap-2">
          <PenLine className="w-4 h-4" />
          Autorización para presentar la declaración
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Texto legal */}
        <div className="bg-[#f7f5f2] rounded-lg p-4 text-sm text-gray-600 leading-relaxed border border-gray-200">
          <p className="font-medium text-gray-800 mb-2">Autorización de representación</p>
          <p>
            Yo, <strong className="text-[#1a365d]">{nombreCliente}</strong> (NIF: <strong className="font-mono">{nif.toUpperCase()}</strong>),
            autorizo a <strong className="text-[#1a365d]">Renta Fácil TPymes</strong> a presentar en mi nombre
            la declaración de la Renta correspondiente al ejercicio 2025 ante la Agencia Tributaria,
            así como a gestionar cualquier trámite relacionado con dicha declaración.
          </p>
        </div>

        {/* Canvas de firma */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">Firma aquí:</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLimpiar}
              className="text-xs text-gray-500 h-7 px-2"
              disabled={isEmpty}
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Borrar
            </Button>
          </div>
          <div className="relative border-2 border-dashed border-gray-300 rounded-xl bg-white overflow-hidden"
               style={{ height: "140px" }}>
            <canvas
              ref={canvasRef}
              className="w-full h-full touch-none cursor-crosshair"
              style={{ height: "140px" }}
            />
            {isEmpty && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-gray-300 text-sm select-none">Firma con el dedo o el ratón</p>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Línea de firma — {casoId}
          </p>
        </div>

        {/* Aviso legal */}
        <div className="flex items-start gap-2 text-xs text-gray-500 bg-blue-50 rounded-lg p-3 border border-blue-100">
          <Shield className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
          <p>
            Tu firma digital tiene validez legal según la Ley 59/2003 de Firma Electrónica.
            Se registrará junto con tu dirección IP y la fecha/hora de firma como evidencia.
          </p>
        </div>

        {/* Botón confirmar */}
        <Button
          onClick={handleConfirmar}
          disabled={isEmpty || guardando}
          className="w-full bg-[#059669] hover:bg-[#047857] text-white font-semibold h-11"
        >
          {guardando ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Guardando firma...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Confirmar y firmar la autorización
            </>
          )}
        </Button>

        {isEmpty && (
          <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-lg p-2 border border-amber-200">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <p>Debes firmar en el recuadro antes de confirmar</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
