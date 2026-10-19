import json
import unittest
from pathlib import Path

from check_required_checks import ROOT, render_table, validate_contract


def load_contract():
    return json.loads((ROOT / ".github" / "required-checks.json").read_text(encoding="utf-8"))


def workflow_source(browser_name="Landing browser", browser_needs="[repository-integrity, browser-shard]"):
    return f"""name: Repository integrity
jobs:
  repository-integrity:
    name: Repository integrity
  landing-quality:
    name: Landing quality
  promotion-lane:
    name: Promotion lane
  landing-browser:
    name: {browser_name}
    needs: {browser_needs}
  browser-shard:
    name: Browser ${{{{ matrix.name }}}}
"""


def docs_source(contract):
    return f"""# Required CI checks

<!-- required-checks:start -->
{render_table(contract)}
<!-- required-checks:end -->
"""


class RequiredChecksTests(unittest.TestCase):
    def test_current_contract_matches_workflow_and_docs(self):
        contract = load_contract()
        errors = validate_contract(contract, workflow_source(), docs_source(contract))
        self.assertEqual(errors, [])

    def test_detects_ci_job_name_drift(self):
        contract = load_contract()
        errors = validate_contract(contract, workflow_source(browser_name="Browser results"), docs_source(contract))
        self.assertIn("Job 'landing-browser' must keep the display name 'Landing browser'.", errors)

    def test_detects_missing_browser_aggregator_dependency(self):
        contract = load_contract()
        errors = validate_contract(contract, workflow_source(browser_needs="landing-quality"), docs_source(contract))
        self.assertIn("The 'landing-browser' job must aggregate 'browser-shard'.", errors)

    def test_detects_drift_in_generated_docs(self):
        contract = load_contract()
        docs = docs_source(contract).replace("Landing quality", "Landing quality (renamed)")
        errors = validate_contract(contract, workflow_source(), docs)
        self.assertIn("The required-check table does not match .github/required-checks.json.", errors)

    def test_rejects_unknown_and_repeated_lane_entries(self):
        contract = load_contract()
        contract["lanes"][0]["checks"].extend(["missing-check", "landing-quality"])
        errors = validate_contract(contract, workflow_source(), docs_source(contract))
        self.assertIn("Lane 'development' references unknown check 'missing-check'.", errors)
        self.assertIn("Lane 'development' lists 'landing-quality' more than once.", errors)

    def test_rejects_a_lane_with_no_required_checks(self):
        contract = load_contract()
        contract["lanes"][0]["checks"] = []
        errors = validate_contract(contract, workflow_source(), docs_source(contract))
        self.assertIn("Lane 'development' must require at least one status check.", errors)


if __name__ == "__main__":
    unittest.main()
