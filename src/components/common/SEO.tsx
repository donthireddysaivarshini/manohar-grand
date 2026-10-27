import React, { useEffect } from 'react';

export interface SEOProps {
  title: string;
  description?: string;
  canonical?: string;
  robots?: string; // 'index, follow' | 'noindex, nofollow'
  ogImage?: string;
  ogType?: 'website' | 'article' | 'hotel';
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
}

const DEFAULT_ORIGIN = 'https://www.manohargrand.com';
const DEFAULT_IMAGE = `${DEFAULT_ORIGIN}/logomg.jpeg`;
const DEFAULT_ROBOTS = 'index, follow';

/**
 * Production-ready on-page SEO component for React 19 SPA.
 * Dynamically updates document.title, meta tags, canonical links, Open Graph,
 * Twitter cards, and JSON-LD structured data on route transitions.
 */
export const SEO: React.FC<SEOProps> = ({
  title,
  description = 'Experience comfortable stay, contemporary hospitality, and direct booking at Manohar Grand, Kukatpally, Hyderabad.',
  canonical,
  robots = DEFAULT_ROBOTS,
  ogImage = DEFAULT_IMAGE,
  ogType = 'website',
  jsonLd,
}) => {
  useEffect(() => {
    // 1. Update Document Title
    document.title = title;

    // Helper: Find or create a meta tag by name or property
    const setMetaTag = (attribute: 'name' | 'property', attrValue: string, content: string) => {
      let element = document.querySelector(`meta[${attribute}="${attrValue}"]`) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Helper: Find or create link tag
    const setLinkTag = (rel: string, href: string) => {
      let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
    };

    // 2. Primary Meta Tags
    setMetaTag('name', 'description', description);
    setMetaTag('name', 'robots', robots);

    // 3. Canonical URL
    const canonicalUrl = canonical || (typeof window !== 'undefined' ? `${DEFAULT_ORIGIN}${window.location.pathname}` : DEFAULT_ORIGIN);
    setLinkTag('canonical', canonicalUrl);

    // 4. Open Graph Tags
    setMetaTag('property', 'og:site_name', 'Manohar Grand');
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:image', ogImage);

    // 5. Twitter Card Tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', ogImage);

    // 6. JSON-LD Structured Data Schema
    const scriptId = 'seo-jsonld-schema';
    let scriptElement = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (jsonLd) {
      if (!scriptElement) {
        scriptElement = document.createElement('script');
        scriptElement.id = scriptId;
        scriptElement.type = 'application/ld+json';
        document.head.appendChild(scriptElement);
      }
      scriptElement.textContent = JSON.stringify(jsonLd);
    } else if (scriptElement) {
      scriptElement.remove();
    }

    return () => {
      // Clean up JSON-LD on unmount if appropriate
      const activeScript = document.getElementById(scriptId);
      if (activeScript && !jsonLd) {
        activeScript.remove();
      }
    };
  }, [title, description, canonical, robots, ogImage, ogType, jsonLd]);

  return null;
};
