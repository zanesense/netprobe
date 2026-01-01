import { motion } from "framer-motion";
import { Heart, Github, ExternalLink, Code, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="border-t border-border bg-card/30 backdrop-blur-sm mt-16"
    >
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold">
                <span className="text-primary">Net</span>
                <span className="text-foreground">Probe</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Professional network security assessment tool built for the modern web. 
              Empowering security professionals with browser-based reconnaissance capabilities.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Code className="h-3 w-3" />
              <span>Built with React, TypeScript & Tailwind CSS</span>
            </div>
          </div>

          {/* Links Section */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Resources</h4>
            <div className="space-y-2">
              <a
                href="https://github.com/zanesense/netprobe"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="h-3 w-3" />
                Source Code
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href="https://github.com/zanesense/netprobe/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Report Issues
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href="https://github.com/zanesense/netprobe/blob/main/README.md"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Documentation
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Legal & Credits */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Legal & Ethics</h4>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>
                This tool is designed for authorized security testing only. 
                Users must comply with applicable laws and regulations.
              </p>
              <p>
                Always obtain proper authorization before scanning networks 
                or systems you do not own.
              </p>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>© {currentYear} NetProbe. MIT License.</span>
            <span>•</span>
            <span>v3.0.0</span>
          </div>

          {/* Credits */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Made with</span>
            <Heart className="h-4 w-4 text-red-500 animate-pulse" />
            <span className="text-sm text-muted-foreground">by</span>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-auto p-1 text-sm font-medium hover:text-primary"
            >
              <a
                href="https://github.com/zanesense"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1"
              >
                <Github className="h-4 w-4" />
                zanesense
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>
        </div>

        {/* Additional Attribution */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <span>Inspired by</span>
            <a
              href="https://nmap.org"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Nmap
            </a>
            <span>•</span>
            <span>UI powered by</span>
            <a
              href="https://ui.shadcn.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              shadcn/ui
            </a>
            <span>•</span>
            <span>Styled with</span>
            <a
              href="https://tailwindcss.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Tailwind CSS
            </a>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}