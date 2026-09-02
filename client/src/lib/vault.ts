export type MemoryRecord = {
  id: string;
  project: string;
  title: string;
  prompt: string;
  response: string;
  source: string;
  model: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

type EncryptedRow = {
  id: string;
  createdAt: string;
  iv: string;
  ciphertext: string;
};

type ExportFile = {
  format: "devmemory-vault/v1";
  salt: string;
  rows: EncryptedRow[];
  exportedAt: string;
};

const DB_NAME = "devmemory-vault";
const DB_VERSION = 1;
const STORE_NAME = "encrypted-memories";
const SALT_KEY = "devmemory-vault-salt";
const DIMENSIONS = 192;

const bytesToBase64 = (bytes: Uint8Array) => {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
};

const base64ToBytes = (value: string) => Uint8Array.from(atob(value), (character) => character.charCodeAt(0));

const openDatabase = () => new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, DB_VERSION);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: "id" });
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

const transaction = async <T>(mode: IDBTransactionMode, action: (store: IDBObjectStore, resolve: (value: T) => void, reject: (reason?: unknown) => void) => void) => {
  const db = await openDatabase();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    action(tx.objectStore(STORE_NAME), resolve, reject);
    tx.oncomplete = () => db.close();
    tx.onerror = () => reject(tx.error);
  });
};

export const getOrCreateSalt = () => {
  const existing = localStorage.getItem(SALT_KEY);
  if (existing) return existing;
  const salt = bytesToBase64(crypto.getRandomValues(new Uint8Array(16)));
  localStorage.setItem(SALT_KEY, salt);
  return salt;
};

export const setVaultSalt = (salt: string) => localStorage.setItem(SALT_KEY, salt);
export const getVaultSalt = () => localStorage.getItem(SALT_KEY);

export const deriveVaultKey = async (passphrase: string, saltBase64: string) => {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: base64ToBytes(saltBase64), iterations: 120000, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
};

const encrypt = async (record: MemoryRecord, key: CryptoKey): Promise<EncryptedRow> => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(record));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  return { id: record.id, createdAt: record.createdAt, iv: bytesToBase64(iv), ciphertext: bytesToBase64(new Uint8Array(ciphertext)) };
};

const decrypt = async (row: EncryptedRow, key: CryptoKey): Promise<MemoryRecord> => {
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64ToBytes(row.iv) }, key, base64ToBytes(row.ciphertext));
  return JSON.parse(new TextDecoder().decode(plaintext)) as MemoryRecord;
};

export const saveMemory = async (record: MemoryRecord, key: CryptoKey) => {
  const row = await encrypt(record, key);
  await transaction<void>("readwrite", (store, resolve, reject) => {
    const request = store.put(row);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const loadMemories = async (key: CryptoKey) => {
  const rows = await transaction<EncryptedRow[]>("readonly", (store, resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as EncryptedRow[]);
    request.onerror = () => reject(request.error);
  });
  return Promise.all(rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((row) => decrypt(row, key)));
};

export const removeMemory = async (id: string) => transaction<void>("readwrite", (store, resolve, reject) => {
  const request = store.delete(id);
  request.onsuccess = () => resolve();
  request.onerror = () => reject(request.error);
});

export const clearMemories = async () => transaction<void>("readwrite", (store, resolve, reject) => {
  const request = store.clear();
  request.onsuccess = () => resolve();
  request.onerror = () => reject(request.error);
});

export const exportEncryptedVault = async (): Promise<ExportFile> => {
  const salt = getVaultSalt() ?? getOrCreateSalt();
  const rows = await transaction<EncryptedRow[]>("readonly", (store, resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as EncryptedRow[]);
    request.onerror = () => reject(request.error);
  });
  return { format: "devmemory-vault/v1", salt, rows, exportedAt: new Date().toISOString() };
};

export const importEncryptedVault = async (payload: ExportFile) => {
  if (payload.format !== "devmemory-vault/v1" || !payload.salt || !Array.isArray(payload.rows)) throw new Error("That file is not a DevMemory vault export.");
  await clearMemories();
  setVaultSalt(payload.salt);
  await Promise.all(payload.rows.map((row) => transaction<void>("readwrite", (store, resolve, reject) => {
    const request = store.put(row);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  })));
};

const normalizedTokens = (text: string) => text.toLowerCase().normalize("NFKD").replace(/[^a-z0-9_./-]+/g, " ").split(/\s+/).filter((token) => token.length > 1);

const hashToken = (token: string) => {
  let hash = 2166136261;
  for (let index = 0; index < token.length; index += 1) hash = Math.imul(hash ^ token.charCodeAt(index), 16777619);
  return hash >>> 0;
};

export const vectorize = (text: string) => {
  const vector = new Array<number>(DIMENSIONS).fill(0);
  normalizedTokens(text).forEach((token) => {
    const hash = hashToken(token);
    const index = hash % DIMENSIONS;
    vector[index] += hash % 2 === 0 ? 1 : -1;
  });
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => value / magnitude);
};

export const cosineSimilarity = (left: number[], right: number[]) => left.reduce((sum, value, index) => sum + value * (right[index] ?? 0), 0);

export const searchMemories = (records: MemoryRecord[], query: string, project = "all") => {
  const queryTokens = normalizedTokens(query);
  const queryVector = vectorize(query);
  return records
    .filter((record) => project === "all" || record.project === project)
    .map((record) => {
      const searchable = `${record.title} ${record.project} ${record.prompt} ${record.response} ${record.source} ${record.model} ${record.tags.join(" ")}`.toLowerCase();
      const exactHits = queryTokens.reduce((count, token) => count + (searchable.includes(token) ? 1 : 0), 0);
      const semantic = cosineSimilarity(queryVector, vectorize(searchable));
      return { record, score: exactHits * 0.17 + Math.max(semantic, 0) * 0.83 };
    })
    .filter((item) => !query.trim() || item.score > 0.035)
    .sort((a, b) => b.score - a.score || b.record.createdAt.localeCompare(a.record.createdAt))
    .map((item) => item.record);
};

export const makeRecord = (input: Omit<MemoryRecord, "id" | "createdAt" | "updatedAt">): MemoryRecord => {
  const timestamp = new Date().toISOString();
  return { ...input, id: crypto.randomUUID(), createdAt: timestamp, updatedAt: timestamp };
};
