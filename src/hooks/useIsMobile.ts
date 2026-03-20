import { useState, useEffect } from "react";

export function useIsMobile(breakpoint: number = 1024): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(
    typeof window !== "undefined"
      ? window.innerWidth < breakpoint
      : false
  );

  useEffect(() => {
    const handleResize = () => {
      const next = window.innerWidth < breakpoint;

      // Only update if changed
      setIsMobile(prev => {
        if (prev === next) return prev;
        return next;
      });
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);

  return isMobile;
}

