import type { Metadata } from "next";
import Link from "next/link";
import { AccessForm } from "@/app/_components/platform/forms";
import { EmptyState } from "@/app/_components/platform/PlatformNotice";
import { db } from "@/lib/platform/db";
import { requireStaff } from "@/lib/platform/session";

export const metadata: Metadata = { title: "Users - LOADOUT" };

type SearchParams = Promise<{ q?: string; person?: string }>;

export default async function StaffUsersPage({ searchParams }: { searchParams: SearchParams }) {
  const viewer = await requireStaff();
  const { q = "", person } = await searchParams;
  const term = q.trim().slice(0, 100);
  const query = term ? `&q=${encodeURIComponent(term)}` : "";

  const people = await db().person.findMany({
    where: term
      ? {
          OR: [
            { email: { contains: term, mode: "insensitive" } },
            { displayName: { contains: term, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: { roles: true },
    orderBy: { createdAt: "asc" },
    take: 50,
  });
  const selected = person
    ? await db().person.findUnique({ where: { id: person }, include: { roles: true } })
    : null;

  return (
    <>
      <h1>Users</h1>
      <p className="pf-lead">Find a person, then change their staff role or ban status. Every change needs a reason.</p>
      <form method="get" action="/dashboard/staff/users" role="search" className="pf-field">
        <label htmlFor="user-search">Search by name or email</label>
        <div className="pf-row">
          <input id="user-search" name="q" type="search" defaultValue={term} className="pf-input" />
          <button className="pf-btn" type="submit">Search</button>
        </div>
      </form>

      {people.length === 0 ? (
        <EmptyState title="No one matches">Try a different name or email, or clear the search.</EmptyState>
      ) : (
        <div className="pf-table-wrap">
          <table className="pf-table">
            <caption className="pf-hint">{people.length} shown, oldest first</caption>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Access</th>
                <th scope="col">Status</th>
                <th scope="col">Open</th>
              </tr>
            </thead>
            <tbody>
              {people.map((row) => {
                const staff = row.roles.some((grant) => grant.role === "staff");
                return (
                  <tr key={row.id}>
                    <td>{row.displayName}</td>
                    <td className="pf-break">{row.email}</td>
                    <td>{staff ? "Staff" : "Builder"}</td>
                    <td>{row.bannedAt ? "Banned" : "Active"}</td>
                    <td>
                      <Link href={`/dashboard/staff/users?person=${row.id}${query}`} aria-label={`Open access for ${row.displayName}`}>
                        Open
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selected ? (
        <section className="pf-section" aria-labelledby="access-heading">
          <h2 id="access-heading">Access for {selected.displayName}</h2>
          <p className="pf-hint">{selected.email}</p>
          <AccessForm
            key={selected.id}
            personId={selected.id}
            staff={selected.roles.some((grant) => grant.role === "staff")}
            banned={selected.bannedAt !== null}
            isSelf={selected.id === viewer.id}
          />
        </section>
      ) : null}
    </>
  );
}
