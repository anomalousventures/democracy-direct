import { useRef, useState, useEffect } from "react";

export function useScrollShadow<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleScroll = () => {
      setIsScrolled(el.scrollTop > 0);
    };

    handleScroll();
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  return { ref, isScrolled };
}
