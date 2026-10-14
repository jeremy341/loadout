import { siteConfig } from "./site-config";
import { ThemeSwitch } from "./_components/ThemeSwitch";
import { NoiseGrain } from "./_components/NoiseGrain";
import { DocsTab } from "./_components/home/DocsTab";
import { ICON_SPRITE } from "./_components/home/art";
import { ScrambleHeadings } from "./_components/home/ScrambleHeadings";
import { DepthGlow } from "./_components/home/DepthGlow";
import { SiteNav } from "./_components/home/SiteNav";
import { Hero } from "./_components/home/Hero";
import Reveal from "./_components/home/Reveal";
import { Tracks } from "./_components/home/Tracks";
import { HowItWorks } from "./_components/home/HowItWorks";
import { ProjectFit } from "./_components/home/ProjectFit";
import { Progression } from "./_components/home/Progression";
import { Rewards } from "./_components/home/Rewards";
import { PlannedPrizes } from "./_components/home/PlannedPrizes";
import { CustomOrders } from "./_components/home/CustomOrders";
import { Eras } from "./_components/home/Eras";
import { LoadoutIrl } from "./_components/home/LoadoutIrl";
import { Faq } from "./_components/home/Faq";
import { BehindLoadout } from "./_components/home/BehindLoadout";
import { SiteFooter } from "./_components/home/SiteFooter";

export default function Home() {
  return (
    <div className="home" id="top">
      <a className="skip-link" href="#main">Skip to content</a>
      <ThemeSwitch />
      <ScrambleHeadings selector=".home .h1" duration={1800} />
      <DepthGlow />
      <div style={{ display: "contents" }} aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICON_SPRITE }} />
      <NoiseGrain />
      <div className="depth-dark" aria-hidden="true" />
      <div className="in">
        <SiteNav />
        <main id="main">
          <Hero />
          <Reveal stagger><Tracks /></Reveal>
          <Reveal><HowItWorks /></Reveal>
          <Reveal><ProjectFit /></Reveal>
          <Reveal><Progression /></Reveal>
          <Reveal stagger><Rewards /></Reveal>
          <Reveal stagger><PlannedPrizes /></Reveal>
          <Reveal stagger><CustomOrders /></Reveal>
          <Reveal stagger><Eras /></Reveal>
          {siteConfig.showIrlConcept && <Reveal><LoadoutIrl /></Reveal>}
          <Reveal><Faq /></Reveal>
          <BehindLoadout />
        </main>
      </div>
      <SiteFooter />
      <DocsTab />
    </div>
  );
}
