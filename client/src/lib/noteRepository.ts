/**
 * Note Repository - Single entry point for all note operations
 * UI components should use this instead of api.ts directly
 */

import { v4 as uuidv4 } from 'uuid';
import type { LocalNote } from '../types';
import {
  getAllNotes,
  getNoteById,
  saveNote,
  getNotesBySyncStatus,
} from './db';

// Generate a UUID for local notes
const generateLocalId = (): string => {
  return `local_${uuidv4()}`;
};

// Get current timestamp in ISO format
const now = (): string => new Date().toISOString();

/**
 * Get all notes for a user
 */
export const getNotesFromLocal = async (userId: string): Promise<LocalNote[]> => {
  return getAllNotes(userId);
};

/**
 * Get a single note by ID
 */
export const getNoteFromLocal = async (id: string): Promise<LocalNote | null> => {
  return getNoteById(id);
};

/**
 * Create a new note locally
 */
export const createNoteLocal = async (
  userId: string,
  data: { title?: string; content?: string }
): Promise<LocalNote> => {
  const timestamp = now();
  const newNote: LocalNote = {
    _id: generateLocalId(),
    title: data.title || 'Untitled',
    content: data.content || '',
    userId,
    createdAt: timestamp,
    updatedAt: timestamp,
    syncStatus: 'pending',
  };

  await saveNote(newNote);
  return newNote;
};

/**
 * Update an existing note locally
 */
export const updateNoteLocal = async (
  id: string,
  data: { title?: string; content?: string }
): Promise<LocalNote | null> => {
  const existingNote = await getNoteById(id);
  if (!existingNote) {
    return null;
  }

  const updatedNote: LocalNote = {
    ...existingNote,
    title: data.title ?? existingNote.title,
    content: data.content ?? existingNote.content,
    updatedAt: now(),
    syncStatus: 'pending',
  };

  await saveNote(updatedNote);
  return updatedNote;
};

/**
 * Delete a note (soft delete - marks as deleted for sync)
 */
export const deleteNoteLocal = async (id: string): Promise<boolean> => {
  const existingNote = await getNoteById(id);
  if (!existingNote) {
    return false;
  }

  // If it's a local-only note that was never synced, we can just mark it deleted
  // The sync service will handle permanent deletion after server confirms
  const deletedNote: LocalNote = {
    ...existingNote,
    updatedAt: now(),
    syncStatus: 'deleted',
  };

  await saveNote(deletedNote);
  return true;
};

/**
 * Get all notes pending sync (pending or deleted)
 */
export const getPendingNotes = async (): Promise<LocalNote[]> => {
  const pending = await getNotesBySyncStatus('pending');
  const deleted = await getNotesBySyncStatus('deleted');
  return [...pending, ...deleted];
};

/**
 * Check if a note ID is a local-only ID
 */
export const isLocalId = (id: string): boolean => {
  return id.startsWith('local_');
};

/**
 * Mark a note as synced (used by sync service after successful push)
 */
export const markNoteSynced = async (
  localId: string,
  serverId: string,
  serverUpdatedAt: string
): Promise<LocalNote | null> => {
  const existingNote = await getNoteById(localId);
  if (!existingNote) {
    return null;
  }

  const syncedNote: LocalNote = {
    ...existingNote,
    _id: serverId, // Update to server ID
    syncStatus: 'synced',
    serverUpdatedAt,
  };

  // If local ID is different from server ID, we need to delete the old entry
  if (localId !== serverId) {
    const { deleteNotePermanently } = await import('./db');
    await deleteNotePermanently(localId);
  }

  await saveNote(syncedNote);
  return syncedNote;
};
