import fs from "fs/promises";
import path from "path";
import type { StorageProvider, StoragePutResult } from "@/lib/storage/types";

const DEFAULT_UPLOAD_DIR = "./uploads";

function getBaseDir(): string {
  const configured = process.env.UPLOAD_DIR ?? DEFAULT_UPLOAD_DIR;
  return path.isAbsolute(configured)
    ? configured
    : path.join(process.cwd(), configured);
}

export class LocalStorageProvider implements StorageProvider {
  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir ?? getBaseDir();
  }

  resolvePath(key: string): string {
    const normalized = key.replace(/^\/+/, "").replace(/\.\./g, "");
    return path.join(this.baseDir, normalized);
  }

  async ensureDirectory(keyPrefix: string): Promise<void> {
    const dirPath = path.dirname(this.resolvePath(keyPrefix));
    await fs.mkdir(dirPath, { recursive: true });
  }

  async put(
    key: string,
    data: Buffer,
    _options?: { contentType?: string },
  ): Promise<StoragePutResult> {
    const filePath = this.resolvePath(key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, data);
    return { key, absolutePath: filePath };
  }

  async get(key: string): Promise<Buffer> {
    return fs.readFile(this.resolvePath(key));
  }

  async readText(
    key: string,
    encoding: BufferEncoding = "utf-8",
  ): Promise<string> {
    return fs.readFile(this.resolvePath(key), encoding);
  }
}

/**
 * Placeholder for Supabase Storage / S3-compatible backends.
 * Set STORAGE_PROVIDER=supabase and configure SUPABASE_* env vars in production.
 */
export class SupabaseStorageProvider implements StorageProvider {
  constructor() {
    throw new Error(
      "Supabase storage is not configured. Set STORAGE_PROVIDER=local or implement SupabaseStorageProvider.",
    );
  }

  resolvePath(_key: string): string {
    throw new Error("Supabase storage is not configured");
  }

  ensureDirectory(_keyPrefix: string): Promise<void> {
    throw new Error("Supabase storage is not configured");
  }

  put(
    _key: string,
    _data: Buffer,
    _options?: { contentType?: string },
  ): Promise<StoragePutResult> {
    throw new Error("Supabase storage is not configured");
  }

  get(_key: string): Promise<Buffer> {
    throw new Error("Supabase storage is not configured");
  }

  readText(_key: string, _encoding?: BufferEncoding): Promise<string> {
    throw new Error("Supabase storage is not configured");
  }
}
