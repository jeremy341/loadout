import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { DocsDocument } from "../DocsDocument";
import { docsAliases, docsItems } from "../docs-data";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return docsItems.map((item) => ({ slug: item.slug })).concat(Object.keys(docsAliases).map((slug) => ({ slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = docsItems.find((entry) => entry.slug === (docsAliases[slug] ?? slug));
  return { title: "LOADOUT Docs — " + (item?.label ?? "Document"), description: item?.description };
}

export default async function DocsSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (docsAliases[slug]) redirect("/docs/" + docsAliases[slug]);
  if (!docsItems.some((item) => item.slug === slug)) notFound();
  return <DocsDocument slug={slug} />;
}
