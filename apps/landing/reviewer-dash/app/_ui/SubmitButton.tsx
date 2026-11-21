"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

// Disabled while its form's action runs, so a double click can't submit twice.
export default function SubmitButton({
  children,
  pendingLabel,
  className = "",
  disabled = false,
  confirm,
  formAction,
  name,
  value,
}: {
  children: ReactNode;
  pendingLabel: string;
  className?: string;
  disabled?: boolean;
  confirm?: string;
  formAction?: (formData: FormData) => void | Promise<void>;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      formAction={formAction}
      name={name}
      value={value}
      disabled={pending || disabled}
      aria-busy={pending}
      className={className}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
