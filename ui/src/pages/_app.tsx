// pages/_app.tsx
import "@/styles/globals.css";
import React, { useEffect } from 'react';
import type { AppProps } from "next/app";
import { 
  isCOIEnabled, 
  loadCOIServiceWorker, 
  isServiceWorkerSupported 
} from '@/utils/reactCOIServiceWorker';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    const initCOI = async () => {
      if (!isServiceWorkerSupported()) {
        console.warn('Service Workers are not supported in this browser');
        return;
      }

      try {
        await loadCOIServiceWorker();
        
        // Check COI status after a small delay to ensure headers are properly set
        setTimeout(() => {
          if (isCOIEnabled()) {
            console.log('Cross-Origin Isolation is enabled');
          } else {
            console.warn('Cross-Origin Isolation is not enabled');
          }
        }, 1000);
      } catch (error) {
        console.error('Error initializing COI:', error);
      }
    };

    initCOI();
  }, []);

  return <Component {...pageProps} />;
}