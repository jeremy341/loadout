import { SectionHeading } from "./SectionHeading";

const itinerary = [
  { day: "Friday", title: "Start", detail: "Arrive, meet builders, choose a project, and get started." },
  { day: "Saturday", title: "Build", detail: "Spend the main build time with mentors, workshops, and proper rest." },
  { day: "Sunday", title: "Ship", detail: "Document, demonstrate, and submit work for normal review." },
];

export function IrlConceptSection() {
  return (
    <section className="site-section irl-concept-section" id="loadout-irl" aria-labelledby="irl-title">
      <SectionHeading eyebrow="Future concept" title="LOADOUT IRL // RUHR" headingId="irl-title">
        Build the next Era.
      </SectionHeading>
      <div className="irl-concept-plate">
        <div className="irl-story">
          <p>We’re exploring a build weekend from Friday to Sunday in Germany’s Ruhr region. Bring a technical idea, meet other builders, and spend the weekend building, documenting, and sharing your work.</p>
          <p>Projects would use the same four tracks and normal review as online LOADOUT. Approved event work would contribute to the same global Community Era. Attending would be optional; you can keep progressing online without coming to the weekend.</p>
          <p className="irl-status"><strong>Future concept.</strong> Dates, a venue, funding, and registration are not confirmed.</p>
        </div>
        <div className="irl-itinerary">
          <h3>Proposed weekend format</h3>
          <ol>
            {itinerary.map((item) => (
              <li key={item.day}>
                <span className="irl-day">{item.day}</span>
                <div><h4>{item.title}</h4><p>{item.detail}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
