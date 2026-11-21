"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "@hackclub/icons";

export interface SelectOption {
  value: string;
  label: string;
}

export default function Select({
  name,
  options,
  defaultValue = "",
  className = "",
}: {
  name: string;
  options: SelectOption[];
  defaultValue?: string;
  className?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleClick(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  let selectedLabel = "";
  for (const option of options) {
    if (option.value === value) {
      selectedLabel = option.label;
    }
  }

  return (
    <div ref={wrapperRef} className={`hc-select ${className}`}>
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        className="hc-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span className="truncate">{selectedLabel}</span>
        <Icon glyph="down-caret" size={18} aria-hidden />
      </button>
      {open && (
        <ul className="hc-select-menu" role="listbox">
          {options.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                role="option"
                aria-selected={option.value === value}
                className="hc-select-option"
                onClick={() => {
                  setValue(option.value);
                  setOpen(false);
                }}
              >
                <span className="truncate">{option.label}</span>
                {option.value === value && <Icon glyph="checkmark" size={18} aria-hidden />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
