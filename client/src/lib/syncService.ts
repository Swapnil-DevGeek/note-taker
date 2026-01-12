/**
 * Sync Service - Handles background sync between IndexedDB and server
 */

import { syncPushNotes, syncPullNotes } from './api';
import {
  getAllNotes,
  getNotesBySyncStatus,
  saveNote,
  deleteNotePermanently,
} from './db';
import type { LocalNote } from '../types';

let isSyncing = false;
let syncCallbacks: Array<() => void> = [];

/**
 * Register a callback to be called after sync completes
 */
export const onSyncComplete = (callback: () => void): (() => void) => {
  syncCallbacks.push(callback);
  return () => {
    syncCallbacks = syncCallbacks.filter(cb => cb !== callback);
  };
};

/**
 * Notify all registered callbacks that sync is complete
 */
const notifySyncComplete = () => {
  syncCallbacks.forEach(cb => cb());
};

/**
 * Push pending changes to server
 */
const pushChanges = async (): Promise<void> => {
  const pendingNotes = await getNotesBySyncStatus('pending');
  const deletedNotes = await getNotesBySyncStatus('deleted');
  const allPendingNotes = [...pendingNotes, ...deletedNotes];

  if (allPendingNotes.length === 0) {
    return;
  }

  console.log(`[Sync] Pushing ${allPendingNotes.length} changes to server`);

  try {
    const result = await syncPushNotes(allPendingNotes);

    // Handle created notes - update local ID to server ID
    for (const created of result.created) {
      const localNote = pendingNotes.find(n => n._id === created.localId);
      if (localNote) {
        // Delete old local entry
        await deleteNotePermanently(created.localId);
        // Save with new server ID
        const syncedNote: LocalNote = {
          ...localNote,
          _id: created.serverId,
          syncStatus: 'synced',
          serverUpdatedAt: created.updatedAt,
        };
        await saveNote(syncedNote);
      }
    }

    // Handle updated notes - mark as synced
    for (const updated of result.updated) {
      const localNote = pendingNotes.find(n => n._id === updated.serverId);
      if (localNote) {
        const syncedNote: LocalNote = {
          ...localNote,
          syncStatus: 'synced',
          serverUpdatedAt: updated.updatedAt,
        };
        await saveNote(syncedNote);
      }
    }

    // Handle deleted notes - remove from IndexedDB
    for (const deletedId of result.deleted) {
      await deleteNotePermanently(deletedId);
    }

    console.log(`[Sync] Push complete: ${result.created.length} created, ${result.updated.length} updated, ${result.deleted.length} deleted`);
  } catch (error) {
    console.error('[Sync] Push failed:', error);
    throw error;
  }
};

/**
 * Pull latest notes from server
 */
const pullChanges = async (userId: string): Promise<void> => {
  console.log('[Sync] Pulling changes from server');

  try {
    const serverNotes = await syncPullNotes();
    const localNotes = await getAllNotes(userId);

    // Create a map of local notes by ID for quick lookup
    const localNotesMap = new Map(localNotes.map(n => [n._id, n]));

    // Merge server notes into local
    for (const serverNote of serverNotes) {
      const localNote = localNotesMap.get(serverNote._id);

      if (!localNote) {
        // New note from server - add locally
        await saveNote(serverNote);
      } else if (localNote.syncStatus === 'synced') {
        // Both synced - server wins if newer
        const serverTime = new Date(serverNote.serverUpdatedAt || serverNote.updatedAt).getTime();
        const localTime = new Date(localNote.serverUpdatedAt || localNote.updatedAt).getTime();
        if (serverTime > localTime) {
          await saveNote(serverNote);
        }
      }
      // If local has pending changes, keep local version (will be pushed next)
    }

    // Handle notes deleted on server
    const serverNoteIds = new Set(serverNotes.map(n => n._id));
    for (const localNote of localNotes) {
      if (!localNote._id.startsWith('local_') && !serverNoteIds.has(localNote._id)) {
        // Note was deleted on server
        if (localNote.syncStatus === 'synced') {
          // Only delete if we don't have pending changes
          await deleteNotePermanently(localNote._id);
        }
      }
    }

    console.log(`[Sync] Pull complete: ${serverNotes.length} notes from server`);
  } catch (error) {
    console.error('[Sync] Pull failed:', error);
    throw error;
  }
};

/**
 * Perform full sync (push then pull)
 */
export const performSync = async (userId: string): Promise<void> => {
  if (isSyncing) {
    console.log('[Sync] Already syncing, skipping');
    return;
  }

  if (!navigator.onLine) {
    console.log('[Sync] Offline, skipping sync');
    return;
  }

  const token = localStorage.getItem('token');
  if (!token) {
    console.log('[Sync] No token, skipping sync');
    return;
  }

  isSyncing = true;
  console.log('[Sync] Starting sync...');

  try {
    await pushChanges();
    await pullChanges(userId);
    notifySyncComplete();
    console.log('[Sync] Sync complete');
  } catch (error) {
    console.error('[Sync] Sync failed:', error);
  } finally {
    isSyncing = false;
  }
};

/**
 * Initialize sync service - sets up online/offline listeners
 */
export const initSyncService = (userId: string): (() => void) => {
  console.log('[Sync] Initializing sync service');

  const handleOnline = () => {
    console.log('[Sync] Network online - triggering sync');
    performSync(userId);
  };

  // Initial sync when service starts
  if (navigator.onLine) {
    performSync(userId);
  }

  // Listen for online events
  window.addEventListener('online', handleOnline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    syncCallbacks = [];
  };
};

/**
 * Check if currently syncing
 */
export const isSyncInProgress = (): boolean => isSyncing;
