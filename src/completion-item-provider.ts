import * as vscode from "vscode";
import { GAME_MECHANICS_SCHEMA } from "./game-mechanics-schema";
import { getIndexedEffectIds } from "./effectReferenceFeatures";

export class DarkestCompletionItemProvider
  implements vscode.CompletionItemProvider
{
  public async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ) {
    const completionItems: vscode.CompletionItem[] = [];
    const line = document.lineAt(position.line);
    const lineText = line.text.trim();
    const lineTextBeforeCursor = lineText.slice(0, position.character);
    const effectValueCompletion = this.getEffectValueCompletions(line.text, position.line, position.character);
    if (effectValueCompletion) return effectValueCompletion;
    const gameMechanicsSchema: typeof GAME_MECHANICS_SCHEMA =
      await vscode.commands.executeCommand("darkest.getGameMechanicsSchema");
    const typingKeyword = lineTextBeforeCursor.match(/^\w+$/)?.[0];

    if (typingKeyword) {
      Object.keys(gameMechanicsSchema).forEach((keyword) => {
        if (keyword.startsWith(typingKeyword)) {
          const completionItem = new vscode.CompletionItem(
            `${keyword}: `,
            vscode.CompletionItemKind.Keyword
          );
          completionItems.push(completionItem);
        }
      });
      return new vscode.CompletionList(completionItems, true);
    }

    const keyword = lineTextBeforeCursor.match(/^\w+(?=:)/)?.[0];
    const typingParam = lineTextBeforeCursor.match(/\.[a-zA-Z0-9_]*$/)?.[0];
    if (typingParam && keyword && gameMechanicsSchema[keyword]) {
      Object.keys(gameMechanicsSchema[keyword]).forEach((param) => {
        if (param.startsWith(typingParam)) {
          const completionItem = new vscode.CompletionItem(
            `${param.slice(1)} `,
            vscode.CompletionItemKind.Field
          );
          completionItem.detail =
            gameMechanicsSchema[keyword][param].description;
          completionItems.push(completionItem);
        }
      });
      return new vscode.CompletionList(completionItems, true);
    }

    const param = lineTextBeforeCursor.match(
      /\.[a-zA-Z0-9_]+(?=((\s[^\s.][^\s]*)*)$)/
    )?.[0];
    const typingValue = lineTextBeforeCursor.match(
      /(?<=\.[a-zA-Z0-9_]+)(\s[^\s.][^\s]*)*$/
    )?.[0];

    if (
      typingValue?.trim() &&
      keyword &&
      param &&
      gameMechanicsSchema[keyword][param]
    ) {
      gameMechanicsSchema[keyword][param].allowed_values?.forEach((value) => {
        const stringValue = value.toString();
        if (stringValue.startsWith(typingValue.trim().replace(/['"]/g, ""))) {
          const completionItem = new vscode.CompletionItem(
            stringValue,
            vscode.CompletionItemKind.Value
          );

          completionItems.push(completionItem);
        }
      });

      return new vscode.CompletionList(completionItems, true);
    }
  }

  private getEffectValueCompletions(line: string, lineNumber: number, cursor: number): vscode.CompletionList | undefined {
    const prefixText = line.slice(0, cursor);
    const parameterPattern = /\.(effects?)\s+/g;
    let match: RegExpExecArray | null;
    let current: RegExpExecArray | undefined;
    while ((match = parameterPattern.exec(prefixText)) !== null) current = match;
    if (!current) return undefined;

    const currentValue = prefixText.slice(current.index + current[0].length);
    // Only offer IDs while the cursor is inside an effect value, including an
    // open quoted value. This also supports the repeated values used by `.effect`.
    const tokenMatch = /(?:^|\s)(?:"([^"]*)?|([^\s"]+))$/.exec(currentValue);
    if (!tokenMatch) return undefined;
    const prefix = tokenMatch[1] ?? tokenMatch[2] ?? "";
    const prefixStart = cursor - prefix.length;
    const items = getIndexedEffectIds()
      .filter(id => id.toLowerCase().startsWith(prefix.toLowerCase()))
      .map(id => {
        const item = new vscode.CompletionItem(id, vscode.CompletionItemKind.Reference);
        item.detail = "Effect ID from an effects file in this workspace";
        item.range = new vscode.Range(new vscode.Position(lineNumber, prefixStart), new vscode.Position(lineNumber, cursor));
        return item;
      });
    return new vscode.CompletionList(items, true);
  }
}
