/**
 * DocumentosPanel — Componente reutilizable para subir, ver y eliminar documentos
 * de un caso. Funciona tanto para el asesor como para el cliente.
 *
 * Props:
 *   casoId       — ID del caso (ej: RENTA-2025-MN4CXQB8)
 *   subidoPor    — "asesor" | "cliente"
 *   nombreUsuario — nombre del asesor o del cliente
 *   readOnly     — si true, solo muestra la lista sin permitir subir/eliminar
 *   documentosNecesarios — lista de documentos que el cliente debe aportar (string separado por comas)
 */

import { useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  FileImage,
  File,
  Trash2,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  Eye,
} from "lucide-react";

const CATEGORIAS = [
  "DNI/NIE",
  "Borrador AEAT",
  "Certificado empresa",
  "Certificado pensión",
  "Certificado banco",
  "Contrato alquiler",
  "Escritura compraventa",
  "Plan de pensiones",
  "Justificante donaciones",
  "Certificado discapacidad",
  "Facturas actividad",
  "Otros",
];

const MIME_PERMITIDOS = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const MAX_SIZE_MB = 20;

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return <FileImage className="w-4 h-4 text-blue-500" />;
  if (mimeType === "application/pdf") return <FileText className="w-4 h-4 text-red-500" />;
  return <File className="w-4 h-4 text-gray-500" />;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatFecha(date: Date | string): string {
  return new Date(date).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface Props {
  casoId: string;
  subidoPor: "asesor" | "cliente";
  nombreUsuario?: string;
  readOnly?: boolean;
  documentosNecesarios?: string;
  /** Si true, muestra solo los documentos del tipo indicado en subidoPor */
  filtrarPorTipo?: boolean;
}

export default function DocumentosPanel({
  casoId,
  subidoPor,
  nombreUsuario,
  readOnly = false,
  documentosNecesarios,
  filtrarPorTipo = false,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const [categoria, setCategoria] = useState<string>("");
  const [notas, setNotas] = useState<string>("");
  const [subiendo, setSubiendo] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const utils = trpc.useUtils();

  // Listar documentos del caso
  const { data, isLoading, error } = trpc.documentos.listar.useQuery(
    { casoId },
    { enabled: !!casoId }
  );

  // Mutación de subida base64
  const subirMutation = trpc.documentos.subirBase64.useMutation({
    onSuccess: () => {
      utils.documentos.listar.invalidate({ casoId });
      setArchivoSeleccionado(null);
      setCategoria("");
      setNotas("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success("Documento subido correctamente");
    },
    onError: (err) => {
      toast.error(`Error al subir: ${err.message}`);
    },
  });

  // Mutación de eliminación
  const eliminarMutation = trpc.documentos.eliminar.useMutation({
    onSuccess: () => {
      utils.documentos.listar.invalidate({ casoId });
      // También invalidar el conteo del sidebar
      utils.documentos.contarPorCasos.invalidate();
      toast.success("Documento eliminado");
    },
    onError: (err) => {
      toast.error(`Error al eliminar: ${err.message}`);
    },
  });

  const handleEliminar = (docId: number, motivo?: string) => {
    eliminarMutation.mutate({ id: docId, motivo: motivo || undefined });
  };

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`El archivo supera el límite de ${MAX_SIZE_MB}MB`);
      return;
    }
    if (!MIME_PERMITIDOS.includes(file.type)) {
      toast.error("Formato no permitido. Usa PDF, imagen o documento Office.");
      return;
    }
    setArchivoSeleccionado(file);
    // Auto-detectar categoría por nombre
    const nombre = file.name.toLowerCase();
    if (nombre.includes("dni") || nombre.includes("nie") || nombre.includes("pasaporte")) setCategoria("DNI/NIE");
    else if (nombre.includes("borrador") || nombre.includes("aeat") || nombre.includes("renta")) setCategoria("Borrador AEAT");
    else if (nombre.includes("empresa") || nombre.includes("retencion") || nombre.includes("irpf")) setCategoria("Certificado empresa");
    else if (nombre.includes("pension") || nombre.includes("jubilacion")) setCategoria("Certificado pensión");
    else if (nombre.includes("banco") || nombre.includes("hipoteca") || nombre.includes("inversion")) setCategoria("Certificado banco");
    else if (nombre.includes("alquiler") || nombre.includes("arrendamiento")) setCategoria("Contrato alquiler");
    else if (nombre.includes("escritura") || nombre.includes("notaria")) setCategoria("Escritura compraventa");
    else if (nombre.includes("discapacidad")) setCategoria("Certificado discapacidad");
    else if (nombre.includes("donacion")) setCategoria("Justificante donaciones");
    else if (nombre.includes("factura")) setCategoria("Facturas actividad");
  };

  const handleSubir = async () => {
    if (!archivoSeleccionado) return;
    setSubiendo(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(",")[1];
        await subirMutation.mutateAsync({
          casoId,
          nombreArchivo: archivoSeleccionado.name,
          mimeType: archivoSeleccionado.type,
          tamano: archivoSeleccionado.size,
          base64Data: base64,
          subidoPor,
          subidoPorNombre: nombreUsuario,
          categoria: categoria || "Otros",
          notas: notas || undefined,
        });
        setSubiendo(false);
      };
      reader.onerror = () => {
        toast.error("Error al leer el archivo");
        setSubiendo(false);
      };
      reader.readAsDataURL(archivoSeleccionado);
    } catch {
      setSubiendo(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileChange(file);
  };

  // Filtrar documentos si se pide
  const todosLosDocs = data?.documentos ?? [];
  const docs = filtrarPorTipo
    ? todosLosDocs.filter((d) => d.subidoPor === subidoPor)
    : todosLosDocs;

  const docsAsesor = todosLosDocs.filter((d) => d.subidoPor === "asesor");
  const docsCliente = todosLosDocs.filter((d) => d.subidoPor === "cliente");

  // Lista de documentos necesarios
  const listaDocsNecesarios = documentosNecesarios
    ? documentosNecesarios.split(",").map((d) => d.trim()).filter(Boolean)
    : [];

  // Documentos ya aportados (por categoría)
  const categoriasAportadas = new Set(todosLosDocs.map((d) => d.categoria ?? ""));

  return (
    <div className="space-y-5">
      {/* Lista de documentos necesarios */}
      {listaDocsNecesarios.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-amber-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Documentos necesarios para este caso
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex flex-wrap gap-2">
              {listaDocsNecesarios.map((doc, i) => {
                const aportado = categoriasAportadas.has(doc);
                return (
                  <Badge
                    key={i}
                    variant={aportado ? "default" : "outline"}
                    className={
                      aportado
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : "bg-white text-amber-700 border-amber-300"
                    }
                  >
                    {aportado && <CheckCircle2 className="w-3 h-3 mr-1" />}
                    {doc}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Zona de subida */}
      {!readOnly && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#059669]" />
              Subir documento
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {/* Zona drag & drop */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                dragOver
                  ? "border-[#059669] bg-emerald-50"
                  : archivoSeleccionado
                  ? "border-emerald-400 bg-emerald-50/50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              {archivoSeleccionado ? (
                <div className="flex items-center justify-center gap-3">
                  {getFileIcon(archivoSeleccionado.type)}
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-800">{archivoSeleccionado.name}</p>
                    <p className="text-xs text-gray-500">{formatBytes(archivoSeleccionado.size)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 text-gray-400 hover:text-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      setArchivoSeleccionado(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    ✕
                  </Button>
                </div>
              ) : (
                <div>
                  <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    Arrastra un archivo aquí o <span className="text-[#059669] font-medium">haz clic para seleccionar</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PDF, imágenes, Word, Excel — máx. {MAX_SIZE_MB}MB</p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.doc,.docx,.xls,.xlsx"
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            />

            {archivoSeleccionado && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-600 mb-1 block">Categoría</Label>
                  <Select value={categoria} onValueChange={setCategoria}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Selecciona categoría..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-600 mb-1 block">Notas (opcional)</Label>
                  <Input
                    className="h-8 text-sm"
                    placeholder="Ej: Ejercicio 2025"
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                  />
                </div>
              </div>
            )}

            {archivoSeleccionado && (
              <Button
                className="w-full bg-[#059669] hover:bg-[#047857] text-white h-9"
                onClick={handleSubir}
                disabled={subiendo || subirMutation.isPending}
              >
                {(subiendo || subirMutation.isPending) ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Subiendo...</>
                ) : (
                  <><Upload className="w-4 h-4 mr-2" /> Subir documento</>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lista de documentos */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Cargando documentos...
        </div>
      ) : error ? (
        <div className="text-center py-6 text-red-500 text-sm">
          Error al cargar documentos
        </div>
      ) : todosLosDocs.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No hay documentos subidos todavía</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Documentos del asesor */}
          {docsAsesor.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Documentos del asesor ({docsAsesor.length})
              </p>
              <div className="space-y-2">
                {docsAsesor.map((doc) => (
                  <DocumentoItem
                    key={doc.id}
                    doc={doc}
                    canDelete={!readOnly && subidoPor === "asesor"}
                    onEliminar={(motivo) => handleEliminar(doc.id, motivo)}
                    eliminando={eliminarMutation.isPending}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Documentos del cliente */}
          {docsCliente.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Documentos del cliente ({docsCliente.length})
              </p>
              <div className="space-y-2">
                {docsCliente.map((doc) => (
                  <DocumentoItem
                    key={doc.id}
                    doc={doc}
                    canDelete={!readOnly && subidoPor === "asesor"} // El asesor puede eliminar docs del cliente
                    onEliminar={(motivo) => handleEliminar(doc.id, motivo)}
                    eliminando={eliminarMutation.isPending}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Componente de un documento individual ─────────────────────────────────────

interface DocumentoItemProps {
  doc: {
    id: number;
    nombreArchivo: string;
    url: string;
    mimeType: string;
    tamano: number;
    subidoPor: string;
    subidoPorNombre?: string | null;
    categoria?: string | null;
    notas?: string | null;
    createdAt: Date | string;
  };
  canDelete: boolean;
  onEliminar: (motivo?: string) => void;
  eliminando: boolean;
}

function DocumentoItem({ doc, canDelete, onEliminar, eliminando }: DocumentoItemProps) {
  const [motivoRechazo, setMotivoRechazo] = useState("");

  return (
    <div className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg hover:border-gray-200 hover:shadow-sm transition-all group">
      <div className="flex-shrink-0">
        {getFileIcon(doc.mimeType)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{doc.nombreArchivo}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {doc.categoria && (
            <Badge variant="outline" className="text-xs px-1.5 py-0 h-4 border-gray-200 text-gray-500">
              {doc.categoria}
            </Badge>
          )}
          <span className="text-xs text-gray-400">{formatBytes(doc.tamano)}</span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-400">{formatFecha(doc.createdAt)}</span>
        </div>
        {doc.notas && (
          <p className="text-xs text-gray-500 mt-0.5 italic">{doc.notas}</p>
        )}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Ver / Descargar */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-gray-400 hover:text-[#059669]"
          asChild
        >
          <a href={doc.url} target="_blank" rel="noopener noreferrer" title="Ver documento">
            <Eye className="w-3.5 h-3.5" />
          </a>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-gray-400 hover:text-[#1a365d]"
          asChild
        >
          <a href={doc.url} download={doc.nombreArchivo} title="Descargar">
            <Download className="w-3.5 h-3.5" />
          </a>
        </Button>
        {/* Eliminar */}
        {canDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={eliminando}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se eliminará <strong>{doc.nombreArchivo}</strong> de forma permanente. Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              {/* Campo de motivo de rechazo (solo para docs del cliente) */}
              {doc.subidoPor === "cliente" && (
                <div className="px-1 pb-1">
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">
                    Motivo del rechazo <span className="text-gray-400 font-normal">(opcional — se guardará en las notas del caso)</span>
                  </label>
                  <textarea
                    value={motivoRechazo}
                    onChange={(e) => setMotivoRechazo(e.target.value)}
                    placeholder="Ej: El documento está caducado. Por favor, sube el DNI actualizado."
                    rows={3}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                  />
                </div>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setMotivoRechazo("")}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-500 hover:bg-red-600"
                  onClick={() => { onEliminar(motivoRechazo || undefined); setMotivoRechazo(""); }}
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}
