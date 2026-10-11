"use client";

import { motion, useReducedMotion, type Transition } from "framer-motion";
import { useId, useState } from "react";

// Pre-redesign FAQ behaviour: each answer opens independently, animates its height,
// and exposes aria-expanded on its button. Motion is skipped for reduced-motion users.
export function FaqAccordion({ items }: { items: readonly { question: string; answer: string }[] }) {
  return (
    <div className="fq2-list">
      {items.map((item) => <FaqItem key={item.question} question={item.question} answer={item.answer} />)}
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const panelId = useId();
  const transition: Transition = reduceMotion ? { duration: 0 } : { duration: 0.35, ease: [0.22, 1, 0.36, 1] };
  return (
    <article className="fq2">
      <button type="button" className="fq2-q" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((value) => !value)}>
        <span>{question}</span>
        <span className="fq2-icon" aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      <motion.div
        id={panelId}
        className="fq2-a"
        role="region"
        aria-hidden={!open}
        inert={!open}
        initial={false}
        animate={open ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
        transition={transition}
      >
        <p>{answer}</p>
      </motion.div>
    </article>
  );
}
