import { useState, useEffect } from 'react';

export function useContainerSize(ref: React.RefObject<HTMLDivElement | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        setSize((prev) =>
          prev.width === Math.round(width) && prev.height === Math.round(height)
            ? prev
            : { width: Math.round(width), height: Math.round(height) }
        );
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}
