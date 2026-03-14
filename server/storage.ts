// Storage placeholder for compatibility
export interface IStorage {
  getDeclarations(): Promise<any[]>;
  getDeclaration(id: number): Promise<any | undefined>;
  createDeclaration(data: any): Promise<any>;
  updateDeclaration(id: number, data: any): Promise<any>;
  getStats(): Promise<any>;
}

class MemStorage implements IStorage {
  private declarations: Map<number, any> = new Map();
  private currentId = 1;

  async getDeclarations() {
    return Array.from(this.declarations.values());
  }

  async getDeclaration(id: number) {
    return this.declarations.get(id);
  }

  async createDeclaration(data: any) {
    const id = this.currentId++;
    const declaration = { ...data, id, createdAt: new Date() };
    this.declarations.set(id, declaration);
    return declaration;
  }

  async updateDeclaration(id: number, data: any) {
    const existing = this.declarations.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    this.declarations.set(id, updated);
    return updated;
  }

  async getStats() {
    const declarations = Array.from(this.declarations.values());
    return {
      total: declarations.length,
      pending: declarations.filter((d: any) => d.status === 'pending').length,
      completed: declarations.filter((d: any) => d.status === 'completed').length,
    };
  }
}

export const storage = new MemStorage();
