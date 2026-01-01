// Preloader hook for critical resources
import { useState, useEffect } from 'react';

interface PreloaderOptions {
  images?: string[];
  fonts?: string[];
  scripts?: string[];
  delay?: number;
}

export function usePreloader(options: PreloaderOptions = {}) {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const { images = [], fonts = [], scripts = [], delay = 500 } = options;
    const totalResources = images.length + fonts.length + scripts.length;
    
    if (totalResources === 0) {
      setTimeout(() => {
        setProgress(100);
        setIsLoading(false);
      }, delay);
      return;
    }

    let loadedCount = 0;

    const updateProgress = () => {
      loadedCount++;
      setProgress((loadedCount / totalResources) * 100);
      
      if (loadedCount === totalResources) {
        setTimeout(() => {
          setIsLoading(false);
        }, delay);
      }
    };

    // Preload images
    images.forEach((src) => {
      const img = new Image();
      img.onload = updateProgress;
      img.onerror = updateProgress;
      img.src = src;
    });

    // Preload fonts
    fonts.forEach((fontUrl) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      link.href = fontUrl;
      link.onload = updateProgress;
      link.onerror = updateProgress;
      document.head.appendChild(link);
    });

    // Preload scripts
    scripts.forEach((scriptUrl) => {
      const script = document.createElement('script');
      script.src = scriptUrl;
      script.onload = updateProgress;
      script.onerror = updateProgress;
      document.head.appendChild(script);
    });

  }, [options]);

  return { isLoading, progress };
}