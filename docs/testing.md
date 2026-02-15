# Testing requirements

- Tests exist to prove *observable behavior* and prevent regressions, not to validate implementation details
- Tests must follow the Arrange-Act-Assert pattern
- Each feature must test: happy path, failure cases, edge cases and invariants
- Use Vitest as the test runner (native Vite integration, fast, TypeScript support)
- Use `@testing-library/svelte` for component testing (user-centric, behavior-focused)
- Maintain minimum 80% code coverage for critical business logic (data models, sync logic)
- Test all data transformations (history calculation, duplicate detection, conflict resolution)
- Test GitHub API integration with mocked responses (avoid real API calls in tests)
- Test offline/online sync scenarios (local changes, remote changes, conflicts)
- Test currency handling and price calculations
- Write integration tests for complete user flows (add bottle, consume bottle, sync)
- Component tests should verify rendered output and user interactions, not internal state
- Use descriptive test names: "should [expected behavior] when [condition]"
- Group related tests using `describe` blocks by feature/component
- Run tests in watch mode during development
- Run full test suite in CI before allowing merges
- Test bundle size constraints (fail if bundle exceeds 50kb)
- Avoid snapshot testing (brittle, doesn't prove behavior)
