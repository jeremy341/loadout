import { SectionHeading } from "./SectionHeading";
import { LoadoutIcon } from "./icons/LoadoutIcon";
import { communityResources, organizers } from "../behind-loadout-content";
import { siteConfig } from "../site-config";

export function BehindLoadoutSection() {
  return (
    <section className="site-section behind-loadout-section" id="behind-loadout" aria-labelledby="behind-loadout-title">
      <SectionHeading eyebrow="The people" title="Who's behind LOADOUT?" headingId="behind-loadout-title">
        The people building the program, the website, and the tools around it.
      </SectionHeading>

      <div className="behind-loadout-layout">
        <div className="organizer-directory">
          <ul className="organizer-list" aria-label="LOADOUT organizers">
            {organizers.map((organizer) => (
              <li className="organizer-row" key={organizer.name}>
                <span className="organizer-icon" aria-hidden="true">
                  <LoadoutIcon name={organizer.icon} />
                </span>
                <div className="organizer-copy">
                  <h3>{organizer.name}</h3>
                  <p className="organizer-role">{organizer.role}</p>
                  <p>{organizer.responsibility}</p>
                </div>
              </li>
            ))}
          </ul>
          <a className="organizer-build-link" href={siteConfig.githubUrl}>
            Follow the build on GitHub
          </a>
        </div>

        <aside className="behind-loadout-context" aria-labelledby="behind-loadout-context-title">
          <span className="behind-loadout-kicker">Community context</span>
          <h3 id="behind-loadout-context-title">What is Hack Club?</h3>
          <p>Hack Club is a nonprofit community of teenagers who learn by making and sharing their own projects.</p>
          <p>Its You Ship, We Ship programs encourage building by offering prizes for projects.</p>
          <p className="behind-loadout-status">LOADOUT is a YSWS proposal in development. Hack Club acceptance hasn&apos;t been confirmed yet.</p>
          <nav className="behind-loadout-links" aria-label="Community resources">
            {communityResources.map((resource) => (
              <a href={resource.href} key={resource.href}>{resource.label}</a>
            ))}
          </nav>
        </aside>
      </div>
    </section>
  );
}
