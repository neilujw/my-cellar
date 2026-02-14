# Dependency Management

- Only add a dependency if it adds value and reduces overhead or complexity
- Pin exact versions (use exact version in `package.json`, not `^` or `~`)
- Prefer stable releases (avoid pre-release, alpha, beta versions)
- Prefer maintained and widely adopted libraries (check GitHub stars, last commit date, npm downloads)
- Use Vite-native and Svelte ecosystem packages when available (better integration and DX)
- Evaluate trade-offs: dependency maintenance cost vs custom code maintenance burden
- Use established libraries for complex problems (auth, state management, data sync)
- Prefer dependencies with good TypeScript support and type definitions
- All dependencies must be compatible with Vite's build process
- Regularly audit dependencies for security vulnerabilities (`npm audit`)
- Remove unused dependencies immediately
- Document dependency rationale when non-obvious (why this library solves the problem better)
