"use client";

import { useEffect, useRef, useState } from "react";

// Stasis's Share button: copies the address of the page and says "Copied!" for two seconds. The change is also announced.
export function ProfileShare() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      return;
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button type="button" className="pf-btn pf-sp-btn" onClick={share}>
        {copied ? "Copied!" : "Share"}
      </button>
      <span className="pf-sr" role="status">
        {copied ? "Link copied" : ""}
      </span>
    </>
  );
}
