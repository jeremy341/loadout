// One hard cell per step, filled up to `done`. Decoration only: the count is always written next to it.
export function StepMeter({ done, total }: Readonly<{ done: number; total: number }>) {
  return (
    <span className="ex-meter" aria-hidden="true">
      {Array.from({ length: total }, (_, index) => (
        <span className="ex-cell" data-on={index < done ? "true" : "false"} key={index} />
      ))}
    </span>
  );
}
