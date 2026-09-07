# moldable-skills Development Guidelines

## Git Workflow

- Work directly on `main` and push only to `main` in every `~/moldable-*`
  repository unless the user explicitly requests otherwise.
- Do not create, switch to, or use feature branches or branch-backed worktrees
  by default. Task isolation, reviews, and concurrent work do not imply permission
  to use a branch.
- If a checkout is on another branch, inspect its status and preserve all
  uncommitted work and branch history before returning to `main`. Never reset,
  discard, or overwrite work to enforce this rule.
- Only when the user explicitly requests a feature branch, use their requested
  name or the `rob/` prefix when they do not specify one.
