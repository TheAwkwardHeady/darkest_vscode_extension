import * as vscode from "vscode";
import { GAME_MECHANICS_SCHEMA } from "./game-mechanics-schema";

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
}
