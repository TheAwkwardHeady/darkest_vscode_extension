import * as vscode from "vscode";

type Suggestion = { value: string; detail: string };
const makeSuggestions = (values: string[], detail: string): Suggestion[] =>
  [...new Set(values)].map(value => ({ value, detail }));

const combatAddSubtypes = [
  "attack_rating", "crit_chance", "defense_rating", "protection_rating", "speed_rating",
  "riposte_on_hit_chance", "riposte_on_miss_chance", "max_hp", "damage_low", "damage_high"
];
const combatMultiplySubtypes = [
  "max_hp", "damage_low", "damage_high", "attack_rating", "crit_chance", "defense_rating",
  "protection_rating", "speed_rating", "riposte_on_hit_chance", "riposte_on_miss_chance"
];

export const allStatTypes = [
  "hp_heal_amount", "hp_heal_percent", "hp_heal_received_percent", "combat_stat_multiply", "combat_stat_add",
  "resistance", "poison_chance", "bleed_chance", "stress_dmg_percent", "stress_dmg_received_percent",
  "stress_heal_percent", "stress_heal_received_percent", "party_surprise_chance", "monsters_surprise_chance",
  "ambush_chance", "scouting_chance", "starving_damage_percent", "upgrade_discount", "damage_received_percent",
  "debuff_chance", "resolve_check_percent", "stun_chance", "move_chance", "remove_negative_quirk_chance",
  "food_consumption_percent", "resolve_xp_bonus_percent", "activity_side_effect_chance", "vampire_evolution_duration",
  "quirk_evolution_death_immune", "disable_combat_skill_attribute", "guard_blocked", "tag_blocked", "ignore_protection",
  "ignore_stealth", "crit_received_chance", "riposte", "guarded", "status", "vampire", "torch_increase_percent",
  "torch_decrease_percent", "torchlight_burn_percent", "stress_on_miss", "stress_from_idle_in_town", "shard_reward_percent",
  "shard_consume_percent", "damage_reflect_percent", "hp_dot_bleed_duration_received_percent", "hp_dot_bleed_duration_percent",
  "hp_dot_bleed_amount_received_percent", "hp_dot_bleed_amount_percent", "hp_dot_heal", "hp_dot_poison_duration_received_percent",
  "hp_dot_poison_duration_percent", "hp_dot_poison_amount_received_percent", "hp_dot_poison_amount_percent",
  "stress_dot_duration_received_percent", "stress_dot_duration_percent", "stress_dot_amount_received_percent", "stress_dot_amount_percent",
  "hp_heal_dot_duration_received_percent", "hp_heal_dot_duration_percent", "hp_heal_dot_amount_received_percent", "hp_heal_dot_amount_percent",
  "shuffle_dot_duration_received_percent", "shuffle_dot_duration_percent", "guard_duration_received_percent", "guard_duration_percent",
  "cure_bleed_received_chance", "cure_poison_received_chance", "cure_bleed_chance", "cure_poison_chance",
  "random_target_friendly_chance", "random_target_attack_chance", "transfer_debuff_from_attacker_chance", "transfer_buff_from_attacker_chance",
  "quirk_tag_evolution_duration", "deathblow_chance", "heartattack_stress_heal_percent", "ignore_guard", "buff_duration_percent",
  "riposte_duration_percent", "hp_dot_burn", "hp_dot_burn_decay_percent", "hp_dot_burn_amount_percent",
  "hp_dot_burn_amount_received_percent", "wildfire_apply_adjacent_targets", "cure_burn_chance", "cure_burn_received_chance"
];

export const statSubtypesByType: Record<string, Suggestion[]> = {
  combat_stat_add: makeSuggestions(combatAddSubtypes, "Valid combat_stat_add sub-type. Other values are validation errors."),
  combat_stat_multiply: makeSuggestions(combatMultiplySubtypes, "Valid combat_stat_multiply sub-type. Other values are validation errors."),
  resistance: makeSuggestions(["stun", "move", "poison", "bleed", "disease", "debuff", "death_blow", "trap"], "Resistance type from Buff values.txt."),
  upgrade_discount: makeSuggestions(["armour", "weapon", "combat_skill", "camping_skill"], "Upgrade category from Buff values.txt. The source notes custom values can be used for custom tooltips."),
  activity_side_effect_chance: makeSuggestions(["add_currency", "remove_currency", "add_trinket", "remove_trinket", "activity_lock", "apply_buff", "go_missing"], "Activity side effect from Buff values.txt."),
  disable_combat_skill_attribute: makeSuggestions(["heal", "buff", "debuff", "bleed", "poison", "stun", "tag", "stress", "move", "disease", "guard", "daze"], "Combat skill attribute from Buff values.txt."),
  riposte: makeSuggestions(["effect ID", "tag", "stealth", "hp_dot_bleed", "hp_dot_poison", "hp_dot_heal", "stress_dot", "shuffle_dot", "guarded", "status", "vampire"], "Riposte subtype from Buff values.txt."),
  quirk_tag_evolution_duration: makeSuggestions(["Quirk Tag"], "The source notes this can be used for custom tooltips.")
};

export const ruleTypes: Suggestion[] = [
  ["always", "Always active"], ["skill", "Skill name ID in rule_data.string"], ["riposte", "Riposte condition"],
  ["rangedonly", "Ranged attacks only"], ["meleeonly", "Melee attacks only"], ["actorStatus", "Actor status condition"],
  ["monsterType", "Monster type condition"], ["monsterSize", "Monster size condition; rule_data.float supplies the value"],
  ["firstroundonly", "First round only"], ["in_camp", "In camp"], ["in_dungeon", "Dungeon ID condition"],
  ["in_activity", "Activity condition"], ["in_room", "In a room"], ["in_corridor", "In a corridor"],
  ["at_deaths_door", "Actor is at Death's Door"], ["in_rank", "Rank condition; ranks 0–3"], ["hpbelow", "HP below threshold"],
  ["hpabove", "HP above threshold"], ["lightbelow", "Light below threshold"], ["lightabove", "Light above threshold"],
  ["stress_below", "Stress below threshold"], ["stress_above", "Stress above threshold"], ["virtued", "Actor is virtued"],
  ["afflicted", "Actor is afflicted"], ["monster_type_count_min", "Minimum count of a monster type"], ["is_vampire", "Actor is a vampire"],
  ["target_is_vampire", "Target is a vampire"], ["has_quirk", "Has the specified quirk ID"], ["walking_backwards", "Walking backwards"],
  ["actor_base_class", "Actor base class"], ["in_mode", "Mode ID condition"], ["is_guarded", "Actor is guarded"],
  ["target_is_guarded", "Target is guarded"], ["is_guarding", "Actor is guarding"], ["target_is_guarding", "Target is guarding"],
  ["is_stealthed", "Actor is stealthed"], ["target_is_stealthed", "Target is stealthed"], ["has_item_id", "Has item ID"],
  ["has_item_type", "Has item type"], ["is_actor_status", "Performer status condition"], ["no_trinkets", "No trinkets"],
  ["attacking_monster_type", "Attacking monster type"], ["target_hpabove", "Target HP above threshold"], ["target_hpbelow", "Target HP below threshold"],
  ["activated_last", "Activated last"], ["activated_first", "Activated first"], ["ondeathsdoorenter", "On entering Death's Door"],
  ["torch_setting", "Torch setting ID"], ["target_in_rank", "Target is in rank"], ["is_target_corpse", "Target is a normal size-1 corpse"],
  ["any_is_burning", "Any unit is burning"], ["negative_quirk_above", "Negative quirk count threshold"],
  ["quest_uses_remaining_above", "Quest uses remaining threshold"], ["has_buff", "Has buff; source notes Riposte-related use"],
  ["target_is_burning", "Target is burning; source says this needs testing"]
].map(([value, detail]) => ({ value, detail }));

export const durationTypes = makeSuggestions([
  "round", "combat_end", "quest_end", "quest_complete", "quest_not_complete", "activity_end", "idle_start_town_visit",
  "till_removed", "none", "before_turn", "after_turn", "after_round", "status"
], "Duration type listed in Buff values.txt.");

export class BuffSchemaCompletionProvider implements vscode.CompletionItemProvider {
  provideCompletionItems(document: vscode.TextDocument, position: vscode.Position): vscode.CompletionItem[] | undefined {
    if (!/\.buffs\.json$/i.test(document.fileName)) return undefined;
    const lineBeforeCursor = document.lineAt(position.line).text.slice(0, position.character);
    const match = /"(stat_type|stat_sub_type|rule_type|duration_type)"\s*:\s*"([^"]*)$/.exec(lineBeforeCursor);
    if (!match) return undefined;

    const key = match[1];
    const prefix = match[2];
    let available: Suggestion[] = [];
    if (key === "stat_type") {
      available = makeSuggestions(allStatTypes, "Known stat_type from Buff values.txt.");
    } else if (key === "stat_sub_type") {
      // The subtype belongs to the containing buff object. Read stat_type from
      // the current object before the cursor so completion follows the selected stat.
      const textBeforeCursor = document.getText(new vscode.Range(new vscode.Position(0, 0), position));
      const objectStart = textBeforeCursor.lastIndexOf("{");
      const objectText = textBeforeCursor.slice(objectStart >= 0 ? objectStart : 0);
      const typeMatch = /"stat_type"\s*:\s*"([^"]+)"/.exec(objectText);
      const statType = typeMatch?.[1];
      available = statType ? (statSubtypesByType[statType] ?? []) : [];
    } else if (key === "rule_type") {
      available = ruleTypes;
    } else if (key === "duration_type") {
      available = durationTypes;
    }

    return available
      .filter(item => item.value.toLowerCase().startsWith(prefix.toLowerCase()))
      .map(item => {
        const completion = new vscode.CompletionItem(item.value, vscode.CompletionItemKind.Value);
        completion.detail = item.detail;
        completion.insertText = item.value;
        completion.range = new vscode.Range(position.translate(0, -prefix.length), position);
        return completion;
      });
  }
}
