type Schema = {
  type: "string" | "number" | "boolean" | "string_list" | "number_list" | "range";
  monsterType?: "string" | "number" | "boolean" | "string_list" | "number_list" | "range";
  description?: string;
  allowed_values?: string[] | number[] | boolean[];
  required?: boolean;
  canBeNull?: boolean;
};

export const GAME_MECHANICS_SCHEMA: {
  [key: string]: {
    [key: string]: Schema;
  };
} = {
  effect: {
    ".name": {
      type: "string",
      description: "The unique identifier for the effect.",
    },
    ".target": {
      type: "string",
      allowed_values: [
        "performer",
        "performer_group",
        "performer_group_other",
        "target",
        "target_group",
        "target_group_other",
        "target_enemy_group",
        "global",
      ],
      description: "Specifies the target of the effect.",
    },
    ".curio_result_type": {
      type: "string",
      allowed_values: ["positive", "negative", "neutral", "none"],
      description: "The result type for curio interactions.",
    },
    ".chance": {
      type: "number",
      description: "The probability of the effect occurring.",
    },
    ".on_hit": {
      type: "boolean",
      description: "Indicates if the effect triggers on a hit.",
    },
    ".on_miss": {
      type: "boolean",
      description: "Indicates if the effect triggers on a miss.",
    },
    ".queue": {
      type: "boolean",
      description: "Indicates if the effect should be queued.",
    },
    ".dotBleed": {
      type: "number",
      description: "The bleed damage over time value.",
    },
    ".dotPoison": {
      type: "number",
      description: "The poison damage over time value.",
    },
    ".dotStress": {
      type: "number",
      description: "The stress damage over time value.",
    },
    ".stress": {
      type: "number",
      description: "The stress value applied by the effect.",
    },
    ".healstress": {
      type: "number",
      description: "The amount of stress healed by the effect.",
    },
    ".combat_stat_buff": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Indicates if the effect applies a combat stat buff.",
    },
    ".damage_low_multiply": {
      type: "number",
      description: "Multiplier for the lower bound of damage.",
    },
    ".damage_high_multiply": {
      type: "number",
      description: "Multiplier for the upper bound of damage.",
    },
    ".max_hp_multiply": {
      type: "number",
      description: "Multiplier for maximum HP.",
    },
    ".attack_rating_add": {
      type: "number",
      description: "Value added to the attack rating.",
    },
    ".crit_chance_add": {
      type: "number",
      description: "Value added to the critical hit chance.",
    },
    ".defense_rating_add": {
      type: "number",
      description: "Value added to the defense rating.",
    },
    ".protection_rating_add": {
      type: "number",
      description: "Value added to the protection rating.",
    },
    ".speed_rating_add": {
      type: "number",
      description: "Value added to the speed rating.",
    },
    ".buff_ids": {
      type: "string_list",
      description: "List of buff IDs applied by the effect.",
    },
    ".duration": {
      type: "number",
      description: "Duration of the effect in turns.",
    },
    ".dotHpHeal": {
      type: "number",
      description: "Healing over time value for HP.",
    },
    ".heal": {
      type: "number",
      description: "The amount of HP healed by the effect.",
    },
    ".heal_percent": {
      type: "number",
      description: "Percentage of HP healed by the effect.",
    },
    ".can_crit_heal": {
      type: "boolean",
      description: "Indicates if the heal can critically strike.",
    },
    ".cure": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Indicates if the effect cures a condition.",
    },
    ".cure_bleed": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Indicates if the effect cures bleeding.",
    },
    ".cure_poison": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Indicates if the effect cures poison.",
    },
    ".clearDotStress": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Indicates if the effect clears stress damage over time.",
    },
    ".tag": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Indicates if the effect applies a tag.",
    },
    ".untag": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Indicates if the effect removes a tag.",
    },
    ".stun": {
      type: "number",
      description: "The stun value applied by the effect.",
    },
    ".unstun": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Indicates if the effect removes a stun.",
    },
    ".keyStatus": {
      type: "string",
      //allowed_values: [
      //  "tagged",
      //  "poisoned",
      //  "bleeding",
      //  "stunned",
      //  "dazed",
      //  "virtued",
      //  "afflicted",
      //  "transformed",
      //],
      description: "The key status applied or checked by the effect.",
    },
    ".riposte": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Indicates if the effect enables riposte.",
    },
    ".riposte_on_miss_chance_add": {
      type: "number",
      description: "Chance added to riposte on a miss.",
    },
    ".riposte_on_hit_chance_add": {
      type: "number",
      description: "Chance added to riposte on a hit.",
    },
    ".riposte_on_miss_chance_multiply": {
      type: "number",
      description: "Multiplier for riposte chance on a miss.",
    },
    ".riposte_on_hit_chance_multiply": {
      type: "number",
      description: "Multiplier for riposte chance on a hit.",
    },
    ".riposte_effect": {
      type: "string",
      description: "The effect ID triggered by riposte.",
    },
    ".clear_riposte": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Indicates if the effect clears riposte.",
    },
    ".guard": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Indicates if the effect enables guarding.",
    },
    ".clearguarding": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Indicates if the effect clears guarding.",
    },
    ".clearguarded": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Indicates if the effect clears guarded status.",
    },
    ".torch_decrease": {
      type: "number",
      description: "The amount by which the torch level decreases.",
    },
    ".torch_increase": {
      type: "number",
      description: "The amount by which the torch level increases.",
    },
    ".item": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Indicates if the effect applies to an item.",
    },
    ".curio": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Indicates if the effect applies to a curio.",
    },
    ".dotShuffle": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Indicates if the effect shuffles the target.",
    },
    ".push": {
      type: "number",
      description: "The push value applied by the effect.",
    },
    ".pull": {
      type: "number",
      description: "The pull value applied by the effect.",
    },
    ".shuffletarget": {
      type: "boolean",
      description: "Indicates if the target is shuffled.",
      canBeNull: true
    },
    ".shuffleparty": {
      type: "boolean",
      description: "Indicates if the party is shuffled.",
      canBeNull: true
    },
    ".destealth": {
      type: "boolean",
      description: "Indicates if the effect removes stealth.",
      allowed_values: [1, 0],
    },
    ".instant_shuffle": {
      type: "boolean",
      description: "Indicates if the shuffle is instant.",
    },
    ".buff_amount": {
      type: "number",
      description: "The amount of the buff applied.",
    },
    ".buff_type": {
      type: "string",
      description: "The type of buff applied.",
    },
    ".buff_sub_type": {
      type: "string",
      description: "The subtype of buff applied.",
    },
    ".buff_duration_type": {
      type: "string",
      description: "The duration type of the buff.",
    },
    ".steal_buff_stat_type": {
      type: "string",
      description: "The stat type of the buff to steal.",
    },
    ".hp_dot_bleed": {
      type: "number",
      description: "The bleed damage over time applied to HP.",
    },
    ".hp_dot_poison": {
      type: "number",
      description: "The poison damage over time applied to HP.",
    },
    ".hp_dot_heal": {
      type: "number",
      description: "The healing over time applied to HP.",
    },
    ".stress_dot": {
      type: "number",
      description: "The stress damage over time applied.",
    },
    ".shuffle_dot": {
      type: "number",
      description: "The shuffle effect applied over time.",
    },
    ".steal_buff_source_type": {
      type: "string",
      description: "The source type of the buff to steal.",
    },
    ".swap_source_and_target": {
      type: "boolean",
      description: "Indicates if the source and target are swapped.",
    },
    ".kill": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Indicates if the effect kills the target.",
    },
    ".immobilize": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Indicates if the effect immobilizes the target.",
    },
    ".unimmobilize": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Indicates if the effect removes immobilization.",
    },
    ".control": {
      type: "number",
      description: "The control value applied by the effect.",
    },
    ".uncontrol": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Indicates if the effect removes control.",
    },
    ".kill_enemy_types": {
      type: "string",
      description: "Specifies the enemy types killed by the effect.",
    },
    ".monsterType": {
      type: "string",
      description: "Specifies the monster type affected by the effect.",
    },
    ".capture": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Indicates if the effect captures the target.",
    },
    ".capture_remove_from_party": {
      type: "boolean",
      allowed_values: [1, 0],
      description:
        "Indicates if the captured target is removed from the party.",
    },
    ".disease": {
      type: "string",
      description: "Specifies the disease applied by the effect.",
    },
    ".remove_vampire": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Indicates if the effect removes vampirism.",
    },
    ".summon_monsters": {
      type: "string_list",
      description: "List of monster IDs summoned by the effect.",
    },
    ".summon_chances": {
      type: "number_list",
      description: "The chance of summoning monsters.",
    },
    ".summon_ranks": {
      type: "number",
      description: "The ranks of monsters summoned.",
    },
    ".summon_limits": {
      type: "number",
      description: "The limit on the number of monsters summoned.",
    },
    ".summon_count": {
      type: "number",
      description: "The count of monsters summoned.",
    },
    ".summon_erase_data_on_roll": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Indicates if summon data is erased on roll.",
    },
    ".summon_can_spawn_loot": {
      type: "boolean",
      description: "Indicates if summoned monsters can spawn loot.",
    },
    ".summon_rank_is_previous_monster_class": {
      type: "boolean",
      description:
        "Indicates if summon rank is based on the previous monster class.",
    },
    ".summon_does_roll_initiatives": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Indicates if summoned monsters roll initiatives.",
    },
    ".crit_doesnt_apply_to_roll": {
      type: "boolean",
      description: "Indicates if critical hits don't apply to rolls.",
    },
    ".virtue_blockable_chance": {
      type: "number",
      description: "The chance of blocking virtue.",
    },
    ".affliction_blockable_chance": {
      type: "number",
      description: "The chance of blocking affliction.",
    },
    ".set_mode": {
      type: "string",
      description: "Specifies the mode set by the effect.",
    },
    ".can_apply_on_death": {
      type: "boolean",
      description: "Indicates if the effect can apply on death.",
    },
    ".apply_once": {
      type: "boolean",
      description: "Indicates if the effect applies only once.",
    },
    ".rank_target": {
      type: "string",
      description: "Specifies the rank target of the effect.",
    },
    ".clear_rank_target": {
      type: "string",
      description: "Specifies the rank target cleared by the effect.",
    },
    ".performer_rank_target": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Indicates if the performer rank is targeted.",
    },
    ".apply_with_result": {
      type: "boolean",
      description: "Indicates if the effect applies with a result.",
    },
    ".initiative_change": {
      type: "number",
      description: "The change in initiative caused by the effect.",
    },
    ".source_heal_type": {
      type: "string",
      description: "Specifies the source type of healing.",
    },
    ".skill_instant": {
      type: "boolean",
      description: "Indicates if the skill is instant.",
    },
    ".actor_dot": {
      type: "string",
      description: "Specifies the actor dot ID applied by the effect.",
    },
    ".health_damage": {
      type: "number",
      description: "The health damage applied by the effect.",
    },
    ".bark": {
      type: "string",
      description: "Specifies the bark string entry triggered by the effect.",
    },
    ".set_monster_class_id": {
      type: "string",
      description: "Specifies the monster class ID set by the effect.",
    },
    ".set_monster_class_ids": {
      type: "string_list",
      description: "List of monster class IDs set by the effect.",
    },
    ".set_monster_class_chances": {
      type: "number",
      description: "The chances of setting monster classes.",
    },
    ".set_monster_class_reset_hp": {
      type: "boolean",
      description: "Indicates if monster class reset affects HP.",
    },
    ".set_monster_class_reset_buffs": {
      type: "boolean",
      description: "Indicates if monster class reset affects buffs.",
    },
    ".set_monster_class_carry_over_hp_min_percent": {
      type: "number",
      description:
        "Minimum HP percentage carried over during monster class reset.",
    },
    ".set_monster_class_clear_initative": {
      type: "boolean",
      description: "Indicates if monster class reset clears initiative.",
    },
    ".set_monster_class_clear_monster_brain_cooldowns": {
      type: "boolean",
      description: "Indicates if monster class reset clears brain cooldowns.",
    },
    ".set_monster_class_reset_scale": {
      type: "boolean",
      description: "Indicates if monster class reset affects scaling.",
    },
    ".has_description": {
      type: "boolean",
      description: "Indicates if the effect has a description.",
    },
    ".stealth": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Indicates if the effect applies stealth.",
    },
    ".unstealth": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Indicates if the effect removes stealth.",
    },
    ".clear_debuff": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Indicates if the effect clears debuffs.",
    },
    ".health_damage_blocks": {
      type: "number",
      description: "The amount of health damage blocked by the effect.",
    },
    ".dotSource": {
      type: "string",
      description: "Specifies the source of the damage over time.",
    },
    ".buff_source_type": {
      type: "string",
      description: "Specifies the source type of the buff.",
    },
    ".use_item_id": {
      type: "string",
      description: "Specifies the item ID used by the effect.",
    },
    ".use_item_type": {
      type: "string",
      description: "Specifies the item type used by the effect.",
    },
    ".skips_endless_wave_curio": {
      type: "boolean",
      description: "Indicates if the effect skips endless wave curio.",
    },
    ".spawn_target_actor_base_class_id": {
      type: "string",
      description: "Specifies the base class ID of the target actor spawned.",
    },
    ".clearvirtue": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Indicates if the effect clears virtue.",
    },
    ".riposte_validate": {
      type: "boolean",
      description: "Indicates if riposte validation is enabled.",
    },
    ".buff_is_clear_debuff_valid": {
      type: "boolean",
      description: "Indicates if clearing debuffs is valid for the buff.",
    },
    ".refreshes_skill_uses": {
      type: "boolean",
      description: "Indicates if the effect refreshes skill uses.",
    },
    ".cure_disease": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Indicates if the effect cures a disease.",
    },
    ".individual_target_actor_rolls": {
      type: "boolean",
      description: "Indicates if individual target actor rolls are enabled.",
    },
    ".damage_type": {
      type: "string",
      description: "Specifies the type of damage applied.",
    },
    ".damage_source_type": {
      type: "string",
      description: "Specifies the source type of the damage.",
    },
    ".damage_source_data": {
      type: "string",
      description:
        "Specifies the data for the damage source, e.g., monster ID or trinket ID.",
    },
    ".daze": {
      type: "number",
      description: "Indicates if the effect applies daze.",
    },
    ".undaze": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Indicates if the effect removes daze.",
    },
    ".apply_on_death": {
      type: "boolean",
      description: "Indicates if the effect applies on death.",
    },
  },
  combat_skill: {
    ".id": {
      type: "string",
      description: "Skill name identifier",
    },
    ".dmg": {
      type: "number",
      description: "Damage range for monsters or value for heroes",
    },
    ".atk": {
      type: "number",
      description: "Attack value",
    },
    ".move": {
      type: "range",
      description: "Movement values",
    },
    ".crit": {
      type: "number",
      description: "Critical hit value",
    },
    ".level": {
      type: "number",
      description: "Skill level value",
    },
    ".type": {
      type: "string",
      description: "Skill type",
      //allowed_values: ["melee", "ranged", "move", "teleport", ""],
    },
    ".per_battle_limit": {
      type: "number",
      description: "Limit per battle",
    },
    ".per_turn_limit": {
      type: "number",
      description: "Limit per turn",
    },
    ".is_continue_turn": {
      type: "boolean",
      description: "Whether the skill continues the turn",
    },
    ".launch": {
      type: "string",
      description: "Launch ranks",
    },
    ".target": {
      type: "string",
      description: "Target ranks",
      canBeNull: true,
    },
    ".self_target_valid": {
      type: "boolean",
      description: "Whether self-targeting is valid",
    },
    ".is_crit_valid": {
      type: "boolean",
      description: "Whether critical hits are valid",
    },
    ".effect": {
      type: "string_list",
      description: "Effect IDs",
    },
    ".valid_modes": {
      type: "string_list",
      description: "Valid mode IDs",
    },
    ".generation_guaranteed": {
      type: "boolean",
      description: "Whether generation is guaranteed",
    },
    ".ignore_stealth": {
      type: "boolean",
      description: "Whether the skill ignores stealth",
    },
    ".ignore_guard": {
      type: "boolean",
      description: "Whether the skill ignores guard",
    },
    ".can_miss": {
      type: "boolean",
      description: "Whether the skill can miss",
    },
    ".can_be_riposted": {
      type: "boolean",
      description: "Whether the skill can be riposted",
    },
    ".ignore_protection": {
      type: "boolean",
      description: "Whether the skill ignores protection",
    },
    ".required_performer_hp_range": {
      type: "range",
      description: "Required HP range for the performer",
    },
    ".rank_damage_modifiers": {
      type: "number_list",
      description: "Damage modifiers for ranks",
    },
    ".heal": {
      type: "range",
      description: "Healing range",
    },
    ".can_crit_heal": {
      type: "boolean",
      description: "Whether critical healing is possible",
    },
    ".is_stall_invalidating": {
      type: "boolean",
      description: "Whether the skill invalidates stalling",
    },
    ".refresh_after_each_wave": {
      type: "boolean",
      description: "Whether the skill refreshes after each wave",
    },
    ".damage_heal_base_class_ids": {
      type: "string_list",
      description: "Base class IDs for damage or healing",
    },
    ".ignore_deathsdoor": {
      type: "boolean",
      description: "Whether the skill ignores death's door",
    },
    ".icon": {
      type: "string",
      description: "Icon name",
    },
    ".anim": {
      type: "string",
      description: "Animation name",
    },
    ".fx": {
      type: "string",
      description: "Effect name",
    },
    ".targfx": {
      type: "string",
      description: "Target effect name",
    },
    ".targheadfx": {
      type: "string",
      description: "Target head effect name",
    },
    ".targchestfx": {
      type: "string",
      description: "Target chest effect name",
    },
    ".misstargfx": {
      type: "string",
      description: "Missed target effect name",
    },
    ".misstargheadfx": {
      type: "string",
      description: "Missed target head effect name",
    },
    ".misstargchestfx": {
      type: "string",
      description: "Missed target chest effect name",
    },
    ".area_pos_offset": {
      type: "range",
      description: "Area position offset (X, Y)",
    },
    ".target_area_pos_offset": {
      type: "range",
      description: "Target area position offset (X, Y)",
    },
    ".reset_source_stance": {
      type: "boolean",
      description: "Whether the source stance is reset",
    },
    ".reset_target_stance": {
      type: "boolean",
      description: "Whether the target stance is reset",
    },
    ".can_display_selection": {
      type: "boolean",
      description: "Whether the selection can be displayed",
    },
    ".hide_performer_health": {
      type: "boolean",
      description: "Whether the performer's health is hidden",
    },
    ".condensed_tooltip_effects": {
      type: "boolean",
      description: "Whether effects are condensed in the tooltip",
    },
    ".condensed_tooltip_stats": {
      type: "boolean",
      description: "Whether stats are condensed in the tooltip",
    },
    ".condensed_tooltip_type": {
      type: "boolean",
      description: "Whether type is condensed in the tooltip",
    },
    ".condensed_tooltip_effects_per_line": {
      type: "number",
      description: "Number of effects per line in the tooltip",
    },
    ".nil": {
      type: "boolean",
      description: "Hides skill stats and other information",
    },
    ".custom_target_anim": {
      type: "string",
      description: "Custom target animation name",
    },
    ".custom_idle_anim_name": {
      type: "string",
      description: "Custom idle animation name",
    },
    ".custom_idle_round_duration": {
      type: "number",
      description: "Custom idle round duration",
    },
    ".can_display_performer_selection_after_turn": {
      type: "boolean",
      description: "Whether performer selection can be displayed after turn",
    },
    ".ignore_riposte": {
      type: "boolean",
      description: "Whether the skill ignores riposte",
    }
  },
  combat_move_skill: {
    ".id": {
      type: "string",
      description: "Skill name identifier",
    },
    ".dmg": {
      type: "string",
      description: "Damage range for monsters or value for heroes",
    },
    ".atk": {
      type: "number",
      description: "Attack value",
    },
    ".move": {
      type: "range",
      description: "Movement values",
    },
    ".crit": {
      type: "number",
      description: "Critical hit value",
    },
    ".level": {
      type: "number",
      description: "Skill level value",
    },
    ".type": {
      type: "string",
      description: "Skill type",
      //allowed_values: ["melee", "ranged", "move", "teleport", ""],
    },
    ".starting_cooldown": {
      type: "number",
      description: "Starting cooldown value",
    },
    ".per_battle_limit": {
      type: "number",
      description: "Limit per battle",
    },
    ".per_turn_limit": {
      type: "number",
      description: "Limit per turn",
    },
    ".is_continue_turn": {
      type: "boolean",
      description: "Whether the skill continues the turn",
    },
    ".launch": {
      type: "string",
      description: "Launch ranks",
    },
    ".target": {
      type: "string",
      description: "Target ranks",
      canBeNull: true,
    },
    ".self_target_valid": {
      type: "boolean",
      description: "Whether self-targeting is valid",
    },
    ".extra_targets_chance": {
      type: "number",
      description: "Chance for extra targets",
    },
    ".extra_targets_count": {
      type: "number",
      description: "Count of extra targets",
    },
    ".is_crit_valid": {
      type: "boolean",
      description: "Whether critical hits are valid",
    },
    ".effect": {
      type: "string_list",
      description: "Effect IDs",
    },
    ".valid_modes": {
      type: "string_list",
      description: "Valid mode IDs",
    },
    ".ignore_stealth": {
      type: "boolean",
      description: "Whether the skill ignores stealth",
    },
    ".ignore_guard": {
      type: "boolean",
      description: "Whether the skill ignores guard",
    },
    ".can_miss": {
      type: "boolean",
      description: "Whether the skill can miss",
    },
    ".can_be_riposted": {
      type: "boolean",
      description: "Whether the skill can be riposted",
    },
    ".ignore_protection": {
      type: "boolean",
      description: "Whether the skill ignores protection",
    },
    ".required_performer_hp_range": {
      type: "range",
      description: "Required HP range for the performer",
    },
    ".rank_damage_modifiers": {
      type: "number_list",
      description: "Damage modifiers for ranks",
    },
    ".heal": {
      type: "range",
      description: "Healing value",
    },
    ".can_crit_heal": {
      type: "boolean",
      description: "Whether critical healing is possible",
    },
    ".generation_guaranteed": {
      type: "boolean",
      description: "Whether generation is guaranteed",
    },
    ".is_user_selected_targets": {
      type: "boolean",
      description: "Whether the user selects targets",
    },
    ".is_knowledgeable": {
      type: "boolean",
      description: "Whether the skill is knowledgeable",
    },
    ".is_monster_rerank_valid_on_attack": {
      type: "boolean",
      description: "Whether monster rerank is valid on attack",
    },
    ".is_monster_rerank_valid_on_friendly_presentation_end": {
      type: "boolean",
      description:
        "Whether monster rerank is valid on friendly presentation end",
    },
    ".is_monster_rerank_valid_on_friendly_post_result": {
      type: "boolean",
      description: "Whether monster rerank is valid on friendly post result",
    },
    ".is_stall_invalidating": {
      type: "boolean",
      description: "Whether the skill invalidates stalling",
    },
    ".refresh_after_each_wave": {
      type: "boolean",
      description: "Whether the skill refreshes after each wave",
    },
    ".damage_heal_base_class_ids": {
      type: "string_list",
      description: "Base class IDs for damage or healing",
    },
    ".ignore_deathsdoor": {
      type: "boolean",
      description: "Whether the skill ignores death's door",
    },
    ".icon": {
      type: "string",
      description: "Icon name",
    },
    ".anim": {
      type: "string",
      description: "Animation name",
    },
    ".fx": {
      type: "string",
      description: "Effect name",
    },
    ".targfx": {
      type: "string",
      description: "Target effect name",
    },
    ".targheadfx": {
      type: "string",
      description: "Target head effect name",
    },
    ".targchestfx": {
      type: "string",
      description: "Target chest effect name",
    },
    ".misstargfx": {
      type: "string",
      description: "Missed target effect name",
    },
    ".misstargheadfx": {
      type: "string",
      description: "Missed target head effect name",
    },
    ".misstargchestfx": {
      type: "string",
      description: "Missed target chest effect name",
    },
    ".area_pos_offset": {
      type: "range",
      description: "Area position offset (X, Y)",
    },
    ".target_area_pos_offset": {
      type: "range",
      description: "Target area position offset (X, Y)",
    },
    ".reset_source_stance": {
      type: "boolean",
      description: "Whether the source stance is reset",
    },
    ".reset_target_stance": {
      type: "boolean",
      description: "Whether the target stance is reset",
    },
    ".can_display_selection": {
      type: "boolean",
      description: "Whether the selection can be displayed",
    },
    ".hide_performer_health": {
      type: "boolean",
      description: "Whether the performer's health is hidden",
    },
    ".condensed_tooltip_effects": {
      type: "boolean",
      description: "Whether effects are condensed in the tooltip",
    },
    ".condensed_tooltip_stats": {
      type: "boolean",
      description: "Whether stats are condensed in the tooltip",
    },
    ".condensed_tooltip_type": {
      type: "boolean",
      description: "Whether type is condensed in the tooltip",
    },
    ".condensed_tooltip_effects_per_line": {
      type: "number",
      description: "Number of effects per line in the tooltip",
    },
    ".nil": {
      type: "boolean",
      description: "Hides skill stats and other information",
    },
    ".custom_target_anim": {
      type: "string",
      description: "Custom target animation name",
    },
    ".custom_idle_anim_name": {
      type: "string",
      description: "Custom idle animation name",
    },
    ".custom_idle_round_duration": {
      type: "number",
      description: "Custom idle round duration",
    },
    ".has_crit_vo": {
      type: "boolean",
      description: "Whether critical voiceover is present",
    },
    ".can_display_skill_name": {
      type: "boolean",
      description: "Whether the skill name can be displayed",
    },
    ".can_display_performer_selection_after_turn": {
      type: "boolean",
      description: "Whether performer selection can be displayed after turn",
    },
    ".ignore_riposte": {
      type: "boolean",
      description: "Whether the skill ignores riposte",
    },
  },
  skill: {
    ".id": {
      type: "string",
      description: "Skill name identifier",
    },
    ".dmg": {
      type: "range",
      description: "Damage range for monsters or value for heroes",
      canBeNull: true
    },
    ".atk": {
      type: "number",
      description: "Attack value",
      canBeNull: true
    },
    ".move": {
      type: "range",
      description: "Movement values",
    },
    ".crit": {
      type: "number",
      description: "Critical hit value",
      canBeNull: true
    },
    ".type": {
      type: "string",
      description: "Skill type",
      //allowed_values: ["melee", "ranged", "move", "teleport", ""],
    },
    ".starting_cooldown": {
      type: "number",
      description: "Starting cooldown value",
    },
    ".per_battle_limit": {
      type: "number",
      description: "Limit per battle",
    },
    ".per_turn_limit": {
      type: "number",
      description: "Limit per turn",
    },
    ".is_continue_turn": {
      type: "boolean",
      description: "Whether the skill continues the turn",
    },
    ".launch": {
      type: "string",
      description: "Launch ranks",
    },
    ".target": {
      type: "string",
      description: "Target ranks",
      canBeNull: true,
    },
    ".self_target_valid": {
      type: "boolean",
      description: "Whether self-targeting is valid",
    },
    ".extra_targets_chance": {
      type: "number",
      description: "Chance for extra targets",
    },
    ".extra_targets_count": {
      type: "number",
      description: "Count of extra targets",
    },
    ".is_crit_valid": {
      type: "boolean",
      description: "Whether critical hits are valid",
    },
    ".effect": {
      type: "string_list",
      description: "Effect IDs",
    },
    ".valid_modes": {
      type: "string_list",
      description: "Valid mode IDs",
    },
    ".ignore_stealth": {
      type: "boolean",
      description: "Whether the skill ignores stealth",
    },
    ".ignore_guard": {
      type: "boolean",
      description: "Whether the skill ignores guard",
    },
    ".can_miss": {
      type: "boolean",
      description: "Whether the skill can miss",
    },
    ".can_be_riposted": {
      type: "boolean",
      description: "Whether the skill can be riposted",
    },
    ".ignore_protection": {
      type: "boolean",
      description: "Whether the skill ignores protection",
    },
    ".required_performer_hp_range": {
      type: "range",
      description: "Required HP range for the performer",
    },
    ".rank_damage_modifiers": {
      type: "number_list",
      description: "Damage modifiers for ranks",
    },
    ".heal": {
      type: "range",
      description: "Healing range",
    },
    ".can_crit_heal": {
      type: "boolean",
      description: "Whether critical healing is possible",
    },
    ".generation_guaranteed": {
      type: "boolean",
      description: "Whether generation is guaranteed",
    },
    ".is_user_selected_targets": {
      type: "boolean",
      description: "Whether the user selects targets",
    },
    ".is_knowledgeable": {
      type: "boolean",
      description: "Whether the skill is knowledgeable",
    },
    ".is_monster_rerank_valid_on_attack": {
      type: "boolean",
      description: "Whether monster rerank is valid on attack",
    },
    ".is_monster_rerank_valid_on_friendly_presentation_end": {
      type: "boolean",
      description:
        "Whether monster rerank is valid on friendly presentation end",
    },
    ".is_monster_rerank_valid_on_friendly_post_result": {
      type: "boolean",
      description: "Whether monster rerank is valid on friendly post result",
    },
    ".is_stall_invalidating": {
      type: "boolean",
      description: "Whether the skill invalidates stalling",
    },
    ".refresh_after_each_wave": {
      type: "boolean",
      description: "Whether the skill refreshes after each wave",
    },
    ".damage_heal_base_class_ids": {
      type: "string_list",
      description: "Base class IDs for damage or healing",
    },
    ".ignore_deathsdoor": {
      type: "boolean",
      description: "Whether the skill ignores death's door",
    },
    ".icon": {
      type: "string",
      description: "Icon name",
    },
    ".anim": {
      type: "string",
      description: "Animation name",
    },
    ".fx": {
      type: "string",
      description: "Effect name",
    },
    ".targfx": {
      type: "string",
      description: "Target effect name",
    },
    ".targheadfx": {
      type: "string",
      description: "Target head effect name",
    },
    ".targchestfx": {
      type: "string",
      description: "Target chest effect name",
    },
    ".misstargfx": {
      type: "string",
      description: "Missed target effect name",
    },
    ".misstargheadfx": {
      type: "string",
      description: "Missed target head effect name",
    },
    ".misstargchestfx": {
      type: "string",
      description: "Missed target chest effect name",
    },
    ".area_pos_offset": {
      type: "range",
      description: "Area position offset (X, Y)",
    },
    ".target_area_pos_offset": {
      type: "range",
      description: "Target area position offset (X, Y)",
    },
    ".reset_source_stance": {
      type: "boolean",
      description: "Whether the source stance is reset",
    },
    ".reset_target_stance": {
      type: "boolean",
      description: "Whether the target stance is reset",
    },
    ".can_display_selection": {
      type: "boolean",
      description: "Whether the selection can be displayed",
    },
    ".hide_performer_health": {
      type: "boolean",
      description: "Whether the performer's health is hidden",
    },
    ".condensed_tooltip_effects": {
      type: "boolean",
      description: "Whether effects are condensed in the tooltip",
    },
    ".condensed_tooltip_stats": {
      type: "boolean",
      description: "Whether stats are condensed in the tooltip",
    },
    ".condensed_tooltip_type": {
      type: "boolean",
      description: "Whether type is condensed in the tooltip",
    },
    ".condensed_tooltip_effects_per_line": {
      type: "number",
      description: "Number of effects per line in the tooltip",
    },
    ".nil": {
      type: "boolean",
      description: "Hides skill stats and other information",
    },
    ".custom_target_anim": {
      type: "string",
      description: "Custom target animation name",
    },
    ".custom_idle_anim_name": {
      type: "string",
      description: "Custom idle animation name",
    },
    ".custom_idle_round_duration": {
      type: "number",
      description: "Custom idle round duration",
    },
    ".has_crit_vo": {
      type: "boolean",
      description: "Whether critical voiceover is present",
    },
    ".can_display_skill_name": {
      type: "boolean",
      description: "Whether the skill name can be displayed",
    },
    ".can_display_performer_selection_after_turn": {
      type: "boolean",
      description: "Whether performer selection can be displayed after turn",
    },
    ".ignore_riposte": {
      type: "boolean",
      description: "Whether the skill ignores riposte",
    }
  },
  riposte_skill: {
    ".id": {
      type: "string",
      description: "Skill name identifier",
    },
    ".dmg": {
      type: "number",
      monsterType: "range",
      description: "Damage range for monsters or value for heroes",
    },
    ".atk": {
      type: "number",
      description: "Attack value",
    },
    ".move": {
      type: "range",
      description: "Movement values",
    },
    ".crit": {
      type: "number",
      description: "Critical hit value",
    },
    ".level": {
      type: "number",
      description: "Skill level value",
    },
    ".type": {
      type: "string",
      description: "Skill type",
    },
    ".launch": {
      type: "string",
      description: "Launch ranks",
    },
    ".target": {
      type: "string",
      description: "Target ranks",
    },
    ".is_crit_valid": {
      type: "boolean",
      description: "Whether critical hits are valid",
    },
    ".effect": {
      type: "string_list",
      description: "Effect IDs",
    },
    ".valid_modes": {
      type: "string_list",
      description: "Valid mode IDs",
    },
    ".can_miss": {
      type: "boolean",
      description: "Whether the skill can miss",
    },
    ".ignore_protection": {
      type: "boolean",
      description: "Whether the skill ignores protection",
    },
    ".damage_heal_base_class_ids": {
      type: "string_list",
      description: "Base class IDs for damage or healing",
    },
    ".ignore_deathsdoor": {
      type: "boolean",
      description: "Whether the skill ignores death's door",
    },
    ".anim": {
      type: "string",
      description: "Animation name",
    },
    ".fx": {
      type: "string",
      description: "Effect name",
    },
    ".targfx": {
      type: "string",
      description: "Target effect name",
    },
    ".targheadfx": {
      type: "string",
      description: "Target head effect name",
    },
    ".targchestfx": {
      type: "string",
      description: "Target chest effect name",
    },
    ".misstargfx": {
      type: "string",
      description: "Missed target effect name",
    },
    ".misstargheadfx": {
      type: "string",
      description: "Missed target head effect name",
    },
    ".misstargchestfx": {
      type: "string",
      description: "Missed target chest effect name",
    },
    ".area_pos_offset": {
      type: "range",
      description: "Area position offset (X, Y)",
    },
    ".target_area_pos_offset": {
      type: "range",
      description: "Target area position offset (X, Y)",
    },
    ".reset_source_stance": {
      type: "boolean",
      description: "Whether the source stance is reset",
    },
    ".reset_target_stance": {
      type: "boolean",
      description: "Whether the target stance is reset",
    },
    ".custom_target_anim": {
      type: "string",
      description: "Custom target animation name",
    },
    ".custom_idle_anim_name": {
      type: "string",
      description: "Custom idle animation name",
    },
    ".custom_idle_round_duration": {
      type: "number",
      description: "Custom idle round duration",
    },
    ".has_crit_vo": {
      type: "boolean",
      description: "Whether critical voiceover is present",
    },
  },
  resistances: {
    ".stun": {
      type: "number",
      description: "Resistance to stun effects.",
    },
    ".move": {
      type: "number",
      description: "Resistance to movement effects.",
    },
    ".poison": {
      type: "number",
      description: "Resistance to poison effects.",
    },
    ".bleed": {
      type: "number",
      description: "Resistance to bleeding effects.",
    },
    ".disease": {
      type: "number",
      description: "Resistance to disease effects.",
    },
    ".debuff": {
      type: "number",
      description: "Resistance to debuff effects.",
    },
    ".death_blow": {
      type: "number",
      description: "Resistance to death blow effects.",
    },
    ".trap": {
      type: "number",
      description: "Resistance to trap effects.",
    },
  },
  mode: {
    ".id": {
      type: "string",
      description: "The unique identifier for the mode.",
      required: true
    },
    ".is_raid_default": {
      type: "boolean",
      description: "Indicates if the mode is the default for raids.",
    },
    ".always_guard_actor_base_class_ids": {
      type: "string_list",
      description: "List of actor base class IDs that always guard.",
    },
    ".is_targetable": {
      type: "boolean",
      description: "Indicates if the mode is targetable.",
    },
    ".keep_rounds_in_ranks": {
      type: "boolean",
      description: "Number of rounds to keep actors in ranks.",
    },
    ".stress_damage_per_turn": {
      type: "number",
      description: "Stress damage applied per turn in this mode.",
    },
    ".bark_override_id": {
      type: "string",
      description: "Specifies the bark override ID for this mode.",
    },
    ".affliction_combat_skill_id": {
      type: "string",
      description: "Combat skill ID triggered by affliction in this mode.",
    },
    ".battle_complete_combat_skill_id": {
      type: "string",
      description: "Combat skill ID triggered upon battle completion.",
    },
  },
  generation: {
    ".is_generation_enabled": {
      type: "boolean",
      description: "Indicates if generation is enabled.",
    },
    ".town_event_dependency": {
      type: "string",
      description: "Specifies the town event dependency.",
    },
    ".number_of_positive_quirks_min": {
      type: "number",
      description: "Minimum number of positive quirks.",
    },
    ".number_of_positive_quirks_max": {
      type: "number",
      description: "Maximum number of positive quirks.",
    },
    ".number_of_negative_quirks_min": {
      type: "number",
      description: "Minimum number of negative quirks.",
    },
    ".number_of_negative_quirks_max": {
      type: "number",
      description: "Maximum number of negative quirks.",
    },
    ".number_of_class_specific_camping_skills": {
      type: "number",
      description: "Number of class-specific camping skills.",
    },
    ".number_of_shared_camping_skills": {
      type: "number",
      description: "Number of shared camping skills.",
    },
    ".number_of_random_combat_skills": {
      type: "number",
      description: "Number of random combat skills.",
    },
    ".number_of_cards_in_deck": {
      type: "number",
      description: "Number of cards in the deck.",
    },
    ".card_chance": {
      type: "number",
      description: "Chance of drawing a card.",
    },
    ".reduce_number_of_cards_in_deck_hero_class_id": {
      type: "string",
      description:
        "Hero class ID for reducing the number of cards in the deck.",
    },
    ".reduce_number_of_cards_in_deck_amount": {
      type: "number",
      description:
        "Amount by which the number of cards in the deck is reduced.",
    },
  },
  weapon:{
    ".name": {
      type: "string",
      description: "The unique identifier of the given weapon level."
    },
    ".atk": {
      type: "number",
      description: "The hero's base accuracy for the given weapon level."
    },
    ".dmg": {
      type: "range",
      description: "The hero's base damage for the given weapon level."
    },
    ".crit": {
      type: "number",
      description: "The hero's base CRIT chance for the given weapon level."
    },
    ".spd": {
      type: "number",
      description: "Part hero's base speed for the given weapon level, gets added together with the speed value of the armour, the armour's is typically 0 at all levels."
    },
    ".upgradeRequirementCode": {
      type: "number",
      description: "The weapon level required for this level to be unlockable, used in cojunction with the hero's upgrades.json file."
    },
    ".icon": {
      type: "string",
      description: "The name of the icon's file for the given weapon level."
    }
  },
  armour:{
    ".name": {
      type: "string",
      description: "The unique identifier of the given armour level."
    },
    ".def": {
      type: "number",
      description:"The hero's base dodge for the given armour level."
    },
    ".prot": {
      type: "number",
      description:"The hero's base protection for the given armour level."
    },
    ".hp": {
      type: "number",
      description:"The hero's base max health for the given armour level."
    },
    ".spd": {
      type: "number",
      description: "Part hero's base speed for the given armour level, gets added together with the speed value of the weapon, the armour's is typically 0 at all levels."
    },
    ".upgradeRequirementCode": {
      type: "number",
      description: "The armour level required for this level to be unlockable, used in cojunction with the hero's upgrades.json file."
    },
    ".icon": {
      type: "string",
      description: "The name of the icon's file for the given armour level."
    }
  },
  crit: {
    ".effects": {
      type: "string_list",
      description: "The list of effects that are fired on CRIT.",
    },
    ".is_valid_effects_target": {
      type: "boolean",
      description: "Whether or not CRIT effects trigger when the actor is hit by a CRIT."
    }
  },
  tag: {
    ".id": {
      type: "string",
      required: true
    },
  },
  incompatible_party_member: {
    ".id": {
      type: "string",
      description: "The party restriction's ID",
      required: true
    },
    ".hero_tag": {
      type: "string",
      description: "The incompatible tag's ID",
      required: true
    },
  },
  overstressed_modifier: {
    ".override_trait_type_ids": {
      type: "string_list",
      description: "The IDs of each custom Overstress states the hero will use.",
      required: true
    },
    ".override_trait_type_chances": {
      type: "number_list",
      description: "The chances of each of the custom Overstress states the hero will use.",
      required: true
    },
  },
  activity_modifier: {
    ".override_valid_activity_ids": {
      type: "string_list",
      description: "The IDs of Hamlet facilities the hero cannot use."
    },
    ".override_stress_removal_amount_low": {
      type: "number",
      description: "The minimum amount of stress thats healed by activities."
    },
    ".override_stress_removal_amount_high": {
      type: "number",
      description: "The maximum amount of stress thats healed by activities."
    },
  },
  quirk_modifier: {
    ".incompatible_class_ids": {
      type: "string_list",
      description: "The IDs of quirks the hero cannot acquire.",
      required: true
    },
  },
  extra_curio_loot: {
    ".code": {
      type: "string",
      description: "The loot table's ID",
    },
    ".count": {
      type: "number",
      description: "The number of pulls from the loot table.",
    },
  },
  extra_battle_loot: {
    ".code": {
      type: "string",
      description: "The loot table's ID",
    },
    ".count": {
      type: "number",
      description: "The number of pulls from the loot table.",
    },
  },
  deaths_door: {
    ".buffs": {
      type: "string_list",
      description: "Death's Door buff IDs",
      canBeNull: true
    },
    ".recovery_buffs": {
      type: "string_list",
      description: "Death's Door Recovery buff IDs",
      canBeNull: true
    },
    ".recovery_heart_attack_buffs": {
      type: "string_list",
      description: "Heart attack buff IDs",
      canBeNull: true
    },
    ".enter_effects": {
      type: "string_list",
      description: "Effects fired when the hero enters Death's door",
    },
    ".enter_effect_round_cooldown":{
      type: "number",
      description: "The cooldown for the Death's Door entering effects",
    }
  },
  controlled: {
    ".target_rank": {
      type: "number",
      description: "The Rank the hero will try to enter when charmed by a monster.",
      required: true
    },
  },
  id_index: {
    ".index": {
      type: "number",
      description: "The hero's index, it seemingly does nothing, still need to be present however.",
      required: true
    },
  },
  skill_selection: {
    ".can_select_combat_skills": {
      type: "boolean",
      description: "Whether or not the player can select and deselect the hero's skills on the hero screen.",
    },
    ".number_of_selected_combat_skills_max": {
      type: "number",
      description: "The number of skills the hero can have selected.",
    },
  },
  commonfx: {
    ".deathfx": {
      type: "string",
      description:"The ID of the FX.",
      required: true
    }
  },
  act_out_display: {
    ".attack_friendly_anim": {
      type: "string",
      description:"The ID of the animation.",
    },
    ".attack_friendly_fx": {
      type: "string",
      description:"The ID of the attack's FX.",
    },
    ".attack_friendly_targchestfx": {
      type: "string",
      description:"The ID of the target chest FX.",
    },
    ".attack_friendly_sfx": {
      type: "string",
      description:"The ID of the friendly attack's SFX.",
    }
  },
  progression: {
    ".has_caretaker_goals": {
      type: "boolean",
      description: "If set to true, there will be a new caretaker goal to get the hero to level 6.",
      required: true
    }
  },
  hp_reaction: {
    ".hp_ratio": {
      type: "number",
      description: "HP percentage threshold value.",
    },
    ".is_under": {
      type: "boolean",
      description: "Whether the reaction is triggered when the current HP goes above(false) or below(true) the threshold",
    },
    ".effects": {
      type: "string_list",
      description: "The list of effects that are fired on reaction trigger.",
    }
  },
  death_reaction: {
    ".target_allies": {
      type: "boolean",
      description: "Whether or not the death trigger targets alies."
    },
    ".target_enemies": {
      type: "boolean",
      description: "Whether or not the death trigger targets enemies."
    },
    ".effects": {
      type: "string_list",
      description: "The list of effects that are fired when the actor dies."
    },
  },
  sorting_index: {
    ".index": {
      type: "number",
      description: "The sorting index.",
      required: true
    }
  },
  display: {
    ".size": {
      type: "number",
      description: "The monster's size, how many ranks it takes up.",
      required: true
    }
  },
  enemy_type: {
    ".id": {
      type: "string",
      required: true
    }
  },
  stats: {
    ".hp":{
      type: "number",
      description: "The monster's max HP.",
      required: true
    },
    ".def":{
      type: "number",
      description: "The monster's dodge chance.",
      required: true
    },
    ".prot":{
      type: "number",
      description: "The monster's PROT value. (1.0 = 100% PROT).",
      required: true
    },
    ".spd":{
      type: "number",
      description: "The monster's speed.",
      required: true
    },
    ".stun_resist":{
      type: "number",
      description: "The monster's Stun resistance chance.",
      required: true
    },
    ".poison_resist":{
      type: "number",
      description: "The monster's Blight resistance chance.",
      required: true
    },
    ".bleed_resist":{
      type: "number",
      description: "The monster's Bleed resistance chance.",
      required: true
    },
    ".debuff_resist":{
      type: "number",
      description: "The monster's Debuff resistance chance.",
      required: true
    },
    ".move_resist":{
      type: "number",
      description: "The monster's Move resistance chance.",
      required: true
    }
  },
  spawn: {
    ".effects":{
      type: "string_list",
      description: "The effects fired when the monster spawns."
    },
    ".wave_effects": {
      type: "boolean",
      description: "The effects fired when the monster spawns during wave quests."
    }
  },
  personality: {
    ".prefskill":{
      type: "number",
      description: "Doesn't seem to do anything.",
      canBeNull: true
    }
  },
  loot: {
    ".code": {
      type: "string",
      description: "The ID of the loot table that's called when the monster dies.",
      canBeNull: true
    },
    ".count": {
      type: "number",
      description: "The number of pulls from the loot table.",
      canBeNull: true
    },
    ".raid_finish_quirk_class_id": {
      type: "string",
      description: "At the end of the quest, on of the heroes will gain the the quirk. If there are multiple lines .raid_finish_quirk_class_id, one will be picked at random"
    }
  },
  initiative: {
    ".number_of_turns_per_round": {
      type: "number",
      required: true
    },
    ".hide_indicator": {
      type: "boolean"
    }
  },
  monster_brain: {
    ".id": {
      type: "string",
      description: "The monster AI's ID.",
      required: true
    }
  },
  death_class: {
    ".monster_class_id": {
      type: "string",
      description: "The ID of the monster the current monster will turn into on death.",
      required: true
    },
    ".type": {
      type: "string",
      description: "The type of the new monster."
    },
    ".is_valid_on_crit": {
      type: "boolean",
      description: "Whether or not the monster will change IDs on if the death blow was a CRIT."
    },
    ".is_valid_on_bleed_dot": {
      type: "boolean",
      description: "Whether or not the monster will change IDs on if the death blow was a Bleed DOT tick."
    },
    ".is_valid_on_blight_dot": {
      type: "boolean",
      description: "Whether or not the monster will change IDs on if the death blow was a Blight DOT tick."
    },
    ".can_die_from_damage": {
      type: "boolean"
    },
    ".change_class_effects": {
      type: "string_list",
      description: "Effects fired on monster ID change. (Only triggers for death based ID change.)"
    }
  },
  battle_modifier: {
    ".accelerate_stall_penalty": {
      type: "boolean"
    },
    ".disable_stall_penalty": {
      type: "boolean"
    },
    ".can_surprise": {
      type: "boolean"
    },
    ".can_be_surprised": {
      type: "boolean"
    },
    ".always_surprise": {
      type: "boolean"
    },
    ".always_be_surprised": {
      type: "boolean"
    },
    ".living_hero_buff_instance_ids": {
      type: "string_list",
      description: "List of buffs the heroes have while the monster is alive."
    },
    ".living_other_enemy_buffs": {
      type: "string_list",
      description: "List of buffs the monster's allies have while the monster is alive."
    },
    ".disabled_act_out_combat_start_turn_types": {
      type: "string_list",
      description: "List of act-out types that are disabled during the first round of combat."
    },
    ".can_be_damaged_directly": {
      type: "boolean",
    },
    ".can_be_missed": {
      type: "boolean"
    },
    ".is_valid_friendly_target": {
      type: "boolean"
    },
    ".can_relieve_stress_from_killing_blow": {
      type: "boolean"
    },
    ".can_be_summon_rank": {
      type: "boolean"
    },
    ".does_count_as_monster_size_for_monster_brain": {
      type: "boolean"
    },
    ".does_count_towards_stall_penalty": {
      type: "boolean"
    },
    ".can_relieve_stress_from_crit": {
      type: "boolean"
    }
  },
  torchlight_modifier: {
    ".min": {
      type: "number",
      description: "The minimum light level while the monster is alive."
    },
    ".max": {
      type: "number",
      description: "The maximum light level while the monster is alive."
    },
  },
  controller: {
    ".stress_per_controlled_turn": {
      type: "number",
      description: "The amount of stress gained by heroes while they're charmed by this enemy."
    }
  },
  captor_empty: {
    ".performing_monster_captor_base_class": {
      type: "string",
      description: "The ID of the monster that performs the capture"
    },
    ".captor_full_monster_class": {
      type: "string",
      description: "The ID of the monster that the current monster will turn into on a successful capture."
    },
    ".capture_effects": {
      type: "string_list",
      description: "The list of effects applied to the capture target (the captured hero) when captured."
    },
    ".reset_hp": {
      type: "boolean",
      description: "Whether or not the monster's HP is reset upon a successful capture"
    },
    ".count_captor_full_damage": {
      type: "boolean"
    },
  },
  captor_full: {
    ".captor_empty_monster_class": {
      type: "string",
      description: "The ID of the monster the current monster will turn into when the capture state ends."
    },
    ".release_on_death": {
      type: "boolean",
      description: "Whether or not the monster realeses the captured hero when the monster dies."
    },
    ".release_on_prisoner_at_deaths_door": {
      type: "boolean",
      description: "Whether or not the monster realeses the captured hero when they reach Death's Door."
    },
    ".per_turn_damage_percent": {
      type: "number",
      description: "The amount of DMG percentage the captured hero suffers each turn of the battle."
    },
    ".reset_hp": {
      type: "boolean",
      description: "Whether or not the monster's HP is reset upon the end of the capture state."
    },
    ".use_previous_monster_class_hp": {
      type: "boolean"
    },
    ".add_current_hp": {
      type: "boolean"
    },
    ".switch_class_on_death": {
      type: "boolean",
      description: "Whether or not the monster will change IDs, when it dies."
    },
    ".release_on_prisoner_affliction": {
      type: "boolean",
      description: "Whether or not the monster realeses the captured hero when they reach Death's Door."
    },
    ".release_effects": {
      type: "string_list",
      description: "The list of effects applied to the capture target (the captured hero) when released."
    },
    ".per_turn_stress_damage": {
      type: "number",
      description: "The amount of Stress the captured hero suffers each turn of the battle."
    },
  },
  companion: {
    ".monster_class": {
      type: "string",
      description: "Companion monster's ID",
      required: true
    },
    ".buffs": {
      type: "string_list",
      description: "The list of buffs the monster has while their compaion is alive"
    },
    ".heal_per_turn_percent": {
      type: "number",
      description: "The amount of HP healed each turn while the monster's companion is alive. (0.01 = 1%)."
    }
  },
  shape_shifter: {
    ".monster_class_ids": {
      type: "string_list",
      description: "The IDs of monsters the monster can shapeshift into."
    },
    ".monster_class_chances": {
      type: "number_list",
      description: "The chance for each possible ID, follows the order of monster IDs."
    },
    ".monster_class_valid_ranks": {
      type: "number_list",
      description: "The rank restriction for each ID, follows the order of monster IDs."
    },
    ".round_frequency": {
      type: "number",
      description: "How frequently the shapeshifting occurs. (Battle Rounds)."
    }
  },
  shared_health: {
    ".id": {
      type: "string",
      description: "Any monsters that share this ID will add their HP values together to essentially function as one actor.",
      required: true
    }
  },
  life_link: {
    ".base_class": {
      type: "string",
      description: "The monster base class the monster is life-linked to, when that monster dies, so will this one.",
      required: true
    }
  },
  wave_spawning: {
    ".prefers_front": {
      type: "boolean",
      description: "If true, the monster will more spawn in the frontranks at the start of a wave.",
      required: true
    }
  },
  battle_backdrop: {
    ".background_name": {
      type: "string"
    },
    ".animation": {
      type: "string"
    },
    ".isFlat": {
      type: "boolean"
    },
  },
  skill_reaction: {
    ".was_killed_all_heroes_effects": {
      type: "string_list"
    },
    ".was_killed_effects": {
      type: "string_list"
    },
    ".was_killed_other_monsters_effects": {
      type: "string_list"
    },
    ".was_killed_by_hero_effects": {
      type: "string_list"
    },
    ".was_hit_performer_effects": {
      type: "string_list"
    },
    ".was_hit_target_effects": {
      type: "string_list"
    }
  },
  life_time: {
    ".alive_round_limit": {
      type: "number",
      description: "The maximum amount of rounds the monster can stay alive."
    },
    ".does_check_for_loot": {
      type: "boolean",
      description: "Whether or not loot is pulled when the monster's life time expires"
    }
  },
  additional_effect: {
    ".is_valid_trinket_target": {
      type: "boolean",
      description: "Whether or not the monster is a valid target for trinket effects."
    },
    ".is_valid_trinket_attacker": {
      type: "boolean",
      description: "Whether or not the monster is a valid attacker for trinket at effects."
    },
  },
  tutorial: {
    ".id": {
      type: "string",
      description: "The tutorial which will be shown the first time the monster appears in the save."
    }
  },
  mash_modifier: {
    ".disable_additional_mash_for_infestation_sequence_on_death": {
      type: "boolean",
      description: "If set to true, the monster will not spawn if killed in the current infestation."
    }
  },
  rendering: {
    ".sort_position_z_rank_override": {
      type: "number",
      description: "The display Z axis/level of the actor. Can be used to determine where the actor's clickbox is on the Z axis, in other words, can be used to put the actor's clickbox behind or in front of other actors' making easier to click them."
    }
  }
};
