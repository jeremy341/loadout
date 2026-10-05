"use client";

import { useEffect, useRef, useState } from "react";
import { LoadoutIcon } from "./icons/LoadoutIcon";
import { siteConfig } from "../site-config";

const links = [["About", "#about"], ["Tracks", "#tracks"], ["Progression", "#progression"], ["FAQ", "#faq"], ["Community", "#community"]];

export function SiteNav() {
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
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
    let last = window.scrollY;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y > 120 && y > last + 4) setHidden(true);
        else if (y < last - 4 || y <= 120) setHidden(false);
        last = y;
        frame = 0;
      });
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && document.getElementById("mobile-navigation")) {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("keydown", onKey); cancelAnimationFrame(frame); };
  }, []);
  return <header className={`nav-wrap ${hidden && !open && !focused ? "nav-hidden" : ""}`}
    onFocusCapture={() => setFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
    <nav className="site-nav" aria-label="Main navigation">
      <a href="#top" className="brand" aria-label="LOADOUT home" onClick={() => setOpen(false)}><LoadoutIcon name="brand" /><span>LOADOUT</span></a>
      <div className="desktop-nav">{links.map(([label, href]) => <a href={href} key={href}>{label}</a>)}</div>
      <div className="nav-actions"><span className="language"><LoadoutIcon name="globe" /> EN</span>
        {siteConfig.loginUrl && <a className="button button-small button-outline" href={siteConfig.loginUrl}>Login</a>}
        <a className="button button-small" href={siteConfig.joinUrl ?? "#tracks"}>{siteConfig.joinUrl ? "RSVP now" : "Explore tracks"}</a>
      </div>
      <button ref={toggle} className="mobile-menu-button" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls={open ? "mobile-navigation" : undefined} onClick={() => setOpen(!open)}><span /><span /><span /></button>
    </nav>
    {open && <nav className="mobile-nav" id="mobile-navigation" aria-label="Mobile navigation">{links.map(([label, href]) => <a href={href} key={href} onClick={() => selectDestination(href)}>{label}<LoadoutIcon name="arrow" /></a>)}
      {siteConfig.loginUrl && <a href={siteConfig.loginUrl}>Login</a>}
      <a href={siteConfig.joinUrl ?? "#tracks"} onClick={() => siteConfig.joinUrl ? setOpen(false) : selectDestination("#tracks")}>{siteConfig.joinUrl ? "RSVP now" : "Explore tracks"}</a>
    </nav>}
  </header>;
}
