import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

// ── Legacy in-memory storage (for backward compatibility with routes.ts) ──────
class MemStorage {
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
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ── S3 client ──────────────────────────────────────────────────────────────
const BUCKET = process.env.S3_BUCKET ?? "";
const REGION = process.env.S3_REGION ?? "us-east-1";
const ENDPOINT = process.env.S3_ENDPOINT;
const CDN_BASE = process.env.S3_CDN_BASE ?? "";

const s3 = new S3Client({
  region: REGION,
  ...(ENDPOINT ? { endpoint: ENDPOINT, forcePathStyle: true } : {}),
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
  },
});

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Upload bytes to S3.
 * Returns the public URL (CDN or direct) and the stored key.
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: relKey,
      Body: data,
      ContentType: contentType,
    })
  );

  const url = CDN_BASE
    ? `${CDN_BASE.replace(/\/$/, "")}/${relKey}`
    : `https://${BUCKET}.s3.${REGION}.amazonaws.com/${relKey}`;

  return { key: relKey, url };
}

/**
 * Generate a presigned GET URL for a stored key.
 * Default expiry: 1 hour.
 */
export async function storageGet(
  relKey: string,
  expiresIn = 3600
): Promise<{ key: string; url: string }> {
  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BUCKET, Key: relKey }),
    { expiresIn }
  );
  return { key: relKey, url };
}
