# Feature: GitHub Integration - Settings & Authentication

Decision made on 2026-02-15

## Feature overview
Settings view for configuring GitHub private repository connection with PAT authentication, connection testing, and credential management.

## Context
Step 6 of the roadmap requires implementing GitHub integration settings. Several decisions needed to be made about the API client library, repository format, PAT storage approach, connection test scope, and UI behavior.

## Decision
- **API client**: Use Octokit (official GitHub SDK) for its TypeScript support, maintenance, and reliability, despite the ~10kb bundle size increase.
- **Repository format**: Accept `owner/repo` shorthand rather than full URLs for simpler input and validation.
- **PAT storage**: Store in plain localStorage. Client-side encryption would be security theater since the encryption key must also be stored in the browser.
- **Connection test**: Verify PAT validity, repo existence, and read/write permissions to catch issues early before first sync.
- **Disconnect**: Include an explicit disconnect button to clear credentials, giving users control over stored sensitive data.
- **Test feedback**: Show simple success/failure messages (no detailed repo metadata display).
- **Bundle size target**: Raised from 15-20kb to 50kb to accommodate Octokit and future sync features.
