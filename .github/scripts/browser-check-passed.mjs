// Answers whether an exact commit already has a successful `Landing browser` check run, which is
// the only evidence that lets the browser suite be skipped. Run as:
//   node .github/scripts/browser-check-passed.mjs <owner/repo> <commit> <token>
// Prints `true` or `false`, and prints `false` for anything it cannot establish. It uses fetch
// rather than `gh`, because the browser jobs run inside the Playwright container, which has Node
// but not the GitHub CLI.
const [repo, sha, token] = process.argv.slice(2);

if (!repo || !sha) {
  console.log("false");
  process.exit(0);
}

const url = `https://api.github.com/repos/${repo}/commits/${sha}/check-runs?per_page=100`;
const headers = {
  accept: "application/vnd.github+json",
  "user-agent": "loadout-ci",
  ...(token ? { authorization: `Bearer ${token}` } : {}),
};

try {
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const body = await response.json();
  const runs = (body.check_runs ?? []).filter((run) => run.name === "Landing browser");
  console.log(runs.length > 0 && runs.every((run) => run.conclusion === "success") ? "true" : "false");
} catch {
  console.log("false");
}
