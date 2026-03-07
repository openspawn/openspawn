/**
 * BubbleField — organic floating bubble particles for underwater atmosphere.
 * Uses bb-bubble-float keyframe with CSS custom properties for drift variation.
 * IntersectionObserver pauses animation when off-screen.
 * CSS animations only — no motion/react.
 */

import { useEffect, useRef, useState } from "react";

interface BubbleFieldProps {
  count?: number;
  className?: string;
}

interface BubbleDef {
  id: number;
  size: number; // px
  left: number; // 0-100%
  bottom: number; // 0-40%
  delay: number; // s
  duration: number; // s
  opacity: number; // 0.1-0.55
  drift: "float" | "left" | "right";
  borderWidth: number; // 1-2px
  shine: number; // 20-40 — position of internal highlight
}

export function BubbleField({ count = 18, className = "" }: BubbleFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), {
      threshold: 0,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Deterministic bubbles via prime-based seed — stable across renders
  const bubbles: BubbleDef[] = Array.from({ length: count }, (_, i) => {
    const seed = i * 7919 + 31; // prime-based, offset to avoid i=0 edge
    const seed2 = i * 6271 + 17;
    const drift: BubbleDef["drift"] = seed % 3 === 0 ? "left" : seed % 3 === 1 ? "right" : "float";

    return {
      id: i,
      // Size: 3 tiers — small (3-8), medium (9-16), large (17-24)
      size:
        i % 7 === 0
          ? ((seed * 3) % 8) + 17 // large
          : i % 3 === 0
            ? ((seed * 7) % 8) + 9 // medium
            : ((seed * 13) % 6) + 3, // small

      left: (seed * 17) % 100, // 0-100%
      bottom: (seed * 23) % 40, // 0-40%
      delay: (seed * 11) % 14, // 0-14s
      duration: ((seed2 * 7) % 10) + 9, // 9-19s
      opacity: ((seed * 31) % 40) / 100 + 0.12, // 0.12-0.52
      drift,
      borderWidth: seed % 4 === 0 ? 2 : 1,
      shine: ((seed2 * 13) % 20) + 20, // 20-40
    };
  });

  const getAnimation = (b: BubbleDef) => {
    return `bb-bubble-float ${b.duration}s ease-in-out ${b.delay}s infinite`;
  };

  const getDriftVars = (b: BubbleDef): React.CSSProperties => {
    if (b.drift === "left")
      return {
        "--bb-drift-x1": "0px",
        "--bb-drift-x2": "-12px",
        "--bb-drift-x3": "4px",
      } as React.CSSProperties;
    if (b.drift === "right")
      return {
        "--bb-drift-x1": "0px",
        "--bb-drift-x2": "10px",
        "--bb-drift-x3": "-2px",
      } as React.CSSProperties;
    return {
      "--bb-drift-x1": "0px",
      "--bb-drift-x2": "8px",
      "--bb-drift-x3": "-4px",
    } as React.CSSProperties;
  };

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      aria-hidden="true"
      style={{ animationPlayState: isVisible ? "running" : "paused" }}
    >
      {bubbles.map((b) => (
        <div
          key={b.id}
          className="absolute rounded-full"
          style={{
            width: b.size,
            height: b.size,
            left: `${b.left}%`,
            bottom: `${b.bottom}%`,
            opacity: b.opacity,
            background: `radial-gradient(
              circle at ${b.shine}% ${b.shine}%,
              rgba(232, 248, 255, 0.7) 0%,
              rgba(184, 228, 247, 0.35) 30%,
              rgba(74, 174, 217, 0.08) 100%
            )`,
            border: `${b.borderWidth}px solid rgba(184, 228, 247, ${0.15 + b.opacity * 0.4})`,
            boxShadow:
              b.size > 12
                ? `inset 0 -2px 4px rgba(74,174,217,0.2), 0 0 ${Math.round(b.size * 0.5)}px rgba(74,174,217,0.1)`
                : undefined,
            animation: getAnimation(b),
            animationPlayState: isVisible ? "running" : "paused",
            ...getDriftVars(b),
          }}
        />
      ))}
    </div>
  );
}
