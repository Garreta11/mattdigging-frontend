import { useRef, useState, useEffect, useLayoutEffect, useCallback } from 'react';

/**
 * Minimal window-scroll virtualizer for lists with fixed item height.
 *
 * Works with @studio-freight/lenis because Lenis uses native window.scrollY
 * (no CSS-transform wrapper), so scroll events are real.
 *
 * @param count       - Total number of items
 * @param itemHeight  - Estimated height of each item in pixels
 * @param overscan    - Number of items to render above/below the visible range
 */
export function useWindowVirtualizer(
  count: number,
  itemHeight: number,
  overscan = 6,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(() => window.scrollY);
  const [windowHeight, setWindowHeight] = useState(() => window.innerHeight);
  const [containerOffset, setContainerOffset] = useState(0);

  // Recalculate where the container starts in the document whenever count changes
  // (i.e., when a filter loads new tracks and the list re-mounts).
  useLayoutEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerOffset(rect.top + window.scrollY);
      }
    };
    measure();
  }, [count]);

  // Scroll listener — passive, so it never blocks Lenis or native scroll.
  useEffect(() => {
    const onScroll = () => setScrollTop(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Resize listener — update window height so the visible range stays correct.
  useEffect(() => {
    const onResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ── Visible range ─────────────────────────────────────────────────────────
  const relativeScroll = scrollTop - containerOffset;

  const firstIndex = Math.max(
    0,
    Math.floor(relativeScroll / itemHeight) - overscan,
  );
  const lastIndex = Math.min(
    count - 1,
    Math.ceil((relativeScroll + windowHeight) / itemHeight) + overscan,
  );

  const visibleCount = Math.max(0, lastIndex - firstIndex + 1);
  const visibleIndices = Array.from({ length: visibleCount }, (_, i) => firstIndex + i);

  // ── Spacer heights (maintain correct scroll height) ───────────────────────
  const paddingTop = firstIndex * itemHeight;
  const paddingBottom = Math.max(0, (count - lastIndex - 1) * itemHeight);
  const totalHeight = count * itemHeight;

  return {
    containerRef,
    visibleIndices,
    paddingTop,
    paddingBottom,
    totalHeight,
  };
}
