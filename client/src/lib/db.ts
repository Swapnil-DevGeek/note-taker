/**
 * IndexedDB wrapper for offline-first note storage
 */

import type { LocalNote, SyncStatus } from '../types';

export type { LocalNote, SyncStatus };

const DB_NAME = 'note-taker-db';
const DB_VERSION = 1;
const NOTES_STORE = 'notes';

let dbInstance: IDBDatabase | null = null;

/**
 * Opens and returns the IndexedDB database instance
 */
export const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(NOTES_STORE)) {
        const store = db.createObjectStore(NOTES_STORE, { keyPath: '_id' });
        store.createIndex('userId', 'userId', { unique: false });
        store.createIndex('syncStatus', 'syncStatus', { unique: false });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };
  });
};

/**
 * Gets all notes from IndexedDB (excluding deleted ones)
 */
export const getAllNotes = async (userId: string): Promise<LocalNote[]> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(NOTES_STORE, 'readonly');
    const store = transaction.objectStore(NOTES_STORE);
    const index = store.index('userId');
    const request = index.getAll(userId);

    request.onsuccess = () => {
      const notes = request.result.filter(
        (note: LocalNote) => note.syncStatus !== 'deleted'
      );
      // Sort by updatedAt descending
      notes.sort((a: LocalNote, b: LocalNote) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      resolve(notes);
    };

    request.onerror = () => {
      reject(new Error('Failed to get notes from IndexedDB'));
    };
  });
};

/**
 * Gets a single note by ID
 */
export const getNoteById = async (id: string): Promise<LocalNote | null> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(NOTES_STORE, 'readonly');
    const store = transaction.objectStore(NOTES_STORE);
    const request = store.get(id);

    request.onsuccess = () => {
      const note = request.result;
      if (note && note.syncStatus !== 'deleted') {
        resolve(note);
      } else {
        resolve(null);
      }
    };

    request.onerror = () => {
      reject(new Error('Failed to get note from IndexedDB'));
    };
  });
};

/**
 * Saves a note to IndexedDB (create or update)
 */
export const saveNote = async (note: LocalNote): Promise<LocalNote> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(NOTES_STORE, 'readwrite');
    const store = transaction.objectStore(NOTES_STORE);
    const request = store.put(note);

    request.onsuccess = () => {
      resolve(note);
    };

    request.onerror = () => {
      reject(new Error('Failed to save note to IndexedDB'));
    };
  });
};

/**
 * Deletes a note from IndexedDB permanently
 */
export const deleteNotePermanently = async (id: string): Promise<void> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(NOTES_STORE, 'readwrite');
    const store = transaction.objectStore(NOTES_STORE);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error('Failed to delete note from IndexedDB'));
    };
  });
};

/**
 * Gets all notes with a specific sync status
 */
export const getNotesBySyncStatus = async (status: SyncStatus): Promise<LocalNote[]> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(NOTES_STORE, 'readonly');
    const store = transaction.objectStore(NOTES_STORE);
    const index = store.index('syncStatus');
    const request = index.getAll(status);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(new Error('Failed to get notes by sync status'));
    };
  });
};

/**
 * Clears all notes for a user (used on logout)
 */
export const clearAllNotes = async (): Promise<void> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(NOTES_STORE, 'readwrite');
    const store = transaction.objectStore(NOTES_STORE);
    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error('Failed to clear notes from IndexedDB'));
    };
  });
};

/**
 * Batch save multiple notes (used during sync)
 */
export const saveNotes = async (notes: LocalNote[]): Promise<void> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(NOTES_STORE, 'readwrite');
    const store = transaction.objectStore(NOTES_STORE);

    transaction.oncomplete = () => {
      resolve();
    };

    transaction.onerror = () => {
      reject(new Error('Failed to batch save notes'));
    };

    for (const note of notes) {
      store.put(note);
    }
  });
};
