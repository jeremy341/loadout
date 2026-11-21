"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { unreadCountAction } from "@/app/(platform)/dashboard/(shell)/notifications/actions";
import { ACCOUNT_MENU } from "@/lib/platform/nav";
import "./account-signout.css";
import "./notifications.css";
import "./profile.css";


// The account control at the top right: the square user icon and the handle open, downward, a small panel with Profile, Ledger, Orders, Referrals and Settings. A disclosure, not an ARIA menu:
// the links are ordinary links in Tab order. Escape closes it and returns focus to the button; so do a press outside and
// Tab leaving the control; following a link closes it.
export function PlatformAccountMenu({ handle = null, onNavigate }: Readonly<{ handle?: string | null; onNavigate?: () => void }>) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const onAccountPage = ACCOUNT_MENU.some((link) => pathname === link.href);
  const [unread, setUnread] = useState(0);

  // The unread count is read on the server once per page you land on (no polling). Opening the Notifications page marks nothing by
  // itself, so the number updates on the next page; a failed read leaves the old number.
  useEffect(() => {
    let live = true;
    const read = () => unreadCountAction().then((count) => { if (live) setUnread(count); }, () => {});
    void read();
    // The notifications page says when it changed the count (Mark all read), so the number does not wait for the next page.
    window.addEventListener("pf-unread-changed", read);
    return () => { live = false; window.removeEventListener("pf-unread-changed", read); };
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  const toggle = () => setOpen(!open);

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
        aria-label={handle ? `Account, ${handle}` : "Account"}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggle}
      >
        <svg viewBox="0 0 16 16" width="24" height="24" aria-hidden="true" focusable="false" shapeRendering="crispEdges">
          <rect x="5" y="2" width="6" height="6" />
          <rect x="3" y="9" width="10" height="5" />
        </svg>
        <span className="pf-account-label" aria-hidden="true">{handle ?? "Account"}</span>
      </button>
      <nav className="pf-account-menu" id={panelId} aria-label="Account" hidden={!open}>
        <ul>
          {ACCOUNT_MENU.map((link) => (
            <li key={link.href}>
              <Link href={link.href} aria-current={pathname === link.href ? "page" : undefined} onClick={() => {
                setOpen(false);
                onNavigate?.();
              }}>
                {link.label}
                {link.href === "/dashboard/notifications" && unread > 0 ? (
                  <span className="pf-unread"><span aria-hidden="true">{unread > 99 ? "99+" : unread}</span><span className="pf-sr"> ({unread} unread)</span></span>
                ) : null}
              </Link>
            </li>
          ))}
          <li>
            {/* A plain form post: it works without script, and the route checks the request came from this site. */}
            <form className="pf-signout" method="post" action="/api/auth/signout">
              <button type="submit">Sign out</button>
            </form>
          </li>
        </ul>
      </nav>
    </div>
  );
}
