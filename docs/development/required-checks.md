# Required CI checks

This is the current workflow contract used by `scripts/ship.ps1`. The check names are validated against `.github/workflows/ci.yml` in CI; the dated branch-protection snapshots remain historical evidence of GitHub settings.

<!-- required-checks:start -->
| Lane | Required checks |
| --- | --- |
| `development` | Repository integrity, Landing quality, Promotion lane |
| `testing` | Repository integrity, Landing quality, Landing browser, Promotion lane |
| `main` | Repository integrity, Landing quality, Landing browser, Promotion lane |
<!-- required-checks:end -->
