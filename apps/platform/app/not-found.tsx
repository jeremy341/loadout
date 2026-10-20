import type { Metadata } from "next";
import Link from "next/link";
import { HOME_SLUG } from "../components/shell/nav-data";
import { StandalonePage } from "../components/shell/standalone-page";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <StandalonePage tag="Error 404" title="Page not found">
      <p className="lead">Nothing is built at this address. The way back is up.</p>
      <p>
        <Link className="btn" href={`/${HOME_SLUG}`}>
          Back to Overview
        </Link>
      </p>
    </StandalonePage>
  );
}
