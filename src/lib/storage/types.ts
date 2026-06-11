export interface StoragePutResult {
  key: string;
  absolutePath?: string;
}

export interface StorageProvider {
  put(
    key: string,
    data: Buffer,
    options?: { contentType?: string },
  ): Promise<StoragePutResult>;

  get(key: string): Promise<Buffer>;

  readText(key: string, encoding?: BufferEncoding): Promise<string>;

  ensureDirectory(keyPrefix: string): Promise<void>;

  resolvePath(key: string): string;
}
