import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { DocsDocument } from "../DocsDocument";
import { docsAliases } from "../docs-data";
import { getDocs } from '../docs-source';
import { docsViewer } from "../docs-viewer";

// Not force-static: the layout reads the session to choose the platform frame or the public one.
export const dynamicParams = false;

export function generateStaticParams() {
  return getDocs().map((item) => ({ slug: item.slug })).concat(Object.keys(docsAliases).map((slug) => ({ slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = getDocs().find((entry) => entry.slug === (docsAliases[slug] ?? slug));
  return { title: "LOADOUT Docs: " + (item?.label ?? "Document"), description: item?.description };
}

export default async function DocsSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (docsAliases[slug]) redirect("/docs/" + docsAliases[slug]);
  const pages = getDocs();
  const index = pages.findIndex((item) => item.slug === slug);
  if (index < 0) notFound();
  const embedded = (await docsViewer()) !== null;
  return <DocsDocument page={pages[index]} previous={pages[index - 1]} next={pages[index + 1]} embedded={embedded} />;
}
