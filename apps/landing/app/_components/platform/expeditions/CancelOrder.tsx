"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ConfirmDialog } from "@/app/_components/platform/ConfirmDialog";
import type { FormState } from "@/lib/platform/actions";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

// "Cancel order" as a text link that opens a confirmation. Shown only while the order is placed and ordering is on. The server
// checks both again and refunds the stored total.
export function CancelOrder({ number, action }: Readonly<{ number: string; action: Action }>) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const trigger = useRef<HTMLButtonElement>(null);
  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };
  return (
    <>
      <button ref={trigger} type="button" className="ol-act" onClick={() => setOpen(true)}>
        Cancel order
      </button>
      <ConfirmDialog
        open={open}
        onClose={close}
        onDone={() => {
          setOpen(false);
          router.refresh();
        }}
        title="Cancel this order?"
        body={<p>Order {number} goes back on the shelf and the Ore you paid returns to your balance. You can order it again later if it is still in stock.</p>}
        confirmLabel="Cancel order"
        action={action}
        fields={{ number }}
      />
    </>
  );
}
