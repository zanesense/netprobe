import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Settings, 
  FileText, 
  Shield, 
  Users, 
  CheckCircle,
  Info,
  Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { REPORT_TEMPLATES, COMPLIANCE_FRAMEWORKS } from "@/lib/report-templates";

interface ReportConfigProps {
  onGenerate: (config: ReportConfiguration) => void;
  isGenerating: boolean;
}

export interface ReportConfiguration {
  template: string;
  format: 'pdf' | 'csv' | 'json';
  includeCharts: boolean;
  includeRecommendations: boolean;
  includeMethodology: boolean;
  complianceFramework?: string;
  customTitle?: string;
  customDescription?: string;
  classification: 'public' | 'internal' | 'confidential' | 'restricted';
  sections: string[];
}

export function ReportConfig({ onGenerate, isGenerating }: ReportConfigProps) {
  const [config, setConfig] = useState<ReportConfiguration>({
    template: 'technical',
    format: 'pdf',
    includeCharts: true,
    includeRecommendations: true,
    includeMethodology: true,
    classification: 'confidential',
    sections: []
  });

  const selectedTemplate = REPORT_TEMPLATES[config.template];

  const handleGenerate = () => {
    onGenerate(config);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
          <Settings className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Report Configuration</h2>
          <p className="text-sm text-muted-foreground">
            Customize your security assessment report
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Template Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Report Template
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Template Type</Label>
              <Select value={config.template} onValueChange={(value) => setConfig(prev => ({ ...prev, template: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(REPORT_TEMPLATES).map(([key, template]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        {template.format === 'executive' && <Users className="h-4 w-4" />}
                        {template.format === 'technical' && <Settings className="h-4 w-4" />}
                        {template.format === 'compliance' && <Shield className="h-4 w-4" />}
                        <div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-xs text-muted-foreground">{template.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTemplate && (
              <div className="space-y-2">
                <Label>Included Sections</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {selectedTemplate.sections.map((section) => (
                    <div key={section.id} className="flex items-center justify-between text-sm">
                      <span>{section.title}</span>
                      <div className="flex items-center gap-2">
                        {section.required && (
                          <Badge variant="secondary" className="text-xs">Required</Badge>
                        )}
                        <CheckCircle className="h-3 w-3 text-success" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Format & Options */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Download className="h-4 w-4 text-primary" />
              Export Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Export Format</Label>
              <Select value={config.format} onValueChange={(value: 'pdf' | 'csv' | 'json') => setConfig(prev => ({ ...prev, format: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Report</SelectItem>
                  <SelectItem value="csv">CSV Data</SelectItem>
                  <SelectItem value="json">JSON Export</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="charts">Include Charts</Label>
                <Switch
                  id="charts"
                  checked={config.includeCharts}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, includeCharts: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="recommendations">Include Recommendations</Label>
                <Switch
                  id="recommendations"
                  checked={config.includeRecommendations}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, includeRecommendations: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="methodology">Include Methodology</Label>
                <Switch
                  id="methodology"
                  checked={config.includeMethodology}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, includeMethodology: checked }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Classification Level</Label>
              <Select value={config.classification} onValueChange={(value: any) => setConfig(prev => ({ ...prev, classification: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="internal">Internal Use</SelectItem>
                  <SelectItem value="confidential">Confidential</SelectItem>
                  <SelectItem value="restricted">Restricted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Framework */}
        {config.template === 'compliance' && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Compliance Framework
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Framework</Label>
                <Select value={config.complianceFramework} onValueChange={(value) => setConfig(prev => ({ ...prev, complianceFramework: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select compliance framework" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(COMPLIANCE_FRAMEWORKS).map(([key, name]) => (
                      <SelectItem key={key} value={key}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Custom Fields */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Custom Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Custom Title (Optional)</Label>
                <Input
                  placeholder="Custom report title"
                  value={config.customTitle || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, customTitle: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Report Classification</Label>
                <Badge variant="outline" className="capitalize">
                  {config.classification}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Custom Description (Optional)</Label>
              <Textarea
                placeholder="Additional context or description for this assessment"
                value={config.customDescription || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, customDescription: e.target.value }))}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generate Button */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4" />
          <span>Report will be generated based on current scan data</span>
        </div>
        <Button onClick={handleGenerate} disabled={isGenerating} size="lg">
          {isGenerating ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-4 w-4 mr-2"
              >
                <Settings className="h-4 w-4" />
              </motion.div>
              Generating...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Generate Report
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}