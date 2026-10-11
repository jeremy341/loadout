import { Poppins } from "next/font/google";
import { DocsShell } from "./docs-shell";
import { getDocsGroups } from "./docs-source";

// Poppins is loaded on the docs only, as in the Pixl docs; the homepage keeps its own fonts.
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-poppins", display: "swap" });

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <div className={poppins.variable} style={{ display: "contents" }}><DocsShell groups={getDocsGroups()}>{children}</DocsShell></div>;
}
