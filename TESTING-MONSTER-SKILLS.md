# Monster skill schema test

Open `tests/monster-skill-schema-test.info.darkest` in the Extension Development Host.

Expected results:
- The `skill:` lines should not report unknown parameters for `.id`, `.atk`, `.dmg`, `.crit`, `.launch`, `.target`, `.move`, `.effect`, or `.is_crit_valid`.
- Autocomplete and hover should recognize the newly added `skill:` parameters.
- The three standard skill definitions and the separate `skill: ... .effect ...` definitions should be accepted.
- The `riposte_skill:` example should continue to work as before.
- Existing validation for unrelated parameters should remain active.

This fixture tests extension recognition and validation only; it does not run the game or verify in-game behavior.
