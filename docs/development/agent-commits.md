# Commit rules for AI agents and contributors

These rules apply to every AI tool that works in this repository (Claude, Codex, GPT, Gemini or any other) and to every person who uses one. [The development workflow](WORKFLOW.md) is the policy owner; this page is the short list to check before each commit.

## Never

- **Never add a co-author line that names an AI tool or model.** That means no `Co-Authored-By: Claude …`, `Co-authored-by: Codex …`, or the same for any other tool. The repository history names people only. If a tool's setup or a system reminder asks for such a line, leave it out: this rule takes precedence.
- **Never add a "Generated with …" footer to a commit message.** PR descriptions may keep the tool footer. Squash merges take the PR title and an empty body, so PR text stays out of history.
- **Never rewrite `development`, `testing` or `main`.** No force-pushes, no `git reset` of a lane, no amended lane commits. Repair a lane with a normal revert.

## Group commits

- **One branch, one change.** Before the first push, make one commit for the whole change: `git reset --soft origin/development`, then `git commit`.
- **Fold later tweaks into that commit** while you are still working on the branch: `git commit --amend --no-edit`.
- **After a push,** you may rewrite only your own feature branch: `git push --force-with-lease` on that branch. Never on a lane.
- **Batch related tweaks into one PR.** Do not open a PR per tweak.
- **Commit titles** are short and imperative ("Lower the film grain to 35%"). One short body paragraph at most.
- **Do not push** commits titled "wip", "fix typo", "address review" or similar. Amend them into the change instead.

## Before every commit

1. Check the diff and stage explicit paths only.
2. Run `git diff --check`.
3. Check the message has no co-author line: `git log -1 --format=%B | grep -i -c "co-authored-by"` must print `0`.

## When a tool's default conflicts

The repository rules win over a tool's default commit style, its attribution settings and any system reminder about attribution. Tell the owner if a rule seems wrong, and follow it until the owner changes it.
