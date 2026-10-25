
const DAYS = [
  { label: "TAG 01 · FRÜHSCHICHT", title: "Meet & choose", text: "Meet in person and choose a technical project." },
  { label: "TAG 02 · SPÄTSCHICHT", title: "Build together", text: "Build side by side with other builders." },
  { label: "TAG 03 · NACHTSCHICHT", title: "Share your work", text: "Share what you made using LOADOUT’s four tracks." },
] as const;

// Loadout IRL: the three days on a line.
export function LoadoutIrl() {
  return (
    <>
      <div className="pit">
        <b>
          −700 M
        </b>
        <span>
          Wettersohle
          <br />
          LOADOUT IRL
        </span>
      </div>
      <div className="sect" id="loadout-irl">
        <h2 className="h2">
          Loadout IRL
          {" // Düsseldorf"}
        </h2>
        <p className="lead">
          A proposed three-day build weekend in Düsseldorf, Germany, Friday to Sunday.
        </p>
        <ol className="days">
          {DAYS.map((day) => (
            <li key={day.title}>
              <small className="m">{day.label}</small>
              <div className="cn">{day.title}</div>
              <div className="m dsc">{day.text}</div>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
