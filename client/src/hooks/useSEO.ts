/**
 * useSEO — Hook para gestionar meta tags SEO dinámicamente
 *
 * Actualiza title, description, Open Graph, Twitter Cards y JSON-LD
 * en cada cambio de página para mejorar el posicionamiento en Google
 * y la apariencia al compartir en redes sociales.
 */

import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogType?: "website" | "article" | "service";
  ogImage?: string;
  ogImageAlt?: string;
  noindex?: boolean;
  /** JSON-LD structured data adicional para la página */
  structuredData?: Record<string, unknown> | Record<string, unknown>[];
}

const SITE_NAME = "Renta Fácil TPymes";
const BASE_URL = "https://rentatpymes.aicheckpyme.co";
const DEFAULT_OG_IMAGE = "https://rentatpymes.aicheckpyme.co/og-image.png";
const TWITTER_HANDLE = "@ayudatpymes";

export function useSEO({
  title,
  description,
  canonical,
  ogType = "website",
  ogImage,
  ogImageAlt,
  noindex = false,
  structuredData,
}: SEOProps) {
  useEffect(() => {
    // ── Title ──
    const fullTitle =
      title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;
    document.title = fullTitle;

    // Helper para crear o actualizar meta tags
    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(
        `meta[${attr}="${key}"]`
      ) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    // ── Description ──
    setMeta("name", "description", description);

    // ── Robots ──
    setMeta(
      "name",
      "robots",
      noindex
        ? "noindex, nofollow"
        : "index, follow, max-image-preview:large, max-snippet:-1"
    );

    // ── Canonical ──
    const canonicalUrl = canonical ? `${BASE_URL}${canonical}` : BASE_URL;
    let linkCanonical = document.querySelector(
      'link[rel="canonical"]'
    ) as HTMLLinkElement | null;
    if (!linkCanonical) {
      linkCanonical = document.createElement("link");
      linkCanonical.setAttribute("rel", "canonical");
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute("href", canonicalUrl);

    // ── Open Graph ──
    const image = ogImage || DEFAULT_OG_IMAGE;
    const imageAlt = ogImageAlt || `${fullTitle} — imagen de portada`;
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", description);
    setMeta("property", "og:type", ogType);
    setMeta("property", "og:url", canonicalUrl);
    setMeta("property", "og:image", image);
    setMeta("property", "og:image:width", "1200");
    setMeta("property", "og:image:height", "630");
    setMeta("property", "og:image:alt", imageAlt);
    setMeta("property", "og:site_name", SITE_NAME);
    setMeta("property", "og:locale", "es_ES");

    // ── Twitter / X Cards ──
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:site", TWITTER_HANDLE);
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", image);
    setMeta("name", "twitter:image:alt", imageAlt);

    // ── JSON-LD Structured Data dinámico ──
    // Elimina el script dinámico anterior si existe
    const existingScript = document.querySelector(
      'script[data-seo="dynamic"]'
    );
    if (existingScript) existingScript.remove();

    if (structuredData) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-seo", "dynamic");
      const dataArray = Array.isArray(structuredData)
        ? structuredData
        : [structuredData];
      script.textContent = JSON.stringify(
        dataArray.length === 1 ? dataArray[0] : dataArray
      );
      document.head.appendChild(script);
    }
  }, [
    title,
    description,
    canonical,
    ogType,
    ogImage,
    ogImageAlt,
    noindex,
    structuredData,
  ]);
}
