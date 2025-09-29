import * as vscode from 'vscode';

export function checkIfBuffFile(): boolean {
  const editor = vscode.window.activeTextEditor;
  return editor ? editor.document.uri.fsPath.includes("\\shared\\buffs\\") : false;
}

export function createTooltipBuff(editor:vscode.TextEditor, tooltipID: string){
    let buff = `
        {
            "id": "`+tooltipID+`",
            "stat_type": "upgrade_discount",
            "stat_sub_type": "`+tooltipID+`",
            "amount": 0,
            "remove_if_not_active": false,
            "rule_type": "always",
            "is_false_rule": false,
            "rule_data": {
                "float": 0,
                "string": ""
            }
        },`;

    const position = editor.selection.active;
    editor.edit(editBuilder => {
        editBuilder.insert(position, `${buff}`);
    }).then(() => {
        const newPosition = position.translate(1, 0);
        editor.selection = new vscode.Selection(newPosition, newPosition);
        editor.revealRange(new vscode.Range(newPosition, newPosition));
    });
}

export function createBuff(editor:vscode.TextEditor, tooltipID: string, type: string, sub_type: string){
    let buff = `
        {
            "id": "`+tooltipID+`",
            "stat_type": "`+type+`",
            "stat_sub_type": "`+sub_type+`",
            "amount": 0,
            "remove_if_not_active": false,
            "rule_type": "always",
            "is_false_rule": false,
            "rule_data": {
                "float": 0,
                "string": ""
            }
        },`;

    const position = editor.selection.active;
    editor.edit(editBuilder => {
        editBuilder.insert(position, `${buff}`);
    }).then(() => {
        const newPosition = position.translate(1, 0);
        editor.selection = new vscode.Selection(newPosition, newPosition);
        editor.revealRange(new vscode.Range(newPosition, newPosition));
    });
}