"use client";

import { useState, type ReactNode } from "react";
import { Button, Table } from "./ui";

export default function PaginatedTable({
  headers,
  rows,
  pageSize = 10,
}: {
  headers: ReactNode[];
  rows: ReactNode[];
  pageSize?: number;
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * pageSize;

  return (
    <div>
      <Table headers={headers}>{rows.slice(start, start + pageSize)}</Table>
      {totalPages > 1 && (
        <nav className="flex items-center justify-between gap-4 px-4 py-3">
          <span className="hc-caption text-sm">
            Page {current} of {totalPages}
          </span>
          <div className="flex gap-2">
            {current > 1 && (
              <Button type="button" variant="outline" size="sm" onClick={() => setPage(current - 1)}>
                Previous
              </Button>
            )}
            {current < totalPages && (
              <Button type="button" variant="outline" size="sm" onClick={() => setPage(current + 1)}>
                Next
              </Button>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
