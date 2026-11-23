import type { ReactNode } from "react";
import { reachableRows } from "./shortcutKeys";

function Row({ keys, children }: { keys: ReactNode; children: ReactNode }) {
  return (
    <tr>
      <th scope="row">{keys}</th>
      <td>{children}</td>
    </tr>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="hc-kbd">{children}</kbd>;
}

// The list of keys the desk listens for, plus the review page's own keys (which live in review/[id]/ReviewShortcuts.tsx).
export default function ShortcutsTable({ hrefs }: { hrefs: ReadonlySet<string> }) {
  return (
    <table className="rv-shortcuts-table">
      <caption className="sr-only">Keyboard shortcuts for the reviewer desk</caption>
      <tbody>
        <Row keys={<Kbd>/</Kbd>}>Open search (Ctrl or Cmd+K does the same)</Row>
        <Row keys={<Kbd>?</Kbd>}>Show this list</Row>
        {reachableRows(hrefs).map(([key, v]) => (
          <Row
            key={key}
            keys={
              <>
                <Kbd>g</Kbd> then <Kbd>{key}</Kbd>
              </>
            }
          >
            Go to {v.label}
          </Row>
        ))}
        <Row
          keys={
            <>
              <Kbd>←</Kbd> <Kbd>→</Kbd> or <Kbd>k</Kbd> <Kbd>j</Kbd>
            </>
          }
        >
          On a ship: previous or next ship
        </Row>
        <Row
          keys={
            <>
              <Kbd>r</Kbd> <Kbd>d</Kbd>
            </>
          }
        >
          On a ship: open the repository or the demo
        </Row>
        <Row
          keys={
            <>
              <Kbd>1</Kbd> to <Kbd>9</Kbd>
            </>
          }
        >
          On a ship: switch the evidence tab
        </Row>
      </tbody>
    </table>
  );
}
