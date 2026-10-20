import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PAGES } from "../../../components/pages/registry";
import { ROUTE_SLUGS, findItem } from "../../../components/shell/nav-data";

// Only the slugs in the navigation data exist. Anything else is the 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return ROUTE_SLUGS.map((section) => ({ section }));
}

type Props = { params: Promise<{ section: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { section } = await params;
  const item = findItem(section);
  return item ? { title: item.label } : {};
}

export default async function SectionPage({ params }: Props) {
  const { section } = await params;
  const item = findItem(section);
  const Page = PAGES[section];
  if (!item || item.external || !Page) notFound();

  return (
    <article className="pg">
      <Page />
    </article>
  );
}
