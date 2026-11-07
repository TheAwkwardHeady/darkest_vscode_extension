# darkest_vscode_extension
A VSCode extension for Darkest Dungeon's .darkest files/language.

## Current Features:
- Code Validation (hero, monster and effects files)
- Effect Generation
- Buff Generation
- Suggestions/completions
- Keyword/Parameter Glossary (hover over information)
- Custom Tooltip generation
- Zero-Width Space Generation and Handling tool

## Recent authoring support

The extension's `.darkest` glossary and validation now include the newer effect fields for popup and bark suppression, percent-of-max-HP damage, tooltip localization overrides, quirk-tag and mortality cures, required status and buff source checks, trinket trigger-limit changes, combat loot, and Burn cures. Effect targets include random heroes, adjacent ranks relative to the performer or target, and the other equipped trinket.

`.dotShuffle 1` (Stumble) checks move resistance but its chance does not scale with Move Chance. This is game behavior; the extension documents it but cannot change the game's calculation.

Buff authoring support includes the `Force_negative` boolean field (and the lowercase `force_negative` spelling) and the stat types `effect_chance`, `crit_dmg_multiply`, `crit_dmg_add`, `hp_heal_amount_received`, `heal_crit_chance_add`, and `heal_crit_chance_multiply`. For `riposte` buffs, `stat_sub_type` may be an effect ID; completion suggests IDs found in effects files in the opened workspace.

Trinket entries use their `*_additional_effects` trigger fields. Buff definitions use their separate `*_additional_effect_ids` fields for attack, friendly skill, crit, melee/ranged attack, riposte, dodge, hit, kill, death, turn, round, battle, quest, combat start, and move-skill triggers. Combat skill glossary support also includes `.ai_valid`.

`.info` files use the Darkest language support. In `.effect` and `.effects` values, completion suggests matching effect IDs discovered in effects files in the opened workspace.

The effect attributes `.buff_source_type`, `.dotSource`, and `.steal_buff_source_type` share the valid buff-source list; the same values are offered by completion and checked by validation.

## Planned Features:
- Cross-file referencing code referencing (ex.: for autocompletion and validation)
- Cross-file Navigation (If possible) (ex.: CTRL+Click effect name)
- String Table Validation and Autocomplete (colours, bark string types, etc) and string generation options
