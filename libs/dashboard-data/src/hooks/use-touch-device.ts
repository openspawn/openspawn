import { useState, useEffect } from "react";

interface TouchDeviceInfo {
  /** True when a touch-capable device is detected */
  isTouchDevice: boolean;
  /** True when viewport is narrow (< 768px) */
  isMobile: boolean;
  /** True when viewport is narrow or touch is detected */
  isMobileOrTouch: boolean;
}

/**
 * Detect touch capability and mobile viewport.
 * Listens for resize and first touch events.
 */
export function useTouchDevice(): TouchDeviceInfo {
  const [isTouchDevice, setIsTouchDevice] = useState(() => {
    if (typeof window === "undefined") return false;
    return "ontouchstart" in window || navigator.maxTouchPoints > 0;
  });

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 768;
  });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);

    // If first touch detected, mark as touch device
    const onTouch = () => {
      setIsTouchDevice(true);
      window.removeEventListener("touchstart", onTouch);
    };
    if (!isTouchDevice) {
      window.addEventListener("touchstart", onTouch, { passive: true });
    }

    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("touchstart", onTouch);
    };
  }, [isTouchDevice]);

  return {
    isTouchDevice,
    isMobile,
    isMobileOrTouch: isMobile || isTouchDevice,
  };
}
