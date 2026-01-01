// Hook for managing saved scan results from Firebase
import { useState, useEffect, useCallback } from 'react';
import { FirebaseScanStorage, FirestoreScanResult } from '@/lib/firebase-storage';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function useSavedScans() {
  const { user } = useAuth();
  const [savedScans, setSavedScans] = useState<FirestoreScanResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved scans from Firebase
  const loadSavedScans = useCallback(async () => {
    if (!user) {
      setSavedScans([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const scans = await FirebaseScanStorage.getUserScanResults(user.uid);
      setSavedScans(scans);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load saved scans';
      setError(errorMessage);
      console.error('Error loading saved scans:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Delete a saved scan
  const deleteSavedScan = useCallback(async (scanId: string) => {
    try {
      await FirebaseScanStorage.deleteScanResult(scanId);
      setSavedScans(prev => prev.filter(scan => scan.id !== scanId));
      toast.success('Scan deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete scan';
      toast.error(errorMessage);
      console.error('Error deleting scan:', err);
    }
  }, []);

  // Get a specific saved scan
  const getSavedScan = useCallback(async (scanId: string): Promise<FirestoreScanResult | null> => {
    try {
      return await FirebaseScanStorage.getScanResult(scanId);
    } catch (err) {
      console.error('Error fetching scan:', err);
      return null;
    }
  }, []);

  // Refresh saved scans
  const refreshSavedScans = useCallback(() => {
    loadSavedScans();
  }, [loadSavedScans]);

  // Load scans when user changes
  useEffect(() => {
    loadSavedScans();
  }, [loadSavedScans]);

  return {
    savedScans,
    loading,
    error,
    deleteSavedScan,
    getSavedScan,
    refreshSavedScans,
    loadSavedScans
  };
}