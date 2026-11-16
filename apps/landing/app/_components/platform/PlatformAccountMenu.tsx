"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import "./profile.css";

// The two controls in the top bar close each other, so the phone Menu and this panel are never open together.
export const CLOSE_ACCOUNT_EVENT = "loadout:close-account";
export const CLOSE_MENU_EVENT = "loadout:close-menu";

const LINKS = [
  { href: "/dashboard/profile", label: "Profile" },
  { href: "/dashboard/settings", label: "Settings" },
] as const;

// The account control: the square user icon opens a small panel with Profile and Settings. A disclosure, not an ARIA menu:
// the links are ordinary links in Tab order. Escape closes it and returns focus to the button; so do a press outside and
// Tab leaving the control; following a link closes it.
export function PlatformAccountMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const onAccountPage = LINKS.some((link) => pathname === link.href);

  useEffect(() => {
    const closeFromMenu = () => setOpen(false);
    window.addEventListener(CLOSE_ACCOUNT_EVENT, closeFromMenu);
    return () => window.removeEventListener(CLOSE_ACCOUNT_EVENT, closeFromMenu);
  }, []);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  const toggle = () => {
    if (!open) window.dispatchEvent(new Event(CLOSE_MENU_EVENT));
    setOpen(!open);
  };

  return (
    <div
      className="pf-account"
      ref={root}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.stopPropagation();
          setOpen(false);
          button.current?.focus();
        }
      }}
      onBlur={(event) => {
        if (open && !root.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={button}
        type="button"
        className="pf-profile-slot pf-account-button"
        data-current={onAccountPage ? "true" : undefined}
        aria-label="Account"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggle}
      >
        <svg viewBox="0 0 16 16" width="24" height="24" aria-hidden="true" focusable="false" shapeRendering="crispEdges">
          <rect x="5" y="2" width="6" height="6" />
          <rect x="3" y="9" width="10" height="5" />
        </svg>
      </button>
      <nav className="pf-account-menu" id={panelId} aria-label="Account" hidden={!open}>
        <ul>
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} aria-current={pathname === link.href ? "page" : undefined} onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
