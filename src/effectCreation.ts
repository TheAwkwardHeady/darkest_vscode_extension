import * as vscode from 'vscode';

export function checkIfEffectFile(): boolean {
  const editor = vscode.window.activeTextEditor;
  return editor ? editor.document.uri.fsPath.includes("\\effects\\") : false;
}

const effects: {[key:string]:string} = {
    stun: 'effect: .name "example_stun_1" .target "target" .chance 100% .stun 1 .on_hit true .on_miss false',
    unstun: 'effect: .name "example_unstun_1" .target "target" .chance 100% .unstun 1 .on_hit true .on_miss false',
    tag: 'effect: .name "example_mark_1" .target "target" .chance 100% .tag 1 .duration 3 .on_hit true .on_miss false',
    untag: 'effect: .name "example_mark_1" .target "target" .chance 100% .untag 1 .duration 3 .on_hit true .on_miss false',
    bleed: 'effect: .name "example_bleed_1" .target "target" .chance 100% .dotBleed 3 .duration 3 .on_hit true .on_miss false',
    blight: 'effect: .name "example_blight_1" .target "target" .chance 100% .dotPoison 3 .duration 3 .on_hit true .on_miss false',
    cureBleed: 'effect: .name "example_cure" .target "target" .chance 100% .cure_bleed 1 .on_hit true .on_miss false',
    cureBlight: 'effect: .name "example_cure" .target "target" .chance 100% .cure_poison 1 .on_hit true .on_miss false',
    cureDOTS: 'effect: .name "example_cure" .target "target" .chance 100% .cure 1 .on_hit true .on_miss false',
    heal: 'effect: .name "example_heal_1" .target "target" .chance 100% .heal 4 .on_hit true .on_miss false',
    regen: 'effect: .name "example_regen_1" .target "target" .chance 100% .dotHpHeal 2 .duration 3 .on_hit true .on_miss false',
    stress: 'effect: .name "example_stress_1" .target "target" .chance 100% .stress 10 .on_hit true .on_miss false',
    destress: 'effect: .name "example_destress_1" .target "target" .chance 100% .healstress 10 .on_hit true .on_miss false',
    horror: 'effect: .name "example_horror_1" .target "target" .chance 100% .dotStress 3 .duration 3 .on_hit true .on_miss false',
    cureHorror: 'effect: .name "example_cure_horror" .target "target" .chance 100% .clearDotStress 1 .on_hit true .on_miss false',
    guard: 'effect: .name "example_guard" .target "target" .guard 1 .on_hit true .on_miss false',
    clearGuard: 'effect: .name "example_clear_guard" .target "target" .chance 100% .clearguarding 1 .clearguarded 1 .has_description false .on_hit true .on_miss false',
    buff1: 'effect: .name "example_buff_1" .target "target" .chance 100% .buff_ids "example_buff_ID" .duration 3 .on_hit true .on_miss false',
    buff2: 'effect: .name "example_buff_1" .target "target" .chance 100% .combat_stat_buff 1 .damage_low_multiply 0.15 .damage_high_multiply 0.15 .duration 3 .on_hit true .on_miss false',
    cureDebuff: 'effect: .name "example_cure_debuff" .target "target" .chance 100% .clear_debuff 1 .on_hit true .on_miss false',
    adot: 'effect: .name "example_ADOT_1" .target "target" .chance 100% .stun "actor_dot" .on_hit true .on_miss false',
    setMode: 'effect: .name "example_mode_swap" .target "performer" .chance 100% .set_mode example_mode_ID .on_hit true .on_miss false',
    riposte: 'effect: .name "example_riposte_1" .target "performer" .chance 100% .riposte 1 .riposte_on_miss_chance_add 1 .riposte_on_hit_chance_add 1 .riposte_effect "example_riposte_effect_1" .on_hit true .on_miss false',
    clearRiposte: 'effect: .name "example_clear_riposte" .target "target" .chance 100% .stun "example_ADOT_ID" .on_hit true .on_miss false',
    push:'effect: .name "example_push_1" .target "target" .chance 100% .push 1 .on_hit true .on_miss false',
    pull:'effect: .name "example_pull_1" .target "target" .chance 100% .pull 1 .on_hit true .on_miss false',
    shuffleTarget:'effect: .name "example_shuffle_1" .target "target" .chance 100% .shuffletarget .on_hit true .on_miss false',
    shuffleParty:'effect: .name "example_party_shuffle_1" .target "target" .chance 100% .shuffleparty .on_hit true .on_miss false',
    shuffleDOT:'effect: .name "example_stun_1" .target "target" .chance 100% .dotShuffle 1 .duration 3 .on_hit true .on_miss false',
};

const effectParams: {[key:string]:string} = {
    instant: '.skill_instant true',
    hasDesc: '.has_description false',
    queue: '.queue true',
    applyOnce: '.apply_once true',
    applyOnDeath: '.can_apply_on_death true',
    AWR:'.apply_with_result true',
};

export function addEffect(editor: vscode.TextEditor, effectID: string) {
    const position = editor.selection.active;
    editor.edit(editBuilder => {
        editBuilder.insert(position, `${effects[effectID]}\n`);
    }).then(() => {
        const newPosition = position.translate(1, 0);
        editor.selection = new vscode.Selection(newPosition, newPosition);
        editor.revealRange(new vscode.Range(newPosition, newPosition));
    });
}

export function addEffectParameter(editor: vscode.TextEditor, paramID: string) {
    const position = editor.selection.active;
    editor.edit(editBuilder => {
        editBuilder.insert(position, ` ${effectParams[paramID]}`);
    }).then(() => {
        const newPosition = position.translate(1, 0);
        editor.selection = new vscode.Selection(newPosition, newPosition);
        editor.revealRange(new vscode.Range(newPosition, newPosition));
    });
}