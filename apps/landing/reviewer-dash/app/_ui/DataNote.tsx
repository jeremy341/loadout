// A one-line note that says where the data under it comes from. Two states only, each with one fixed sentence (see
// .ulpi/design/reviewer-desk-staging-honesty.md): "Sample data" for rows built from fixtures, "Not connected" for a service that does not
// exist on staging. The label is a word in bold, never colour alone. It reuses the page-level data-scope look (reviewer-root.css).
export type DataNoteKind = "sample" | "not-connected";

const LABEL: Record<DataNoteKind, string> = { sample: "Sample data", "not-connected": "Not connected" };
const TEXT: Record<DataNoteKind, string> = {
  sample: "Changes stay on this server and are gone when it restarts.",
  "not-connected": "This service does not exist on staging, so nothing here is saved or sent.",
};

export default function DataNote({ kind, children, className = "" }: { kind: DataNoteKind; children?: React.ReactNode; className?: string }) {
  return (
    <p className={`rv-data-scope ${className}`.trim()} data-scope={kind === "sample" ? "sample" : "not-connected"}>
      <strong>{LABEL[kind]}.</strong> {children ?? TEXT[kind]}
    </p>
  );
}
