# Code style requirements

## Code style
- Use functional and reactive patterns aligned with Svelte's reactive declarations
- Keep components small and focused on single responsibility (max 150 lines per component)
- Prefer composition over inheritance
- Use descriptive variable names that convey intent (avoid abbreviations)
- Extract complex logic into separate utility functions
- Avoid deep nesting (max 3 levels)
- Write pure functions where possible (no side effects unless necessary)
- Use TypeScript enums for fixed value sets (wine types, actions, currencies)
- Prefer explicit exports over default exports

## Code documentation
- Add JSDoc comments for all exported functions, types, and interfaces
- Document complex business logic (e.g., history-based quantity calculation, conflict resolution)
- Document component props using JSDoc in `<script lang="ts">` blocks
- Add comments explaining non-obvious reactive declarations (`$:` statements)
- Keep inline comments focused on "why" not "what" (code should be self-documenting)
- Document data sync flow and GitHub API integration patterns
- Maintain up-to-date README with setup instructions for GitHub PAT configuration

## Formatting
- Use Prettier for all code formatting (enforce via IDE and CI)
- Prettier config: 2-space indentation, single quotes, trailing commas (ES5), line width 100
- Format all files before commit (`.js`, `.ts`, `.svelte`, `.json`, `.md`)
- Use Svelte plugin for Prettier to handle `.svelte` file formatting
- Enforce consistent import ordering: built-ins, external, internal, relative
- Group related code with blank lines for readability

## Linting
- Use ESLint with strict TypeScript and Svelte plugins
- Enforce `@typescript-eslint/strict` preset for maximum type safety
- Enable `eslint-plugin-svelte` for Svelte-specific linting rules
- Treat all warnings as errors in CI (zero tolerance policy)
- Enable accessibility linting rules (`eslint-plugin-a11y`) for mobile-first UX
- Disallow unused variables, unused imports, and console statements in production
- Require explicit return types for exported functions
- Enforce consistent naming conventions (camelCase for variables, PascalCase for types/components)

## Typing
- Use TypeScript for all source code (`.ts` and `.svelte` files)
- Enable strict mode in `tsconfig.json` (`strict: true`, `noImplicitAny: true`)
- Define explicit types for all function parameters and return values
- Create type definitions for all data models (Bottle, HistoryEntry, SyncStatus)
- Use discriminated unions for action types and sync states
- Avoid `any` type (use `unknown` and type guards when type is uncertain)
- Prefer interfaces for data shapes, type aliases for unions/intersections
- Define separate types for API responses vs internal application state
- Use readonly modifiers for immutable data structures
