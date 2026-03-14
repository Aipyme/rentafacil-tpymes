import { type Declaration, type InsertDeclaration, type User, type InsertUser } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getDeclarations(): Promise<Declaration[]>;
  getDeclaration(id: string): Promise<Declaration | undefined>;
  createDeclaration(data: InsertDeclaration): Promise<Declaration>;
  getStats(): Promise<{
    total: number;
    enProceso: number;
    completadas: number;
    ingresos: number;
    tasaUpsell: number;
    dailyData: { date: string; count: number }[];
    tipoDistribucion: { tipo: string; count: number }[];
  }>;
}

function generateCaseId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `RENTA-2025-${code}`;
}

const SPANISH_NAMES = [
  "María García López", "Carlos Rodríguez Fernández", "Ana Martínez Sánchez",
  "José López González", "Laura Hernández Díaz", "Miguel Ruiz Moreno",
  "Carmen Jiménez Muñoz", "Francisco Álvarez Romero", "Isabel Torres Navarro",
  "Pedro Domínguez Gil", "Lucía Morales Ortega", "David Castillo Santos",
  "Elena Vázquez Ramos", "Javier Guerrero Medina", "Marta Delgado Fuentes",
  "Antonio Blanco Iglesias", "Raquel Suárez Molina", "Pablo Méndez Herrera",
  "Sofía Peña Cabrera", "Fernando Serrano Campos",
];

const COMUNIDADES = [
  "Andalucía", "Aragón", "Asturias", "Islas Baleares", "Canarias",
  "Cantabria", "Castilla y León", "Castilla-La Mancha", "Cataluña",
  "Comunidad Valenciana", "Extremadura", "Galicia", "Comunidad de Madrid",
  "Región de Murcia", "Navarra", "País Vasco", "La Rioja",
];

const ESTADOS: Declaration["estado"][] = ["recibido", "en_proceso", "borrador_listo", "revisado", "presentado"];

function randomNIF(): string {
  const num = Math.floor(10000000 + Math.random() * 90000000);
  const letters = "TRWAGMYFPDXBNJZSQVHLCKE";
  return `${num}${letters[num % 23]}`;
}

function randomPhone(): string {
  const prefixes = ["612", "634", "656", "678", "691", "615", "648", "669"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const rest = Math.floor(100000 + Math.random() * 900000).toString();
  return `${prefix}${rest}`;
}

function seedDeclarations(): Map<string, Declaration> {
  const map = new Map<string, Declaration>();
  const now = new Date();

  for (let i = 0; i < 20; i++) {
    const id = generateCaseId();
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date(now.getTime() - daysAgo * 86400000);
    const isComplex = Math.random() < 0.22;
    const estado = ESTADOS[Math.floor(Math.random() * ESTADOS.length)];
    const rendimientos = Math.floor(18000 + Math.random() * 52000);
    const resultado = estado === "presentado" ? Math.floor(200 + Math.random() * 1800) : undefined;

    const decl: Declaration = {
      id,
      nombreCompleto: SPANISH_NAMES[i % SPANISH_NAMES.length],
      nif: randomNIF(),
      email: `usuario${i + 1}@email.com`,
      telefono: randomPhone(),
      comunidadAutonoma: COMUNIDADES[Math.floor(Math.random() * COMUNIDADES.length)],
      estadoCivil: ["Soltero", "Casado", "Pareja de hecho", "Divorciado"][Math.floor(Math.random() * 4)],
      numHijos: Math.floor(Math.random() * 3),
      tipoVivienda: ["Propiedad", "Alquiler", "Otra"][Math.floor(Math.random() * 3)],
      hipotecaAnterior2013: Math.random() < 0.2,
      rendimientosTrabajo: rendimientos,
      numPagadores: isComplex ? Math.floor(2 + Math.random() * 3) : 1,
      tieneOtrosRendimientos: Math.random() < 0.3,
      otrosRendimientosDescripcion: null,
      tieneInmueblesAlquilados: isComplex ? Math.random() < 0.5 : false,
      tieneInversiones: Math.random() < 0.25,
      tieneActividadEconomica: isComplex ? Math.random() < 0.4 : false,
      deduccionesConocidas: null,
      tieneDiscapacidad: Math.random() < 0.1,
      porcentajeDiscapacidad: null,
      realizaDonaciones: Math.random() < 0.2,
      tienePlanPensiones: Math.random() < 0.3,
      aceptaPolitica: true,
      aceptaTratamiento: true,
      estado,
      tipo: isComplex ? "compleja" : "simple",
      resultado: resultado ?? null,
      fecha: date.toISOString().split("T")[0],
    };
    map.set(id, decl);
  }
  return map;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private declarations: Map<string, Declaration>;

  constructor() {
    this.users = new Map();
    this.declarations = seedDeclarations();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((u) => u.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getDeclarations(): Promise<Declaration[]> {
    return Array.from(this.declarations.values()).sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
  }

  async getDeclaration(id: string): Promise<Declaration | undefined> {
    return this.declarations.get(id);
  }

  async createDeclaration(data: InsertDeclaration): Promise<Declaration> {
    const id = generateCaseId();
    const decl: Declaration = { ...data, id };
    this.declarations.set(id, decl);
    return decl;
  }

  async getStats() {
    const all = Array.from(this.declarations.values());
    const total = 127; // Seeded KPI
    const enProceso = 34;
    const completadas = 89;
    const simple = all.filter((d) => d.tipo === "simple").length;
    const compleja = all.filter((d) => d.tipo === "compleja").length;

    // Generate daily data for last 30 days
    const dailyData: { date: string; count: number }[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const dateStr = d.toISOString().split("T")[0];
      const base = Math.floor(2 + Math.random() * 6);
      dailyData.push({ date: dateStr, count: base });
    }

    return {
      total,
      enProceso,
      completadas,
      ingresos: 8430,
      tasaUpsell: 12,
      dailyData,
      tipoDistribucion: [
        { tipo: "Simple", count: Math.round((simple / (simple + compleja || 1)) * 100) || 78 },
        { tipo: "Compleja", count: Math.round((compleja / (simple + compleja || 1)) * 100) || 22 },
      ],
    };
  }
}

export const storage = new MemStorage();
