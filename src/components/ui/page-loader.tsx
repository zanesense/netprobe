// Full page loading component
import { motion } from 'framer-motion';
import { Radar } from 'lucide-react';

interface PageLoaderProps {
  text?: string;
}

export function PageLoader({ text = 'Loading...' }: PageLoaderProps) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4 p-8 rounded-xl bg-card border border-border shadow-lg"
      >
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="h-12 w-12 text-primary"
          >
            <Radar className="h-full w-full" />
          </motion.div>
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/20"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-primary">NetProbe</h3>
          <p className="text-sm text-muted-foreground mt-1">{text}</p>
        </div>
      </motion.div>
    </div>
  );
}