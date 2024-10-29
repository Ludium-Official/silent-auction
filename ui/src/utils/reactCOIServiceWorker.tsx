// src/utils/reactCOIServiceWorker.tsx

export const loadCOIServiceWorker = async (): Promise<void> => {
  // Only run in browser environment
  if (typeof window === 'undefined') return;

  // Skip on localhost unless explicitly enabled
  const isLocalhost = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';
  
  if (isLocalhost) {
    console.log('Skipping COI ServiceWorker on localhost');
    return;
  }

  // Check if service worker is already registered
  if (navigator.serviceWorker.controller) {
    console.log('COI ServiceWorker already registered');
    return;
  }

  try {
    // Prevent multiple script injections
    const existingScript = document.querySelector('script[src*="coi-serviceworker"]');
    if (existingScript) {
      console.log('COI ServiceWorker script already exists');
      return;
    }

    // Create and configure script element
    const coi = document.createElement('script');
    
      // Use the correct path based on your project structure
    // Assuming the file is in public/coi-serviceworker.min.js
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const coiPath = `${basePath}/coi-serviceworker.min.js`;
    
    coi.setAttribute('src', coiPath);
    coi.setAttribute('type', 'text/javascript');
    coi.setAttribute('data-coi-serviceworker', 'true');

    // Create promise to handle script loading
    const scriptLoaded = new Promise<void>((resolve, reject) => {
      coi.onload = () => {
        console.log('COI ServiceWorker script loaded successfully');
        resolve();
      };

      coi.onerror = (error) => {
        console.error('COI ServiceWorker script failed to load:', error);
        reject(error);
      };
    });

    // Append script to head
    document.head.appendChild(coi);

    // Wait for script to load
    await scriptLoaded;

    // Wait for service worker to be registered
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => {
        const controllerCheck = setInterval(() => {
          if (navigator.serviceWorker.controller) {
            clearInterval(controllerCheck);
            resolve();
          }
        }, 100);

        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(controllerCheck);
          console.warn('Timed out waiting for ServiceWorker controller');
          resolve();
        }, 10000);
      });
    }

  } catch (err) {
    console.error('Failed to load COI ServiceWorker:', err);
    throw err;
  }
};

// Enhanced COI status check
export const isCOIEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;

  const crossOriginIsolated = window.crossOriginIsolated;
  const coepHeader = document.head.querySelector(
    'meta[http-equiv="Cross-Origin-Embedder-Policy"]'
  );
  const coopHeader = document.head.querySelector(
    'meta[http-equiv="Cross-Origin-Opener-Policy"]'
  );

  const isEnabled = !!(
    crossOriginIsolated ||
    (coepHeader && coopHeader)
  );

  return isEnabled;
};

// Helper function to check if service worker is supported
export const isServiceWorkerSupported = (): boolean => {
  return 'serviceWorker' in navigator;
};