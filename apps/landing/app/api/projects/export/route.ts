import { reviewApi } from "@/reviewer-dash/lib/apiGuard";
import { listProjects } from "@/reviewer-dash/lib/db";

export const dynamic = "force-dynamic";

// A CSV of the approved sample projects (Pixl's export of the YSWS fields). Owners only, review host only. Sample data: invented
// projects, no names, emails or addresses.
const cell = (value: unknown): string => {
  let text = String(value ?? "");
  // A cell that starts like a formula is quoted as text, so a spreadsheet does not run it.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

export const GET = reviewApi("api.projects.export", "owner", async () => {
  const rows = (await listProjects(undefined, { includeArchived: false })).filter((p) => p.status === "approved" && !p.banned_at && !p.rejected_at);
  const header = ["Project number", "Name", "Code URL", "Playable URL", "Description", "Hours"];
  const lines = [header.map(cell).join(",")];
  for (const p of rows.sort((a, b) => a.id - b.id))
    lines.push([p.id, p.name, p.repo_url, p.demo_url, p.description, p.approved_hours].map(cell).join(","));
  return new Response(`${lines.join("\n")}\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="approved-projects-sample.csv"',
      "Cache-Control": "no-store",
    },
  });
});
