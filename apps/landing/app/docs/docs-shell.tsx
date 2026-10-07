"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { docsGroups } from "./docs-data";

export function DocsShell({ children }: { children: React.ReactNode }) {
  const active = usePathname().split("/").filter(Boolean).pop() ?? "start";
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeRoute = active;
  function navigate() { setMobileOpen(false); }

  useEffect(() => {
    const main = document.getElementById("docs-main");
    if (!main) return;
    main.scrollTop = 0;
    function scrollGuide(event: KeyboardEvent) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const interactive = target.closest("a,button,input,textarea,select,summary");
      let amount = 0;
      if (event.key === "PageDown") amount = Math.max(120, main!.clientHeight * 0.85);
      else if (event.key === "PageUp") amount = -Math.max(120, main!.clientHeight * 0.85);
      else if (target === main && event.key === "ArrowDown") amount = 48;
      else if (target === main && event.key === "ArrowUp") amount = -48;
      else if (target === main && event.key === "Home") amount = -main!.scrollTop;
      else if (target === main && event.key === "End") amount = main!.scrollHeight;
      else if (event.key === " " && !event.shiftKey && !interactive) amount = Math.max(120, main!.clientHeight * 0.85);
      else if (event.key === " " && event.shiftKey && !interactive) amount = -Math.max(120, main!.clientHeight * 0.85);
      if (amount === 0) return;
      event.preventDefault();
      main!.scrollBy({ top: amount, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }
    main.addEventListener("keydown", scrollGuide);
    return () => main.removeEventListener("keydown", scrollGuide);
  }, [active]);

  return <div className="docs">
    <a className="docs-skip" href="#docs-main">Skip to documentation</a>
    <aside className="docs-nav" data-lenis-prevent>
      <div className="docs-nav-head"><Link className="docs-brand" href="/">LOADOUT <span>DOCS</span></Link><p>Build, ship, and understand LOADOUT</p></div>
      <Link className="docs-back-button" href="/">← BACK TO LOADOUT</Link>
      <button className="docs-mobile-toggle" type="button" aria-expanded={mobileOpen} aria-controls="docs-navigation" onClick={() => setMobileOpen(!mobileOpen)}>Browse topics <span aria-hidden="true">{mobileOpen ? "−" : "+"}</span></button>
      <nav className="docs-navigation" id="docs-navigation" data-open={mobileOpen} aria-label="Documentation sections">
        {docsGroups.map((group) => <details className="docs-group" open key={group.label}>
          <summary><span>{group.label}</span><span className="docs-group-count">{group.items.length}</span></summary>
          <div className="docs-group-items">{group.items.map((item) => <Link className={"section-link" + (activeRoute === item.slug ? " active" : "")} href={"/docs/" + item.slug} aria-current={activeRoute === item.slug ? "page" : undefined} key={item.slug} onClick={navigate}>{item.label}</Link>)}</div>
        </details>)}
        <p className="docs-nav-note">LOADOUT is in development. Launch details and available prizes will be confirmed before launch.</p>
      </nav>
      <noscript><style>{".docs .docs-navigation{display:block!important}.docs .docs-mobile-toggle{display:none!important}"}</style></noscript>
    </aside>
    {children}
  </div>;
}
