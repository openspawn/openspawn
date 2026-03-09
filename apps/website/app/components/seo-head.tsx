/**
 * SEOHead — client-side meta/head management utilities
 *
 * Primary approach: use TanStack Router's `meta()` in route definitions (route-tree.tsx).
 * The `HeadContent` component in __root.tsx renders those tags; React 19 hoists
 * <title>, <meta>, and <link> to document.head automatically.
 *
 * Use these components for:
 *  - JsonLd: inject JSON-LD schemas directly from page components (dynamic schemas)
 *  - CanonicalTag: inject a <link rel="canonical"> from a page component
 *  - SEOHead: convenience wrapper when you need both at once
 */

import { type ReactNode } from "react";

// ─── JsonLd ───────────────────────────────────────────────────────────────────
/**
 * Renders a <script type="application/ld+json"> tag.
 * React 19 hoists <script> tags with known data types to <head>.
 * Place this anywhere in your component tree.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data, null, 0) }}
    />
  );
}

// ─── CanonicalTag ─────────────────────────────────────────────────────────────
/**
 * Renders a <link rel="canonical"> tag.
 * React 19 hoists <link> elements to <head> automatically.
 * Place this anywhere in your component tree.
 */
export function CanonicalTag({ href }: { href: string }) {
  return <link rel="canonical" href={href} />;
}

// ─── SEOHead ─────────────────────────────────────────────────────────────────
/**
 * Convenience component for per-page SEO additions.
 * Prefer the route-tree.tsx `meta()` approach for standard tags;
 * use this for page-level JSON-LD or canonical overrides.
 */
export function SEOHead({
  canonical,
  schemaLd,
  children,
}: {
  canonical?: string;
  schemaLd?: object | object[];
  children?: ReactNode;
}) {
  const schemas = schemaLd ? (Array.isArray(schemaLd) ? schemaLd : [schemaLd]) : [];

  return (
    <>
      {canonical && <CanonicalTag href={canonical} />}
      {schemas.map((schema, i) => (
        <JsonLd key={i} data={schema} />
      ))}
      {children}
    </>
  );
}

// ─── BreadcrumbSchema builder ─────────────────────────────────────────────────
export interface BreadcrumbItem {
  name: string;
  href: string;
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[], baseUrl = "https://openspawn.dev") {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "OpenSpawn", item: baseUrl },
      ...items.map((item, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: item.name,
        item: `${baseUrl}${item.href}`,
      })),
    ],
  };
}
