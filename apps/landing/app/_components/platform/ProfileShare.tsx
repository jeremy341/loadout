"use client";

import { useEffect, useRef, useState } from "react";

// A button that copies the address of this profile page and says "Link copied!" for two seconds. The change is also announced.
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
      <button type="button" className="pf-btn pf-sp-btn pf-sp-share" onClick={share}>
        {copied ? "Link copied!" : "Copy profile link"}
      </button>
      <span className="pf-sr" role="status">
        {copied ? "Link copied" : ""}
      </span>
    </>
  );
}
