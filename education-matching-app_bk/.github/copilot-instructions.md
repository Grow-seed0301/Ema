# GitHub Copilot Custom Instructions

## 1. Coding Style & Conventions
- **Preserve Existing Style:** Strictly adhere to the existing coding patterns and conventions found in the codebase. Do not introduce new formatting styles or structural patterns unless explicitly requested.
- **Strict Naming Conventions:** Always use the project's established naming conventions (e.g., camelCase, snake_case, or PascalCase) as seen in the surrounding files.
- **No Unsolicited Refactoring:** Do not suggest or perform refactoring to "improve" code style if it deviates from the current project standards. Focus only on the requested logic or fix.
- **Formatting:** Follow the indentation (tabs vs spaces), line length, and bracket placement observed in the current file.

## 2. Best Practices
- **Consistency over Novelty:** Prioritize consistency with the local code over "modern" syntax if the project uses a specific version of a language or framework.
- **Library Usage:** Use the same libraries and utility functions already present in the project instead of introducing new dependencies.

## 3. Language Specifics
- Follow the rules defined in `.editorconfig`, `eslint.config.js`, `prettierrc`, or other linting files present in the root directory.
