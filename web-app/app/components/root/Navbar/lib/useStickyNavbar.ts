import { useEffect, useRef, useState } from 'react';

export default function useStickyNavbar(overlapThreshold: number) {
  const [isNavStuck, setIsNavStuck] = useState(false);
  const dummyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!(dummyRef.current)) return;

    const observer = new IntersectionObserver((entries) => {
      const [e] = entries;
      if (!e || entries.length !== 1) throw new Error('A single observer must be registered');

      const newIsStuck
        = e.intersectionRatio < overlapThreshold;
      setIsNavStuck(newIsStuck);
    }, {
      threshold: overlapThreshold,
    });
    observer.observe(dummyRef.current);
  }, [overlapThreshold]);

  return { isNavStuck, dummyRef };
}
