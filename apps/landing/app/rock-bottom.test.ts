import { describe, expect, test } from "bun:test";
import { isValidElement, type ReactNode } from "react";
import CaveIn from "./error";

// Collect every element in a React tree, including elements passed through props (such as an `actions` slot).
function elements(node: ReactNode): React.ReactElement<Record<string, unknown>>[] {
  if (Array.isArray(node)) return node.flatMap((child) => elements(child));
  if (!isValidElement<Record<string, unknown>>(node)) return [];
  return [node, ...Object.values(node.props).flatMap((value) => elements(value as ReactNode))];
}

describe("the cave-in page", () => {
  test("offers a Try again button that retries the failed render", () => {
    let retries = 0;
    const tree = CaveIn({ error: new Error("boom"), reset: () => { retries += 1; } });
    const retry = elements(tree).find((element) => element.type === "button");
    expect(retry).toBeDefined();
    (retry!.props.onClick as () => void)();
    expect(retries).toBe(1);
  });
});
