#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
tool_dir="$(mktemp -d)"
trap 'rm -rf "$tool_dir"' EXIT

actionlint_version="1.7.12"
actionlint_archive="actionlint_${actionlint_version}_linux_amd64.tar.gz"
actionlint_sha256="8aca8db96f1b94770f1b0d72b6dddcb1ebb8123cb3712530b08cc387b349a3d8"
shellcheck_version="0.11.0"
shellcheck_archive="shellcheck-v${shellcheck_version}.linux.x86_64.tar.gz"
shellcheck_sha256="b7af85e41cc99489dcc21d66c6d5f3685138f06d34651e6d34b42ec6d54fe6f6"
shellcheck_path="${tool_dir}/shellcheck-v${shellcheck_version}/shellcheck"

curl --fail --location --silent --show-error \
  "https://github.com/rhysd/actionlint/releases/download/v${actionlint_version}/${actionlint_archive}" \
  --output "${tool_dir}/${actionlint_archive}"
printf '%s  %s\n' "$actionlint_sha256" "${tool_dir}/${actionlint_archive}" | sha256sum --check --status
tar -xzf "${tool_dir}/${actionlint_archive}" -C "$tool_dir" actionlint

curl --fail --location --silent --show-error \
  "https://github.com/koalaman/shellcheck/releases/download/v${shellcheck_version}/${shellcheck_archive}" \
  --output "${tool_dir}/${shellcheck_archive}"
printf '%s  %s\n' "$shellcheck_sha256" "${tool_dir}/${shellcheck_archive}" | sha256sum --check --status
tar -xzf "${tool_dir}/${shellcheck_archive}" -C "$tool_dir" "shellcheck-v${shellcheck_version}/shellcheck"

"${tool_dir}/actionlint" -shellcheck="$shellcheck_path" -color
shell_script_dir="${tool_dir}/shell-scripts"
mkdir -p "$shell_script_dir"
for source in "$repo_root"/.github/scripts/*.sh; do
  script_name="$(basename "$source")"
  sed 's/\r$//' "$source" > "$shell_script_dir/$script_name"
done
"$shellcheck_path" -x "$shell_script_dir"/*.sh
python3 -B -m unittest discover -s "$repo_root/.github/scripts" -p 'test_required_checks.py'
python3 -B "$repo_root/.github/scripts/check_required_checks.py"
