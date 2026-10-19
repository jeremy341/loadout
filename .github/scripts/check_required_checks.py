#!/usr/bin/env python3
"""Check the required-check manifest against CI's named jobs and its generated doc table."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
JOB_LINE = re.compile(r"^  ([A-Za-z0-9_-]+):$")
NAME_LINE = re.compile(r"^    name: (.+)$")
NEEDS_LINE = re.compile(r"^    needs: (.+)$")
TABLE_START = "<!-- required-checks:start -->"
TABLE_END = "<!-- required-checks:end -->"


def render_table(contract: dict[str, Any]) -> str:
    rows = ["| Lane | Required checks |", "| --- | --- |"]
    checks = contract.get("checks", {})
    for lane in contract.get("lanes", []):
        labels = [str(checks.get(check_id, f"UNKNOWN: {check_id}")) for check_id in lane.get("checks", [])]
        rows.append(f"| `{lane.get('branch', '')}` | {', '.join(labels)} |")
    return "\n".join(rows)


def read_static_jobs(workflow: str) -> tuple[dict[str, dict[str, str]], list[str]]:
    """Read only fixed top-level job ids and their static name/needs fields.

    actionlint parses the complete YAML in the same check. This narrow reader verifies the
    workflow's stable check-name contract and fails closed if its expected structure changes.
    """
    section = jobs_section(workflow)
    if section is None:
        return {}, ["The workflow has no top-level jobs section."]
    return parse_jobs(section), []


def is_top_level_line(line: str) -> bool:
    if not line or line.startswith("#"):
        return False
    return not line.startswith(" ")


def jobs_section(workflow: str) -> list[str] | None:
    lines = workflow.splitlines()
    try:
        start = lines.index("jobs:") + 1
    except ValueError:
        return None
    end = next((index for index in range(start, len(lines)) if is_top_level_line(lines[index])), len(lines))
    return lines[start:end]


def parse_jobs(lines: list[str]) -> dict[str, dict[str, str]]:
    jobs: dict[str, dict[str, str]] = {}
    current: str | None = None
    for line in lines:
        job_match = JOB_LINE.match(line)
        if job_match:
            current = job_match.group(1)
            jobs[current] = {}
            continue
        if current is None:
            continue
        set_job_fields(jobs[current], line)
    return jobs


def set_job_fields(job: dict[str, str], line: str) -> None:
    name_match = NAME_LINE.match(line)
    if name_match:
        job["name"] = name_match.group(1).strip()
    needs_match = NEEDS_LINE.match(line)
    if needs_match:
        job["needs"] = needs_match.group(1).strip()


def non_empty_string(value: Any) -> bool:
    if not isinstance(value, str):
        return False
    return len(value) > 0


def duplicate_values(values: list[str]) -> bool:
    return len(values) != len(set(values))


def validate_check_names(check_names: dict[str, Any], jobs: dict[str, dict[str, str]]) -> list[str]:
    errors = [
        "Every check id must map to a non-empty display name."
        for name in check_names.values()
        if not non_empty_string(name)
    ]
    valid_names = [name for name in check_names.values() if isinstance(name, str)]
    if duplicate_values(valid_names):
        errors.append("Required-check display names must be unique.")
    errors.extend(
        f"Job '{job_id}' must keep the display name '{expected_name}'."
        for job_id, expected_name in check_names.items()
        if jobs.get(job_id, {}).get("name") != expected_name
    )
    return errors


def validate_lane_branch(lane: Any, branches: set[str]) -> tuple[str | None, list[str]]:
    if not isinstance(lane, dict):
        return None, ["Each lane must have a branch name and a checks array."]
    branch = lane.get("branch")
    if not isinstance(branch, str):
        return None, ["Each lane must have a non-empty branch name."]
    if not branch:
        return None, ["Each lane must have a non-empty branch name."]
    errors: list[str] = []
    if branch in branches:
        errors.append(f"Branch '{branch}' is listed more than once.")
    branches.add(branch)
    return branch, errors


def repeated_values(values: list[str]) -> list[str]:
    seen: set[str] = set()
    repeated: list[str] = []
    for value in values:
        if value in seen:
            repeated.append(value)
        seen.add(value)
    return repeated


def validate_lane_check_ids(branch: str, check_ids: list[Any], check_names: dict[str, Any]) -> list[str]:
    if not check_ids:
        return [f"Lane '{branch}' must require at least one status check."]
    string_ids = [check_id for check_id in check_ids if isinstance(check_id, str)]
    errors = [f"Lane '{branch}' contains a non-string check id." for check_id in check_ids if not isinstance(check_id, str)]
    errors.extend(f"Lane '{branch}' references unknown check '{check_id}'." for check_id in string_ids if check_id not in check_names)
    errors.extend(f"Lane '{branch}' lists '{check_id}' more than once." for check_id in set(repeated_values(string_ids)))
    return errors


def validate_lane(lane: Any, check_names: dict[str, Any], branches: set[str]) -> list[str]:
    branch, errors = validate_lane_branch(lane, branches)
    if branch is None:
        return errors
    check_ids = lane.get("checks")
    if not isinstance(check_ids, list):
        errors.append(f"Lane '{branch}' must have a checks array.")
        return errors
    errors.extend(validate_lane_check_ids(branch, check_ids, check_names))
    return errors


def validate_lanes(lanes: list[Any], check_names: dict[str, Any]) -> list[str]:
    branches: set[str] = set()
    errors: list[str] = []
    for lane in lanes:
        errors.extend(validate_lane(lane, check_names, branches))
    return errors


def validate_browser_aggregator(jobs: dict[str, dict[str, str]]) -> list[str]:
    needs = jobs.get("landing-browser", {}).get("needs", "").strip()
    if needs.startswith("[") and needs.endswith("]"):
        needs = needs[1:-1]
    dependencies = {dependency.strip().strip("\"'") for dependency in needs.split(",") if dependency.strip()}
    if "browser-shard" in dependencies:
        return []
    return ["The 'landing-browser' job must aggregate 'browser-shard'."]


def validate_docs_table(contract: dict[str, Any], docs: str) -> list[str]:
    start = docs.find(TABLE_START)
    end = docs.find(TABLE_END)
    if start < 0:
        return ["The generated required-check table start marker is missing."]
    if end < 0:
        return ["The generated required-check table end marker is missing."]
    if end <= start:
        return ["The generated required-check table markers are out of order."]
    actual_table = docs[start + len(TABLE_START) : end].strip()
    if actual_table != render_table(contract):
        return ["The required-check table does not match .github/required-checks.json."]
    return []


def validate_contract(contract: dict[str, Any], workflow: str, docs: str) -> list[str]:
    check_names = contract.get("checks")
    lanes = contract.get("lanes")
    if not isinstance(check_names, dict):
        return ["The required-check JSON must define an object named 'checks'."]
    if not isinstance(lanes, list):
        return ["The required-check JSON must define an array named 'lanes'."]

    jobs, job_errors = read_static_jobs(workflow)
    return [
        *job_errors,
        *validate_check_names(check_names, jobs),
        *validate_lanes(lanes, check_names),
        *validate_browser_aggregator(jobs),
        *validate_docs_table(contract, docs),
    ]


def main() -> int:
    contract_path = ROOT / ".github" / "required-checks.json"
    workflow_path = ROOT / ".github" / "workflows" / "ci.yml"
    docs_path = ROOT / "docs" / "development" / "required-checks.md"
    contract = json.loads(contract_path.read_text(encoding="utf-8"))
    errors = validate_contract(
        contract,
        workflow_path.read_text(encoding="utf-8"),
        docs_path.read_text(encoding="utf-8"),
    )
    if errors:
        for error in errors:
            print(f"Required-check contract: {error}", file=sys.stderr)
        return 1
    print("Required-check names match the CI workflow and generated documentation.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
