# Feature Implementation Prompt

## Target Feature

**Spec directory:** `specs/distric-map/tasks/`
**Branch name:** `feat/distric-map`
**Design doc:** `docs/tasks/distric-map.md`

## Objective

Implement all tasks in the spec directory sequentially, following the numbered task order. Each task file contains full context: description, technical requirements, dependencies, implementation approach, and acceptance criteria.

## Workflow

### Branch Setup

1. Fetch latest from origin and checkout `main`
2. Pull to ensure `main` is up to date
3. Create and checkout the feature branch (or switch to it if it already exists)
4. If the branch already exists, rebase onto `main` before continuing

### Task Execution

Process tasks in order (`task-01`, `task-02`, ...). For each task:

1. Read the task file completely before starting
2. Check that all listed dependencies are complete (earlier tasks marked `completed`)
3. Update the task frontmatter: set `status: in-progress` and `started: YYYY-MM-DD`
4. Implement according to the technical requirements and acceptance criteria
5. Verify every acceptance criterion is met before moving on
6. Update the task frontmatter: set `status: completed` and `completed: YYYY-MM-DD`

### Blocked Tasks

If a task cannot be completed (missing API key, external dependency, manual step required):

1. Set `status: blocked` in the frontmatter
2. Add a `## Blockers` section to the task file documenting:
   - What specifically is blocking completion
   - What needs to happen to unblock it
   - Whether subsequent tasks can proceed without it
3. Move to the next task if its dependencies are still satisfiable

### Required Skills

Use the following skills at the appropriate times:

- **`frontend-design`** — Invoke when creating or modifying UI components, page layouts, styles, or any visual elements. Do not default to generic patterns; use this skill to produce polished, distinctive interfaces.
- **`code-simplifier`** — Run on all modified code before committing. Simplify for clarity and maintainability while preserving functionality.
- **`code-review`** — Run on all changes before committing. Check adherence to project guidelines, CLAUDE.md conventions, and code quality standards.
- **`security-reviewer`** — Run on all changes before committing. Audit for auth issues, injection vulnerabilities, and OWASP top 10 concerns.

The pre-commit sequence is: implement → simplify → review → security audit → commit.

### Completion

When all tasks are complete (or remaining tasks are blocked):

1. Ensure the branch is up to date with `main` (rebase if needed)
2. Run the full CI check: `pnpm lint && pnpm format:check && pnpm typecheck`
3. Run tests: `pnpm test`
4. Open a pull request against `main` using the `/commit-push-pr` skill
5. PR title should match the feature name
6. PR body should summarize completed work and list any blocked tasks with their blockers

## Constraints

- Follow all instructions in CLAUDE.md without exception
- Never modify the prod database branch without explicit confirmation
- Never commit secrets, credentials, or .env files
- Commit frequently — at least once per completed task
- Keep commits focused on a single task
