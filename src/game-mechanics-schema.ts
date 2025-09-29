type Schema = {
  type: "string" | "number" | "boolean" | "string_list" | "number_list" | "range";
  monsterType?: "string" | "number" | "boolean" | "string_list" | "number_list" | "range";
  description?: string;
  allowed_values?: string[] | number[] | boolean[];
  required?: boolean;
  canBeNull?: boolean;
  vanillaValuesTitle?: string;
  vanillaValues?: string[];
  addInfo?: string;
  displayEffectOrder?: boolean;
  commonName?: string
  referenceDesc?: string,
  sourceList?: string
};

export const Sources:{
  [key: string]: {
    title: string,
    list: string[]
    comments?: {
      [key: string]: string
    }
  };
} = {
  buff: {
    title: "Refer to the document below by Sasiji for detailed information on each Buff Source",
    list: [
      "https://docs.google.com/spreadsheets/d/1KvN2vYP6_4kw0SmRKEmrN_BRAQGPQ5mKB28xcb4HM7s"
    ]
  },
  heal: {
    title: "Heal Sources (CRIT chance)",
    list: [
      "hero_skill",
      "hero_skill_multi_target",
      "monster_skill",
      "monster_skill_multi_target",
      "camp_skill",
      "camp_skill_multi_target",
      "companion",
      "eat",
      "act_out",
      "damage_heal",
      "effect",
      "flashback",
      "dot",
      "curio",
    ],
    comments: {
      hero_skill: "12%",
      hero_skill_multi_target: "5%",
      monster_skill: "2.5%",
      monster_skill_multi_target: "2.5%",
      camp_skill: "0%",
      camp_skill_multi_target: "0%",
      companion: "0%",
      eat: "0%",
      act_out: "0%",
      damage_heal: "0%",
      effect: "12%",
      flashback: "0%",
      dot: "6%",
      curio: "0%",
    },
  },
  stress: {
    title: "",
    list: []
  },
  DMG: {
    title: "",
    list: []
  }
};

export const GAME_MECHANICS_SCHEMA: {
  [key: string]: {
    [key: string]: Schema;
  };
} = {
  effect: {
    ".name": {
      type: "string",
      description: "The effect's ID.",
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
      description: "The target of the effect.",
    },
    ".curio_result_type": {
      type: "string",
      allowed_values: ["positive", "negative", "neutral", "none"],
      description: "The result type for curio interactions. This decides what colour of light the curio will emit on interaction. Positive: White, Negative: Red, None: No light.",
    },
    ".chance": {
      type: "number",
      description: "The effect's base chance.",
      addInfo: "If not present on the effect, will default to 100%."
    },
    ".on_hit": {
      type: "boolean",
      description: "Whether or not the effect triggers when the skill hits.",
    },
    ".on_miss": {
      type: "boolean",
      description: "Whether or not the effect triggers when the skill misses.",
    },
    ".queue": {
      type: "boolean",
      description: "Whether or not the effect is queued.",
      displayEffectOrder: true
    },
    ".dotBleed": {
      type: "number",
      commonName: "Bleed",
      description: "The amount of Bleed DOT applied by the effect.",
    },
    ".dotPoison": {
      type: "number",
      commonName: "Blight",
      description: "The amount of Blight DOT applied by the effect.",
    },
    ".dotStress": {
      type: "number",
      commonName: "Horror",
      description: "The Amount of Horror applied by the effect. Works like Bleed/Blight, but does Stress DMG instead.",
      addInfo: "There is no Resistance stat for it."
    },
    ".hp_dot_bleed": {
      type: "number",
      referenceDesc: ".dotBleed"
    },
    ".hp_dot_poison": {
      type: "number",
      referenceDesc: ".dotPoison"
    },
    ".stress_dot": {
      type: "number",
      referenceDesc: ".dotStress"
    },
    ".stress": {
      type: "number",
      description: "The Stress DMG amount applied by the effect.",
    },
    ".healstress": {
      type: "number",
      description: "The amount of stress healed by the effect.",
    },
    ".combat_stat_buff": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Effect based buff. Applies if 1.",
      addInfo: "Can work as a `.skill_instant true` effect without actually using it."
    },
    ".damage_low_add": {
      type: "number",
      description: "Minimum Flat DMG amount. Used by `.combat_stat_buff`.",
    },
    ".damage_low_multiply": {
      type: "number",
      description: "Minimum DMG multiplier amount. Used by `.combat_stat_buff`.",
    },
    ".damage_high_add": {
      type: "number",
      description: "Maximum Flat DMG amount. Used by `.combat_stat_buff`.",
    },
    ".damage_high_multiply": {
      type: "number",
      description: "Maximum DMG multiplier amount. Used by `.combat_stat_buff`.",
    },
    ".max_hp_add": {
      type: "number",
      description: "Flat Max HP amount. Used by `.combat_stat_buff`.",
    },
    ".max_hp_multiply": {
      type: "number",
      description: "Max HP Multiplier amount. Used by `.combat_stat_buff`.",
    },
    ".attack_rating_add": {
      type: "number",
      description: "Flat Accuracy amount. Used by `.combat_stat_buff`.",
    },
    ".attack_rating_multiply": {
      type: "number",
      description: "Accuracy Multiplier amount. Used by `.combat_stat_buff`.",
    },
    ".crit_chance_add": {
      type: "number",
      description: "Flat CRIT chance amount. Used by `.combat_stat_buff`.",
    },
    ".crit_chance_multiply": {
      type: "number",
      description: "CRIT chance multiplier amount. Used by `.combat_stat_buff`.",
    },
    ".defense_rating_add": {
      type: "number",
      description: "Flat Dodge amount. Used by `.combat_stat_buff`.",
    },
    ".defense_rating_multiply": {
      type: "number",
      description: "Dodge multiplier amount. Used by `.combat_stat_buff`.",
    },
    ".protection_rating_add": {
      type: "number",
      description: "Flat PROT amount. Used by `.combat_stat_buff`.",
    },
    ".protection_rating_multiply": {
      type: "number",
      description: "PROT multiplier amount. Used by `.combat_stat_buff`.",
    },
    ".speed_rating_add": {
      type: "number",
      description: "Flat Speed amount. Used by `.combat_stat_buff`.",
    },
    ".speed_rating_multiply": {
      type: "number",
      description: "Speed multiplier amount. Used by `.combat_stat_buff`.",
    },
    ".keyStatus": {
      type: "string",
      description: "The status effect checked on the skill's target by `.combat_stat_buff`.",
      vanillaValuesTitle: "Vanilla Statuses",
      vanillaValues: [
        "tagged",
        "poisoned",
        "bleeding",
        "stunned",
        "virtued",
        "afflicted",
      ],
    },
    ".buff_amount": {
      type: "number",
      description: "Used to make effect based buffs. Determines the buff's amount.",
    },
    ".buff_type": {
      type: "string",
      description: "Used to make effect based buffs. Determines the buff's type.",
    },
    ".buff_sub_type": {
      type: "string",
      description: "Used to make effect based buffs. Determines the buff's sub type.",
    },
    ".buff_duration_type": {
      type: "string",
      description: "Determins the duration type of the buff. Used together with `.buff_type` or `.buff_ids`",
    },
    ".buff_ids": {
      type: "string_list",
      description: "List of buffs applied by the effect.",
    },
    ".duration": {
      type: "number",
      description: "The effect's duration. Turn based by default.",
    },
    ".dotHpHeal": {
      type: "number",
      description: "The Regen amount applied by the skill. Works like DOTs, but heals HP rather than dealing DMG.",
      commonName: "Regen/Regeneration"
    },
    ".hp_dot_heal": {
      type: "number",
      referenceDesc: ".dotHpHeal"
    },
    ".heal": {
      type: "number",
      description: "The amount of HP healed by the effect.",
    },
    ".heal_percent": {
      type: "number",
      description: "Percentage based healing. Heals the target for the given percentage of their Max HP. (ex. `.heal_percent 0.4` will heal 40% of the target's Max HP's worth of HP.)",
    },
    ".can_crit_heal": {
      type: "boolean",
      description: "Whether or not the heal effect can CRIT.",
    },
    ".cure": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Cures the target of Bleed and Blight.",
    },
    ".cure_bleed": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Cures the target of Bleed.",
    },
    ".cure_poison": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Cures the target of Blight.",
    },
    ".clearDotStress": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Cures the target of Horror.",
    },
    ".tag": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Marks the target.",
    },
    ".untag": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Clears Marks from the target.",
    },
    ".stun": {
      type: "number",
      description: "The amount of turns the target will get stunned for. Unaffected by `.duration`.",
    },
    ".unstun": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Cures the target of Stuns.",
    },
    ".riposte": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Activates Riposte on the target. The target can be any actor, however, only performer is recommended as it can break workarounds on other classes, in which case they will cease to function correctly.",
    },
    ".riposte_on_miss_chance_add": {
      type: "number",
      description: "Flat Riposte Chance when missed.",
    },
    ".riposte_on_hit_chance_add": {
      type: "number",
      description: "Flat Riposte Chance when hit.",
    },
    ".riposte_on_miss_chance_multiply": {
      type: "number",
      description: "Riposte Chance multiplier when missed.",
    },
    ".riposte_on_hit_chance_multiply": {
      type: "number",
      description: "Riposte Chance multiplier when hit.",
    },
    ".riposte_effect": {
      type: "string",
      description: "The effect used by the target on Riposte.",
      addInfo: "This stacks with the `.effects` of the `.riposte skill`, but there can only be one effect applied to the target at once by `.riposte_effect`,"
    },
    ".clear_riposte": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Clear Riposte from the target.",
    },
    ".guard": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Makes the performer Guard the target. Applies Guarded status to target and Guarding status to performer. Guarded status needs to be cleared from the target before they can be guarded again, and Guarding status needs to be cleared from the performer before they can be Guarded.",
      addInfo: "Triggers regardless of chance, given value or on_hit/on_miss."
    },
    ".clearguarding": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Clear Guarding from the target.",
    },
    ".clearguarded": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Clear Guarded from the target.",
    },
    ".torch_decrease": {
      type: "number",
      description: "Torch light decrease amount.",
    },
    ".torch_increase": {
      type: "number",
      description: "Torch light increase amount.",
    },
    ".item": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Whether or not the effect is used by an item.",
    },
    ".curio": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Whether or not the effect is used by a curio.",
    },
    ".dotShuffle": {
      type: "boolean",
      allowed_values: [1, 0],
      commonName: "Stumble",
      description: "Applies Shuffle DOT to the target. Despite the parameter name, doesnt to DMG over time, shuffles the target at the beginning of their turn instead.",
    },
    ".shuffle_dot": {
      type: "number",
      description: "The shuffle effect applied over time.",
    },
    ".push": {
      type: "number",
      description: "The amount of ranks the target gets pushed back.",
    },
    ".pull": {
      type: "number",
      description: "The amount of ranks the target gets pulled forward.",
    },
    ".shuffletarget": {
      type: "boolean",
      description: "Shuffles the target.",
      canBeNull: true
    },
    ".shuffleparty": {
      type: "boolean",
      description: "Shuffles the target's party.",
      addInfo: "Ignores move resistance/chance.",
      canBeNull: true
    },
    ".destealth": {
      type: "boolean",
      description: "Clears Stealth from the target.",
      allowed_values: [1, 0],
    },
    ".instant_shuffle": {
      type: "boolean",
      description: "Shuffles the target without the standard animation of being moved.",
    },
    ".steal_buff_stat_type": {
      type: "string",
      description: "The all buffs from the target that have the specified buff stat type.",
      addInfo: "Stealing from performer is removes the buffs completely."
    },
    ".steal_buff_source_type": {
      type: "string",
      description: "The all buffs from the target that have the specified buff source type.",
      sourceList: "buff"
    },
    ".swap_source_and_target": {
      type: "boolean",
      description: "Switches the target and performer of the effect based on the skill's target.", 
      addInfo: "Ex.: Antiquarian targets Leper with a friendly skill, by default the effect's target is Leper, and the performer is Antiquarian, if this parameter is set to true, Leper will become the performer and Antiquarian the target. Works with AOE skills and effect targets.",
    },
    ".kill": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Kill the target, ignoring everything, including Death's Door, which is skipped altogether.",
    },
    ".kill_enemy_types": {
      type: "string",
      description: "Kills the target if they have a the given enemy type. For size 0s, it is recommended over `.kill`.",
    },
    ".has_description": {
      type: "boolean",
      description: "Whether or not the effect will appear on the skill's description.",
    },
    ".stealth": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Applies Stealth to the target.",
    },
    ".unstealth": {
      type: "boolean",
      allowed_values: [1, 0],
      referenceDesc: ".destealth"
    },
    ".clear_debuff": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Cures all curable debuffs from the target.",
    },
    ".daze": {
      type: "number",
      description: "The amount of turns the target will get Daze for. Unaffected by `.duration`.",
      addInfo: "Uses Stun chance/resistance. Highly Volatile on monsters and doesnt work on heroes at all. Delegate its usage to making cooldowns (`which use .daze 0 .on_hit/on_miss false`)."
    },
    ".undaze": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Clears Daze from the target.",
    },
    ".apply_on_death": {
      type: "boolean",
      description: "Whether or not the effect triggers even if the target dies.",
    },
    ".clearvirtue": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Clears Virtue from the target.",
    },
    ".cure_disease": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Cures the target of all dieases, including ones that are normall uncurable, such as Crimson Curse.",
    },
    ".immobilize": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Immobilizes the target.",
      addInfo: "Quites buggy, works best if only used on targets in rank 1, or the whole party."
    },
    ".unimmobilize": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Clears Immobilize from the target.",
    },
    ".control": {
      type: "number",
      description: "Charms the target.",
      addInfo: "Originally used debuff chance/res, no longer the case, just uses a flat chance. Buggy with heroes as they can break if the AI controls them. When used on a monster, it simply mirrors their combat sprite, but they seem to work as usual otherwise?"
    },
    ".uncontrol": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Clears Charm from the target.",
      addInfo: "A Charmed target can apply this to itself, surprisingly, it also works."
    },
    ".monsterType": {
      type: "string",
      description: "Monster type rule, used for effect based buffs.",
    },
    ".remove_vampire": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Cures the target of the Crimson Curse/all Vampire tag diseases/quirks.",
    },
    ".capture": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Captures the target, the version used by Crew.",
      addInfo: "Can't be used by heroes."
    },
    ".capture_remove_from_party": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Captures the target, the version used by Hag.",
      addInfo: "Unless you plan to use it exactly as Red Hook intended, I'd suggest leaving it be. Can't be used by heroes."
    },
    ".disease": {
      type: "string",
      description: "Applies the given Disease/Quirk to the target.",
    },
    ".summon_monsters": {
      type: "string_list",
      description: "List of monsters to summon.",
      addInfo: "Unless the monster is size 0, do not ever use this with heroes."
    },
    ".summon_chances": {
      type: "number_list",
      description: "The chance of each monster on the list getting summoned, follows the same order as the list of `.summon_monsters`.",
    },
    ".summon_ranks": {
      type: "number",
      description: "The ranks in which the monsters will get summoned.",
    },
    ".summon_limits": {
      type: "number",
      description: "The maximum number of monsters that will get summoned.",
    },
    ".summon_count": {
      type: "number",
      description: "The number of monsters that will get summoned.",
    },
    ".summon_erase_data_on_roll": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Seems to not exist/be used?",
    },
    ".summon_can_spawn_loot": {
      type: "boolean",
      description: "Whether or not the summoned monsters can drop loot on death.",
    },
    ".summon_rank_is_previous_monster_class": {
      type: "boolean",
      description:
        "Whether or not the summoned monster will take place of dead monsters.",
    },
    ".summon_does_roll_initiatives": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Whether or not the summoned monsters roll initiative on spawn.",
      addInfo: "A bit buggy."
    },
    ".crit_doesnt_apply_to_roll": {
      type: "boolean",
      description: "Whether or not the effect's chance will be affected by CRITs.",
    },
    ".virtue_blockable_chance": {
      type: "number",
      description: "The chance for a virtued hero to resist the effect.",
    },
    ".affliction_blockable_chance": {
      type: "number",
      description: "The chance for an afflicted hero to resist the effect.",
    },
    ".set_mode": {
      type: "string",
      description: "Set the target's mode to the one with the given ID.",
    },
    ".can_apply_on_death": {
      type: "boolean",
      description: "Whether or not the effect will trigger when the target dies.",
      addInfo: "Default Value: False"
    },
    ".apply_once": {
      type: "boolean",
      description: "Whether or not the effect will trigger for each targeted actor.",
      addInfo: "Default Value: False"
    },
    ".apply_with_result": {
      type: "boolean",
      description: "Whether or not the effect triggers before DMG calculation.",
      addInfo: "Default Value: False"
    },
    ".skill_instant": {
      type: "boolean",
      description: "Whether or not the effect triggers when the skill is selected.",
    },
    ".buff_is_clear_debuff_valid": {
      type: "boolean",
      description: "Whether or not the (de)buffs applied by the effect can be cured.",
    },
    ".refreshes_skill_uses": {
      type: "boolean",
      description: "Refreshes limited skill number uses.",
    },
    ".rank_target": {
      type: "number",
      description: "Rank Targeting mechanic used by Prophet and Vvulf. Applies Rank Targeting to the specified rank if theyre targeted.",
      addInfo: "Only usable by Monster, and only works on Hero ranks."
    },
    ".clear_rank_target": {
      type: "string",
      description: "Clears Rank Targeting from the specified ranks if its the rank the targeted Hero is in."
    },
    ".performer_rank_target": {
      type: "boolean",
      allowed_values: [1, 0],
      description: "Whether or not the performer will apply Rank Targeting to the targeted Hero's rank.",
      addInfo: "Only usable by Monster, and only works on Hero ranks."
    },
    ".initiative_change": {
      type: "number",
      description: "The change in initiative caused by the effect.",
    },
    ".source_heal_type": {
      type: "string",
      description: "The source of healing applied by the effect. Affects the CRIT chance of the heal effect.",
      allowed_values: Sources["heal"].list,
      sourceList: "heal",
    },
    ".actor_dot": {
      type: "string",
      description: "The Actor Dot applied by the effect.",
      addInfo: "ADOTs are required to have animation files, otherwise they will crash the game. If the ADOT is applied by a skill, the animation needs to be attached to whoever applies it. In most other cases, the animation needs to be added to the intended target, if that is heroes, they need to be applied to every single hero for it to work, individually.",
      commonName: "ADOT(s)"
    },
    ".health_damage": {
      type: "number",
      description: "Effect based DMG amount applied to the target.",
    },
    ".bark": {
      type: "string",
      description: "Triggers the specified bark on the target hero.",
      addInfo: "Can trigger custom barks, thus creating custom psuedo bark triggers"
    },
    ".set_monster_class_id": {
      type: "string",
      description: "Changes the target monster into another monster with the specified ID.",
    },
    ".set_monster_class_ids": {
      type: "string_list",
      description: "Changes the target monster to one of the monster from the list of specified IDs.",
    },
    ".set_monster_class_chances": {
      type: "number",
      description: "The chance of each ID being selected from `.set_monster_class_ids`.",
    },
    ".set_monster_class_reset_hp": {
      type: "boolean",
      description: "Whether or not changing IDs will reset the monster's HP, essentially healing to the new monster's full HP.",
    },
    ".set_monster_class_reset_buffs": {
      type: "boolean",
      description: "Whether or not the monster clears all buffs when changing ID.",
    },
    ".set_monster_class_carry_over_hp_min_percent": {
      type: "number",
      description: "Minimum max health percentage to carry over from previous monster class.",
    },
    ".set_monster_class_clear_initative": {
      type: "boolean",
      description: "Whether or not the monster's loses initiative when changing ID.",
    },
    ".set_monster_class_clear_monster_brain_cooldowns": {
      type: "boolean",
      description: "Whether or not the monster clears AI cooldowns on when changing ID.",
    },
    ".set_monster_class_reset_scale": {
      type: "boolean",
      description: "No discernable effect???",
    },
    ".health_damage_blocks": {
      type: "number",
      description: "Block tokens used from the Shieldbreaker DLC.",
    },
    ".dotSource": {
      type: "string",
      description: "Specifies the source of DOTs applied by the the effect. Usable sources are the same as for `.buff_source_type`",
      sourceList: "buff"
    },
    ".buff_source_type": {
      type: "string",
      description: "Specifies the buff source used by the effect.",
      sourceList: "buff"
    },
    ".use_item_id": {
      type: "string",
      description: "Calls the specified item's effect to be triggered by this effect on top of whatever else it already does.",
    },
    ".use_item_type": {
      type: "string",
      description: "The item type of the item called with `.use_item_id`.",
    },
    ".skips_endless_wave_curio": {
      type: "boolean",
      description: "It starts the endless mode and triggers the `Onward` button's popup.",
    },
    ".spawn_target_actor_base_class_id": {
      type: "string",
      description: "When a monster spawns, all actors with the given ID will be the effect's selected target.",
    },
    ".individual_target_actor_rolls": {
      type: "boolean",
      description: "Whether or not an effect rolls chance for each individual target actor (ex.: 4 targets rolling bleed resistance individually).",
      addInfo: "Default value: false"
    },
    ".damage_type": {
      type: "string",
      description: "The type of the effect based DMG applied by the effect.",
    },
    ".damage_source_type": {
      type: "string",
      description: "The source of the effect based DMG applied by the effect.",
    },
    ".damage_source_data": {
      type: "string",
      description: "Additional data for `.damage_source_type`.",
      addInfo: ""
    },
  },
  combat_skill: {
    ".id": {
      type: "string",
      description: "The Skill's ID.",
    },
    ".dmg": {
      type: "string",
      description: "The Skill's DMG Modifier.",
    },
    ".atk": {
      type: "number",
      description: "The Skill's Base Accuracy.",
    },
    ".move": {
      type: "range",
      description: "The direction the skill moves the performer in, and how many ranks.",
      addInfo: "Works different for `.type move`, instead of moving the hero upon skill use, it will be how much the hero can move in what direction."
    },
    ".crit": {
      type: "number",
      description: "The Skill's base CRIT chance.",
    },
    ".level": {
      type: "number",
      description: "Determines which level of the skill is being modified by the line.",
      addInfo: "If not present in a line, all levels of the skill will be modified by the line."
    },
    ".type": {
      type: "string",
      description: "Skill type",
      vanillaValuesTitle: "Vanilla Skill Types",
      vanillaValues: ["melee", "ranged", "move", "teleport", ""],
    },
    ".per_battle_limit": {
      type: "number",
      description: "The number of times the Skill can be used in a Battle.",
    },
    ".per_turn_limit": {
      type: "number",
      description: "The number of times the Skill can be used in a turn.", 
      addInfo: "Only affects Free Action. Free Action attacks disregard this parameter.",
    },
    ".is_continue_turn": {
      type: "boolean",
      description: "Whether or not the Skill is a Free Action. Does not end the performer's turn.",
      addInfo: "Highly unrecommended for Attack skills as it has many bugs.",
    },
    ".launch": {
      type: "string",
      description: "The Skill's launch ranks.",
    },
    ".target": {
      type: "string",
      description: "The Skill's target ranks.",
      canBeNull: true,
    },
    ".self_target_valid": {
      type: "boolean",
      description: "Whether or not the Skill can target the performer.",
    },
    ".is_crit_valid": {
      type: "boolean",
      description: "Whether or not the Skill can CRIT.",
    },
    ".effect": {
      type: "string_list",
      description: "The effects used by the Skill.",
      addInfo: "Effects trigger in the order they are written, but they still also respect the effect timing/trigger order.",
      displayEffectOrder: true,
    },
    ".valid_modes": {
      type: "string_list",
      description: "The modes the Skill is usable in.",
    },
    ".ignore_stealth": {
      type: "boolean",
      description: "Whether or not the Skill ignores Stealth.",
    },
    ".ignore_guard": {
      type: "boolean",
      description: "Whether or not the Skill ignores Guard.",
    },
    ".ignore_riposte": {
      type: "boolean",
      description: "Whether or not the Skill Ignores Riposte.",
    },
    ".ignore_protection": {
      type: "boolean",
      description: "Whether or not the Skill ignores PROT.",
    },
    ".can_miss": {
      type: "boolean",
      description: "Whether or not the Skill can miss at all.",
    },
    ".can_be_riposted": {
      type: "boolean",
      description: "Whether or not the Skill can be riposted.",
      addInfo: "Essentially the same as `.ignore_riposte true`, unsure if used."
    },
    ".required_performer_hp_range": {
      type: "range",
      description: "The HP Range in which the Skill is usable.",
    },
    ".rank_damage_modifiers": {
      type: "number_list",
      description: "The Skill's DMG modifier for against each specific rank.",
    },
    ".heal": {
      type: "range",
      description: "The Skill's Healing Range.",
    },
    ".can_crit_heal": {
      type: "boolean",
      description: "Whether or not the Skill can CRIT Heal.",
    },
    ".generation_guaranteed": {
      type: "boolean",
      description: "Whether or not the hero is guaranteed to start with the skill.",
      addInfo: "If there are multiple skills with this set to true, only the top 1 will be guaranteed"
    },
    ".is_stall_invalidating": {
      type: "boolean",
      description: "Whether or not the skill will counts as stalling when used.",
    },
    ".refresh_after_each_wave": {
      type: "boolean",
      description: "Whether or not the the skill's use number refreshes after each wave of a wave quest.",
    },
    ".damage_heal_base_class_ids": {
      type: "string_list",
      description: "The actors with the given IDs will be healing a certain percentage based on the DMG dealt.",
    },
    ".icon": {
      type: "string",
      description: "The name of the skill icon used by the skill.",
    },
    ".anim": {
      type: "string",
      description: "The name of the animation used by the skill.",
    },
    ".fx": {
      type: "string",
      description: "The name of the VFX used by the skill, targets the performer.",
    },
    ".targfx": {
      type: "string",
      description: "The name of the target VFX of the skill.",
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
    ".can_display_skill_name": {
      type: "boolean",
      description: "Whether the skill name can be displayed",
    },
    ".can_display_performer_selection_after_turn": {
      type: "boolean",
      description: "Whether performer selection can be displayed after turn",
    },
  },
  combat_move_skill: {
    ".id": {
      type: "string",
      description: "The Skill's ID",
    },
    ".dmg": {
      type: "string",
      description: "The Skill's DMG Modifier.",
    },
    ".atk": {
      type: "number",
      description: "The Skill's Base Accuracy.",
    },
    ".move": {
      type: "range",
      description: "The direction the skill moves the performer in, and how many ranks.",
    },
    ".crit": {
      type: "number",
      description: "The Skill's base CRIT chance.",
    },
    ".level": {
      type: "number",
      description: "Determines which level of the skill is being modified by the line.",
      addInfo: "If not present in a line, all levels of the skill will be modified by the line."
    },
    ".type": {
      type: "string",
      description: "Skill type",
      vanillaValuesTitle: "Vanilla Skill Types",
      vanillaValues: ["melee", "ranged", "move", "teleport", ""],
    },
    ".per_battle_limit": {
      type: "number",
      description: "The number of times the Skill can be used in a Battle.",
    },
    ".per_turn_limit": {
      type: "number",
      description: "The number of times the Skill can be used in a turn.", 
      addInfo: "Only affects Free Action. Free Action attacks disregard this parameter.",
    },
    ".is_continue_turn": {
      type: "boolean",
      description: "Whether or not the Skill is a Free Action. Does not end the performer's turn.",
      addInfo: "Highly unrecommended for Attack skills as .",
    },
    ".launch": {
      type: "string",
      description: "The Skill's launch ranks.",
    },
    ".target": {
      type: "string",
      description: "The Skill's target ranks.",
      canBeNull: true,
    },
    ".self_target_valid": {
      type: "boolean",
      description: "Whether or not the Skill can target the performer.",
    },
    ".is_crit_valid": {
      type: "boolean",
      description: "Whether or not the Skill can CRIT.",
    },
    ".effect": {
      type: "string_list",
      description: "The effects used by the Skill.",
      addInfo: "Effects trigger in the order they are written, but they still also respect the effect timing/trigger order.",
      displayEffectOrder: true,
    },
    ".valid_modes": {
      type: "string_list",
      description: "The modes the Skill is usable in.",
    },
    ".ignore_stealth": {
      type: "boolean",
      description: "Whether or not the Skill ignores Stealth.",
    },
    ".ignore_guard": {
      type: "boolean",
      description: "Whether or not the Skill ignores Guard.",
    },
    ".ignore_riposte": {
      type: "boolean",
      description: "Whether or not the Skill Ignores Riposte.",
    },
    ".ignore_protection": {
      type: "boolean",
      description: "Whether or not the Skill ignores PROT.",
    },
    ".can_miss": {
      type: "boolean",
      description: "Whether or not the Skill can miss.",
    },
    ".can_be_riposted": {
      type: "boolean",
      description: "Whether or not the Skill can be riposted.",
    },
    ".required_performer_hp_range": {
      type: "range",
      description: "The HP Range in which the Skill is usable.",
    },
    ".rank_damage_modifiers": {
      type: "number_list",
      description: "The Skill's DMG modifier for against each specific rank.",
    },
    ".heal": {
      type: "range",
      description: "The Skill's Healing Range.",
    },
    ".can_crit_heal": {
      type: "boolean",
      description: "Whether or not the Skill can CRIT Heal.",
    },
    ".generation_guaranteed": {
      type: "boolean",
      description: "Whether generation is guaranteed.",
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
    ".can_display_skill_name": {
      type: "boolean",
      description: "Whether the skill name can be displayed",
    },
    ".can_display_performer_selection_after_turn": {
      type: "boolean",
      description: "Whether performer selection can be displayed after turn",
    },
  },
  skill: {
    ".dmg": {
      type: "range",
      description: "The skill's DMG range.",
      canBeNull: true
    },
    ".starting_cooldown": {
      type: "number",
      description: "Starting cooldown value",
    },
    ".extra_targets_chance": {
      type: "number",
      description: "Chance for extra targets",
    },
    ".extra_targets_count": {
      type: "number",
      description: "Count of extra targets",
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
    ".has_crit_vo": {
      type: "boolean",
      description: "Whether critical voiceover is present",
    },
    ".can_display_skill_name": {
      type: "boolean",
      description: "Whether the skill name can be displayed",
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
      description: "The actor's Stun Resistance.",
    },
    ".move": {
      type: "number",
      description: "The actor's Move Resistance.",
    },
    ".poison": {
      type: "number",
      description: "The actor's Blight Resistance.",
    },
    ".bleed": {
      type: "number",
      description: "The actor's Bleed Resistance.",
    },
    ".disease": {
      type: "number",
      description: "The actor's Disease Resistance.",
    },
    ".debuff": {
      type: "number",
      description: "The actor's Debuff Resistance.",
    },
    ".death_blow": {
      type: "number",
      description: "The actor's Death Blow Resistance.",
    },
    ".trap": {
      type: "number",
      description: "The actor's Trap Resistance.",
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
      description: "The list of effects that are triggered on CRIT.",
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