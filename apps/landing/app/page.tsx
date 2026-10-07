import { SiteNav } from "./_components/SiteNav";
import { LoadoutHero } from "./_components/LoadoutHero";
import HomepageSections from "./_components/HomepageSections";
import { SiteFooter } from "./_components/SiteFooter";
import { PaperScenery } from "./_components/PaperScenery";
import { DocsTab } from "./_components/DocsTab";

export default function Home() {
  return <div className="site-shell" id="top">
    <a className="skip-link" href="#main">Skip to content</a>
    <PaperScenery />
    <SiteNav /><DocsTab />
    <main id="main"><LoadoutHero /><HomepageSections /></main>
    <SiteFooter />
  </div>;
}
