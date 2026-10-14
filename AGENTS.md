# Agent instructions

## Git workflow

Default branch: `main`.
- **Fetch first.** Before reading or editing anything, run `git fetch --prune origin`. Then make sure you
  start from the latest `origin/main`: run `git pull --ff-only` on `main`, or `git rebase origin/main` in a new
  branch or worktree. If either fails, or there are uncommitted changes you didn't make, stop and tell me.
  Fetch again before you push, open a PR or deploy.

- ⚠️ `origin` = github.com/atsalyuk/FindMy-Pebble is **PUBLIC**. Before every commit, check the diff for Apple ID
  emails, passwords, trust tokens, device IDs, locations and IPs. Credentials come from settings at runtime and are never
  in source.
- The local `private-history` branch holds pre-publication history. **Never push it.**

- Follow the global git rules (one branch per task, commit each green step, push after every commit, PR when done, never
  `--no-verify`, never touch changes you didn't make). This section adds what is specific to this repo.
- T3 starts each thread in its own worktree. Git-ignored files (`.env`, `.dev.vars`, local secrets) are not in a new
  worktree; copy them from the main checkout at `/home/alex/projects/findmy-pebble` if you need them, and never commit them.
- When I say "ship it" or "merge", squash-merge the PR (`gh pr merge --squash --delete-branch`), then pull the default
  branch in the main checkout.
