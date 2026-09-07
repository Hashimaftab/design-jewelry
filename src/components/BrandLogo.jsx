import { useState, useEffect } from 'react';

// In-memory cache for processed logos so canvas processing runs at most once
const cache = {
  light: null, // Gold crown + brilliant white text (for dark hero/home)
  dark: null,  // Gold crown + deep charcoal text (for light/white pages)
};

let processingPromise = null;

function processLogo() {
  if (processingPromise) return processingPromise;

  processingPromise = new Promise((resolve) => {
    // Return immediately if already cached
    if (cache.light && cache.dark) {
      resolve(cache);
      return;
    }

    if (typeof window === 'undefined') {
      resolve(cache);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = '/ChatGPT_Image_Sep_4__2026__01_33_02_AM-removebg-preview.png';

    img.onload = () => {
      try {
        const origW = img.naturalWidth || img.width;
        const origH = img.naturalHeight || img.height;

        if (!origW || !origH) {
          resolve(cache);
          return;
        }

        // Draw original onto canvas to read bounding box and pixels
        const baseCanvas = document.createElement('canvas');
        baseCanvas.width = origW;
        baseCanvas.height = origH;
        const baseCtx = baseCanvas.getContext('2d');
        baseCtx.drawImage(img, 0, 0);

        const baseImgData = baseCtx.getImageData(0, 0, origW, origH);
        const data = baseImgData.data;

        // Auto-detect tight bounding box to trim excessive transparent margins
        let minX = origW;
        let minY = origH;
        let maxX = 0;
        let maxY = 0;

        for (let y = 0; y < origH; y++) {
          for (let x = 0; x < origW; x++) {
            const a = data[(y * origW + x) * 4 + 3];
            if (a > 15) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        const pad = 4;
        minX = Math.max(0, minX - pad);
        minY = Math.max(0, minY - pad);
        maxX = Math.min(origW - 1, maxX + pad);
        maxY = Math.min(origH - 1, maxY + pad);
        const cropW = Math.max(1, maxX - minX + 1);
        const cropH = Math.max(1, maxY - minY + 1);

        // 1. Cropped Dark Variant (for white backgrounds: gold crown + dark charcoal letters)
        const darkCanvas = document.createElement('canvas');
        darkCanvas.width = cropW;
        darkCanvas.height = cropH;
        const darkCtx = darkCanvas.getContext('2d');
        darkCtx.drawImage(baseCanvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
        cache.dark = darkCanvas.toDataURL('image/png');

        // 2. Cropped Light Variant (for dark backgrounds: gold crown + pure white letters)
        const lightImgData = baseCtx.getImageData(0, 0, origW, origH);
        const lightData = lightImgData.data;

        for (let i = 0; i < lightData.length; i += 4) {
          const a = lightData[i + 3];
          if (a > 15) {
            const r = lightData[i];
            const g = lightData[i + 1];
            const b = lightData[i + 2];

            // Gold pixels check: high red & green, low blue, noticeably more red than blue
            const isGold = r > 100 && g > 70 && (r - b > 30);

            if (!isGold) {
              // Convert black/dark letters to brilliant pure white
              lightData[i] = 255;
              lightData[i + 1] = 255;
              lightData[i + 2] = 255;
            } else {
              // Enhance gold crown luminosity so it sparkles on dark backgrounds
              lightData[i] = Math.min(255, Math.round(r * 1.15));
              lightData[i + 1] = Math.min(255, Math.round(g * 1.15));
              lightData[i + 2] = Math.min(255, Math.round(b * 1.15));
            }
          }
        }

        const tempLightCanvas = document.createElement('canvas');
        tempLightCanvas.width = origW;
        tempLightCanvas.height = origH;
        const tempLightCtx = tempLightCanvas.getContext('2d');
        tempLightCtx.putImageData(lightImgData, 0, 0);

        const lightCanvas = document.createElement('canvas');
        lightCanvas.width = cropW;
        lightCanvas.height = cropH;
        const lightCtx = lightCanvas.getContext('2d');
        lightCtx.drawImage(tempLightCanvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
        cache.light = lightCanvas.toDataURL('image/png');

        resolve(cache);
      } catch (err) {
        console.error('Failed to process brand logo variants:', err);
        resolve(cache);
      }
    };

    img.onerror = () => {
      resolve(cache);
    };
  });

  return processingPromise;
}

export default function BrandLogo({
  variant = 'auto', // 'light' (for dark hero/home), 'dark' (for white pages), or 'auto'
  isHome = false,
  className = 'nav-logo-img',
  alt = 'HUSN Luxury Jewelry',
  style = {},
}) {
  const targetVariant = variant === 'auto' ? (isHome ? 'light' : 'dark') : variant;
  const initialSrc =
    cache[targetVariant] || '/ChatGPT_Image_Sep_4__2026__01_33_02_AM-removebg-preview.png';

  const [src, setSrc] = useState(initialSrc);
  const [isProcessed, setIsProcessed] = useState(Boolean(cache[targetVariant]));

  useEffect(() => {
    if (cache[targetVariant]) {
      setSrc(cache[targetVariant]);
      setIsProcessed(true);
      return;
    }

    processLogo().then((res) => {
      if (res[targetVariant]) {
        setSrc(res[targetVariant]);
        setIsProcessed(true);
      }
    });
  }, [targetVariant]);

  return (
    <img
      src={src}
      alt={alt}
      className={`${className} ${
        targetVariant === 'light' ? 'logo-variant-light' : 'logo-variant-dark'
      } ${!isProcessed && targetVariant === 'light' ? 'logo-loading-fallback' : ''}`}
      style={style}
    />
  );
}
