/**
 * useSync hook - Initializes and manages sync service
 */

import { useEffect, useRef } from 'react';
import { useRecoilValue } from 'recoil';
import { useQueryClient } from '@tanstack/react-query';
import { userAtom } from '../state/atoms/userAtom';
import { initSyncService, onSyncComplete, performSync } from '../lib/syncService';

export const useSync = () => {
  const user = useRecoilValue(userAtom);
  const queryClient = useQueryClient();
  const cleanupRef = useRef<(() => void) | null>(null);

  const userId = (user as { _id?: string })?._id || '';

  useEffect(() => {
    if (!userId) {
      return;
    }

    // Initialize sync service
    cleanupRef.current = initSyncService(userId);

    // Register callback to invalidate queries when sync completes
    const unsubscribe = onSyncComplete(() => {
      queryClient.invalidateQueries({ queryKey: ['notes', userId] });
    });

    return () => {
      cleanupRef.current?.();
      unsubscribe();
    };
  }, [userId, queryClient]);

  // Return a function to manually trigger sync
  const triggerSync = () => {
    if (userId) {
      performSync(userId);
    }
  };

  return { triggerSync };
};
