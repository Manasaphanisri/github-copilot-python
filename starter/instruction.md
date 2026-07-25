# Copilot Instructions for the Flask Sudoku Project

## Project context
- This is a legacy Python Flask Sudoku application with game logic in sudoku_logic.py and routes in app.py.
- Preserve the current gameplay experience and existing API behavior while refactoring or adding features.
- Prefer minimal, low-risk changes that do not break existing functionality.

## Coding guidelines
- Follow Python best practices, including PEP 8 naming, clear function structure, and readable formatting.
- Keep the code modular and reusable. Separate concerns where possible, especially between game logic, route handlers, and UI-related behavior.
- Write maintainable code with small, focused functions rather than large monolithic blocks.
- Add clear comments where they help explain non-obvious logic, especially in puzzle generation and validation.
- Use consistent and user-friendly error handling. Avoid silent failures and return clear errors when input or game state is invalid.

## Refactoring guidance
- Preserve existing Sudoku functionality while improving structure and readability.
- Keep Flask routes simple and delegate game rules to reusable helper functions.
- Avoid unnecessary dependency changes or framework overhauls.
- Maintain backward compatibility with the current templates and client-side behavior where possible.

## Feature implementation guidance
- Difficulty levels: support multiple puzzle difficulties by adjusting clue count and puzzle complexity in a consistent way.
- Timer: add a simple timer for gameplay without disrupting the existing flow.
- Hints: provide a hint mechanism that reveals a correct value from the solution safely and clearly.
- Leaderboard: implement a Top 10 leaderboard using browser local storage, keeping it simple and lightweight.
- Dark mode: add a clean dark theme that works well with the existing UI and does not break responsiveness.
- Responsive UI: ensure the board and controls remain usable on smaller screens.
- Unique Sudoku generation: ensure generated puzzles are valid and have a unique solution when possible.

## Testing and quality
- Recommend writing tests for new features and for any refactored logic, especially puzzle generation, validation, and hint behavior.
- Prefer simple unit tests for core Sudoku logic before introducing larger UI changes.
- Keep changes well-scoped and easy to verify.