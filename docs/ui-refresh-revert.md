# Reversible contrast refresh — October 17, 2026

User asked for a light/dark visual refresh that can be reverted independently.

## Keep the feature changes
- Main functional checkpoint: 0eef81f.
- Standalone functional checkpoint: 4f06501.
- These checkpoints include moving the three latest destinations into Map search.
- Standalone also includes explicit Switch to Map confirmation, a smaller readable Llama footer, and the whole-card Assistant shortcut with voice icon.

## Visual-only commit
Find the commit titled **Refresh light and dark contrast with petrol and ivory accents** on the respective branch. Revert only that commit if requested; do not reset to an earlier branch head or revert the functional checkpoint.

Visual scope:
- src/theme/colors.ts: deeper petrol dark surfaces, cleaner light neutrals, forest/sage controls, stronger text/borders, warm ivory feature actions.
- src/screens/HomeScreen.tsx: prominent Assistant/search surface, clearer section rhythm, contrasting drive action and saved-place tiles.
- src/components/TabBar.tsx: clearer active state and more defined navigation shape.
- tests/contrast-refresh.test.cjs: contrast checks for the new palette.

No dependencies, image downloads, animation work, model loading, routing logic, user data, or platform configuration changed in the visual-only commit.

Browser control timed out during local inspection. Type and contrast tests are not a substitute for phone-rendered verification; ask the user to check both themes before treating the visual direction as accepted.
