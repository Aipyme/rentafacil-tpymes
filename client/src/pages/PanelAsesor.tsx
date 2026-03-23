/**
 * Panel del Asesor - Renta Fácil TPymes
 * 
 * Design: Clean professional dashboard
 * - Sidebar navigation with case list
 * - Form to complete fiscal data
 * - XML generation and download
 */

import { useState } from "react";
import { descargarXML, DatosDeclaracion, Pagador } from "@/lib/generadorXML";
import { toast } from "sonner";

// ─────────────────────────────────────────────
// Tipos internos
// ─────────────────────────────────────────────

interface CasoSimple {
  id: string;
  nombre: string;
  email: string;
  nif: string;
  comunidad: string;
  situacion: string;
  ingresos: string;
  fecha: string;
  estado: string;
}

// Casos de ejemplo (en producción vendrían del Google Sheet via n8n)
const CASOS_EJEMPLO: CasoSimple[] = [
  {
    id: "RENTA-2025-ABC123",
    nombre: "Juan García López",
    email: "juan@example.com",
    nif: "12345678A",
    comunidad: "Madrid",
    situacion: "Asalariado/a",
    ingresos: "22.000€ - 35.000€",
    fecha: "21/03/2026",
    estado: "Pendiente",
  },
  {
    id: "RENTA-2025-DEF456",
    nombre: "María Fernández Ruiz",
    email: "maria@example.com",
    nif: "87654321B",
    comunidad: "Andalucía",
    situacion: "Asalariado/a",
    ingresos: "Menos de 22.000€",
    fecha: "20/03/2026",
    estado: "En proceso",
  },
];

const CCAA_CODIGO: Record<string, string> = {
  "Andalucía": "01",
  "Aragón": "02",
  "Asturias": "03",
  "Baleares": "04",
  "Canarias": "05",
  "Cantabria": "06",
  "Castilla-La Mancha": "07",
  "Castilla y León": "08",
  "Cataluña": "09",
  "Extremadura": "10",
  "Galicia": "11",
  "Madrid": "13",
  "Murcia": "14",
  "Navarra": "15",
  "País Vasco": "16",
  "La Rioja": "17",
  "Comunidad Valenciana": "18",
  "Ceuta": "19",
  "Melilla": "20",
};

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────

export default function PanelAsesor() {
  const [casoSeleccionado, setCasoSeleccionado] = useState<CasoSimple | null>(null);
  const [tab, setTab] = useState<"datos" | "xml">("datos");
  
  // Formulario de datos fiscales
  const [form, setForm] = useState({
    apellidosNombre: "",
    fechaNacimiento: "",
    sexo: "H" as "H" | "M",
    estadoCivil: "1" as "1" | "2" | "3" | "4" | "5",
    
    // Pagador 1
    importeIntegro1: "",
    retenciones1: "",
    cuotasSS1: "",
    
    // Pagador 2 (opcional)
    tienePagador2: false,
    importeIntegro2: "",
    retenciones2: "",
    cuotasSS2: "",
    
    // Capital mobiliario
    tieneCapitalMob: false,
    capitalMobIntegro: "",
    capitalMobRetenciones: "",
    
    // Plan de pensiones
    aportacionesPP: "",
    
    // Situación familiar
    numHijos: "0",
    ascendientes: "0",
    discapacidad: "0",
    
    // Resultado
    resultadoTipo: "D" as "D" | "I" | "N",
    resultadoImporte: "",
    iban: "",
    
    // Deducciones Andalucía
    andAlquiler: "",
    andNacimiento: "",
  });

  const handleCasoClick = (caso: CasoSimple) => {
    setCasoSeleccionado(caso);
    setForm(prev => ({
      ...prev,
      apellidosNombre: caso.nombre.toUpperCase().split(" ").reverse().slice(0, 2).join(" ") + " " + caso.nombre.split(" ")[0],
    }));
    setTab("datos");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleGenerarXML = () => {
    if (!casoSeleccionado) return;
    
    if (!form.apellidosNombre || !form.fechaNacimiento || !form.importeIntegro1 || !form.retenciones1) {
      toast.error("Completa los campos obligatorios: apellidos, fecha de nacimiento, importe íntegro y retenciones.");
      return;
    }

    const pagadores: Pagador[] = [
      {
        importeIntegro: parseFloat(form.importeIntegro1) || 0,
        retenciones: parseFloat(form.retenciones1) || 0,
        cuotasSS: parseFloat(form.cuotasSS1) || 0,
      },
    ];

    if (form.tienePagador2 && form.importeIntegro2) {
      pagadores.push({
        importeIntegro: parseFloat(form.importeIntegro2) || 0,
        retenciones: parseFloat(form.retenciones2) || 0,
        cuotasSS: parseFloat(form.cuotasSS2) || 0,
      });
    }

    const ccaa = CCAA_CODIGO[casoSeleccionado.comunidad] || "13";

    const declaracion: DatosDeclaracion = {
      nif: casoSeleccionado.nif,
      apellidosNombre: form.apellidosNombre,
      fechaNacimiento: form.fechaNacimiento,
      sexo: form.sexo,
      estadoCivil: form.estadoCivil,
      comunidadAutonoma: ccaa,
      tipoTributacion: "1",
      pagadores,
      capitalMobiliario: form.tieneCapitalMob && form.capitalMobIntegro ? {
        importeIntegro: parseFloat(form.capitalMobIntegro) || 0,
        retenciones: parseFloat(form.capitalMobRetenciones) || 0,
      } : undefined,
      aportacionesPP: parseFloat(form.aportacionesPP) || 0,
      numHijos: parseInt(form.numHijos) || 0,
      ascendientesCargo: parseInt(form.ascendientes) || 0,
      gradoDiscapacidad: parseInt(form.discapacidad) || 0,
      deduccionAndalucia: ccaa === "01" ? {
        alquilerVivienda: parseFloat(form.andAlquiler) || 0,
        nacimientoAdopcion: parseFloat(form.andNacimiento) || 0,
      } : undefined,
      resultadoTipo: form.resultadoTipo,
      resultadoImporte: parseFloat(form.resultadoImporte) || 0,
      cuentaDevolucion: form.iban,
    };

    descargarXML(declaracion, `Modelo100_${casoSeleccionado.nif}_2024.xml`);
    toast.success(`XML generado: Modelo100_${casoSeleccionado.nif}_2024.xml`);
    setTab("xml");
  };

  const estadoColor = (estado: string) => {
    switch (estado) {
      case "Pendiente": return "bg-amber-100 text-amber-700";
      case "En proceso": return "bg-blue-100 text-blue-700";
      case "Completado": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-teal-600 rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">RF</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">Panel del Asesor</h1>
            <p className="text-xs text-gray-500">Renta Fácil TPymes — Campaña 2024</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Generador XML Modelo 100 IRPF</span>
          <span className="bg-teal-50 text-teal-700 text-xs px-2 py-1 rounded font-medium">v1.0</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Lista de casos */}
        <aside className="w-72 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Casos pendientes</h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por nombre o NIF..."
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 pl-8 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <svg className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {CASOS_EJEMPLO.map((caso) => (
              <button
                key={caso.id}
                onClick={() => handleCasoClick(caso)}
                className={`w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                  casoSeleccionado?.id === caso.id ? "bg-teal-50 border-l-2 border-l-teal-500" : ""
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900 truncate">{caso.nombre}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ml-2 shrink-0 ${estadoColor(caso.estado)}`}>
                    {caso.estado}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{caso.nif}</p>
                <p className="text-xs text-gray-400 mt-1">{caso.comunidad} · {caso.fecha}</p>
              </button>
            ))}
            
            <div className="p-4 text-center">
              <p className="text-xs text-gray-400">
                Los casos reales se cargarán desde Google Sheets cuando esté conectado el backend.
              </p>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          {!casoSeleccionado ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Selecciona un caso</h3>
              <p className="text-sm text-gray-400 max-w-sm">
                Elige un expediente de la lista para completar los datos fiscales y generar el XML Modelo 100 para Renta Web.
              </p>
            </div>
          ) : (
            <div className="max-w-2xl">
              {/* Cabecera del caso */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{casoSeleccionado.nombre}</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{casoSeleccionado.nif} · {casoSeleccionado.email}</p>
                  </div>
                  <span className={`text-sm px-2.5 py-1 rounded-full font-medium ${estadoColor(casoSeleccionado.estado)}`}>
                    {casoSeleccionado.estado}
                  </span>
                </div>
                <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-400">Comunidad</p>
                    <p className="text-sm font-medium text-gray-700">{casoSeleccionado.comunidad}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Situación</p>
                    <p className="text-sm font-medium text-gray-700">{casoSeleccionado.situacion}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Ingresos estimados</p>
                    <p className="text-sm font-medium text-gray-700">{casoSeleccionado.ingresos}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Expediente</p>
                    <p className="text-sm font-medium text-gray-700 font-mono">{casoSeleccionado.id}</p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
                <button
                  onClick={() => setTab("datos")}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    tab === "datos" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Datos fiscales
                </button>
                <button
                  onClick={() => setTab("xml")}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    tab === "xml" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Generar XML
                </button>
              </div>

              {tab === "datos" && (
                <div className="space-y-6">
                  {/* Datos personales */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Datos personales</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Apellidos y nombre <span className="text-red-500">*</span>
                        </label>
                        <input
                          name="apellidosNombre"
                          value={form.apellidosNombre}
                          onChange={handleChange}
                          placeholder="GARCIA LOPEZ JUAN"
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 uppercase"
                        />
                        <p className="text-xs text-gray-400 mt-1">Formato: APELLIDO1 APELLIDO2 NOMBRE</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Fecha de nacimiento <span className="text-red-500">*</span>
                        </label>
                        <input
                          name="fechaNacimiento"
                          value={form.fechaNacimiento}
                          onChange={handleChange}
                          placeholder="DD/MM/AAAA"
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Sexo</label>
                        <select
                          name="sexo"
                          value={form.sexo}
                          onChange={handleChange}
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="H">Hombre</option>
                          <option value="M">Mujer</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Estado civil</label>
                        <select
                          name="estadoCivil"
                          value={form.estadoCivil}
                          onChange={handleChange}
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="1">Soltero/a</option>
                          <option value="2">Casado/a</option>
                          <option value="3">Viudo/a</option>
                          <option value="4">Separado/a</option>
                          <option value="5">Divorciado/a</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Rendimientos del trabajo */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Rendimientos del trabajo — Pagador 1</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Importe íntegro (€) <span className="text-red-500">*</span>
                        </label>
                        <input
                          name="importeIntegro1"
                          value={form.importeIntegro1}
                          onChange={handleChange}
                          placeholder="28500.00"
                          type="number"
                          step="0.01"
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                        <p className="text-xs text-gray-400 mt-1">Casilla 0001</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Retenciones (€) <span className="text-red-500">*</span>
                        </label>
                        <input
                          name="retenciones1"
                          value={form.retenciones1}
                          onChange={handleChange}
                          placeholder="4275.00"
                          type="number"
                          step="0.01"
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                        <p className="text-xs text-gray-400 mt-1">Casilla 0002</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Cuotas SS (€)</label>
                        <input
                          name="cuotasSS1"
                          value={form.cuotasSS1}
                          onChange={handleChange}
                          placeholder="1710.00"
                          type="number"
                          step="0.01"
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                        <p className="text-xs text-gray-400 mt-1">Casilla 0014</p>
                      </div>
                    </div>
                    
                    {/* Pagador 2 */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="tienePagador2"
                          checked={form.tienePagador2}
                          onChange={handleChange}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-600">Añadir segundo pagador</span>
                      </label>
                      
                      {form.tienePagador2 && (
                        <div className="grid grid-cols-3 gap-4 mt-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Importe íntegro 2 (€)</label>
                            <input
                              name="importeIntegro2"
                              value={form.importeIntegro2}
                              onChange={handleChange}
                              placeholder="5000.00"
                              type="number"
                              step="0.01"
                              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Retenciones 2 (€)</label>
                            <input
                              name="retenciones2"
                              value={form.retenciones2}
                              onChange={handleChange}
                              placeholder="750.00"
                              type="number"
                              step="0.01"
                              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Cuotas SS 2 (€)</label>
                            <input
                              name="cuotasSS2"
                              value={form.cuotasSS2}
                              onChange={handleChange}
                              placeholder="300.00"
                              type="number"
                              step="0.01"
                              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Capital mobiliario */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-gray-900">Capital mobiliario</h3>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="tieneCapitalMob"
                          checked={form.tieneCapitalMob}
                          onChange={handleChange}
                          className="rounded"
                        />
                        <span className="text-xs text-gray-500">Tiene intereses/dividendos</span>
                      </label>
                    </div>
                    {form.tieneCapitalMob && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Importe íntegro (€)</label>
                          <input
                            name="capitalMobIntegro"
                            value={form.capitalMobIntegro}
                            onChange={handleChange}
                            placeholder="320.00"
                            type="number"
                            step="0.01"
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                          <p className="text-xs text-gray-400 mt-1">Casilla 0023</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Retenciones (€)</label>
                          <input
                            name="capitalMobRetenciones"
                            value={form.capitalMobRetenciones}
                            onChange={handleChange}
                            placeholder="48.00"
                            type="number"
                            step="0.01"
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                          <p className="text-xs text-gray-400 mt-1">Casilla 0025</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Situación familiar y reducciones */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Situación familiar y reducciones</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Hijos a cargo</label>
                        <select
                          name="numHijos"
                          value={form.numHijos}
                          onChange={handleChange}
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          {[0, 1, 2, 3, 4, 5].map(n => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Ascendientes a cargo</label>
                        <select
                          name="ascendientes"
                          value={form.ascendientes}
                          onChange={handleChange}
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          {[0, 1, 2].map(n => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Plan de pensiones (€)</label>
                        <input
                          name="aportacionesPP"
                          value={form.aportacionesPP}
                          onChange={handleChange}
                          placeholder="0.00"
                          type="number"
                          step="0.01"
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Discapacidad (%)</label>
                        <select
                          name="discapacidad"
                          value={form.discapacidad}
                          onChange={handleChange}
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="0">Sin discapacidad</option>
                          <option value="33">33%</option>
                          <option value="65">65%</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Deducciones autonómicas Andalucía */}
                  {casoSeleccionado.comunidad === "Andalucía" && (
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">Deducciones autonómicas — Andalucía</h3>
                      <p className="text-xs text-gray-400 mb-4">Solo si aplican al caso concreto</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Alquiler vivienda habitual (€)</label>
                          <input
                            name="andAlquiler"
                            value={form.andAlquiler}
                            onChange={handleChange}
                            placeholder="0.00"
                            type="number"
                            step="0.01"
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Nacimiento/adopción (€)</label>
                          <input
                            name="andNacimiento"
                            value={form.andNacimiento}
                            onChange={handleChange}
                            placeholder="0.00"
                            type="number"
                            step="0.01"
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Resultado */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Resultado de la declaración</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de resultado</label>
                        <select
                          name="resultadoTipo"
                          value={form.resultadoTipo}
                          onChange={handleChange}
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="D">A devolver</option>
                          <option value="I">A ingresar</option>
                          <option value="N">Negativo/cero</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Importe (€)</label>
                        <input
                          name="resultadoImporte"
                          value={form.resultadoImporte}
                          onChange={handleChange}
                          placeholder="350.00"
                          type="number"
                          step="0.01"
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      {form.resultadoTipo === "D" && (
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">IBAN devolución</label>
                          <input
                            name="iban"
                            value={form.iban}
                            onChange={handleChange}
                            placeholder="ES91 2100 0418 4502..."
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {tab === "xml" && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Generar XML Modelo 100</h3>
                    <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                      Genera el fichero XML listo para importar en <strong>Renta Web</strong> de la AEAT. 
                      El asesor solo necesita importarlo y revisar antes de presentar.
                    </p>
                    
                    <div className="bg-gray-50 rounded-lg p-4 text-left mb-6 max-w-sm mx-auto">
                      <h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Cómo importar en Renta Web</h4>
                      <ol className="text-xs text-gray-500 space-y-1.5">
                        <li className="flex gap-2"><span className="font-semibold text-teal-600">1.</span> Descarga el XML con el botón de abajo</li>
                        <li className="flex gap-2"><span className="font-semibold text-teal-600">2.</span> Abre Renta Web en la AEAT con el certificado del cliente</li>
                        <li className="flex gap-2"><span className="font-semibold text-teal-600">3.</span> Haz clic en "Importar declaración" → selecciona el XML</li>
                        <li className="flex gap-2"><span className="font-semibold text-teal-600">4.</span> Revisa los datos importados y presenta</li>
                      </ol>
                    </div>
                    
                    <button
                      onClick={handleGenerarXML}
                      className="bg-teal-600 hover:bg-teal-700 text-white font-medium px-6 py-3 rounded-lg transition-colors flex items-center gap-2 mx-auto"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                      </svg>
                      Descargar XML Modelo 100
                    </button>
                    
                    <p className="text-xs text-gray-400 mt-3">
                      Fichero: <code className="bg-gray-100 px-1 rounded">Modelo100_{casoSeleccionado.nif}_2024.xml</code>
                    </p>
                  </div>
                </div>
              )}

              {/* Botón generar XML siempre visible en tab datos */}
              {tab === "datos" && (
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={handleGenerarXML}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-medium px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                    Generar y descargar XML
                  </button>
                  <button
                    onClick={() => toast.info("Estado actualizado (función pendiente de conectar con Google Sheets)")}
                    className="border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium px-6 py-3 rounded-lg transition-colors"
                  >
                    Marcar como completado
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
