"use client";

import { AnimatePresence, motion, useReducedMotion, type Transition } from "framer-motion";
import { useState, type CSSProperties, type ReactNode } from "react";
import {
  faqItems,
  fieldCategories,
  overviewItems,
  processSteps,
  progressionMilestones,
  projectFitItems,
  requisitionMilestones,
  rewards,
  researchCopy,
  shopCategories,
  tracks,
} from "../site-content";
import { LoadoutIcon } from "./icons/LoadoutIcon";
import Reveal from "./Reveal";
import { DigitalPhysicalLoadout } from "./DigitalPhysicalLoadout";

function SectionHeading({ eyebrow, title, children, headingId }: { eyebrow: string; title: string; children: ReactNode; headingId?: string }) {
  return (
    <div className="section-heading">
      <span className="section-eyebrow">{eyebrow}</span>
      <h2 id={headingId}>{title}</h2>
      <p>{children}</p>
    </div>
  );
}

export default function HomepageSections() {
  const reduceMotion = useReducedMotion();
  const transition: Transition = reduceMotion ? { duration: 0 } : { duration: 0.35, ease: [0.22, 1, 0.36, 1] };

  return (
    <>
      <Reveal stagger>
        <section className="site-section about-section" id="about" aria-labelledby="about-title">
          <SectionHeading eyebrow="About" title="What is LOADOUT?" headingId="about-title">
            A technical builder program in the making. Choose a track, build something real, and grow your skills and your loadout.
          </SectionHeading>
          <div className="overview-grid">
            {overviewItems.map((item, index) => (
              <article className="overview-card reveal-item" style={{ "--reveal-index": index } as CSSProperties} key={item.index}>
                <span className="card-icon" aria-hidden="true"><LoadoutIcon name={item.icon} /></span>
                <span className="card-index">{item.index}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <span className="slashes" aria-hidden="true" />
              </article>
            ))}
          </div>
        </section>
      </Reveal>

      <DigitalPhysicalLoadout />

      <Reveal stagger>
        <section className="site-section process-section" id="process" aria-labelledby="process-title">
          <SectionHeading eyebrow="Process" title="How it works" headingId="process-title">
            From a capability gap to a working project. Here’s the planned LOADOUT loop.
          </SectionHeading>
          <ol className="process-grid">
            {processSteps.map((step, index) => (
              <li className="process-card reveal-item" style={{ "--reveal-index": index } as CSSProperties} key={step.title}>
                <span className="step-number">{String(index + 1).padStart(2, "0")}</span>
                <span className="step-icon" aria-hidden="true"><LoadoutIcon name={step.icon} /></span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
                <span className="slashes" aria-hidden="true" />
              </li>
            ))}
          </ol>
        </section>
      </Reveal>

      <Reveal>
        <section className="site-section project-fit-section" id="project-fit" aria-labelledby="fit-title">
          <SectionHeading eyebrow="Examples" title="What counts as a LOADOUT project?" headingId="fit-title">
            We look for original work with technical depth, solid execution, and clear documentation.
          </SectionHeading>
          <div className="fit-grid">
            {projectFitItems.map((item) => (
              <article className={`fit-card fit-card-${item.status}`} key={item.title}>
                <span className="fit-status" aria-hidden="true"><LoadoutIcon name={item.status === "higher" ? "check" : "cross"} /></span>
                <div className="fit-copy"><h3>{item.title}</h3><p>{item.description}</p></div>
                <span className="fit-label">{item.status === "higher" ? "Higher fit" : "Lower fit"}</span>
              </article>
            ))}
          </div>
          <p className="capability-note"><strong>Capability examples:</strong> renderer or netcode work; inference runtimes or GPU backends; local-first sync. These are project types, not claimed participant submissions.</p>
        </section>
      </Reveal>

      <Reveal stagger>
        <section className="site-section tracks-section" id="tracks" aria-labelledby="tracks-title">
          <SectionHeading eyebrow="Tracks" title="Build across four tracks" headingId="tracks-title">
            Choose a technical field to focus your work. Each track records its own progress.
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
          <div className="research-strip" id="research">
            <span className="research-icon" aria-hidden="true"><LoadoutIcon name="flask" /></span>
            <span><strong>{researchCopy.title}</strong><small>{researchCopy.description}</small></span>
            <a className="track-arrow" href="#faq" aria-label="Learn about Research Mode"><LoadoutIcon name="arrow" /></a>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="site-section progression-section" id="progression" aria-labelledby="progression-title">
          <SectionHeading eyebrow="Progression" title="Level up your skills" headingId="progression-title">
            Track XP records progress in a field. Bolts are global currency for the reward shop.
          </SectionHeading>
          <ol className="progression-grid" aria-label="Lifetime level milestones">
            {progressionMilestones.map((level) => (
              <li className="level-step" key={level}>
                <span className="level-badge" aria-hidden="true"><LoadoutIcon name="star" /></span>
                <span className="level-number">{level}</span>
                <span className="level-caption">{["Start building", "Keep exploring", "Build depth", "Track mastery"][progressionMilestones.indexOf(level)]}</span>
              </li>
            ))}
          </ol>
          <p className="progression-note">15 lifetime levels in every track. Shipped projects form your Digital Loadout; useful equipment grows your Physical Loadout.</p>
          <div className="field-pricing" id="field-pricing">
            <SectionHeading eyebrow="Field pricing" title="Get access to field pricing" headingId="field-pricing-title">
              Build depth in a track to unlock better eligible field pricing. Most equipment stays available across tracks.
            </SectionHeading>
            <div className="field-grid">
              {fieldCategories.map((field) => (
                <article className="field-card" key={field.title}>
                  <span className="card-icon" aria-hidden="true"><LoadoutIcon name={field.icon} /></span>
                  <h3>{field.title}</h3>
                  <p>{field.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="site-section custom-orders-section" id="custom-orders" aria-labelledby="orders-title">
          <SectionHeading eyebrow="Specialist gear" title="Custom orders & requisitions" headingId="orders-title">Rare requisitions and custom requests are planned paths to specialist equipment beyond the regular shop.</SectionHeading>
          <div className="order-panel">
            <span className="order-icon" aria-hidden="true"><LoadoutIcon name="box" /></span>
            <div><h3>Need something specific?</h3><p>Build a strong project history. Custom Orders can support technical gear outside the catalogue; one-use Requisitions give specialists another way to upgrade.</p></div>
            <a className="button" href="#faq">Explore the details <LoadoutIcon name="arrow" /></a>
          </div>
          <div className="requisition-details">
            <p><strong>Requisition milestones</strong></p>
            <ul className="requisition-milestones" aria-label="Requisition milestone levels">
              {requisitionMilestones.map((level) => <li key={level}>{level}</li>)}
            </ul>
            <p>Requisitions are one-use and never expire. Only one can apply to an order, and it cannot bypass Mastery level requirements. Custom Orders depend on project fit, budget, region, and fulfillment.</p>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="site-section rewards-section" id="rewards" aria-labelledby="rewards-title">
          <SectionHeading eyebrow="Rewards" title="From work to rewards" headingId="rewards-title">
            Shipped work is reviewed against quality criteria. Bolts are the global currency for rewards.
          </SectionHeading>
          <ol className="reward-table">
            {rewards.map((reward) => (
              <li className="reward-row" key={reward.stage}>
                <span className="reward-stage">{reward.stage}</span>
                <span className="reward-symbol" aria-hidden="true"><LoadoutIcon name="bolt" /></span>
                <strong className="reward-token">{reward.token}</strong>
                <p className="reward-explainer">{reward.explainer}</p>
              </li>
            ))}
          </ol>
        </section>
      </Reveal>

      <Reveal>
        <section className="site-section shop-section" id="shop" aria-labelledby="shop-title">
          <SectionHeading eyebrow="Shop" title="Rewards & shop" headingId="shop-title">
            Upgrade your Physical Loadout for the next harder project. Explore the planned reward categories.
          </SectionHeading>
          <div className="shop-grid">
            {shopCategories.map((category) => (
              <article className="shop-card" key={category.title}>
                <span className="shop-icon" aria-hidden="true"><LoadoutIcon name={category.icon} /></span>
                <h3>{category.title}</h3>
                <span className="shop-status">Planned category</span>
              </article>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="site-section faq-section" id="faq" aria-labelledby="faq-title">
          <SectionHeading eyebrow="FAQ" title="Quick answers" headingId="faq-title">A little more about building, tracks, review, and rewards.</SectionHeading>
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
          <svg className="faq-chevron" viewBox="0 0 12 16" aria-hidden="true"><path d="m3 3 5 5-5 5" /></svg><span>{question}</span>
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
