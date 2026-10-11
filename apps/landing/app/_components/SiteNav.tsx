"use client";

import { useEffect, useRef, useState } from "react";
import { siteConfig } from "../site-config";
import { ThemeToggle } from "./ThemeToggle";

const links = [["About", "#about"], ["Tracks", "#tracks"], ["Progression", "#progression"], ["FAQ", "#faq"], ["Community", "#behind-loadout"]];

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  function selectDestination(href: string) {
    setOpen(false);
    requestAnimationFrame(() => {
      const section = document.getElementById(href.slice(1));
      const destination = section?.querySelector<HTMLElement>("h2") ?? section;
      destination?.setAttribute("tabindex", "-1");
      destination?.focus({ preventScroll: true });
    });
  }
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && document.getElementById("mobile-navigation")) {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return <header className="nav-wrap">
    <nav className="site-nav" aria-label="Main navigation">
      <a href="#top" className="brand" aria-label="LOADOUT home" onClick={() => setOpen(false)}><span className="nav-brand-mark" aria-hidden="true"><span /></span><span className="nav-wordmark">LOADOUT</span></a>
      <div className="desktop-nav">{links.map(([label, href]) => <a href={href} key={href}>{label}</a>)}</div>
      <div className="nav-actions"><span className="language" aria-label="Language: English"><span aria-hidden="true">◍</span> EN</span>
        <ThemeToggle />
        {siteConfig.loginUrl && <a className="button button-small button-outline" href={siteConfig.loginUrl}>Login</a>}
        <a className="button button-small" href={siteConfig.joinUrl ?? "#tracks"}>{siteConfig.joinUrl ? "RSVP now" : "Explore tracks"}</a>
      </div>
      <button ref={toggle} className="mobile-menu-button" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls={open ? "mobile-navigation" : undefined} onClick={() => setOpen(!open)}><span /><span /><span /></button>
    </nav>
    {open && <nav className="mobile-nav" id="mobile-navigation" aria-label="Mobile navigation">{links.map(([label, href]) => <a href={href} key={href} onClick={() => selectDestination(href)}>{label}<span className="nav-link-chevron" aria-hidden="true" /></a>)}
      {siteConfig.loginUrl && <a href={siteConfig.loginUrl}>Login</a>}
      <a href={siteConfig.joinUrl ?? "#tracks"} onClick={() => siteConfig.joinUrl ? setOpen(false) : selectDestination("#tracks")}>{siteConfig.joinUrl ? "RSVP now" : "Explore tracks"}</a>
    </nav>}
  </header>;
}
