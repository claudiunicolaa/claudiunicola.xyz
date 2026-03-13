---
title: "Using Private Go Modules with golangci-lint in GitHub Actions"
date: 2024-01-05
summary: "A practical guide to configuring GitHub Actions for Go projects that use private modules alongside golangci-lint."
tags:
  - golang
  - github-actions
  - ci-cd
  - devops
keywords:
  - golangci-lint private modules
  - Go GitHub Actions
  - private Go modules CI
  - golang CI/CD pipeline
  - GitHub Actions Go setup
og_image: ""
---

If you're working with **private Go modules** and using `golangci-lint` in your CI pipeline, you've probably hit the authentication wall. Here's how to solve it cleanly in GitHub Actions.

## The Problem

When `golangci-lint` runs in GitHub Actions, it needs to fetch your private Go modules. By default, `go` commands can't access private repositories without proper authentication.

## The Solution

Configure `GOPRIVATE` and set up Git credentials before running the linter.

```yaml
- name: Configure git for private modules
  run: |
    git config --global url."https://${{ secrets.GH_TOKEN }}@github.com/".insteadOf "https://github.com/"

- name: Set GOPRIVATE
  run: echo "GOPRIVATE=github.com/your-org/*" >> $GITHUB_ENV

- name: Run golangci-lint
  uses: golangci/golangci-lint-action@v3
  with:
    version: latest
```

## Key Takeaways

1. Always set `GOPRIVATE` to skip the Go module proxy for your private repos
2. Use `insteadOf` git config to inject authentication tokens
3. Place the git configuration step **before** any Go-related steps

This approach keeps your CI pipeline clean and avoids leaking credentials.
