// Firebase storage utilities for scan data persistence
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  ScanResult, 
  ScanHistoryEntry, 
  PortResult, 
  ServiceInfo, 
  Host, 
  ScriptResult, 
  FirewallInfo,
  DiscoveredHost,
  DiscoveryMethod,
  Finding
} from '@/types/scanner';

// Firestore collection names
const COLLECTIONS = {
  SCANS: 'scans',
  SCAN_HISTORY: 'scanHistory',
  REPORTS: 'reports',
  USER_SETTINGS: 'userSettings'
} as const;

// Interfaces for Firestore documents
export interface FirestoreScanResult {
  id: string;
  userId: string;
  target: string;
  scanType: string;
  startTime: Timestamp;
  endTime: Timestamp;
  duration: number;
  status: 'running' | 'completed' | 'failed' | 'stopped';
  
  // Scan data
  discoveredHosts: DiscoveredHost[];
  portResults: PortResult[];
  services: ServiceInfo[];
  hosts: Host[];
  scriptResults?: ScriptResult[];
  firewallInfo?: FirewallInfo;
  
  // Metadata
  findings: {
    info: number;
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  
  // Settings used for this scan
  scanSettings: {
    startPort: number;
    endPort: number;
    timeout: number;
    concurrency: number;
  };
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirestoreReport {
  id: string;
  userId: string;
  scanId: string;
  format: 'pdf' | 'csv' | 'json';
  fileName: string;
  fileSize: number;
  downloadUrl?: string;
  createdAt: Timestamp;
}

export class FirebaseScanStorage {
  
  /**
   * Save a scan result to Firestore
   */
  static async saveScanResult(
    userId: string, 
    scanResult: ScanResult,
    scanSettings: {
      startPort: number;
      endPort: number;
      timeout: number;
      concurrency: number;
    }
  ): Promise<string> {
    try {
      const firestoreData: Omit<FirestoreScanResult, 'id'> = {
        userId,
        target: scanResult.target,
        scanType: scanResult.scanType,
        startTime: Timestamp.fromDate(scanResult.startTime),
        endTime: Timestamp.fromDate(scanResult.endTime),
        duration: scanResult.duration,
        status: 'completed',
        
        discoveredHosts: scanResult.hosts.map(host => ({
          id: `${host.ip}-${Date.now()}`,
          ip: host.ip,
          hostname: host.hostname || host.ip,
          mac: '',
          vendor: '',
          method: 'tcp-syn' as DiscoveryMethod,
          latency: 0,
          ttl: host.osInfo?.ttl || 64,
          isAlive: host.status === 'up',
          discoveredAt: new Date()
        })),
        
        portResults: scanResult.ports,
        services: scanResult.services,
        hosts: scanResult.hosts,
        scriptResults: [],
        firewallInfo: null,
        
        findings: {
          info: scanResult.findings.filter(f => f.severity === 'info').length,
          low: scanResult.findings.filter(f => f.severity === 'low').length,
          medium: scanResult.findings.filter(f => f.severity === 'medium').length,
          high: 0, // Not used in current Finding interface
          critical: 0 // Not used in current Finding interface
        },
        scanSettings,
        
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };

      const docRef = await addDoc(collection(db, COLLECTIONS.SCANS), firestoreData);
      return docRef.id;
    } catch (error) {
      console.error('Error saving scan result:', error);
      throw new Error('Failed to save scan result to database');
    }
  }

  /**
   * Update an existing scan result
   */
  static async updateScanResult(
    scanId: string,
    updates: Partial<FirestoreScanResult>
  ): Promise<void> {
    try {
      const scanRef = doc(db, COLLECTIONS.SCANS, scanId);
      await updateDoc(scanRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating scan result:', error);
      throw new Error('Failed to update scan result');
    }
  }

  /**
   * Get scan results for a user
   */
  static async getUserScanResults(
    userId: string, 
    limitCount: number = 50
  ): Promise<FirestoreScanResult[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.SCANS),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FirestoreScanResult));
    } catch (error) {
      console.error('Error fetching scan results:', error);
      throw new Error('Failed to fetch scan results');
    }
  }

  /**
   * Get a specific scan result
   */
  static async getScanResult(scanId: string): Promise<FirestoreScanResult | null> {
    try {
      const docRef = doc(db, COLLECTIONS.SCANS, scanId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as FirestoreScanResult;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching scan result:', error);
      throw new Error('Failed to fetch scan result');
    }
  }

  /**
   * Delete a scan result
   */
  static async deleteScanResult(scanId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.SCANS, scanId));
    } catch (error) {
      console.error('Error deleting scan result:', error);
      throw new Error('Failed to delete scan result');
    }
  }

  /**
   * Save scan history entry
   */
  static async saveScanHistory(
    userId: string,
    historyEntry: ScanHistoryEntry
  ): Promise<string> {
    try {
      const firestoreData = {
        ...historyEntry,
        userId,
        timestamp: Timestamp.fromDate(historyEntry.timestamp),
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, COLLECTIONS.SCAN_HISTORY), firestoreData);
      return docRef.id;
    } catch (error) {
      console.error('Error saving scan history:', error);
      throw new Error('Failed to save scan history');
    }
  }

  /**
   * Get scan history for a user
   */
  static async getUserScanHistory(
    userId: string,
    limitCount: number = 20
  ): Promise<ScanHistoryEntry[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.SCAN_HISTORY),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          timestamp: data.timestamp.toDate()
        } as ScanHistoryEntry;
      });
    } catch (error) {
      console.error('Error fetching scan history:', error);
      throw new Error('Failed to fetch scan history');
    }
  }

  /**
   * Clear scan history for a user
   */
  static async clearUserScanHistory(userId: string): Promise<void> {
    try {
      const q = query(
        collection(db, COLLECTIONS.SCAN_HISTORY),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error clearing scan history:', error);
      throw new Error('Failed to clear scan history');
    }
  }

  /**
   * Save report metadata
   */
  static async saveReportMetadata(
    userId: string,
    scanId: string,
    format: 'pdf' | 'csv' | 'json',
    fileName: string,
    fileSize: number,
    downloadUrl?: string
  ): Promise<string> {
    try {
      const reportData: Omit<FirestoreReport, 'id'> = {
        userId,
        scanId,
        format,
        fileName,
        fileSize,
        downloadUrl,
        createdAt: serverTimestamp() as Timestamp
      };

      const docRef = await addDoc(collection(db, COLLECTIONS.REPORTS), reportData);
      return docRef.id;
    } catch (error) {
      console.error('Error saving report metadata:', error);
      throw new Error('Failed to save report metadata');
    }
  }

  /**
   * Get reports for a user
   */
  static async getUserReports(
    userId: string,
    limitCount: number = 50
  ): Promise<FirestoreReport[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.REPORTS),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FirestoreReport));
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw new Error('Failed to fetch reports');
    }
  }

  /**
   * Update user scan statistics
   */
  static async updateUserScanStats(
    userId: string,
    scansPerformed: number,
    totalScanTime: number,
    lastScanAt: Date
  ): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        'usage.scansPerformed': scansPerformed,
        'usage.totalScanTime': totalScanTime,
        'usage.lastScanAt': Timestamp.fromDate(lastScanAt),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating user scan stats:', error);
      // Don't throw error for stats update failure
    }
  }

  /**
   * Get scan statistics for a user
   */
  static async getUserScanStats(userId: string): Promise<{
    totalScans: number;
    totalScanTime: number;
    lastScanAt?: Date;
  }> {
    try {
      const q = query(
        collection(db, COLLECTIONS.SCANS),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      let totalScanTime = 0;
      let lastScanAt: Date | undefined;

      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        totalScanTime += data.duration || 0;
        
        const scanDate = data.endTime?.toDate();
        if (scanDate && (!lastScanAt || scanDate > lastScanAt)) {
          lastScanAt = scanDate;
        }
      });

      return {
        totalScans: querySnapshot.size,
        totalScanTime,
        lastScanAt
      };
    } catch (error) {
      console.error('Error fetching scan stats:', error);
      return {
        totalScans: 0,
        totalScanTime: 0
      };
    }
  }
}