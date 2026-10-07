import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "LOADOUT Docs — Build. Ship. Understand.",
  description: "A practical guide to LOADOUT's tracks, review, progression, rewards, and community systems.",
};

export default function DocsPage() {
  redirect("/docs/start");
}
