import { readAirbridgePreview, UNMAPPED_LIST_LIMIT } from "@/lib/reviewer/airbridge-preview";
import { requirePage } from "@/reviewer-dash/lib/guard";
import { Badge, ButtonLink, Callout, Card, CardHeader, EmptyRow, Mono, PageHeader, Table } from "@/reviewer-dash/app/_ui/ui";

const EVIDENCE_LIMIT = 100;

export default async function AirbridgePreviewPage() {
  // Fulfillers and owners only; the page lists project numbers, never titles or builders.
  await requirePage("fulfiller");
  const view = await readAirbridgePreview(new Date());
  const rows = view.preview;
  const showing = [...rows].sort((a, b) => Number(a.state === "Verified") - Number(b.state === "Verified")
    || (a.attemptedAt?.getTime() ?? 0) - (b.attemptedAt?.getTime() ?? 0)
    || a.projectNumber - b.projectNumber).slice(0, EVIDENCE_LIMIT);
  const counts = [
    ["Mapped records", rows.length],
    ["Fresh approvals", rows.filter((row) => row.state === "Verified").length],
    ["Not synchronized", rows.filter((row) => row.state === "Not synchronized").length],
    ["Stale", rows.filter((row) => row.state === "Stale").length],
    ["Upstream errors", rows.filter((row) => row.state === "Upstream error").length],
    ["Missing approvals", rows.filter((row) => row.state === "Missing approval").length],
    ["Repository mismatches", rows.filter((row) => row.state === "Repository mismatch").length],
    ["Unavailable projects", rows.filter((row) => row.state === "Project unavailable").length],
  ] as const;
  const unmapped = view.unmapped;
  const unmappedRows = view.unmappedProjects;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Airbridge verification preview" description="Cached approval evidence for fulfillment staff."
        actions={<ButtonLink href="/fulfillment" size="sm" variant="outline">Back to fulfillment</ButtonLink>} />
      <Callout tone="info">Preview only. Fulfillment uses the existing LOADOUT approval and order records.</Callout>
      {view.state === "db_error" ? (
        <Callout tone="danger" icon="important">
          The preview database could not be read, so no approval evidence is shown. This is not the same as having no mappings.
          Nothing here should be treated as verified until the preview reads successfully again.
        </Callout>
      ) : <>
        {view.config === "invalid" ? (
          <Callout tone="danger" icon="important">
            The Airbridge mapping setting is invalid (a malformed record id, or a project or record listed twice), so no project is checked.
            Ask an owner to correct it. Until then every approved project counts as unmapped.
          </Callout>
        ) : view.config === "none" ? (
          <Callout tone="warning">No Airbridge mappings are configured, so no project is checked. Every approved project counts as unmapped.</Callout>
        ) : null}

        <Card padding="flush">
          <CardHeader title="Missing mappings" count={unmapped} icon="important" />
          <div className="flex flex-col gap-1 px-4 pt-3 pb-3 text-sm">
            <p>
              <strong className="tabular-nums">{unmapped.toLocaleString()}</strong>{" "}
              {unmapped === 1 ? "approved project has" : "approved projects have"} no Airbridge mapping. This preview has no approval evidence for {unmapped === 1 ? "it" : "them"} until a mapping is added.
            </p>
            {unmapped > unmappedRows.length ? (
              <p className="hc-muted">Showing {unmappedRows.length.toLocaleString()} of {unmapped.toLocaleString()}, lowest project number first (limit {UNMAPPED_LIST_LIMIT}).</p>
            ) : null}
          </div>
          <Table headers={["LOADOUT project", "Status"]}>
            {!unmappedRows.length ? <EmptyRow colSpan={2} title="Every approved project has a mapping" /> : null}
            {unmappedRows.map((row) => <tr key={row.projectNumber}>
              <td>#{row.projectNumber}</td>
              <td><Badge tone="warning">Missing mapping</Badge></td>
            </tr>)}
          </Table>
        </Card>

        <Card>
          <CardHeader title="Synchronization health" />
          <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {counts.map(([label, value]) => <div key={label} className="min-w-0">
              <dt className="hc-muted">{label}</dt>
              <dd className="text-xl font-semibold tabular-nums">{value}</dd>
            </div>)}
          </dl>
        </Card>
        <Card padding="flush">
          <CardHeader title="Cached approval evidence" count={rows.length} />
          {rows.length > showing.length ? (
            <p className="hc-muted px-4 pt-3 text-sm">Showing {showing.length} of {rows.length} mapped records, unverified and oldest first.</p>
          ) : null}
          <Table headers={["LOADOUT project", "Unified record", "Status", "Approved hours", "Last checked (UTC)"]}>
            {!showing.length ? <EmptyRow colSpan={5} title="No Airbridge mappings configured" /> : null}
            {showing.map((row) => <tr key={row.projectNumber}>
              <td>#{row.projectNumber}</td>
              <td><Mono>{row.unifiedId}</Mono></td>
              <td>{row.state}</td>
              <td>{row.hours ?? "—"}</td>
              <td>{row.attemptedAt?.toISOString().slice(0, 16).replace("T", " ") ?? "Never"}</td>
            </tr>)}
          </Table>
        </Card>
      </>}
    </div>
  );
}
