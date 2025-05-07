# Change Log

## [0.1.2] - 2025-05-07

### Added:
- Added keyword `rendering` and its parameters to hero/monster file validation.

### Fixed:
- Fixed the Regex for line validation not accepting anything other than a space between parameters and their values, and between values.
- `True/False` will now have the correct colouring, like every other value. This was purely a visual bug.

## [0.1.1] - 2025-05-06

### Fixed:
- Readded missing `.generation_guaranteed` parameter to `combat_skill` keyword.

## [0.1.0] - 2025-05-04
Note: The skipped version number (0.0.9) is due to the large size of the update.

### Added:
- Added validation for monster .info and .art files.
- Added keyword `progression` and its parameters to hero/monster file validation.
- Added keyword `hp_reaction` and its parameters to hero/monster file validation.
- Added keyword `death_reaction` and its parameters to hero/monster file validation.
- Added keyword `sorting_index` and its parameters to hero/monster file validation.
- Added parameters: `.override_stress_removal_amount_low, .override_stress_removal_amount_high` to `activity_modifier` keyword for hero/monster validation.
- Added parameters: `.enter_effects, .enter_effect_round_cooldown` to `deaths_door` keyword for hero/monster validation.
- Added parameter: `.is_valid_effects_target` to `crit` keyword for hero/monster validation.

### Changed:
- `.required_performer_hp_range` of `combat_skill, combat_move_skill` keywords is now a range value rather than a string.
- `.keep_rounds_in_ranks` is now a boolean value rather than a number.
- `.buffs, .recovery_buffs, .recovery_heart_attack_buffs` of `deaths_door` keyword now accept null as a valid value.
- `.shuffletarget, .shuffleparty` now accept null as a valid value.
- `.monsterType` now accepts custom monster types.

### Fixed:
- Incorrect validation values for certain hero .info parameters.
- Fixed a bug where the line would not validate at all if there was space before a keyword (ex. `riposte_skill:`).
- Fixed visual a bug that would cause keywords (ex. `riposte skill:`) to not be coloured correctly if they werent at the start of the line immediately. (ex. a single space before the keyword would cause this)

## [0.0.8] - 2025-05-01

### Added:
- Completions/suggestions feature.

### Fixed:
- Resolved the visual issue where modes in `.mode_effects` containing numbers (e.g., `vz_ironclad_fiend_0_effects`) did were not coloured like other parameters. This was purely a visual bug, validation and error messages were already functioning correctly.

## [0.0.7] - 2025-04-28

### Added:
- `riposte_skill` validation.
- `extra_battle_loot` validation.

### Changed:
- Skill `.type` only acepted vanilla skill types before, it now accepts custom ones.

### Removed:
- Due to complaint, `.on_hit` and `.on_miss` not being present on an effect will no longer be considered a validation error.

### Fixed:
- `.move` was looking for a string for some reason, works correctly now.
- `.rank_damage_modifiers` was looking for a string for some reason, works correctly now.
- There was an error in the validation, if a parameter like .mode_effects contained numbers, the entire line was considered to be an error, this has been fixed.
- `.target` on skills couldn't be blank before, this has been fixed.
