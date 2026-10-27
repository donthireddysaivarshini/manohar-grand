import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Production-ready Google Analytics 4 (GA4) integration for React Router SPAs.
 * Features:
 * - Reads measurement ID from import.meta.env.VITE_GA_MEASUREMENT_ID
 * - Dynamically loads gtag.js asynchronously without duplicate scripts
 * - Sends single page_view events on SPA route changes
 * - Disables automatic initial pageview to avoid duplicate counts
 * - Safe fallback in development environments if ID is missing
 */
export const GoogleAnalytics: React.FC = () => {
  const location = useLocation();
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

  useEffect(() => {
    // Only initialize if a valid measurement ID (e.g. G-XXXXXXXXXX) is provided
    if (!measurementId || !measurementId.startsWith('G-')) {
      return;
    }

    // Prevent duplicate script injection
    const scriptId = 'google-analytics-gtag';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag() {
        // eslint-disable-next-line prefer-rest-params
        window.dataLayer?.push(arguments);
      };

      window.gtag('js', new Date());
      // send_page_view: false ensures we control the exact page_view event on route changes
      window.gtag('config', measurementId, {
        send_page_view: false,
      });
    }
  }, [measurementId]);

  // Track route changes
  useEffect(() => {
    if (!measurementId || !measurementId.startsWith('G-') || typeof window.gtag !== 'function') {
      return;
    }

    const pagePath = location.pathname + location.search;
    window.gtag('event', 'page_view', {
      page_title: document.title,
      page_location: window.location.href,
      page_path: pagePath,
    });
  }, [location, measurementId]);

  return null;
};
