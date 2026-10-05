"use client";

import { AnimatePresence, motion, useReducedMotion, type Transition } from "framer-motion";
import Image from "next/image";
import { useState, type CSSProperties } from "react";
import { faqItems, projectFitItems, researchCopy, tracks } from "../site-content";
import { LoadoutIcon } from "./icons/LoadoutIcon";
import Reveal from "./Reveal";
import { DigitalPhysicalLoadout } from "./DigitalPhysicalLoadout";
import { SectionHeading } from "./SectionHeading";
import { HowItWorks } from "./HowItWorks";
import { ProgressionSection } from "./ProgressionSection";
import { ErasSection } from "./ErasSection";

export default function HomepageSections() {
  const reduceMotion = useReducedMotion();
  const transition: Transition = reduceMotion ? { duration: 0 } : { duration: 0.35, ease: [0.22, 1, 0.36, 1] };

  return (
    <>
      <Reveal>
        <section className="site-section about-section" id="about" aria-labelledby="about-title">
          <SectionHeading eyebrow="About" title="What is LOADOUT?" headingId="about-title">
            LOADOUT is a technical builder program in development. Build tools, systems, or devices that help people build, run, or understand technology, and document your work. Accepted projects become part of your Digital Loadout and can earn Bolts for equipment.
          </SectionHeading>
          <DigitalPhysicalLoadout />
        </section>
      </Reveal>

      <Reveal stagger>
        <section className="site-section tracks-section" id="tracks" aria-labelledby="tracks-title">
          <SectionHeading eyebrow="Tracks" title="Build across four tracks" headingId="tracks-title">
            Choose the fields your project uses; one project can use more than one. Reviewers assign Track XP to each field based on the work they see.
          </SectionHeading>
          <div className="track-grid">
            {tracks.map((track, index) => (
              <article className="track-card reveal-item" style={{ "--reveal-index": index } as CSSProperties} key={track.name}>
                <div className="track-top"><span className="track-id">0{index + 1}</span><span className="track-icon" aria-hidden="true"><LoadoutIcon name={track.icon} /></span></div>
                <h3>{track.name}</h3>
                <p className="track-topics">{track.topics}</p>
                <a className="track-arrow" href="#project-fit" aria-label={`Explore project fit for ${track.name}`}><LoadoutIcon name="arrow" /></a>
              </article>
            ))}
          </div>
          <div className="research-strip" id="research" aria-labelledby="research-title">
            <span className="research-icon" aria-hidden="true"><LoadoutIcon name="flask" /></span>
            <div className="research-copy"><h3 id="research-title">{researchCopy.title}</h3><small>{researchCopy.description}</small></div>
            <a className="track-arrow" href="#process" aria-label="See how to ship a research project"><LoadoutIcon name="arrow" /></a>
          </div>
          <section className="project-fit-subsection" id="project-fit" aria-labelledby="fit-title">
            <div className="subsection-heading">
              <span className="section-eyebrow">Project fit</span>
              <h3 id="fit-title">What kinds of projects may fit?</h3>
              <p>Reviewers first check whether your technical work belongs in LOADOUT. A project’s label alone doesn’t decide whether it qualifies, and these examples don’t guarantee approval.</p>
            </div>
            <div className="fit-grid">
              {projectFitItems.map((item) => (
                <article className={`fit-card fit-card-${item.status}`} key={item.title}>
                  <span className="fit-status" aria-hidden="true"><LoadoutIcon name={item.status === "higher" ? "check" : "cross"} /></span>
                  <div className="fit-copy"><h4>{item.title}</h4><p>{item.description}</p></div>
                  <span className="fit-label">{item.status === "higher" ? "Higher fit" : "Lower fit"}</span>
                </article>
              ))}
            </div>
            <p className="capability-note">If a project fits, it is then reviewed across Originality, Technical Depth, Execution, and Documentation.</p>
          </section>
        </section>
      </Reveal>

      <HowItWorks />
      <Reveal><ProgressionSection /></Reveal>
      <Reveal><ErasSection /></Reveal>

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
          <Image className="faq-chevron" src="/loadout/icons/faq-chevron.svg" alt="" aria-hidden="true" width={32} height={32} unoptimized /><span>{question}</span>
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
