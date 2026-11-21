import { requirePage } from "@/reviewer-dash/lib/guard";
import { listViolations } from "@/reviewer-dash/lib/db";
import { BanForm, WarnForm } from "@/reviewer-dash/app/_components/Moderate";
import { RULE_KINDS, ruleSlug } from "@/reviewer-dash/lib/sample/moderation-data";
import {
  Badge,
  Card,
  EmptyRow,
  FilterBar,
  Flash,
  LinkTabs,
  Muted,
  PageHeader,
  Pagination,
  Quote,
  Table,
  TextLink,
  formatDateTime,
} from "@/reviewer-dash/app/_ui/ui";

export const dynamic = "force-dynamic";

const PER = 20;

export default async function ViolationsPage({
  searchParams,
}: {
  searchParams: Promise<{ rule?: string; q?: string; page?: string; ok?: string; error?: string }>;
}) {
  await requirePage("owner");
  const { rule, q, page, ok, error } = await searchParams;
  const all = await listViolations(500);

  // Violations are filed under a LOADOUT rule (Kindness, Own work, Safety, Privacy, Fair play, Other).
  const counts = new Map<string, number>(RULE_KINDS.map((name) => [ruleSlug(name), 0]));
  for (const v of all) counts.set(ruleSlug(v.kind), (counts.get(ruleSlug(v.kind)) ?? 0) + 1);

  const query = (q ?? "").trim().toLowerCase();
  let rows = all;
  if (rule && counts.has(rule)) rows = rows.filter((v) => ruleSlug(v.kind) === rule);
  if (query)
    rows = rows.filter(
      (v) => (v.users?.display_name || "").toLowerCase().includes(query) || (v.content ?? "").toLowerCase().includes(query),
    );

  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / PER));
  const cur = Math.min(Math.max(parseInt(page ?? "1", 10) || 1, 1), pages);
  const start = (cur - 1) * PER;
  const slice = rows.slice(start, start + PER);

  const activeKind = rule && counts.has(rule) ? rule : "all";
  const withParams = (over: Record<string, string>) => {
    const k = over.rule ?? activeKind;
    const p = new URLSearchParams();
    if (k !== "all") p.set("rule", k);
    const qq = over.q ?? q;
    if (qq) p.set("q", qq);
    if (over.page && over.page !== "1") p.set("page", over.page);
    const s = p.toString();
    return s ? `/violations?${s}` : "/violations";
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Violations"
        count={all.length}
        description="Every recorded breach of a LOADOUT rule, newest first."
      />
      <Flash error={error} ok={ok} />

      <div>
        <FilterBar q={q} placeholder="Search handle or text">
          {activeKind !== "all" && <input type="hidden" name="rule" value={activeKind} />}
        </FilterBar>

        <Card padding="flush">
          <LinkTabs
            active={activeKind}
            tabs={[
              { key: "all", href: withParams({ rule: "all" }), label: "All", count: all.length },
              ...RULE_KINDS.map((name) => ({
                key: ruleSlug(name),
                href: withParams({ rule: ruleSlug(name) }),
                label: name,
                count: counts.get(ruleSlug(name)) ?? 0,
              })),
            ]}
          />
          <Table headers={["Builder", "What happened", "Rule", "When", "Moderate"]}>
            {slice.map((v) => {
              const name = v.users?.display_name || v.user_id;
              return (
                <tr key={v.id}>
                  <td>
                    <TextLink href={`/players/${v.user_id}`} className="font-bold">
                      {name}
                    </TextLink>
                  </td>
                  <td className="max-w-md break-words">
                    <Quote>{v.content}</Quote>
                  </td>
                  <td>
                    <Badge tone="warning">{v.kind}</Badge>
                  </td>
                  <td className="whitespace-nowrap">
                    <Muted>{formatDateTime(v.created_at)}</Muted>
                  </td>
                  <td>
                    <div className="flex flex-wrap items-center gap-2">
                      <WarnForm userId={v.user_id} compact />
                      <BanForm userId={v.user_id} compact />
                    </div>
                  </td>
                </tr>
              );
            })}
            {slice.length === 0 && (
              <EmptyRow colSpan={5} title="No violations match" icon="search">
                Try a different filter or search.
              </EmptyRow>
            )}
          </Table>
        </Card>

        <Pagination page={cur} totalPages={pages} hrefFor={(p) => withParams({ page: String(p) })} />
      </div>
    </div>
  );
}
