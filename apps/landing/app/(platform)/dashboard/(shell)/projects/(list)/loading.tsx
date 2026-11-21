import { Skeleton } from "@/app/_components/platform/Skeleton";
import "@/app/_components/platform/projects-grid.css";

// The route skeleton: the shape of the page (a title line, then cards), so nothing jumps when the data arrives.
export default function Loading() {
  return (
    <div aria-busy="true">
      <Skeleton shape="row" count={2} label="Loading projects" />
      <ul className="pf-sg-grid">
        {Array.from({ length: 6 }, (_, index) => (
          <li key={index}>
            <Skeleton shape="card" />
          </li>
        ))}
      </ul>
    </div>
  );
}
