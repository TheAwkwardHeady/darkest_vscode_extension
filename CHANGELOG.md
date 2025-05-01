# Change Log

All notable changes to the "darkest" extension will be documented in this file.

## [0.0.7] - 2025-04-28

### Added:

- riposte_skill validation.
- extra_battle_loot validation.

### Changed:

- Skill .type only acepted vanilla skill types before, it now accepts custom ones.

### Removed:

- Due to complaint, .on_hit and .on_miss not being present on an effect will no longer be considered a validation error.

### Fixed:

- .move was looking for a string for some reason, works correctly now.
- .rank_damage_modifiers was looking for a string for some reason, works correctly now.
- There was an error in the validation, if a parameter like .mode_effects contained numbers, the entire line was considered to be an error, this has been fixed.
- .target on skills couldn't be blank before, this has been fixed.

## [0.0.8] - 2025-05-01

### Added:

- Completions/suggestions feature.

### Fixed:

- Resolved the visual issue where modes in `.mode_effects` containing numbers (e.g., `vz_ironclad_fiend_0_effects`) did not turn blue like other parameters. This was purely a visual bug; validation and error messages were already functioning correctly.
