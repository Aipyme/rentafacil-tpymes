/**
 * useSEO — Hook para gestionar meta tags SEO dinámicamente
 * 
 * Actualiza title, description, Open Graph y Twitter Cards
 * en cada cambio de página para mejorar el posicionamiento en Google
 * y la apariencia al compartir en redes sociales.
 */

import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogType?: string;
  ogImage?: string;
  noindex?: boolean;
}

const SITE_NAME = "Renta Fácil TPymes";
const BASE_URL = "https://rentatpymes.aicheckpyme.co";
const DEFAULT_OG_IMAGE = "https://rentatpymes.aicheckpyme.co/og-image.png";

export function useSEO({
  title,
  description,
  canonical,
  ogType = "website",
  ogImage,
  noindex = false,
}: SEOProps) {
  useEffect(() => {
    // Title
    const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;
    document.title = fullTitle;

    // Helper para crear o actualizar meta tags
    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    // Description
    setMeta("name", "description", description);

    // Robots
    if (noindex) {
      setMeta("name", "robots", "noindex, nofollow");
    } else {
      setMeta("name", "robots", "index, follow");
    }

    // Canonical
    const canonicalUrl = canonical ? `${BASE_URL}${canonical}` : BASE_URL;
    let linkCanonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!linkCanonical) {
      linkCanonical = document.createElement("link");
      linkCanonical.setAttribute("rel", "canonical");
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute("href", canonicalUrl);

    // Open Graph
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", description);
    setMeta("property", "og:type", ogType);
    setMeta("property", "og:url", canonicalUrl);
    setMeta("property", "og:image", ogImage || DEFAULT_OG_IMAGE);
    setMeta("property", "og:site_name", SITE_NAME);
    setMeta("property", "og:locale", "es_ES");

    // Twitter Cards
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", ogImage || DEFAULT_OG_IMAGE);

    // Cleanup: no eliminamos los meta tags al desmontar porque la siguiente
    // página los sobreescribirá con sus propios valores
  }, [title, description, canonical, ogType, ogImage, noindex]);
}
