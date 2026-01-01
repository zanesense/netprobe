// Component for displaying and managing saved scan results
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Database,
  Trash2,
  Eye,
  Download,
  Clock,
  Target,
  Shield,
  AlertTriangle,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useSavedScans } from '@/hooks/useSavedScans';
import { FirestoreScanResult } from '@/lib/firebase-storage';
import { formatDistanceToNow } from 'date-fns';

interface SavedScansProps {
  onViewScan?: (scan: FirestoreScanResult) => void;
  onLoadScan?: (scan: FirestoreScanResult) => void;
}

export function SavedScans({ onViewScan, onLoadScan }: SavedScansProps) {
  const { savedScans, loading, error, deleteSavedScan, refreshSavedScans } = useSavedScans();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteScan = async (scanId: string) => {
    setDeletingId(scanId);
    try {
      await deleteSavedScan(scanId);
    } finally {
      setDeletingId(null);
    }
  };

  const getSeverityColor = (findings: FirestoreScanResult['findings']) => {
    if (findings.critical > 0) return 'text-red-500';
    if (findings.high > 0) return 'text-orange-500';
    if (findings.medium > 0) return 'text-yellow-500';
    if (findings.low > 0) return 'text-blue-500';
    return 'text-green-500';
  };

  const getSeverityBadge = (findings: FirestoreScanResult['findings']) => {
    if (findings.critical > 0) return <Badge variant="destructive">Critical</Badge>;
    if (findings.high > 0) return <Badge variant="destructive">High</Badge>;
    if (findings.medium > 0) return <Badge variant="secondary">Medium</Badge>;
    if (findings.low > 0) return <Badge variant="outline">Low</Badge>;
    return <Badge variant="default">Clean</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Saved Scans
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading saved scans...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Saved Scans
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" size="sm" onClick={refreshSavedScans}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Saved Scans
            </CardTitle>
            <CardDescription>
              {savedScans.length} scan{savedScans.length !== 1 ? 's' : ''} saved to your account
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={refreshSavedScans}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {savedScans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Database className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-2">No saved scans yet</p>
            <p className="text-xs text-muted-foreground">
              Enable auto-save in settings to automatically save scan results
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {savedScans.map((scan, index) => (
                <motion.div
                  key={scan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Target className="h-4 w-4 text-primary" />
                            <span className="font-mono text-sm font-medium truncate">
                              {scan.target}
                            </span>
                            {getSeverityBadge(scan.findings)}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(scan.createdAt.toDate(), { addSuffix: true })}
                            </span>
                            <span className="capitalize">{scan.scanType.replace('-', ' ')}</span>
                            <span>{scan.duration / 1000}s</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-primary">
                            {scan.portResults.filter(p => p.status === 'open').length}
                          </div>
                          <div className="text-xs text-muted-foreground">Open Ports</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-primary">
                            {scan.services.length}
                          </div>
                          <div className="text-xs text-muted-foreground">Services</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-lg font-semibold ${getSeverityColor(scan.findings)}`}>
                            {scan.findings.critical + scan.findings.high + scan.findings.medium + scan.findings.low}
                          </div>
                          <div className="text-xs text-muted-foreground">Findings</div>
                        </div>
                      </div>

                      <Separator className="my-3" />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {onViewScan && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onViewScan(scan)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          )}
                          {onLoadScan && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onLoadScan(scan)}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Load
                            </Button>
                          )}
                        </div>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={deletingId === scan.id}
                            >
                              {deletingId === scan.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Scan Result</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this scan result for{' '}
                                <span className="font-mono">{scan.target}</span>?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteScan(scan.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}