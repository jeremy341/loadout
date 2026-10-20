#!/usr/bin/env bash
set -euo pipefail

manifest="docs/source-audit/reference-pins.tsv"
if [[ ! -f "$manifest" ]]; then
  echo "Missing reference pin manifest: $manifest" >&2
  exit 1
fi

declare -A manifest_names=()
while IFS=$'\t' read -r name url expected_sha extra || [[ -n "${name:-}${url:-}${expected_sha:-}${extra:-}" ]]; do
  [[ -z "${name:-}" || "$name" == \#* ]] && continue

  if [[ -n "${extra:-}" || -z "${url:-}" || -z "${expected_sha:-}" ]]; then
    printf 'Malformed reference pin row for %s\n' "$name" >&2
    exit 1
  fi
  if [[ ! "$name" =~ ^[a-z0-9-]+$ || ! "$expected_sha" =~ ^[0-9a-f]{40}$ ]]; then
    printf 'Invalid reference name or commit SHA in manifest: %s\n' "$name" >&2
    exit 1
  fi
  if [[ -n "${manifest_names[$name]+present}" ]]; then
    printf 'Duplicate reference pin in manifest: %s\n' "$name" >&2
    exit 1
  fi
  manifest_names[$name]=1

  actual_url="$(git config -f .gitmodules --get "submodule.references/${name}.url" || true)"
  if [[ -z "$actual_url" || "$actual_url" != "$url" ]]; then
    printf 'Unexpected URL for reference %s: expected %s, found %s\n' "$name" "$url" "$actual_url" >&2
    exit 1
  fi

  entry="$(git ls-tree HEAD -- "references/${name}")"
  expected_entry="$(printf '160000 commit %s\treferences/%s' "$expected_sha" "$name")"
  if [[ "$entry" != "$expected_entry" ]]; then
    printf 'Unexpected submodule pin for %s: expected %s, found %s\n' "$name" "$expected_entry" "$entry" >&2
    exit 1
  fi
done < "$manifest"

if [[ "${#manifest_names[@]}" -eq 0 ]]; then
  echo "Reference pin manifest contains no entries." >&2
  exit 1
fi

while read -r key path; do
  name="${key#submodule.references.}"
  name="${name%.path}"
  if [[ "$path" != "references/${name}" || -z "${manifest_names[$name]+present}" ]]; then
    printf 'Reference submodule is missing from the manifest or has an unexpected path: %s %s\n' "$key" "$path" >&2
    exit 1
  fi
done < <(git config -f .gitmodules --get-regexp '^submodule\.references\..*\.path$' || true)

echo "Validated ${#manifest_names[@]} reference pins against .gitmodules and the committed tree."
