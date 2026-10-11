"use client";

import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import type { DocsHeading } from "./docs-data";

function navigateToHeading(event: MouseEvent<HTMLAnchorElement>, id: string) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  history.pushState(null, "", `#${encodeURIComponent(id)}`);
  const main = document.querySelector<HTMLElement>(".docs-main");
  const target = document.getElementById(id);
  if (!main || !target || !main.contains(target)) return;
  target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
  const top = main.scrollTop + target.getBoundingClientRect().top - main.getBoundingClientRect().top - 20;
  const immediate = event.detail === 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  main.scrollTo({ top, behavior: immediate ? "auto" : "smooth" });
  window.dispatchEvent(new CustomEvent("docs-heading-activate", { detail: id }));
}

export function DocsInlineToc({ headings }: { headings: DocsHeading[] }) {
  if (headings.length === 0) return null;
  return <details className="docs-inline-toc">
    <summary>On this page</summary>
    <nav aria-label="On this page">
      {headings.map((heading) => <a className={heading.depth === 3 ? "subheading" : undefined} href={`#${heading.id}`} key={heading.id} onClick={(event) => navigateToHeading(event, heading.id)}>{heading.text}</a>)}
    </nav>
  </details>;
}

export function DocsToc({ headings }: { headings: DocsHeading[] }) {
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const main = document.querySelector<HTMLElement>(".docs-main");
    if (!main || headings.length === 0) return;
    const elements = headings.map(({ id }) => document.getElementById(id)).filter((node): node is HTMLElement => node instanceof HTMLElement);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const scrollToHash = () => {
      let id: string;
      try { id = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
      if (!id) {
        main.scrollTo({ top: 0, behavior: "auto" });
        setActiveId(elements[0]?.id ?? "");
        return;
      }
      const target = document.getElementById(id);
      if (!target || !main.contains(target)) return;
      main.scrollTo({ top: main.scrollTop + target.getBoundingClientRect().top - main.getBoundingClientRect().top - 20, behavior: reducedMotion.matches ? "auto" : "smooth" });
      setActiveId(id);
    };
    const onHeadingActivate = (event: Event) => {
      const id = (event as CustomEvent<string>).detail;
      if (elements.some((heading) => heading.id === id)) setActiveId(id);
    };
    const updateActive = () => {
      if (main.scrollTop + main.clientHeight >= main.scrollHeight - 4) {
        setActiveId(elements.at(-1)?.id ?? "");
        return;
      }
      const marker = main.getBoundingClientRect().top + 80;
      const current = [...elements].reverse().find((heading) => heading.getBoundingClientRect().top <= marker);
      setActiveId(current?.id ?? elements[0]?.id ?? "");
    };
    const observer = new IntersectionObserver(updateActive, { root: main, rootMargin: "-80px 0px -65% 0px", threshold: [0, 1] });
    elements.forEach((heading) => observer.observe(heading));
    main.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("hashchange", scrollToHash);
    window.addEventListener("popstate", scrollToHash);
    window.addEventListener("docs-heading-activate", onHeadingActivate);
    if (window.location.hash) scrollToHash(); else updateActive();
    return () => {
      observer.disconnect();
      main.removeEventListener("scroll", updateActive);
      window.removeEventListener("hashchange", scrollToHash);
      window.removeEventListener("popstate", scrollToHash);
      window.removeEventListener("docs-heading-activate", onHeadingActivate);
    };
  }, [headings]);

  if (headings.length === 0) return null;
  function followHeading(event: MouseEvent<HTMLAnchorElement>, id: string) {
    navigateToHeading(event, id);
  }

  return <aside className="docs-toc">
    <nav aria-label="On this page">
      <p>ON THIS PAGE</p>
      {headings.map((heading) => <a className={heading.depth === 3 ? "subheading" : undefined} href={`#${heading.id}`} key={heading.id} aria-current={activeId === heading.id ? "location" : undefined} onClick={(event) => followHeading(event, heading.id)}>{heading.text}</a>)}
    </nav>
  </aside>;
}
