import * as vscode from 'vscode';

export function checkIfLocFile(): boolean {
  const editor = vscode.window.activeTextEditor;
  return editor ? editor.document.uri.fsPath.includes("\\localization\\") : false;
}

const zwspDec = vscode.window.createTextEditorDecorationType({
  after: {
    contentText: 'ZWSP',
    fontWeight: 'bold',
    fontStyle: 'italic',
    margin: '0 2px'
  }
});

export const updateZWSP = () => {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.languageId !== 'xml') {return;}
  const text = editor.document.getText();
  const matches: vscode.DecorationOptions[] = [];
  for (let line = 0; line < editor.document.lineCount; line++) {
    const lineText = editor.document.lineAt(line).text;
    let match;
    const regex = /(\u200B+)/g;
    while ((match = regex.exec(lineText)) !== null) {
      const zwspSeq = match[0];
      const start = new vscode.Position(line, match.index);
      const end = new vscode.Position(line, match.index + 1);
      matches.push({
        range: new vscode.Range(start, end),
        renderOptions: {
          after: {
            contentText: ` ZWSP: ${zwspSeq.length} `
          }
        }
      });
    }
  }
  editor.setDecorations(zwspDec, matches);
};

export function createZWSP(editor: vscode.TextEditor, ZWSPNum: number){
  let ZWSPs = ``;

  for(let i = 1; i <= ZWSPNum; i++){
    ZWSPs += `\u200b`;
  }

  const position = editor.selection.active;
  editor.edit(editBuilder => {
      editBuilder.insert(position, `${ZWSPs}`);
  }).then(() => {
      const newPosition = position.translate(1, 0);
      editor.selection = new vscode.Selection(newPosition, newPosition);
      editor.revealRange(new vscode.Range(newPosition, newPosition));
  });
}

export function createTooltipString(editor:vscode.TextEditor, tooltipID: string){
  let tooltip = `<entry id="buff_stat_tooltip_upgrade_discount_`+tooltipID+`"><![CDATA[]]></entry>`;

  const position = editor.selection.active;
  editor.edit(editBuilder => {
      editBuilder.insert(position, `${tooltip}`);
  }).then(() => {
      const newPosition = position.translate(1, 0);
      editor.selection = new vscode.Selection(newPosition, newPosition);
      editor.revealRange(new vscode.Range(newPosition, newPosition));
  });
}