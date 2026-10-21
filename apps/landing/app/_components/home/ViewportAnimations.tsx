"use client";

import { useEffect } from "react";

// Let the browser stop decorative loops outside the viewport without changing their timing when seen.
export function ViewportAnimations() {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(".home .ar, .home .pb-track"));
    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) => element.dataset.motionVisible = "true");
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        (target as HTMLElement).dataset.motionVisible = String(isIntersecting);
      });
    }, { rootMargin: "120px 0px" });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return null;
}
