"use client";

import { AnimatePresence, motion, useReducedMotion, type Transition } from "framer-motion";
import { useState, type CSSProperties } from "react";
import { faqItems, projectFitItems, researchCopy, tracks } from "../site-content";
import { LoadoutIcon } from "./icons/LoadoutIcon";
import Reveal from "./Reveal";
import { SectionHeading } from "./SectionHeading";
import { HowItWorks } from "./HowItWorks";
import { ProgressionSection } from "./ProgressionSection";
import { ErasSection } from "./ErasSection";
import { IrlConceptSection } from "./IrlConceptSection";
import { siteConfig } from "../site-config";

export default function HomepageSections() {
  const reduceMotion = useReducedMotion();
  const transition: Transition = reduceMotion ? { duration: 0 } : { duration: 0.35, ease: [0.22, 1, 0.36, 1] };

  return (
    <>
      <Reveal stagger>
        <section className="site-section tracks-section" id="tracks" aria-labelledby="tracks-title">
          <SectionHeading eyebrow="Tracks" title="Build across four tracks" headingId="tracks-title">
            Choose the fields your project uses; one project can use more than one. Reviewers assign Track XP to each field based on the work they see.
          </SectionHeading>
          <div className="track-grid">
            {tracks.map((track, index) => (
              <article className="track-card reveal-item" style={{ "--reveal-index": index } as CSSProperties} key={track.name}>
                <div className="track-top"><span className="track-id">0{index + 1}</span><span className="track-meta">FIELD // ACTIVE</span><span className="track-icon" aria-hidden="true"><LoadoutIcon name={track.icon} /></span></div>
                <h3>{track.name}</h3>
                <p className="track-topics">{track.topics}</p>
                <span className="track-footer">TRACK XP // EARNED ON SHIP</span>
              </article>
            ))}
          </div>
          <div className="research-strip" id="research" aria-labelledby="research-title">
            <span className="research-icon" aria-hidden="true"><LoadoutIcon name="flask" /></span>
            <div className="research-copy"><h3 id="research-title">{researchCopy.title}</h3><small>{researchCopy.description}</small></div>
            <span className="research-status">BONUS TRACK XP // REPORT REQUIRED</span>
          </div>
        </section>
      </Reveal>

      <HowItWorks />
      <Reveal>
        <section className="site-section project-fit-subsection" id="project-fit" aria-labelledby="fit-title">
          <div className="subsection-heading">
            <span className="section-eyebrow">Project fit check</span>
            <h3 id="fit-title">Technical work matters more than the label.</h3>
            <p>Reviewers look at what you built, not just what you call it.</p>
          </div>
          <div className="fit-ledger">
            {projectFitItems.map((item) => (
              <article className={`fit-ledger-row fit-ledger-${item.status}`} key={item.title}>
                <span className="fit-status" aria-hidden="true"><LoadoutIcon name={item.status === "higher" ? "check" : "cross"} /></span>
                <div className="fit-copy"><span className="fit-row-signal">{item.status === "higher" ? "TECHNICAL SIGNAL // STRONGER" : "TECHNICAL SIGNAL // WEAKER"}</span><h4>{item.title}</h4><p>{item.description}</p></div>
                <span className="fit-label">{item.status === "higher" ? "Higher signal" : "Lower signal"}</span>
              </article>
            ))}
          </div>
          <p className="capability-note">If it fits, reviewers assess Originality, Technical Depth, Execution, and Documentation.</p>
        </section>
      </Reveal>
      <Reveal><ProgressionSection /></Reveal>
      <Reveal><ErasSection /></Reveal>
      {siteConfig.showIrlConcept && <Reveal><IrlConceptSection /></Reveal>}

      <Reveal>
        <section className="site-section faq-section" id="faq" aria-labelledby="faq-title">
          <SectionHeading eyebrow="FAQ" title="Quick answers" headingId="faq-title">Answers about projects, progress, equipment, and what is available today.</SectionHeading>
          <div className="faq-list">
            {faqItems.map((item, index) => {
              const answerId = `faq-answer-${index + 1}`;
              return (
                <FaqItem key={item.question} answerId={answerId} question={item.question} answer={item.answer} transition={transition} />
              );
            })}
          </div>
          <noscript>
            <div className="faq-noscript">
              <p>FAQ answers are also available here when scripts are disabled.</p>
              <dl>{faqItems.map((item) => <div key={item.question}><dt>{item.question}</dt><dd>{item.answer}</dd></div>)}</dl>
            </div>
          </noscript>
        </section>
      </Reveal>
    </>
  );
}

function FaqItem({ question, answer, answerId, transition }: { question: string; answer: string; answerId: string; transition: Transition }) {
  const [open, setOpen] = useState(false);
  const panelId = `${answerId}-panel`;

  return (
    <article className="faq-item">
      <h3 id={answerId}>
        <button className="faq-question" type="button" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((value) => !value)}>
          <LoadoutIcon name="faq-chevron" className="faq-chevron" /><span>{question}</span>
        </button>
      </h3>
      <motion.div id={panelId} className="faq-answer" role="region" aria-labelledby={answerId} aria-hidden={!open} inert={!open} initial={false} animate={open ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }} transition={transition}>
        <AnimatePresence initial={false}>
          {open && <motion.p initial={transition.duration ? { opacity: 0, y: 4 } : false} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 0 }} transition={transition}>{answer}</motion.p>}
        </AnimatePresence>
      </motion.div>
    </article>
  );
}
