"use client";

import { useEffect, useState } from "react";

// "On this page" list that marks the section being read. The article scrolls inside #docs-main,
// so an IntersectionObserver rooted on that pane tells which heading is at the top.
export function DocToc({ items }: { items: { id: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const root = document.getElementById("docs-main");
    if (!root || items.length === 0) return;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible) setActive(visible.target.id);
    }, { root, rootMargin: "0px 0px -70% 0px" });
    for (const item of items) {
      const section = document.getElementById(item.id);
      if (section) observer.observe(section);
    }
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;
  return (
    <nav aria-label="On this page">
      <p>On this page</p>
      {items.map((item) => (
        <a href={"#" + item.id} key={item.id} aria-current={item.id === active ? "true" : undefined}>{item.label}</a>
      ))}
    </nav>
  );
}
