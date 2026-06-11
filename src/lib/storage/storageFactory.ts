import {
  LocalStorageProvider,
  SupabaseStorageProvider,
} from "@/lib/storage/localStorageProvider";
import type { StorageProvider } from "@/lib/storage/types";

let storageInstance: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (storageInstance) {
    return storageInstance;
  }

  const provider = process.env.STORAGE_PROVIDER ?? "local";

  switch (provider) {
    case "local":
      storageInstance = new LocalStorageProvider();
      break;
    case "supabase":
      storageInstance = new SupabaseStorageProvider();
      break;
    default:
      throw new Error(`Unknown STORAGE_PROVIDER: ${provider}`);
  }

  return storageInstance;
}

export function buildCaseStorageKey(caseNumber: string, fileName: string): string {
  return `${caseNumber}/${fileName}`;
}

export function buildReceiptStorageKey(
  caseNumber: string,
  fileName: string,
): string {
  return `${caseNumber}/receipts/${fileName}`;
}
