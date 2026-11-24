import type { EpubBook, KindleSettings, ReaderSettings } from '../types/epub';
import { SEED_BOOKS } from '../data/seedBooks';

const DB_NAME = 'leafskim_epub_db';
const DB_VERSION = 1;
const STORE_BOOKS = 'books';
const STORE_RAW_FILES = 'rawFiles';

const LS_READER_SETTINGS = 'leafskim_reader_settings_v1';
const LS_KINDLE_SETTINGS = 'leafskim_kindle_settings_v1';
const LS_SEEDED_FLAG = 'leafskim_seeded_v1';
const LS_BOOKS_FALLBACK = 'leafskim_books_fallback_v1';

export const DEFAULT_READER_SETTINGS: ReaderSettings = {
  fontSizePx: 18,
  lineHeight: 1.72,
  paperTheme: 'crisp',
  defaultMode: 'read',
};

export const DEFAULT_KINDLE_SETTINGS: KindleSettings = {
  kindleEmail: '',
  defaultSubjectConvert: true,
};

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_BOOKS)) {
        db.createObjectStore(STORE_BOOKS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_RAW_FILES)) {
        db.createObjectStore(STORE_RAW_FILES, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
  });
  return dbPromise;
}

export async function loadLibraryBooks(): Promise<EpubBook[]> {
  try {
    const db = await openDb();
    const books = await new Promise<EpubBook[]>((resolve, reject) => {
      const tx = db.transaction(STORE_BOOKS, 'readonly');
      const store = tx.objectStore(STORE_BOOKS);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as EpubBook[]) ?? []);
      req.onerror = () => reject(req.error);
    });

    if (books.length === 0 && !localStorage.getItem(LS_SEEDED_FLAG)) {
      await saveAllBooks(SEED_BOOKS);
      localStorage.setItem(LS_SEEDED_FLAG, '1');
      return SEED_BOOKS;
    }

    return books;
  } catch {
    try {
      const raw = localStorage.getItem(LS_BOOKS_FALLBACK);
      if (raw) {
        return JSON.parse(raw) as EpubBook[];
      }
    } catch {
      // ignore fallback parse error
    }
    return SEED_BOOKS;
  }
}

export async function saveBook(book: EpubBook): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_BOOKS, 'readwrite');
      tx.objectStore(STORE_BOOKS).put(book);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // fallback handled silently
  }
}

export async function saveAllBooks(books: EpubBook[]): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_BOOKS, 'readwrite');
      const store = tx.objectStore(STORE_BOOKS);
      for (const book of books) {
        store.put(book);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    try {
      localStorage.setItem(LS_BOOKS_FALLBACK, JSON.stringify(books));
    } catch {
      // ignore quota error
    }
  }
}

export async function deleteBookFromStorage(bookId: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([STORE_BOOKS, STORE_RAW_FILES], 'readwrite');
      tx.objectStore(STORE_BOOKS).delete(bookId);
      tx.objectStore(STORE_RAW_FILES).delete(bookId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // ignore fallback error
  }
}

export async function saveRawEpubBuffer(bookId: string, buffer: ArrayBuffer): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_RAW_FILES, 'readwrite');
      tx.objectStore(STORE_RAW_FILES).put({ id: bookId, buffer });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // ignore storage fallback
  }
}

export async function loadRawEpubBuffer(bookId: string): Promise<ArrayBuffer | null> {
  try {
    const db = await openDb();
    return await new Promise<ArrayBuffer | null>((resolve, reject) => {
      const tx = db.transaction(STORE_RAW_FILES, 'readonly');
      const req = tx.objectStore(STORE_RAW_FILES).get(bookId);
      req.onsuccess = () => {
        const record = req.result as { id: string; buffer: ArrayBuffer } | undefined;
        resolve(record?.buffer ?? null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export function loadReaderSettings(): ReaderSettings {
  try {
    const raw = localStorage.getItem(LS_READER_SETTINGS);
    if (!raw) return DEFAULT_READER_SETTINGS;
    return { ...DEFAULT_READER_SETTINGS, ...(JSON.parse(raw) as Partial<ReaderSettings>) };
  } catch {
    return DEFAULT_READER_SETTINGS;
  }
}

export function saveReaderSettings(settings: ReaderSettings): void {
  try {
    localStorage.setItem(LS_READER_SETTINGS, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export function loadKindleSettings(): KindleSettings {
  try {
    const raw = localStorage.getItem(LS_KINDLE_SETTINGS);
    if (!raw) return DEFAULT_KINDLE_SETTINGS;
    return { ...DEFAULT_KINDLE_SETTINGS, ...(JSON.parse(raw) as Partial<KindleSettings>) };
  } catch {
    return DEFAULT_KINDLE_SETTINGS;
  }
}

export function saveKindleSettings(settings: KindleSettings): void {
  try {
    localStorage.setItem(LS_KINDLE_SETTINGS, JSON.stringify(settings));
  } catch {
    // ignore
  }
}
