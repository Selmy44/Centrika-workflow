# Git Workflow

This document defines the branching strategy and collaboration workflow for all projects.

---

## Branch Structure

| Branch | Purpose | Deployed to |
|--------|---------|-------------|
| `main` | Production-ready code only | Production server |
| `staging` | Integration & QA testing | Staging server |
| `develop` | Active development | Dev/local |
| `feature/*` | New features | Local only |
| `fix/*` | Bug fixes | Local only |

---

## Flow

```
feature/* or fix/*  →  develop  →  staging  →  main (prod)
```

---

## Step-by-Step Workflow

### 1. Starting new work (feature or fix)

Always branch from `develop`:

```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-name
```

### 2. Do your work and commit

```bash
git add .
git commit -m "feat: describe your feature"
# or
git commit -m "fix: describe what you fixed"
```

### 3. Push your branch

```bash
git push origin feature/your-feature-name
```

### 4. Open a Merge Request on GitLab

- Source: `feature/your-feature-name`
- Target: `develop`
- Assign another developer to review and approve
- Never merge your own MR

### 5. Promote to staging for testing

Once MR is merged into `develop`:

```bash
git checkout staging
git pull origin staging
git merge origin/develop
git push origin staging
```

Staging server pulls and rebuilds. QA testing happens here.

### 6. Promote to production

Once staging is approved:

```bash
git checkout main
git pull origin main
git merge origin/staging
git push origin main
git tag -a v1.x.x -m "Release v1.x.x"
git push origin v1.x.x
```

Production server pulls and rebuilds.

---

## Golden Rules

- Never push directly to `main` or `staging` — only via Merge Requests
- Always pull before starting new work
- Always branch from `develop`
- Fix bugs on `develop`, not `staging`
- `main` must always be stable and deployable
- Tag every production release for easy rollback

---

## Commit Message Convention

| Prefix | When to use |
|--------|------------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `chore:` | Config, deps, cleanup |
| `docs:` | Documentation only |
| `refactor:` | Code restructure, no behavior change |

Example:
```bash
git commit -m "feat: add leave request approval flow"
git commit -m "fix: resolve 404 on /assets route reload"
```
