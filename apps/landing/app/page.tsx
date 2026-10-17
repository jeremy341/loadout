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
import { LevelsAndRewards } from "./_components/home/LevelsAndRewards";
import { PlannedPrizes } from "./_components/home/PlannedPrizes";
import { CustomOrders } from "./_components/home/CustomOrders";
import { Eras } from "./_components/home/Eras";
import { LoadoutIrl } from "./_components/home/LoadoutIrl";
import { Faq } from "./_components/home/Faq";
import { HackClub } from "./_components/home/HackClub";
import { SiteFooter } from "./_components/home/SiteFooter";
import { Mole } from "./_components/mole/Mole";

export default function Home() {
  return (
    <div className="home" id="top">
      <a className="skip-link" href="#main">Skip to content</a>
      <ScrambleHeadings selector=".home .h1" duration={1800} />
      <DepthGlow />
      <div style={{ display: "contents" }} aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICON_SPRITE }} />
      <NoiseGrain />
      <div className="depth-dark" aria-hidden="true" />
      <div className="in">
        <SiteNav />
        <main id="main">
          <ThemeSwitch />
          <Hero />
          <Reveal stagger><Tracks /></Reveal>
          <Reveal><HowItWorks /></Reveal>
          <Reveal stagger><PlannedPrizes /></Reveal>
          <Reveal><LevelsAndRewards /></Reveal>
          <Reveal stagger><CustomOrders /></Reveal>
          <Reveal stagger><Eras /></Reveal>
          {siteConfig.showIrlConcept && <Reveal><LoadoutIrl /></Reveal>}
          <Reveal><Faq /></Reveal>
          <HackClub />
        </main>
      </div>
      <SiteFooter />
      <DocsTab />
      <Mole />
    </div>
  );
}
