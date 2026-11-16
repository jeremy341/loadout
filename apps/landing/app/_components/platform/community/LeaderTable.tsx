import { depthLabel, type LeaderboardRange, type LeaderRow } from "@/lib/platform/community";

// A ranked list of handles by approved hours. Equal hours share a rank and are marked "tied" in words. No Ore is shown for
// anyone, and depth is one metre for each approved hour.
export function LeaderTable({ rows, range, caption }: { rows: LeaderRow[]; range: LeaderboardRange; caption: string }) {
  return (
    <div className="pf-table-wrap cm-leader">
      <table className="pf-table">
        <caption className="pf-sr">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Rank</th>
            <th scope="col">Builder</th>
            <th scope="col">Approved hours</th>
            <th scope="col">{range === "weekly" ? "Depth gained" : "Depth"}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.handle}>
              <td className="cm-rank">
                {row.rank}
                {row.tied ? <span className="cm-tie"> tied</span> : null}
              </td>
              <th scope="row" className="cm-handle">
                {row.handle}
              </th>
              <td className="cm-num">{row.hours} H</td>
              <td className="cm-num">
                {depthLabel(range, row.hours).replace(/ deeper$/, "")}
                {range === "weekly" ? <span className="cm-deeper"> deeper</span> : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
