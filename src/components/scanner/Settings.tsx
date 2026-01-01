import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Settings as SettingsIcon, 
  Shield, 
  Clock, 
  Network, 
  Terminal, 
  Bell, 
  Palette,
  Save,
  RotateCcw,
  Info,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { resetDismissedAlerts } from "@/components/ui/dismissible-alert";
import { toast } from "sonner";

interface SettingsProps {
  onSettingsChange?: (settings: AppSettings) => void;
}

export interface AppSettings {
  // Scanning preferences
  defaultTimeout: number;
  maxConcurrentScans: number;
  defaultScanType: string;
  enableServiceDetection: boolean;
  enableOSFingerprinting: boolean;
  
  // UI preferences
  theme: string;
  enableAnimations: boolean;
  enableSoundNotifications: boolean;
  autoSaveResults: boolean;
  
  // Security preferences
  showComplianceNotice: boolean;
  enableAuditLogging: boolean;
  requireReauthorization: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  defaultTimeout: 3000,
  maxConcurrentScans: 100,
  defaultScanType: "tcp-connect",
  enableServiceDetection: true,
  enableOSFingerprinting: false,
  theme: "dark",
  enableAnimations: true,
  enableSoundNotifications: false,
  autoSaveResults: true,
  showComplianceNotice: true,
  enableAuditLogging: true,
  requireReauthorization: false,
};

export function Settings({ onSettingsChange }: SettingsProps) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('netprobe-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }
  }, []);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      setHasChanges(true);
      return newSettings;
    });
  };

  const saveSettings = () => {
    localStorage.setItem('netprobe-settings', JSON.stringify(settings));
    onSettingsChange?.(settings);
    setHasChanges(false);
    toast.success("Settings saved successfully");
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    setHasChanges(true);
    toast.info("Settings reset to defaults");
  };

  const clearComplianceFlag = () => {
    localStorage.removeItem('netprobe-compliance-accepted');
    updateSetting('showComplianceNotice', true);
    toast.info("Compliance notice will be shown on next startup");
  };

  const resetDismissedAlertsHandler = () => {
    resetDismissedAlerts();
    toast.success("All dismissed alerts have been reset and will be shown again");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="p-6 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <SettingsIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Application Settings</h2>
            <p className="text-sm text-muted-foreground">
              Configure NetProbe behavior and preferences
            </p>
          </div>
        </div>

        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3 rounded-lg bg-warning/10 border border-warning/30 mb-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-warning" />
                <span className="text-sm text-warning">You have unsaved changes</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={resetSettings}>
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset
                </Button>
                <Button variant="default" size="sm" onClick={saveSettings}>
                  <Save className="h-3 w-3 mr-1" />
                  Save
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Scanning Settings */}
      <div className="p-6 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Network className="h-4 w-4 text-primary" />
          <h3 className="font-medium">Scanning Preferences</h3>
        </div>

        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Default Scan Type</label>
              <Select 
                value={settings.defaultScanType} 
                onValueChange={(value) => updateSetting('defaultScanType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tcp-connect">TCP Connect</SelectItem>
                  <SelectItem value="tcp-syn">TCP SYN</SelectItem>
                  <SelectItem value="udp">UDP</SelectItem>
                  <SelectItem value="tcp-ack">TCP ACK</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Connection Timeout</label>
              <div className="px-3">
                <Slider
                  value={[settings.defaultTimeout]}
                  onValueChange={([value]) => updateSetting('defaultTimeout', value)}
                  max={10000}
                  min={500}
                  step={500}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>500ms</span>
                  <span className="font-mono">{settings.defaultTimeout}ms</span>
                  <span>10s</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Max Concurrent Scans</label>
            <div className="px-3">
              <Slider
                value={[settings.maxConcurrentScans]}
                onValueChange={([value]) => updateSetting('maxConcurrentScans', value)}
                max={500}
                min={10}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>10</span>
                <span className="font-mono">{settings.maxConcurrentScans}</span>
                <span>500</span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Service Detection</label>
                <p className="text-xs text-muted-foreground">
                  Automatically detect services on open ports
                </p>
              </div>
              <Switch
                checked={settings.enableServiceDetection}
                onCheckedChange={(checked) => updateSetting('enableServiceDetection', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">OS Fingerprinting</label>
                <p className="text-xs text-muted-foreground">
                  Attempt to identify target operating systems
                </p>
              </div>
              <Switch
                checked={settings.enableOSFingerprinting}
                onCheckedChange={(checked) => updateSetting('enableOSFingerprinting', checked)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* UI Settings */}
      <div className="p-6 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="h-4 w-4 text-primary" />
          <h3 className="font-medium">Interface Preferences</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Enable Animations</label>
              <p className="text-xs text-muted-foreground">
                Show smooth transitions and effects
              </p>
            </div>
            <Switch
              checked={settings.enableAnimations}
              onCheckedChange={(checked) => updateSetting('enableAnimations', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Sound Notifications</label>
              <p className="text-xs text-muted-foreground">
                Play sounds for scan completion and alerts
              </p>
            </div>
            <Switch
              checked={settings.enableSoundNotifications}
              onCheckedChange={(checked) => updateSetting('enableSoundNotifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Auto-save Results</label>
              <p className="text-xs text-muted-foreground">
                Automatically save scan results to history
              </p>
            </div>
            <Switch
              checked={settings.autoSaveResults}
              onCheckedChange={(checked) => updateSetting('autoSaveResults', checked)}
            />
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="p-6 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-4 w-4 text-primary" />
          <h3 className="font-medium">Security & Compliance</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Show Compliance Notice</label>
              <p className="text-xs text-muted-foreground">
                Display legal notice on application startup
              </p>
            </div>
            <Switch
              checked={settings.showComplianceNotice}
              onCheckedChange={(checked) => updateSetting('showComplianceNotice', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Enable Audit Logging</label>
              <p className="text-xs text-muted-foreground">
                Log all scanning activities for compliance
              </p>
            </div>
            <Switch
              checked={settings.enableAuditLogging}
              onCheckedChange={(checked) => updateSetting('enableAuditLogging', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Require Re-authorization</label>
              <p className="text-xs text-muted-foreground">
                Show authorization modal for each session
              </p>
            </div>
            <Switch
              checked={settings.requireReauthorization}
              onCheckedChange={(checked) => updateSetting('requireReauthorization', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Reset Compliance Status</label>
              <p className="text-xs text-muted-foreground">
                Clear saved compliance acceptance
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={clearComplianceFlag}>
              Reset
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Reset Dismissed Alerts</label>
              <p className="text-xs text-muted-foreground">
                Show all previously dismissed warning alerts again
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={resetDismissedAlertsHandler}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Reset Alerts
            </Button>
          </div>
        </div>
      </div>

      {/* Save Actions */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border">
        <div className="text-sm text-muted-foreground">
          Settings are automatically saved to your browser's local storage
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={resetSettings} disabled={!hasChanges}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset All
          </Button>
          <Button onClick={saveSettings} disabled={!hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    </motion.div>
  );
}