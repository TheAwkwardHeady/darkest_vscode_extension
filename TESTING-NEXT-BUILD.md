# Test checklist — combined bug-fix build

1. Open `tests/pending-bugfixes-test.info.darkest` in the Extension Development Host.
2. Empty `.effect` and `.target` parameters should have yellow warnings, not red errors.
3. Empty dynamic mode-effects parameters should have a yellow warning.
4. `.can_apply_on_corpse true` should be recognized without an unknown-parameter error.
5. Monster `skill:` should recognize `.self_target_valid`, `.rank_damage_modifiers`, `.can_be_riposted`, `.can_miss`, `.ignore_stealth`, and `.ignore_riposte`.
6. `display_modifier` properties should remain recognized.

Warnings are intentional for the empty `.effect`, `.target`, and mode-effects test cases. The test file is only a smoke test; it is not intended to be shipped with a mod.
