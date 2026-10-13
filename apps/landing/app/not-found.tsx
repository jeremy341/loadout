import type { Metadata } from "next";
import Link from "next/link";
import { RequestedPath } from "./_components/home/RequestedPath";
import { RockBottom } from "./_components/home/RockBottom";

export const metadata: Metadata = { title: "LOADOUT: Rock bottom (404)" };

// An unknown address, and an unknown docs page: both end here. Next.js sends the 404 status and the noindex tag.
export default function NotFound() {
  return (
    <RockBottom
      variant="lost"
      lead={<><RequestedPath /> You dug past everything we built. The only way back is up.</>}
      actions={
        <>
          <Link className="btn pri hero-btn" href="/">BACK TO THE SURFACE ↑</Link>
          <Link className="btn hero-btn" href="/docs">READ THE GUIDES</Link>
        </>
      }
    />
  );
}
