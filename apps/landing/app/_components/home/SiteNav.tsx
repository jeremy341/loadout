"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { siteConfig } from "../../site-config";
import { RSVP_ENABLED, RSVP_URL } from "./rsvp-url";
import { Logo } from "./Logo";

// The bar carries the four in-page sections, as main does. DOCS is reached from the mobile
// menu and the floating docs tab, so it is not a bar link.
const sections = [
  ["TRACKS", "#tracks"],
  ["HOW IT WORKS", "#process"],
  ["PROGRESS & PRIZES", "#progression"],
  ["FAQ", "#faq"],
] as const;
const sheetLinks = [...sections, ["DOCS", "/docs"]] as const;

// Docs live on their own route; in-page anchors stay plain links.
function NavLink({ href, onClick, children }: { href: string; onClick?: () => void; children: React.ReactNode }) {
  return href.startsWith("/")
    ? <Link href={href} onClick={onClick}>{children}</Link>
    : <a href={href} onClick={onClick}>{children}</a>;
}

// Behaviour carried over from the pre-redesign nav: the bar hides while scrolling down
// past the first screen, returns on scroll up, and stays visible while the mobile menu
// or keyboard focus is inside it. Escape closes the menu and returns focus to its button.
// Off the homepage (the 404 page) `anchorBase="/"` turns the in-page anchors into links back to the homepage.
export function SiteNav({ anchorBase = "" }: { anchorBase?: string }) {
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
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKey);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      className={`nav${hidden && !open && !focused ? " nav-hidden" : ""}`}
      aria-label="Main navigation"
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
    >
      <a className="logo" href={`${anchorBase}#top`} aria-label="LOADOUT home" onClick={() => setOpen(false)}>
        <Logo />
      </a>
      <div className="nav-links">
        {sections.map(([label, href]) => (
          <NavLink key={href} href={anchorBase + href}>{label}</NavLink>
        ))}
      </div>
      <div className="nav-actions">
        <span className="lang" aria-hidden="true">◍ EN</span>
        <label className="tg" htmlFor="theme">
          <span className="pxw mo"><i className="b" /></span>
          <span className="pxw su"><i className="a" /></span>
        </label>
        {siteConfig.loginUrl && <a href={siteConfig.loginUrl}>LOGIN</a>}
        <a className="btn pri" href={RSVP_URL}>{RSVP_ENABLED ? "RSVP NOW" : "EXPLORE TRACKS"}</a>
      </div>
      <button
        ref={toggle}
        type="button"
        className="nav-toggle"
        aria-label={open ? "Close navigation" : "Open navigation"}
        aria-expanded={open}
        aria-controls={open ? "mobile-navigation" : undefined}
        onClick={() => setOpen(!open)}
      >
        <span /><span /><span />
      </button>
      {open && (
        <nav className="nav-sheet" id="mobile-navigation" aria-label="Mobile navigation">
          {sheetLinks.map(([label, href]) => (
            <NavLink key={href} href={href.startsWith("#") ? anchorBase + href : href} onClick={() => { if (!anchorBase && href.startsWith("#")) selectDestination(href); else setOpen(false); }}>
              {label}<span aria-hidden="true">→</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
