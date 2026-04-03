# Git Workflow Practice Guide

This guide walks you through the full workflow from creating a feature branch
all the way to production. Follow each step in order.

---

## The Flow You Are Practicing

```
feature/your-name  →  develop  →  staging  →  main (prod)  →  tag
```

---

## STEP 1 — Start from develop

Always start your work from develop, never from main.

```bash
git checkout develop
git pull origin develop
```

---

## STEP 2 — Create your feature branch

Replace `your-feature-name` with something meaningful (e.g. `feature/add-login-page`).

```bash
git checkout -b feature/your-feature-name
```

Verify you are on the new branch:
```bash
git branch
```
You should see a `*` next to your new branch.

---

## STEP 3 — Do your work

Make any change — edit a file, add a file, anything.
Then stage and commit:

```bash
git add .
git commit -m "feat: describe what you did"
```

---

## STEP 4 — Push your branch to GitLab

```bash
git push origin feature/your-feature-name
```

---

## STEP 5 — Open a Merge Request on GitLab

1. Go to GitLab
2. You will see a banner "Create merge request" — click it
3. Set source branch: `feature/your-feature-name`
4. Set target branch: `develop`
5. Add a title and description
6. Assign a reviewer
7. Click **Create Merge Request**

Wait for the reviewer to **Approve** AND **Merge** the MR.

> Remember: Approved is NOT the same as Merged.
> The code only moves when someone clicks the Merge button.

---

## STEP 6 — Clean up your local branch (after MR is merged)

Once GitLab confirms the MR is **Merged**, delete the feature branch locally so it does not cause confusion later.

```bash
# Switch back to develop first (you cannot delete a branch you are currently on)
git checkout develop

# Pull the latest develop (which now includes your merged changes)
git pull origin develop

# Delete your local feature branch
git branch -d feature/your-feature-name
```

> The `-d` flag is safe — it only deletes if the branch has already been merged.
> If Git refuses, it means the branch was NOT yet merged. Do NOT use `-D` (force delete) unless you are certain the work is merged and you intentionally want to discard it.

You can verify your branch is gone:
```bash
git branch
```

---

## STEP 7 — Promote develop to staging

Once the MR is merged into develop, bring it to staging:

```bash
git checkout staging
git pull origin staging
git merge origin/develop
git push origin staging
```

---

## STEP 8 — Test on staging

Deploy and test on the staging server.
If something is wrong, go back to Step 1 with a `fix/` branch.
If everything is good, proceed to Step 9.

---

## STEP 9 — Promote staging to main (production)

```bash
git checkout main
git pull origin main
git merge origin/staging
git push origin main
```

---

## STEP 10 — Tag the release

Replace `v1.x.x` with the actual version number (e.g. `v1.1.0`).

```bash
git tag -a v1.x.x -m "Release v1.x.x - describe what this release contains"
git push origin v1.x.x
```

---

## STEP 11 — Verify everything reached production

Run these commands to confirm all branches are in sync:

```bash
# See all branches pointing to the same commit
git log --oneline --decorate --graph origin/main origin/staging origin/develop | head -10

# Confirm nothing is ahead or behind
git log origin/develop..origin/main --oneline
git log origin/main..origin/develop --oneline
```

The last two commands should return nothing — meaning all branches are equal.

---

## Commit Message Convention

Always prefix your commit messages:

| Prefix | When to use | Example |
|--------|------------|---------|
| `feat:` | New feature | `feat: add leave request form` |
| `fix:` | Bug fix | `fix: resolve 404 on assets route` |
| `docs:` | Documentation | `docs: update workflow guide` |
| `chore:` | Config, cleanup | `chore: update dependencies` |
| `refactor:` | Code restructure | `refactor: simplify auth middleware` |

---

## Quick Reference — Full Flow in One Block

```bash
# 1. Start from develop
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Make changes, then commit
git add .
git commit -m "feat: your message"

# 4. Push branch
git push origin feature/your-feature-name

# 5. Go to GitLab → Open MR → feature/your-feature-name → develop
# Wait for Approval + Merge on GitLab

# 6. After MR is merged — clean up local branch
git checkout develop
git pull origin develop
git branch -d feature/your-feature-name

# 7. Promote to staging
git checkout staging
git pull origin staging
git merge origin/develop
git push origin staging

# 8. Test on staging server, then promote to production
git checkout main
git pull origin main
git merge origin/staging
git push origin main

# 9. Tag the release
git tag -a v1.x.x -m "Release v1.x.x"
git push origin v1.x.x
```

---

## Golden Rules

- Never push directly to `main` or `staging`
- Always pull before starting new work
- Always branch from `develop`
- Fix bugs on `develop`, not on `staging`
- Approve AND Merge are two separate actions on GitLab
- Tag every release on `main`
- Delete your local feature branch after the MR is merged — keep your local repo clean
