/**
 * ============================================================
 * PoweredByBadge — "Powered by OpenSpawn" brand attribution
 * ============================================================
 *
 * Drop this into any white-labeled deployment (e.g. BikiniBottom) to
 * credit the underlying OpenSpawn platform.
 *
 * USAGE — Inline (small, fits in a footer or compact bar):
 * ─────────────────────────────────────────────────────────
 *   import { PoweredByBadge } from "~/components/powered-by-badge";
 *
 *   // Dark background (default — matches OpenSpawn navy theme)
 *   <PoweredByBadge variant="inline" />
 *
 *   // Light background (white-label pages on light bg)
 *   <PoweredByBadge variant="inline" theme="light" />
 *
 *
 * USAGE — Banner (full-width strip, top or bottom of a page/section):
 * ────────────────────────────────────────────────────────────────────
 *   <PoweredByBadge variant="banner" />
 *   <PoweredByBadge variant="banner" theme="light" />
 *
 *
 * USAGE — Card (standalone widget, landing sections or dashboards):
 * ─────────────────────────────────────────────────────────────────
 *   <PoweredByBadge variant="card" />
 *   <PoweredByBadge variant="card" theme="light" />
 *
 *   // Override the card CTA link (defaults to https://openspawn.ai)
 *   <PoweredByBadge variant="card" ctaHref="https://openspawn.ai/templates" />
 *
 *
 * PROPS:
 *   variant   — "inline" | "banner" | "card"   (default: "inline")
 *   theme     — "dark" | "light"               (default: "dark")
 *               "dark"  → designed for navy/dark backgrounds
 *               "light" → designed for white/light backgrounds
 *   ctaHref   — override the card CTA button href  (default: "https://openspawn.ai")
 *   className — extra classes appended to the root element
 *
 * ============================================================
 */

import type { SVGProps } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Variant = "inline" | "banner" | "card";
type Theme = "dark" | "light";

interface PoweredByBadgeProps {
  variant?: Variant;
  theme?: Theme;
  ctaHref?: string;
  className?: string;
}

// ─── Coral SVG icon ──────────────────────────────────────────────────────────
// Geometric interpretation of the 🪸 coral emoji. Two-tone orange coral
// branches with rounded tips. aria-hidden — decorative when next to text.

function CoralIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {/* ── Base stem ── */}
      <path d="M12 22L12 17" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />

      {/* ── Left main branch ── */}
      <path d="M12 19L7.5 14" stroke="#f97316" strokeWidth="2.2" strokeLinecap="round" />
      {/* Left upper split A */}
      <path d="M7.5 14L5 10.5" stroke="#f97316" strokeWidth="1.9" strokeLinecap="round" />
      <circle cx="5" cy="9.5" r="1.6" fill="#fb923c" />
      {/* Left upper split B */}
      <path d="M7.5 14L10 9.5" stroke="#f97316" strokeWidth="1.9" strokeLinecap="round" />
      <circle cx="10" cy="8.5" r="1.6" fill="#fb923c" />

      {/* ── Centre branch ── */}
      <path d="M12 17L12 10.5" stroke="#f97316" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="12" cy="9.5" r="1.6" fill="#fb923c" />

      {/* ── Right main branch ── */}
      <path d="M12 19L16.5 14" stroke="#f97316" strokeWidth="2.2" strokeLinecap="round" />
      {/* Right upper split A */}
      <path d="M16.5 14L19 10.5" stroke="#f97316" strokeWidth="1.9" strokeLinecap="round" />
      <circle cx="19" cy="9.5" r="1.6" fill="#fb923c" />
      {/* Right upper split B */}
      <path d="M16.5 14L14 9.5" stroke="#f97316" strokeWidth="1.9" strokeLinecap="round" />
      <circle cx="14" cy="8.5" r="1.6" fill="#fb923c" />
    </svg>
  );
}

// ─── Theme token maps ─────────────────────────────────────────────────────────
// Each theme resolves to a set of Tailwind class strings so the component
// stays portable across any page background.

interface ThemeTokens {
  // Inline
  inlineWrap: string;
  inlineLink: string;
  inlineText: string;

  // Banner
  bannerWrap: string;
  bannerText: string;
  bannerLink: string;
  bannerDivider: string;
  bannerTagline: string;

  // Card
  cardWrap: string;
  cardTitle: string;
  cardBody: string;
  cardLink: string;
  cardBtn: string;
  cardBtnHover: string;
  cardFooter: string;
}

const themes: Record<Theme, ThemeTokens> = {
  dark: {
    // ── Inline ──────────────────────────────────────────────────────────────
    inlineWrap:
      "inline-flex items-center gap-2 rounded-full border border-white/10 " +
      "bg-white/[0.04] px-3.5 py-1.5 " +
      "transition-all duration-200 ease-out " +
      "hover:border-cyan-500/30 hover:bg-cyan-500/[0.06] " +
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950",
    inlineLink: "text-cyan-400 underline-offset-2 hover:underline",
    inlineText: "text-slate-400",

    // ── Banner ──────────────────────────────────────────────────────────────
    bannerWrap:
      "w-full border-y border-white/5 bg-navy-900 " +
      "transition-colors duration-200 hover:bg-navy-800",
    bannerText: "text-slate-300",
    bannerLink:
      "font-semibold text-cyan-400 underline-offset-2 hover:underline " +
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:rounded",
    bannerDivider: "text-slate-600",
    bannerTagline: "text-slate-500",

    // ── Card ─────────────────────────────────────────────────────────────────
    cardWrap:
      "rounded-2xl border border-white/10 bg-navy-900 p-6 " +
      "shadow-[0_1px_3px_rgba(0,0,0,0.4),0_1px_2px_rgba(0,0,0,0.3)] " +
      "transition-all duration-200 ease-out " +
      "hover:border-cyan-500/30 hover:shadow-[0_0_20px_rgba(6,182,212,0.10)]",
    cardTitle: "text-slate-100 font-semibold",
    cardBody: "text-slate-400",
    cardLink:
      "text-cyan-400 underline-offset-2 hover:underline " +
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:rounded",
    cardBtn:
      "inline-flex items-center gap-1.5 rounded-xl " +
      "bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-navy-950 " +
      "transition-all duration-150 " +
      "hover:bg-cyan-400 hover:shadow-[0_0_10px_rgba(6,182,212,0.25)] " +
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950",
    cardBtnHover: "",
    cardFooter: "text-slate-500 text-xs",
  },

  light: {
    // ── Inline ──────────────────────────────────────────────────────────────
    inlineWrap:
      "inline-flex items-center gap-2 rounded-full border border-slate-200 " +
      "bg-slate-50 px-3.5 py-1.5 " +
      "transition-all duration-200 ease-out " +
      "hover:border-cyan-500/40 hover:bg-cyan-50 " +
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:ring-offset-2",
    inlineLink: "text-cyan-600 underline-offset-2 hover:underline",
    inlineText: "text-slate-500",

    // ── Banner ──────────────────────────────────────────────────────────────
    bannerWrap:
      "w-full border-y border-slate-200 bg-slate-50 " +
      "transition-colors duration-200 hover:bg-slate-100",
    bannerText: "text-slate-600",
    bannerLink:
      "font-semibold text-cyan-600 underline-offset-2 hover:underline " +
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:rounded",
    bannerDivider: "text-slate-300",
    bannerTagline: "text-slate-400",

    // ── Card ─────────────────────────────────────────────────────────────────
    cardWrap:
      "rounded-2xl border border-slate-200 bg-white p-6 " +
      "shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.05)] " +
      "transition-all duration-200 ease-out " +
      "hover:border-cyan-500/40 hover:shadow-[0_4px_16px_rgba(6,182,212,0.12)]",
    cardTitle: "text-slate-800 font-semibold",
    cardBody: "text-slate-500",
    cardLink:
      "text-cyan-600 underline-offset-2 hover:underline " +
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:rounded",
    cardBtn:
      "inline-flex items-center gap-1.5 rounded-xl " +
      "bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white " +
      "transition-all duration-150 " +
      "hover:bg-cyan-500 hover:shadow-[0_0_10px_rgba(6,182,212,0.25)] " +
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:ring-offset-2",
    cardBtnHover: "",
    cardFooter: "text-slate-400 text-xs",
  },
};

// ─── Variant components ───────────────────────────────────────────────────────

/** Inline — compact pill for footers and tight layouts */
function InlineBadge({ t, className }: { t: ThemeTokens; className: string }) {
  return (
    <a
      href="https://openspawn.ai"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Powered by OpenSpawn — visit openspawn.ai"
      className={`${t.inlineWrap} ${className}`}
    >
      <CoralIcon className="h-4 w-4 flex-shrink-0" />
      <span className={`text-xs font-medium ${t.inlineText}`}>
        Powered by <span className={`${t.inlineLink} font-semibold`}>OpenSpawn</span>
      </span>
    </a>
  );
}

/** Banner — full-width strip with subtle brand strip */
function BannerBadge({ t, className }: { t: ThemeTokens; className: string }) {
  return (
    <div
      role="complementary"
      aria-label="Powered by OpenSpawn"
      className={`${t.bannerWrap} ${className}`}
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-5 py-3 sm:flex-row sm:px-6">
        {/* Left: brand mark + copy */}
        <div className="flex items-center gap-2.5">
          <CoralIcon className="h-5 w-5 flex-shrink-0" />
          <span className={`text-sm ${t.bannerText}`}>
            Powered by{" "}
            <a
              href="https://openspawn.ai"
              target="_blank"
              rel="noopener noreferrer"
              className={t.bannerLink}
            >
              OpenSpawn
            </a>
          </span>
          <span aria-hidden="true" className={`hidden sm:inline ${t.bannerDivider}`}>
            ·
          </span>
          <span className={`hidden sm:inline text-sm ${t.bannerTagline}`}>
            Open-source multi-agent platform
          </span>
        </div>

        {/* Right: secondary link */}
        <a
          href="https://openspawn.ai"
          target="_blank"
          rel="noopener noreferrer"
          className={`text-xs ${t.bannerTagline} hover:${t.bannerLink} transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:rounded`}
        >
          openspawn.ai ↗
        </a>
      </div>
    </div>
  );
}

/** Card — standalone with coral icon, copy, and CTA button */
function CardBadge({
  t,
  ctaHref,
  className,
}: {
  t: ThemeTokens;
  ctaHref: string;
  className: string;
}) {
  return (
    <aside
      aria-label="Powered by OpenSpawn — build your own agent organization"
      className={`${t.cardWrap} ${className}`}
    >
      {/* Header row: icon + title */}
      <div className="mb-4 flex items-start gap-3">
        <div className="flex-shrink-0 rounded-xl bg-orange-500/10 p-2.5">
          <CoralIcon className="h-7 w-7" />
        </div>
        <div>
          <p className={`text-[11px] uppercase tracking-widest font-bold mb-0.5 ${t.cardFooter}`}>
            Powered by
          </p>
          <h3 className={`text-lg leading-tight ${t.cardTitle}`}>
            <a
              href="https://openspawn.ai"
              target="_blank"
              rel="noopener noreferrer"
              className={t.cardLink}
            >
              OpenSpawn
            </a>
          </h3>
        </div>
      </div>

      {/* Body copy */}
      <p className={`mb-5 text-sm leading-relaxed ${t.cardBody}`}>
        This deployment runs on OpenSpawn — the open-source platform for multi-agent organizations.
        Protocol-native, real-world ready.
      </p>

      {/* CTA button */}
      <a
        href={ctaHref}
        target="_blank"
        rel="noopener noreferrer"
        className={t.cardBtn}
        aria-label="Build your own agent organization on OpenSpawn"
      >
        Build your own agent org
        <span aria-hidden="true">→</span>
      </a>

      {/* Footer note */}
      <p className={`mt-4 ${t.cardFooter}`}>
        Free &amp; open-source · MIT License ·{" "}
        <a
          href="https://github.com/openspawn/openspawn"
          target="_blank"
          rel="noopener noreferrer"
          className={`underline underline-offset-2 hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-current focus-visible:rounded`}
          aria-label="OpenSpawn on GitHub (opens in new tab)"
        >
          GitHub ↗
        </a>
      </p>
    </aside>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * PoweredByBadge
 *
 * Reusable "Powered by OpenSpawn" attribution badge with three display modes.
 * Works on both dark (default) and light backgrounds via the `theme` prop.
 *
 * @example
 *   <PoweredByBadge variant="inline" />
 *   <PoweredByBadge variant="banner" theme="light" />
 *   <PoweredByBadge variant="card" ctaHref="https://openspawn.ai/templates" />
 */
export function PoweredByBadge({
  variant = "inline",
  theme = "dark",
  ctaHref = "https://openspawn.ai",
  className = "",
}: PoweredByBadgeProps) {
  const t = themes[theme];

  switch (variant) {
    case "banner":
      return <BannerBadge t={t} className={className} />;
    case "card":
      return <CardBadge t={t} ctaHref={ctaHref} className={className} />;
    case "inline":
    default:
      return <InlineBadge t={t} className={className} />;
  }
}

export default PoweredByBadge;
